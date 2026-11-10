// src/pages/admin/AdminClaims.jsx
// Admin interface to view, filter, and approve/reject claims.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/claims");
      setClaims(res.data || []);
    } catch (err) {
      setMessage("Failed to load claims.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (claimId, newStatus) => {
    try {
      await api.put(`/admin/claims/${claimId}`, { status: newStatus });
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: newStatus } : c))
      );
      setMessage(`Claim ${newStatus} successfully!`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update claim.");
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <Link to="/admin" className="back-link">
            ← Back to Dashboard
          </Link>
          <h2>📋 Manage Claims</h2>
          <p className="page-subtitle">Review user claims and decide whether to approve or reject.</p>
        </div>
      </div>

      {message && <div className="message success">{message}</div>}

      {/* Filter Tabs */}
      <div className="status-tabs" style={{ marginBottom: "20px" }}>
        <button
          type="button"
          className={`tab-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({claims.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          ⏳ Pending ({claims.filter((c) => c.status === "pending").length})
        </button>
        <button
          type="button"
          className={`tab-btn ${filter === "approved" ? "active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          ✅ Approved ({claims.filter((c) => c.status === "approved").length})
        </button>
        <button
          type="button"
          className={`tab-btn ${filter === "rejected" ? "active" : ""}`}
          onClick={() => setFilter("rejected")}
        >
          ❌ Rejected ({claims.filter((c) => c.status === "rejected").length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading claims...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="empty-state">
          <p>No claims found for this filter.</p>
        </div>
      ) : (
        <div className="admin-claims-list">
          {filteredClaims.map((claim) => (
            <div key={claim._id} className="admin-claim-card">
              <div className="admin-claim-info">
                {claim.item && (
                  <div style={{ marginBottom: "6px" }}>
                    <span
                      className={`claim-type-pill ${
                        claim.item.status === "lost" ? "claim-found-tag" : "claim-lost-tag"
                      }`}
                    >
                      {claim.item.status === "lost"
                        ? "🤝 Claim Found (Finder Report)"
                        : "🤝 Claim Lost (Owner Request)"}
                    </span>
                  </div>
                )}
                <h4>
                  Item:{" "}
                  {claim.item ? (
                    <Link to={`/items/${claim.item._id}`}>{claim.item.title}</Link>
                  ) : (
                    <span className="text-muted">Item deleted</span>
                  )}
                </h4>
                <p>
                  <strong>Claimed by:</strong> {claim.claimedBy?.name} (
                  {claim.claimedBy?.email})
                </p>
                {claim.item && (
                  <p>
                    <strong>Location:</strong> {claim.item.location} |{" "}
                    <strong>Status:</strong> {claim.item.status}
                  </p>
                )}
                {claim.message && (
                  <p className="claim-reason">
                    <strong>Claim note:</strong> {claim.message}
                  </p>
                )}
                <span className="claim-timestamp">
                  📅 Submitted: {new Date(claim.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="admin-claim-actions">
                <span className={`claim-status-badge ${claim.status}`}>
                  {claim.status.toUpperCase()}
                </span>

                {claim.status === "pending" && (
                  <div className="action-buttons-row">
                    <button
                      className="btn-approve"
                      onClick={() => handleStatusUpdate(claim._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleStatusUpdate(claim._id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
