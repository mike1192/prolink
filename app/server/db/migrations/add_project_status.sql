-- Add status column to projects table
ALTER TABLE projects 
ADD COLUMN status ENUM('brouillon', 'en_cours', 'termine', 'en_pause') DEFAULT 'en_cours' AFTER skills_needed;

-- Add index for status filtering
CREATE INDEX idx_projects_status ON projects(status);
