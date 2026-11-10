// src/models/User.js
// PostgreSQL data access for users. Returns objects shaped like the old Mongoose documents
// (_id as a string, isAdmin, createdAt, updatedAt) so the frontend works unchanged.

const { query } = require("../config/db");
const { parseId } = require("../utils/helpers");

const mapUser = (r, withPassword = false) => {
  if (!r) return null;
  const user = {
    _id: String(r.id),
    name: r.name,
    email: r.email,
    isAdmin: r.is_admin,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
  if (withPassword) user.password = r.password;
  return user;
};

// Includes the hashed password (only for login checks).
const findByEmail = async (email) => {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  return mapUser(rows[0], true);
};

// Never returns the password.
const findById = async (id) => {
  const uid = parseId(id);
  if (uid === null) return null;
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [uid]);
  return mapUser(rows[0]);
};

const create = async ({ name, email, password, isAdmin = false }) => {
  const { rows } = await query(
    `INSERT INTO users (name, email, password, is_admin)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, password, isAdmin]
  );
  return mapUser(rows[0]);
};

const count = async () => {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM users");
  return rows[0].n;
};

module.exports = { findByEmail, findById, create, count };
