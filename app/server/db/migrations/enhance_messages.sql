-- Migration: Améliorer le système de messages
USE projectlink;

-- Ajouter les colonnes pour les fichiers et le statut de lecture avancé
ALTER TABLE messages 
ADD COLUMN file_url VARCHAR(500) NULL AFTER content,
ADD COLUMN file_type VARCHAR(50) NULL AFTER file_url,
ADD COLUMN read_at TIMESTAMP NULL AFTER is_read,
ADD INDEX idx_file_type (file_type);
