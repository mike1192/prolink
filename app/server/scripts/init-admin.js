import bcrypt from 'bcrypt';
import pool from '../db/pool.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeAdmin() {
  try {
    console.log('🔧 Initialisation de la table admin...');
    
    // Lire et exécuter le schéma admin
    const schemaPath = join(__dirname, '../db/admin-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Diviser les requêtes SQL
    const queries = schema.split(';').filter(query => query.trim());
    
    for (const query of queries) {
      if (query.trim()) {
        await pool.execute(query);
      }
    }
    
    // Créer le mot de passe hashé pour l'admin par défaut
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Vérifier si l'admin existe déjà
    const [existingAdmin] = await pool.execute(
      'SELECT id FROM admin_users WHERE email = ?',
      ['admin@superadmin.com']
    );
    
    if (existingAdmin.length === 0) {
      // Créer l'administrateur par défaut
      await pool.execute(
        'INSERT INTO admin_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        ['admin@superadmin.com', hashedPassword, 'Super Administrateur', 'superadmin']
      );
      
      console.log('✅ Administrateur par défaut créé:');
      console.log('   Email: admin@superadmin.com');
      console.log('   Mot de passe: admin123');
    } else {
      console.log('ℹ️  Administrateur par défaut existe déjà');
    }
    
    console.log('✅ Initialisation terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
initializeAdmin();