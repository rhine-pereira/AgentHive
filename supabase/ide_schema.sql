-- ============================================================
-- AgentHive IDE Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- IDE Projects table
CREATE TABLE IF NOT EXISTS ide_projects (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    chain       TEXT        NOT NULL DEFAULT 'sepolia',
    language    TEXT        NOT NULL DEFAULT 'solidity',
    user_wallet TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IDE Files table (belongs to a project)
CREATE TABLE IF NOT EXISTS ide_files (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES ide_projects(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    content     TEXT        NOT NULL DEFAULT '',
    language    TEXT        NOT NULL DEFAULT 'solidity',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IDE Deployments table
CREATE TABLE IF NOT EXISTS ide_deployments (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID        REFERENCES ide_projects(id) ON DELETE SET NULL,
    user_wallet      TEXT        NOT NULL,
    chain            TEXT        NOT NULL,
    chain_id         INTEGER     NOT NULL,
    contract_name    TEXT        NOT NULL,
    contract_address TEXT        NOT NULL,
    tx_hash          TEXT        NOT NULL,
    abi              JSONB       NOT NULL DEFAULT '[]'::jsonb,
    bytecode         TEXT        NOT NULL DEFAULT '',
    deployed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ide_projects_wallet  ON ide_projects(user_wallet);
CREATE INDEX IF NOT EXISTS idx_ide_projects_updated ON ide_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ide_files_project    ON ide_files(project_id);
CREATE INDEX IF NOT EXISTS idx_ide_deploy_wallet    ON ide_deployments(user_wallet);
CREATE INDEX IF NOT EXISTS idx_ide_deploy_chain     ON ide_deployments(chain);
CREATE INDEX IF NOT EXISTS idx_ide_deploy_date      ON ide_deployments(deployed_at DESC);

-- Auto-update updated_at on ide_projects
CREATE OR REPLACE FUNCTION update_ide_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ide_projects_updated_at ON ide_projects;
CREATE TRIGGER trg_ide_projects_updated_at
    BEFORE UPDATE ON ide_projects
    FOR EACH ROW EXECUTE FUNCTION update_ide_projects_updated_at();
