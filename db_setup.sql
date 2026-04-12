-- Drop existing tables if they exist to ensure a fresh start
-- We drop the logs first because they reference the tasks table
DROP TABLE IF EXISTS public.simple_task_logs;
DROP TABLE IF EXISTS public.simple_tasks;

-- Create simple_tasks table
CREATE TABLE public.simple_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('count', 'time')),
  current_value INTEGER DEFAULT 1 NOT NULL,
  increment_value INTEGER DEFAULT 1 NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.simple_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only see and manage their own data
CREATE POLICY "Users can manage their own tasks" ON public.simple_tasks
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create simple_task_logs table to track completions
CREATE TABLE public.simple_task_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.simple_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  value_at_completion INTEGER NOT NULL,
  increased BOOLEAN DEFAULT false
);

-- Enable RLS on logs
ALTER TABLE public.simple_task_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for logs
CREATE POLICY "Users can manage their own logs" ON public.simple_task_logs
FOR ALL TO authenticated USING (auth.uid() = user_id);