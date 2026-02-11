require("dotenv").config();
const express = require('express');
const cors = require('cors');
const assistantRoutes = require('./routes/assistant');
const { ensureDb } = require('./db/init_db');

const app = express();
app.use(
  cors({
    origin: "*", // we will lock this down later
  })
);
app.use(express.json());

// ==========================
// YOUR EXISTING LOGIC (UNCHANGED)
// ==========================

// Initialize DB file if missing
ensureDb();

// Existing assistant routes (kept exactly as-is)
app.use('/api/assistant', assistantRoutes);

// Health check (kept exactly as-is)
app.get('/', (req, res) => res.json({ status: 'ok' }));

// ==========================
// ✅ NEW: STEP-1 (DEMO-FRIENDLY) APIS — ADDED BELOW
// ==========================

// TEMP in-memory store (we will later move this into your SQLite DB)
const preferencesStore = {};

/**
 * 1️⃣ SAVE USER PREFERENCES
 * Example request body:
 * {
 *   "userId": "prashant",
 *   "key": "favorite_food",
 *   "value": "butter chicken"
 * }
 */
app.post("/api/preferences", (req, res) => {
  const { userId, key, value } = req.body;

  if (!userId || !key || !value) {
    return res.status(400).json({
      success: false,
      message: "userId, key and value are required"
    });
  }

  if (!preferencesStore[userId]) {
    preferencesStore[userId] = {};
  }

  preferencesStore[userId][key] = value;

  res.json({
    success: true,
    message: "Preference saved",
    saved: { key, value }
  });
});

/**
 * 2️⃣ EXECUTE COMMAND (BANTY BRAIN)
 * This will be called from Android later.
 *
 * Example request body:
 * {
 *   "userId": "prashant",
 *   "intent": "ORDER_FOOD"
 * }
 */
app.post("/api/execute", (req, res) => {
  const { userId, intent, context } = req.body;

  if (!userId || !intent) {
    return res.status(400).json({
      success: false,
      message: "userId and intent are required"
    });
  }

  // ---- DEMO USE CASE: ORDER FOOD ----
  if (intent === "ORDER_FOOD") {
    const favFood =
      preferencesStore?.[userId]?.favorite_food || "Butter Chicken";

    return res.json({
      action: "OPEN_URL",
      url:
        "https://www.swiggy.com/search?query=" +
        encodeURIComponent(favFood),
      message: `Searching your favorite dish: ${favFood}`
    });
  }

  // ---- DEMO USE CASE: READ CALENDAR ----
  if (intent === "READ_CALENDAR") {
    return res.json({
      action: "SPEAK",
      message: "I will ask your Android app to read today's calendar"
    });
  }

  // ---- DEFAULT FALLBACK ----
  res.json({
    action: "SPEAK",
    message: "Command received, but no handler found"
  });
});

// ==========================
// SERVER START (UNCHANGED)
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`);
});
