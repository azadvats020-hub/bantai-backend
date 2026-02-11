const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const MEMORY_PATH = path.join(__dirname, "../db/memory.json");

// ---- Helpers ----
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    return { preferences: {} };
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Normalize keys so save & retrieve always match
function normalizeKey(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

// Save preference
function savePreference(key, value) {
  const memory = readJson(MEMORY_PATH);

  if (!memory.preferences) {
    memory.preferences = {};
  }

  const normalizedKey = normalizeKey(key);
  memory.preferences[normalizedKey] = value;

  writeJson(MEMORY_PATH, memory);
}

// Get preference
function getPreference(key) {
  const memory = readJson(MEMORY_PATH);
  const normalizedKey = normalizeKey(key);
  return memory.preferences
    ? memory.preferences[normalizedKey]
    : null;
}

// -------- ROUTE --------
router.post("/", (req, res) => {
  const prompt = (req.body.prompt || "").toLowerCase().trim();

  // 1) REMEMBER SOMETHING
  if (prompt.startsWith("remember")) {
    const text = prompt
      .replace("remember that", "")
      .replace("remember", "")
      .trim();

    const parts = text.split(" is ");

    if (parts.length === 2) {
      const key = parts[0].trim();   // "my favorite dish"
      const value = parts[1].trim(); // "chole bhature"

      savePreference(key, value);

      return res.json({
        reply: `Got it! I’ll remember that your ${key} is ${value}.`
      });
    }

    return res.json({
      reply:
        "Please say like: 'Remember my favorite dish is chole bhature.'"
    });
  }

  // 2) ASK ABOUT MEMORY
  if (prompt.includes("what is my") || prompt.includes("do you remember")) {
    let key = prompt
      .replace("what is my", "")
      .replace("do you remember my", "")
      .replace("do you remember", "")
      .replace("?", "")
      .trim();

    const value = getPreference(key);

    if (value) {
      return res.json({
        reply: `You told me that your ${key} is ${value}.`
      });
    } else {
      return res.json({
        reply: `I don’t have anything saved about your ${key} yet.`
      });
    }
  }

  // 3) DEFAULT
  return res.json({
    reply: `You said: "${req.body.prompt}". I can remember things if you ask me to.`
  });
});

module.exports = router;
