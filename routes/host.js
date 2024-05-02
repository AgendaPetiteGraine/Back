const express = require("express");
const router = express.Router();

const Host = require("../models/Host");
const Event = require("../models/Event");
const isHost = require("../middlewares/isHost");

const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");

// Route pour se créer un compte /host/signup
// Route pour se connecter /host/signin
// Route pour modifier ses infos /host/update
// Route pour se déconnecter /host/logout
// Route pour récupérer les infos des organisateurs /hosts

module.exports = router;
