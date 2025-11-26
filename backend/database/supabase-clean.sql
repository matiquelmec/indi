CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    subscription_status VARCHAR(20) DEFAULT 'free',
    plan_type VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
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
    theme_config JSONB,
    social_links JSONB,
    custom_fields JSONB,
    is_published BOOLEAN DEFAULT false,
    published_url TEXT,
    view_count INTEGER DEFAULT 0,
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID,
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
    card_id UUID,
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
    card_id UUID,
    visitor_id VARCHAR(100),
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    total_events INTEGER DEFAULT 0,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_published ON public.cards(is_published);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON public.cards(created_at);

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

INSERT INTO public.users (id, email, full_name, subscription_status, plan_type)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@indi.app',
    'Demo User',
    'pro',
    'pro'
) ON CONFLICT (email) DO NOTHING;

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