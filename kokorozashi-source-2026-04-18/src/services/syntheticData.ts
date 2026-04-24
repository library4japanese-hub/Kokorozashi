import { addKnowledgeItem } from '../lib/supabase.ts';
import { embedText } from './gemini.ts';

const SUBJECTS = [
  "学生", "先生", "医者", "会社員", "田中さん", "佐藤さん", "子供", "親", "友達", "彼", "彼女",
  "社長", "店員", "警察官", "作家", "歌手", "俳優", "選手", "監督", "エンジニア"
];

const OBJECTS = [
  "本", "雑誌", "新聞", "手紙", "メール", "ご飯", "パン", "水", "お茶", "コーヒー", "ビール",
  "映画", "音楽", "テレビ", "ラジオ", "車", "自転車", "電車", "バス", "飛行機",
  "日本語", "英語", "数学", "歴史", "科学", "宿題", "仕事", "会議", "旅行", "散歩"
];

const VERBS = [
  "読む", "書く", "食べる", "飲む", "見る", "聞く", "買う", "売る", "作る", "使う",
  "話す", "言う", "思う", "考える", "知る", "分かる", "行く", "来る", "帰る", "寝る",
  "起きる", "勉強する", "練習する", "仕事する", "運転する", "泳ぐ", "走る", "歩く", "待つ", "持つ"
];

const GRAMMAR_PATTERNS = [
  { pattern: "〜たい", meaning: "want to", level: "N5" },
  { pattern: "〜ている", meaning: "is doing", level: "N5" },
  { pattern: "〜たことがある", meaning: "have done before", level: "N4" },
  { pattern: "〜なければならない", meaning: "must do", level: "N4" },
  { pattern: "〜ことができる", meaning: "can do", level: "N5" },
  { pattern: "〜ようと思う", meaning: "thinking of doing", level: "N3" },
  { pattern: "〜はずだ", meaning: "should be / expected to", level: "N3" },
  { pattern: "〜かもしれない", meaning: "might", level: "N4" },
  { pattern: "〜すぎる", meaning: "too much", level: "N4" },
  { pattern: "〜やすい", meaning: "easy to", level: "N4" },
  { pattern: "〜にくい", meaning: "hard to", level: "N4" },
  { pattern: "〜ながら", meaning: "while doing", level: "N4" },
  { pattern: "〜たほうがいい", meaning: "had better", level: "N5" },
  { pattern: "〜てはいけない", meaning: "must not", level: "N5" },
  { pattern: "〜てみる", meaning: "try doing", level: "N4" }
];

const ADJECTIVES = [
  "大きい", "小さい", "新しい", "古い", "いい", "悪い", "高い", "安い", "暑い", "寒い",
  "難しい", "易しい", "面白い", "つまらない", "忙しい", "暇な", "有名な", "静かな", "賑やかな", "綺麗な"
];

export async function generateSyntheticKnowledge(batchSize: number = 10) {
  let count = 0;
  const results = [];

  for (let i = 0; i < batchSize; i++) {
    const sub = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const obj = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
    const grammar = GRAMMAR_PATTERNS[Math.floor(Math.random() * GRAMMAR_PATTERNS.length)];
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];

    // Generate a few variations
    const variations = [
      `${sub}は${adj}${obj}を${verb}${grammar.pattern}。`,
      `${sub}は${obj}を${verb}${grammar.pattern}そうです。`,
      `${sub}が${obj}を${verb}${grammar.pattern}のを見ました。`,
      `${adj}${sub}は${obj}を${verb}${grammar.pattern}。`
    ];

    const sentence = variations[Math.floor(Math.random() * variations.length)];
    const content = `Sentence: ${sentence}\nGrammar: ${grammar.pattern} (${grammar.meaning})\nLevel: ${grammar.level}`;
    
    // We only embed if we want vector search. 
    // For "millions", we might skip embedding and rely on text search to save API costs.
    // But for now, let's embed in small batches.
    const embedding = await embedText(content);
    
    if (embedding) {
      await addKnowledgeItem(content, { 
        type: 'synthetic_combination', 
        level: grammar.level,
        grammar: grammar.pattern,
        subject: sub,
        object: obj,
        verb: verb
      }, embedding);
      count++;
      results.push(content);
    }
  }

  return count;
}

export function getCombinationStats() {
  return {
    subjects: SUBJECTS.length,
    objects: OBJECTS.length,
    verbs: VERBS.length,
    grammar: GRAMMAR_PATTERNS.length,
    adjectives: ADJECTIVES.length,
    totalPossible: SUBJECTS.length * OBJECTS.length * VERBS.length * GRAMMAR_PATTERNS.length * ADJECTIVES.length
  };
}
