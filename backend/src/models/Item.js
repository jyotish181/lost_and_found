// src/models/Item.js
// PostgreSQL data access for lost/found items.

const { query } = require("../config/db");
const { parseId, escapeLike } = require("../utils/helpers");

// Map a DB row to the JSON shape the frontend expects.
// When the row was joined with users, reportedBy is { _id, name, email }; otherwise just the id string.
const mapItem = (r, populated = false) => {
  if (!r) return null;
  return {
    _id: String(r.id),
    title: r.title,
    description: r.description,
    category: r.category,
    color: r.color,
    brand: r.brand,
    location: r.location,
    date: r.date,
    status: r.status,
    reportedBy: populated
      ? { _id: String(r.reported_by), name: r.reporter_name, email: r.reporter_email }
      : String(r.reported_by),
    imageUrl: r.image_url,
    cloudinaryPublicId: r.cloudinary_public_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
};

const SELECT_WITH_REPORTER = `
  SELECT i.*, u.name AS reporter_name, u.email AS reporter_email
  FROM items i
  JOIN users u ON u.id = i.reported_by`;

// Items (with reporter info), optional filters: search text, status, category
const list = async ({ search, status, category } = {}) => {
  const where = [];
  const params = [];

  if (status && ["lost", "found"].includes(status)) {
    params.push(status);
    where.push(`i.status = $${params.length}`);
  }
  if (category && category !== "all") {
    params.push(category);
    where.push(`i.category = $${params.length}`);
  }
  if (search && search.trim()) {
    params.push(`%${escapeLike(search.trim())}%`);
    const p = `$${params.length}`;
    where.push(
      `(i.title ILIKE ${p} OR i.description ILIKE ${p} OR i.location ILIKE ${p}
        OR i.category ILIKE ${p} OR i.color ILIKE ${p} OR i.brand ILIKE ${p})`
    );
  }

  const sql =
    SELECT_WITH_REPORTER +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY i.created_at DESC";

  const { rows } = await query(sql, params);
  return rows.map((r) => mapItem(r, true));
};

// populate=true → reportedBy becomes { _id, name, email }
const findById = async (id, populate = false) => {
  const iid = parseId(id);
  if (iid === null) return null;
  if (populate) {
    const { rows } = await query(`${SELECT_WITH_REPORTER} WHERE i.id = $1`, [iid]);
    return mapItem(rows[0], true);
  }
  const { rows } = await query("SELECT * FROM items WHERE id = $1", [iid]);
  return mapItem(rows[0]);
};

const create = async (d) => {
  const { rows } = await query(
    `INSERT INTO items
       (title, description, category, color, brand, location, date, status,
        reported_by, image_url, cloudinary_public_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      d.title, d.description, d.category, d.color, d.brand, d.location,
      d.date, d.status, parseId(d.reportedBy), d.imageUrl, d.cloudinaryPublicId,
    ]
  );
  return mapItem(rows[0]);
};

const COLUMNS = {
  title: "title",
  description: "description",
  location: "location",
  status: "status",
  category: "category",
  color: "color",
  brand: "brand",
  date: "date",
  imageUrl: "image_url",
  cloudinaryPublicId: "cloudinary_public_id",
};

// patch: object with camelCase keys (only whitelisted keys are used)
const update = async (id, patch) => {
  const iid = parseId(id);
  if (iid === null) return null;

  const sets = [];
  const params = [];
  for (const [key, col] of Object.entries(COLUMNS)) {
    if (patch[key] !== undefined) {
      params.push(patch[key]);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (!sets.length) return findById(iid);

  params.push(iid);
  const { rows } = await query(
    `UPDATE items SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return mapItem(rows[0]);
};

// Claims and notifications of this item are removed automatically (ON DELETE CASCADE).
const remove = async (id) => {
  const iid = parseId(id);
  if (iid === null) return false;
  const { rowCount } = await query("DELETE FROM items WHERE id = $1", [iid]);
  return rowCount > 0;
};

// { total, lost, found }
const counts = async () => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'lost')::int  AS lost,
            COUNT(*) FILTER (WHERE status = 'found')::int AS found
     FROM items`
  );
  return rows[0];
};

module.exports = { mapItem, list, findById, create, update, remove, counts };
