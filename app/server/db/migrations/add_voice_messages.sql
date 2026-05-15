-- Migration: Support pour messages vocaux et fichiers avancés
USE projectlink;

-- Ajouter les colonnes pour les messages vocaux
ALTER TABLE messages 
ADD COLUMN audio_url VARCHAR(500) NULL AFTER file_type,
ADD COLUMN audio_duration INT NULL AFTER audio_url,
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE AFTER is_read,
ADD COLUMN forwarded_from VARCHAR(36) NULL AFTER audio_duration,
ADD INDEX idx_audio (audio_url),
ADD INDEX idx_pinned (is_pinned),
ADD INDEX idx_forwarded (forwarded_from);
