-- ============================================================
-- INDI PLATFORM - DATABASE REBUILD COMPLETE
-- Creado por: Senior DBA - Optimización Total
-- Fecha: 2025-11-27
-- ============================================================

-- 1. LIMPIAR TODO (RESET COMPLETO)
-- ============================================================

-- Deshabilitar RLS temporalmente para limpieza
ALTER TABLE IF EXISTS cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_events DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can only see their own cards" ON cards;
DROP POLICY IF EXISTS "Public can view published cards" ON cards;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Analytics access by user" ON analytics_events;

-- Eliminar constraints y índices
DROP INDEX IF EXISTS idx_cards_user_id;
DROP INDEX IF EXISTS idx_cards_is_published;
DROP INDEX IF EXISTS idx_cards_created_at;
DROP INDEX IF EXISTS idx_cards_custom_slug;
DROP INDEX IF EXISTS idx_analytics_card_id;
DROP INDEX IF EXISTS idx_analytics_event_type;
DROP INDEX IF EXISTS idx_analytics_created_at;
DROP INDEX IF EXISTS idx_users_email;

-- Eliminar foreign keys
ALTER TABLE IF EXISTS cards DROP CONSTRAINT IF EXISTS fk_cards_user_id;
ALTER TABLE IF EXISTS analytics_events DROP CONSTRAINT IF EXISTS fk_analytics_card_id;

-- Limpiar datos existentes
TRUNCATE TABLE analytics_events CASCADE;
TRUNCATE TABLE cards CASCADE;
TRUNCATE TABLE users CASCADE;

-- 2. RECREAR ESTRUCTURA OPTIMIZADA
-- ============================================================

-- Tabla USERS - Optimizada
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla CARDS - Schema Completo y Optimizado
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Información Personal
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(200),
    company VARCHAR(200),
    bio TEXT,

    -- Contacto
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(200),
    website VARCHAR(500),

    -- Media
    avatar_url VARCHAR(1000) DEFAULT 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',

    -- Tema y Configuración
    theme_id VARCHAR(50) DEFAULT 'emerald',
    theme_config JSONB DEFAULT '{"brandColor": "#10b981"}',

    -- Enlaces Sociales
    social_links JSONB DEFAULT '[]',

    -- Publicación
    is_published BOOLEAN DEFAULT false,
    published_url VARCHAR(1000),
    custom_slug VARCHAR(200) UNIQUE,
    published_at TIMESTAMPTZ,

    -- Analytics
    views_count INTEGER DEFAULT 0,
    contacts_saved INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,

    -- Estado y Plan
    is_active BOOLEAN DEFAULT true,
    plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
    features JSONB DEFAULT '{"analytics": false, "custom_domain": false, "remove_branding": false}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_website_format CHECK (website IS NULL OR website ~* '^https?://'),
    CONSTRAINT chk_views_positive CHECK (views_count >= 0),
    CONSTRAINT chk_contacts_positive CHECK (contacts_saved >= 0),
    CONSTRAINT chk_shares_positive CHECK (shares_count >= 0)
);

-- Tabla ANALYTICS_EVENTS - Tracking Completo
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'contact_save', 'social_click', 'share', 'download')),

    -- Metadata del evento
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(1000),
    metadata JSONB DEFAULT '{}',

    -- Geolocalización (opcional)
    country VARCHAR(2),
    city VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ÍNDICES OPTIMIZADOS PARA PERFORMANCE
-- ============================================================

