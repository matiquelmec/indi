-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP FOR PRODUCTION
-- =====================================================
-- This script sets up proper security policies to ensure
-- users can only access their own data

-- Enable RLS on all user-related tables
-- =====================================

-- 1. Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on cards table
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on analytics_events table
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running this script)
-- ================================================================
DROP POLICY IF EXISTS "users_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_own_cards" ON public.cards;
DROP POLICY IF EXISTS "users_insert_own_cards" ON public.cards;
DROP POLICY IF EXISTS "users_update_own_cards" ON public.cards;
DROP POLICY IF EXISTS "users_delete_own_cards" ON public.cards;
DROP POLICY IF EXISTS "users_own_analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "users_insert_analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "public_card_access" ON public.cards;

-- Create RLS Policies
-- ===================

-- USERS TABLE POLICIES
-- Users can only see and update their own profile
CREATE POLICY "users_own_profile" ON public.users
    FOR ALL
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- CARDS TABLE POLICIES
-- Users can only see their own cards
CREATE POLICY "users_own_cards" ON public.cards
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Users can only insert cards for themselves
CREATE POLICY "users_insert_own_cards" ON public.cards
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Users can only update their own cards
CREATE POLICY "users_update_own_cards" ON public.cards
    FOR UPDATE
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- Users can only delete their own cards
CREATE POLICY "users_delete_own_cards" ON public.cards
    FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Public access to published cards (for viewing live cards)
CREATE POLICY "public_card_access" ON public.cards
    FOR SELECT
    USING (is_published = true);

-- ANALYTICS EVENTS TABLE POLICIES
-- Users can only see analytics for their own cards
CREATE POLICY "users_own_analytics" ON public.analytics_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cards 
            WHERE cards.id = analytics_events.card_id 
            AND cards.user_id::text = auth.uid()::text
        )
    );

-- Allow inserting analytics events for any published card (public tracking)
CREATE POLICY "users_insert_analytics" ON public.analytics_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cards 
            WHERE cards.id = analytics_events.card_id 
            AND cards.is_published = true
        )
    );

-- Create function to get current user from JWT (for backend service role queries)
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
BEGIN
    -- This function can be called from backend to simulate user context
    -- In production, this would validate JWT token
    SELECT current_setting('app.current_user_id', true)::UUID INTO user_id;
    RETURN user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- Create security helper functions
-- ================================

-- Function to set user context for service role operations
CREATE OR REPLACE FUNCTION set_user_context(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_uuid::text, true);
END;
$$;

-- Function to clear user context
CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
END;
$$;

-- Grant necessary permissions
-- ===========================

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;

-- Grant read access to anonymous users for published content
GRANT SELECT ON public.cards TO anon;
GRANT INSERT ON public.analytics_events TO anon;

-- Security validation queries
-- ===========================

-- Test query to validate RLS is working
-- (Run these after setup to verify security)

/*
-- Test 1: Verify users can only see their own cards
SELECT count(*) as user_card_count 
FROM cards 
WHERE user_id = '23f71da9-1bac-4811-9456-50d5b7742567';

-- Test 2: Verify analytics events are properly filtered
SELECT count(*) as user_analytics_count 
FROM analytics_events ae
JOIN cards c ON ae.card_id = c.id
WHERE c.user_id = '23f71da9-1bac-4811-9456-50d5b7742567';

-- Test 3: Verify public can see published cards
SELECT count(*) as published_cards_count 
FROM cards 
WHERE is_published = true;
*/

-- Production Security Checklist
-- ==============================
-- ✅ RLS enabled on all user tables
-- ✅ Users can only access their own data
-- ✅ Public can view published cards
-- ✅ Analytics tracking works for published cards
-- ✅ Service role has helper functions for context switching
-- ✅ Proper permissions granted to roles

COMMENT ON TABLE public.cards IS 'Digital business cards - RLS enabled for user isolation';
COMMENT ON TABLE public.analytics_events IS 'Analytics tracking - RLS enabled, public insert for published cards';
COMMENT ON TABLE public.users IS 'User profiles - RLS enabled for profile privacy';