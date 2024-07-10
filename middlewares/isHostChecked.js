const Host = require("../models/Host");

const isHostChecked = async (req, res, next) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const hostFound = await Host.findOne({ token });
  if (hostFound && hostFound.status === "validé") {
    req.hostFound = hostFound;
    next();
  } else {
    return res.status(401).json("Unauthorized 😾");
  }
};
module.exports = isHostChecked;
