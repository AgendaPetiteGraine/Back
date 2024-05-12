const mongoose = require("mongoose");

const Admin = mongoose.model("Admin", {
  email: String,
  token: String,
  hash: String,
  salt: String,
  name: String,
  last_connexion: Date,
});
module.exports = Admin;
