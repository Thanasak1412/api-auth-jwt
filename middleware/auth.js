require("dotenv").config();
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) return next(createError.Unauthorized());
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return next(createError.Unauthorized());
  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, user) => {
    if (err) {
      const errorMessage =
        err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
      return next(createError.Unauthorized(errorMessage));
    }
    req.user = user;
    next();
  });
}

module.exports = verifyToken;
