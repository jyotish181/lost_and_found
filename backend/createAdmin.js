// backend/createAdmin.js
// Run this ONCE to create an admin user in PostgreSQL.
// Usage: npm run create-admin     (or: node createAdmin.js)
//
// After running, login with:
//   Email:    admin@lostandfound.com
//   Password: admin123

require("dotenv").config();

const bcrypt = require("bcryptjs");
const { pool } = require("./src/config/db");
const User = require("./src/models/User");

const createAdmin = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected...");

    const existing = await User.findByEmail("admin@lostandfound.com");
    if (existing) {
      console.log("Admin user already exists!");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      name: "Admin",
      email: "admin@lostandfound.com",
      password: hashedPassword,
      isAdmin: true, // ← This makes the user an admin
    });

    console.log("✅ Admin user created successfully!");
    console.log("   Email:    admin@lostandfound.com");
    console.log("   Password: admin123");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

createAdmin();
