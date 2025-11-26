require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createAnalyticsTable() {
  console.log('📊 Creando tabla analytics_events...');

  try {
    // Intentar crear la tabla usando RPC o directamente
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        metadata JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        user_agent TEXT,
        referrer VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Crear índices para mejor performance
      CREATE INDEX IF NOT EXISTS idx_analytics_card_id ON analytics_events(card_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
    `;

    // Para Supabase, podemos usar una función personalizada o intentar directamente
    // Primero veamos si la tabla existe
    const { data: existingData, error: checkError } = await supabase
      .from('analytics_events')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST105') {
      console.log('ℹ️ Tabla analytics_events no existe, necesita ser creada manualmente');
      console.log('📋 SQL para ejecutar en Supabase:');
      console.log(createTableSQL);
      console.log('\n🔧 Para crear la tabla:');
      console.log('1. Ir a https://supabase.com/dashboard/project/' + process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0]);
      console.log('2. Ir a SQL Editor');
      console.log('3. Ejecutar el SQL de arriba');
      console.log('4. Volver a ejecutar este script');
      return false;
    } else if (checkError) {
      console.log('❌ Error verificando tabla:', checkError);
      return false;
    } else {
      console.log('✅ Tabla analytics_events ya existe');
      console.log('📊 Registros actuales:', existingData?.length || 0);
      return true;
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    return false;
  }
}

// También vamos a verificar que tenemos todas las columnas necesarias en cards
async function verifyCardsTable() {
  console.log('\n🎴 Verificando tabla cards...');
  
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
      return false;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('✅ Tabla cards existe');
      console.log('📋 Columnas:', columns.join(', '));
      
      // Verificar que tenemos las columnas necesarias para métricas
      const requiredColumns = ['id', 'user_id', 'title', 'views_count'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️ Columnas faltantes:', missingColumns.join(', '));
        return false;
      } else {
        console.log('✅ Todas las columnas necesarias están presentes');
        return true;
      }
    } else {
      console.log('ℹ️ Tabla cards está vacía');
      return true;
    }

  } catch (error) {
    console.error('💥 Error verificando cards:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 VERIFICANDO ESTRUCTURA PARA MÉTRICAS\n');
  
  const cardsOk = await verifyCardsTable();
  const analyticsOk = await createAnalyticsTable();
  
  console.log('\n' + '='.repeat(40));
  if (cardsOk && analyticsOk) {
    console.log('✅ Estructura lista para métricas');
    console.log('🚀 Podemos continuar con el dashboard');
  } else {
    console.log('⚠️ Necesita configuración adicional');
    console.log('📝 Revisar mensajes de arriba');
  }
  console.log('='.repeat(40));
}

main();