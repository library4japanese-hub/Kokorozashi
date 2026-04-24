import { GoogleGenAI, Type } from "@google/genai";
import { supabase, searchKnowledge, logStudentPerformance, incrementLlmUsage, getLlmUsage, addKnowledgeItem, hybridSearch, updateSrsData } from '../lib/supabase.ts';
import type { GrammarExplanation } from "../types.ts";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey || apiKey === 'undefined') {
      console.warn("AI WARNING: GEMINI_API_KEY is missing. AI features will be limited.");
    }
    aiInstance = new GoogleGenAI({ apiKey: (apiKey === 'undefined' || !apiKey) ? '' : apiKey });
  }
  return aiInstance;
}

const MODELS = {
  FLASH: "gemini-3-flash-preview",
  PRO: "gemini-3.1-pro-preview",
  EMBEDDING: "gemini-embedding-2-preview"
};

const USAGE_LIMIT = 50; // Daily limit for free tier

async function checkUsage(userId?: string) {
  if (!userId) return true;
  const usage = await getLlmUsage(userId);
  if (usage >= USAGE_LIMIT) {
    throw new Error("DAILY_LIMIT_EXCEEDED");
  }
  return true;
}

export async function getAdvancedGrammarExplanation(pattern: string, level: string, context: string = 'daily', userId?: string): Promise<GrammarExplanation | null> {
  try {
    if (userId) await checkUsage(userId);
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.PRO, // Upgraded for deeper pedagogical insights
      contents: `Provide a comprehensive pedagogical breakdown for the Japanese grammar pattern: "${pattern}" at JLPT ${level} level.
      Context: ${context}
      
      Requirements:
      1. Core Grammar DNA: Explain the structure, function, and cognitive insight (the "why" behind the form).
      2. Form & Meaning: Breakdown the components, literal meaning, nuance, and social tone.
      3. Sentence Triad: Provide 3 sentences (A: Basic, B: Daily/Colloquial, C: Professional/Formal) with furigana, English, and detailed audio/pronunciation metadata including pitch patterns.
      4. Pragmatics: Detailed "When to use" vs "When not to use" and cultural notes.
      5. Common Errors: List frequent mistakes, corrections, and explanations.
      6. Assessment: Include a reordering challenge and a fill-in-the-blank question.
      7. Progression: Suggest the previous and next patterns in a typical learning path.
      8. Motivation: A brief encouraging note for the student.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meta: {
              type: Type.OBJECT,
              properties: {
                pattern: { type: Type.STRING },
                jlpt_level: { type: Type.STRING },
                difficulty_score: { type: Type.NUMBER },
                dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                skill_type: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["pattern", "jlpt_level", "difficulty_score", "dependencies", "skill_type"]
            },
            core_grammar_dna: {
              type: Type.OBJECT,
              properties: {
                structure: { type: Type.STRING },
                function: { type: Type.STRING },
                cognitive_insight: { type: Type.STRING }
              },
              required: ["structure", "function", "cognitive_insight"]
            },
            form_meaning: {
              type: Type.OBJECT,
              properties: {
                breakdown: { type: Type.ARRAY, items: { type: Type.STRING } },
                literal_meaning: { type: Type.STRING },
                nuance: { type: Type.STRING },
                social_tone: { type: Type.STRING, enum: ["polite", "casual", "formal"] }
              },
              required: ["breakdown", "literal_meaning", "nuance", "social_tone"]
            },
            sentence_triad: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING, enum: ["A", "B", "C"] },
                  japanese: { type: Type.STRING },
                  furigana: { type: Type.STRING },
                  english: { type: Type.STRING },
                  audio: {
                    type: Type.OBJECT,
                    properties: {
                      pitch_pattern: { type: Type.STRING, enum: ["heiban", "atamadaka", "nakadaka", "odaka"] },
                      wpm: { type: Type.NUMBER },
                      ssml: { type: Type.STRING },
                      pronunciation_notes: { type: Type.STRING }
                    },
                    required: ["pitch_pattern", "wpm", "ssml", "pronunciation_notes"]
                  }
                },
                required: ["level", "japanese", "furigana", "english", "audio"]
              }
            },
            pragmatics: {
              type: Type.OBJECT,
              properties: {
                when_to_use: { type: Type.STRING },
                when_not_to_use: { type: Type.STRING },
                cultural_note: { type: Type.STRING }
              },
              required: ["when_to_use", "when_not_to_use", "cultural_note"]
            },
            common_errors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  error: { type: Type.STRING },
                  correction: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["error", "correction", "explanation"]
              }
            },
            assessment: {
              type: Type.OBJECT,
              properties: {
                reordering: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING }
                  },
                  required: ["question", "answer"]
                },
                fill_blank: {
                  type: Type.OBJECT,
                  properties: {
                    sentence: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ["sentence", "answer"]
                },
                context_reaction: { type: Type.STRING }
              },
              required: ["reordering", "fill_blank", "context_reaction"]
            },
            progression: {
              type: Type.OBJECT,
              properties: {
                previous: { type: Type.STRING },
                next: { type: Type.STRING }
              },
              required: ["previous", "next"]
            },
            motivation: { type: Type.STRING }
          },
          required: ["meta", "core_grammar_dna", "form_meaning", "sentence_triad", "pragmatics", "common_errors", "assessment", "progression", "motivation"]
        },
        systemInstruction: "You are a World-Class Japanese Pedagogical Architect. Your goal is to provide the most comprehensive, accurate, and encouraging grammar breakdown possible, following the requested JSON schema exactly.",
      },
    });
    if (userId) await incrementLlmUsage();
    return JSON.parse(response.text);
  } catch (error: any) {
    if (error.message === "DAILY_LIMIT_EXCEEDED") throw error;
    console.error("Gemini Advanced Grammar Error:", error);
    return null;
  }
}

export async function generateMockTest(articleTitle: string, articleContent: string, userId?: string) {
  try {
    if (userId) await checkUsage(userId);
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: `Generate a 5-question "N2 Reading & Grammar" mock set based on the provided article.
      Article Title: ${articleTitle}
      Article Content: ${articleContent}
      
      Constraints:
      1. Create 4 multiple-choice options (A, B, C, D). One is correct. Two must be "common traps" (e.g., similar-looking Kanji or slightly wrong particle usage like に vs で). One should be clearly wrong.
      2. Sensei's Explanation: Explain why the distractors are wrong in the context of official JLPT grading criteria.
      3. Culture: If the article mentions a seasonal event (like Obon), add a "Culture Note" explaining its significance.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.OBJECT,
                    properties: {
                      A: { type: Type.STRING },
                      B: { type: Type.STRING },
                      C: { type: Type.STRING },
                      D: { type: Type.STRING },
                    },
                    required: ["A", "B", "C", "D"]
                  },
                  correctAnswer: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
                  explanation: { type: Type.STRING },
                  topic: { type: Type.STRING, description: "The specific grammar or vocabulary topic being tested (e.g., 'Passive Voice', 'Particle に')" },
                  cultureNote: { type: Type.STRING },
                },
                required: ["question", "options", "correctAnswer", "explanation", "topic"]
              }
            }
          },
          required: ["questions"]
        },
        systemInstruction: "You are a JLPT N2 exam creator. You specialize in creating tricky but fair reading and grammar questions that test deep understanding of Japanese nuances.",
      },
    });
    if (userId) await incrementLlmUsage();
    return JSON.parse(response.text);
  } catch (error: any) {
    if (error.message === "DAILY_LIMIT_EXCEEDED") throw error;
    console.error("Gemini Mock Test Error:", error);
    return null;
  }
}

