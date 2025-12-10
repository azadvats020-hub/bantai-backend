// DB init script: creates simple tables for sessions and messages
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'jarvis.db');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dbExists = fs.existsSync(DB_PATH);

  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    // sessions table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at INTEGER
    )`);

    // messages table stores short-term conversation history
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      role TEXT,
      content TEXT,
      created_at INTEGER
    )`);
  });

  db.close();

  if (!dbExists) {
    console.log(`Created new DB at ${DB_PATH}`);
  }
}

if (require.main === module) {
  ensureDb();
  console.log('Migration complete (init_db ran)');
}

module.exports = { ensureDb };
