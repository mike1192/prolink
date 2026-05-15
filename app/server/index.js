import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import adminAuthRoutes from "./routes/admin-auth.js";
import adminDataRoutes from "./routes/admin-data.js";
import adminSettingsRoutes from "./routes/admin-settings.js";
import projectRoutes from "./routes/projects.js";
import notificationRoutes from "./routes/notifications.js";
import connectionRoutes from "./routes/connections.js";
import messageRoutes from "./routes/messages.js";
import bookmarkRoutes from "./routes/bookmarks.js";
import brandingRoutes from "./routes/branding.js";
import { JWT_SECRET } from "./middleware/auth.js";

// Import real-time events system
import { initRealTimeEvents, joinUserRoom, leaveUserRoom } from "./utils/realtime-events.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;

// 🛡️ SECURITY: Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Auth routes rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit login/signup to 5 attempts per 15 minutes
  message: "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.",
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Message rate limiter
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Max 30 messages per minute
  message: "Vous envoyez trop de messages. Veuillez ralentir.",
});

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO with permissive CORS for development
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:4000",
        "http://localhost:5174",

        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4000",
        "http://127.0.0.1:5174",
      ];

      // Allow all localhost origins in development
      if (origin.indexOf("localhost") !== -1 || origin.indexOf("127.0.0.1") !== -1) {
        return callback(null, true);
      }

      // Check against allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

console.log("✅ Socket.IO CORS configured for all localhost origins");

// Middleware d'authentification Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.error("❌ Tentative de connexion sans token");
    return next(new Error("Token d'authentification requis"));
  }

  // Extract Bearer token if present
  const bearerToken = token.startsWith("Bearer ") ? token.slice(7) : token;

  jwt.verify(bearerToken, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("❌ Token invalide:", err.message);
      return next(new Error("Token invalide ou expiré"));
    }

    socket.userId = decoded.id;
    socket.user = decoded;
    console.log("✅ Token validé pour l'utilisateur:", decoded.id);
    next();
  });
});

// Store connected users
const connectedUsers = new Map();

// WebSocket pour les mises à jour admin en temps réel
io.on("connection", (socket) => {
  console.log("User connected:", socket.id, "- User ID:", socket.userId);

  // User joins - use the authenticated userId instead of relying on client-sent data
  socket.on("join", (userId) => {
    // Validate that the provided userId matches the authenticated user
    if (userId !== socket.userId) {
      console.warn(`⚠️ User ID mismatch: provided ${userId}, authenticated ${socket.userId}`);
      return;
    }

    connectedUsers.set(userId, socket.id);
    joinUserRoom(socket, userId);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  // User joins for real-time sync (app principale)
  socket.on("user_join", (data) => {
    const userId = data.userId || socket.userId;
    if (userId === socket.userId) {
      joinUserRoom(socket, userId);
      connectedUsers.set(userId, socket.id);
      console.log(`📱 App user ${userId} joined for real-time sync`);
    }
  });

  // Admin join pour les mises à jour du dashboard
  socket.on("admin_join", (data) => {
    if (data.token) {
      // Vérifier si c'est un token admin
      jwt.verify(data.token, JWT_SECRET, (err, decoded) => {
        if (!err && decoded.type === "admin") {
          socket.join("admin_room");
          console.log(`👑 Admin ${decoded.id} joined admin room`);
        }
      });
    }
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    const { receiverId, conversationId } = data;
    const senderId = socket.userId;
    const recipientSocketId = connectedUsers.get(receiverId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("user_typing", {
        senderId,
        conversationId,
        isTyping: true,
      });
    }
  });

  // Handle stop typing
  socket.on("stop_typing", (data) => {
    const { receiverId, conversationId } = data;
    const senderId = socket.userId;
    const recipientSocketId = connectedUsers.get(receiverId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("user_typing", {
        senderId,
        conversationId,
        isTyping: false,
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      leaveUserRoom(socket, socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// Initialize real-time events system
initRealTimeEvents(io);

// Export io for use in routes
export { io, connectedUsers };

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/projects";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "project-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configuration multer pour les photos de couverture
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/covers";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "cover-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configuration multer pour les avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/avatars";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Seules les images JPEG, PNG et GIF sont autorisées"));
    }
  },
});

const uploadCover = multer({
  storage: coverStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Seules les images JPEG, PNG et GIF sont autorisées"));
    }
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Seules les images JPEG, PNG et GIF sont autorisées"));
    }
  },
});

// Configuration multer pour les fichiers audio
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/audio";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "audio-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for audio
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|ogg|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith("audio/");

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers audio sont autorisés"));
    }
  },
});

