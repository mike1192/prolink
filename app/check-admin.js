import pool from './server/db/pool.js';
import bcrypt from 'bcrypt';

async function checkAdmin() {
  try {
    console.log('🔍 Vérification de l\'utilisateur admin...');
    
    // Vérifier si l'admin existe
    const [rows] = await pool.execute(
      'SELECT id, email, password_hash, name, role, is_active FROM admin_users WHERE email = ?',
      ['admin@superadmin.com']
    );
    
    if (rows.length === 0) {
      console.log('❌ Aucun admin trouvé avec cet email');
      
      // Créer l'admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        'INSERT INTO admin_users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        ['admin@superadmin.com', hashedPassword, 'Super Administrateur', 'superadmin']
      );
      
      console.log('✅ Admin créé avec succès');
    } else {
      const admin = rows[0];
      console.log('✅ Admin trouvé:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        is_active: admin.is_active
      });
      
      // Tester le mot de passe
      const isValidPassword = await bcrypt.compare('admin123', admin.password_hash);
      console.log('🔑 Mot de passe valide:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('🔧 Mise à jour du mot de passe...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.execute(
          'UPDATE admin_users SET password_hash = ? WHERE email = ?',
          [hashedPassword, 'admin@superadmin.com']
        );
        console.log('✅ Mot de passe mis à jour');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkAdmin();