const express = require("express");
const router = express.Router();

// Generate deep links for ordering
function getDeepLink(platform, query, userAddress = "") {
  const encodedQuery = encodeURIComponent(query);
  const encodedAddress = encodeURIComponent(userAddress);

  switch (platform.toLowerCase()) {
    case "swiggy":
      return `swiggy://search?query=${encodedQuery}`;

    case "zomato":
      return `zomato://search?q=${encodedQuery}`;

    case "blinkit":
      return `blinkit://search?q=${encodedQuery}`;

    case "zepto":
      return `zepto://search?query=${encodedQuery}`;

    case "ixigo":
      return `ixigo://flights`;

    case "makemytrip":
      return `mmt://flights`;

    case "goibibo":
      return `goibibo://flights`;

    case "ola":
      return `olacabs://app/launch`;

    case "uber":
      return `uber://`;

    case "rapido":
      return `in.rapido.passenger://`;

    case "booking":
      return `booking://search?dest_name=${encodedQuery}`;

    case "bookmyshow":
      return `bookmyshow://`;

    default:
      return null;
  }
}

// Fallback web URLs when app not installed
function getWebLink(platform, query, details = {}) {
  const encodedQuery = encodeURIComponent(query);

  switch (platform.toLowerCase()) {
    case "swiggy":
      return `https://www.swiggy.com/search?query=${encodedQuery}`;

    case "zomato":
      return `https://www.zomato.com/search?q=${encodedQuery}`;

    case "blinkit":
      return `https://blinkit.com/s/?q=${encodedQuery}`;

    case "zepto":
      return `https://www.zeptonow.com/search?query=${encodedQuery}`;

    case "ixigo":
      return `https://www.ixigo.com/search/result/flight?from=${details.from || "DEL"}&to=${details.to || ""}&date=${details.date || ""}&adults=1&class=e`;

    case "makemytrip":
      return `https://www.makemytrip.com/flight/search?itinerary=${details.from || "DEL"}-${details.to || ""}-${details.date || ""}&tripType=O&paxType=A-1_C-0_I-0&cabinClass=E`;

    case "goibibo":
      return `https://www.goibibo.com/flights/search/${details.from || "DEL"}/${details.to || ""}/${details.date || ""}/1/0/0/E/`;

    case "ola":
      return `https://book.olacabs.com/?pickup=${encodeURIComponent(details.pickup || "")}&drop=${encodeURIComponent(details.drop || "")}`;

    case "uber":
      return `https://m.uber.com/ul/?pickup=${encodeURIComponent(details.pickup || "")}&dropoff=${encodeURIComponent(details.drop || "")}`;

    case "rapido":
      return `https://www.rapido.bike/`;

    case "booking":
      return `https://www.booking.com/search.html?ss=${encodedQuery}`;

    case "bookmyshow":
      return `https://in.bookmyshow.com/`;

    default:
      return `https://www.google.com/search?q=${encodedQuery}`;
  }
}

// Main order route
router.post("/", async (req, res) => {
  const { platform, query, details = {} } = req.body;

  if (!platform || !query) {
    return res.status(400).json({ error: "Platform and query are required" });
  }

  const deepLink = getDeepLink(platform, query, details.address);
  const webLink = getWebLink(platform, query, details);

  return res.json({
    platform,
    query,
    deepLink,
    webLink,
    reply: `Opening ${platform} for ${query}. Proceeding to checkout — I'll stop at the payment page for you to confirm.`
  });
});

// Flight specific route
router.post("/flight", async (req, res) => {
  const { from, to, date, travelClass = "E" } = req.body;

  if (!from || !to || !date) {
    return res.status(400).json({ error: "From, to and date are required" });
  }

  const platforms = [
    {
      name: "Ixigo",
      webLink: `https://www.ixigo.com/search/result/flight?from=${from}&to=${to}&date=${date}&adults=1&class=${travelClass}`
    },
    {
      name: "MakeMyTrip",
      webLink: `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${date}&tripType=O&paxType=A-1_C-0_I-0&cabinClass=${travelClass}`
    },
    {
      name: "Goibibo",
      webLink: `https://www.goibibo.com/flights/search/${from}/${to}/${date}/1/0/0/${travelClass}/`
    }
  ];

  return res.json({
    reply: `I've prepared flight searches from ${from} to ${to} on ${date}. Opening all three platforms so you can compare prices and pick the cheapest.`,
    platforms
  });
});

// Cab specific route
router.post("/cab", async (req, res) => {
  const { pickup, drop } = req.body;

  const platforms = [
    {
      name: "Ola",
      deepLink: `olacabs://app/launch`,
      webLink: `https://book.olacabs.com/?pickup=${encodeURIComponent(pickup || "")}&drop=${encodeURIComponent(drop || "")}`
    },
    {
      name: "Uber",
      deepLink: `uber://`,
      webLink: `https://m.uber.com/ul/?pickup=${encodeURIComponent(pickup || "")}&dropoff=${encodeURIComponent(drop || "")}`
    },
    {
      name: "Rapido",
      deepLink: `in.rapido.passenger://`,
      webLink: `https://www.rapido.bike/`
    }
  ];

  return res.json({
    reply: `Comparing Ola, Uber and Rapido for your ride. Opening all three apps — pick whichever is cheapest.`,
    platforms
  });
});

// Hotel specific route
router.post("/hotel", async (req, res) => {
  const { city, checkIn, checkOut } = req.body;

  const platforms = [
    {
      name: "MakeMyTrip",
      webLink: `https://www.makemytrip.com/hotels/${city ? city.toLowerCase() + "-hotels" : ""}.html`
    },
    {
      name: "Goibibo",
      webLink: `https://www.goibibo.com/hotels/hotels-in-${city ? city.toLowerCase() : ""}/?ci=${checkIn || ""}&co=${checkOut || ""}`
    },
    {
      name: "Booking.com",
      webLink: `https://www.booking.com/search.html?ss=${encodeURIComponent(city || "")}&checkin=${checkIn || ""}&checkout=${checkOut || ""}`
    }
  ];

  return res.json({
    reply: `I've found hotel options in ${city}. Opening MakeMyTrip, Goibibo and Booking.com so you can compare prices.`,
    platforms
  });
});

module.exports = router;