export async function getJapaneseExplanation(word: string, reading: string, meaning: string, userId?: string) {
  try {
    if (userId) await checkUsage(userId);
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.PRO, // Upgraded for better linguistic nuance
      contents: `Explain the Japanese word "${word}" (${reading}), which means "${meaning}". 
      
      Pedagogical Requirements:
      1. Identify the "form-meaning pairing" (linguistic essence).
      2. Provide 3 example sentences:
         - Level A: Basic classroom usage (safe politeness).
         - Level B: Daily life colloquial usage (including contractions like ~てる).
         - Level C: Professional/Formal usage (including appropriate keigo).
      3. Sound & Auditory:
         - Provide Furigana-annotated Kanji.
         - Describe the pitch accent pattern (e.g., Heiban, Atamadaka).
      4. Pragmatic Note: Explain the TPO (Time, Place, Occasion).
      
      Format the output in Markdown.`,
      config: {
        systemInstruction: "You are a Senior Japanese Pedagogical Expert. Your explanations focus on Socio-Linguistic Pragmatics and building an 'L2 mind'.",
      },
    });
    if (userId) await incrementLlmUsage();
    return response.text;
  } catch (error: any) {
    if (error.message === "DAILY_LIMIT_EXCEEDED") return "You have reached your daily limit for AI explanations. Please try again tomorrow!";
    console.error("Gemini Error:", error);
    return "Sorry, I couldn't generate an explanation right now.";
  }
}

