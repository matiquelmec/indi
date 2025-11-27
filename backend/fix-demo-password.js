require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixDemoPassword() {
  console.log('🔧 Corrigiendo password del usuario demo...');

  // Generar hash correcto para "demo123"
  const correctHash = await bcrypt.hash('demo123', 12);
  console.log('✅ Hash generado para "demo123"');

  try {
    // Actualizar el usuario demo con el hash correcto
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password_hash: correctHash,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'demo@indi.com')
      .select();

    if (error) {
      console.error('❌ Error actualizando usuario:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Usuario demo actualizado:', data[0].email);
      console.log('📧 Email: demo@indi.com');
      console.log('🔑 Password: demo123');
      console.log('🎉 ¡Usuario demo listo para usar!');
    } else {
      console.log('❌ No se encontró el usuario demo en la base de datos');
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

fixDemoPassword();