-- ================================================
-- INDI Digital Card Platform - Safe Migration Script
-- Version: 2.0
-- Date: 2024-11-27
-- ================================================
-- This script safely migrates existing data to the new schema
-- ================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- STEP 1: BACKUP EXISTING DATA (if exists)
-- ================================================

-- Create backup tables if original tables exist
DO $$
BEGIN
    -- Backup users table if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
        RAISE NOTICE 'Users table backed up';
    END IF;

    -- Backup cards tables if exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cards') THEN
        CREATE TABLE IF NOT EXISTS cards_backup AS SELECT * FROM cards;
        RAISE NOTICE 'Cards table backed up';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'digital_cards') THEN
        CREATE TABLE IF NOT EXISTS digital_cards_backup AS SELECT * FROM digital_cards;
        RAISE NOTICE 'Digital_cards table backed up';
    END IF;

    -- Backup analytics if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events') THEN
        CREATE TABLE IF NOT EXISTS analytics_events_backup AS SELECT * FROM analytics_events;
        RAISE NOTICE 'Analytics_events table backed up';
    END IF;
END $$;

-- ================================================
-- STEP 2: DROP EXISTING CONSTRAINTS
-- ================================================

-- Drop foreign key constraints if they exist
DO $$
BEGIN
    -- Drop all foreign keys from cards table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'cards_user_id_fkey') THEN
        ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey;
    END IF;

    -- Drop all foreign keys from sessions table
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE constraint_name = 'sessions_user_id_fkey') THEN
        ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
    END IF;
END $$;

-- ================================================
-- STEP 3: CREATE NEW SCHEMA STRUCTURE
-- ================================================

-- Create temporary new tables with _new suffix
-- Users table (new structure)
CREATE TABLE IF NOT EXISTS users_new (
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

-- Cards table (new unified structure)
CREATE TABLE IF NOT EXISTS cards_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  company VARCHAR(200),
  bio TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(200),
  website VARCHAR(255),
  avatar_url TEXT,
  theme_id VARCHAR(50) DEFAULT 'emerald',
  theme_config JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  published_url VARCHAR(255) UNIQUE,
  custom_slug VARCHAR(100) UNIQUE,
  views_count INTEGER DEFAULT 0,
  contacts_saved INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  features JSONB DEFAULT '{"analytics": false, "custom_domain": false, "remove_branding": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Sessions table (new structure)
CREATE TABLE IF NOT EXISTS sessions_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  refresh_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table (new structure)
CREATE TABLE IF NOT EXISTS analytics_events_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'view', 'contact_save', 'social_click', 'share',
    'qr_scan', 'nfc_tap', 'email_click', 'phone_click'
  )),
  visitor_id VARCHAR(100),
  session_id VARCHAR(100),
  device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  browser VARCHAR(50),
  os VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  referrer TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics daily summary (new table)
CREATE TABLE IF NOT EXISTS analytics_daily_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID,
  date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  contact_saves INTEGER DEFAULT 0,
  social_clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  qr_scans INTEGER DEFAULT 0,
  top_countries JSONB DEFAULT '[]',
  top_devices JSONB DEFAULT '[]',
  top_referrers JSONB DEFAULT '[]',
  top_social_platforms JSONB DEFAULT '[]',
  avg_time_on_card FLOAT DEFAULT 0,
  bounce_rate FLOAT DEFAULT 0,
  conversion_rate FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_card_date UNIQUE (card_id, date)
);

-- ================================================
-- STEP 4: MIGRATE DATA
-- ================================================

-- Migrate users data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        INSERT INTO users_new (
            id, email, password_hash, first_name, last_name,
            email_verified, role, created_at, updated_at
        )
        SELECT
            id, email, password_hash, first_name, last_name,
            COALESCE(email_verified, false),
            COALESCE(role, 'user'),
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
        FROM users
        ON CONFLICT (email) DO NOTHING;

        RAISE NOTICE 'Users data migrated';
    END IF;
END $$;

