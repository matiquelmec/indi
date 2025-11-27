const axios = require('axios');

async function testAnalyticsEndpoints() {
  console.log('🔍 PROBANDO ENDPOINTS DE ANALYTICS\n');

  const baseURL = 'http://localhost:3001';
  const cardId = 'c3140e8f-999a-41ef-b755-1dc4519afb9e';

  const tests = [
    {
      name: 'Health Check',
      url: `${baseURL}/api/health`,
      method: 'GET'
    },
    {
      name: 'Dashboard Overview',
      url: `${baseURL}/api/analytics/dashboard/overview`,
      method: 'GET'
    },
    {
      name: 'Detailed Card Analytics',
      url: `${baseURL}/api/analytics/cards/${cardId}/detailed`,
      method: 'GET'
    },
    {
      name: 'Real-time Metrics',
      url: `${baseURL}/api/analytics/realtime/${cardId}`,
      method: 'GET'
    },
    {
      name: 'Cards List',
      url: `${baseURL}/api/cards`,
      method: 'GET'
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`📊 Testing: ${test.name}...`);
      const response = await axios.get(test.url, { timeout: 5000 });
      
      console.log(`✅ ${test.name}: Status ${response.status}`);
      
      if (test.name === 'Dashboard Overview' && response.data.overview) {
        console.log(`   📈 Total Views: ${response.data.overview.totalViews}`);
        console.log(`   📧 Total Contacts: ${response.data.overview.totalContacts}`);
        console.log(`   💫 Conversion Rate: ${response.data.overview.conversionRate}%`);
      }
      
      if (test.name === 'Real-time Metrics' && response.data.activeVisitors) {
        console.log(`   👥 Active Visitors: ${response.data.activeVisitors}`);
        console.log(`   ⏰ Views Last Hour: ${response.data.viewsLastHour}`);
      }

      results.push({ test: test.name, status: 'PASS', data: response.data });

    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.error || error.message}`);
      results.push({ test: test.name, status: 'FAIL', error: error.message });
    }
    
    console.log(''); // Línea en blanco
  }

  // Resumen
  console.log('=' * 50);
  console.log('📊 RESUMEN DE TESTS');
  console.log('=' * 50);
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  
  console.log(`✅ Tests Pasados: ${passed}/${total}`);
  console.log(`❌ Tests Fallidos: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 ¡Todos los endpoints están funcionando!');
    console.log('🚀 Analytics backend listo para el dashboard frontend');
  } else {
    console.log('\n⚠️ Algunos endpoints necesitan atención');
    console.log('🔧 Verificar que el servidor tenga los endpoints de analytics');
  }

  return { passed, total, results };
}

testAnalyticsEndpoints().catch(console.error);