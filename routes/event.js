const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const Host = require("../models/Host");
const Event = require("../models/Event");
const Place = require("../models/Place");
const isHost = require("../middlewares/isHost");
const isHostChecked = require("../middlewares/isHostChecked");

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
router.post("/event/create", isHostChecked, fileUpload(), async (req, res) => {
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
      price,
      description,
      video,
      website,
      ticketing,
      bookingRequired,
      bookingSpecifications,
      previousPictures,
      access,
      recurrence,
      currentPictures,
      place_id,
    } = req.body;
    let booleanAreBabyAccepted = false;
    let booleanBookingRequired = false;
    if (areBabyAccepted === "true") {
      booleanAreBabyAccepted = true;
    }
    if (bookingRequired === "true") {
      booleanBookingRequired = true;
    }
    let free = false;
    if (price.toLowerCase().trim().slice(0, 7) === "gratuit") {
      free = true;
    }
    const formattedDate = new Date(date);
    let nbAgeMin = 0;
    let nbAgeMax = 99;
    const favorites = 0;
    const keyWordsTab = [];
    if (ageMin) {
      nbAgeMin = parseInt(ageMin);
    }
    if (ageMax) {
      nbAgeMax = parseInt(ageMax);
    }
    if (keyWords) {
      keyWords.split(" ").map((word) => keyWordsTab.push(word));
    }
    const picturesTab = [];
    if (currentPictures) {
      if (Array.isArray(currentPictures)) {
        currentPictures.map((picture) => {
          picturesTab.push(picture);
        });
      } else {
        picturesTab.push(currentPictures);
      }
    }
    if (previousPictures) {
      if (Array.isArray(currentPictures)) {
        previousPictures.map((picture) => {
          picturesTab.push(picture);
        });
      } else {
        picturesTab.push(previousPictures);
      }
    }
    const addressTab = address.split(", ");
    const city = addressTab[addressTab.length - 2];
    const addressWithoutSpaces = address.split(" ").join("+");
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${addressWithoutSpaces}&key=${process.env.GOOGLE_API_KEY}
    `;

    const response1 = await fetch(url);
    const data = await response1.json();
    const location = {};
    const count = data.results.length;
    data.results.map((result) => {
      if (result.place_id === place_id) {
        count--;
        location.lat = result.geometry.location.lat;
        location.lng = result.geometry.location.lng;
      }
    });
    if (count === data.results.length) {
      location.lat = data.results[0].geometry.location.lat;
      location.lng = data.results[0].geometry.location.lng;
    }
    const placeFound = await Place.findOne({ address });
    // vérifier si la place existe dans la BDD, si non -> l'ajouter, si oui -> vérifier que l'accès soit le même ou update
    if (placeFound) {
      if (!placeFound.lat || !placeFound.lng || placeFound.access !== access) {
        Place.findByIdAndUpdate(
          placeFound._id,
          {
            lat: location.lat,
            lng: location.lng,
            access,
          },
          { new: true }
        );
      }
    } else {
      const newPlace = new Place({
        address,
        lat: location.lat,
        lng: location.lng,
        access,
      });
      await newPlace.save();
    }
    const newEvent = new Event({
      host: hostFound._id,
      title,
      type,
      keyWords: keyWordsTab,
      date: formattedDate,
      timeStart,
      timeEnd,
      ageMin: nbAgeMin,
      ageMax: nbAgeMax,
      areBabyAccepted: booleanAreBabyAccepted,
      place,
      address,
      lat: location.lat,
      lng: location.lng,
      access,
      city,
      price,
      free,
      description,
      pictures: picturesTab,
      video,
      website,
      ticketing,
      bookingRequired: booleanBookingRequired,
      bookingSpecifications,
      status: "À venir",
      place_id,
      favorites,
    });
    console.log(`Nouvel événement créé ${newEvent.title} 👏`);
    await newEvent.save();
    const pictures = [...newEvent.pictures];
    if (req.files) {
      const picturesToUpload = req.files.pictures;
      if (Array.isArray(picturesToUpload)) {
        for (let p = 0; p < picturesToUpload.length; p++) {
          const picture = picturesToUpload[p];
          let result = "";
          if (recurrence === "true") {
            result = await cloudinary.uploader.upload(
              convertToBase64(picture),
              { folder: `/petitegraine/events/${hostFound._id}` }
            );
            pictures.push(result.secure_url);
          } else {
            result = await cloudinary.uploader.upload(
              convertToBase64(picture),
              {
                folder: `/petitegraine/events/${hostFound._id}/${newEvent._id}`,
              }
            );
            pictures.push(result.secure_url);
          }
        }
      } else {
        let result = "";
        if (recurrence === "true") {
          result = await cloudinary.uploader.upload(
            convertToBase64(picturesToUpload),
            { folder: `/petitegraine/events/${hostFound._id}` }
          );
          pictures.push(result.secure_url);
        } else {
          result = await cloudinary.uploader.upload(
            convertToBase64(picturesToUpload),
            { folder: `/petitegraine/events/${hostFound._id}/${newEvent._id}` }
          );
          pictures.push(result.secure_url);
        }
      }
      newEvent.pictures = pictures;
      await newEvent.save();
    }
    // si images récurentes, les enregistrer dans la library de l'Host
    if (recurrence && recurrence === "true") {
      const pictures_lib = [...hostFound.pictures_lib];
      pictures.map((picture) => pictures_lib.push(picture));
      const UpdateHost = await Host.findByIdAndUpdate(
        hostFound._id,
        { pictures_lib },
        { new: true }
      );
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
    const events = [...hostFound.events];
    console.log(events);
    events.push({ _id: newEvent._id });
    const hostToUpdate = await Host.findByIdAndUpdate(
      hostFound._id,
      {
        events,
      },
      { new: true }
    );
    await hostToUpdate.save();
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
    const host = await Host.findById(event.host)
      .select(["name", "city", "website", "facebook"])
      .populate({
        path: "events",
      });
    return res.status(200).json({ event, host });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Route pour modifier un événement /event/update
router.post(
  "/event/update/:id",
  isHostChecked,
  fileUpload(),
  async (req, res) => {
    try {
      const hostFound = req.hostFound;
      const eventId = req.params.id;
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
        access,
        city,
        price,
        description,
        video,
        website,
        ticketing,
        status,
        currentPictures,
        bookingRequired,
        bookingSpecifications,
        recurrence,
        place_id,
      } = req.body;
      let booleanAreBabyAccepted = false;
      let booleanBookingRequired = false;
      if (areBabyAccepted === "true") {
        booleanAreBabyAccepted = true;
      }
      if (bookingRequired === "true") {
        booleanBookingRequired = true;
      }
      const formattedDate = new Date(date);
      let free = false;
      if (price.toLowerCase().trim().slice(0, 7) === "gratuit") {
        free = true;
      } else {
        free = false;
      }
      let nbAgeMin = 0;
      let nbAgeMax = 0;
      const keyWordsTab = [];
      if (ageMin) {
        nbAgeMin = parseInt(ageMin);
      }
      if (ageMax) {
        nbAgeMax = parseInt(ageMax);
      }
      if (keyWords) {
        keyWords.split(" ").map((word) => keyWordsTab.push(word));
      }
      let pictures = [];
      if (currentPictures) {
        if (Array.isArray(currentPictures)) {
          pictures = [...currentPictures];
        } else pictures = currentPictures;
      }
      if (req.files) {
        const picturesToUpload = req.files.pictures;
        if (Array.isArray(picturesToUpload)) {
          for (let p = 0; p < picturesToUpload.length; p++) {
            const picture = picturesToUpload[p];
            let result = "";
            if (recurrence === "true") {
              result = await cloudinary.uploader.upload(
                convertToBase64(picture),
                { folder: `/petitegraine/events/${hostFound._id}` }
              );
              pictures.push(result.secure_url);
            } else {
              result = await cloudinary.uploader.upload(
                convertToBase64(picture),
                { folder: `/petitegraine/events/${hostFound._id}/${eventId}` }
              );
              pictures.push(result.secure_url);
            }
          }
        } else {
          let result = "";
          if (recurrence === "true") {
            result = await cloudinary.uploader.upload(
              convertToBase64(picturesToUpload),
              { folder: `/petitegraine/events/${hostFound._id}` }
            );
            pictures.push(result.secure_url);
          } else {
            result = await cloudinary.uploader.upload(
              convertToBase64(picturesToUpload),
              { folder: `/petitegraine/events/${hostFound._id}/${eventId}` }
            );
            pictures.push(result.secure_url);
          }
        }
      }
      let lat = 0;
      let lng = 0;
      // vérifier si la place existe dans la BDD, si non -> l'ajouter, si oui -> vérifier que l'accès soit le même ou update
      const placeFound = await Place.findOne({ address });
      if (placeFound) {
        lat = placeFound.lat;
        lng = placeFound.lng;
        if (placeFound.access !== access) {
          await Place.findByIdAndUpdate(
            placeFound._id,
            { access },
            { new: true }
          );
        }
      } else {
        const addressWithoutSpaces = address.split(" ").join("+");
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${addressWithoutSpaces}&key=${process.env.GOOGLE_API_KEY}
  `;
        const response1 = await fetch(url);
        const data = await response1.json();
        const location = {};
        data.results.map((result) => {
          if (result.place_id === place_id) {
            location.lat = result.geometry.location.lat;
            location.lng = result.geometry.location.lng;
          }
        });
        const newPlace = new Place({
          address,
          lat: location.lat,
          lng: location.lng,
          access,
        });
        await newPlace.save();
        lat = location.lat;
        lng = location.lng;
      }
      const eventToUpdate = await Event.findByIdAndUpdate(
        eventId,
        {
          host: req.hostFound._id,
          title,
          type,
          keyWords: keyWordsTab,
          date: formattedDate,
          timeStart,
          timeEnd,
          ageMin: nbAgeMin,
          ageMax: nbAgeMax,
          areBabyAccepted: booleanAreBabyAccepted,
          place,
          address,
          lat,
          lng,
          access,
          city,
          price,
          free,
          description,
          pictures,
          video,
          website,
          ticketing,
          bookingRequired: booleanBookingRequired,
          bookingSpecifications,
          status,
          place_id,
        },
        { new: true }
      );
      await eventToUpdate.save();
      console.log(`Événement modifié ${eventToUpdate.title} 👏`);
      // si images récurentes, les enregistrer dans la library de l'Host
      if (recurrence && recurrence === "true") {
        const pictures_lib = [...hostFound.pictures_lib];
        pictures.map((picture) => pictures_lib.push(picture));
        const UpdateHost = await Host.findByIdAndUpdate(
          hostFound._id,
          { pictures_lib },
          { new: true }
        );
      }
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
      return res.status(200).json(eventToUpdate);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// Route pour modifier un événement /event/compltet
