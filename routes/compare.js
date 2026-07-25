const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

const DEFAULT_LAT = 28.4595;
const DEFAULT_LNG = 77.0266;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-IN,en;q=0.9",
};

// Checks if a dish/item name actually matches what the user searched for.
// Splits the query into meaningful words (ignoring tiny words like "a", "to")
// and requires the item name to contain at least one of them.
function nameMatches(query, name) {
  if (!name) return false;
  const queryWords = query.toLowerCase().split(" ").filter(w => w.length > 2);
  const lowerName = name.toLowerCase();
  return queryWords.some(word => lowerName.includes(word));
}

// ─── SWIGGY ───────────────────────────────────────────────
async function getSwiggyPrice(query, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  try {
    const url = `https://www.swiggy.com/dapi/restaurants/search/v3?lat=${lat}&lng=${lng}&str=${encodeURIComponent(query)}&submitAction=ENTER`;
    const response = await fetch(url, { headers: BROWSER_HEADERS, timeout: 10000 });
    const data = await response.json();

    let lowestPrice = null;
    let itemName = null;

    function findDishes(obj) {
      if (!obj || typeof obj !== "object") return;
      if (obj.info && obj.info.price && obj.info.name) {
        if (nameMatches(query, obj.info.name)) {
          const price = obj.info.finalPrice || obj.info.price;
          if (!lowestPrice || price < lowestPrice) {
            lowestPrice = price;
            itemName = obj.info.name;
          }
        }
      }
      if (Array.isArray(obj)) obj.forEach(findDishes);
      else Object.values(obj).forEach(findDishes);
    }

    findDishes(data);
    return lowestPrice ? { platform: "Swiggy", price: Math.round(lowestPrice / 100), name: itemName } : null;
  } catch (err) {
    console.log("Swiggy error:", err.message);
    return null;
  }
}

// ─── BLINKIT ──────────────────────────────────────────────
async function getBlinkitPrice(query, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  try {
    const url = `https://blinkit.com/v6/search/products?q=${encodeURIComponent(query)}&start=0&size=10`;
    const response = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        "lat": lat.toString(),
        "lon": lng.toString(),
        "Referer": "https://blinkit.com/",
        "app_client": "consumer_web",
      },
      timeout: 10000
    });
    const data = await response.json();
    console.log("Blinkit response:", JSON.stringify(data).substring(0, 300));

    let lowestPrice = null;
    let itemName = null;

    function findPrices(obj) {
      if (!obj || typeof obj !== "object") return;
      if ((obj.price || obj.mrp) && obj.name) {
        if (nameMatches(query, obj.name)) {
          const price = parseInt(obj.price || obj.mrp);
          if (!isNaN(price) && price > 10 && price < 5000) {
            if (!lowestPrice || price < lowestPrice) {
              lowestPrice = price;
              itemName = obj.name;
            }
          }
        }
      }
      if (Array.isArray(obj)) obj.forEach(findPrices);
      else Object.values(obj).forEach(findPrices);
    }

    findPrices(data);
    return lowestPrice ? { platform: "Blinkit", price: Math.round(lowestPrice), name: itemName } : null;
  } catch (err) {
    console.log("Blinkit error:", err.message);
    return null;
  }
}

// ─── ZEPTO ────────────────────────────────────────────────
async function getZeptoPrice(query, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  try {
    const url = `https://api.zeptonow.com/api/v1/search?query=${encodeURIComponent(query)}&page_number=1&page_size=10`;
    const response = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        "Referer": "https://www.zeptonow.com/",
        "origin": "https://www.zeptonow.com",
        "x-latitude": lat.toString(),
        "x-longitude": lng.toString(),
      },
      timeout: 10000
    });
    const data = await response.json();
    console.log("Zepto response:", JSON.stringify(data).substring(0, 300));

    let lowestPrice = null;
    let itemName = null;

    function findPrices(obj) {
      if (!obj || typeof obj !== "object") return;
      if ((obj.price || obj.mrp || obj.discounted_price) && obj.name) {
        if (nameMatches(query, obj.name)) {
          const price = parseInt(obj.discounted_price || obj.price || obj.mrp);
          if (!isNaN(price) && price > 10 && price < 5000) {
            if (!lowestPrice || price < lowestPrice) {
              lowestPrice = price;
              itemName = obj.name;
            }
          }
        }
      }
      if (Array.isArray(obj)) obj.forEach(findPrices);
      else Object.values(obj).forEach(findPrices);
    }

    findPrices(data);
    return lowestPrice ? { platform: "Zepto", price: Math.round(lowestPrice), name: itemName } : null;
  } catch (err) {
    console.log("Zepto error:", err.message);
    return null;
  }
}

