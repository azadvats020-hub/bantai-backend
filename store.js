const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db', 'jarvis.db');

function openDb() {
  return new sqlite3.Database(DB_PATH);
}

function addMessage(sessionId, role, content) {
  const db = openDb();
  const createdAt = Date.now();
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)`,
      [sessionId, role, content, createdAt],
      function (err) {
        db.close();
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function getRecentMessages(sessionId, limit = 10) {
  const db = openDb();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?`,
      [sessionId, limit],
      (err, rows) => {
        db.close();
        if (err) return reject(err);
        // return in chronological order
        resolve(rows.reverse());
      }
    );
  });
}

module.exports = { addMessage, getRecentMessages };