require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { pool } = require("./config/db");

const app = express();

// =======================
// CORS Configuration
// =======================
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow localhost or any vercel.app domain
      if (
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app") ||
        origin === "https://jobconnect-j8cu.vercel.app"
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// =======================
// Middleware
// =======================
app.use(express.json());

// =======================
// Test & Health Routes
// =======================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "JobConnect Backend is running!"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1 AS ok");
    res.json({
      status: "ok",
      database: "connected",
      time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: err.message,
      code: err.code
    });
  }
});

// =======================
// API Routes
// =======================
const apiRoutes = require("./routes/routes");
app.use("/api", apiRoutes);

// =======================
// Error Handling Middleware
// =======================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
});

// =======================
// PORT
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`JobConnect Backend running on port ${PORT}`);
});