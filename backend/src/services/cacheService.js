// src/services/cacheService.js
// Provides caching with Redis, with automatic in-memory fallback.

const { getClient, isConnected } = require("../config/redis");

// In-memory fallback store: Map<key, { value: any, expiresAt: number }>
const memoryCache = new Map();

// Helper to clean expired memory cache items periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt && entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}, 60000);

/**
 * Get a cached value by key.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const get = async (key) => {
  try {
    const client = getClient();
    if (client) {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (err) {
    console.warn(`Redis get error (${key}): ${err.message}. Checking memory fallback.`);
  }

  // Memory fallback
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

/**
 * Set a cached value with TTL in seconds.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - Time-to-live in seconds (default 300 = 5 min)
 */
const set = async (key, value, ttlSeconds = 300) => {
  const serialized = JSON.stringify(value);

  try {
    const client = getClient();
    if (client) {
      if (ttlSeconds) {
        await client.set(key, serialized, "EX", ttlSeconds);
      } else {
        await client.set(key, serialized);
      }
      return true;
    }
  } catch (err) {
    console.warn(`Redis set error (${key}): ${err.message}. Using memory fallback.`);
  }

  // Memory fallback
  memoryCache.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
  return true;
};

/**
 * Delete a specific key from cache.
 * @param {string} key
 */
const del = async (key) => {
  try {
    const client = getClient();
    if (client) {
      await client.del(key);
    }
  } catch (err) {
    console.warn(`Redis del error (${key}): ${err.message}`);
  }
  memoryCache.delete(key);
};

/**
 * Delete all keys matching a pattern (e.g. "lostfound:search:*").
 * @param {string} pattern
 */
const delPattern = async (pattern) => {
  try {
    const client = getClient();
    if (client) {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== "0");
    }
  } catch (err) {
    console.warn(`Redis delPattern error (${pattern}): ${err.message}`);
  }

  // Memory fallback regex deletion
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
};

/**
 * Helper: Generate standardized search cache key.
 */
const getSearchCacheKey = (query, filters = {}) => {
  const cleanQuery = (query || "").trim().toLowerCase().replace(/\s+/g, "-");
  const filterPart = Object.entries(filters)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}:${v}`)
    .sort()
    .join(":");
  return `lostfound:search:${cleanQuery || "all"}${filterPart ? ":" + filterPart : ""}`;
};

/**
 * Invalidate all search and item-related caches when data changes.
 */
const invalidateItemCaches = async (itemId = null) => {
  await delPattern("lostfound:search:*");
  await delPattern("lostfound:items:*");
  if (itemId) {
    await del(`lostfound:item:${itemId}`);
  }
};

module.exports = {
  get,
  set,
  del,
  delPattern,
  getSearchCacheKey,
  invalidateItemCaches,
  isConnected,
};