export async function explainNewsArticle(title: string, content: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: `Analyze this simplified Japanese news article:
      Title: ${title}
      Content: ${content}
      
      Please provide:
      1. A brief summary in English.
      2. A list of 5 key vocabulary words from the text with their readings and meanings.
      3. A simple grammar explanation for one interesting pattern found in the text.
      Format the output in Markdown.`,
      config: {
        systemInstruction: "You are a Japanese language teacher helping students understand news articles. Your tone is helpful and educational. Always provide translations for key terms.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini News Error:", error);
    return "Could not analyze the article at this time. Please try again in a moment.";
  }
}
export async function embedText(text: string) {
  if (!text.trim()) return null;
  try {
    const ai = getAI();
    const result = await ai.models.embedContent({
      model: MODELS.EMBEDDING,
      contents: [text],
    });
    const embedding = result.embeddings[0].values;
    return embedding;
  } catch (error) {
    console.error("Gemini Embedding Error:", error);
    return null;
  }
}

export async function findSimilarJLPTContext(userQuery: string) {
  const embedding = await embedText(userQuery);
  if (!embedding) return [];
  return await hybridSearch(userQuery, embedding, 0.5, 3);
}

export async function analyzeSentenceStructure(sentence: string) {
  if (!sentence.trim()) return null;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: [{ role: 'user', parts: [{ text: `Analyze the grammatical structure of this Japanese sentence: "${sentence}". 
      Return a JSON object representing a hierarchical tree structure of the grammar nodes.
      Each node MUST have: "text" (Japanese snippet), "role" (e.g., Subject, Object, Verb, Particle, Modifier), and optional "children" array for recursive depth.` }]}],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  role: { type: Type.STRING },
                  children: { type: Type.ARRAY, items: { type: Type.OBJECT } } // Simplified recursive reference
                },
                required: ["text", "role"]
              }
            }
          },
          required: ["nodes"]
        },
        systemInstruction: "You are a Japanese Syntactic Analyst. Visualize sentences as logically connected nodes representing functional grammar units.",
      }
    });

    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse sentence analysis:", e);
    // Return a dummy node so the UI doesn't crash
    return { nodes: [{ text: sentence, role: "Sentence" }] };
  }
}

export async function generatePersonalizedScenario(userId: string, targetLevel: string, weakTopic?: string | null) {
  // Use a fallback scenario generator in case AI fails
  const getFallbackScenario = () => {
    const focus = weakTopic || "Japanese greetings";
    const scenarios = [
      `[Auto-Sensei] Let's practice! Imagine you're in a quiet Japanese cafe in Kyoto. \nPrompt: How would you use "${focus}" while ordering your matcha from the barista? \n(Level: ${targetLevel})`,
      `[Auto-Sensei] Roleplay: You're lost at Shinjuku Station and need help! \nChallenge: Can you use "${focus}" to ask a station staff member for assistance? \n(Level: ${targetLevel})`,
      `[Auto-Sensei] Scenario: You're checking into a traditional Ryokan. \nTask: Greet the host and try to work "${focus}" into your conversation. \n(Level: ${targetLevel})`,
      `[Auto-Sensei] Daily Life: You're at a Konbini near your language school. \nObjective: Use "${focus}" naturally while interacting with the clerk. \n(Level: ${targetLevel})`
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  };

  try {
    let focusItem = weakTopic || "学校";
    let isIntensive = !!weakTopic;

    // Check if Supabase is actually configured before querying
    const isSupabaseReady = supabase.auth !== undefined; // Simple check

    if (!weakTopic && isSupabaseReady) {
      try {
        // 1. Get recent study logs to check for weaknesses
        const { data: recentLogs, error: logsError } = await supabase
          .from("study_logs")
          .select("topic_tag, is_correct")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!logsError && recentLogs && recentLogs.length > 0) {
          // 2. Smart Logic: Check for "Intensive Training Quest" trigger
          const topicFailures: Record<string, number> = {};
          let intensiveTopic = null;

          for (const log of recentLogs.slice(0, 10)) {
            if (!log.is_correct) {
              topicFailures[log.topic_tag] = (topicFailures[log.topic_tag] || 0) + 1;
              if (topicFailures[log.topic_tag] >= 3) {
                intensiveTopic = log.topic_tag;
                break;
              }
            }
          }

          focusItem = intensiveTopic || focusItem;
          isIntensive = !!intensiveTopic;

          if (!intensiveTopic) {
            const unmastered = recentLogs?.filter(l => !l.is_correct) || [];
            if (unmastered.length > 0) {
              focusItem = unmastered[Math.floor(Math.random() * unmastered.length)].topic_tag;
            }
          }
        }
      } catch (dbError) {
        console.warn("Database study_logs query failed, using default focusItem.");
      }
    }

    const ai = getAI();
    // If no API key, don't even try to call, just return fallback
    if (!(ai as any).apiKey) {
      return getFallbackScenario();
    }

    // 4. Create the prompt
    const prompt = isIntensive 
      ? `
      CRITICAL: This is an "Intensive Training Quest"!
      User has failed "${focusItem}" recently.
      User Level: JLPT ${targetLevel}.
      Task: Create a high-stakes scenario where the user MUST correctly use "${focusItem}" to save the day.
      Goal: Challenge the user with a question that forces them to demonstrate mastery of "${focusItem}".
      `
      : `
      User Level: JLPT ${targetLevel}. 
      Focus Item: ${focusItem}
      Task: Create a 3-sentence immersive roleplay scenario in Japan.
      Requirement: Use ${focusItem} in a natural sentence. 
      Goal: Ask the user a question in Japanese that requires them to reply using ${focusItem}.
      `;

    const response = await ai.models.generateContent({
      model: MODELS.FLASH, // Using Flash for speed and reliability for scenarios
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `You are the "Kokorozashi Game Master". 
        Your tone is immersive, encouraging, and professional. 
        Provide the response in a mix of English (for context) and Japanese (for the actual challenge).`,
      },
    });

    if (userId) await incrementLlmUsage();
    return response.text || getFallbackScenario();
  } catch (error) {
    console.error("Scenario Generation Error Log:", error);
    return getFallbackScenario();
  }
}

