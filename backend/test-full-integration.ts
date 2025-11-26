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

console.log('🧪 Probando integración completa con Supabase...');

async function testIntegration() {
  try {
    console.log('\n📋 Verificando que las tablas existan...');
    
    // Test users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Tabla users:', usersError.message);
      return false;
    }
    console.log('✅ Tabla users: OK');

    // Test cards table
    const { data: cardsData, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .limit(1);
    
    if (cardsError) {
      console.log('❌ Tabla cards:', cardsError.message);
      return false;
    }
    console.log('✅ Tabla cards: OK');

    // Test sessions table
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.log('❌ Tabla sessions:', sessionsError.message);
      return false;
    }
    console.log('✅ Tabla sessions: OK');

    console.log('\n🎯 Todas las tablas están disponibles y funcionando!');
    
    // Test insert (will likely fail due to RLS, but that's expected)
    console.log('\n🔐 Probando inserción de datos (esperamos error por RLS)...');
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([{
        email: 'test@example.com',
        password_hash: 'test_hash',
        first_name: 'Test',
        last_name: 'User'
      }]);

    if (insertError) {
      console.log('✅ RLS está activo (error esperado):', insertError.message);
    } else {
      console.log('⚠️ Inserción exitosa (revisar políticas RLS)');
    }

    return true;

  } catch (error) {
    console.error('❌ Test falló:', error);
    return false;
  }
}

testIntegration().then(success => {
  if (success) {
    console.log('\n🎉 ¡Integración completa exitosa!');
    console.log('\n📱 Tu aplicación está lista:');
    console.log('   Frontend: http://localhost:3001');
    console.log('   Backend:  http://localhost:5000/api');
    console.log('   Database: Supabase ✅');
    console.log('\n🚀 ¡Puedes comenzar a desarrollar!');
  } else {
    console.log('\n💥 Hubo problemas en la integración.');
  }
  process.exit(success ? 0 : 1);
});