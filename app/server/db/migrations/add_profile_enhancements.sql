-- Add availability status to users table
ALTER TABLE users 
ADD COLUMN availability_status ENUM('ouvert', 'ferme', 'projets_uniquement') DEFAULT 'ouvert' AFTER linkedin_url;

-- Add portfolio images (JSON array)
ALTER TABLE users 
ADD COLUMN portfolio_images JSON AFTER skills;

-- Add verified skills (JSON array)
ALTER TABLE users 
ADD COLUMN verified_skills JSON AFTER skills;