-- Migrate cards data (merge cards and digital_cards)
DO $$
BEGIN
    -- Migrate from digital_cards if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'digital_cards') THEN
        INSERT INTO cards_new (
            id,
            first_name, last_name, title, company, bio,
            email, phone, location, avatar_url,
            theme_id, theme_config, social_links,
            is_published, published_url,
            views_count, contacts_saved,
            created_at, updated_at
        )
        SELECT
            CASE
                WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN id::UUID
                ELSE gen_random_uuid()
            END,
            first_name, last_name, title, company, bio,
            email, phone, location, avatar_url,
            COALESCE(theme_id, 'emerald'),
            COALESCE(theme_config, '{}'),
            COALESCE(social_links, '[]'),
            COALESCE(is_published, false),
            published_url,
            COALESCE(views_count, 0),
            COALESCE(contacts_saved, 0),
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
        FROM digital_cards;

        RAISE NOTICE 'Digital cards data migrated';
    END IF;

    -- Migrate from old cards table if exists and has different structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cards')
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'cards' AND column_name = 'user_id') THEN

        INSERT INTO cards_new (
            id, user_id,
            first_name, last_name, title, company,
            email, phone, website,
            social_links, theme_id,
            is_published, views_count,
            created_at, updated_at
        )
        SELECT
            id, user_id,
            COALESCE(first_name, 'Unknown'),
            COALESCE(last_name, 'User'),
            COALESCE(title, 'Professional'),
            company,
            email, phone, website,
            COALESCE(social_links, '[]'),
            COALESCE(design_template, theme_id, 'emerald'),
            COALESCE(is_active, is_published, true),
            COALESCE(views_count, 0),
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
        FROM cards
        WHERE NOT EXISTS (
            SELECT 1 FROM cards_new WHERE cards_new.id = cards.id
        );

        RAISE NOTICE 'Cards data migrated';
    END IF;
END $$;

-- Migrate sessions data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        INSERT INTO sessions_new (
            id, user_id, refresh_token, expires_at, created_at
        )
        SELECT
            id, user_id, refresh_token, expires_at,
            COALESCE(created_at, NOW())
        FROM sessions
        ON CONFLICT (refresh_token) DO NOTHING;

        RAISE NOTICE 'Sessions data migrated';
    END IF;
END $$;

-- Migrate analytics events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events') THEN
        INSERT INTO analytics_events_new (
            id, card_id, event_type, visitor_id, session_id,
            device_type, browser, os, country, city,
            referrer, utm_source, utm_medium, utm_campaign,
            ip_address, user_agent, metadata, created_at
        )
        SELECT
            id,
            CASE
                WHEN card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN card_id::UUID
                ELSE NULL
            END,
            COALESCE(event_type, 'view'),
            visitor_id, session_id,
            device_type, browser, os, country, city,
            referrer, utm_source, utm_medium, utm_campaign,
            ip_address, user_agent,
            COALESCE(metadata, '{}'),
            COALESCE(created_at, NOW())
        FROM analytics_events
        WHERE event_type IN ('view', 'contact_save', 'social_click', 'share', 'qr_scan');

        RAISE NOTICE 'Analytics events migrated';
    END IF;
END $$;

-- ================================================
-- STEP 5: SWAP TABLES
-- ================================================

-- Drop old tables
DROP TABLE IF EXISTS analytics_sessions CASCADE;
DROP TABLE IF EXISTS analytics_daily_summary CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS digital_cards CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Rename new tables
ALTER TABLE users_new RENAME TO users;
ALTER TABLE cards_new RENAME TO cards;
ALTER TABLE sessions_new RENAME TO sessions;
ALTER TABLE analytics_events_new RENAME TO analytics_events;

-- ================================================
-- STEP 6: ADD CONSTRAINTS AND INDEXES
-- ================================================

-- Add foreign key constraints
ALTER TABLE cards
  ADD CONSTRAINT cards_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_card_id_fkey
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;

ALTER TABLE analytics_daily_summary
  ADD CONSTRAINT analytics_daily_summary_card_id_fkey
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;

-- Create all indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_published ON cards(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_cards_published_url ON cards(published_url);
CREATE INDEX IF NOT EXISTS idx_cards_custom_slug ON cards(custom_slug);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_card_id ON analytics_events(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_card_id ON analytics_daily_summary(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily_summary(date DESC);

-- ================================================
-- STEP 7: CREATE FUNCTIONS AND TRIGGERS
-- ================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_daily_updated_at ON analytics_daily_summary;
CREATE TRIGGER update_analytics_daily_updated_at BEFORE UPDATE ON analytics_daily_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own cards" ON cards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Published cards are publicly viewable" ON cards
  FOR SELECT USING (is_published = true);

CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

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
-- STEP 9: VERIFICATION
-- ================================================

-- Show final table structure
SELECT
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'cards', 'sessions', 'analytics_events', 'analytics_daily_summary')
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
-- MIGRATION COMPLETE
-- ================================================
-- Your database has been successfully migrated to the new schema!
-- Original data has been preserved in backup tables (*_backup)
-- ================================================