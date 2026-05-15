import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

const router = express.Router();

// Login pour les administrateurs
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      });
    }

    // Chercher l'administrateur dans la base de données
    const [rows] = await pool.execute(
      'SELECT id, email, password_hash, name, role, is_active FROM admin_users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    const admin = rows[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Mettre à jour la dernière connexion
    await pool.execute(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [admin.id]
    );

    // Créer le token JWT
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        role: admin.role,
        type: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Vérifier le token admin
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token manquant' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide' 
      });
    }

    // Vérifier que l'admin existe toujours
    const [rows] = await pool.execute(
      'SELECT id, email, name, role FROM admin_users WHERE id = ? AND is_active = TRUE',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Administrateur non trouvé' 
      });
    }

    res.json({
      success: true,
      user: rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token invalide' 
    });
  }
});

// Logout (optionnel - côté client suffit généralement)
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Déconnexion réussie' 
  });
});

export default router;