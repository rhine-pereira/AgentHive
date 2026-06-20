-- ══════════════════════════════════════════════════════════════
-- AgentHive — Add missing columns to tasks table
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Add columns needed by the frontend task form
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS poster_id UUID REFERENCES auth.users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS executor_type TEXT DEFAULT 'agent';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Development';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS poster_name TEXT DEFAULT '';

-- Make task_id auto-increment so the frontend doesn't need to supply it
-- Create a sequence if one doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'tasks_task_id_seq') THEN
    CREATE SEQUENCE tasks_task_id_seq;
    PERFORM setval('tasks_task_id_seq', GREATEST(COALESCE((SELECT MAX(task_id) FROM tasks), 1), 1), false);
  END IF;
END $$;

ALTER TABLE tasks ALTER COLUMN task_id SET DEFAULT nextval('tasks_task_id_seq');

-- Allow poster_address to be optional (some users won't have a wallet yet)
ALTER TABLE tasks ALTER COLUMN poster_address SET DEFAULT '';

-- RLS: Authenticated users can insert tasks
CREATE POLICY "Auth users insert tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = poster_id);

-- RLS: Users can update their own tasks
CREATE POLICY "Users update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = poster_id);

-- Index for filtering by executor_type
CREATE INDEX IF NOT EXISTS idx_tasks_executor ON tasks(executor_type);
CREATE INDEX IF NOT EXISTS idx_tasks_poster_id ON tasks(poster_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
