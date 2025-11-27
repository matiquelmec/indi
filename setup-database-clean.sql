-- ================================================
-- INDI Digital Card Platform - Clean Database Schema
-- Version: 2.0
-- Date: 2024-11-27
-- ================================================

-- Cleanup existing tables if needed (BE CAREFUL IN PRODUCTION!)
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS analytics_daily_summary CASCADE;
DROP TABLE IF EXISTS analytics_sessions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS digital_cards CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
  subscription_status VARCHAR(20) DEFAULT 'free' CHECK (subscription_status IN ('free', 'trial', 'pro', 'enterprise')),
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- CARDS TABLE (Unified structure)
-- ================================================
CREATE TABLE public.cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  company VARCHAR(200),
  bio TEXT,

  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(200),
  website VARCHAR(255),

  -- Visual Customization
  avatar_url TEXT,
  theme_id VARCHAR(50) DEFAULT 'emerald',
  theme_config JSONB DEFAULT '{}',

  -- Social Links (array of {platform, url, label})
  social_links JSONB DEFAULT '[]',

  -- Publishing Status
  is_published BOOLEAN DEFAULT false,
  published_url VARCHAR(255) UNIQUE,
  custom_slug VARCHAR(100) UNIQUE,

  -- Analytics Summary
  views_count INTEGER DEFAULT 0,
  contacts_saved INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,

  -- Business Logic
  is_active BOOLEAN DEFAULT true,
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  features JSONB DEFAULT '{"analytics": false, "custom_domain": false, "remove_branding": false}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Indexes for performance
  CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- AUTH SESSIONS TABLE (for refresh tokens)
-- ================================================
CREATE TABLE public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ANALYTICS EVENTS TABLE
-- ================================================
CREATE TABLE public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,

  -- Event Information
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'view', 'contact_save', 'social_click', 'share',
    'qr_scan', 'nfc_tap', 'email_click', 'phone_click'
  )),

  -- Visitor Tracking
  visitor_id VARCHAR(100),
  session_id VARCHAR(100),

  -- Device & Location
  device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  browser VARCHAR(50),
  os VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),

  -- Traffic Source
  referrer TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),

  -- Technical Data
  ip_address INET,
  user_agent TEXT,

  -- Additional Data
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ANALYTICS DAILY SUMMARY TABLE (for performance)
-- ================================================
CREATE TABLE public.analytics_daily_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Metrics
  total_views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  contact_saves INTEGER DEFAULT 0,
  social_clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  qr_scans INTEGER DEFAULT 0,

  -- Aggregated Data
  top_countries JSONB DEFAULT '[]',
  top_devices JSONB DEFAULT '[]',
  top_referrers JSONB DEFAULT '[]',
  top_social_platforms JSONB DEFAULT '[]',

  -- Performance Metrics
  avg_time_on_card FLOAT DEFAULT 0,
  bounce_rate FLOAT DEFAULT 0,
  conversion_rate FLOAT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one summary per card per day
  CONSTRAINT unique_card_date UNIQUE (card_id, date)
);

