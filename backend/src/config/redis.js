// src/config/redis.js
// Redis client initialization with automatic graceful fallback.
// If Redis is not running or REDIS_URL is not set, the app will continue to work seamlessly.

const Redis = require("ioredis");

let redisClient = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        // Stop retrying after 3 attempts to avoid log spam if Redis is down
        if (times > 3) {
          console.warn("Redis: Max reconnection attempts reached. Continuing with in-memory fallback.");
          return null;
        }
        return Math.min(times * 1000, 3000);
      },
      connectTimeout: 5000,
      enableOfflineQueue: false, // Don't queue commands if disconnected
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
      console.log("Redis connected successfully.");
    });

    redisClient.on("ready", () => {
      isRedisConnected = true;
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      // Do not crash, just log warning
      console.warn(`Redis connection warning: ${err.message}. Graceful fallback active.`);
    });

    redisClient.on("close", () => {
      isRedisConnected = false;
    });
  } catch (err) {
    console.warn(`Failed to initialize Redis client: ${err.message}`);
    redisClient = null;
    isRedisConnected = false;
  }
} else {
  console.info("REDIS_URL not configured. Running with in-memory caching and rate limiting fallback.");
}

const getClient = () => (isRedisConnected ? redisClient : null);
const isConnected = () => isRedisConnected;

module.exports = {
  redisClient,
  getClient,
  isConnected,
};
