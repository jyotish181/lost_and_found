// src/pages/ItemDetailsPage.jsx
// Detailed view of an item with photo, reporter information, and strict single-claim validation.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function ItemDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimMessage, setClaimMessage] = useState("");
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [existingUserClaim, setExistingUserClaim] = useState(null);

  useEffect(() => {
    fetchItemDetails();
    if (isAuthenticated) {
      checkExistingClaim();
    }
  }, [id, isAuthenticated]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/items/${id}`);
      setItem(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load item details.");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingClaim = async () => {
    try {
      const res = await api.get("/claims/my");
      const match = (res.data || []).find((c) => (c.item?._id || c.item) === id);
      if (match) {
        setExistingUserClaim(match);
      }
    } catch {
      // Ignore background errors
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please login first to claim this item.");
      navigate("/login");
      return;
    }

    const isLost = item.status === "lost";
    const claimActionLabel = isLost ? "Claim Found" : "Claim Lost";

    if (existingUserClaim) {
      alert(`You have already submitted '${claimActionLabel}' for this item. You cannot claim more than 1 time.`);
      return;
    }

    setClaimSubmitting(true);
    try {
      const res = await api.post("/claims", { itemId: item._id, message: claimMessage });
      alert(`'${claimActionLabel}' submitted successfully! Status: Pending verification.`);
      setExistingUserClaim(res.data);
      setShowClaimModal(false);
      setClaimMessage("");
    } catch (err) {
      alert(err.response?.data?.message || `Failed to submit '${claimActionLabel}'.`);
    } finally {
      setClaimSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="loading-text">Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container">
        <div className="message error">{error || "Item not found."}</div>
        <Link to="/" className="back-link">
          ← Back to All Items
        </Link>
      </div>
    );
  }

  const isOwner =
    user &&
    item.reportedBy &&
    (item.reportedBy._id === user._id || item.reportedBy === user._id);

  return (
    <div className="container item-details-container">
      <Link to="/" className="back-link">
        ← Back to All Items
      </Link>

      <div className="item-detail-card">
        {/* Media Column */}
        <div className="detail-media">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="detail-large-image"
            />
          ) : (
            <div className="detail-image-placeholder">
              <span>📷 No Image Available</span>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="detail-info">
          <div className="detail-header-row">
            <span className={`badge ${item.status}`}>
              {item.status.toUpperCase()}
            </span>
            <span className="detail-date">
              Reported on{" "}
              {new Date(item.date || item.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h2 className="detail-title">{item.title}</h2>
          <p className="detail-desc">{item.description}</p>

          <div className="detail-attributes-grid">
            <div className="attribute-pill">
              <span className="attr-label">📁 Category:</span>
              <span className="attr-val">{item.category || "General"}</span>
            </div>

            {item.color && (
              <div className="attribute-pill">
                <span className="attr-label">🎨 Color:</span>
                <span className="attr-val">{item.color}</span>
              </div>
            )}

            {item.brand && (
              <div className="attribute-pill">
                <span className="attr-label">🏷️ Brand:</span>
                <span className="attr-val">{item.brand}</span>
              </div>
            )}

            <div className="attribute-pill">
              <span className="attr-label">📍 Location:</span>
              <span className="attr-val">{item.location}</span>
            </div>
          </div>

          {/* Reporter details */}
          <div className="reporter-box">
            <h4>👤 Reported By</h4>
            <p>
              <strong>Name:</strong> {item.reportedBy?.name || "Anonymous User"}
            </p>
            {item.reportedBy?.email && (
              <p>
                <strong>Contact:</strong> {item.reportedBy.email}
              </p>
            )}
          </div>

          {/* Claim Action / Single-Claim State */}
          <div className="detail-actions">
            {isOwner ? (
              <div className="owner-status-box">
                <span>👤 You reported this item.</span>
              </div>
            ) : existingUserClaim ? (
              <div className="claimed-status-box">
                <span className="claimed-icon">✅</span>
                <div className="claimed-status-info">
                  <strong>
                    {item.status === "lost"
                      ? "You have already submitted 'Claim Found'."
                      : "You have already submitted 'Claim Lost'."}
                  </strong>
                  <p>
                    Status:{" "}
                    <span className={`claim-status-badge ${existingUserClaim.status}`}>
                      {existingUserClaim.status.toUpperCase()}
                    </span>{" "}
                    (Claimed on {new Date(existingUserClaim.createdAt).toLocaleDateString()})
                  </p>
                  <small className="single-claim-note">
                    Only 1 claim is permitted per item.
                  </small>
                </div>
              </div>
            ) : (
              <button
                className={`claim-action-btn ${
                  item.status === "lost" ? "claim-found-btn" : "claim-lost-btn"
                }`}
                onClick={() => setShowClaimModal(true)}
              >
                {item.status === "lost"
                  ? "🤝 Claim Found (I Found This)"
                  : "🤝 Claim Lost (This is Mine)"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {item.status === "lost"
                ? `🤝 Submit 'Claim Found' for "${item.title}"`
                : `🤝 Submit 'Claim Lost' for "${item.title}"`}
            </h3>
            <p className="modal-desc">
              {item.status === "lost"
                ? "Let the owner know you found their lost item. Please describe where and when you found it, or how they can contact you to collect it."
                : "Please provide proof or description to help verify that this item belongs to you. You can only claim this item once."}
            </p>
            <form onSubmit={handleClaimSubmit}>
              <div className="form-group">
                <label>
                  {item.status === "lost"
                    ? "Finder's Notes / Verification Details (Optional):"
                    : "Proof / Verification Details (Optional):"}
                </label>
                <textarea
                  rows={4}
                  placeholder={
                    item.status === "lost"
                      ? "e.g. Found near library 2nd floor, item is safe with me..."
                      : "e.g. Serial number, distinguishing marks, or exact contents inside..."
                  }
                  value={claimMessage}
                  onChange={(e) => setClaimMessage(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowClaimModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-primary ${
                    item.status === "lost" ? "claim-found-btn" : "claim-lost-btn"
                  }`}
                  disabled={claimSubmitting}
                >
                  {claimSubmitting
                    ? "Submitting..."
                    : item.status === "lost"
                    ? "Submit 'Claim Found'"
                    : "Submit 'Claim Lost'"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
