require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-frontend.vercel.app"
    ],
    credentials: true
  })
);

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "JobConnect Backend is running!"
  });
});

// Your API routes
// Example:
// const authRoutes = require("./routes/authRoutes");
// app.use("/api/auth", authRoutes);

// const jobRoutes = require("./routes/jobRoutes");
// app.use("/api/jobs", jobRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});