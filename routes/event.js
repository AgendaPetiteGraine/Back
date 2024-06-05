const express = require("express");
const router = express.Router();

const Host = require("../models/Host");
const Event = require("../models/Event");
const isHost = require("../middlewares/isHost");

const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_PUBLIC_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

const client = mailgun.client({
  username: "Sophie Boyer",
  key: process.env.API_KEY_MAILGUN,
});

// Route pour créer un événement /event/create
router.post("/event/create", isHost, fileUpload(), async (req, res) => {
  try {
    const hostFound = req.hostFound;
    console.log("hostFound", hostFound);
    const {
      title,
      type,
      keyWords,
      date,
      timeStart,
      timeEnd,
      ageMin,
      ageMax,
      areBabyAccepted,
      place,
      address,
      city,
      price,
      description,
      video,
      website,
      ticketing,
      bookingRequired,
      bookingSpecifications,
    } = req.body;
    let booleanAreBabyAccepted = false;
    let booleanBookingRequired = false;
    if (areBabyAccepted === "true") {
      booleanAreBabyAccepted = true;
    }
    if (bookingRequired === "true") {
      booleanBookingRequired = true;
    }
    let nbAgeMin = 0;
    let nbAgeMax = 0;
    const keyWordsTab = [];
    if (ageMin) {
      nbAgeMin = parseInt(ageMin);
    }
    if (ageMax) {
      nbAgeMin = parseInt(ageMax);
    }
    if (keyWords) {
      keyWords.split(" ").map((word) => keyWordsTab.push(word));
    }
    const newEvent = new Event({
      host: hostFound._id,
      title,
      type,
      keyWords: keyWordsTab,
      date,
      timeStart,
      timeEnd,
      ageMin: nbAgeMin,
      ageMax: nbAgeMax,
      areBabyAccepted: booleanAreBabyAccepted,
      place,
      address,
      city,
      price,
      description,
      video,
      website,
      ticketing,
      bookingRequired: booleanBookingRequired,
      bookingSpecifications,
      status: "À venir",
    });
    console.log(`Nouvel événement créé ${newEvent.title} 👏`);
    await newEvent.save();
    if (req.files) {
      const picturesToUpload = req.files.pictures;
      const pictures = [];
      for (let p = 0; p < picturesToUpload.length; p++) {
        const picture = picturesToUpload[p];
        const result = await cloudinary.uploader.upload(
          convertToBase64(picture),
          { folder: `/petitegraine/events/${hostFound._id}` }
        );
        pictures.push(result.secure_url);
      }

      newEvent.pictures = pictures;
      await newEvent.save();
    }
    // m'envoyer un mail pour me mettre au courant...
    const messageData = {
      from: `contact@petitegraine.org`,
      to: process.env.MY_EMAIL,
      subject: `Nouvel événement ajouté`,
      text: `${req.hostFound.name} a ajouté l'événement ${title} à l'agenda, prévu pour le ${date}`,
    };
    const response = await client.messages.create(
      process.env.DOMAIN_MAILGUN,
      messageData
    );
    return res.status(200).json(newEvent);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer toutes les infos d'un événement /event/:id
router.get("/event/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate({
      path: "host",
      select: "name",
    });
    return event;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Route pour modifier un événement /event/update
router.post("/event/update/:id", isHost, fileUpload(), async (req, res) => {
  try {
    const eventId = req.params.id;
    const {
      title,
      type,
      kewWords,
      date,
      timeStart,
      timeEnd,
      ageMin,
      ageMax,
      areBabyAccepted,
      place,
      city,
      price,
      description,
      pictures,
      video,
      website,
      ticketing,
      status,
    } = req.body;
    if (req.files) {
      if (req.files.pictures) {
        for (let p = 0; p < req.files.pictures.length; p++) {
          const result = await cloudinary.uploader.upload(
            convertToBase64(req.files.pictures[p]),
            { folder: `/entrauteurs/banners` }
          );
          pictures.push(result.secure_url);
        }
      }
    }
    const eventToUpdate = await Event.findByIdAndUpdate(
      eventId,
      {
        host: req.hostFound._id,
        title,
        type,
        kewWords,
        date,
        timeStart,
        timeEnd,
        ageMin,
        ageMax,
        areBabyAccepted,
        place,
        city,
        price,
        description,
        pictures,
        video,
        website,
        ticketing,
        status,
      },
      { new: true }
    );
    await eventToUpdate.save();
    console.log(`Événement modifié ${newEvent.title} 👏`);
    // m'envoyer un mail pour me mettre au courant...
    const messageData = {
      from: `contact@petitegraine.org`,
      to: process.env.MY_EMAIL,
      subject: `Événement modifié`,
      text: `${req.hostFound.name} a modifié l'événement ${title} sur l'agenda, prévu pour le ${date}`,
    };
    const response = await client.messages.create(
      process.env.DOMAIN_MAILGUN,
      messageData
    );
    return res.status(200).json(newEvent);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer tous les événements selon filtres /events
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find();
    return events;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
