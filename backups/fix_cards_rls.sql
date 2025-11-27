-- =================================================================
-- FIX: Explicit RLS Policies for Cards
-- Execute this in your Supabase SQL Editor
-- =================================================================

-- 1. Drop existing ambiguous policy
DROP POLICY IF EXISTS "Users can manage own cards" ON cards;

-- 2. Create explicit INSERT policy
-- This ensures users can insert rows where the user_id matches their own ID
CREATE POLICY "Users can insert own cards" ON cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Create explicit SELECT policy
CREATE POLICY "Users can view own cards" ON cards
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Create explicit UPDATE policy
CREATE POLICY "Users can update own cards" ON cards
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create explicit DELETE policy
CREATE POLICY "Users can delete own cards" ON cards
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'cards';
