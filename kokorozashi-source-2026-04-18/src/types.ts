export interface VocabEntry {
  word: string;
  reading: string;
  meaning: string;
  jlpt_level: string;
  context_hint: string;
}

export interface NewsArticle {
  id?: number;
  title: string;
  content: string;
  source_url: string;
  difficulty: string;
  created_at?: string;
}

export interface MockTest {
  questions: {
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    topic: string;
    cultureNote?: string;
  }[];
}

export interface BossBattleData {
  id: string;
  name: string;
  level: string;
  questions: {
    question: string;
    options: { text: string; isCorrect: boolean }[];
    explanation: string;
  }[];
}

export interface GrammarExplanation {
  meta: {
    pattern: string;
    jlpt_level: string;
    difficulty_score: number;
    dependencies: string[];
    skill_type: string[];
  };
  core_grammar_dna: {
    structure: string;
    function: string;
    cognitive_insight: string;
  };
  form_meaning: {
    breakdown: string[];
    literal_meaning: string;
    nuance: string;
    social_tone: 'polite' | 'casual' | 'formal';
  };
  sentence_triad: {
    level: 'A' | 'B' | 'C';
    japanese: string;
    furigana: string;
    english: string;
    audio: {
      pitch_pattern: 'heiban' | 'atamadaka' | 'nakadaka' | 'odaka';
      wpm: number;
      ssml: string;
      pronunciation_notes: string;
    };
  }[];
  pragmatics: {
    when_to_use: string;
    when_not_to_use: string;
    cultural_note: string;
  };
  common_errors: {
    error: string;
    correction: string;
    explanation: string;
  }[];
  assessment: {
    reordering: {
      question: string[];
      answer: string;
    };
    fill_blank: {
      sentence: string;
      answer: string;
    };
    context_reaction: string;
  };
  progression: {
    previous: string;
    next: string;
  };
  motivation: string;
}

export type View = 'dashboard' | 'vocab' | 'quiz' | 'tutor' | 'news' | 'mock-test' | 'profile' | 'community' | 'admin' | 'boss-battle' | 'grammar-detail' | 'settings' | 'review' | 'study-room';

export type Theme = 'classic' | 'sakura' | 'zen' | 'cyberpunk' | 'midnight';

export interface CommunityPost {
  id?: number;
  user_id: string;
  username: string;
  content: string;
  type: 'discovery' | 'score';
  created_at?: string;
}

export interface Profile {
  id: string;
  username: string | null;
  first_name?: string | null;
  last_name?: string | null;
  secondary_email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  age?: number | null;
  sex?: string | null;
  religion?: string | null;
  target_level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null;
  xp_points: number;
  gems?: number;
  is_pro?: boolean;
  role?: 'student' | 'admin' | null;
}

export interface StudyLog {
  id?: number;
  user_id: string;
  topic_tag: string;
  word?: string;
  mastery_score?: number;
  is_correct: boolean;
  response_time_seconds: number;
  metadata?: any;
  created_at?: string;
}

export interface MockExamResult {
  id?: number;
  user_id: string;
  exam_year: string;
  score_percentage: number;
  weak_areas: string[];
  created_at?: string;
}

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type ContentMode = 'word' | 'grammar' | 'mixed';
export type StyleMode = 'auto' | 'anime' | 'futuristic' | 'minimalist' | 'manga' | 'dreamy';
export type DifficultyBias = 'easy' | 'medium' | 'hard';

export interface FlashcardRequest {
  jlpt_level: JLPTLevel;
  content_mode: ContentMode;
  style_mode: StyleMode;
  theme_preference: string[];
  color_preference: string[];
  character_preference: string[];
  daily_seed: string;
  difficulty_bias: DifficultyBias;
  include_example: boolean;
  include_audio: boolean;
  output_format: 'full' | 'prompt_only' | 'content_only';
}

export interface FlashcardResponse {
  id: string;
  jlpt_level: JLPTLevel;
  content: {
    kanji: string;
    reading: string;
    meaning: string;
    example_jp: string;
    example_en: string;
    difficulty: string;
    part_of_speech?: string;
  };
  style: {
    theme: string;
    color_palette: string;
    character: string;
    lighting: string;
  };
  image_prompt: string;
  ui_metadata: {
    layout: string;
    font: string;
    background: string;
    animation: string;
  };
  audio: {
    tts_text: string;
    voice: string;
    speed: number;
  };
  imageUrl?: string;
  isAiGenerated?: boolean;
}
