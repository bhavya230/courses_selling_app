const jwt = require("jsonwebtoken");
const { JWT_ADMIN_SECRET } = require("../config");

function admin_auth(req, res, next) {
  const token = req.headers.token;
  const decodedData = jwt.verify(token, JWT_ADMIN_SECRET);
  if (decodedData) {
    req.adminId = decodedData.id;
    next();
  } else {
    return res.status(403).json({
      msg: "invalid credentials",
    });
  }
}

module.exports = {
  admin_auth,
};
