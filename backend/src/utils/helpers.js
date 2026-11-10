// src/utils/helpers.js
// Small helpers shared by the PostgreSQL model layer.

// PostgreSQL ids are integers. Accepts "12" or 12, returns a Number, or null if invalid
// (so a bad id like "abc" becomes a clean 404 instead of a database error).
const parseId = (value) => {
  const s = String(value ?? "").trim();
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
};

// Escape % _ \ so user search text is matched literally inside ILIKE.
const escapeLike = (text) => String(text).replace(/[\\%_]/g, "\\$&");

// Returns a valid Date, or null when the value cannot be parsed.
const parseDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

module.exports = { parseId, escapeLike, parseDate };
