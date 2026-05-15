import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import nodemailer from "nodemailer";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le fichier de configuration des paramètres
const settingsConfigPath = path.join(__dirname, "../config/settings.json");

// Configuration par défaut
const defaultSettings = {
  platform: {
    name: "ProjectLink",
    description: "The home for makers shipping the future.",
    url: "https://projectlink.io",
    logo: "",
    favicon: "",
    theme: "light",
    language: "fr"
  },
  security: {
    twoFactorRequired: true,
    emailVerification: true,
    blockDisposableEmails: false,
    adminActivityLogs: true,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPasswords: true
  },
  api: {
    key: "pl_live_4fK29jXkP2mZx8nQwVcL3bRtYhA7sDfG",
    rateLimit: 1000,
    enableCors: true,
    allowedOrigins: ["https://projectlink.io"],
    webhookSecret: "whsec_1234567890abcdef"
  },
  limits: {
    maxProjectsPerUser: 50,
    maxCommentsPerMinute: 20,
    maxUploadSizeMB: 25,
    maxTeamMembers: 10,
    maxSkillsPerUser: 20
  },
  email: {
    provider: "smtp",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "noreply@projectlink.io",
    fromName: "ProjectLink"
  },
  notifications: {
    enableEmailNotifications: true,
    enablePushNotifications: false,
    enableSlackIntegration: false,
    slackWebhook: "",
    notifyOnNewUser: true,
    notifyOnNewProject: true,
    notifyOnError: true
  }
};

// Fonction pour lire la configuration
const readSettings = () => {
  try {
    if (fs.existsSync(settingsConfigPath)) {
      const data = fs.readFileSync(settingsConfigPath, "utf8");
      return { ...defaultSettings, ...JSON.parse(data) };
    }
    return defaultSettings;
  } catch (error) {
    console.error("Erreur lecture settings config:", error);
    return defaultSettings;
  }
};

// Fonction pour écrire la configuration
const writeSettings = (settings) => {
  try {
    // Créer le dossier config s'il n'existe pas
    const configDir = path.dirname(settingsConfigPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(settingsConfigPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Erreur écriture settings config:", error);
    return false;
  }
};

// Middleware d'authentification admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const jwt = (await import("jsonwebtoken")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    if (decoded.type !== "admin") {
      return res.status(401).json({ error: "Accès non autorisé" });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error("Erreur authentification admin:", error);
    res.status(401).json({ error: "Token invalide" });
  }
};

// Route pour récupérer les paramètres
router.get("/", requireAdmin, (req, res) => {
  try {
    const settings = readSettings();
    
    // Masquer les informations sensibles
    const safeSettings = {
      ...settings,
      email: {
        ...settings.email,
        smtpPassword: settings.email.smtpPassword ? "••••••••" : ""
      }
    };
    
    res.json(safeSettings);
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour mettre à jour les paramètres
router.put("/", requireAdmin, (req, res) => {
  try {
    const currentSettings = readSettings();
    
    // Fusionner les nouveaux paramètres avec les existants
    const updatedSettings = {
      ...currentSettings,
      ...req.body
    };

    // Validation des paramètres critiques
    if (updatedSettings.security?.passwordMinLength < 6) {
      return res.status(400).json({ 
        error: "La longueur minimale du mot de passe doit être d'au moins 6 caractères" 
      });
    }

    if (updatedSettings.limits?.maxUploadSizeMB > 100) {
      return res.status(400).json({ 
        error: "La taille maximale d'upload ne peut pas dépasser 100MB" 
      });
    }

    if (writeSettings(updatedSettings)) {
      // Masquer les informations sensibles dans la réponse
      const safeSettings = {
        ...updatedSettings,
        email: {
          ...updatedSettings.email,
          smtpPassword: updatedSettings.email.smtpPassword ? "••••••••" : ""
        }
      };
      
      res.json({ success: true, settings: safeSettings });
    } else {
      res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour générer une nouvelle clé API
router.post("/generate-api-key", requireAdmin, (req, res) => {
  try {
    const newApiKey = `pl_live_${crypto.randomBytes(32).toString('hex').substring(0, 32)}`;
    
    const currentSettings = readSettings();
    const updatedSettings = {
      ...currentSettings,
      api: {
        ...currentSettings.api,
        key: newApiKey
      }
    };

    if (writeSettings(updatedSettings)) {
      res.json({ apiKey: newApiKey });
    } else {
      res.status(500).json({ error: "Erreur lors de la génération de la clé" });
    }
  } catch (error) {
    console.error("Erreur lors de la génération de la clé API:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour tester la configuration email
router.post("/test-email", requireAdmin, async (req, res) => {
  try {
    const emailConfig = req.body;
    
    // Créer un transporteur de test
    const transporter = nodemailer.createTransporter({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPassword
      }
    });

    // Vérifier la connexion
    await transporter.verify();

    // Envoyer un email de test
    await transporter.sendMail({
      from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      to: req.admin.email || emailConfig.fromEmail,
      subject: "Test de configuration email - ProjectLink",
      html: `
        <h2>Test de configuration email</h2>
        <p>Cet email confirme que votre configuration SMTP fonctionne correctement.</p>
        <p><strong>Serveur:</strong> ${emailConfig.smtpHost}:${emailConfig.smtpPort}</p>
        <p><strong>Utilisateur:</strong> ${emailConfig.smtpUser}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><small>Envoyé depuis le panel d'administration ProjectLink</small></p>
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors du test email:", error);
    res.status(400).json({ 
      error: `Erreur de configuration email: ${error.message}` 
    });
  }
});

// Route pour réinitialiser les paramètres
router.post("/reset", requireAdmin, (req, res) => {
  try {
    if (writeSettings(defaultSettings)) {
      // Masquer les informations sensibles dans la réponse
      const safeSettings = {
        ...defaultSettings,
        email: {
          ...defaultSettings.email,
          smtpPassword: ""
        }
      };
      
      res.json({ success: true, settings: safeSettings });
    } else {
      res.status(500).json({ error: "Erreur lors de la réinitialisation" });
    }
  } catch (error) {
    console.error("Erreur lors de la réinitialisation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour obtenir les statistiques système
router.get("/system-stats", requireAdmin, (req, res) => {
  try {
    const stats = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;