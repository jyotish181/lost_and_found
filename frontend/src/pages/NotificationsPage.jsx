// src/pages/NotificationsPage.jsx
// Displays alerts, claim updates, and activity notifications for the user.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      alert("Failed to mark all as read.");
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>🔔 Notifications &amp; Alerts</h2>
          <p className="page-subtitle">
            Stay updated with claims, status changes, and item activity.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="btn-secondary">
            ✓ Mark All as Read
          </button>
        )}
      </div>

      {error && <div className="message error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <p>You have no notifications at this time.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notification-item ${notif.isRead ? "read" : "unread"}`}
              onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
            >
              <div className="notif-indicator" />
              <div className="notif-content">
                <div className="notif-header">
                  <h4 className="notif-title">{notif.title}</h4>
                  <span className="notif-time">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="notif-message">{notif.message}</p>
                {notif.item && (
                  <Link
                    to={`/items/${notif.item._id || notif.item}`}
                    className="notif-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Related Item →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
