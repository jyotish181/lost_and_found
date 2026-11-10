// src/routes/claimRoutes.js
// Routes for claims.

const express = require("express");
const router = express.Router();
const { createClaim, getMyClaims } = require("../controllers/claimController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/claims → submit a claim for an item
router.post("/", protect, createClaim);

// GET /api/claims/my → get logged-in user's claims
router.get("/my", protect, getMyClaims);

module.exports = router;
