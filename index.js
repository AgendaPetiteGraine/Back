require("dotenv").config();
const express = require("express");
const { connect, default: mongoose } = require("mongoose");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONGODB_URL + "PetiteGraine");

const hostRoutes = require("./routes/host");
const adminRoutes = require("./routes/admin");
const eventRoutes = require("./routes/event");
const placeRoutes = require("./routes/place");
const mailRoutes = require("./routes/mail");
const googleRoutes = require("./routes/google");
const amplitudeRoutes = require("./routes/amplitude");

app.use(hostRoutes);
app.use(adminRoutes);
app.use(eventRoutes);
app.use(placeRoutes);
app.use(mailRoutes);
app.use(googleRoutes);
app.use(amplitudeRoutes);

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur l'API Petite Graine !");
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.all("*", (req, res) => {
  return res.status(404).json("Not found");
});

app.listen(process.env.PORT || 3002, () => {
  console.log("Server has started 🚀");
});
