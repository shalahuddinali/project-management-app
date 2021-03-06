const jwt = require("jsonwebtoken");
require("dotenv").config();
let express = require("express");
let cors = require("cors");
let app = express();

app.use(cors());

module.exports = function (req, res, next) {
  // https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
  const token = req.header("Authorization");
  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET).user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token not valid" });
  }
};