// Configuration multer pour les fichiers généraux
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/files";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "file-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadGeneral = multer({
  storage: generalStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
});

// 🔐 SECURITY: CORS configuration - strict in production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (CLI tools, mobile, etc.)
    if (!origin) return callback(null, true);

    // Define allowed origins based on environment
    const allowedOrigins =
      process.env.NODE_ENV === "production"
        ? [
            "https://projectlink.com",
            "https://www.projectlink.com",
            process.env.FRONTEND_URL, // Set in production env
          ].filter(Boolean)
        : [
            "http://localhost:8080",
            "http://localhost:5173",
            "http://localhost:4000",
            "http://localhost:5174",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:4000",
            "http://127.0.0.1:5174",
          ];

    // In development, allow all localhost
    if (process.env.NODE_ENV !== "production") {
      if (origin.indexOf("localhost") !== -1 || origin.indexOf("127.0.0.1") !== -1) {
        return callback(null, true);
      }
    }

    // Check against allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS rejected origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 hours
};

// 🔐 SECURITY: HTTPS enforcement middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.header("x-forwarded-proto") !== "https") {
    return res.redirect(`https://${req.header("host")}${req.url}`);
  }
  // Add security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains"); // HSTS
  next();
});

app.use(cors(corsOptions));
console.log(
  "✅ Express CORS configured",
  process.env.NODE_ENV === "production" ? "(strict)" : "(development)",
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🛡️ SECURITY: Apply global rate limiter
app.use(limiter);

// Route d'upload d'images (doit être avant les autres routes)
app.post("/api/upload", async (req, res) => {
  try {
    const { authenticateToken } = await import("./middleware/auth.js");

    // Authenticate
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });

    upload.single("image")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Aucune image fournie" });
      }

      // Return the URL of the uploaded file
      const imageUrl = `http://localhost:${PORT}/uploads/projects/${req.file.filename}`;

      res.json({
        message: "Image uploadée avec succès",
        url: imageUrl,
        filename: req.file.filename,
      });
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Servir les fichiers uploadés statiquement
app.use("/uploads", express.static("uploads"));

// Route d'upload de photo de couverture
app.post("/api/upload-cover", async (req, res) => {
  try {
    const { authenticateToken } = await import("./middleware/auth.js");

    // Authenticate
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });

    uploadCover.single("cover")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Aucune image fournie" });
      }

      const pool = (await import("./db/pool.js")).default;
      const coverUrl = `http://localhost:${PORT}/uploads/covers/${req.file.filename}`;

      // Update user's cover_url
      await pool.query("UPDATE users SET cover_url = ? WHERE id = ?", [coverUrl, req.user.id]);

      res.json({
        message: "Photo de couverture uploadée avec succès",
        url: coverUrl,
        filename: req.file.filename,
      });
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de la couverture:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route d'upload d'avatar
app.post("/api/upload-avatar", async (req, res) => {
  try {
    const { authenticateToken } = await import("./middleware/auth.js");

    // Authenticate
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });

    uploadAvatar.single("avatar")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Aucune image fournie" });
      }

      const pool = (await import("./db/pool.js")).default;
      const avatarUrl = `http://localhost:${PORT}/uploads/avatars/${req.file.filename}`;

      // Update user's avatar_url
      await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatarUrl, req.user.id]);

      res.json({
        message: "Avatar uploadé avec succès",
        url: avatarUrl,
        filename: req.file.filename,
      });
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de l'avatar:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes with rate limiting
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin/auth", authLimiter, adminAuthRoutes);
app.use("/api/admin", adminDataRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageLimiter, messageRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/branding", brandingRoutes);

// Route de profil
app.get("/api/profile/:username", async (req, res) => {
  try {
    const pool = (await import("./db/pool.js")).default;
    const [users] = await pool.query(
      "SELECT id, username, display_name, bio, avatar_url, cover_url, skills, portfolio_images, verified_skills, job_title, location, website, github_url, twitter_url, linkedin_url, availability_status FROM users WHERE username = ?",
      [req.params.username],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Profil non trouvé" });
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
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour récupérer un profil par ID
app.get("/api/profile/id/:userId", async (req, res) => {
  try {
    const pool = (await import("./db/pool.js")).default;
    const [users] = await pool.query(
      "SELECT id, username, display_name, bio, avatar_url, cover_url, skills, portfolio_images, verified_skills, job_title, location, website, github_url, twitter_url, linkedin_url, availability_status FROM users WHERE id = ?",
      [req.params.userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Profil non trouvé" });
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
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour mettre à jour le profil
app.put("/api/profile", async (req, res) => {
  try {
    const pool = (await import("./db/pool.js")).default;
    const { authenticateToken } = await import("./middleware/auth.js");

    // Utiliser le middleware manuellement
    const { token } = req.body;
    const jwt = (await import("jsonwebtoken")).default;
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
    );

    const {
      display_name,
      bio,
      skills,
      avatar_url,
      cover_url,
      job_title,
      location,
      website,
      github,
      twitter,
      linkedin,
    } = req.body;
    const skillsJson = skills ? JSON.stringify(skills) : null;

    await pool.query(
      "UPDATE users SET display_name = ?, bio = ?, skills = ?, avatar_url = COALESCE(?, avatar_url), cover_url = COALESCE(?, cover_url), job_title = ?, location = ?, website = ?, github_url = ?, twitter_url = ?, linkedin_url = ? WHERE id = ?",
      [
        display_name,
        bio,
        skillsJson,
        avatar_url,
        cover_url,
        job_title,
        location,
        website,
        github,
        twitter,
        linkedin,
        decoded.id,
      ],
    );

    res.json({ message: "Profil mis à jour" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API ProjectLink fonctionne" });
});

// Upload audio message
app.post("/api/upload-audio", async (req, res) => {
  try {
    const { authenticateToken } = await import("./middleware/auth.js");

    // Authenticate
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });

    uploadAudio.single("audio")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier audio fourni" });
      }

      const audioUrl = `http://localhost:${PORT}/uploads/audio/${req.file.filename}`;

      res.json({
        message: "Audio uploadé avec succès",
        url: audioUrl,
        filename: req.file.filename,
      });
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de l'audio:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Upload fichier général
app.post("/api/upload-file", async (req, res) => {
  try {
    const { authenticateToken } = await import("./middleware/auth.js");

    // Authenticate
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });

    uploadGeneral.single("file")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      const fileUrl = `http://localhost:${PORT}/uploads/files/${req.file.filename}`;

      res.json({
        message: "Fichier uploadé avec succès",
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    });
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Servir les fichiers audio et autres uploads statiquement
app.use("/uploads/audio", express.static("uploads/audio"));
app.use("/uploads/files", express.static("uploads/files"));

// Servir les fichiers buildés avec fallback SPA
// Superadmin - servir statique d'abord, puis fallback
app.use("/superadmin", express.static("public/superadmin", { index: false }));
app.use("/superadmin", (req, res) => {
  const indexPath = path.resolve("public/superadmin/index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // En mode développement, rediriger vers le serveur de dev Vite
    res.redirect("http://localhost:4000/superadmin");
  }
});

// Present - servir statique d'abord, puis fallback (doit être après toutes les routes API)
app.use(express.static("public/present", { index: false }));
app.use((req, res, next) => {
  // Ne pas rediriger les routes API
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Route API non trouvée" });
  }

  const indexPath = path.resolve("public/present/index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // En mode développement, rediriger vers le serveur de dev Vite
    res.redirect("http://localhost:8080");
  }
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur API lancé sur http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api`);
  console.log(`🌐 Present frontend: http://localhost:${PORT}`);
  console.log(`🔐 Superadmin panel: http://localhost:${PORT}/superadmin`);
  console.log(`🔌 WebSocket actif`);
});

export default app;
