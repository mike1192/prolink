-- Migration: Ajouter les préférences utilisateur
USE projectlink;

-- Ajouter les colonnes de préférences à la table users
ALTER TABLE users 
ADD COLUMN theme ENUM('dark', 'light') DEFAULT 'dark' AFTER cover_url,
ADD COLUMN notifications_enabled BOOLEAN DEFAULT true AFTER theme,
ADD COLUMN public_profile BOOLEAN DEFAULT true AFTER notifications_enabled;
