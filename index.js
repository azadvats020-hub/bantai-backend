require("dotenv").config();
const express = require("express");
const cors = require("cors");
const assistantRoutes = require("./routes/assistant");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");
const { ensureDb } = require("./db/init_db");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Initialize DB
ensureDb();

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/assistant", authMiddleware, assistantRoutes);

app.get("/", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`);
});