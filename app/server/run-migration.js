import pool from "./db/pool.js";
import fs from "fs";
import path from "path";

const migrationFile =
  process.argv[2] || path.join("server", "db", "migrations", "add_project_images.sql");
const sql = fs.readFileSync(migrationFile, "utf8");

async function runMigration() {
  try {
    console.log(`🚀 Exécution de la migration: ${migrationFile}`);
    const statements = sql.split(";").filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim().startsWith("USE")) continue;
      try {
        await pool.query(statement);
        console.log(
          "✅ Exécuté:",
          statement.substring(0, 80) + (statement.length > 80 ? "..." : ""),
        );
      } catch (error) {
        // Ignorer les erreurs de colonnes/tables dupliquées
        if (
          error.code === "ER_DUP_FIELDNAME" ||
          error.code === "ER_DUP_KEY" ||
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          error.code === "ER_DUP_KEYNAME"
        ) {
          console.log(
            "⚠️  Ignoré (existe déjà):",
            statement.substring(0, 80) + (statement.length > 80 ? "..." : ""),
          );
        } else {
          throw error;
        }
      }
    }

    console.log("✨ Migration terminée avec succès!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur migration:", error);
    process.exit(1);
  }
}

runMigration();
