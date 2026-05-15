import express from "express";
import pool from "../db/pool.js";
import { authenticateToken } from "../middleware/auth.js";
import { createNotification } from "./notifications.js";
import PaginationHelper from "../utils/pagination.js";
import cache from "../utils/redis.js";
import { 
  notifyProjectCreated, 
  notifyProjectUpdated, 
  notifyProjectDeleted, 
  notifyProjectLiked,
  notifyCommentCreated,
  notifyCommentDeleted 
} from "../utils/realtime-events.js";

const router = express.Router();

// 📄 Apply pagination middleware globally
router.use(PaginationHelper.middleware());

// Rechercher des projets par compétences avec pagination et caching
router.get("/search", async (req, res) => {
  try {
    const { skill, user_id } = req.query;
    const { page, limit, offset } = req.pagination;

    if (!skill) {
      return res.status(400).json({ error: "Le paramètre skill est requis" });
    }

    // 💾 Check cache first
    const cacheKey = cache.constructor.key("projects:search", { skill, page, limit });
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM projects p
       WHERE JSON_CONTAINS(p.skills_needed, JSON_QUOTE(?))`,
      [skill],
    );
    const total = countResult[0].total;

    // Get paginated results
    let query = `
      SELECT p.*, 
             u.id as owner_id, u.username, u.display_name, u.bio, u.avatar_url, u.skills as owner_skills
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE JSON_CONTAINS(p.skills_needed, JSON_QUOTE(?))
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [projects] = await pool.query(query, [skill, limit, offset]);

    // Pour chaque projet, compter les likes et commentaires
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const [likes] = await pool.query(
          "SELECT COUNT(*) as count FROM likes WHERE project_id = ?",
          [project.id],
        );
        const [comments] = await pool.query(
          "SELECT COUNT(*) as count FROM comments WHERE project_id = ?",
          [project.id],
        );

        let likedByMe = false;
        if (user_id) {
          const [userLike] = await pool.query(
            "SELECT id FROM likes WHERE project_id = ? AND user_id = ?",
            [project.id, user_id],
          );
          likedByMe = userLike.length > 0;
        }

        return {
          id: project.id,
          owner_id: project.owner_id,
          title: project.title,
          description: project.description,
          skills_needed:
            typeof project.skills_needed === "string"
              ? JSON.parse(project.skills_needed)
              : project.skills_needed,
          project_type: project.project_type,
          created_at: project.created_at,
          owner: {
            id: project.owner_id,
            username: project.username,
            display_name: project.display_name,
            bio: project.bio,
            avatar_url: project.avatar_url,
            skills:
              typeof project.owner_skills === "string"
                ? JSON.parse(project.owner_skills)
                : project.owner_skills,
          },
          likes_count: likes[0].count,
          comments_count: comments[0].count,
          liked_by_me: likedByMe,
        };
      }),
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error("Erreur lors de la recherche de projets:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer le feed des projets
router.get("/feed", async (req, res) => {
  try {
    const userId = req.query.user_id;

    let query = `
      SELECT p.*, 
             u.id as owner_id, u.username, u.display_name, u.bio, u.avatar_url, u.skills as owner_skills
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `;

    const [projects] = await pool.query(query);

    // Pour chaque projet, compter les likes et commentaires
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const [likes] = await pool.query(
          "SELECT COUNT(*) as count FROM likes WHERE project_id = ?",
          [project.id],
        );
        const [comments] = await pool.query(
          "SELECT COUNT(*) as count FROM comments WHERE project_id = ?",
          [project.id],
        );

        let likedByMe = false;
        if (userId) {
          const [userLike] = await pool.query(
            "SELECT id FROM likes WHERE project_id = ? AND user_id = ?",
            [project.id, userId],
          );
          likedByMe = userLike.length > 0;
        }

        return {
          id: project.id,
          owner_id: project.owner_id,
          title: project.title,
          description: project.description,
          skills_needed:
            typeof project.skills_needed === "string"
              ? JSON.parse(project.skills_needed)
              : project.skills_needed,
          project_type: project.project_type,
          images: typeof project.images === "string" ? JSON.parse(project.images) : project.images,
          created_at: project.created_at,
          owner: {
            id: project.owner_id,
            username: project.username,
            display_name: project.display_name,
            bio: project.bio,
            avatar_url: project.avatar_url,
            skills:
              typeof project.owner_skills === "string"
                ? JSON.parse(project.owner_skills)
                : project.owner_skills,
          },
          likes_count: likes[0].count,
          comments_count: comments[0].count,
          liked_by_me: likedByMe,
        };
      }),
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error("Erreur lors de la récupération du feed:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer un projet
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, skills_needed, project_type, images, status } = req.body;
    const ownerId = req.user.id;

    const skillsJson = JSON.stringify(skills_needed);
    const imagesJson = images ? JSON.stringify(images) : null;
    const projectStatus = status || "en_cours";

    const [result] = await pool.query(
      "INSERT INTO projects (owner_id, title, description, skills_needed, project_type, images, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [ownerId, title, description, skillsJson, project_type, imagesJson, projectStatus],
    );

    const [projects] = await pool.query("SELECT * FROM projects WHERE id = ?", [result.insertId]);
    const project = projects[0];

    // Récupérer les infos du propriétaire pour l'événement
    const [owner] = await pool.query("SELECT username, display_name FROM users WHERE id = ?", [ownerId]);

    // Émettre l'événement de création de projet
    notifyProjectCreated({
      ...project,
      owner_name: owner[0]?.display_name || owner[0]?.username
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer les projets d'un utilisateur
router.get("/user/:userId", async (req, res) => {
  try {
    const currentUserId = req.query.user_id;
    const [projects] = await pool.query(
      "SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC",
      [req.params.userId],
    );

    const projectsWithOwner = await Promise.all(
      projects.map(async (project) => {
        const [users] = await pool.query(
          "SELECT id, username, display_name, bio, avatar_url, skills FROM users WHERE id = ?",
          [project.owner_id],
        );

        // Get likes count
        const [likes] = await pool.query(
          "SELECT COUNT(*) as count FROM likes WHERE project_id = ?",
          [project.id],
        );

        // Get comments count
        const [comments] = await pool.query(
          "SELECT COUNT(*) as count FROM comments WHERE project_id = ?",
          [project.id],
        );

        // Check if current user liked this project
        let likedByMe = false;
        if (currentUserId) {
          const [userLikes] = await pool.query(
            "SELECT COUNT(*) as count FROM likes WHERE project_id = ? AND user_id = ?",
            [project.id, currentUserId],
          );
          likedByMe = userLikes[0].count > 0;
        }

        return {
          id: project.id,
          owner_id: project.owner_id,
          title: project.title,
          description: project.description,
          skills_needed:
            typeof project.skills_needed === "string"
              ? JSON.parse(project.skills_needed)
              : project.skills_needed,
          project_type: project.project_type,
          images: typeof project.images === "string" ? JSON.parse(project.images) : project.images,
          created_at: project.created_at,
          owner: users[0]
            ? {
                ...users[0],
                skills:
                  typeof users[0].skills === "string"
                    ? JSON.parse(users[0].skills)
                    : users[0].skills,
              }
            : null,
          likes_count: likes[0].count,
          comments_count: comments[0].count,
          liked_by_me: likedByMe,
        };
      }),
    );

    res.json(projectsWithOwner);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Modifier un projet
router.put("/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, skills_needed, project_type, images } = req.body;
    const userId = req.user.id;

    console.log("📝 Modification projet:", {
      projectId,
      title,
      images,
      userId,
    });

    // Vérifier que l'utilisateur est le propriétaire du projet
    const [projects] = await pool.query("SELECT owner_id FROM projects WHERE id = ?", [projectId]);

    if (projects.length === 0) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    if (projects[0].owner_id !== userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const skillsJson = skills_needed ? JSON.stringify(skills_needed) : null;
    const imagesJson = images ? JSON.stringify(images) : null;

    await pool.query(
      "UPDATE projects SET title = ?, description = ?, skills_needed = ?, project_type = ?, images = ? WHERE id = ?",
      [title, description, skillsJson, project_type, imagesJson, projectId],
    );

    const [updatedProjects] = await pool.query("SELECT * FROM projects WHERE id = ?", [projectId]);
    const project = updatedProjects[0];

    // Récupérer les infos du propriétaire pour l'événement
    const [owner] = await pool.query("SELECT username, display_name FROM users WHERE id = ?", [userId]);

    // Émettre l'événement de mise à jour de projet
    notifyProjectUpdated({
      ...project,
      owner_name: owner[0]?.display_name || owner[0]?.username
    });

    res.json(project);
  } catch (error) {
    console.error("Erreur lors de la modification du projet:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer un projet
router.delete("/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est le propriétaire du projet
    const [projects] = await pool.query("SELECT owner_id FROM projects WHERE id = ?", [projectId]);

    if (projects.length === 0) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    if (projects[0].owner_id !== userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await pool.query("DELETE FROM projects WHERE id = ?", [projectId]);

    // Émettre l'événement de suppression de projet
    notifyProjectDeleted(projectId, userId);

    res.json({ message: "Projet supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour le statut d'un projet
router.patch("/:projectId/status", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Valider le status
    const validStatuses = ["brouillon", "en_cours", "termine", "en_pause"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    // Vérifier que l'utilisateur est le propriétaire du projet
    const [projects] = await pool.query("SELECT owner_id FROM projects WHERE id = ?", [projectId]);

    if (projects.length === 0) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    if (projects[0].owner_id !== userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await pool.query("UPDATE projects SET status = ? WHERE id = ?", [status, projectId]);

    const [updatedProjects] = await pool.query("SELECT * FROM projects WHERE id = ?", [projectId]);

    res.json(updatedProjects[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Toggle like
router.post("/:projectId/like", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Vérifier si le like existe
    const [existingLike] = await pool.query(
      "SELECT id FROM likes WHERE project_id = ? AND user_id = ?",
      [projectId, userId],
    );

    if (existingLike.length > 0) {
      // Supprimer le like
      await pool.query("DELETE FROM likes WHERE project_id = ? AND user_id = ?", [
        projectId,
        userId,
      ]);

      // Compter les likes restants
      const [likesCount] = await pool.query(
        "SELECT COUNT(*) as count FROM likes WHERE project_id = ?",
        [projectId]
      );

      // Émettre l'événement de unlike
      notifyProjectLiked(projectId, userId, likesCount[0].count);

      res.json({ liked: false });
    } else {
      // Ajouter le like
      await pool.query("INSERT INTO likes (project_id, user_id) VALUES (?, ?)", [
        projectId,
        userId,
      ]);

      // Compter les likes
      const [likesCount] = await pool.query(
        "SELECT COUNT(*) as count FROM likes WHERE project_id = ?",
        [projectId]
      );

      // Créer une notification pour le propriétaire du projet
      const [project] = await pool.query("SELECT owner_id, title FROM projects WHERE id = ?", [
        projectId,
      ]);

      if (project.length > 0 && project[0].owner_id !== userId) {
        const [liker] = await pool.query("SELECT username, display_name FROM users WHERE id = ?", [
          userId,
        ]);

        await createNotification({
          user_id: project[0].owner_id,
          type: "like",
          title: "Nouveau like",
          message: `${liker[0].display_name || liker[0].username} a aimé votre projet "${project[0].title}"`,
          project_id: projectId,
          sender_id: userId,
        });
      }

      // Émettre l'événement de like
      notifyProjectLiked(projectId, userId, likesCount[0].count);

      res.json({ liked: true });
    }
  } catch (error) {
    console.error("Erreur lors du toggle like:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer les commentaires
router.get("/:projectId/comments", async (req, res) => {
  try {
    const [comments] = await pool.query(
      `SELECT c.*, u.id as user_id, u.username, u.display_name, u.bio, u.avatar_url, u.skills
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.project_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.projectId],
    );

    const commentsWithAuthor = comments.map((comment) => ({
      id: comment.id,
      project_id: comment.project_id,
      user_id: comment.user_id,
      parent_id: comment.parent_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      author: {
        id: comment.user_id,
        username: comment.username,
        display_name: comment.display_name,
        bio: comment.bio,
        avatar_url: comment.avatar_url,
        skills: typeof comment.skills === "string" ? JSON.parse(comment.skills) : comment.skills,
      },
    }));

    res.json(commentsWithAuthor);
  } catch (error) {
    console.error("Erreur lors de la récupération des commentaires:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Ajouter un commentaire ou une réponse
router.post("/:projectId/comments", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      "INSERT INTO comments (project_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)",
      [projectId, userId, parent_id || null, content],
    );

    // Récupérer les informations pour la notification et l'événement temps réel
    const [project] = await pool.query("SELECT owner_id, title FROM projects WHERE id = ?", [
      projectId,
    ]);

    const [commenter] = await pool.query("SELECT username, display_name FROM users WHERE id = ?", [
      userId,
    ]);

    // Créer une notification
    if (project.length > 0) {
      let notificationUserId = project[0].owner_id;
      let notificationType = "comment";
      let notificationTitle = "Nouveau commentaire";
      let notificationMessage = `${commenter[0].display_name || commenter[0].username} a commenté votre projet "${project[0].title}"`;

      // Si c'est une réponse à un commentaire
      if (parent_id) {
        const [parentComment] = await pool.query("SELECT user_id FROM comments WHERE id = ?", [
          parent_id,
        ]);
        if (parentComment.length > 0 && parentComment[0].user_id !== userId) {
          notificationUserId = parentComment[0].user_id;
          notificationType = "reply";
          notificationTitle = "Nouvelle réponse";
          notificationMessage = `${commenter[0].display_name || commenter[0].username} a répondu à votre commentaire`;
        }
      }

      // Ne pas créer de notification si c'est le même utilisateur
      if (notificationUserId !== userId) {
        await createNotification({
          user_id: notificationUserId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          project_id: projectId,
          sender_id: userId,
        });
      }
    }

    // Émettre l'événement de création de commentaire
    notifyCommentCreated({
      id: result.insertId,
      projectId: projectId,
      projectTitle: project[0]?.title,
      projectOwnerId: project[0]?.owner_id,
      authorId: userId,
      authorName: commenter[0]?.display_name || commenter[0]?.username,
      content: content,
      parentId: parent_id || null
    });

    res.status(201).json({
      id: result.insertId,
      project_id: projectId,
      user_id: userId,
      parent_id: parent_id || null,
      content,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Modifier un commentaire
router.put("/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est le propriétaire du commentaire
    const [comments] = await pool.query("SELECT user_id FROM comments WHERE id = ?", [commentId]);

    if (comments.length === 0) {
      return res.status(404).json({ error: "Commentaire non trouvé" });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await pool.query("UPDATE comments SET content = ? WHERE id = ?", [content, commentId]);

    res.json({ message: "Commentaire modifié" });
  } catch (error) {
    console.error("Erreur lors de la modification du commentaire:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer un commentaire
router.delete("/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est le propriétaire du commentaire
    const [comments] = await pool.query("SELECT user_id FROM comments WHERE id = ?", [commentId]);

    if (comments.length === 0) {
      return res.status(404).json({ error: "Commentaire non trouvé" });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await pool.query("DELETE FROM comments WHERE id = ?", [commentId]);

    res.json({ message: "Commentaire supprimé" });
  } catch (error) {
    console.error("Erreur lors de la suppression du commentaire:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
