const express = require("express");
const router = express.Router();
const Place = require("../models/Place");

// envoyer un email par mailgun
router.post("/place", async (req, res) => {
  try {
    const address = req.body.address;
    const place = await Place.findOne({ address });
    return res.status(200).json(place);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
