require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173"
      // Later add your Vercel frontend URL here
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

/*
  KEEP YOUR EXISTING ROUTES HERE.

  For example, if you already have:

  const authRoutes = require("./routes/authRoutes");
  const jobRoutes = require("./routes/jobRoutes");

  then keep them and use:

  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", jobRoutes);
*/

// PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});