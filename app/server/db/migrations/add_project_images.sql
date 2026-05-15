USE projectlink;

-- Ajouter la colonne images à la table projects
ALTER TABLE projects
ADD COLUMN images JSON DEFAULT NULL AFTER project_type;
