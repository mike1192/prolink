import jwt from "jsonwebtoken";

// 🔐 SECURITY: JWT_SECRET must be set in production
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL: JWT_SECRET environment variable must be set in production. " +
      "Generate one: openssl rand -base64 32"
    );
  }
  console.warn("⚠️ WARNING: JWT_SECRET not set, using development fallback (INSECURE!)");
}

const SECRET_KEY = JWT_SECRET || "dev-secret-key-DO-NOT-USE-IN-PRODUCTION";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token d'authentification requis" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token invalide ou expiré" });
    }
    req.user = user;
    next();
  });
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    SECRET_KEY,
    { expiresIn: "7d" },
  );
}

export { SECRET_KEY as JWT_SECRET };
