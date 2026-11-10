// src/pages/ProfilePage.jsx
// Displays authenticated user account details and quick actions.

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="container profile-page-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="profile-header-text">
            <h2>{user?.name || "User Profile"}</h2>
            <p className="profile-email">{user?.email}</p>
            <span className={`badge ${isAdmin ? "badge-admin" : "badge-member"}`}>
              {isAdmin ? "👑 Administrator" : "👤 Verified Member"}
            </span>
          </div>
        </div>

        <div className="profile-details-grid">
          <div className="profile-detail-item">
            <span className="detail-label">Full Name</span>
            <span className="detail-value">{user?.name}</span>
          </div>
          <div className="profile-detail-item">
            <span className="detail-label">Email Address</span>
            <span className="detail-value">{user?.email}</span>
          </div>
          <div className="profile-detail-item">
            <span className="detail-label">Account Role</span>
            <span className="detail-value">{isAdmin ? "Administrator" : "Standard User"}</span>
          </div>
          <div className="profile-detail-item">
            <span className="detail-label">Account Status</span>
            <span className="detail-value text-success">Active &amp; Authenticated</span>
          </div>
        </div>

        <div className="profile-quick-actions">
          <h3>Quick Actions</h3>
          <div className="quick-actions-row">
            <Link to="/create" className="btn-primary">
              ➕ Report Item
            </Link>
            <Link to="/my-claims" className="btn-secondary">
              📋 My Claims
            </Link>
            <Link to="/notifications" className="btn-secondary">
              🔔 Notifications
            </Link>
            {isAdmin && (
              <Link to="/admin" className="btn-secondary admin-btn">
                👑 Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="profile-footer">
          <button className="logout-btn-full" onClick={handleLogout}>
            🚪 Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
}
