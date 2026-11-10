// src/config/db.js
// PostgreSQL connection pool (node-postgres).
// Use DATABASE_URL, or the individual DB_* variables from .env.

const { Pool } = require("pg");

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "lost_and_found",
    };

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

// Run a parameterized query: query("SELECT * FROM users WHERE id=$1", [id])
const query = (text, params) => pool.query(text, params);

// Called once at startup: verifies the database is reachable.
const connectDB = async () => {
  try {
    const { rows } = await pool.query("SELECT current_database() AS db");
    console.log(`PostgreSQL Connected: database "${rows[0].db}"`);
  } catch (error) {
    console.error(`PostgreSQL Connection Error: ${error.message}`);
    console.error("Check DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME in backend/.env");
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.pool = pool;
module.exports.query = query;
