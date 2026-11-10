// src/app.js
// Express application setup:
// - Middlewares (CORS, body parsing)
// - PostgreSQL connection check
// - Route registration (Auth, Items, Claims, Admin, Notifications)
// - Centralized error handling

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Import route modules
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const claimRoutes = require("./routes/claimRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Connect to PostgreSQL
connectDB();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lost and Found API is running!",
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// Error Handling Middlewares (Must be registered after routes)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
