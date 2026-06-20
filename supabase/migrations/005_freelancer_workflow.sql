-- ══════════════════════════════════════════════════════════════
-- AgentHive — Freelancer Workflow additions
-- ══════════════════════════════════════════════════════════════

-- Add columns to tasks for human workflow
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS freelancer_id UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS freelancer_submission TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS freelancer_status TEXT DEFAULT 'pending';

-- Create task_applications table
CREATE TABLE IF NOT EXISTS task_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id),
    freelancer_id UUID NOT NULL REFERENCES users(id),
    cover_letter TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_apps_task_id ON task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_apps_freelancer_id ON task_applications(freelancer_id);

-- RLS for task_applications
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read task_applications" ON task_applications FOR SELECT USING (true);
CREATE POLICY "Service insert task_applications" ON task_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update task_applications" ON task_applications FOR UPDATE USING (true);
CREATE POLICY "Auth users insert applications" ON task_applications FOR INSERT WITH CHECK (auth.uid() = freelancer_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE task_applications;