export async function seedAncientWisdom() {
  const wisdom = [
    {
      content: "いろはにほへと ちりぬるを (Iroha ni hoheto chirinuru wo) - Even the blossoming flowers will eventually scatter.",
      metadata: { type: "ancient_wisdom", source: "Iroha Poem", period: "Heian", topic: "Impermanence (Mujo)" }
    },
    {
      content: "古池や 蛙飛びこむ 水の音 (Furuike ya kawazu tobikomu mizu no oto) - The old pond, A frog jumps in: Sound of water.",
      metadata: { type: "ancient_wisdom", source: "Matsuo Basho", period: "Edo", topic: "Haiku / Stillness" }
    },
    {
      content: "武士道とは死ぬことと見つけたり (Bushido to wa shinu koto to mitsuketari) - The Way of the Warrior is found in death.",
      metadata: { type: "ancient_wisdom", source: "Hagakure", period: "Edo", topic: "Bushido" }
    },
    {
      content: "一期一会 (Ichigo Ichie) - One time, one meeting. Treasure every encounter, for it will never recur.",
      metadata: { type: "ancient_wisdom", source: "Sen no Rikyu", period: "Sengoku", topic: "Tea Ceremony / Mindfulness" }
    },
    {
      content: "Classical Japanese (Kobun) Particle 'Nari' (なり) - Used for assertion or existence, similar to modern 'da' or 'desu'.",
      metadata: { type: "ancient_wisdom", source: "Grammar", period: "Classical", topic: "Kobun Grammar" }
    }
  ];

  for (const item of wisdom) {
    const embedding = await embedText(item.content);
    if (embedding) {
      await addKnowledgeItem(item.content, item.metadata, embedding);
    }
  }
  return wisdom.length;
}

