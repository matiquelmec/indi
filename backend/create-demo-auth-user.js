require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createDemoAuthUser() {
  console.log('🎭 Creando usuario demo en Supabase Auth...');

  try {
    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'demo@indi.com',
      password: 'demo123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Elena',
        last_name: 'Castillo',
        full_name: 'Elena Castillo'
      }
    });

    if (error) {
      console.error('❌ Error creando usuario en Auth:', error);
      return;
    }

    console.log('✅ Usuario demo creado en Supabase Auth');
    console.log('👤 User ID:', data.user.id);
    console.log('📧 Email:', data.user.email);
    console.log('📧 Email confirmado:', data.user.email_confirmed_at ? 'Sí' : 'No');

    // Ahora actualizar/crear el usuario en la tabla users con el mismo ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id, // Usar el mismo ID del Auth
        email: 'demo@indi.com',
        first_name: 'Elena',
        last_name: 'Castillo',
        email_verified: true,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (userError) {
      console.error('❌ Error actualizando tabla users:', userError);
    } else {
      console.log('✅ Usuario sincronizado en tabla users');
    }

    console.log('\n🎉 ¡Usuario demo completamente configurado!');
    console.log('📧 Email: demo@indi.com');
    console.log('🔑 Password: demo123');
    console.log('🔐 Creado en Supabase Auth + tabla users');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

createDemoAuthUser();