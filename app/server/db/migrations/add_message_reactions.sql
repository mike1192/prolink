-- Migration: Ajouter les réactions aux messages
USE projectlink;

-- Créer la table des réactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  message_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_reaction (message_id, user_id, emoji),
  INDEX idx_message (message_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
