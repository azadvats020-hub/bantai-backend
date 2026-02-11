const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.join(__dirname, "bantai.db");
const db = new sqlite3.Database(DB_PATH);

function ensureDb() {
  db.serialize(() => {
    // USERS TABLE
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // (We will add preferences table in STEP 2)
  });
}

module.exports = { db, ensureDb };
