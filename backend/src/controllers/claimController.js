// src/controllers/claimController.js
// Item claim creation and retrieval with strict single-claim validation (PostgreSQL).

const Claim = require("../models/Claim");
const Item = require("../models/Item");

// @route POST /api/claims  (Protected)
const createClaim = async (req, res) => {
  const { itemId, message } = req.body;

  try {
    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required to submit a claim." });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Rule 1: A user cannot claim an item they reported themselves
    if (item.reportedBy === req.user._id) {
      return res.status(400).json({
        message: "You cannot claim an item that you reported yourself.",
      });
    }

    // Rule 2: No one can claim the same item more than once
    const existingClaim = await Claim.findByItemAndUser(item._id, req.user._id);
    if (existingClaim) {
      return res.status(400).json({
        message: "You have already claimed this item. You cannot claim more than 1 time.",
      });
    }

    // Rule 3: Item already claimed and approved
    const approvedClaim = await Claim.findApprovedByItem(item._id);
    if (approvedClaim) {
      return res.status(400).json({
        message: "This item has already been successfully claimed and resolved.",
      });
    }

    const claim = await Claim.create({
      item: item._id,
      claimedBy: req.user._id,
      message: message || "",
    });

    res.status(201).json(claim);
  } catch (error) {
    // PostgreSQL unique_violation (UNIQUE item_id + claimed_by)
    if (error.code === "23505") {
      return res.status(400).json({
        message: "You have already claimed this item. You cannot claim more than 1 time.",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/claims/my  (Protected)
const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.findByUser(req.user._id);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createClaim, getMyClaims };
