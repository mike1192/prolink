import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db/pool.js";
import { generateToken, authenticateToken } from "../middleware/auth.js";
import { validateRequest, sanitizeInput, signupSchema, loginSchema } from "../middleware/validation.js";

const router = express.Router();

// 🛡️ Apply sanitization to all requests
router.use(sanitizeInput);

// Inscription
router.post("/signup", validateRequest(signupSchema), async (req, res) => {
  try {
    const { email, password, username, display_name, bio, skills } = req.validatedData;

    // Vérifier si l'email existe déjà
    const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }

    // Vérifier si le username existe déjà
    const [existingUsername] = await pool.query("SELECT id FROM users WHERE username = ?", [
      username,
    ]);
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris" });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const skillsJson = JSON.stringify(skills || []);
    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash, username, display_name, bio, skills) VALUES (?, ?, ?, ?, ?, ?)",
      [email, passwordHash, username, display_name, bio || null, skillsJson],
    );

    // Récupérer l'utilisateur créé en utilisant l'email
    const [users] = await pool.query(
      "SELECT id, email, username, display_name, bio, avatar_url, skills, theme, notifications_enabled, public_profile, created_at FROM users WHERE email = ?",
      [email],
    );

    const user = users[0];

    // Générer le token JWT
    const token = generateToken(user);

    res.status(201).json({
      message: "Compte créé avec succès",
      user: {
        ...user,
        skills: typeof user.skills === "string" ? JSON.parse(user.skills) : user.skills,
        theme: user.theme || "dark",
        notifications_enabled:
          user.notifications_enabled !== null ? user.notifications_enabled : true,
        public_profile: user.public_profile !== null ? user.public_profile : true,
      },
      token,
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ error: "Erreur lors de la création du compte" });
  }
});

// Connexion
router.post("/login", validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // Chercher l'utilisateur
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // Générer le token JWT
    const token = generateToken(user);

    res.json({
      message: "Connecté avec succès",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        skills: typeof user.skills === "string" ? JSON.parse(user.skills) : user.skills,
        theme: user.theme || "dark",
        notifications_enabled:
          user.notifications_enabled !== null ? user.notifications_enabled : true,
        public_profile: user.public_profile !== null ? user.public_profile : true,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// Vérifier le token
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, email, username, display_name, bio, avatar_url, cover_url, skills, portfolio_images, verified_skills, job_title, location, website, github_url, twitter_url, linkedin_url, availability_status, theme, notifications_enabled, public_profile, created_at FROM users WHERE id = ?",
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const user = users[0];

    res.json({
      ...user,
      skills: typeof user.skills === "string" ? JSON.parse(user.skills) : user.skills,
      portfolio_images:
        typeof user.portfolio_images === "string"
          ? JSON.parse(user.portfolio_images)
          : user.portfolio_images || [],
      verified_skills:
        typeof user.verified_skills === "string"
          ? JSON.parse(user.verified_skills)
          : user.verified_skills || [],
      github: user.github_url,
      twitter: user.twitter_url,
      linkedin: user.linkedin_url,
      theme: user.theme || "dark",
      notifications_enabled:
        user.notifications_enabled !== null ? user.notifications_enabled : true,
      public_profile: user.public_profile !== null ? user.public_profile : true,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour les préférences utilisateur
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    const { theme, notifications_enabled, public_profile } = req.body;
    const userId = req.user.id;

    const updates = [];
    const values = [];

    if (theme !== undefined) {
      updates.push("theme = ?");
      values.push(theme);
    }
    if (notifications_enabled !== undefined) {
      updates.push("notifications_enabled = ?");
      values.push(notifications_enabled);
    }
    if (public_profile !== undefined) {
      updates.push("public_profile = ?");
      values.push(public_profile);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Aucune préférence à mettre à jour" });
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

    await pool.query(query, values);

    res.json({ message: "Préférences mises à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des préférences:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
