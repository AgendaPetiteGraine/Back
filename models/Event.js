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
  city: String,
  price: String,
  description: String,
  pictures: Array,
  video: String,
  website: String,
  ticketing: String,
  bookingRequired: Boolean,
  bookingSpecifications: String,
  status: String,
  views: Number,
  calendar: Number,
  //   status : À venir, Complet, Passé, Annulé
});
module.exports = Event;
