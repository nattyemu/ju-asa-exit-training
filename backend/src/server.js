import { PORT } from "./config/index.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { db } from "./db/connection.js";
import appRoutes from "./app.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Attach db to requests
app.use((req, res, next) => {
  req.db = db;
  next();
});

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

app.use("/api", appRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 JU ASA Exit Exam Training Platform Backend`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
