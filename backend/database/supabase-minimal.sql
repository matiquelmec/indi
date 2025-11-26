CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id TEXT,
    event_type VARCHAR(50) NOT NULL,
    visitor_id VARCHAR(100),
    session_id VARCHAR(100),
    device_type VARCHAR(20),
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
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id TEXT,
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

CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    card_id TEXT,
    visitor_id VARCHAR(100),
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    total_events INTEGER DEFAULT 0,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_card_id ON public.analytics_events(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON public.analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_card_date ON public.analytics_daily_summary(card_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.analytics_daily_summary(date);

CREATE INDEX IF NOT EXISTS idx_sessions_card_id ON public.analytics_sessions(card_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON public.analytics_sessions(visitor_id);

INSERT INTO public.analytics_events (card_id, event_type, visitor_id, session_id, device_type, country, created_at)
VALUES
('c3140e8f-999a-41ef-b755-1dc4519afb9e', 'view', 'visitor_001', 'session_001', 'mobile', 'Chile', NOW() - INTERVAL '1 hour'),
('c3140e8f-999a-41ef-b755-1dc4519afb9e', 'contact_save', 'visitor_002', 'session_002', 'desktop', 'Chile', NOW() - INTERVAL '2 hours'),
('c3140e8f-999a-41ef-b755-1dc4519afb9e', 'view', 'visitor_003', 'session_003', 'mobile', 'Argentina', NOW() - INTERVAL '30 minutes'),
('c3140e8f-999a-41ef-b755-1dc4519afb9e', 'social_click', 'visitor_004', 'session_004', 'desktop', 'Peru', NOW() - INTERVAL '45 minutes'),
('c3140e8f-999a-41ef-b755-1dc4519afb9e', 'view', 'visitor_005', 'session_005', 'tablet', 'Chile', NOW() - INTERVAL '15 minutes');