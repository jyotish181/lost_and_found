// src/components/ItemCard.jsx
// Reusable presentation card for Lost & Found items with distinct "Claim Found" and "Claim Lost" actions.

import React from "react";
import { Link } from "react-router-dom";

export default function ItemCard({ item, onClaim, isClaimed = false, isOwner = false }) {
  const isLost = item.status === "lost";

  return (
    <div className="item-card">
      <div className="item-image-wrapper">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="item-image" loading="lazy" />
        ) : (
          <div className="item-image-placeholder">
            <span>📷 No Image</span>
          </div>
        )}
        <span className={`badge ${item.status}`}>
          {isLost ? "🔴 LOST" : "🟢 FOUND"}
        </span>
      </div>

      <div className="item-card-body">
        <div className="item-category-tag">{item.category || "General"}</div>
        <h3 className="item-title">{item.title}</h3>
        <p className="item-desc">
          {item.description?.length > 90
            ? `${item.description.substring(0, 90)}...`
            : item.description}
        </p>

        <div className="item-meta">
          <span className="item-location">📍 {item.location}</span>
          <span className="item-date">
            📅 {new Date(item.date || item.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="item-card-actions">
          <Link to={`/items/${item._id}`} className="view-btn">
            View Details
          </Link>

          {isOwner ? (
            <span className="owner-badge" title="You reported this item">
              Your Post
            </span>
          ) : isClaimed ? (
            <button
              disabled
              className="claim-btn claimed"
              title={
                isLost
                  ? "You have already submitted 'Claim Found' for this item"
                  : "You have already submitted 'Claim Lost' for this item"
              }
            >
              {isLost ? "✓ Claimed Found" : "✓ Claimed Lost"}
            </button>
          ) : (
            onClaim && (
              <button
                onClick={() => onClaim(item._id)}
                className={`claim-btn ${isLost ? "claim-found-btn" : "claim-lost-btn"}`}
                title={
                  isLost
                    ? "Claim Found (Report that you found this lost item)"
                    : "Claim Lost (Claim that this found item is yours)"
                }
              >
                {isLost ? "Claim Found" : "Claim Lost"}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
