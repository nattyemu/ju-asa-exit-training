import { PORT } from "./config/index.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { db } from "./db/connection.js";
import appRoutes from "./app.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create necessary directories
const ensureDirectories = () => {
  const publicDir = path.join(__dirname, "public");
  const imgDir = path.join(publicDir, "img");
  const profilesDir = path.join(imgDir, "profiles");

  [publicDir, imgDir, profilesDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectories();

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Serve static files
app.use("/img", express.static(path.join(process.cwd(), "public/img")));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Attach db to requests
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await db.execute("SELECT 1");
    res.json({
      status: "OK",
      database: "Connected",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      status: "Error",
      database: "Disconnected",
      error: error.message,
    });
  }
});

// API routes
app.use("/api", appRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 JU ASA Exit Exam Training Platform Backend`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