-- Índices principales para USERS
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Índices principales para CARDS
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_is_published ON cards(is_published) WHERE is_published = true;
CREATE INDEX idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX idx_cards_custom_slug ON cards(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX idx_cards_plan_type ON cards(plan_type);
CREATE INDEX idx_cards_views_count ON cards(views_count DESC) WHERE views_count > 0;

-- Índices compuestos para queries frecuentes
CREATE INDEX idx_cards_user_published ON cards(user_id, is_published);
CREATE INDEX idx_cards_user_created ON cards(user_id, created_at DESC);

-- Índices para ANALYTICS
CREATE INDEX idx_analytics_card_id ON analytics_events(card_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_card_type_date ON analytics_events(card_id, event_type, created_at DESC);

-- Índices para búsqueda de texto
CREATE INDEX idx_cards_search_name ON cards USING gin(to_tsvector('spanish', first_name || ' ' || last_name));
CREATE INDEX idx_cards_search_content ON cards USING gin(to_tsvector('spanish', coalesce(bio, '') || ' ' || coalesce(company, '')));

-- 4. ROW LEVEL SECURITY (RLS) OPTIMIZADO
-- ============================================================

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para CARDS
CREATE POLICY "Users can manage own cards" ON cards
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view published cards" ON cards
    FOR SELECT USING (is_published = true);

-- Políticas para ANALYTICS
CREATE POLICY "Users can view own card analytics" ON analytics_events
    FOR SELECT USING (
        card_id IN (SELECT id FROM cards WHERE user_id = auth.uid())
    );

CREATE POLICY "System can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- 5. TRIGGERS PARA AUTOMATIZACIÓN
-- ============================================================

-- Función para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar slug automático
CREATE OR REPLACE FUNCTION generate_card_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_published = true AND NEW.custom_slug IS NULL THEN
        NEW.custom_slug := lower(
            regexp_replace(
                regexp_replace(
                    trim(coalesce(NEW.first_name, '') || '-' || coalesce(NEW.last_name, '')),
                    '[^a-zA-Z0-9\s-]', '', 'g'
                ),
                '\s+', '-', 'g'
            )
        );

        -- Generar URL publicada
        NEW.published_url := 'https://indi-frontend.vercel.app/u/' || NEW.custom_slug;

        -- Establecer fecha de publicación
        IF NEW.published_at IS NULL THEN
            NEW.published_at := now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para slug automático
CREATE TRIGGER auto_generate_card_slug
    BEFORE INSERT OR UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION generate_card_slug();

-- 6. DATOS DE DEMO OPTIMIZADOS
-- ============================================================

-- Insertar usuario demo
INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES
('23f71da9-1bac-4811-9456-50d5b7742567', 'demo@indi.com', 'demo_hash_secure', 'Demo', 'User'),
('550e8400-e29b-41d4-a716-446655440000', 'admin@indi.com', 'admin_hash_secure', 'Admin', 'System');

-- Insertar cards de demo con datos completos
INSERT INTO cards (
    id, user_id, first_name, last_name, title, company, bio, email, phone, location, website,
    theme_id, theme_config, social_links, is_published, views_count, contacts_saved, shares_count,
    plan_type, features
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    '23f71da9-1bac-4811-9456-50d5b7742567',
    'Matías', 'Riquelme',
    'Full Stack Developer', 'Tech Innovation',
    'Desarrollador apasionado por crear soluciones digitales innovadoras. Especializado en React, Node.js y arquitecturas modernas.',
    'matias@techinnovation.cl', '+56 9 8765 4321', 'Santiago, Chile', 'https://matiasriquelme.dev',
    'corporate', '{"brandColor": "#3b82f6", "layout": "modern", "atmosphere": "glass"}',
    '[
        {"id": "1", "url": "https://linkedin.com/in/matiasriquelme", "label": "LinkedIn", "platform": "linkedin", "active": true},
        {"id": "2", "url": "https://github.com/matiasriquelme", "label": "GitHub", "platform": "github", "active": true},
        {"id": "3", "url": "https://twitter.com/matiasriquelme", "label": "Twitter", "platform": "twitter", "active": true}
    ]',
    true, 45, 8, 3, 'pro',
    '{"analytics": true, "custom_domain": true, "remove_branding": true}'
),
(
    '22222222-2222-2222-2222-222222222222',
    '23f71da9-1bac-4811-9456-50d5b7742567',
    'Elena', 'Castillo',
    'Psicóloga Clínica', 'Mente & Equilibrio',
    'Especialista en terapia cognitivo-conductual y manejo de ansiedad. Acompaño a mis pacientes hacia el bienestar emocional.',
    'elena@menteyequilibrio.cl', '+56 9 1234 5678', 'Valparaíso, Chile', 'https://menteyequilibrio.cl',
    'medical', '{"brandColor": "#0d9488", "layout": "centered", "atmosphere": "clean"}',
    '[
        {"id": "1", "url": "https://linkedin.com/in/elenacastillo", "label": "LinkedIn", "platform": "linkedin", "active": true},
        {"id": "2", "url": "https://wa.me/56912345678", "label": "Agendar Cita", "platform": "whatsapp", "active": true},
        {"id": "3", "url": "https://instagram.com/dra.elena", "label": "Instagram", "platform": "instagram", "active": true}
    ]',
    true, 32, 12, 5, 'free',
    '{"analytics": false, "custom_domain": false, "remove_branding": false}'
),
(
    '33333333-3333-3333-3333-333333333333',
    '550e8400-e29b-41d4-a716-446655440000',
    'Carlos', 'Rodriguez',
    'Diseñador UX/UI', 'Creative Studio',
    'Diseñador con 8 años de experiencia creando interfaces que conectan con los usuarios. Especialista en design systems.',
    'carlos@creativestudio.cl', '+56 9 9876 5432', 'Concepción, Chile', 'https://carlosrodriguez.design',
    'creative', '{"brandColor": "#8b5cf6", "layout": "portfolio", "atmosphere": "vibrant"}',
    '[
        {"id": "1", "url": "https://behance.net/carlosrodriguez", "label": "Behance", "platform": "behance", "active": true},
        {"id": "2", "url": "https://dribbble.com/carlosrodriguez", "label": "Dribbble", "platform": "dribbble", "active": true},
        {"id": "3", "url": "https://linkedin.com/in/carlosrodriguez", "label": "LinkedIn", "platform": "linkedin", "active": true}
    ]',
    true, 28, 6, 2, 'free',
    '{"analytics": false, "custom_domain": false, "remove_branding": false}'
);

