-- =====================================================
-- DATABASE OPTIMIZATION AND INDEXING
-- =====================================================
-- This script creates indexes and optimizations for better performance

-- Drop existing indexes if they exist (for re-running this script)
-- ================================================================
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_cards_user_id;
DROP INDEX IF EXISTS idx_cards_published;
DROP INDEX IF EXISTS idx_cards_published_url;
DROP INDEX IF EXISTS idx_cards_created_at;
DROP INDEX IF EXISTS idx_analytics_events_card_id;
DROP INDEX IF EXISTS idx_analytics_events_created_at;
DROP INDEX IF EXISTS idx_analytics_events_event_type;
DROP INDEX IF EXISTS idx_analytics_events_composite;

-- Users Table Optimizations
-- =========================

-- Index for email lookups (login/registration)
CREATE INDEX idx_users_email ON public.users(email);

-- Unique constraint on email to prevent duplicates
ALTER TABLE public.users ADD CONSTRAINT unique_users_email UNIQUE (email);

-- Index for user ID lookups (common in JOINs)
CREATE INDEX idx_users_id_btree ON public.users USING btree(id);

-- Cards Table Optimizations
-- =========================

-- Index for user_id lookups (most common query)
CREATE INDEX idx_cards_user_id ON public.cards(user_id);

-- Index for published cards (public access)
CREATE INDEX idx_cards_published ON public.cards(is_published) WHERE is_published = true;

-- Index for published URL lookups
CREATE INDEX idx_cards_published_url ON public.cards(published_url) WHERE published_url IS NOT NULL;

-- Composite index for user's published cards
CREATE INDEX idx_cards_user_published ON public.cards(user_id, is_published);

-- Index for date-based queries (ordering by creation date)
CREATE INDEX idx_cards_created_at ON public.cards(created_at DESC);

-- Index for card views count (analytics queries)
CREATE INDEX idx_cards_views_count ON public.cards(views_count DESC) WHERE views_count > 0;

-- Analytics Events Table Optimizations
-- ====================================

-- Index for card_id lookups (most common analytics query)
CREATE INDEX idx_analytics_events_card_id ON public.analytics_events(card_id);

-- Index for time-based queries (weekly/daily analytics)
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- Index for event type filtering
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);

-- Composite index for efficient analytics queries
CREATE INDEX idx_analytics_events_composite ON public.analytics_events(card_id, event_type, created_at DESC);

-- Index for IP-based rate limiting queries
CREATE INDEX idx_analytics_events_ip_time ON public.analytics_events(ip_address, created_at) WHERE ip_address IS NOT NULL;

-- Partial indexes for specific event types (better performance)
CREATE INDEX idx_analytics_events_views ON public.analytics_events(card_id, created_at) WHERE event_type = 'view';
CREATE INDEX idx_analytics_events_contacts ON public.analytics_events(card_id, created_at) WHERE event_type = 'contact_save';
CREATE INDEX idx_analytics_events_social ON public.analytics_events(card_id, created_at) WHERE event_type = 'social_click';

-- Advanced Optimizations
-- ======================

-- Enable auto-vacuum for better performance
ALTER TABLE public.users SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.cards SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.analytics_events SET (autovacuum_vacuum_scale_factor = 0.05); -- More frequent for high-traffic table

-- Set statistics targets for better query planning
ALTER TABLE public.cards ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE public.cards ALTER COLUMN is_published SET STATISTICS 1000;
ALTER TABLE public.analytics_events ALTER COLUMN card_id SET STATISTICS 1000;
ALTER TABLE public.analytics_events ALTER COLUMN event_type SET STATISTICS 1000;
ALTER TABLE public.analytics_events ALTER COLUMN created_at SET STATISTICS 1000;

-- Create function for efficient date range analytics queries
-- =========================================================
CREATE OR REPLACE FUNCTION get_analytics_summary(
    start_date TIMESTAMP DEFAULT CURRENT_DATE - INTERVAL '7 days',
    end_date TIMESTAMP DEFAULT CURRENT_DATE + INTERVAL '1 day',
    target_card_id UUID DEFAULT NULL
)
RETURNS TABLE (
    event_date DATE,
    event_type TEXT,
    event_count BIGINT
) 
LANGUAGE sql
STABLE
AS $$
    SELECT 
        DATE(created_at) as event_date,
        event_type,
        COUNT(*) as event_count
    FROM public.analytics_events
    WHERE 
        created_at >= start_date 
        AND created_at < end_date
        AND (target_card_id IS NULL OR card_id = target_card_id)
    GROUP BY DATE(created_at), event_type
    ORDER BY event_date DESC, event_type;