export async function parseScrapedJLPT(text: string, level: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: `Parse the following scraped text from a JLPT practice website into a list of structured questions for JLPT ${level}.
      
      Text: ${text.slice(0, 15000)}
      
      Format each question as a JSON object with:
      - level: "${level}"
      - question: string (the question text)
      - options: string[] (the 4 options)
      - answer: string (the correct answer, e.g., "1" or "A" or the text itself)
      - explanation: string (a brief explanation of why the answer is correct)
      
      Return a JSON array of these objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["level", "question", "options", "answer", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Scrape Parse Error:", error);
    return [];
  }
}

export async function chatWithTutor(
  message: string, 
  history: { role: 'user' | 'model', text: string }[], 
  studyLogs?: any[], 
  userId?: string, 
  targetLevel?: string,
  weakTopic?: string | null
) {
  try {
    if (userId) await checkUsage(userId);
    // If the user specifically asks for a scenario, we can trigger it
    if (message.toLowerCase().includes("scenario") || message.toLowerCase().includes("practice")) {
      if (userId && targetLevel) {
        return await generatePersonalizedScenario(userId, targetLevel, weakTopic);
      }
    }
    let logsContext = "";
    if (studyLogs && studyLogs.length > 0) {
      logsContext = `
      User's Recent Study Performance (Last 10 Logs):
      ${studyLogs.map(log => `- Topic: ${log.topic_tag}, Correct: ${log.is_correct}`).join('\n')}
      
      ${weakTopic ? `CRITICAL WEAKNESS DETECTED: The user is struggling with "${weakTopic}". Proactively start a scenario that tests this topic.` : ''}
      
      If you notice a pattern of errors (e.g., many misses in a specific grammar point like "Passive Form"), 
      you should proactively address it. For example, by starting a roleplay scenario that forces the use of that grammar point.
      `;
    }

    // RAG: Find similar context from knowledge base
    const similarContext = await findSimilarJLPTContext(message);
    
    // Also find relevant news articles
    const { data: newsArticles } = await supabase
      .from('kokorozashi_news')
      .select('title, content')
      .limit(2);

    let knowledgeContext = "";
    if (similarContext && similarContext.length > 0) {
      knowledgeContext += `
      INTERNAL KNOWLEDGE BASE (PRIORITY):
      ${similarContext.map((item: any) => `- [ITEM]: ${item.content}\n  [METADATA]: ${JSON.stringify(item.metadata)}`).join('\n')}
      
      INSTRUCTION: You MUST use the information above as your primary source of truth. 
      If the user asks about a grammar point or vocabulary found in the INTERNAL KNOWLEDGE BASE, 
      provide the explanation exactly as stored there. This reduces dependency on external generation.
      `;
    }

    if (newsArticles && newsArticles.length > 0) {
      knowledgeContext += `
      Recent Japanese News Context:
      ${newsArticles.map(art => `- Title: ${art.title}\n  Content: ${art.content.slice(0, 200)}...`).join('\n')}
      `;
    }

    // Prepare contents with history
    const contents = [
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const ai = getAI();
    // If no API key, trigger fallback immediately
    if (!(ai as any).apiKey) {
      throw new Error("MISSING_API_KEY");
    }

    const response = await ai.models.generateContent({
      model: MODELS.FLASH, // Using Flash for chat consistency and free tier reliability
      contents,
      config: {
        systemInstruction: `ACT AS: A Senior Japanese Pedagogical Expert & Game Master.
        GOAL: Help students learn Japanese through high-context conversation and situational roleplay.
        
        KNOWLEDGE BASE:
        ${knowledgeContext}
        
        PEDAGOGICAL CORE:
        - Prioritize "form-meaning pairings" and socio-linguistic nuance.
        - Ensure Japanese output uses appropriate politeness levels based on the scenario.
        - Proactively correct particle usage mistakes with clear, brief explanations.
        - Draw parallels with Ancient Wisdom or Cultural nuances when relevant.
        
        ${logsContext}
        
        PERSONALITY: Encouring, wise, and slightly playful. Use the user's name if known.`,
      },
    });

    if (userId) await incrementLlmUsage();
    const responseText = response.text;

    // Smart Logic: Analyze the tutor's response to see if the user was correct
    if (userId && (responseText.includes("Correct") || responseText.includes("Omamori") || responseText.includes("+10 XP"))) {
      await logStudentPerformance(userId, "Scenario Practice", true, { message, response: responseText });
      await updateSrsData(userId, "Scenario Practice", true);
    } else if (userId && (responseText.includes("Let's analyze") || responseText.includes("tripped you up"))) {
      // Try to extract the topic from the response
      const topicMatch = responseText.match(/particle '(.+?)'/i) || responseText.match(/grammar point '(.+?)'/i);
      const topic = topicMatch ? topicMatch[1] : "Scenario Practice";
      await logStudentPerformance(userId, topic, false, { message, response: responseText });
      await updateSrsData(userId, topic, false);
    }

    return responseText;
  } catch (error: any) {
    if (error.message === "DAILY_LIMIT_EXCEEDED") return "You have reached your daily limit for AI tutoring. Please try again tomorrow!";
    
    console.error("Gemini Chat Error Details:", error);
    
    // "Non-dependent" fallback logic: Simulated Sensei
    return `[Auto-Sensei] I'm currently in a deep meditation (or perhaps just a brief connection issue!), but don't let that stop your study! 
    
    Based on your goals, I recommend reviewing your most recent vocabulary. 
    
    Quick Tip: Remember that particles like に (target/time) and で (location of action) are often confused. Take a look at your recent sentences!
    
    (Note: The AI model is temporarily unavailable, so I'm providing this automated guidance.)`;
  }
}
