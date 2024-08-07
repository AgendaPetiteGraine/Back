const express = require("express");
const router = express.Router();

// retourner l'API key Amplitude
router.get("/g3tAmp!APIk3y", (req, res) => {
  return res.status(200).json(process.env.AMPLITUDE_API_KEY);
});

module.exports = router;