router.post(
  "/event/complet/:id",
  isHostChecked,
  fileUpload(),
  async (req, res) => {
    try {
      const hostFound = req.hostFound;
      const eventId = req.params.id;
      const { status } = req.body;
      const eventToUpdate = await Event.findByIdAndUpdate(
        eventId,
        {
          status,
        },
        { new: true }
      );
      await eventToUpdate.save();
      console.log(`Événement modifié ${eventToUpdate.title} 👏`);
      // m'envoyer un mail pour me mettre au courant...
      const messageData = {
        from: `contact@petitegraine.org`,
        to: process.env.MY_EMAIL,
        subject: `Événement complet`,
        text: `${req.hostFound.name} a modifié l'événement ${eventToUpdate.title} sur l'agenda, prévu pour le ${eventToUpdate.date}. L'événement est complet.`,
      };
      const response = await client.messages.create(
        process.env.DOMAIN_MAILGUN,
        messageData
      );
      return res.status(200).json(eventToUpdate);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// Route pour changer les stats (favoris) d'un événement /event/favorites
router.post("/event/favorites/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const { change } = req.body;
    const event = await Event.findById(eventId);
    let favorites = 0;
    if (event.favorites) {
      favorites = event.favorites;
    }
    if (change === "add") {
      favorites++;
    } else if (change === "remove") {
      favorites--;
    }
    const eventToUpdate = await Event.findByIdAndUpdate(
      eventId,
      {
        favorites,
      },
      { new: true }
    );
    return res.status(200).json(eventToUpdate);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer tous les id d'events /eventsId
router.get("/eventsId", async (req, res) => {
  try {
    const events = await Event.find().select("_id");
    return res.status(200).json({ events });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer tous les événements selon filtres /events
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find();
    // Mettre à jour les événements "à venir" dont la date est passée.
    const filter = { status: ["À venir", "Complet"] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filter.date = { $lt: today };
    const updatedEvents = await Event.findOneAndUpdate(
      filter,
      { status: "Passé" },
      { new: true }
    );
    delete filter.date;
    filter.ageMin = { $lte: 4 };
    if (req.query.ageMin !== undefined) {
      filter.ageMin.$lte = req.query.ageMin;
    }
    if (req.query.date) {
      filter.date = req.query.date;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.city) {
      filter.city = req.query.city;
    }
    if (req.query.keyWords) {
      const keywordRegex = new RegExp(req.query.keyWords, "i");
      filter.keyWords = { $regex: keywordRegex };
    }
    if (req.query.areBabyAccepted) {
      filter.areBabyAccepted = true;
    }
    if (req.query.free) {
      filter.free = true;
    }
    console.log(filter);
    const eventsComing = await Event.find(filter).sort({ date: 1 });
    const cities = [...new Set(eventsComing.map((event) => event.city))];
    const types = [...new Set(eventsComing.map((event) => event.type))];
    const keyWordsList = [
      ...new Set(eventsComing.flatMap((event) => event.keyWords)),
    ];
    return res.status(200).json({ eventsComing, cities, types, keyWordsList });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
