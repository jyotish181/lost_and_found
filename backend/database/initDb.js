// database/initDb.js
// Creates all tables by running schema.sql.  Usage: npm run db:init
// (You can instead paste schema.sql into pgAdmin's Query Tool.)

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(sql);
    console.log("✅ Database tables created successfully.");
  } catch (err) {
    console.error("❌ Failed to create tables:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
