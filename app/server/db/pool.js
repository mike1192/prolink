import mysql from "mysql2/promise";
import dbConfig from "../config/db.json" with { type: "json" };

// Créer le pool de connexions MySQL
const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  waitForConnections: dbConfig.waitForConnections,
  connectionLimit: dbConfig.connectionLimit,
  queueLimit: dbConfig.queueLimit,
});

// Tester la connexion
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connecté à la base de données MySQL");
    connection.release();
  } catch (error) {
    console.error("❌ Erreur de connexion MySQL:", error.message);
  }
}

testConnection();

export default pool;
