// src/pages/LostItemsPage.jsx
// Dedicated page for browsing and searching Lost items, strictly enforcing max 1 claim per item.

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import ItemCard from "../components/ItemCard";

const CATEGORIES = [
  "all",
  "Electronics",
  "Wallets",
  "Accessories",
  "Keys",
  "Clothing",
  "Documents",
  "Books",
  "Other",
];

export default function LostItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchSource, setSearchSource] = useState("");
  const [myClaimedIds, setMyClaimedIds] = useState(new Set());

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Load user's already-submitted claims to prevent claiming more than 1 time
  const fetchMyClaims = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/claims/my");
      const ids = new Set((res.data || []).map((c) => c.item?._id || c.item));
      setMyClaimedIds(ids);
    } catch {
      // Ignore background errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMyClaims();
  }, [fetchMyClaims]);

  const fetchItems = useCallback(async (query = searchQuery) => {
    setLoading(true);
    setError("");

    try {
      const params = { status: "lost" };
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (query && query.trim()) params.search = query.trim();

      const response = await api.get("/items", { params });
      const data = response.data;

      const itemsList = Array.isArray(data) ? data : data.items || [];
      setItems(itemsList);
      setSearchSource(data.source || "database");
    } catch (err) {
      setError("Failed to load lost items.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems(searchQuery);
  };

  const handleClaim = async (itemId) => {
    if (!isAuthenticated) {
      alert("Please login first to claim an item.");
      navigate("/login");
      return;
    }

    if (myClaimedIds.has(itemId)) {
      alert("You have already submitted 'Claim Found' for this item. You cannot claim more than 1 time.");
      return;
    }

    try {
      await api.post("/claims", { itemId, message: "Claim Found (Finder report)" });
      // Immediately disable the claim button by updating local state
      setMyClaimedIds((prev) => new Set([...prev, itemId]));
      alert("'Claim Found' submitted successfully! Status: Pending verification.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit 'Claim Found'.");
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>🔴 Lost Items</h2>
          <p className="page-subtitle">
            Browse items reported as lost. If you found one of these items, click <strong>Claim Found</strong> to notify the owner.
          </p>
        </div>
        <Link to="/create?type=lost" className="btn-primary">
          ➕ Report Lost Item
        </Link>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-bar-inline">
          <input
            type="text"
            placeholder="Search lost items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="category-select"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>

        {searchSource && (
          <span
            className={`cache-badge ${searchSource === "cache" ? "cache-hit" : "db-hit"}`}
          >
            {searchSource === "cache" ? "⚡ Redis Cached" : "💾 Database"}
          </span>
        )}
      </div>

      {error && <div className="message error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <p>Loading lost items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No lost items currently found matching your search.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => {
            const isOwner =
              user &&
              (item.reportedBy?._id === user._id ||
                item.reportedBy === user._id);
            const isClaimed = myClaimedIds.has(item._id);

            return (
              <ItemCard
                key={item._id}
                item={item}
                isOwner={isOwner}
                isClaimed={isClaimed}
                onClaim={handleClaim}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
