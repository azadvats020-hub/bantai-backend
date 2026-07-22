const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { db } = require("../db/init_db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// SIGNUP
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
    [email, hashed, name],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "User already exists" });
      }
      const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET);
      res.json({ token, user: { id: this.lastID, email, name } });
    }
  );
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email, name: user.name } });
  });
});

module.exports = router;