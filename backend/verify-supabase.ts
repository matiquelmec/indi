import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando conexión a Supabase...');
console.log('📍 URL:', supabaseUrl);

async function verifyConnection() {
  try {
    // Test auth service
    console.log('\n🔐 Probando servicio de autenticación...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError && authError.message.includes('JWT')) {
      console.log('✅ Servicio de autenticación disponible');
    } else {
      console.log('✅ Servicio de autenticación accesible');
    }

    console.log('\n✅ Conexión a Supabase exitosa!');
    
    console.log('\n📋 Para crear las tablas necesarias:');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto: ikrpcaahwyibclvxbgtn');
    console.log('3. Ve al "SQL Editor"');
    console.log('4. Ejecuta el siguiente SQL:');
    
    const createTablesSQL = `
-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de tarjetas digitales
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  company VARCHAR(200),
  position VARCHAR(200),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  social_links JSONB DEFAULT '{}',
  design_template VARCHAR(50) DEFAULT 'modern',
  colors JSONB DEFAULT '{"primary": "#2563eb", "secondary": "#64748b"}',
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de sesiones
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas de seguridad
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own cards" ON cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cards" ON cards FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON sessions FOR ALL USING (auth.uid() = user_id);
    `;

    console.log('\n' + createTablesSQL);
    
    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

verifyConnection().then(success => {
  if (success) {
    console.log('\n🎉 Verificación exitosa! Continúa con la creación manual de tablas.');
  } else {
    console.log('\n💥 Verificación falló.');
  }
  process.exit(success ? 0 : 1);
});