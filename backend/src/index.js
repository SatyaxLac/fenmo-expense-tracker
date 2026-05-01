import express from "express";
import cors from "cors";
import expenseRoutes from "./routes/expenses.js";
import { getDatabase, closeDatabase } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---

// CORS: Allow frontend origin in development and production
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Idempotency-Key"],
  })
);

// Parse JSON bodies with a reasonable size limit
app.use(express.json({ limit: "1mb" }));

// Request logging (simple, production would use morgan or pino)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// --- Routes ---

app.use("/expenses", expenseRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// --- Server startup ---

// Initialize database on startup
getDatabase();
console.log("Database initialized");

const server = app.listen(PORT, () => {
  console.log(`Expense Tracker API running on http://localhost:${PORT}`);
});

// Graceful shutdown
function shutdown() {
  console.log("\nShutting down gracefully...");
  server.close(() => {
    closeDatabase();
    console.log("Server closed");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { app };
