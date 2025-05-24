const jwt = require("jsonwebtoken");
const { JWT_USER_SECRET } = require("../config");

function user_auth(req, res, next) {
  const token = req.headers.token;

  const decodedData = jwt.verify(token, JWT_USER_SECRET);
  if (decodedData) {
    req.userId = decodedData.id;
    next();
  } else {
    return res.status(403).json({
      msg: "invalid credentials",
    });
  }
}
module.exports = {
  user_auth,
};
