// Test simple de l'API branding
import fetch from "node-fetch";

async function testBrandingAPI() {
  try {
    console.log("🧪 Test de l'API branding...");

    const response = await fetch("http://localhost:3003/api/branding/config");

    console.log("Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API branding fonctionne !");
      console.log("Data:", JSON.stringify(data, null, 2));
    } else {
      console.log("❌ Erreur API:", response.status, response.statusText);
      const text = await response.text();
      console.log("Response:", text);
    }
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
  }
}

testBrandingAPI();
