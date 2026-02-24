import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { DATABASE_URL } from "../config/index.js";

console.log("🔄 Connecting to database...");

let connection;
let db;

try {
  connection = await mysql.createConnection(DATABASE_URL);
  console.log("✅ Database connected successfully!");

  db = drizzle(connection);
  console.log("✅ Drizzle ORM initialized");
} catch (error) {
  console.error("❌ Database connection failed:", error.message);
  process.exit(1);
}

export { db };
export default db;
