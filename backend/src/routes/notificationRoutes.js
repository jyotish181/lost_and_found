// src/routes/notificationRoutes.js
// Routes for user match and claim notifications.

const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markNotificationRead,
  markAllRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// All notification routes are protected
router.get("/", protect, getUserNotifications);
router.put("/read-all", protect, markAllRead);
router.put("/:id/read", protect, markNotificationRead);

module.exports = router;
