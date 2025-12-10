const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

const systemPrompt = `
You are BantAI.
Reply in short Hinglish.
Friendly tone.
`;

router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log("Sending request to Gemini...");

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      process.env.GEMINI_API_KEY;

    const payload = {
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\nUser: ${prompt}` }
          ]
        }
      ]
    };

    const result = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }
    });

    const reply =
      result.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Bro kuch samajh nahi aaya.";

    res.json({ reply });

  } catch (err) {
    console.error("GEMINI ERROR:", err.response?.data || err);
    res.json({ reply: "Bro, Gemini request fail ho gaya." });
  }
});

module.exports = router;
