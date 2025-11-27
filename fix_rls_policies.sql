-- =================================================================
-- FIX: RLS Policies for User Creation
-- Execute this in your Supabase SQL Editor
-- =================================================================

-- 1. Allow users to insert their own profile (Critical for self-healing)
-- This was missing, preventing the app from creating the user record
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Ensure users can update their own data (Re-applying to be safe)
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 3. Ensure users can read their own data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- 4. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'users';
