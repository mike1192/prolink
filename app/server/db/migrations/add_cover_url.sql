-- Ajouter le champ cover_url à la table users
ALTER TABLE users ADD COLUMN cover_url VARCHAR(500) AFTER avatar_url;
