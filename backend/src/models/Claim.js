// src/models/Claim.js
// PostgreSQL data access for item claims.
// The UNIQUE (item_id, claimed_by) constraint in schema.sql guarantees one claim per user per item.

const { query } = require("../config/db");
const { parseId } = require("../utils/helpers");
const { mapItem } = require("./Item");

const mapClaim = (r) => {
  if (!r) return null;
  return {
    _id: String(r.id),
    item: String(r.item_id),
    claimedBy: String(r.claimed_by),
    status: r.status,
    message: r.message,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
};

const create = async ({ item, claimedBy, message = "" }) => {
  const { rows } = await query(
    `INSERT INTO claims (item_id, claimed_by, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [parseId(item), parseId(claimedBy), message]
  );
  return mapClaim(rows[0]);
};

const findById = async (id) => {
  const cid = parseId(id);
  if (cid === null) return null;
  const { rows } = await query("SELECT * FROM claims WHERE id = $1", [cid]);
  return mapClaim(rows[0]);
};

const findByItemAndUser = async (itemId, userId) => {
  const { rows } = await query(
    "SELECT * FROM claims WHERE item_id = $1 AND claimed_by = $2",
    [parseId(itemId), parseId(userId)]
  );
  return mapClaim(rows[0]);
};

const findApprovedByItem = async (itemId) => {
  const { rows } = await query(
    "SELECT * FROM claims WHERE item_id = $1 AND status = 'approved' LIMIT 1",
    [parseId(itemId)]
  );
  return mapClaim(rows[0]);
};

// A user's own claims, each with the full item object inside `item`
const findByUser = async (userId) => {
  const { rows } = await query(
    `SELECT c.*, to_jsonb(i) AS item_row
     FROM claims c
     JOIN items i ON i.id = c.item_id
     WHERE c.claimed_by = $1
     ORDER BY c.created_at DESC`,
    [parseId(userId)]
  );
  return rows.map((r) => ({ ...mapClaim(r), item: mapItem(r.item_row) }));
};

// Admin view: all claims with item summary and claimer name/email
const findAllDetailed = async () => {
  const { rows } = await query(
    `SELECT c.*,
            i.title AS item_title, i.description AS item_description,
            i.location AS item_location, i.status AS item_status,
            u.name AS user_name, u.email AS user_email
     FROM claims c
     JOIN items i ON i.id = c.item_id
     JOIN users u ON u.id = c.claimed_by
     ORDER BY c.created_at DESC`
  );
  return rows.map((r) => ({
    ...mapClaim(r),
    item: {
      _id: String(r.item_id),
      title: r.item_title,
      description: r.item_description,
      location: r.item_location,
      status: r.item_status,
    },
    claimedBy: { _id: String(r.claimed_by), name: r.user_name, email: r.user_email },
  }));
};

const updateStatus = async (id, status) => {
  const cid = parseId(id);
  if (cid === null) return null;
  const { rows } = await query(
    "UPDATE claims SET status = $1 WHERE id = $2 RETURNING *",
    [status, cid]
  );
  return mapClaim(rows[0]);
};

// { total, pending, approved, rejected }
const counts = async () => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'pending')::int  AS pending,
            COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
            COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
     FROM claims`
  );
  return rows[0];
};

module.exports = {
  create, findById, findByItemAndUser, findApprovedByItem,
  findByUser, findAllDetailed, updateStatus, counts,
};