$$;

-- Create function for weekly performance calculation
-- ================================================
CREATE OR REPLACE FUNCTION get_weekly_performance(
    target_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    week_day TEXT,
    total_views BIGINT,
    total_contacts BIGINT,
    total_social BIGINT,
    performance_score INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    start_of_week DATE;
    day_names TEXT[] := ARRAY['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    i INTEGER;
    current_date_calc DATE;
BEGIN
    -- Get start of current week (Monday)
    start_of_week := DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day';
    
    -- Generate data for each day of the week
    FOR i IN 0..6 LOOP
        current_date_calc := start_of_week + (i || ' days')::INTERVAL;
        
        SELECT 
            day_names[i + 1],
            COALESCE(SUM(CASE WHEN ae.event_type = 'view' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN ae.event_type = 'contact_save' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN ae.event_type = 'social_click' THEN 1 ELSE 0 END), 0),
            LEAST(100, GREATEST(0, 
                ROUND((COALESCE(COUNT(ae.id), 0) * 4.0))::INTEGER
            ))
        INTO week_day, total_views, total_contacts, total_social, performance_score
        FROM public.analytics_events ae
        LEFT JOIN public.cards c ON ae.card_id = c.id
        WHERE 
            DATE(ae.created_at) = current_date_calc
            AND (target_user_id IS NULL OR c.user_id = target_user_id)
        GROUP BY current_date_calc;
        
        -- If no data for this day, return zeros
        IF week_day IS NULL THEN
            week_day := day_names[i + 1];
            total_views := 0;
            total_contacts := 0;
            total_social := 0;
            performance_score := 0;
        END IF;
        
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Materialized view for dashboard overview (updated hourly)
-- ========================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_overview AS
SELECT 
    COUNT(DISTINCT c.id) as total_cards,
    COUNT(DISTINCT c.user_id) as total_users,
    SUM(c.views_count) as total_views,
    COUNT(CASE WHEN c.is_published = true THEN 1 END) as published_cards,
    COUNT(CASE WHEN DATE(c.created_at) = CURRENT_DATE THEN 1 END) as cards_created_today,
    (
        SELECT COUNT(*) 
        FROM public.analytics_events 
        WHERE DATE(created_at) = CURRENT_DATE
    ) as events_today,
    CURRENT_TIMESTAMP as last_updated
FROM public.cards c;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_dashboard_overview_singleton ON dashboard_overview ((1));

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_overview()
RETURNS VOID
LANGUAGE sql
AS $$
    REFRESH MATERIALIZED VIEW dashboard_overview;
$$;

-- Trigger to auto-refresh overview when cards are modified
-- =======================================================
CREATE OR REPLACE FUNCTION trigger_refresh_overview()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh in background (don't block the transaction)
    PERFORM pg_notify('refresh_overview', '');
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for auto-refresh
DROP TRIGGER IF EXISTS cards_overview_refresh ON public.cards;
CREATE TRIGGER cards_overview_refresh
    AFTER INSERT OR UPDATE OR DELETE ON public.cards
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_overview();

-- Vacuum and analyze for immediate optimization
-- ============================================
VACUUM ANALYZE public.users;
VACUUM ANALYZE public.cards;
VACUUM ANALYZE public.analytics_events;

-- Update table statistics
ANALYZE public.users;
ANALYZE public.cards;
ANALYZE public.analytics_events;

-- Performance validation queries
-- ==============================

-- Test index usage for common queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.cards WHERE user_id = '23f71da9-1bac-4811-9456-50d5b7742567';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.analytics_events 
WHERE card_id = (SELECT id FROM public.cards LIMIT 1)
  AND created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Database optimization summary
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'cards', 'analytics_events')
ORDER BY tablename, indexname;

COMMENT ON INDEX idx_users_email IS 'Optimizes login/registration email lookups';
COMMENT ON INDEX idx_cards_user_id IS 'Optimizes user card queries - most common operation';
COMMENT ON INDEX idx_cards_published IS 'Optimizes public card access';
COMMENT ON INDEX idx_analytics_events_composite IS 'Optimizes complex analytics queries';
COMMENT ON FUNCTION get_weekly_performance IS 'Pre-calculated weekly performance for dashboards';