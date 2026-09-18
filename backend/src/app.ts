import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config/index.js";
import authRoutes from "./routes/auth.js";
import analyticsRoutes from "./routes/analytics.js";
import importRoutes from "./routes/import.js";
import filesRoutes from "./routes/files.js";
import vaultRoutes from "./routes/vault.js";
import auditLogRoutes from "./routes/auditLogs.js";
import userRoutes from "./routes/users.js";
import n8nRoutes from "./routes/n8n.js";

const app = express();

// Middleware
// app.use(cors({
//   origin: config.corsOrigin,
//   credentials: true,
// }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, _res, next) => {
  if (req.path !== "/health") {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/import", importRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/n8n", n8nRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

// Connect to MongoDB and start server
async function start() {
  try {
    if (!config.jwtSecret) {
      console.error("ERROR: JWT_SECRET environment variable is required");
      process.exit(1);
    }
    if (!config.encryptionKey) {
      console.error("ERROR: ENCRYPTION_KEY environment variable is required");
      process.exit(1);
    }

    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

export default app;
