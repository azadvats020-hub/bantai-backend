const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../db/init_db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// REGISTER
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
      [email, hashed, name || "User"],
      function (err) {
        if (err) {
          return res.status(400).json({ error: "User already exists" });
        }

        const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET, {
          expiresIn: "7d",
        });

        res.json({ token, user: { id: this.lastID, email, name } });
      }
    );
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
    }
  );
});

module.exports = router;
