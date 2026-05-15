import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { notifyBrandingUpdated } from "../utils/realtime-events.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le fichier de configuration du branding
const brandingConfigPath = path.join(__dirname, "../config/branding.json");

// Configuration par défaut
const defaultBranding = {
  name: "ProjectLink",
  tagline: "The home for makers shipping the future.",
  tabTitle: "ProjectLink - Connect, Create, Collaborate",
  logoUrl: null,
  primaryColor: "#3b82f6",
  accentColor: "#10b981",
  sections: {
    hero: { enabled: true, order: 1 },
    problemSolution: { enabled: true, order: 2 },
    features: { enabled: true, order: 3 },
    howItWorks: { enabled: true, order: 4 },
    community: { enabled: true, order: 5 },
    about: { enabled: true, order: 6 },
    contact: { enabled: true, order: 7 }
  },
  customContent: {
    heroTitle: "Connect with makers, build the future",
    heroSubtitle: "Join thousands of creators, developers, and innovators collaborating on groundbreaking projects.",
    heroCtaText: "Start Building Today",
    aboutTitle: "About ProjectLink",
    aboutDescription: "We're building the future of collaborative innovation.",
    contactEmail: "hello@projectlink.com",
    contactPhone: "+1 (555) 123-4567"
  }
};

// Fonction pour lire la configuration
const readBrandingConfig = () => {
  try {
    if (fs.existsSync(brandingConfigPath)) {
      const data = fs.readFileSync(brandingConfigPath, "utf8");
      return { ...defaultBranding, ...JSON.parse(data) };
    }
    return defaultBranding;
  } catch (error) {
    console.error("Erreur lecture branding config:", error);
    return defaultBranding;
  }
};

// Fonction pour écrire la configuration
const writeBrandingConfig = (config) => {
  try {
    // Créer le dossier config s'il n'existe pas
    const configDir = path.dirname(brandingConfigPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(brandingConfigPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error("Erreur écriture branding config:", error);
    return false;
  }
};

// Route pour récupérer la configuration de branding (publique)
router.get("/config", (req, res) => {
  try {
    const config = readBrandingConfig();
    res.json(config);
  } catch (error) {
    console.error("Erreur lors de la récupération du branding:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour mettre à jour la configuration de branding (admin seulement)
router.put("/config", async (req, res) => {
  try {
    // Vérifier l'authentification admin
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const jwt = (await import("jsonwebtoken")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    if (decoded.type !== "admin") {
      return res.status(401).json({ error: "Accès non autorisé" });
    }

    const currentConfig = readBrandingConfig();
    const updatedConfig = { ...currentConfig, ...req.body };
    
    if (writeBrandingConfig(updatedConfig)) {
      // Émettre l'événement de mise à jour du branding
      notifyBrandingUpdated(updatedConfig);
      
      res.json({ success: true, config: updatedConfig });
    } else {
      res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du branding:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour réinitialiser la configuration
router.post("/reset", async (req, res) => {
  try {
    // Vérifier l'authentification admin
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const jwt = (await import("jsonwebtoken")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    if (decoded.type !== "admin") {
      return res.status(401).json({ error: "Accès non autorisé" });
    }

    if (writeBrandingConfig(defaultBranding)) {
      // Émettre l'événement de mise à jour du branding
      notifyBrandingUpdated(defaultBranding);
      
      res.json({ success: true, config: defaultBranding });
    } else {
      res.status(500).json({ error: "Erreur lors de la réinitialisation" });
    }
  } catch (error) {
    console.error("Erreur lors de la réinitialisation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour uploader un logo
router.post("/upload-logo", async (req, res) => {
  try {
    // Vérifier l'authentification admin
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const jwt = (await import("jsonwebtoken")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    if (decoded.type !== "admin") {
      return res.status(401).json({ error: "Accès non autorisé" });
    }

    // TODO: Implémenter l'upload de fichier avec multer
    // Pour l'instant, retourner une URL fictive
    const logoUrl = "https://via.placeholder.com/150x50/3b82f6/ffffff?text=Logo";
    
    res.json({ url: logoUrl });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;