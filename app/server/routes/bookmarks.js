import express from "express";
import pool from "../db/pool.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Toggle bookmark (ajouter/supprimer)
router.post("/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Vérifier si le bookmark existe déjà
    const [existing] = await pool.query(
      "SELECT id FROM bookmarks WHERE user_id = ? AND project_id = ?",
      [userId, projectId],
    );

    if (existing.length > 0) {
      // Supprimer le bookmark
      await pool.query("DELETE FROM bookmarks WHERE user_id = ? AND project_id = ?", [
        userId,
        projectId,
      ]);
      res.json({ bookmarked: false });
    } else {
      // Ajouter le bookmark
      await pool.query("INSERT INTO bookmarks (user_id, project_id) VALUES (?, ?)", [
        userId,
        projectId,
      ]);
      res.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Erreur lors du toggle bookmark:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir les bookmarks d'un utilisateur
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [bookmarks] = await pool.query(
      `SELECT p.*, 
        u.id as owner_id, u.username, u.display_name, u.bio, u.avatar_url, u.skills as owner_skills
       FROM bookmarks b
       JOIN projects p ON b.project_id = p.id
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId],
    );

    const projectsWithStats = await Promise.all(
      bookmarks.map(async (project) => {
        const [likes] = await pool.query(
          "SELECT COUNT(*) as count FROM likes WHERE project_id = ?",
          [project.id],
        );
        const [comments] = await pool.query(
          "SELECT COUNT(*) as count FROM comments WHERE project_id = ?",
          [project.id],
        );

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
          liked_by_me: false,
          bookmarked_by_me: true,
        };
      }),
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error("Erreur lors de la récupération des bookmarks:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Vérifier si un projet est bookmarqué
router.get("/:projectId/check", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const [bookmarks] = await pool.query(
      "SELECT id FROM bookmarks WHERE user_id = ? AND project_id = ?",
      [userId, projectId],
    );

    res.json({ bookmarked: bookmarks.length > 0 });
  } catch (error) {
    console.error("Erreur lors de la vérification du bookmark:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
