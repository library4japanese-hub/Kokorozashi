import { GoogleGenAI, Type } from "@google/genai";
import { FlashcardRequest, FlashcardResponse } from "../types";
import n5Data from '../data/jlpt_n5.json';
import n4Data from '../data/jlpt_n4.json';
import n3Data from '../data/jlpt_n3.json';
import n2Data from '../data/jlpt_n2.json';
import n1Data from '../data/jlpt_n1.json';

const jlptDataMap: Record<string, any[]> = {
  N5: n5Data,
  N4: n4Data,
  N3: n3Data,
  N2: n2Data,
  N1: n1Data,
};

const apiKey = process.env.GEMINI_API_KEY || '';
const hasValidKey = apiKey && apiKey !== 'undefined' && apiKey.length > 10;
const ai = new GoogleGenAI({ apiKey: hasValidKey ? apiKey : 'NO_KEY' });

const STYLE_POOL = {
  themes: ["futuristic Tokyo", "anime classroom", "dreamy sky", "traditional Japanese", "manga comic panel", "kawaii style", "vaporwave"],
  colors: ["pastel pink blue", "neon cyberpunk purple", "minimal monochrome", "warm earthy", "sakura theme", "ocean blue", "sunset gradient"],
  characters: ["anime student", "robot AI tutor", "samurai teacher", "kawaii mascot", "manga protagonist"],
  lighting: ["soft glow", "cinematic", "neon highlights", "dreamy haze"]
};

function getSeededRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & 0xFFFFFFFF;
  }
  return function() {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

function pick(pref: string[], pool: string[], random: () => number) {
  return (pref && pref.length > 0) ? pref[Math.floor(random() * pref.length)] : pool[Math.floor(random() * pool.length)];
}

async function generateFlashcardLocal(req: FlashcardRequest): Promise<FlashcardResponse> {
  const random = getSeededRandom(req.daily_seed + "local");
  const levelData = jlptDataMap[req.jlpt_level] || n5Data;
  const randomIndex = Math.floor(random() * levelData.length);
  const entry = levelData[randomIndex];

  return {
    id: `local_${req.jlpt_level}_${randomIndex}`,
    jlpt_level: req.jlpt_level,
    content: {
      kanji: entry.word,
      reading: entry.reading,
      meaning: entry.meaning,
      example_jp: `これは「${entry.word}」の使い方の例です。`,
      example_en: `This is an example sentence using "${entry.word}".`,
      difficulty: req.jlpt_level,
      part_of_speech: "Vocabulary"
    },
    style: {
      theme: "Curated Library",
      color_palette: "#4F46E5",
      character: "Standard Sensei",
      lighting: "Academic"
    },
    image_prompt: "Local card - no prompt",
    ui_metadata: {
      layout: "vertical card",
      font: "rounded sans-serif",
      background: "solid",
      animation: "fade"
    },
    audio: {
      tts_text: entry.reading,
      voice: "standard",
      speed: 1.0
    },
    imageUrl: `https://picsum.photos/seed/${entry.word}${req.jlpt_level}/800/1200`,
    isAiGenerated: false
  };
}

export async function generateFlashcard(req: FlashcardRequest): Promise<FlashcardResponse> {
  if (!hasValidKey) {
    return generateFlashcardLocal(req);
  }

  try {
    const random = getSeededRandom(req.daily_seed);
    const theme = pick(req.theme_preference, STYLE_POOL.themes, random);
    const color = pick(req.color_preference, STYLE_POOL.colors, random);
    const character = pick(req.character_preference, STYLE_POOL.characters, random);
    const lighting = STYLE_POOL.lighting[Math.floor(random() * STYLE_POOL.lighting.length)];

    const contentPrompt = `Generate a JLPT ${req.jlpt_level} ${req.content_mode}. Difficulty: ${req.difficulty_bias}. Return JSON with kanji, reading, meaning, example_jp, example_en, difficulty, part_of_speech.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: contentPrompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kanji: { type: Type.STRING },
            reading: { type: Type.STRING },
            meaning: { type: Type.STRING },
            example_jp: { type: Type.STRING },
            example_en: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            part_of_speech: { type: Type.STRING },
          },
          required: ["kanji", "reading", "meaning", "example_jp", "example_en", "difficulty"],
        },
      },
    });

    if (!response.text) {
      return generateFlashcardLocal(req);
    }

    const content = JSON.parse(response.text);
    const imagePrompt = `Design a visually stunning Japanese flashcard. Word: ${content.kanji}. Theme: ${theme}. Color: ${color}. Character: ${character}. Style: Anime/Manga, high resolution.`;

    const flashcard: FlashcardResponse = {
      id: `flashcard_${req.daily_seed}_${Math.floor(random() * 1000000)}`,
      jlpt_level: req.jlpt_level,
      content,
      style: { theme, color_palette: color, character, lighting },
      image_prompt: imagePrompt,
      ui_metadata: { layout: "vertical card", font: "rounded sans-serif", background: "gradient", animation: "subtle glow" },
      audio: { tts_text: content.reading, voice: "female_soft", speed: 0.9 },
      isAiGenerated: true
    };

    try {
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
        config: { imageConfig: { aspectRatio: "3:4" } },
      });
      
      const part = imageResponse.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (part?.inlineData?.data) {
        flashcard.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else {
        flashcard.imageUrl = `https://picsum.photos/seed/${content.kanji}/800/1200`;
      }
    } catch (err: any) { 
      flashcard.imageUrl = `https://picsum.photos/seed/${content.kanji}/800/1200`;
    }

    return flashcard;
  } catch (err: any) {
    console.error("AI Generation failed, falling back to local:", err);
    return generateFlashcardLocal(req);
  }
}
