import express from "express";
import pool from "../db/pool.js";
import { authenticateToken } from "../middleware/auth.js";
import { io, connectedUsers } from "../index.js";
import { createNotification } from "./notifications.js";
import { notifyMessageSent, notifyMessageRead } from "../utils/realtime-events.js";

const router = express.Router();

function isSchemaError(error) {
  return (
    error?.code === "ER_BAD_FIELD_ERROR" ||
    error?.code === "ER_NO_SUCH_TABLE" ||
    error?.code === "ER_BAD_TABLE_ERROR" ||
    error?.errno === 1054 ||
    error?.errno === 1146
  );
}

async function fetchLatestMessageForPair(senderId, receiverId) {
  const [rows] = await pool.query(
    `SELECT *
     FROM messages
     WHERE sender_id = ? AND receiver_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [senderId, receiverId],
  );

  return rows[0] || null;
}

// Envoyer un message
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const { receiver_id, content, file_url, file_type, audio_url, audio_duration } = req.body;
    const sender_id = req.user.id;

    // Allow empty content if an attachment or audio message is provided.
    if ((!content || !content.trim()) && !audio_url && !file_url) {
      return res.status(400).json({ error: "Le message ne peut pas être vide" });
    }

    // Créer un conversation_id unique pour cette paire d'utilisateurs
    const conversation_id = [sender_id, receiver_id].sort().join("_");

    let result;
    try {
      [result] = await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, content, conversation_id, file_url, file_type) VALUES (?, ?, ?, ?, ?, ?)",
        [
          sender_id,
          receiver_id,
          content || "",
          conversation_id,
          file_url || null,
          file_type || null,
        ],
      );
    } catch (error) {
      if (!isSchemaError(error)) {
        throw error;
      }

      try {
        [result] = await pool.query(
          "INSERT INTO messages (sender_id, receiver_id, content, conversation_id) VALUES (?, ?, ?, ?)",
          [sender_id, receiver_id, content || "", conversation_id],
        );
      } catch (conversationError) {
        if (!isSchemaError(conversationError)) {
          throw conversationError;
        }

        [result] = await pool.query(
          "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
          [sender_id, receiver_id, content || ""],
        );
      }
    }

    // Update with audio fields if they exist (ignore error if columns don't exist yet)
    if (audio_url) {
      try {
        await pool.query("UPDATE messages SET audio_url = ?, audio_duration = ? WHERE id = ?", [
          audio_url,
          audio_duration || null,
          result.insertId,
        ]);
      } catch (err) {
        console.log("⚠️ Audio columns not available yet. Run migration: add_voice_messages.sql");
      }
    }

    // Créer une notification
    const [sender] = await pool.query("SELECT display_name, username FROM users WHERE id = ?", [
      sender_id,
    ]);
    try {
      await createNotification({
        user_id: receiver_id,
        type: "project_update",
        title: "Nouveau message",
        message: `${sender[0].display_name || sender[0].username} vous a envoyé un message`,
        sender_id: sender_id,
      });
    } catch (notificationError) {
      console.warn("Notification de message ignorée:", notificationError.message);
    }

    const message =
      (result.insertId
        ? (await pool.query("SELECT * FROM messages WHERE id = ?", [result.insertId]))[0][0]
        : null) || (await fetchLatestMessageForPair(sender_id, receiver_id));

    // Préparer les données du message enrichies
    const messageData = {
      ...message,
      sender: {
        id: sender_id,
        display_name: sender[0].display_name,
        username: sender[0].username,
      },
    };

    // Envoyer le message en temps réel via WebSocket au destinataire
    const recipientSocketId = connectedUsers.get(receiver_id);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("new_message", messageData);
      console.log(
        `📨 Message envoyé au destinataire ${receiver_id} via WebSocket (socket: ${recipientSocketId})`,
      );
    } else {
      console.log(`⚠️ Destinataire ${receiver_id} non connecté`);
    }

    // IMPORTANT: Aussi envoyer une confirmation à l'expéditeur pour le voir immédiatement
    const senderSocketId = connectedUsers.get(sender_id);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message_sent", messageData);
      console.log(
        `✅ Confirmation d'envoi envoyée à l'expéditeur ${sender_id} via WebSocket (socket: ${senderSocketId})`,
      );
    } else {
      console.log(`⚠️ Expéditeur ${sender_id} non connecté via WebSocket`);
    }

    // Émettre l'événement temps réel pour la synchronisation globale
    notifyMessageSent(messageData);

    res.status(201).json(messageData);
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir les conversations d'un utilisateur
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer la liste des conversations avec le dernier message
    const [messageRows] = await pool.query(
      `SELECT
          CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as user_id,
          u.username,
          u.display_name,
          u.avatar_url,
          u.job_title,
          m.content as last_message,
          m.created_at as last_message_at,
          m.sender_id,
          m.receiver_id,
          m.is_read
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id = ? OR m.receiver_id = ?
       ORDER BY m.created_at DESC, m.id DESC`,
      [userId, userId, userId, userId],
    );

    const conversationsByUser = new Map();

    for (const row of messageRows) {
      if (!conversationsByUser.has(row.user_id)) {
        conversationsByUser.set(row.user_id, {
          user_id: row.user_id,
          username: row.username,
          display_name: row.display_name,
          avatar_url: row.avatar_url,
          job_title: row.job_title,
          last_message: row.last_message,
          last_message_at: row.last_message_at,
          unread_count: 0,
        });
      }

      if (row.sender_id === row.user_id && row.receiver_id === userId && !row.is_read) {
        conversationsByUser.get(row.user_id).unread_count += 1;
      }
    }

    const conversations = Array.from(conversationsByUser.values());

    res.json(conversations);
  } catch (error) {
    console.error("Erreur lors de la récupération des conversations:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir les messages d'une conversation
router.get("/conversation/:otherUserId", authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    const conversation_id = [userId, otherUserId].sort().join("_");

    let messages;
    try {
      [messages] = await pool.query(
        `SELECT m.*, 
          s.id as sender_id, s.username as sender_username, s.display_name as sender_name, s.avatar_url as sender_avatar,
          r.id as receiver_id, r.username as receiver_username, r.display_name as receiver_name, r.avatar_url as receiver_avatar
         FROM messages m
         JOIN users s ON m.sender_id = s.id
         JOIN users r ON m.receiver_id = r.id
         WHERE m.conversation_id = ?
            OR ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
         ORDER BY m.created_at ASC`,
        [conversation_id, userId, otherUserId, otherUserId, userId],
      );
    } catch (schemaError) {
      if (!isSchemaError(schemaError)) {
        throw schemaError;
      }

      [messages] = await pool.query(
        `SELECT
          m.id,
          m.sender_id,
          m.receiver_id,
          m.content,
          m.is_read,
          m.created_at,
          s.username as sender_username,
          s.display_name as sender_name,
          s.avatar_url as sender_avatar
         FROM messages m
         JOIN users s ON m.sender_id = s.id
         WHERE (m.sender_id = ? AND m.receiver_id = ?)
            OR (m.sender_id = ? AND m.receiver_id = ?)
         ORDER BY m.created_at ASC`,
        [userId, otherUserId, otherUserId, userId],
      );
    }

    // Reformater les messages pour avoir le même format que le WebSocket
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      content: msg.content,
      file_url: msg.file_url || null,
      file_type: msg.file_type || null,
      audio_url: msg.audio_url || null,
      audio_duration: msg.audio_duration || null,
      conversation_id: msg.conversation_id || conversation_id,
      is_read: msg.is_read,
      read_at: msg.read_at || null,
      is_pinned: Boolean(msg.is_pinned),
      forwarded_from: msg.forwarded_from || null,
      created_at: msg.created_at,
      sender: {
        id: msg.sender_id,
        display_name: msg.sender_name,
        username: msg.sender_username,
        avatar_url: msg.sender_avatar,
      },
    }));

    // Marquer les messages comme lus
    try {
      await pool.query(
        `UPDATE messages
         SET is_read = TRUE
         WHERE receiver_id = ?
           AND (
             conversation_id = ?
             OR sender_id = ?
           )`,
        [userId, conversation_id, otherUserId],
      );
    } catch (schemaError) {
      if (!isSchemaError(schemaError)) {
        throw schemaError;
      }

      await pool.query(
        "UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?",
        [otherUserId, userId],
      );
    }

    res.json(formattedMessages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Marquer un message comme lu
router.put("/:messageId/read", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    await pool.query("UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?", [
      messageId,
      userId,
    ]);

    res.json({ message: "Message marqué comme lu" });
  } catch (error) {
    console.error("Erreur lors du marquage du message:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer un message
router.delete("/:messageId", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const [message] = await pool.query("SELECT * FROM messages WHERE id = ? AND sender_id = ?", [
      messageId,
      userId,
    ]);

    if (message.length === 0) {
      return res.status(404).json({ error: "Message non trouvé" });
    }

    await pool.query("DELETE FROM messages WHERE id = ?", [messageId]);

    res.json({ message: "Message supprimé" });
  } catch (error) {
    console.error("Erreur lors de la suppression du message:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir le nombre de messages non lus
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE",
      [userId],
    );

    res.json({ unread_count: result[0].count });
  } catch (error) {
    console.error("Erreur lors de la récupération du compteur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Marquer tous les messages d'une conversation comme lus
router.put("/conversation/:otherUserId/read-all", authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;
    const conversation_id = [userId, otherUserId].sort().join("_");

    let result;
    try {
      [result] = await pool.query(
        "UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE conversation_id = ? AND receiver_id = ? AND is_read = FALSE",
        [conversation_id, userId],
      );
    } catch (schemaError) {
      if (!isSchemaError(schemaError)) {
        throw schemaError;
      }

      [result] = await pool.query(
        "UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE",
        [otherUserId, userId],
      );
    }

    // Notifier l'expéditeur que ses messages ont été lus
    const senderSocketId = connectedUsers.get(otherUserId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message_read", {
        conversation_id,
        reader_id: userId,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ message: "Messages marqués comme lus", updated: result.affectedRows });
  } catch (error) {
    console.error("Erreur lors du marquage des messages:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Recherche dans les messages d'une conversation
router.get("/conversation/:otherUserId/search", authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: "Recherche trop courte (min 2 caractères)" });
    }

    const conversation_id = [userId, otherUserId].sort().join("_");

    const [messages] = await pool.query(
      `SELECT m.*, 
        s.id as sender_id, s.username as sender_username, s.display_name as sender_name,
        r.id as receiver_id, r.username as receiver_username, r.display_name as receiver_name
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE m.conversation_id = ? AND m.content LIKE ?
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [conversation_id, `%${q}%`],
    );

    res.json(messages);
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Ajouter une réaction à un message
// Modifier un message envoye
router.put("/:messageId", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Le message ne peut pas etre vide" });
    }

    const [messages] = await pool.query("SELECT * FROM messages WHERE id = ? AND sender_id = ?", [
      messageId,
      userId,
    ]);

    if (messages.length === 0) {
      return res.status(404).json({ error: "Message non modifiable" });
    }

    if (messages[0].audio_url || messages[0].file_url) {
      return res.status(400).json({ error: "Les fichiers et vocaux ne sont pas modifiables" });
    }

    await pool.query("UPDATE messages SET content = ? WHERE id = ?", [content.trim(), messageId]);

    const [updatedMessages] = await pool.query("SELECT * FROM messages WHERE id = ?", [messageId]);

    res.json(updatedMessages[0]);
  } catch (error) {
    console.error("Erreur lors de la modification du message:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer un message envoye
router.delete("/:messageId", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    await pool
      .query("DELETE FROM message_reactions WHERE message_id = ?", [messageId])
      .catch(() => {});

    const [result] = await pool.query("DELETE FROM messages WHERE id = ? AND sender_id = ?", [
      messageId,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Message non trouve" });
    }

    res.json({ message: "Message supprime" });
  } catch (error) {
    console.error("Erreur lors de la suppression du message:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/:messageId/reactions", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji requis" });
    }

    // Vérifier si la réaction existe déjà
    const [existing] = await pool.query(
      "SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?",
      [messageId, userId, emoji],
    );

    if (existing.length > 0) {
      // Supprimer la réaction (toggle)
      await pool.query("DELETE FROM message_reactions WHERE id = ?", [existing[0].id]);
      res.json({ message: "Réaction supprimée" });
    } else {
      // Ajouter la réaction
      await pool.query(
        "INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)",
        [messageId, userId, emoji],
      );
      res.status(201).json({ message: "Réaction ajoutée" });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la réaction:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir les réactions d'un message
router.get("/:messageId/reactions", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const [reactions] = await pool.query(
      `SELECT mr.*, u.id as user_id, u.username, u.display_name, u.avatar_url
       FROM message_reactions mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.message_id = ?
       ORDER BY mr.created_at ASC`,
      [messageId],
    );

    // Grouper par emoji
    const grouped = {};
    reactions.forEach((reaction) => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      grouped[reaction.emoji].count++;
      grouped[reaction.emoji].users.push({
        id: reaction.user_id,
        username: reaction.username,
        display_name: reaction.display_name,
        avatar_url: reaction.avatar_url,
      });
    });

    res.json(Object.values(grouped));
  } catch (error) {
    console.error("Erreur lors de la récupération des réactions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Épingler un message
router.put("/:messageId/pin", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est le destinataire ou l'expéditeur
    const [message] = await pool.query(
      "SELECT * FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)",
      [messageId, userId, userId],
    );

    if (message.length === 0) {
      return res.status(404).json({ error: "Message non trouvé" });
    }

    await pool.query("UPDATE messages SET is_pinned = TRUE WHERE id = ?", [messageId]);

    res.json({ message: "Message épinglé" });
  } catch (error) {
    console.error("Erreur lors de l'épinglage:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Désépingler un message
router.put("/:messageId/unpin", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    await pool.query(
      "UPDATE messages SET is_pinned = FALSE WHERE id = ? AND (sender_id = ? OR receiver_id = ?)",
      [messageId, userId, userId],
    );

    res.json({ message: "Message désépinglé" });
  } catch (error) {
    console.error("Erreur lors du désépinglage:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Transférer un message
router.post("/:messageId/forward", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { receiver_id } = req.body;
    const sender_id = req.user.id;

    // Récupérer le message original
    const [originalMessage] = await pool.query(
      "SELECT * FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)",
      [messageId, sender_id, sender_id],
    );

    if (originalMessage.length === 0) {
      return res.status(404).json({ error: "Message non trouvé" });
    }

    const original = originalMessage[0];
    const conversation_id = [sender_id, receiver_id].sort().join("_");

    // Créer le message transféré
    const [result] = await pool.query(
      "INSERT INTO messages (sender_id, receiver_id, content, conversation_id, file_url, file_type, audio_url, audio_duration, forwarded_from) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        sender_id,
        receiver_id,
        original.content,
        conversation_id,
        original.file_url,
        original.file_type,
        original.audio_url,
        original.audio_duration,
        messageId,
      ],
    );

    const [forwardedMessage] = await pool.query("SELECT * FROM messages WHERE id = ?", [
      result.insertId,
    ]);

    // Notifier le destinataire
    const recipientSocketId = connectedUsers.get(receiver_id);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("new_message", {
        ...forwardedMessage[0],
        sender: {
          id: sender_id,
          display_name: req.user.display_name,
          username: req.user.username,
        },
      });
    }

    res.status(201).json(forwardedMessage[0]);
  } catch (error) {
    console.error("Erreur lors du transfert:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Recherche globale dans tous les messages
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: "Recherche trop courte (min 2 caractères)" });
    }

    const [messages] = await pool.query(
      `SELECT m.*, 
        s.id as sender_id, s.username as sender_username, s.display_name as sender_name, s.avatar_url as sender_avatar,
        r.id as receiver_id, r.username as receiver_username, r.display_name as receiver_name, r.avatar_url as receiver_avatar,
        CASE 
          WHEN m.sender_id = ? THEN r.display_name
          ELSE s.display_name
        END as other_user_name
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE (m.sender_id = ? OR m.receiver_id = ?) AND m.content LIKE ?
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [userId, userId, userId, userId, `%${q}%`],
    );

    res.json(messages);
  } catch (error) {
    console.error("Erreur lors de la recherche globale:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