-- Insertar analytics realistas
INSERT INTO analytics_events (card_id, event_type, ip_address, user_agent, country, city)
SELECT
    (ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'])[ceil(random() * 3)]::uuid,
    (ARRAY['view', 'contact_save', 'social_click'])[ceil(random() * 3)],
    ('192.168.1.' || ceil(random() * 255)::text)::inet,
    'Mozilla/5.0 (compatible; IndiAnalytics/1.0)',
    'CL',
    (ARRAY['Santiago', 'Valparaíso', 'Concepción', 'La Serena'])[ceil(random() * 4)]
FROM generate_series(1, 150);

-- 7. FUNCIONES ÚTILES PARA LA APLICACIÓN
-- ============================================================

-- Función para obtener estadísticas de una card
CREATE OR REPLACE FUNCTION get_card_stats(card_uuid UUID)
RETURNS TABLE(
    total_views BIGINT,
    total_contacts BIGINT,
    total_social_clicks BIGINT,
    today_views BIGINT,
    this_week_views BIGINT,
    conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE event_type = 'view') as total_views,
        COUNT(*) FILTER (WHERE event_type = 'contact_save') as total_contacts,
        COUNT(*) FILTER (WHERE event_type = 'social_click') as total_social_clicks,
        COUNT(*) FILTER (WHERE event_type = 'view' AND created_at::date = CURRENT_DATE) as today_views,
        COUNT(*) FILTER (WHERE event_type = 'view' AND created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week_views,
        CASE
            WHEN COUNT(*) FILTER (WHERE event_type = 'view') > 0
            THEN ROUND((COUNT(*) FILTER (WHERE event_type = 'contact_save')::DECIMAL / COUNT(*) FILTER (WHERE event_type = 'view')) * 100, 2)
            ELSE 0
        END as conversion_rate
    FROM analytics_events
    WHERE card_id = card_uuid;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar cards por texto
CREATE OR REPLACE FUNCTION search_cards(search_text TEXT)
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    title TEXT,
    company TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        (c.first_name || ' ' || c.last_name) as full_name,
        c.title,
        c.company,
        ts_rank(to_tsvector('spanish', c.first_name || ' ' || c.last_name || ' ' || coalesce(c.bio, '') || ' ' || coalesce(c.company, '')), plainto_tsquery('spanish', search_text)) as rank
    FROM cards c
    WHERE
        c.is_published = true
        AND to_tsvector('spanish', c.first_name || ' ' || c.last_name || ' ' || coalesce(c.bio, '') || ' ' || coalesce(c.company, '')) @@ plainto_tsquery('spanish', search_text)
    ORDER BY rank DESC, c.views_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. VERIFICACIÓN FINAL
-- ============================================================

-- Verificar integridad
SELECT
    'Database rebuild completed successfully!' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM cards) as total_cards,
    (SELECT COUNT(*) FROM analytics_events) as total_analytics,
    (SELECT COUNT(*) FROM cards WHERE user_id IS NULL) as orphaned_cards;

-- ============================================================
-- FIN DEL SCRIPT DE OPTIMIZACIÓN COMPLETA
-- Base de datos lista para producción enterprise
-- ============================================================