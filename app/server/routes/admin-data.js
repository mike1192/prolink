import express from 'express';
import pool from '../db/pool.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware pour vérifier l'authentification admin
const authenticateAdmin = async (req, res, next) => {
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
        message: 'Accès non autorisé' 
      });
    }

    // Vérifier que l'admin existe et est actif
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

    req.admin = rows[0];
    next();
  } catch (error) {
    console.error('Erreur d\'authentification admin:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token invalide' 
    });
  }
};

// Route pour récupérer tous les utilisateurs
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT 
        id, username, display_name, email, bio, avatar_url, 
        skills, verified_skills, job_title, location, 
        created_at, updated_at
      FROM users
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    let params = [];

    if (search) {
      query += ' WHERE username LIKE ? OR display_name LIKE ? OR email LIKE ?';
      countQuery += ' WHERE username LIKE ? OR display_name LIKE ? OR email LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, searchParam];
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [users] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, search ? [search, search, search] : []);
    
    // Parser les champs JSON
    const formattedUsers = users.map(user => ({
      ...user,
      skills: user.skills ? JSON.parse(user.skills) : [],
      verified_skills: user.verified_skills ? JSON.parse(user.verified_skills) : [],
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Route pour récupérer tous les projets
router.get('/projects', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT 
        p.id, p.title, p.description, p.owner_id, p.skills_needed, 
        p.project_type, p.created_at, p.updated_at,
        u.username as owner_username, u.display_name as owner_name, u.avatar_url as owner_avatar,
        (SELECT COUNT(*) FROM likes WHERE project_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE project_id = p.id) as comments_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM projects p';
    let params = [];

    if (search) {
      query += ' WHERE p.title LIKE ? OR p.description LIKE ?';
      countQuery += ' WHERE title LIKE ? OR description LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam];
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [projects] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, search ? [search, search] : []);
    
    // Parser les champs JSON
    const formattedProjects = projects.map(project => ({
      ...project,
      skills_needed: project.skills_needed ? JSON.parse(project.skills_needed) : [],
    }));

    res.json({
      projects: formattedProjects,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Route pour les statistiques du dashboard
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    // Statistiques générales
    const [userStats] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const [projectStats] = await pool.execute('SELECT COUNT(*) as total FROM projects');
    const [likeStats] = await pool.execute('SELECT COUNT(*) as total FROM likes');
    const [commentStats] = await pool.execute('SELECT COUNT(*) as total FROM comments');

    // Projets actifs (derniers 30 jours)
    const [activeProjectStats] = await pool.execute(
      'SELECT COUNT(*) as total FROM projects WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    // Croissance utilisateurs (derniers 30 jours vs 30 jours précédents)
    const [userGrowthCurrent] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const [userGrowthPrevious] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    // Calcul du pourcentage de croissance
    const userGrowthPercent = userGrowthPrevious[0].total > 0 
      ? ((userGrowthCurrent[0].total - userGrowthPrevious[0].total) / userGrowthPrevious[0].total) * 100
      : 100;

    // Données pour les graphiques (derniers 7 jours)
    const [dailyStats] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'users' as type
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      
      UNION ALL
      
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'projects' as type
      FROM projects 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      
      ORDER BY date DESC
    `);

    res.json({
      totalUsers: userStats[0].total,
      totalProjects: projectStats[0].total,
      activeProjects: activeProjectStats[0].total,
      totalInteractions: likeStats[0].total + commentStats[0].total,
      userGrowth: Math.round(userGrowthPercent * 100) / 100,
      projectGrowth: 8.1, // À calculer de manière similaire
      interactionGrowth: 23.7, // À calculer de manière similaire
      dailyStats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Route pour l'activité récente
router.get('/activity', authenticateAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Récupérer les activités récentes (projets, likes, commentaires)
    const [activities] = await pool.execute(`
      (SELECT 
        p.id, p.title as target, p.created_at,
        u.display_name as who, u.username,
        'a publié le projet' as what,
        'project' as type
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ?)
      
      UNION ALL
      
      (SELECT 
        l.id, p.title as target, l.created_at,
        u.display_name as who, u.username,
        'a aimé le projet' as what,
        'like' as type
      FROM likes l
      LEFT JOIN projects p ON l.project_id = p.id
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT ?)
      
      ORDER BY created_at DESC
      LIMIT ?
    `, [Math.floor(limit/2), Math.floor(limit/2), limit]);

    // Formater les activités
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      who: activity.who || activity.username || 'Utilisateur',
      what: activity.what,
      target: activity.target,
      time: getTimeAgo(activity.created_at),
      type: activity.type
    }));

    res.json(formattedActivities);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Fonction utilitaire pour calculer le temps écoulé
function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'quelques secondes';
  if (diffInMinutes < 60) return `${diffInMinutes} min`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  return `${Math.floor(diffInMinutes / 1440)} jour(s)`;
}

export default router;