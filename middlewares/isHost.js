const Host = require("../models/Host");

const isHost = async (req, res, next) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const hostFound = await Author.findOne({ token });
  if (hostFound) {
    req.hostFound = hostFound;
    next();
  } else {
    return res.status(401).json("Unauthorized 😾");
  }
};
module.exports = isHost;
