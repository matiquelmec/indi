-- ============================================================
-- INDI PLATFORM - DATABASE REBUILD FIXED
-- Versión corregida sin errores
-- ============================================================

-- 1. LIMPIAR TODO (RESET COMPLETO)
-- ============================================================

-- Limpiar datos existentes (mantener estructura)
DELETE FROM analytics_events;
DELETE FROM cards;
DELETE FROM users;

-- 2. CREAR ÍNDICES OPTIMIZADOS (Si no existen)
-- ============================================================

-- Índices para USERS
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Índices para CARDS
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_is_published ON cards(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_custom_slug ON cards(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_plan_type ON cards(plan_type);
CREATE INDEX IF NOT EXISTS idx_cards_views_count ON cards(views_count DESC) WHERE views_count > 0;

-- Índices compuestos para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_cards_user_published ON cards(user_id, is_published);
CREATE INDEX IF NOT EXISTS idx_cards_user_created ON cards(user_id, created_at DESC);

-- Índices para ANALYTICS
CREATE INDEX IF NOT EXISTS idx_analytics_card_id ON analytics_events(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_card_type_date ON analytics_events(card_id, event_type, created_at DESC);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can manage own cards" ON cards;
DROP POLICY IF EXISTS "Public can view published cards" ON cards;
DROP POLICY IF EXISTS "Users can view own card analytics" ON analytics_events;
DROP POLICY IF EXISTS "System can insert analytics" ON analytics_events;

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

-- 4. INSERTAR DATOS DE DEMO OPTIMIZADOS
-- ============================================================

-- Insertar usuarios demo
INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES
('23f71da9-1bac-4811-9456-50d5b7742567', 'demo@indi.com', 'demo_hash_secure', 'Demo', 'User'),
('550e8400-e29b-41d4-a716-446655440000', 'admin@indi.com', 'admin_hash_secure', 'Admin', 'System');

-- Insertar cards de demo con datos completos
INSERT INTO cards (
    id, user_id, first_name, last_name, title, company, bio, email, phone, location, website,
    theme_id, theme_config, social_links, is_published, custom_slug, published_url, published_at,
    views_count, contacts_saved, shares_count, plan_type, features
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
    true, 'matias-riquelme', 'https://indi-frontend.vercel.app/u/matias-riquelme', now(),
    45, 8, 3, 'pro',
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
    true, 'elena-castillo', 'https://indi-frontend.vercel.app/u/elena-castillo', now(),
    32, 12, 5, 'free',
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
    true, 'carlos-rodriguez', 'https://indi-frontend.vercel.app/u/carlos-rodriguez', now(),
    28, 6, 2, 'free',
    '{"analytics": false, "custom_domain": false, "remove_branding": false}'
);

-- 5. INSERTAR ANALYTICS REALISTAS
-- ============================================================

-- Generar eventos de analytics realistas
INSERT INTO analytics_events (card_id, event_type, ip_address, user_agent, country, city, created_at)
SELECT
    (ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'])[ceil(random() * 3)]::uuid,
    (ARRAY['view', 'contact_save', 'social_click'])[ceil(random() * 3)],
    ('192.168.1.' || ceil(random() * 255)::text)::inet,
    'Mozilla/5.0 (compatible; IndiAnalytics/1.0)',
    'CL',
    (ARRAY['Santiago', 'Valparaíso', 'Concepción', 'La Serena'])[ceil(random() * 4)],
    now() - interval '1 day' * random() * 7
FROM generate_series(1, 150);

-- 6. VERIFICACIÓN FINAL
-- ============================================================

-- Mostrar resumen final
SELECT
    'Database rebuild completed successfully!' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM cards) as total_cards,
    (SELECT COUNT(*) FROM analytics_events) as total_analytics,
    (SELECT COUNT(*) FROM cards WHERE user_id IS NULL) as orphaned_cards;

-- ============================================================
-- FIN DEL SCRIPT DE OPTIMIZACIÓN CORREGIDO
-- ============================================================