// src/controllers/itemController.js
// Lost & Found item operations (PostgreSQL), Cloudinary upload, search/filter, Redis cache.

const Item = require("../models/Item");
const cloudinaryService = require("../services/cloudinaryService");
const cacheService = require("../services/cacheService");
const { parseDate } = require("../utils/helpers");

// @route POST /api/items  (Protected) — optional image upload
const createItem = async (req, res) => {
  const { title, description, location, status, category, color, brand, date } = req.body;

  try {
    if (!title || !description || !location) {
      return res
        .status(400)
        .json({ message: "Title, description and location are required." });
    }
    const itemStatus = status || "lost";
    if (!["lost", "found"].includes(itemStatus)) {
      return res.status(400).json({ message: 'Status must be "lost" or "found".' });
    }
    const itemDate = date ? parseDate(date) : new Date();
    if (!itemDate) {
      return res.status(400).json({ message: "Invalid date." });
    }

    let imageUrl = "";
    let cloudinaryPublicId = "";

    if (req.file) {
      const uploadResult = await cloudinaryService.uploadImageBuffer(
        req.file.buffer,
        `lost-and-found/${itemStatus}`
      );
      imageUrl = uploadResult.imageUrl;
      cloudinaryPublicId = uploadResult.publicId;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    const item = await Item.create({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      status: itemStatus,
      category: (category && category.trim()) || "Other",
      color: (color || "").trim(),
      brand: (brand || "").trim(),
      date: itemDate,
      reportedBy: req.user._id,
      imageUrl,
      cloudinaryPublicId,
    });

    await cacheService.invalidateItemCaches();

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/items  (Public) — ?search= &status= &category=  (cached)
const getAllItems = async (req, res) => {
  const { search, status, category } = req.query;
  const cacheKey = cacheService.getSearchCacheKey(search, { status, category });

  try {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({ source: "cache", count: cached.length, items: cached });
    }

    const items = await Item.list({ search, status, category });

    await cacheService.set(cacheKey, items, 180);

    res.json({ source: "database", count: items.length, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/items/:id  (Public) — cached
const getItemById = async (req, res) => {
  const cacheKey = `lostfound:item:${req.params.id}`;

  try {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const item = await Item.findById(req.params.id, true);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await cacheService.set(cacheKey, item, 300);

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/items/:id  (Protected: owner or admin)
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const isOwner = item.reportedBy === req.user._id;
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this item." });
    }

    const { title, description, location, status, category, color, brand, date } = req.body;

    const patch = {};
    if (title) patch.title = title;
    if (description) patch.description = description;
    if (location) patch.location = location;
    if (status) {
      if (!["lost", "found"].includes(status)) {
        return res.status(400).json({ message: 'Status must be "lost" or "found".' });
      }
      patch.status = status;
    }
    if (category) patch.category = category;
    if (color !== undefined) patch.color = color;
    if (brand !== undefined) patch.brand = brand;
    if (date) {
      const d = parseDate(date);
      if (!d) return res.status(400).json({ message: "Invalid date." });
      patch.date = d;
    }

    if (req.file) {
      if (item.cloudinaryPublicId) {
        await cloudinaryService.deleteImage(item.cloudinaryPublicId);
      }
      const uploadResult = await cloudinaryService.uploadImageBuffer(
        req.file.buffer,
        `lost-and-found/${patch.status || item.status || "items"}`
      );
      patch.imageUrl = uploadResult.imageUrl;
      patch.cloudinaryPublicId = uploadResult.publicId;
    }

    const updated = await Item.update(item._id, patch);
    await cacheService.invalidateItemCaches(item._id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/items/:id  (Protected: owner or admin)
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const isOwner = item.reportedBy === req.user._id;
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this item." });
    }

    if (item.cloudinaryPublicId) {
      await cloudinaryService.deleteImage(item.cloudinaryPublicId);
    }

    // Claims and notifications are removed automatically (ON DELETE CASCADE)
    await Item.remove(item._id);
    await cacheService.invalidateItemCaches(item._id);

    res.json({ message: "Item and associated records deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createItem, getAllItems, getItemById, updateItem, deleteItem };
