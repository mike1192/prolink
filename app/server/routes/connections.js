import express from "express";
import pool from "../db/pool.js";
import { authenticateToken } from "../middleware/auth.js";
import { createNotification } from "./notifications.js";
import { notifyConnectionCreated, notifyConnectionAccepted } from "../utils/realtime-events.js";

const router = express.Router();

// Envoyer une demande de connexion
router.post("/request", authenticateToken, async (req, res) => {
  try {
    const { receiver_id } = req.body;
    const requester_id = req.user.id;

    if (requester_id === receiver_id) {
      return res
        .status(400)
        .json({ error: "Vous ne pouvez pas vous envoyer une demande à vous-même" });
    }

    // Vérifier si une connexion existe déjà
    const [existing] = await pool.query(
      "SELECT id FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)",
      [requester_id, receiver_id, receiver_id, requester_id],
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Une connexion existe déjà" });
    }

    // Créer la demande
    const [result] = await pool.query(
      "INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, 'pending')",
      [requester_id, receiver_id],
    );

    // Récupérer les infos des utilisateurs pour l'événement
    const [requester] = await pool.query("SELECT username, display_name FROM users WHERE id = ?", [
      requester_id,
    ]);

    const [receiver] = await pool.query("SELECT username, display_name FROM users WHERE id = ?", [
      receiver_id,
    ]);

    // Créer une notification
    await createNotification({
      user_id: receiver_id,
      type: "follow",
      title: "Nouvelle demande de connexion",
      message: `${requester[0].display_name || requester[0].username} vous a envoyé une demande de connexion`,
      sender_id: requester_id,
    });

    // Émettre l'événement de création de connexion
    notifyConnectionCreated({
      id: result.insertId,
      requesterId: requester_id,
      requesterName: requester[0].display_name || requester[0].username,
      requestedId: receiver_id,
      requestedName: receiver[0].display_name || receiver[0].username,
      status: 'pending'
    });

    res.status(201).json({ message: "Demande de connexion envoyée" });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Accepter une demande de connexion
router.put("/accept/:connectionId", authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est le receiver
    const [connection] = await pool.query(
      "SELECT * FROM connections WHERE id = ? AND receiver_id = ? AND status = 'pending'",
      [connectionId, userId],
    );

    if (connection.length === 0) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }

    // Accepter la connexion
    await pool.query("UPDATE connections SET status = 'accepted' WHERE id = ?", [connectionId]);

    // Récupérer les infos des utilisateurs pour l'événement
    const [requester] = await pool.query("SELECT username, display_name FROM users WHERE id = ?", [
      connection[0].requester_id,
    ]);

    const [receiver] = await pool.query("SELECT username, display_name FROM users WHERE id = ?", [
      userId,
    ]);

    // Créer une notification
    await createNotification({
      user_id: connection[0].requester_id,
      type: "follow",
      title: "Demande acceptée",
      message: `${receiver[0].display_name || receiver[0].username} a accepté votre demande de connexion`,
      sender_id: userId,
    });

    // Émettre l'événement d'acceptation de connexion
    notifyConnectionAccepted({
      id: connectionId,
      requesterId: connection[0].requester_id,
      requesterName: requester[0].display_name || requester[0].username,
      requestedId: userId,
      requestedName: receiver[0].display_name || receiver[0].username,
      status: 'accepted'
    });

    res.json({ message: "Demande acceptée" });
  } catch (error) {
    console.error("Erreur lors de l'acceptation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Refuser une demande de connexion
router.put("/reject/:connectionId", authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user.id;

    const [connection] = await pool.query(
      "SELECT * FROM connections WHERE id = ? AND receiver_id = ? AND status = 'pending'",
      [connectionId, userId],
    );

    if (connection.length === 0) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }

    await pool.query("DELETE FROM connections WHERE id = ?", [connectionId]);

    res.json({ message: "Demande refusée" });
  } catch (error) {
    console.error("Erreur lors du refus:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer une connexion
router.delete("/:connectionId", authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user.id;

    const [connection] = await pool.query(
      "SELECT * FROM connections WHERE id = ? AND status = 'accepted' AND (requester_id = ? OR receiver_id = ?)",
      [connectionId, userId, userId],
    );

    if (connection.length === 0) {
      return res.status(404).json({ error: "Connexion non trouvée" });
    }

    await pool.query("DELETE FROM connections WHERE id = ?", [connectionId]);

    res.json({ message: "Connexion supprimée" });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir les connexions d'un utilisateur
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [connections] = await pool.query(
      `SELECT c.*, 
        u.id as user_id, u.username, u.display_name, u.bio, u.avatar_url, u.job_title, u.location
       FROM connections c
       JOIN users u ON (
         CASE 
           WHEN c.requester_id = ? THEN c.receiver_id = u.id
           WHEN c.receiver_id = ? THEN c.requester_id = u.id
         END
       )
       WHERE c.status = 'accepted' AND (c.requester_id = ? OR c.receiver_id = ?)
       ORDER BY c.updated_at DESC`,
      [userId, userId, userId, userId],
    );

    const connectionsWithDetails = connections.map((conn) => ({
      id: conn.id,
      user: {
        id: conn.user_id,
        username: conn.username,
        display_name: conn.display_name,
        bio: conn.bio,
        avatar_url: conn.avatar_url,
        job_title: conn.job_title,
        location: conn.location,
      },
      created_at: conn.created_at,
    }));

    res.json(connectionsWithDetails);
  } catch (error) {
    console.error("Erreur lors de la récupération des connexions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir les demandes de connexion en attente
router.get("/pending", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests] = await pool.query(
      `SELECT c.*, 
        u.id as user_id, u.username, u.display_name, u.bio, u.avatar_url, u.job_title, u.location
       FROM connections c
       JOIN users u ON c.requester_id = u.id
       WHERE c.receiver_id = ? AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId],
    );

    const requestsWithDetails = requests.map((req) => ({
      id: req.id,
      user: {
        id: req.user_id,
        username: req.username,
        display_name: req.display_name,
        bio: req.bio,
        avatar_url: req.avatar_url,
        job_title: req.job_title,
        location: req.location,
      },
      created_at: req.created_at,
    }));

    res.json(requestsWithDetails);
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Vérifier le statut de connexion entre deux utilisateurs
router.get("/status/:otherUserId", authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    const [connections] = await pool.query(
      "SELECT * FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)",
      [userId, otherUserId, otherUserId, userId],
    );

    if (connections.length === 0) {
      return res.json({ status: "none" });
    }

    const conn = connections[0];
    let status;

    if (conn.status === "accepted") {
      status = "connected";
    } else if (conn.status === "pending") {
      if (conn.requester_id === userId) {
        status = "sent";
      } else {
        status = "received";
      }
    }

    res.json({ status, connection_id: conn.id });
  } catch (error) {
    console.error("Erreur lors de la vérification du statut:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Suggestions de connexions (personnes que vous pourriez connaître)
router.get("/suggestions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Trouver des personnes qui ne sont pas déjà dans les connexions
    const [suggestions] = await pool.query(
      `SELECT DISTINCT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.job_title, u.location, u.skills
       FROM users u
       WHERE u.id != ?
         AND u.id NOT IN (
           SELECT CASE 
             WHEN c.requester_id = ? THEN c.receiver_id 
             ELSE c.requester_id 
           END
           FROM connections c
           WHERE c.status = 'accepted' AND (c.requester_id = ? OR c.receiver_id = ?)
         )
         AND u.id NOT IN (
           SELECT c.receiver_id FROM connections c WHERE c.requester_id = ? AND c.status = 'pending'
         )
       ORDER BY RAND()
       LIMIT 10`,
      [userId, userId, userId, userId, userId],
    );

    const suggestionsWithSkills = suggestions.map((user) => ({
      ...user,
      skills: typeof user.skills === "string" ? JSON.parse(user.skills) : user.skills,
    }));

    res.json(suggestionsWithSkills);
  } catch (error) {
    console.error("Erreur lors de la récupération des suggestions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir les relations en commun
router.get("/mutual/:otherUserId", authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    const [mutual] = await pool.query(
      `SELECT DISTINCT u.id, u.username, u.display_name, u.avatar_url, u.job_title
       FROM connections c1
       JOIN connections c2 ON (
         CASE 
           WHEN c1.requester_id = ? THEN c1.receiver_id
           ELSE c1.requester_id
         END = 
         CASE 
           WHEN c2.requester_id = ? THEN c2.receiver_id
           ELSE c2.requester_id
         END
       )
       JOIN users u ON u.id = (
         CASE 
           WHEN c2.requester_id = ? THEN c2.receiver_id
           ELSE c2.requester_id
         END
       )
       WHERE c1.status = 'accepted' AND c2.status = 'accepted'
         AND (c1.requester_id = ? OR c1.receiver_id = ?)
         AND (c2.requester_id = ? OR c2.receiver_id = ?)
         AND u.id != ?
       LIMIT 10`,
      [userId, otherUserId, otherUserId, userId, userId, otherUserId, otherUserId, otherUserId],
    );

    res.json(mutual);
  } catch (error) {
    console.error("Erreur lors de la récupération des relations en commun:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
