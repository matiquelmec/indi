#!/usr/bin/env node

/**
 * External Card Flow Test
 * Tests the complete external user experience for viewing cards
 */

const API_BASE = 'http://localhost:5001/api';

async function testExternalCardFlow() {
  console.log('🧪 TESTING EXTERNAL CARD VIEWING FLOW\n');

  try {
    // Test 1: Valid slug should return card data
    console.log('📋 Test 1: Loading valid card by slug...');
    const validResponse = await fetch(`${API_BASE}/cards/by-slug/ana-garca`);

    if (validResponse.ok) {
      const data = await validResponse.json();
      console.log('✅ Valid card loaded successfully');
      console.log(`   Card: ${data.card.first_name} ${data.card.last_name}`);
      console.log(`   Published: ${data.card.is_published}`);
      console.log(`   Views: ${data.card.views_count}`);
      console.log(`   Cache-Control: ${validResponse.headers.get('cache-control')}`);
    } else {
      console.log('❌ Failed to load valid card:', validResponse.status);
    }

    // Test 2: Invalid slug should return 404
    console.log('\n📋 Test 2: Testing invalid slug...');
    const invalidResponse = await fetch(`${API_BASE}/cards/by-slug/nonexistent-card`);

    if (invalidResponse.status === 404) {
      console.log('✅ Invalid slug correctly returns 404');
    } else {
      console.log('❌ Invalid slug should return 404, got:', invalidResponse.status);
    }

    // Test 3: Check cache headers for performance
    console.log('\n📋 Test 3: Testing cache headers...');
    const cacheResponse = await fetch(`${API_BASE}/cards/by-slug/ana-garca`);
    const cacheControl = cacheResponse.headers.get('cache-control');
    const etag = cacheResponse.headers.get('etag');

    if (cacheControl && etag) {
      console.log('✅ Cache headers present');
      console.log(`   Cache-Control: ${cacheControl}`);
      console.log(`   ETag: ${etag}`);
    } else {
      console.log('❌ Missing cache headers');
    }

    // Test 4: CORS headers for external access
    console.log('\n📋 Test 4: Testing CORS headers...');
    const corsHeaders = cacheResponse.headers.get('access-control-allow-origin');

    if (corsHeaders === '*') {
      console.log('✅ CORS headers configured for external access');
    } else {
      console.log('❌ CORS headers missing or incorrect');
    }

    // Test 5: Performance test
    console.log('\n📋 Test 5: Performance test (3 requests)...');
    const startTime = Date.now();

    await Promise.all([
      fetch(`${API_BASE}/cards/by-slug/ana-garca`),
      fetch(`${API_BASE}/cards/by-slug/ana-garca`),
      fetch(`${API_BASE}/cards/by-slug/ana-garca`)
    ]);

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 3;

    console.log(`✅ Average response time: ${avgTime.toFixed(2)}ms`);

    if (avgTime < 200) {
      console.log('✅ Performance: Excellent');
    } else if (avgTime < 500) {
      console.log('⚠️  Performance: Good');
    } else {
      console.log('❌ Performance: Needs improvement');
    }

    console.log('\n🎉 EXTERNAL CARD FLOW TESTING COMPLETED');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testExternalCardFlow();