const express = require("express");
const router = express.Router();

const Host = require("../models/Host");
const Event = require("../models/Event");
const isHost = require("../middlewares/isHost");

const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");

// Route pour créer un événement /event/create
// Route pour modifier un événement /event/update
// Route pour récupérer tous les événements selon filtres /events

module.exports = router;
