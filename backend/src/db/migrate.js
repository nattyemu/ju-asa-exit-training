import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  try {
    const connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      multipleStatements: true,
    });

    const db = drizzle(connection);

    console.log("📦 Running migrations...");

    // This will now work correctly with your folder structure
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "../..//drizzle"),
    });

    console.log("✅ Migrations completed successfully");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigrations();
