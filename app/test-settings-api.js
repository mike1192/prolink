// Test de l'API des paramètres admin
const API_BASE = "http://localhost:3003/api";

// Token admin de test (à remplacer par un vrai token)
const ADMIN_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInR5cGUiOiJhZG1pbiIsImlhdCI6MTczNjYwNzI0MH0.example";

async function testSettingsAPI() {
  try {
    console.log("🧪 Test de l'API des paramètres admin...\n");

    // Test 1: Récupérer les paramètres
    console.log("1. Test GET /api/admin/settings");
    const getResponse = await fetch(`${API_BASE}/admin/settings`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });

    if (getResponse.ok) {
      const settings = await getResponse.json();
      console.log("✅ Paramètres récupérés avec succès");
      console.log("📋 Sections disponibles:", Object.keys(settings));
    } else {
      console.log("❌ Erreur GET:", getResponse.status, getResponse.statusText);
      const text = await getResponse.text();
      console.log("Response:", text.substring(0, 200) + "...");
    }

    console.log("\n2. Test POST /api/admin/settings/generate-api-key");
    const keyResponse = await fetch(`${API_BASE}/admin/settings/generate-api-key`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (keyResponse.ok) {
      const result = await keyResponse.json();
      console.log("✅ Nouvelle clé API générée:", result.apiKey.substring(0, 20) + "...");
    } else {
      console.log("❌ Erreur génération clé:", keyResponse.status, keyResponse.statusText);
    }

    console.log("\n3. Test PUT /api/admin/settings (mise à jour)");
    const updateData = {
      platform: {
        name: "ProjectLink Test",
        description: "Test de mise à jour",
      },
    };

    const updateResponse = await fetch(`${API_BASE}/admin/settings`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log("✅ Paramètres mis à jour avec succès");
      console.log("📝 Nouveau nom:", result.settings.platform.name);
    } else {
      console.log("❌ Erreur mise à jour:", updateResponse.status, updateResponse.statusText);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }
}

testSettingsAPI();
