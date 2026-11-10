// src/routes/authRoutes.js
// Maps authentication endpoints.

const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/auth/register → register a new user
router.post("/register", registerUser);

// POST /api/auth/login → login with credentials
router.post("/login", loginUser);

// GET /api/auth/me → get current user profile (protected)
router.get("/me", protect, getMe);

module.exports = router;
