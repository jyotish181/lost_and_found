// src/routes/itemRoutes.js
// Routes for Lost/Found items with Cloudinary image upload and search/filtering.

const express = require("express");
const router = express.Router();
const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");
const { protect } = require("../middleware/authMiddleware");
const { handleUpload } = require("../middleware/uploadMiddleware");

// GET /api/items → public, get all items (supports ?search=, ?status= & ?category=)
router.get("/", getAllItems);

// GET /api/items/:id → public, get item by ID
router.get("/:id", getItemById);

// POST /api/items → protected, create item with optional Cloudinary image upload
router.post("/", protect, handleUpload("image"), createItem);

// PUT /api/items/:id → protected, update item (owner or admin)
router.put("/:id", protect, handleUpload("image"), updateItem);

// DELETE /api/items/:id → protected, delete item (owner or admin)
router.delete("/:id", protect, deleteItem);

module.exports = router;
