const mongoose = require("mongoose");

const Place = mongoose.model("Place", {
  address: String,
  access: String,
  lat: Number,
  lng: Number,
  place_id: String,
});
module.exports = Place;
