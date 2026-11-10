// src/components/Navbar.jsx
// Main application navbar. Hidden completely when the user is not authenticated.

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // 30s polling
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, location.pathname]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Crucial: When user is not authenticated, DO NOT show the main application navbar!
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/" className="logo">
          <span className="logo-icon">🔍</span>
          <span className="logo-text">Lost &amp; Found</span>
        </Link>
      </div>

      <div className="nav-links">
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>
          🏠 Home
        </Link>
        <Link
          to="/lost-items"
          className={location.pathname === "/lost-items" ? "active" : ""}
        >
          🔴 Lost Items
        </Link>
        <Link
          to="/found-items"
          className={location.pathname === "/found-items" ? "active" : ""}
        >
          🟢 Found Items
        </Link>
        <Link
          to="/create"
          className={location.pathname === "/create" ? "active" : ""}
        >
          ➕ Post Item
        </Link>
        <Link
          to="/my-claims"
          className={location.pathname === "/my-claims" ? "active" : ""}
        >
          📋 My Claims
        </Link>
        <Link
          to="/profile"
          className={location.pathname === "/profile" ? "active" : ""}
        >
          👤 Profile
        </Link>
        <Link
          to="/notifications"
          className={`nav-notif-link ${location.pathname === "/notifications" ? "active" : ""}`}
        >
          🔔 Alerts
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </Link>

        {isAdmin && (
          <Link
            to="/admin"
            className={`admin-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}
          >
            👑 Admin
          </Link>
        )}

        <button className="logout-btn" onClick={handleLogout} title="Sign Out">
          🚪 Logout ({user?.name ? user.name.split(" ")[0] : "User"})
        </button>
      </div>
    </nav>
  );
}
