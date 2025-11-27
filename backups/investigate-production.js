const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function investigateProductionCards() {
  console.log('🔍 Investigando TODAS las tarjetas en producción...');
  console.log('URL Frontend: https://frontindi.vercel.app/');

  try {
    // 1. Ver TODAS las tarjetas en la BD
    const { data: allCards, error: allError } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log('❌ Error obteniendo tarjetas:', allError.message);
      return;
    }

    console.log('\n📊 TOTAL DE TARJETAS EN BD:', allCards?.length || 0);

    if (allCards && allCards.length > 0) {
      console.log('\n📋 LISTA COMPLETA DE TARJETAS:');
      allCards.forEach((card, index) => {
        console.log(`\n${index + 1}. ${card.first_name} ${card.last_name}`);
        console.log(`   Email: ${card.email}`);
        console.log(`   Empresa: ${card.company}`);
        console.log(`   User ID: ${card.user_id || 'NULL'}`);
        console.log(`   Creada: ${card.created_at}`);
        console.log(`   Publicada: ${card.is_published ? 'SI' : 'NO'}`);
        console.log(`   Vistas: ${card.views_count || 0}`);
        console.log(`   ID: ${card.id}`);
      });

      // 2. Analizar problemas comunes
      const publishedCards = allCards.filter(c => c.is_published);
      const cardsWithoutUser = allCards.filter(c => !c.user_id);
      const cardsWithUser = allCards.filter(c => c.user_id);

      console.log('\n🔍 ANÁLISIS:');
      console.log(`Total tarjetas: ${allCards.length}`);
      console.log(`Tarjetas publicadas: ${publishedCards.length}`);
      console.log(`Sin publicar: ${allCards.length - publishedCards.length}`);
      console.log(`Con user_id: ${cardsWithUser.length}`);
      console.log(`Sin user_id (NULL): ${cardsWithoutUser.length}`);

      if (cardsWithoutUser.length > 0) {
        console.log('\n⚠️ PROBLEMA DETECTADO: Hay tarjetas con user_id NULL');
        console.log('Estas tarjetas probablemente no aparecen en el frontend');

        console.log('\nTarjetas sin user_id:');
        cardsWithoutUser.forEach(card => {
          console.log(`- ${card.first_name} ${card.last_name} (ID: ${card.id})`);
        });
      }

      // 3. Ver usuarios únicos
      const uniqueUserIds = [...new Set(allCards.map(c => c.user_id).filter(Boolean))];
      console.log(`\nUsuarios únicos con tarjetas: ${uniqueUserIds.length}`);
      uniqueUserIds.forEach((userId, i) => {
        const userCards = allCards.filter(c => c.user_id === userId);
        console.log(`  ${i + 1}. ${userId} - ${userCards.length} tarjetas`);
      });

      // 4. Verificar endpoint público
      console.log('\n🌐 PROBANDO ENDPOINT /api/cards...');
      const { data: publicCards, error: publicError } = await supabase
        .from('cards')
        .select('*')
        .eq('is_published', true);

      if (publicError) {
        console.log('❌ Error en endpoint público:', publicError.message);
      } else {
        console.log(`✅ Tarjetas públicas encontradas: ${publicCards?.length || 0}`);
      }

    } else {
      console.log('❌ No se encontraron tarjetas en la base de datos');
    }

  } catch (error) {
    console.error('💥 Error en investigación:', error);
  }
}

investigateProductionCards().then(() => {
  console.log('\n✅ Investigación completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});