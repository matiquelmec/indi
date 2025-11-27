-- SCRIPT DE OPTIMIZACIÓN PARA BASE DE DATOS INDI
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. CREAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_is_published ON cards(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_card_id ON analytics_events(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);

-- 2. AGREGAR CONSTRAINTS FALTANTES
ALTER TABLE cards
ADD CONSTRAINT fk_cards_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. CORREGIR DATOS HUÉRFANOS (CRÍTICO)
-- Opción A: Asignar al usuario demo
UPDATE cards
SET user_id = '23f71da9-1bac-4811-9456-50d5b7742567'
WHERE user_id IS NULL;

-- Opción B: Crear usuario para cards huérfanas (si no existe el demo user)
-- INSERT INTO users (id, email, first_name, last_name, password_hash)
-- VALUES ('23f71da9-1bac-4811-9456-50d5b7742567', 'demo@indi.com', 'Demo', 'User', 'demo_hash')
-- ON CONFLICT (id) DO NOTHING;

-- 4. GENERAR SLUGS FALTANTES PARA CARDS PUBLICADAS
UPDATE cards
SET custom_slug = LOWER(REPLACE(REPLACE(first_name || '-' || last_name, ' ', '-'), '.', ''))
WHERE is_published = true AND custom_slug IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL;

-- 5. GENERAR URLs PUBLICADAS
UPDATE cards
SET published_url = 'https://indi-frontend.vercel.app/u/' || custom_slug
WHERE is_published = true AND custom_slug IS NOT NULL AND published_url IS NULL;

-- 6. ESTABLECER PUBLISHED_AT PARA CARDS YA PUBLICADAS
UPDATE cards
SET published_at = created_at
WHERE is_published = true AND published_at IS NULL;

-- 7. AGREGAR POLÍTICA RLS (Row Level Security)
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own cards" ON cards
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public can view published cards" ON cards
FOR SELECT USING (is_published = true);

-- 8. VERIFICAR INTEGRIDAD
-- SELECT
--   (SELECT COUNT(*) FROM cards WHERE user_id IS NULL) AS orphaned_cards,
--   (SELECT COUNT(*) FROM cards WHERE is_published = true AND custom_slug IS NULL) AS published_without_slug,
--   (SELECT COUNT(*) FROM cards WHERE is_published = true AND published_url IS NULL) AS published_without_url;