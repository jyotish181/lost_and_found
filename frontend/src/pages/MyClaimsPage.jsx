// src/pages/MyClaimsPage.jsx
// Displays all claims submitted by the logged-in user.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function MyClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyClaims();
  }, []);

  const fetchMyClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get("/claims/my");
      setClaims(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load claims.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>📋 My Claims</h2>
          <p className="page-subtitle">
            Track the status of all items you have requested to claim.
          </p>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <p>Loading your claims...</p>
        </div>
      ) : claims.length === 0 ? (
        <div className="empty-state">
          <p>You haven't submitted any claims yet.</p>
          <Link to="/" className="btn-primary">
            Browse Items
          </Link>
        </div>
      ) : (
        <div className="claims-list">
          {claims.map((claim) => (
            <div key={claim._id} className="claim-card">
              <div className="claim-item-details">
                {claim.item ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span
                        className={`claim-type-pill ${
                          claim.item.status === "lost" ? "claim-found-tag" : "claim-lost-tag"
                        }`}
                      >
                        {claim.item.status === "lost"
                          ? "🤝 Claim Found (Finder Report)"
                          : "🤝 Claim Lost (Owner Request)"}
                      </span>
                      <span className={`badge ${claim.item.status}`}>
                        {claim.item.status === "lost" ? "LOST ITEM" : "FOUND ITEM"}
                      </span>
                    </div>

                    <h3 className="claim-item-title">
                      <Link to={`/items/${claim.item._id}`}>
                        {claim.item.title}
                      </Link>
                    </h3>
                    <p className="claim-item-desc">
                      {claim.item.description?.substring(0, 100)}...
                    </p>
                    {claim.message && (
                      <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0", fontStyle: "italic" }}>
                        📝 Note: "{claim.message}"
                      </p>
                    )}
                    <div className="claim-meta">
                      <span>📍 {claim.item.location}</span>
                      <span>
                        📅 Submitted on{" "}
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="claim-deleted-item">
                    ⚠️ The item associated with this claim has been removed.
                  </p>
                )}
              </div>

              <div className="claim-status-col">
                <span className={`claim-status-badge ${claim.status}`}>
                  {claim.status === "approved"
                    ? "✅ Approved"
                    : claim.status === "rejected"
                    ? "❌ Rejected"
                    : "⏳ Pending Review"}
                </span>

                {claim.item && (
                  <Link
                    to={`/items/${claim.item._id}`}
                    className="view-claim-btn"
                  >
                    View Item
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
