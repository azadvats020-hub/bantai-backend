const express = require("express");
const { savePreference, getPreference, getAllPreferences } = require("../db/init_db");

const router = express.Router();

function normalizeKey(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

router.post("/", async (req, res) => {
  const prompt = (req.body.prompt || "").toLowerCase().trim();
  const userId = req.user ? req.user.userId : null;

  // 1) REMEMBER SOMETHING
  if (prompt.startsWith("remember")) {
    const text = prompt
      .replace("remember that", "")
      .replace("remember", "")
      .trim();

    const parts = text.split(" is ");

    if (parts.length === 2 && userId) {
      const rawKey = parts[0].trim();
      const key = normalizeKey(rawKey);
      const value = parts[1].trim();

      await savePreference(userId, key, value);

      return res.json({
        reply: `Got it! I'll remember that your ${rawKey.replace(/^my /, "")} is ${value}.`
      });
    }

    return res.json({
      reply: "Please say: 'Remember my favorite dish is biryani.'"
    });
  }

  // 2) ASK ABOUT A PREFERENCE
  if (prompt.includes("what is my") || prompt.includes("do you remember")) {
    let keyRaw = prompt
      .replace("what is my", "my")
      .replace("do you remember my", "my")
      .replace("do you remember", "")
      .replace("?", "")
      .trim();

    const normalizedKey = normalizeKey(keyRaw);

    if (userId) {
      const value = await getPreference(userId, normalizedKey);

      if (value) {
        return res.json({
          reply: `Your ${keyRaw.replace(/^my /, "")} is ${value}.`
        });
      } else {
        return res.json({
          reply: `I don't have anything saved for your ${keyRaw.replace(/^my /, "")} yet. You can tell me by saying 'Remember my ${keyRaw.replace(/^my /, "")} is ...'`
        });
      }
    }
  }

  // 3) SHOW ALL PREFERENCES
  if (prompt.includes("what do you know about me") || prompt.includes("my preferences")) {
    if (userId) {
      const prefs = await getAllPreferences(userId);

      if (prefs.length === 0) {
        return res.json({
          reply: "I don't know anything about you yet. Start telling me your preferences!"
        });
      }

      const list = prefs
        .map(p => `${p.key.replace(/_/g, " ").replace(/^my /, "")}: ${p.value}`)
        .join(", ");

      return res.json({
        reply: `Here's what I know about you: ${list}`
      });
    }
  }

  // 4) EXTRACT PREFERENCE FROM CASUAL CONVERSATION
  if (prompt.includes(" is ") && userId) {
    const patterns = [
      "my favorite food is",
      "my favorite dish is",
      "my preferred seat is",
      "my travel class is",
      "my preferred airline is",
      "my home address is",
      "my office is",
      "my favorite restaurant is",
    ];

    for (const pattern of patterns) {
      if (prompt.includes(pattern)) {
        const key = normalizeKey(pattern.replace(" is", ""));
        const value = prompt.split(pattern)[1].trim();
        await savePreference(userId, key, value);
        const label = pattern.replace("my ", "").replace(" is", "");
        return res.json({
          reply: `Got it! I've noted that your ${label} is ${value}.`
        });
      }
    }
  }

  // 5) DEFAULT
  return res.json({
    reply: `You said: "${req.body.prompt}". I can remember your preferences — just tell me things like 'My favorite food is biryani'.`
  });
});

module.exports = router;