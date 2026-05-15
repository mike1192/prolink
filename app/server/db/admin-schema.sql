-- Table des administrateurs pour le superadmin
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer un administrateur par défaut
INSERT INTO admin_users (email, password_hash, name, role) 
VALUES (
  'admin@superadmin.com', 
  '$2b$10$rQZ8kqVZ8qVZ8qVZ8qVZ8O8qVZ8qVZ8qVZ8qVZ8qVZ8qVZ8qVZ8qV', -- mot de passe: admin123
  'Super Administrateur',
  'superadmin'
) ON DUPLICATE KEY UPDATE email = email;