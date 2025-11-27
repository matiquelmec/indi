const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createDemoCardsCorrectly() {
  const demoUserId = '23f71da9-1bac-4811-9456-50d5b7742567'; // ID real del usuario demo

  console.log('🎯 Creando tarjetas demo con estructura exacta...');

  try {
    // Tarjeta 1 - Elena Castillo (Psicóloga)
    const demoCard1 = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: demoUserId,
      first_name: 'Elena',
      last_name: 'Castillo',
      title: 'Psicóloga Clínica',
      company: 'Mente & Equilibrio',
      bio: 'Especialista en terapia cognitivo-conductual y manejo de ansiedad. Acompaño a mis pacientes en su proceso de transformación personal y bienestar emocional con un enfoque empático y profesional.',
      email: 'draelena@ejemplo.com',
      phone: '+56 9 1234 5678',
      location: 'Santiago, Chile',
      website: 'https://ejemplo.com',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
      theme_id: 'medical',
      theme_config: {
        brandColor: '#0d9488',
        atmosphere: 'clean',
        layout: 'centered'
      },
      social_links: [
        { id: '1', platform: 'linkedin', url: 'https://linkedin.com', label: 'LinkedIn', active: true },
        { id: '2', platform: 'whatsapp', url: 'https://wa.me/123456789', label: 'Agendar Cita', active: true },
        { id: '3', platform: 'instagram', url: 'https://instagram.com', label: 'Instagram', active: true },
        { id: '4', platform: 'website', url: 'https://ejemplo.com', label: 'Sitio Web', active: true }
      ],
      is_published: true,
      views_count: 25,
      contacts_saved: 5,
      shares_count: 3,
      is_active: true,
      plan_type: 'free',
      features: {}
    };

    const { data: card1, error: error1 } = await supabase
      .from('cards')
      .upsert(demoCard1)
      .select()
      .single();

    if (error1) {
      console.log('❌ Error tarjeta Elena:', error1.message);
    } else {
      console.log('✅ Tarjeta Elena creada:', card1.first_name, card1.last_name);
    }

    // Tarjeta 2 - Carlos Rodriguez (Desarrollador)
    const demoCard2 = {
      user_id: demoUserId,
      first_name: 'Carlos',
      last_name: 'Rodriguez',
      title: 'Desarrollador Full Stack',
      company: 'Tech Solutions',
      bio: 'Especialista en desarrollo web moderno con React, Node.js y TypeScript. Apasionado por crear experiencias digitales increíbles.',
      email: 'carlos@techsolutions.com',
      phone: '+56 9 8765 4321',
      location: 'Santiago, Chile',
      website: 'https://carlosrodriguez.dev',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400&h=400',
      theme_id: 'corporate',
      theme_config: {
        brandColor: '#3b82f6',
        atmosphere: 'glass',
        layout: 'modern'
      },
      social_links: [
        { id: '1', platform: 'linkedin', url: 'https://linkedin.com/in/carlos', label: 'LinkedIn', active: true },
        { id: '2', platform: 'github', url: 'https://github.com/carlos', label: 'GitHub', active: true },
        { id: '3', platform: 'twitter', url: 'https://twitter.com/carlos', label: 'Twitter', active: true },
        { id: '4', platform: 'website', url: 'https://carlosrodriguez.dev', label: 'Portfolio', active: true }
      ],
      is_published: true,
      views_count: 42,
      contacts_saved: 8,
      shares_count: 6,
      is_active: true,
      plan_type: 'free',
      features: {}
    };

    const { data: card2, error: error2 } = await supabase
      .from('cards')
      .insert(demoCard2)
      .select()
      .single();

    if (error2) {
      console.log('❌ Error tarjeta Carlos:', error2.message);
    } else {
      console.log('✅ Tarjeta Carlos creada:', card2.first_name, card2.last_name);
    }

    // Tarjeta 3 - Maria Silva (Marketing)
    const demoCard3 = {
      user_id: demoUserId,
      first_name: 'Maria',
      last_name: 'Silva',
      title: 'Especialista en Marketing Digital',
      company: 'Creative Agency',
      bio: 'Experta en estrategias de marketing digital, redes sociales y branding. Ayudo a empresas a conectar con su audiencia y crecer en el mundo digital.',
      email: 'maria@creativeagency.com',
      phone: '+56 9 5555 7777',
      location: 'Santiago, Chile',
      website: 'https://mariasilva.marketing',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?auto=format&fit=crop&q=80&w=400&h=400',
      theme_id: 'creative',
      theme_config: {
        brandColor: '#db2777',
        atmosphere: 'glass',
        layout: 'centered'
      },
      social_links: [
        { id: '1', platform: 'linkedin', url: 'https://linkedin.com/in/mariasilva', label: 'LinkedIn', active: true },
        { id: '2', platform: 'instagram', url: 'https://instagram.com/mariamarketing', label: 'Instagram', active: true },
        { id: '3', platform: 'website', url: 'https://mariasilva.marketing', label: 'Portfolio', active: true }
      ],
      is_published: true,
      views_count: 67,
      contacts_saved: 12,
      shares_count: 9,
      is_active: true,
      plan_type: 'free',
      features: {}
    };

    const { data: card3, error: error3 } = await supabase
      .from('cards')
      .insert(demoCard3)
      .select()
      .single();

    if (error3) {
      console.log('❌ Error tarjeta Maria:', error3.message);
    } else {
      console.log('✅ Tarjeta Maria creada:', card3.first_name, card3.last_name);
    }

    // Verificar resultado final
    console.log('\n🔍 Verificación final...');
    const { data: userCards, error: finalError } = await supabase
      .from('cards')
      .select('id, first_name, last_name, title, company, is_published')
      .eq('user_id', demoUserId);

    if (finalError) {
      console.log('❌ Error verificación:', finalError.message);
    } else {
      console.log('\n🎉 ÉXITO! Tarjetas del usuario demo:', userCards?.length || 0);
      if (userCards && userCards.length > 0) {
        userCards.forEach((card, index) => {
          console.log(`  ${index + 1}. ${card.first_name} ${card.last_name} - ${card.title}`);
          console.log(`     Empresa: ${card.company}`);
          console.log(`     Publicada: ${card.is_published ? '✅' : '❌'}`);
          console.log(`     ID: ${card.id}`);
          console.log('');
        });
      }
    }

    console.log('🚀 El usuario demo ahora debería funcionar en producción!');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

createDemoCardsCorrectly().then(() => {
  console.log('✨ Script completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en script:', error);
  process.exit(1);
});