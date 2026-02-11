require("dotenv").config();
const express = require("express");
const cors = require("cors");
const assistantRoutes = require("./routes/assistant");
const authRoutes = require("./routes/auth");
const { ensureDb } = require("./db/init_db");

const app = express();

app.use(
  cors({
    origin: "*", // we will lock this later
  })
);

app.use(express.json());

// Initialize DB
ensureDb();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assistant", assistantRoutes);

app.get("/", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`);
});
