-- ================================================
-- INDI Digital Card Platform - Smart Database Setup
-- Handles existing constraints and objects gracefully
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',
  subscription_status VARCHAR(20) DEFAULT 'free',
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                   WHERE constraint_name = 'users_role_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('user', 'admin', 'premium'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                   WHERE constraint_name = 'users_subscription_status_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_subscription_status_check
        CHECK (subscription_status IN ('free', 'trial', 'pro', 'enterprise'));
    END IF;
END $$;

-- ================================================
-- CARDS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.cards (
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
  plan_type VARCHAR(20) DEFAULT 'free',
  features JSONB DEFAULT '{"analytics": false, "custom_domain": false, "remove_branding": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                   WHERE constraint_name = 'cards_plan_type_check') THEN
        ALTER TABLE cards ADD CONSTRAINT cards_plan_type_check
        CHECK (plan_type IN ('free', 'pro', 'enterprise'));
    END IF;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'cards_user_id_fkey') THEN
        ALTER TABLE cards ADD CONSTRAINT cards_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ================================================
-- SESSIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  refresh_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'sessions_user_id_fkey') THEN
        ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ================================================
-- ANALYTICS EVENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID,
  event_type VARCHAR(50) NOT NULL,
  visitor_id VARCHAR(100),
  session_id VARCHAR(100),
  device_type VARCHAR(20),
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

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                   WHERE constraint_name = 'analytics_events_event_type_check') THEN
        ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check
        CHECK (event_type IN ('view', 'contact_save', 'social_click', 'share', 'qr_scan', 'nfc_tap', 'email_click', 'phone_click'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
                   WHERE constraint_name = 'analytics_events_device_type_check') THEN
        ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_device_type_check
        CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'analytics_events_card_id_fkey') THEN
        ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_card_id_fkey
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ================================================
-- ANALYTICS DAILY SUMMARY TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.analytics_daily_summary (
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

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'analytics_daily_summary_card_id_fkey') THEN
        ALTER TABLE analytics_daily_summary ADD CONSTRAINT analytics_daily_summary_card_id_fkey
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ================================================
-- CREATE INDEXES (IF NOT EXISTS)
-- ================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Cards indexes
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_published ON cards(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_cards_published_url ON cards(published_url);
CREATE INDEX IF NOT EXISTS idx_cards_custom_slug ON cards(custom_slug);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Analytics Events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_card_id ON analytics_events(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Analytics Daily Summary indexes
CREATE INDEX IF NOT EXISTS idx_analytics_daily_card_id ON analytics_daily_summary(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily_summary(date DESC);

-- ================================================
-- CREATE FUNCTIONS (OR REPLACE)
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION increment_card_view(card_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE cards
    SET views_count = views_count + 1
    WHERE id = card_uuid;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- CREATE TRIGGERS (DROP AND RECREATE)
-- ================================================

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
-- ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;

-- ================================================
-- CREATE RLS POLICIES (DROP AND RECREATE)
-- ================================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Cards policies
DROP POLICY IF EXISTS "Users can manage own cards" ON cards;
CREATE POLICY "Users can manage own cards" ON cards
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Published cards are publicly viewable" ON cards;
CREATE POLICY "Published cards are publicly viewable" ON cards
  FOR SELECT USING (is_published = true);

-- Sessions policies
DROP POLICY IF EXISTS "Users can manage own sessions" ON sessions;
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- Analytics policies
DROP POLICY IF EXISTS "Users can view analytics of own cards" ON analytics_events;
CREATE POLICY "Users can view analytics of own cards" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cards
      WHERE cards.id = analytics_events.card_id
      AND cards.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can create analytics events" ON analytics_events;
CREATE POLICY "Anyone can create analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view analytics summary of own cards" ON analytics_daily_summary;
CREATE POLICY "Users can view analytics summary of own cards" ON analytics_daily_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cards
      WHERE cards.id = analytics_daily_summary.card_id
      AND cards.user_id = auth.uid()
    )
  );

-- ================================================
-- INSERT SAMPLE DATA
-- ================================================

-- Sample user
INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
VALUES (
  'demo@indi.com',
  '$2b$10$YourHashedPasswordHere',
  'Demo',
  'User',
  true
) ON CONFLICT (email) DO NOTHING;

-- ================================================
-- VERIFICATION
-- ================================================

-- Show table structure
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
-- SETUP COMPLETE!
-- ================================================