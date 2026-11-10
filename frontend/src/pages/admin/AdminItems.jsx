// src/pages/admin/AdminItems.jsx
// Admin interface to view and delete items.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/admin/items");
      setItems(res.data || []);
    } catch (err) {
      setMessage("Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId, itemTitle) => {
    if (!window.confirm(`Delete "${itemTitle}"? This will also remove any related claims.`)) {
      return;
    }

    try {
      await api.delete(`/admin/items/${itemId}`);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
      setMessage("Item deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete item.");
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <Link to="/admin" className="back-link">
            ← Back to Dashboard
          </Link>
          <h2>📦 Manage Items</h2>
          <p className="page-subtitle">Total: {items.length} items reported on the platform</p>
        </div>
      </div>

      {message && <div className="message success">{message}</div>}

      {loading ? (
        <div className="loading-state">
          <p>Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No items found.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Category</th>
                <th>Location</th>
                <th>Reported By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>
                    <Link to={`/items/${item._id}`} className="table-item-link">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="table-item-thumb"
                        />
                      )}
                      <strong>{item.title}</strong>
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${item.status}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{item.category || "General"}</td>
                  <td>{item.location}</td>
                  <td>
                    {item.reportedBy?.name || "User"}
                    <br />
                    <small className="text-muted">{item.reportedBy?.email}</small>
                  </td>
                  <td>{new Date(item.date || item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-danger-sm"
                      onClick={() => handleDelete(item._id, item.title)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
