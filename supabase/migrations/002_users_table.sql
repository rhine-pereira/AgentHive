-- ══════════════════════════════════════════════════════════════
-- AgentHive — Users Profile Table + Auth Trigger
-- Run this AFTER 001_initial_schema.sql
-- ══════════════════════════════════════════════════════════════

-- ========== USERS (public profile linked to auth.users) ==========
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'freelancer', 'admin')),
    wallet_address TEXT,
    bio TEXT,
    tasks_posted INTEGER DEFAULT 0,
    tasks_approved INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========== INDEX ==========
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- ========== RLS ==========
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read user profiles
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Service role can insert/update
CREATE POLICY "Service insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update users" ON users FOR UPDATE USING (true);

-- ========== REALTIME ==========
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ========== AUTO UPDATED_AT ==========
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- AUTO-CREATE USER PROFILE ON SIGNUP/GOOGLE LOGIN
-- This trigger fires whenever a new user signs up via email
-- or logs in with Google for the first time.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert (fires on every new signup / first OAuth login)
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
