-- ══════════════════════════════════════════════════════════════
-- FIX: Ensure authenticated users can insert/update their own profile
-- Run this in Supabase SQL Editor NOW
-- ══════════════════════════════════════════════════════════════

-- Drop conflicting policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Service insert users" ON users;
DROP POLICY IF EXISTS "Service update users" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;

-- Authenticated users can INSERT their own profile (for upsert)
CREATE POLICY "Users insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Authenticated users can UPDATE their own profile
CREATE POLICY "Users update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Service role bypass (backend operations)
CREATE POLICY "Service full access" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
-- BACKFILL: Create profiles for any existing auth users
-- ══════════════════════════════════════════════════════════════

INSERT INTO public.users (id, email, full_name, avatar_url, role)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', ''),
    COALESCE(raw_user_meta_data->>'role', 'client')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- Ensure the auto-create trigger exists
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
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
        avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), users.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger (safe to run multiple times)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
