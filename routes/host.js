const express = require("express");
const router = express.Router();

const Host = require("../models/Host");
const Event = require("../models/Event");
const isHost = require("../middlewares/isHost");

const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");

// Route pour se créer un compte /host/signup
router.post("/host/signup", async (req, res) => {
  try {
    const { email, name, city, phone, contact, website, password } = req.body;
    const emailAlreadyUsed = await Host.findOne({
      email: email,
    });
    const nameAlreadyUsed = await Host.findOne({
      name: name,
    });
    if (emailAlreadyUsed !== null || nameAlreadyUsed !== null) {
      return res
        .status(400)
        .json({ message: "Adresse email déjà existante 🙀" });
    }
    const status = "en attente de validation";
    const last_connexion = new Date();
    const salt = uid2(24);
    const token = uid2(18);
    const newHost = new Host({
      email,
      token,
      hash: SHA256(password + salt).toString(encBase64),
      salt,
      status,
      name,
      city,
      phone,
      contact,
      website,
      last_connexion,
    });
    console.log(`Nouvel organisateur ${newHost.name} créé 👏`);
    await newHost.save();
    return res.status(200).json({
      _id: newHost._id,
      token: token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Route pour se connecter /host/signin
router.post("/host/signin", async (req, res) => {
  try {
    const host = await Host.findOne({
      email: req.body.email,
    });
    const hashLogin = SHA256(req.body.password + host.salt).toString(encBase64);
    if (hashLogin === host.hash) {
      const response = {
        _id: host._id,
        token: host.token,
      };
      const last_connexion = new Date();
      const updatedHost = await Host.findByIdAndUpdate(
        host._id,
        {
          last_connexion: last_connexion,
        },
        { new: true }
      );
      await updatedHost.save();
      return res.status(200).json(response);
    } else {
      return res.status(401).json({ message: "Mot de passe incorrect 😾" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Route pour modifier ses infos /host/update
router.post("/host/update", isHost, async (req, res) => {
  try {
    let {
      email,
      token,
      hash,
      salt,
      status,
      name,
      city,
      phone,
      contact,
      website,
    } = req.hostFound;
    const last_connexion = new Date();
    // Vérifier s'il y a un changement pour chacune des informations.
    if (req.body.password) {
      salt = uid2(24);
      token = uid2(18);
      hash = SHA256(req.body.password + salt).toString(encBase64);
    }
    if (req.body.email) {
      email = req.body.email;
    }
    if (req.body.name) {
      name = req.body.name;
    }
    if (req.body.city) {
      city = req.body.city;
    }
    if (req.body.contact) {
      contact = req.body.contact;
    }
    if (req.body.website) {
      website = req.body.website;
    }
    const hostToUpdate = await Host.findByIdAndUpdate(
      req.hostFound._id,
      {
        email,
        token,
        hash,
        salt,
        status,
        name,
        city,
        phone,
        contact,
        website,
        last_connexion,
      },
      { new: true }
    );
    console.log(
      `Données de l'organisateur ${hostToUpdate.name} mises à jour 👏`
    );
    await hostToUpdate.save();
    return res.status(200).json({
      _id: newHost._id,
      token: token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer les infos d'un organisateur /host/account
router.get("/host/account", isHost, async (req, res) => {
  try {
    return req.hostFound;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
