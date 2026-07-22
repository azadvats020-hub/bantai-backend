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

    // USER PREFERENCES TABLE
    db.run(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, key)
      )
    `);
  });
}

function savePreference(userId, key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO user_preferences (user_id, key, value)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
      [userId, key, value, value],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function getPreference(userId, key) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT value FROM user_preferences WHERE user_id = ? AND key = ?`,
      [userId, key],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.value : null);
      }
    );
  });
}

function getAllPreferences(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT key, value FROM user_preferences WHERE user_id = ?`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

module.exports = { db, ensureDb, savePreference, getPreference, getAllPreferences };