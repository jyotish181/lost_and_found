// src/utils/asyncHandler.js
// Utility wrapper to catch errors in asynchronous Express route handlers and pass to next()

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
