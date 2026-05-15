import { z } from "zod";

// 🛡️ SECURITY: Zod validation schemas

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe minimum 8 caractères"),
  username: z.string().min(3, "Username minimum 3 caractères").max(30, "Username maximum 30 caractères").regex(/^[a-zA-Z0-9_-]+$/, "Username ne peut contenir que des caractères alphanumériques, tirets et underscores"),
  display_name: z.string().max(50, "Nom affichage maximum 50 caractères").optional(),
  bio: z.string().max(500, "Bio maximum 500 caractères").optional(),
  skills: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// Project schemas
export const createProjectSchema = z.object({
  title: z.string().min(5, "Titre minimum 5 caractères").max(255, "Titre maximum 255 caractères"),
  description: z.string().min(20, "Description minimum 20 caractères").max(5000, "Description maximum 5000 caractères"),
  skills_needed: z.array(z.string()).min(1, "Au moins une compétence requise"),
  project_type: z.enum(["web", "mobile", "design", "data", "ai", "other"]).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// Message schemas
export const sendMessageSchema = z.object({
  receiver_id: z.string().uuid("ID destinataire invalide"),
  content: z.string().max(5000, "Message maximum 5000 caractères").optional(),
  file_url: z.string().url().optional(),
  file_type: z.string().max(50, "Type fichier invalide").optional(),
  audio_url: z.string().url().optional(),
  audio_duration: z.number().positive().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  project_id: z.string().uuid("ID projet invalide"),
  content: z.string().min(1, "Commentaire ne peut pas être vide").max(2000, "Commentaire maximum 2000 caractères"),
});

// Profile update schema
export const updateProfileSchema = z.object({
  display_name: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
  avatar_url: z.string().url().optional(),
  cover_url: z.string().url().optional(),
});

// Middleware factory to validate request body
export function validateRequest(schema) {
  return async (req, res, next) => {
    try {
      req.validatedData = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join(".")}: ${e.message}`);
        return res.status(400).json({
          error: "Validation erreur",
          details: messages,
        });
      }
      res.status(400).json({ error: "Requête invalide" });
    }
  };
}

// Middleware to sanitize strings (prevent XSS)
export function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === "string") {
      // Remove HTML tags and dangerous characters
      return obj
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/[<>]/g, ""); // Remove angle brackets
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (typeof obj === "object" && obj !== null) {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key] = sanitize(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  next();
}
