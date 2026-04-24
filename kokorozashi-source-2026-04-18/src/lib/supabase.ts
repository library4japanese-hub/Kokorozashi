import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Key is missing. Auth and Database features will not work. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your secrets.");
}

// Provide fallback strings to prevent "supabaseKey is required" crash during development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseKey || 'placeholder-key'
);

export async function searchKnowledge(queryEmbedding: number[], threshold = 0.7, count = 5) {
  const { data, error } = await supabase.rpc('match_jlpt_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: count,
  });

  if (error) {
    console.error("Supabase Search Error:", error);
    return [];
  }
  return data;
}

export async function addKnowledgeItem(content: string, metadata: any, embedding: number[]) {
  const { data, error } = await supabase.from('jlpt_knowledge').insert({
    content,
    metadata,
    embedding,
  });

  if (error) {
    console.error("Supabase Insert Error:", error);
    return null;
  }
  return data;
}

export async function logStudentPerformance(userId: string, topicTag: string, isCorrect: boolean, metadata?: any) {
  const { data, error } = await supabase.from('study_logs').insert({
    user_id: userId,
    topic_tag: topicTag,
    is_correct: isCorrect,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Supabase Log Error:", error);
    return null;
  }
  return data;
}

export async function fetchCommunityPosts() {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("Supabase Fetch Posts Error:", error);
    return [];
  }
  return data;
}

export async function createCommunityPost(userId: string, username: string, content: string, type: 'discovery' | 'score') {
  const { data, error } = await supabase.from('community_posts').insert({
    user_id: userId,
    username,
    content,
    type,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Supabase Create Post Error:", error);
    return null;
  }
  return data;
}

export async function getLlmUsage(userId: string) {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase is not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_KEY.");
    return 0;
  }

  // Validate UUID format to prevent Supabase errors with mock IDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('llm_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('usage_date', new Date().toISOString().split('T')[0])
      .single();

    if (error && error.code !== 'PGRST116') {
      if (error.message.includes('not found')) {
        console.error("Supabase Error: 'llm_usage' table not found. Please run the SQL in 'supabase_setup.sql' in your Supabase SQL Editor.");
      } else {
        console.error("Supabase Get Usage Error:", error.message);
      }
      return 0;
    }
    return data?.count || 0;
  } catch (err: any) {
    if (err.message === 'Failed to fetch') {
      console.error("Supabase Connection Error: Failed to fetch. Check if your Supabase URL is correct and the project is active.");
    } else {
      console.error("Supabase Unexpected Error:", err);
    }
    return 0;
  }
}

export async function incrementLlmUsage() {
  const { error } = await supabase.rpc('increment_llm_usage');
  if (error) {
    console.error("Supabase Increment Usage Error:", error);
  }
}

export async function hybridSearch(query: string, queryEmbedding: number[], threshold = 0.5, count = 5) {
  // 1. Semantic Search
  const { data: semanticData, error: semanticError } = await supabase.rpc('match_jlpt_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: count,
  });

  // 2. Keyword Search
  const { data: keywordData, error: keywordError } = await supabase
    .from('jlpt_knowledge')
    .select('*')
    .textSearch('content', query)
    .limit(count);

  if (semanticError || keywordError) {
    console.error("Hybrid Search Error:", semanticError || keywordError);
    return semanticData || keywordData || [];
  }

  // Combine and deduplicate
  const combined = [...(semanticData || []), ...(keywordData || [])];
  const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
  
  return unique.slice(0, count);
}

export async function updateSrsData(userId: string, topicTag: string, isCorrect: boolean) {
  const { data: existing } = await supabase
    .from('srs_data')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_tag', topicTag)
    .single();

  let interval = 1;
  let ease = 2.5;
  let repetitions = 0;

  if (existing) {
    repetitions = existing.repetitions;
    ease = existing.ease;
    interval = existing.interval;

    if (isCorrect) {
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * ease);
      ease = Math.max(1.3, ease + 0.1);
    } else {
      repetitions = 0;
      interval = 1;
      ease = Math.max(1.3, ease - 0.2);
    }
  } else {
    if (isCorrect) {
      repetitions = 1;
      interval = 1;
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  const srsUpdate = {
    user_id: userId,
    topic_tag: topicTag,
    interval,
    ease,
    repetitions,
    next_review: nextReview.toISOString(),
    last_reviewed: new Date().toISOString()
  };

  if (existing) {
    await supabase.from('srs_data').update(srsUpdate).eq('id', existing.id);
  } else {
    await supabase.from('srs_data').insert(srsUpdate);
  }
}
