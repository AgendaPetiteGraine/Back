const Admin = require("../models/Admin");

const isAdmin = async (req, res, next) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const adminFound = await Admin.findOne({ token });
  if (adminFound) {
    req.adminFound = adminFound;
    next();
  } else {
    return res.status(401).json("Unauthorized 😾");
  }
};
module.exports = isAdmin;
