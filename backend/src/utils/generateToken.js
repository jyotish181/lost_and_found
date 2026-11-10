// src/utils/generateToken.js
// Utility to generate JSON Web Tokens for authenticated users

const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "default_jwt_secret", {
    expiresIn: "7d",
  });
};

module.exports = generateToken;
