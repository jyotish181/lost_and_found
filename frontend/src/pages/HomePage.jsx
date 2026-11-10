// src/pages/HomePage.jsx
// Main page with search, category & status filtering, Redis caching, and strict single-claim enforcement.

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
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

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (query && query.trim()) params.search = query.trim();

      const response = await api.get("/items", { params });
      const data = response.data;

      const itemsList = Array.isArray(data) ? data : data.items || [];
      setItems(itemsList);
      setSearchSource(data.source || "database");
    } catch (err) {
      setError("Failed to load items. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchItems("");
  };

  const handleClaim = async (itemId) => {
    if (!isAuthenticated) {
      alert("Please login first to claim an item.");
      navigate("/login");
      return;
    }

    const targetItem = items.find((i) => i._id === itemId);
    const isLost = targetItem?.status === "lost";
    const claimActionLabel = isLost ? "Claim Found" : "Claim Lost";

    if (myClaimedIds.has(itemId)) {
      alert(`You have already submitted '${claimActionLabel}' for this item. You cannot claim more than 1 time.`);
      return;
    }

    try {
      await api.post("/claims", {
        itemId,
        message: isLost ? "Claim Found (Finder report)" : "Claim Lost (Owner claim)",
      });
      // Immediately disable the claim button by updating local state
      setMyClaimedIds((prev) => new Set([...prev, itemId]));
      alert(`'${claimActionLabel}' submitted successfully! Status: Pending verification.`);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to submit '${claimActionLabel}'.`);
    }
  };

  return (
    <div className="container">
      {/* Hero & Search Section */}
      <section className="search-hero">
        <h2>🔍 Find Lost &amp; Found Items</h2>
        <p className="search-subtext">
          Search by item name, description, brand, color, or location.
        </p>

        <form className="smart-search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔎</span>
            <input
              type="text"
              className="search-input"
              placeholder='e.g., "blue wallet", "library laptop", "car keys"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>

        {/* Filter Controls */}
        <div className="filters-row">
          <div className="filter-group">
            <label>Type:</label>
            <div className="status-tabs">
              <button
                type="button"
                className={`tab-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`tab-btn lost ${statusFilter === "lost" ? "active" : ""}`}
                onClick={() => setStatusFilter("lost")}
              >
                🔴 Lost
              </button>
              <button
                type="button"
                className={`tab-btn found ${statusFilter === "found" ? "active" : ""}`}
                onClick={() => setStatusFilter("found")}
              >
                🟢 Found
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Category:</label>
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
          </div>
        </div>
      </section>

      {/* Results Header with Redis Cache Indicator */}
      <div className="results-header">
        <h3>
          {statusFilter === "lost"
            ? "Lost Items"
            : statusFilter === "found"
            ? "Found Items"
            : "All Reported Items"}{" "}
          ({items.length})
        </h3>
        {searchSource && (
          <span
            className={`cache-badge ${searchSource === "cache" ? "cache-hit" : "db-hit"}`}
            title={
              searchSource === "cache"
                ? "Loaded instantly from Redis memory cache"
                : "Fetched directly from MongoDB"
            }
          >
            {searchSource === "cache" ? "⚡ Redis Cached" : "💾 Database"}
          </span>
        )}
      </div>

      {error && <div className="message error">{error}</div>}

      {/* Items Grid */}
      {loading ? (
        <div className="loading-state">
          <p>Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No items found matching your criteria.</p>
          {isAuthenticated ? (
            <Link to="/create" className="btn-primary">
              Report an Item
            </Link>
          ) : (
            <Link to="/login" className="btn-primary">
              Login to Report
            </Link>
          )}
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
