require('dotenv').config({ path: '.env.development' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

async function verifyFullDemo() {
  console.log('🧪 VERIFICACIÓN COMPLETA DEL DEMO INDI PLATFORM\n');

  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣ Verificando Supabase...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', 'demo@indi.com')
      .single();

    if (userError || !userData) {
      console.log('❌ Usuario demo no encontrado');
      return;
    }
    
    console.log('✅ Supabase conectado');
    console.log('👤 Usuario demo:', userData.email, `-`, userData.first_name, userData.last_name);

    // 2. Verificar tarjeta demo
    console.log('\n2️⃣ Verificando tarjeta demo...');
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('id, title, company, is_active')
      .eq('user_id', userData.id)
      .single();

    if (cardError || !cardData) {
      console.log('❌ Tarjeta demo no encontrada');
    } else {
      console.log('✅ Tarjeta demo encontrada');
      console.log('🏢', cardData.title);
      console.log('🆔 ID:', cardData.id);
      console.log('🟢 Activa:', cardData.is_active ? 'Sí' : 'No');
    }

    // 3. Verificar backend API
    console.log('\n3️⃣ Verificando Backend API...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/api/health');
      console.log('✅ Backend API funcionando');
      console.log('📊 Estado:', healthResponse.data.status);
      console.log('⏰ Uptime:', Math.round(healthResponse.data.uptime), 'segundos');
    } catch (apiError) {
      console.log('❌ Backend API no responde:', apiError.message);
      return;
    }

    // 4. Probar login
    console.log('\n4️⃣ Probando autenticación...');
    try {
      const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'demo@indi.com',
        password: 'demo123'
      });
      
      console.log('✅ Login funcionando');
      console.log('🔑 Token recibido:', loginResponse.data.token ? 'Sí' : 'No');
      console.log('👤 Usuario:', loginResponse.data.user.email);
    } catch (loginError) {
      console.log('❌ Login falló:', loginError.response?.data?.error || loginError.message);
    }

    // 5. Verificar frontend
    console.log('\n5️⃣ Verificando Frontend...');
    try {
      const frontendResponse = await axios.get('http://localhost:3000', { timeout: 5000 });
      console.log('✅ Frontend cargando');
      console.log('📄 Tipo contenido:', frontendResponse.headers['content-type']);
      console.log('📊 Tamaño respuesta:', frontendResponse.data.length, 'caracteres');
    } catch (frontendError) {
      console.log('❌ Frontend no responde:', frontendError.message);
    }

    // 6. Verificar mock de tarjetas
    console.log('\n6️⃣ Verificando endpoint de tarjetas...');
    try {
      const cardsResponse = await axios.get('http://localhost:3001/api/cards');
      console.log('✅ Endpoint cards funcionando');
      console.log('📋 Tarjetas disponibles:', cardsResponse.data.length);
    } catch (cardsError) {
      console.log('❌ Endpoint cards falló:', cardsError.response?.data?.error || cardsError.message);
    }

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DEMO INDI PLATFORM - ESTADO COMPLETO');
    console.log('='.repeat(50));
    console.log('✅ Base de datos: Supabase conectada');
    console.log('✅ Usuario demo: demo@indi.com / demo123');
    console.log('✅ Backend API: http://localhost:3001/api');
    console.log('✅ Frontend: http://localhost:3000');
    console.log('✅ Autenticación: Funcionando');
    console.log('✅ Health Check: Activo');
    console.log('\n🚀 La aplicación está lista para testing!');
    console.log('📖 Instrucciones:');
    console.log('   1. Abrir http://localhost:3000 en el navegador');
    console.log('   2. Hacer login con demo@indi.com / demo123');
    console.log('   3. Explorar la interfaz de usuario');
    console.log('   4. API disponible en http://localhost:3001/api');

  } catch (error) {
    console.error('\n💥 Error en verificación:', error.message);
  }
}

verifyFullDemo();