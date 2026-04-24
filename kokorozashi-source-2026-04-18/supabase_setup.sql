-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  secondary_email TEXT,
  phone TEXT,
  photo_url TEXT,
  age INTEGER,
  sex TEXT,
  religion TEXT,
  target_level TEXT CHECK (target_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  xp_points INTEGER DEFAULT 0,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist if table was already created
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS secondary_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_level TEXT CHECK (target_level IN ('N5', 'N4', 'N3', 'N2', 'N1'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create News table
CREATE TABLE IF NOT EXISTS kokorozashi_news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  difficulty TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Study Logs table
CREATE TABLE IF NOT EXISTS study_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  topic_tag TEXT NOT NULL,
  word TEXT,
  is_correct BOOLEAN NOT NULL,
  response_time_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Community Posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('discovery', 'score')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Knowledge Base table (for RAG)
CREATE TABLE IF NOT EXISTS jlpt_knowledge (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536), -- Assuming 1536 for Gemini embeddings, adjust if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Mock Exam Results table
CREATE TABLE IF NOT EXISTS mock_exam_results (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  exam_year TEXT,
  score_percentage NUMERIC,
  weak_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kokorozashi_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jlpt_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_results ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for News (Public Read, Admin Write)
CREATE POLICY "Anyone can view news" ON kokorozashi_news FOR SELECT USING (true);
CREATE POLICY "Admins can insert news" ON kokorozashi_news FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update news" ON kokorozashi_news FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete news" ON kokorozashi_news FOR DELETE USING (is_admin());

-- Policies for Study Logs
CREATE POLICY "Users can view their own logs" ON study_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON study_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for Community Posts
CREATE POLICY "Anyone can view posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for Knowledge Base (Public Read, Admin Write)
CREATE POLICY "Anyone can view knowledge" ON jlpt_knowledge FOR SELECT USING (true);
CREATE POLICY "Admins can insert knowledge" ON jlpt_knowledge FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update knowledge" ON jlpt_knowledge FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete knowledge" ON jlpt_knowledge FOR DELETE USING (is_admin());

-- Policies for Mock Exam Results
CREATE POLICY "Users can view their own exam results" ON mock_exam_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exam results" ON mock_exam_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create LLM Usage table
CREATE TABLE IF NOT EXISTS llm_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  usage_date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE llm_usage ENABLE ROW LEVEL SECURITY;

-- Policies for LLM Usage
CREATE POLICY "Users can view their own usage" ON llm_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own usage" ON llm_usage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage" ON llm_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment XP
CREATE OR REPLACE FUNCTION increment_xp(amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET xp_points = xp_points + amount
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment LLM usage
CREATE OR REPLACE FUNCTION increment_llm_usage()
RETURNS VOID AS $$
BEGIN
  INSERT INTO llm_usage (user_id, usage_date, count)
  VALUES (auth.uid(), CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET count = llm_usage.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_jlpt_knowledge (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id INT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jlpt_knowledge.id,
    jlpt_knowledge.content,
    jlpt_knowledge.metadata,
    1 - (jlpt_knowledge.embedding <=> query_embedding) AS similarity
  FROM jlpt_knowledge
  WHERE 1 - (jlpt_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Seed initial news if empty
-- (Handled by server.ts, but we can add more here if needed)

-- Note: Ancient Wisdom seeding is handled via Admin Dashboard for vector embeddings
-- but we can add the table structure and some metadata here.
UPDATE profiles SET role = 'admin' WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'library4japanese@gmail.com'
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, target_level, xp_points, role)
  VALUES (new.id, split_part(new.email, '@', 1), 'N5', 0, 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
