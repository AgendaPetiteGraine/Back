const mongoose = require("mongoose");

const Event = mongoose.model("Event", {
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Host",
  },
  title: String,
  type: String,
  keyWords: Array,
  date: Date,
  timeStart: String,
  timeEnd: String,
  ageMin: Number,
  ageMax: Number,
  areBabyAccepted: Boolean,
  place: String,
  address: String,
  lat: Number,
  lng: Number,
  city: String,
  price: String,
  free: Boolean,
  description: String,
  pictures: Array,
  video: String,
  website: String,
  ticketing: String,
  bookingRequired: Boolean,
  bookingSpecifications: String,
  status: String,
  views: Number,
  favorites: Number,
  calendar: Number,
  access: String,
  place_id: String,
  //   status : À venir, Complet, Passé, Annulé
});
module.exports = Event;