-- ================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Cards indexes
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_published ON cards(is_published) WHERE is_published = true;
CREATE INDEX idx_cards_published_url ON cards(published_url);
CREATE INDEX idx_cards_custom_slug ON cards(custom_slug);
CREATE INDEX idx_cards_created_at ON cards(created_at DESC);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Analytics Events indexes
CREATE INDEX idx_analytics_events_card_id ON analytics_events(card_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_card_date ON analytics_events(card_id, created_at);

-- Analytics Daily Summary indexes
CREATE INDEX idx_analytics_daily_card_id ON analytics_daily_summary(card_id);
CREATE INDEX idx_analytics_daily_date ON analytics_daily_summary(date DESC);
CREATE INDEX idx_analytics_daily_card_date ON analytics_daily_summary(card_id, date DESC);

-- ================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_daily_updated_at BEFORE UPDATE ON analytics_daily_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- CREATE FUNCTION TO INCREMENT VIEW COUNT
-- ================================================
CREATE OR REPLACE FUNCTION increment_card_view(card_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE cards
    SET views_count = views_count + 1
    WHERE id = card_uuid;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- CREATE FUNCTION TO AGGREGATE DAILY ANALYTICS
-- ================================================
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(target_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO analytics_daily_summary (
        card_id, date, total_views, unique_views,
        contact_saves, social_clicks, shares, qr_scans
    )
    SELECT
        card_id,
        target_date,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
        COUNT(DISTINCT CASE WHEN event_type = 'view' THEN visitor_id END) as unique_views,
        COUNT(CASE WHEN event_type = 'contact_save' THEN 1 END) as contact_saves,
        COUNT(CASE WHEN event_type = 'social_click' THEN 1 END) as social_clicks,
        COUNT(CASE WHEN event_type = 'share' THEN 1 END) as shares,
        COUNT(CASE WHEN event_type = 'qr_scan' THEN 1 END) as qr_scans
    FROM analytics_events
    WHERE DATE(created_at) = target_date
    GROUP BY card_id
    ON CONFLICT (card_id, date)
    DO UPDATE SET
        total_views = EXCLUDED.total_views,
        unique_views = EXCLUDED.unique_views,
        contact_saves = EXCLUDED.contact_saves,
        social_clicks = EXCLUDED.social_clicks,
        shares = EXCLUDED.shares,
        qr_scans = EXCLUDED.qr_scans,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Cards policies
CREATE POLICY "Users can manage own cards" ON cards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Published cards are publicly viewable" ON cards
  FOR SELECT USING (is_published = true);

-- Sessions policies
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view analytics of own cards" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cards
      WHERE cards.id = analytics_events.card_id
      AND cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view analytics summary of own cards" ON analytics_daily_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cards
      WHERE cards.id = analytics_daily_summary.card_id
      AND cards.user_id = auth.uid()
    )
  );

-- ================================================
-- INSERT SAMPLE DATA (Optional - Remove in production)
-- ================================================

-- Sample user
INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
VALUES (
  'demo@indi.com',
  '$2b$10$YourHashedPasswordHere', -- Replace with actual hash
  'Demo',
  'User',
  true
) ON CONFLICT (email) DO NOTHING;

-- Get the demo user ID for inserting sample card
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@indi.com';

    IF demo_user_id IS NOT NULL THEN
        -- Sample card
        INSERT INTO cards (
            user_id,
            first_name,
            last_name,
            title,
            company,
            bio,
            email,
            phone,
            location,
            theme_id,
            is_published,
            published_url,
            custom_slug
        ) VALUES (
            demo_user_id,
            'Elena',
            'Castillo',
            'Psicóloga Clínica',
            'Mente & Equilibrio',
            'Especialista en terapia cognitivo-conductual y manejo de ansiedad.',
            'elena@ejemplo.com',
            '+56 9 1234 5678',
            'Santiago, Chile',
            'medical',
            true,
            '/card/' || gen_random_uuid(),
            'elena-castillo'
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ================================================
-- VERIFY INSTALLATION
-- ================================================
SELECT
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- Show row counts
SELECT 'users' as table_name, COUNT(*) as rows FROM users
UNION ALL
SELECT 'cards', COUNT(*) FROM cards
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'analytics_events', COUNT(*) FROM analytics_events
UNION ALL
SELECT 'analytics_daily_summary', COUNT(*) FROM analytics_daily_summary;

-- ================================================
-- MIGRATION NOTES
-- ================================================
-- 1. This schema consolidates 'cards' and 'digital_cards' into a single 'cards' table
-- 2. Adds proper foreign key relationships
-- 3. Includes performance indexes
-- 4. Implements Row Level Security
-- 5. Adds utility functions for common operations
-- 6. Includes analytics aggregation for performance
-- ================================================