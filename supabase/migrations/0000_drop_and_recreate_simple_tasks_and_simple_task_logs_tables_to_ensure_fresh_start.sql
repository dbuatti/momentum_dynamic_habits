DROP TABLE IF EXISTS public.simple_task_logs;
DROP TABLE IF EXISTS public.simple_tasks;

-- Create a table for the simple tasks
CREATE TABLE public.simple_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('count', 'time')),
    current_value INTEGER NOT NULL DEFAULT 1,
    increment_value INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for task completions
CREATE TABLE public.simple_task_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.simple_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    value_at_completion INTEGER NOT NULL,
    increased BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.simple_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_task_logs ENABLE ROW LEVEL SECURITY;

-- Policies for simple_tasks
CREATE POLICY "Users can manage their own tasks" 
ON public.simple_tasks FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

-- Policies for simple_task_logs
CREATE POLICY "Users can manage their own logs" 
ON public.simple_task_logs FOR ALL 
TO authenticated
USING (auth.uid() = user_id);
