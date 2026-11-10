// src/pages/CreateItemPage.jsx
// Form to report a Lost or Found item with optional Cloudinary image upload.

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const CATEGORIES = [
  "Electronics",
  "Wallets",
  "Accessories",
  "Keys",
  "Clothing",
  "Documents",
  "Books",
  "Other",
];

export default function CreateItemPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") === "found" ? "found" : "lost";

  const [status, setStatus] = useState(initialType);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const typeFromParam = searchParams.get("type");
    if (typeFromParam === "found" || typeFromParam === "lost") {
      setStatus(typeFromParam);
    }
  }, [searchParams]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB. Please choose a smaller image.");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Only JPG, JPEG, PNG, and WEBP formats are supported.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please login first to report an item.");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("status", status);
      formData.append("category", category);
      formData.append("color", color);
      formData.append("brand", brand);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("date", date);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await api.post("/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Item reported successfully! Redirecting...");
      setTimeout(() => {
        navigate(`/items/${res.data._id}`);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to report item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-container">
      <form onSubmit={handleSubmit} className="report-form">
        <h2>📢 Report an Item</h2>
        <p className="form-subtitle">
          Provide as many details as possible to help recover or return the item.
        </p>

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

        {/* Status Toggle */}
        <div className="form-group">
          <label>Item Status</label>
          <div className="status-toggle-group">
            <button
              type="button"
              className={`toggle-btn ${status === "lost" ? "active-lost" : ""}`}
              onClick={() => setStatus("lost")}
            >
              🔴 I Lost This Item
            </button>
            <button
              type="button"
              className={`toggle-btn ${status === "found" ? "active-found" : ""}`}
              onClick={() => setStatus("found")}
            >
              🟢 I Found This Item
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label>Item Name / Title *</label>
          <input
            type="text"
            placeholder="e.g., Black Leather Wallet, iPhone 13, House Keys"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Category & Date */}
        <div className="form-row">
          <div className="form-group half">
            <label>Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group half">
            <label>Date Lost/Found *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Location */}
        <div className="form-group">
          <label>Location *</label>
          <input
            type="text"
            placeholder="e.g., Main Campus Library, 2nd Floor reading area"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        {/* Color & Brand */}
        <div className="form-row">
          <div className="form-group half">
            <label>Color (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Navy Blue, Silver"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="form-group half">
            <label>Brand (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Apple, Dell, Fossil"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Detailed Description *</label>
          <textarea
            rows={4}
            placeholder="Describe specific features, stickers, scratches, or accessories..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <label>Photo (Optional, uploaded securely to Cloudinary)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="file-input"
          />
          {imagePreview && (
            <div className="image-preview-box">
              <img src={imagePreview} alt="Preview" className="preview-img" />
              <button
                type="button"
                className="remove-img-btn"
                onClick={handleRemoveImage}
              >
                ✕ Remove Image
              </button>
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Submitting..." : `Submit ${status === "lost" ? "Lost" : "Found"} Report`}
        </button>
      </form>
    </div>
  );
}
