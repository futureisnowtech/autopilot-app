-- Executive Assistant v8 Database Schema

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{
    "primary_window": "09:00-17:00",
    "overflow_window": "20:00-22:00",
    "work_weekends": false,
    "daily_brief_time": "06:00"
  }'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tasks Table
CREATE TYPE urgency_level AS ENUM ('Urgent', 'High', 'Low');
CREATE TYPE task_status AS ENUM ('Ready', 'Scheduled', 'Carry-forward', 'AI_Do', 'Review', 'Blocked', 'Needs-info', 'Done');

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  client TEXT,
  workstream TEXT,
  urgency urgency_level DEFAULT 'Low' NOT NULL,
  priority INTEGER,
  est_minutes INTEGER DEFAULT 30 NOT NULL,
  due_date DATE,
  not_before DATE,
  status task_status DEFAULT 'Ready' NOT NULL,
  source_link TEXT,
  recurrence TEXT,
  delegatable BOOLEAN DEFAULT FALSE NOT NULL,
  calendar_event_id TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  ai_reason TEXT,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Style Guides Table (Learning Engine)
CREATE TABLE style_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  preferences JSONB DEFAULT '{}'::JSONB NOT NULL,
  learned_rules TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Task Attachments Table (Multiple Images/Screenshots)
CREATE TABLE task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own style guide" ON style_guides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own style guide" ON style_guides FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own attachments" ON task_attachments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_attachments.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can insert own attachments" ON task_attachments FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_attachments.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete own attachments" ON task_attachments FOR DELETE 
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_attachments.task_id AND tasks.user_id = auth.uid()));

-- Functions & Triggers for updated_at

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_style_guides BEFORE UPDATE ON style_guides FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
