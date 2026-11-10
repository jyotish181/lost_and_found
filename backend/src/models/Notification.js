// src/models/Notification.js
// PostgreSQL data access for user notifications.

const { query } = require("../config/db");
const { parseId } = require("../utils/helpers");

const mapNotification = (r) => ({
  _id: String(r.id),
  recipient: String(r.recipient_id),
  item: r.item_id
    ? {
        _id: String(r.item_id),
        title: r.item_title,
        location: r.item_location,
        status: r.item_status,
        imageUrl: r.item_image_url,
      }
    : null,
  title: r.title,
  message: r.message,
  isRead: r.is_read,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const create = async ({ recipient, item = null, title, message }) => {
  const { rows } = await query(
    `INSERT INTO notifications (recipient_id, item_id, title, message)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [parseId(recipient), item ? parseId(item) : null, title, message]
  );
  return rows[0];
};

const findByRecipient = async (userId, limit = 50) => {
  const { rows } = await query(
    `SELECT n.*, i.title AS item_title, i.location AS item_location,
            i.status AS item_status, i.image_url AS item_image_url
     FROM notifications n
     LEFT JOIN items i ON i.id = n.item_id
     WHERE n.recipient_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2`,
    [parseId(userId), limit]
  );
  return rows.map(mapNotification);
};

const countUnread = async (userId) => {
  const { rows } = await query(
    "SELECT COUNT(*)::int AS n FROM notifications WHERE recipient_id = $1 AND is_read = FALSE",
    [parseId(userId)]
  );
  return rows[0].n;
};

// Returns the updated notification, or null if it does not belong to this user
const markRead = async (id, userId) => {
  const nid = parseId(id);
  if (nid === null) return null;
  const { rows } = await query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = $1 AND recipient_id = $2 RETURNING *`,
    [nid, parseId(userId)]
  );
  return rows[0]
    ? { _id: String(rows[0].id), recipient: String(rows[0].recipient_id), title: rows[0].title,
        message: rows[0].message, isRead: rows[0].is_read, createdAt: rows[0].created_at }
    : null;
};

const markAllRead = async (userId) => {
  await query(
    "UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE",
    [parseId(userId)]
  );
};

module.exports = { create, findByRecipient, countUnread, markRead, markAllRead };
