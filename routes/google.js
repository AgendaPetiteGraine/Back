const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const isHost = require("../middlewares/isHost");

// valider une adresse par google
router.get("/googlePlace", isHost, async (req, res) => {
  const { address } = req.query;
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!address) {
    return res.status(400).json({ error: "Il faut renseigner une adresse." });
  }
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    address
  )}&key=${GOOGLE_API_KEY}&components=country:fr`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK") {
      res.status(200).json(data.predictions);
    } else {
      res.status(400).json({ error: data.status });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur de serveur interne" });
  }
});

// retourner l'API key Google
router.get("/g3t0Gg!APIk3y", (req, res) => {
  return res.status(200).json(process.env.GOOGLE_API_KEY);
});

module.exports = router;
