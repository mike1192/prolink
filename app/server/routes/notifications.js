import express from "express";
import pool from "../db/pool.js";
import { authenticateToken } from "../middleware/auth.js";
import { io, connectedUsers } from "../index.js";

const router = express.Router();

// Récupérer les notifications de l'utilisateur
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT n.*, 
             u.id as sender_user_id, u.username, u.display_name, u.avatar_url
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = ?
    `;
    const queryParams = [userId];

    if (unread_only === "true") {
      query += " AND n.is_read = FALSE";
    }

    query += " ORDER BY n.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [notifications] = await pool.query(query, queryParams);

    // Compter le total
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM notifications WHERE user_id = ?",
      [userId],
    );

    // Compter les non-lues
    const [unreadCount] = await pool.query(
      "SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId],
    );

    res.json({
      notifications: notifications.map((n) => ({
        ...n,
        sender: n.sender_user_id
          ? {
              id: n.sender_user_id,
              username: n.username,
              display_name: n.display_name,
              avatar_url: n.avatar_url,
            }
          : null,
      })),
      total: countResult[0].total,
      unread_count: unreadCount[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Marquer une notification comme lue
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [id, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification non trouvée" });
    }

    res.json({ message: "Notification marquée comme lue" });
  } catch (error) {
    console.error("Erreur lors du marquage de la notification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Marquer toutes les notifications comme lues
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
      [userId],
    );

    res.json({ message: "Toutes les notifications marquées comme lues" });
  } catch (error) {
    console.error("Erreur lors du marquage des notifications:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer une notification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await pool.query("DELETE FROM notifications WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification non trouvée" });
    }

    res.json({ message: "Notification supprimée" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer une notification (utilisé par d'autres routes)
export async function createNotification({
  user_id,
  type,
  title,
  message,
  project_id = null,
  sender_id = null,
}) {
  try {
    const [result] = await pool.query(
      "INSERT INTO notifications (user_id, type, title, message, project_id, sender_id) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, type, title, message, project_id, sender_id]
    );
    
    // Envoyer la notification en temps réel via WebSocket
    const recipientSocketId = connectedUsers.get(user_id);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("new_notification", {
        id: result.insertId,
        user_id,
        type,
        title,
        message,
        project_id,
        sender_id,
        is_read: false,
        created_at: new Date().toISOString(),
      });
      console.log(`📤 Notification envoyée à l'utilisateur ${user_id} via WebSocket`);
    }
    
    return result.insertId;
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
    return null;
  }
}

export default router;
