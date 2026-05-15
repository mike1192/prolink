-- Migration: Ajouter le support des réponses aux commentaires
USE projectlink;

-- Ajouter la colonne parent_id pour les réponses
ALTER TABLE comments 
ADD COLUMN parent_id VARCHAR(36) NULL AFTER user_id,
ADD FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
ADD INDEX idx_parent (parent_id);
