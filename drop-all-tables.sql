-- ================================================
-- ELIMINAR TODAS LAS TABLAS EXISTENTES
-- ================================================

-- Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS analytics_daily_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS digital_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas RLS
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can manage own cards" ON cards;
DROP POLICY IF EXISTS "Published cards are publicly viewable" ON cards;
DROP POLICY IF EXISTS "Users can manage own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view analytics of own cards" ON analytics_events;
DROP POLICY IF EXISTS "Anyone can create analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can view analytics summary of own cards" ON analytics_daily_summary;

-- Eliminar todas las tablas (en orden correcto)
DROP TABLE IF EXISTS analytics_daily_summary CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS analytics_sessions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS digital_cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Eliminar tablas de backup si existen
DROP TABLE IF EXISTS users_backup CASCADE;
DROP TABLE IF EXISTS cards_backup CASCADE;
DROP TABLE IF EXISTS digital_cards_backup CASCADE;
DROP TABLE IF EXISTS analytics_events_backup CASCADE;
DROP TABLE IF EXISTS users_new CASCADE;
DROP TABLE IF EXISTS cards_new CASCADE;
DROP TABLE IF EXISTS sessions_new CASCADE;
DROP TABLE IF EXISTS analytics_events_new CASCADE;

-- Eliminar funciones si existen
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_card_view(UUID) CASCADE;
DROP FUNCTION IF EXISTS aggregate_daily_analytics(DATE) CASCADE;

-- Verificar que todo esté limpio
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'auth_%'
  AND table_name NOT LIKE 'storage_%'
  AND table_name NOT LIKE 'realtime_%'
  AND table_name NOT LIKE 'supabase_%';

-- Si devuelve filas, significa que aún hay tablas
-- Si está vacío, ¡perfecto! Base de datos limpia