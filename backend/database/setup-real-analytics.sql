-- ===============================================
-- SETUP REAL ANALYTICS DATABASE FOR INDI APP
-- ===============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- 1. USERS TABLE (for real authentication)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- For custom auth, but we'll use Supabase Auth
    full_name VARCHAR(255),
    avatar_url TEXT,
    subscription_status VARCHAR(20) DEFAULT 'free', -- free, pro, enterprise
    plan_type VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- ===============================================
-- 2. DIGITAL CARDS TABLE (real card storage)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    position VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    theme_config JSONB, -- Store theme configuration
    social_links JSONB, -- Store social media links
    custom_fields JSONB, -- Store custom fields
    is_published BOOLEAN DEFAULT false,
    published_url TEXT,
    view_count INTEGER DEFAULT 0,
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 3. ANALYTICS EVENTS TABLE (real event tracking)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- view, contact_save, social_click, qr_scan, share
    visitor_id VARCHAR(100), -- Anonymous visitor tracking
    session_id VARCHAR(100),
    device_type VARCHAR(20), -- mobile, desktop, tablet
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB, -- Additional event-specific data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- 4. ANALYTICS DAILY SUMMARY (for performance)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.analytics_daily_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    contact_saves INTEGER DEFAULT 0,
    social_clicks INTEGER DEFAULT 0,
    qr_scans INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    top_countries JSONB,
    top_devices JSONB,
    top_referrers JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(card_id, date)
);

-- ===============================================
-- 5. ANALYTICS SESSIONS (visitor sessions)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    visitor_id VARCHAR(100),
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    total_events INTEGER DEFAULT 0,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true
);

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

-- Cards indexes
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_published ON public.cards(is_published);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON public.cards(created_at);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_card_id ON public.analytics_events(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON public.analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Daily summary indexes
CREATE INDEX IF NOT EXISTS idx_analytics_daily_card_date ON public.analytics_daily_summary(card_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.analytics_daily_summary(date);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_card_id ON public.analytics_sessions(card_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON public.analytics_sessions(visitor_id);

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Cards policies
CREATE POLICY "Users can view own cards" ON public.cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" ON public.cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON public.cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON public.cards
    FOR DELETE USING (auth.uid() = user_id);

-- Published cards can be viewed by anyone
CREATE POLICY "Published cards are viewable by everyone" ON public.cards
    FOR SELECT USING (is_published = true);

-- Analytics events policies (users can see analytics for their cards)
CREATE POLICY "Users can view analytics for own cards" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = analytics_events.card_id
            AND cards.user_id = auth.uid()
        )
    );

-- Similar policies for daily summary and sessions
CREATE POLICY "Users can view daily summary for own cards" ON public.analytics_daily_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = analytics_daily_summary.card_id
            AND cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view sessions for own cards" ON public.analytics_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = analytics_sessions.card_id
            AND cards.user_id = auth.uid()
        )
    );

-- ===============================================
-- FUNCTIONS FOR ANALYTICS AGGREGATION
-- ===============================================

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS VOID AS $$
DECLARE
    card_record RECORD;
BEGIN
    -- Process each card
    FOR card_record IN SELECT id FROM public.cards WHERE is_published = true
    LOOP
        INSERT INTO public.analytics_daily_summary (
            card_id,
            date,
            total_views,
            unique_views,
            contact_saves,
            social_clicks,
            qr_scans,
            shares,
            top_countries,
            top_devices,
            top_referrers
        )
        SELECT
            card_record.id,
            target_date,
            COUNT(*) FILTER (WHERE event_type = 'view'),
            COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'view'),
            COUNT(*) FILTER (WHERE event_type = 'contact_save'),
            COUNT(*) FILTER (WHERE event_type = 'social_click'),
            COUNT(*) FILTER (WHERE event_type = 'qr_scan'),
            COUNT(*) FILTER (WHERE event_type = 'share'),
            -- Top countries (simplified)
            jsonb_build_object('countries', jsonb_agg(DISTINCT country) FILTER (WHERE country IS NOT NULL)),
            -- Top devices (simplified)
            jsonb_build_object('devices', jsonb_agg(DISTINCT device_type) FILTER (WHERE device_type IS NOT NULL)),
            -- Top referrers (simplified)
            jsonb_build_object('referrers', jsonb_agg(DISTINCT referrer) FILTER (WHERE referrer IS NOT NULL))
        FROM public.analytics_events
        WHERE card_id = card_record.id
        AND DATE(created_at) = target_date
        ON CONFLICT (card_id, date)
        DO UPDATE SET
            total_views = EXCLUDED.total_views,
            unique_views = EXCLUDED.unique_views,
            contact_saves = EXCLUDED.contact_saves,
            social_clicks = EXCLUDED.social_clicks,
            qr_scans = EXCLUDED.qr_scans,
            shares = EXCLUDED.shares,
            top_countries = EXCLUDED.top_countries,
            top_devices = EXCLUDED.top_devices,
            top_referrers = EXCLUDED.top_referrers,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- DEMO DATA INSERTION (for testing)
-- ===============================================

-- Insert demo user (only if not exists)
INSERT INTO public.users (id, email, full_name, subscription_status, plan_type)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@indi.app',
    'Demo User',
    'pro',
    'pro'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo card (only if not exists)
INSERT INTO public.cards (
    id,
    user_id,
    title,
    first_name,
    last_name,
    company,
    position,
    email,
    phone,
    website,
    bio,
    is_published,
    view_count
) VALUES (
    'c3140e8f-999a-41ef-b755-1dc4519afb9e',
    '00000000-0000-0000-0000-000000000001',
    'Dra. Elena Castillo - Psicóloga Clínica',
    'Elena',
    'Castillo',
    'Mente & Equilibrio',
    'Psicóloga Clínica',
    'elena@menteequilibrio.cl',
    '+56 9 8765 4321',
    'https://menteequilibrio.cl',
    'Especialista en terapia cognitivo-conductual con 10 años de experiencia.',
    true,
    247
) ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- COMPLETION MESSAGE
-- ===============================================
SELECT 'Real Analytics Database Setup Complete! 🎉' as message;