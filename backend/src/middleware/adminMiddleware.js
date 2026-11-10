// src/middleware/adminMiddleware.js
// Restricts route access strictly to administrator accounts (isAdmin: true).

const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only." });
};

// Aliased as isAdmin for backwards compatibility
module.exports = { adminOnly, isAdmin: adminOnly };
