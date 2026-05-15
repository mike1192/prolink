-- Migration: Ajouter les champs de profil utilisateur
USE projectlink;

-- Ajouter les colonnes pour améliorer le profil utilisateur
ALTER TABLE users 
ADD COLUMN job_title VARCHAR(100) AFTER bio,
ADD COLUMN location VARCHAR(100) AFTER job_title,
ADD COLUMN website VARCHAR(255) AFTER location,
ADD COLUMN github VARCHAR(100) AFTER website,
ADD COLUMN twitter VARCHAR(100) AFTER github,
ADD COLUMN linkedin VARCHAR(100) AFTER twitter;
