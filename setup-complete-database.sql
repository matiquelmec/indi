-- ================================================
-- INDI Digital Card Platform - Complete Database Setup
-- Execute this SQL in your Supabase SQL Editor
-- ================================================

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',
  subscription_status VARCHAR(20) DEFAULT 'free',
  plan_type VARCHAR(20) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de tarjetas digitales
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
  published_url TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de sesiones para refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de analíticas
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- view, contact_save, social_click, etc.
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_published ON cards(is_published);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_card_id ON analytics_events(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para usuarios
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para tarjetas
CREATE POLICY "Users can manage own cards" ON cards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Published cards are publicly viewable" ON cards
  FOR SELECT USING (is_published = true);

-- Políticas para sesiones
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para analíticas
CREATE POLICY "Users can view analytics of own cards" ON analytics_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM cards WHERE id = analytics_events.card_id
    )
  );

CREATE POLICY "Anyone can create analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a las tablas que necesitan updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo (opcional)
INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
VALUES (
  'demo@indi.com',
  '$2b$10$example.hash.here',
  'Demo',
  'User',
  true
) ON CONFLICT (email) DO NOTHING;

-- Obtener el ID del usuario demo para insertar una tarjeta de ejemplo
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@indi.com';

    IF demo_user_id IS NOT NULL THEN
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
            is_published
        ) VALUES (
            demo_user_id,
            'Elena',
            'Castillo',
            'Psicóloga Clínica',
            'Mente & Equilibrio',
            'Especialista en terapia cognitivo-conductual y manejo de ansiedad. Acompaño a mis pacientes en su proceso de transformación personal y bienestar emocional.',
            'draelena@ejemplo.com',
            '+56 9 1234 5678',
            'Santiago, Chile',
            'medical',
            true
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Verificar que todo se creó correctamente
SELECT
  'users' as table_name,
  COUNT(*) as rows
FROM users
UNION ALL
SELECT
  'cards' as table_name,
  COUNT(*) as rows
FROM cards
UNION ALL
SELECT
  'sessions' as table_name,
  COUNT(*) as rows
FROM sessions
UNION ALL
SELECT
  'analytics_events' as table_name,
  COUNT(*) as rows
FROM analytics_events;