// ─── SWIGGY INSTAMART ─────────────────────────────────────
async function getInstamartPrice(query, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  try {
    const url = `https://www.swiggy.com/api/instamart/search?pageNumber=0&searchResultsOffset=0&limit=10&query=${encodeURIComponent(query)}&ageConsent=false&lat=${lat}&lng=${lng}&layoutId=2401&pageType=INSTAMART_SEARCH_PAGE&isPreSearchTag=false&highConfidencePageNo=0&lowConfidencePageNo=0`;
    const response = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        "Referer": "https://www.swiggy.com/instamart",
      },
      timeout: 10000
    });
    const data = await response.json();
    console.log("Instamart response:", JSON.stringify(data).substring(0, 300));

    let lowestPrice = null;
    let itemName = null;

    function findPrices(obj) {
      if (!obj || typeof obj !== "object") return;
      if ((obj.price || obj.selling_price) && obj.display_name) {
        if (nameMatches(query, obj.display_name)) {
          const price = parseInt(obj.price || obj.selling_price);
          if (!isNaN(price) && price > 10 && price < 5000) {
            if (!lowestPrice || price < lowestPrice) {
              lowestPrice = price;
              itemName = obj.display_name;
            }
          }
        }
      }
      if (Array.isArray(obj)) obj.forEach(findPrices);
      else Object.values(obj).forEach(findPrices);
    }

    findPrices(data);
    return lowestPrice ? { platform: "Swiggy Instamart", price: Math.round(lowestPrice), name: itemName } : null;
  } catch (err) {
    console.log("Instamart error:", err.message);
    return null;
  }
}

// ─── MAIN ROUTE ───────────────────────────────────────────
router.post("/food", async (req, res) => {
  const { query, lat, lng } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const results = await Promise.all([
      getSwiggyPrice(query, lat, lng),
      getBlinkitPrice(query, lat, lng),
      getZeptoPrice(query, lat, lng),
      getInstamartPrice(query, lat, lng),
    ]);

    // Filter out nulls (platforms with no matching item found)
    const available = results.filter(r => r !== null);

    if (available.length === 0) {
      return res.json({
        reply: `I couldn't find "${query}" on any platform right now. Want me to open Swiggy so you can check manually?`,
        results: [],
        recommendation: null
      });
    }

    // Sort by price
    available.sort((a, b) => a.price - b.price);

    const cheapest = available[0];
    const others = available.slice(1);

    let comparison = others.map(r => `${r.platform} ₹${r.price}`).join(", ");
    let reply = "";

    if (others.length > 0) {
      reply = `I checked ${available.length} platforms for ${query}. Cheapest is ${cheapest.platform} with "${cheapest.name}" for ₹${cheapest.price}. Others: ${comparison}. Shall I order from ${cheapest.platform}?`;
    } else {
      reply = `I found "${cheapest.name}" on ${cheapest.platform} for ₹${cheapest.price}. Shall I proceed?`;
    }

    return res.json({
      reply,
      results: available,
      recommendation: cheapest.platform.toLowerCase().replace(" ", "_"),
      matchedItemName: cheapest.name
    });

  } catch (err) {
    return res.json({
      reply: `Something went wrong while comparing prices.`,
      error: err.message
    });
  }
});

module.exports = router;