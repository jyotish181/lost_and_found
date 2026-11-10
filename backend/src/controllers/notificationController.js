// src/controllers/notificationController.js
// User notifications and alerts (PostgreSQL).

const Notification = require("../models/Notification");

// @route GET /api/notifications  (Protected)
const getUserNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.findByRecipient(req.user._id, 50),
      Notification.countUnread(req.user._id),
    ]);

    res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/notifications/:id/read  (Protected)
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.markRead(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/notifications/read-all  (Protected)
const markAllRead = async (req, res) => {
  try {
    await Notification.markAllRead(req.user._id);
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUserNotifications, markNotificationRead, markAllRead };
