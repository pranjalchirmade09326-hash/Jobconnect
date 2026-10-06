require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// =======================
// CORS
// =======================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://jobconnect-frontend.vercel.app" // apna Vercel URL
    ],
    credentials: true
  })
);

// =======================
// Middleware
// =======================
app.use(express.json());

// =======================
// Test Route
// =======================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "JobConnect Backend is running!"
  });
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