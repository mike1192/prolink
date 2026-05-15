-- Migration: Ajout des fonctionnalités sociales (connexions, bookmarks, messages améliorés)
USE projectlink;

-- Table des connexions/relations entre utilisateurs (style LinkedIn/Facebook)
CREATE TABLE IF NOT EXISTS connections (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  requester_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_connection (requester_id, receiver_id),
  INDEX idx_requester (requester_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des bookmarks/sauvegarde de projets
CREATE TABLE IF NOT EXISTS bookmarks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_bookmark (user_id, project_id),
  INDEX idx_user (user_id),
  INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter des champs supplémentaires à la table users (seulement s'ils n'existent pas)
-- Ces requêtes peuvent échouer si les colonnes existent déjà, ce n'est pas grave
ALTER TABLE users ADD COLUMN location VARCHAR(100);
ALTER TABLE users ADD COLUMN job_title VARCHAR(100);
ALTER TABLE users ADD COLUMN website VARCHAR(255);
ALTER TABLE users ADD COLUMN github_url VARCHAR(255);
ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(255);
ALTER TABLE users ADD COLUMN twitter_url VARCHAR(255);
ALTER TABLE users ADD COLUMN theme ENUM('dark', 'light') DEFAULT 'dark';
ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN public_profile BOOLEAN DEFAULT TRUE;

-- Ajouter le champ parent_id aux commentaires (pour les réponses)
ALTER TABLE comments ADD COLUMN parent_id VARCHAR(36) NULL;
ALTER TABLE comments ADD INDEX idx_parent (parent_id);

-- Améliorer la table messages pour le chat
ALTER TABLE messages ADD COLUMN conversation_id VARCHAR(36);
ALTER TABLE messages ADD INDEX idx_conversation_id (conversation_id);
ALTER TABLE messages ADD INDEX idx_created (created_at);

-- Créer un index pour les notifications non lues
ALTER TABLE notifications ADD INDEX idx_user_read (user_id, is_read);
