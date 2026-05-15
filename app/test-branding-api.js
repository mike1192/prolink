// Test de l'API branding

const API_BASE = 'http://localhost:3003/api';

async function testBrandingAPI() {
  try {
    console.log('🧪 Test de l\'API Branding...\n');

    // Test 1: Récupérer la configuration
    console.log('1. Test GET /api/branding/config');
    const response = await fetch(`${API_BASE}/branding/config`);
    
    if (response.ok) {
      const config = await response.json();
      console.log('✅ Configuration récupérée:', JSON.stringify(config, null, 2));
    } else {
      console.log('❌ Erreur:', response.status, response.statusText);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testBrandingAPI();