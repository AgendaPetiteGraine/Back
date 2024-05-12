const express = require("express");
const router = express.Router();

const Admin = require("../models/Admin");
const Host = require("../models/Host");

const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");
const isAdmin = require("../middlewares/isAdmin");

// Route pour se créer un compte /admin/signup
router.post("/admin/signup", async (req, res) => {
  try {
    const { email, name, password, key } = req.body;
    if (key !== process.env.PASSWORD) {
      return res.status(400).json({ message: "Clé incorrecte 🙀" });
    }
    const emailAlreadyUsed = await Admin.findOne({
      email: email,
    });
    if (emailAlreadyUsed !== null) {
      return res
        .status(400)
        .json({ message: "Adresse email déjà existante 🙀" });
    }
    const last_connexion = new Date();
    const salt = uid2(24);
    const token = uid2(18);
    const newAdmin = new Admin({
      email,
      token,
      hash: SHA256(password + salt).toString(encBase64),
      salt,
      name,
      last_connexion,
    });
    console.log(`Nouvel admin ${newAdmin.name} créé 👏`);
    await newAdmin.save();
    return res.status(200).json({
      _id: newAdmin._id,
      token: token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Route pour se connecter /host/signin
router.post("/admin/signin", async (req, res) => {
  try {
    const admin = await Admin.findOne({
      email: req.body.email,
    });
    const hashLogin = SHA256(req.body.password + admin.salt).toString(
      encBase64
    );
    if (hashLogin === host.hash) {
      const response = {
        _id: admin._id,
        token: admin.token,
      };
      const last_connexion = new Date();
      const updatedAdmin = await Admin.findByIdAndUpdate(
        admin._id,
        {
          last_connexion: last_connexion,
        },
        { new: true }
      );
      await updatedAdmin.save();
      return res.status(200).json(response);
    } else {
      return res.status(401).json({ message: "Mot de passe incorrect 😾" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer tous les organisateurs /admin/hosts
router.get("/admin/hosts", isAdmin, async (req, res) => {
  try {
    const hosts = await Host.find();
    return hosts;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Route pour valider un organisateur /admin/validate
router.post("/admin/validate", isAdmin, async (req, res) => {
  try {
    const host = await Host.findByIdAndUpdate(
      req.body.host_id,
      {
        status: "Approuvé",
      },
      { new: true }
    );
    return host;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
