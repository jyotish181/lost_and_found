// src/pages/admin/AdminDashboard.jsx
// Main admin dashboard — overview stats and quick navigation.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      setError("Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="message error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>👑 Admin Dashboard</h2>
          <p className="page-subtitle">
            Overview and moderation tools for the Lost &amp; Found platform.
          </p>
        </div>
        <div className="admin-actions-bar">
          <Link to="/admin/claims" className="btn-secondary">
            📋 Manage Claims ({stats?.pendingClaims || 0} Pending)
          </Link>
          <Link to="/admin/items" className="btn-secondary">
            📦 Manage Items ({stats?.totalItems || 0})
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-number">{stats?.totalItems ?? 0}</div>
          <div className="stat-label">Total Items</div>
        </div>

        <div className="stat-card red">
          <div className="stat-number">{stats?.lostItems ?? 0}</div>
          <div className="stat-label">Lost Items</div>
        </div>

        <div className="stat-card green">
          <div className="stat-number">{stats?.foundItems ?? 0}</div>
          <div className="stat-label">Found Items</div>
        </div>

        <div className="stat-card orange">
          <div className="stat-number">{stats?.totalClaims ?? 0}</div>
          <div className="stat-label">Total Claims</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-number">{stats?.pendingClaims ?? 0}</div>
          <div className="stat-label">Pending Claims</div>
        </div>

        <div className="stat-card teal">
          <div className="stat-number">{stats?.totalUsers ?? 0}</div>
          <div className="stat-label">Registered Users</div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="admin-nav-cards">
        <div className="admin-nav-card">
          <h3>📋 Claims Resolution</h3>
          <p>Review submitted claims, inspect proof, and approve or reject claims.</p>
          <Link to="/admin/claims" className="btn-primary">
            Review Claims
          </Link>
        </div>

        <div className="admin-nav-card">
          <h3>📦 Item Moderation</h3>
          <p>View all reported items, filter by status, and delete inappropriate entries.</p>
          <Link to="/admin/items" className="btn-primary">
            Inspect Items
          </Link>
        </div>
      </div>
    </div>
  );
}
