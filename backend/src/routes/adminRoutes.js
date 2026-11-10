// src/routes/adminRoutes.js
// All admin routes are protected by BOTH:
//   1. protect      → verifies JWT (user must be logged in)
//   2. isAdmin      → checks user.isAdmin === true

const express = require("express");
const router  = express.Router();

const {
  getAllClaims,
  updateClaimStatus,
  getDashboardStats,
  getAllItems,
  deleteItem,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

// GET  /api/admin/stats        → Dashboard stats
router.get("/stats", protect, isAdmin, getDashboardStats);

// GET  /api/admin/claims       → All claims
router.get("/claims", protect, isAdmin, getAllClaims);

// PUT  /api/admin/claims/:id   → Update claim status (approve/reject)
router.put("/claims/:id", protect, isAdmin, updateClaimStatus);

// GET  /api/admin/items        → All items with reporter info
router.get("/items", protect, isAdmin, getAllItems);

// DELETE /api/admin/items/:id  → Delete an item
router.delete("/items/:id", protect, isAdmin, deleteItem);

module.exports = router;
