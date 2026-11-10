// src/middleware/rateLimitMiddleware.js
// Rate limiting middleware backed by Redis with in-memory fallback.

const { getClient } = require("../config/redis");

const memoryRateLimits = new Map();

/**
 * Creates a rate limiting middleware.
 * @param {object} options
 * @param {number} options.limit - Max allowed requests within window
 * @param {number} options.windowSeconds - Window duration in seconds
 * @param {string} options.prefix - Key prefix
 */
const rateLimiter = ({ limit = 30, windowSeconds = 60, prefix = "rl:api:" } = {}) => {
  return async (req, res, next) => {
    const identifier = req.user?._id?.toString() || req.ip || req.connection.remoteAddress || "anonymous";
    const key = `${prefix}${identifier}`;

    try {
      const redis = getClient();
      if (redis) {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, windowSeconds);
        }

        if (current > limit) {
          const ttl = await redis.ttl(key);
          res.set("Retry-After", ttl > 0 ? ttl : windowSeconds);
          return res.status(429).json({
            success: false,
            message: "Too many requests. Please try again later.",
          });
        }

        return next();
      }
    } catch (err) {
      console.warn(`Redis rate limiter error: ${err.message}. Using memory fallback.`);
    }

    // Memory fallback
    const now = Date.now();
    let record = memoryRateLimits.get(key);

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowSeconds * 1000 };
      memoryRateLimits.set(key, record);
      return next();
    }

    record.count += 1;
    if (record.count > limit) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.set("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  };
};

module.exports = { rateLimiter };
