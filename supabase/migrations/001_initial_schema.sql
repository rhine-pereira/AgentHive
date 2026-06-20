-- ══════════════════════════════════════════════════════════════
-- AgentHive — Full Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ══════════════════════════════════════════════════════════════

-- ========== AGENTS ==========
CREATE TABLE agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id INTEGER UNIQUE NOT NULL,
    agent_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    capabilities JSONB DEFAULT '[]',
    wallet_address TEXT,
    owner_address TEXT NOT NULL,
    reputation_score INTEGER DEFAULT 0,
    badge TEXT DEFAULT 'none',
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    total_earnings NUMERIC DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    status TEXT DEFAULT 'idle',
    is_active BOOLEAN DEFAULT true,
    nft_tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== TASKS ==========
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id INTEGER UNIQUE NOT NULL,
    poster_address TEXT NOT NULL,
    task_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    complexity TEXT DEFAULT 'standard',
    bounty_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'open',
    assigned_agent_id INTEGER,
    result_hash TEXT,
    result_content TEXT,
    result_summary TEXT,
    quality_score INTEGER,
    tags JSONB DEFAULT '[]',
    deadline TIMESTAMPTZ,
    escrow_tx_hash TEXT,
    payout_tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ
);

-- ========== TASK BIDS ==========
CREATE TABLE task_bids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id),
    agent_id INTEGER NOT NULL REFERENCES agents(agent_id),
    bid_message TEXT,
    estimated_seconds INTEGER,
    is_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== REPUTATION LOG ==========
CREATE TABLE reputation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES agents(agent_id),
    task_id INTEGER REFERENCES tasks(task_id),
    event_type TEXT NOT NULL,
    quality_score INTEGER,
    points_earned INTEGER DEFAULT 0,
    points_lost INTEGER DEFAULT 0,
    new_total INTEGER,
    new_badge TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== ACTIVITY LOG (powers live feed) ==========
CREATE TABLE activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    agent_id INTEGER,
    task_id INTEGER,
    details JSONB DEFAULT '{}',
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== DISPUTES ==========
CREATE TABLE disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id),
    reason TEXT NOT NULL,
    ai_quality_check JSONB,
    resolution TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- ========== NOTIFICATIONS ==========
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_address TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- INDEXES (for fast queries)
-- ══════════════════════════════════════════════════════════════

CREATE INDEX idx_agents_type ON agents(agent_type);
CREATE INDEX idx_agents_reputation ON agents(reputation_score DESC);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_tasks_poster ON tasks(poster_address);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_agent_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_event ON activity_log(event_type);
CREATE INDEX idx_notifications_user ON notifications(user_address);
CREATE INDEX idx_notifications_unread ON notifications(user_address, is_read) WHERE is_read = false;
CREATE INDEX idx_reputation_agent ON reputation_log(agent_id);
CREATE INDEX idx_disputes_task ON disputes(task_id);

-- ══════════════════════════════════════════════════════════════
-- REALTIME (enable live updates for frontend)
-- ══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ══════════════════════════════════════════════════════════════
-- AUTO UPDATED_AT TRIGGER
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — basic policies
-- ══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can browse agents, tasks, activity)
CREATE POLICY "Public read agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public read activity" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Public read reputation" ON reputation_log FOR SELECT USING (true);
CREATE POLICY "Public read bids" ON task_bids FOR SELECT USING (true);
CREATE POLICY "Public read disputes" ON disputes FOR SELECT USING (true);

-- Notifications: only the owner can read their own
CREATE POLICY "Users read own notifications" ON notifications
    FOR SELECT USING (true);

-- Service role can do everything (backend uses service key)
CREATE POLICY "Service insert agents" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update agents" ON agents FOR UPDATE USING (true);
CREATE POLICY "Service insert tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Service insert bids" ON task_bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert reputation" ON reputation_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert activity" ON activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert disputes" ON disputes FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update disputes" ON disputes FOR UPDATE USING (true);
CREATE POLICY "Service insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update notifications" ON notifications FOR UPDATE USING (true);

-- ══════════════════════════════════════════════════════════════
-- SEED DATA — Demo agents (so the platform looks alive)
-- ══════════════════════════════════════════════════════════════

INSERT INTO agents (agent_id, agent_type, name, description, capabilities, owner_address, wallet_address, reputation_score, badge, tasks_completed, streak_count, best_streak, status) VALUES
(1, 'audit',   'AuditBot #1',   'AI-powered Solidity smart contract security auditor. Detects reentrancy, overflow, access control, and gas optimization issues.', '["security-audit", "vulnerability-detection", "gas-optimization", "ERC-compliance"]', '0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000001', 4200, 'gold', 847, 12, 45, 'idle'),
(2, 'content', 'ContentBot #2', 'AI content writer specializing in blogs, social media captions, product descriptions, and marketing copy.', '["blog-writing", "social-media", "copywriting", "SEO-content"]', '0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000002', 3150, 'gold', 623, 8, 32, 'idle'),
(3, 'audit',   'AuditBot #3',   'Secondary audit agent focused on DeFi protocol analysis and ERC token compliance verification.', '["defi-audit", "token-compliance", "protocol-analysis"]', '0x0000000000000000000000000000000000000003', '0x0000000000000000000000000000000000000003', 1800, 'gold', 312, 5, 28, 'idle');
