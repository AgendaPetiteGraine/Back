const mongoose = require("mongoose");

const Host = mongoose.model("Host", {
  email: String,
  token: String,
  hash: String,
  salt: String,
  status: String,
  //   Status : En attente de validation / Validé
  name: String,
  city: String,
  phone: String,
  contact: String,
  website: String,
  last_connexion: Date,
  events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],
});
module.exports = Host;
