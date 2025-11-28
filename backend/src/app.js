import express from "express";
import cors from "cors";
import helmet from "helmet";
import { db } from "./db/connection.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
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

// Health check
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection with Drizzle
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

// Auth routes
app.use("/api/auth", authRoutes);

// Example protected route (add rate limiting later)
app.get("/api/protected/data", (req, res) => {
  res.json({ message: "This is protected data" });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
