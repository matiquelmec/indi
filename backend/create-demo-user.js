require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createDemoUser() {
  console.log('🎭 Creando usuario de demo...');

  const demoUser = {
    id: uuidv4(),
    email: 'demo@indi.com',
    password_hash: await bcrypt.hash('demo123', 12),
    first_name: 'Elena',
    last_name: 'Castillo',
    email_verified: true,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // Insertar usuario demo
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert(demoUser)
      .select();

    if (userError) {
      console.error('❌ Error creando usuario:', userError);
      return;
    }

    console.log('✅ Usuario demo creado:', userData[0].email);

    // Crear tarjeta demo para el usuario
    const demoCard = {
      id: uuidv4(),
      user_id: demoUser.id,
      first_name: 'Elena',
      last_name: 'Castillo',
      title: 'Psicóloga Clínica',
      company: 'Mente & Equilibrio',
      bio: 'Especialista en terapia cognitivo-conductual y manejo de ansiedad. Acompaño a mis pacientes en su proceso de transformación personal y bienestar emocional con un enfoque empático y profesional.',
      email: 'dra.elena@menteequilibrio.cl',
      phone: '+56 9 1234 5678',
      location: 'Santiago, Chile',
      website: 'https://menteequilibrio.cl',
      theme_id: 'professional-blue',
      slug: 'elena-castillo-psicologa',
      is_published: true,
      views_count: 47,
      social_links: JSON.stringify([
        {
          platform: 'linkedin',
          url: 'https://linkedin.com/in/elena-castillo',
          icon: 'LinkedIn'
        },
        {
          platform: 'instagram', 
          url: 'https://instagram.com/dra.elena.psicologa',
          icon: 'Instagram'
        },
        {
          platform: 'whatsapp',
          url: 'https://wa.me/56912345678',
          icon: 'WhatsApp'
        }
      ]),
      theme_config: JSON.stringify({
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter'
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .upsert(demoCard)
      .select();

    if (cardError) {
      console.error('❌ Error creando tarjeta:', cardError);
    } else {
      console.log('✅ Tarjeta demo creada:', cardData[0].slug);
    }

    // Crear algunas analíticas demo
    const demoAnalytics = [
      {
        id: uuidv4(),
        card_id: demoCard.id,
        event_type: 'view',
        metadata: JSON.stringify({ source: 'qr_code', device: 'mobile' }),
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: uuidv4(), 
        card_id: demoCard.id,
        event_type: 'contact_save',
        metadata: JSON.stringify({ format: 'vcard' }),
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      },
      {
        id: uuidv4(),
        card_id: demoCard.id, 
        event_type: 'social_click',
        metadata: JSON.stringify({ platform: 'linkedin' }),
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        created_at: new Date(Date.now() - 10800000).toISOString() // 3 hours ago
      }
    ];

    const { data: analyticsData, error: analyticsError } = await supabase
      .from('analytics_events')
      .upsert(demoAnalytics);

    if (analyticsError) {
      console.error('❌ Error creando analíticas:', analyticsError);
    } else {
      console.log('✅ Analíticas demo creadas');
    }

    console.log('\n🎉 ¡Usuario demo completamente configurado!');
    console.log('📧 Email: demo@indi.com');
    console.log('🔑 Password: demo123');
    console.log('🌐 Tarjeta pública: /elena-castillo-psicologa');
    console.log('📊 Con datos de analíticas reales');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

createDemoUser();