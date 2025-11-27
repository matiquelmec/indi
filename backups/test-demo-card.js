require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testUserAndCard() {
  console.log('🧪 Probando crear tarjeta simple...');
  
  try {
    // Primero verificar que el usuario existe
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'demo@indi.com')
      .single();
    
    if (userError || !userData) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', userData.email);
    console.log('👤 ID usuario:', userData.id);

    // Crear tarjeta simple (según schema real)
    const simpleCard = {
      id: uuidv4(),
      user_id: userData.id,
      title: 'Dra. Elena Castillo - Psicóloga Clínica',
      description: 'Especialista en terapia cognitivo-conductual y manejo de ansiedad. Acompaño a mis pacientes en su proceso de transformación personal.',
      company: 'Mente & Equilibrio',
      position: 'Psicóloga Clínica',
      phone: '+56 9 1234 5678',
      email: 'dra.elena@menteequilibrio.cl',
      website: 'https://menteequilibrio.cl',
      social_links: {
        linkedin: 'https://linkedin.com/in/elena-castillo',
        instagram: 'https://instagram.com/dra.elena.psicologa',
        whatsapp: 'https://wa.me/56912345678'
      },
      design_template: 'professional',
      colors: {
        primary: '#2563eb',
        secondary: '#64748b'
      },
      is_active: true,
      views_count: 47,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .insert(simpleCard)
      .select();

    if (cardError) {
      console.log('❌ Error creando tarjeta:', cardError);
      console.log('🔍 Detalles:', cardError.message);
    } else {
      console.log('✅ Tarjeta creada exitosamente!');
      console.log('📱 ID tarjeta:', cardData[0].id);
      console.log('👤 Título:', cardData[0].title);
      
      console.log('\n🎉 ¡Demo completo listo para probar!');
      console.log('📧 Login: demo@indi.com');
      console.log('🔑 Password: demo123');
      console.log('🌐 Ver tarjeta por ID:', cardData[0].id);
    }

  } catch (err) {
    console.error('💥 Error:', err.message);
  }
}

testUserAndCard();