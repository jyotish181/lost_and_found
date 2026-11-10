// src/controllers/adminController.js
// Admin-only controllers (PostgreSQL): claims, claim status, dashboard stats, items.

const Claim = require("../models/Claim");
const Item = require("../models/Item");
const User = require("../models/User");
const cacheService = require("../services/cacheService");

// @route GET /api/admin/claims  (Admin)
const getAllClaims = async (req, res) => {
  try {
    const claims = await Claim.findAllDetailed();
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/admin/claims/:id  (Admin) — approve / reject / pending
const updateClaimStatus = async (req, res) => {
  const { status } = req.body;

  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const claim = await Claim.updateStatus(req.params.id, status);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    res.json({ message: `Claim ${status} successfully`, claim });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/admin/stats  (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const [items, claims, totalUsers] = await Promise.all([
      Item.counts(),
      Claim.counts(),
      User.count(),
    ]);

    res.json({
      totalItems: items.total,
      lostItems: items.lost,
      foundItems: items.found,
      totalClaims: claims.total,
      pendingClaims: claims.pending,
      approvedClaims: claims.approved,
      rejectedClaims: claims.rejected,
      totalUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/admin/items  (Admin)
const getAllItems = async (req, res) => {
  try {
    const items = await Item.list();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/admin/items/:id  (Admin)
// Related claims and notifications are deleted automatically (ON DELETE CASCADE).
const deleteItem = async (req, res) => {
  try {
    const deleted = await Item.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Item not found" });
    }
    await cacheService.invalidateItemCaches(req.params.id);
    res.json({ message: "Item and related claims deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllClaims,
  updateClaimStatus,
  getDashboardStats,
  getAllItems,
  deleteItem,
};
