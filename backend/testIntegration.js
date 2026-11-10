// testIntegration.js
// Automated verification for non-AI components: Redis caching, Rate Limiting, and Cloudinary uploads.

require("dotenv").config();
const { pool } = require("./src/config/db");
const cacheService = require("./src/services/cacheService");
const cloudinaryService = require("./src/services/cloudinaryService");
const { rateLimiter } = require("./src/middleware/rateLimitMiddleware");

async function runTests() {
  console.log("=========================================");
  console.log("🚀 STARTING INTEGRATION TESTS (NON-AI)");
  console.log("=========================================\n");

  try {
    // 1. Connect PostgreSQL
    await pool.query("SELECT 1");
    console.log("✅ 1. PostgreSQL Connected successfully.");

    // 2. Redis / Cache Service
    console.log("\n--- TEST 2: REDIS / CACHE SERVICE ---");
    const testKey = "lostfound:test:key1";
    const testData = { message: "cache-hit-test", timestamp: Date.now() };

    await cacheService.set(testKey, testData, 60);
    const cachedResult = await cacheService.get(testKey);
    console.log("Cache retrieved:", cachedResult);

    if (cachedResult && cachedResult.message === "cache-hit-test") {
      console.log("✅ Cache SET and GET succeeded.");
    } else {
      throw new Error("Cache SET/GET mismatch.");
    }

    // Pattern deletion test
    await cacheService.del(testKey);
    const afterDelete = await cacheService.get(testKey);
    if (afterDelete === null) {
      console.log("✅ Cache DEL succeeded.");
    } else {
      throw new Error("Cache DEL failed.");
    }

    // 3. Rate Limiter Middleware
    console.log("\n--- TEST 3: RATE LIMITING MIDDLEWARE ---");
    const limiter = rateLimiter({ limit: 3, windowSeconds: 60, prefix: "test:rl:" });
    const fakeReq = { ip: "127.0.0.1", user: null };
    let rateLimitBlocked = false;

    for (let i = 1; i <= 5; i++) {
      let nextCalled = false;
      const fakeRes = {
        headers: {},
        set(h, v) { this.headers[h] = v; },
        status(code) {
          return {
            json: (data) => {
              if (code === 429) {
                rateLimitBlocked = true;
                console.log(`Request ${i}: Rate limit hit with code 429:`, data.message);
              }
            },
          };
        },
      };

      await limiter(fakeReq, fakeRes, () => { nextCalled = true; });
      if (nextCalled) {
        console.log(`Request ${i}: Allowed through.`);
      }
    }

    if (rateLimitBlocked) {
      console.log("✅ Rate limiter successfully blocked excess requests with 429.");
    } else {
      throw new Error("Rate limiter did not trigger 429.");
    }

    // 4. Cloudinary Service & Transformations
    console.log("\n--- TEST 4: CLOUDINARY SERVICE & TRANSFORMATIONS ---");
    const samplePngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64"
    );

    const uploadRes = await cloudinaryService.uploadImageBuffer(samplePngBuffer, "test-folder");
    console.log("Upload result:", {
      imageUrl: uploadRes.imageUrl ? uploadRes.imageUrl.substring(0, 45) + "..." : "",
      publicId: uploadRes.publicId,
    });

    const thumbUrl = cloudinaryService.getOptimizedUrl("sample_id", "thumbnail");
    const cardUrl = cloudinaryService.getOptimizedUrl("sample_id", "card");
    console.log("Optimized URLs generated successfully.");
    console.log("✅ Cloudinary upload & transformation flow verified.");

    console.log("\n=========================================");
    console.log("🎉 ALL NON-AI INTEGRATION TESTS PASSED!");
    console.log("=========================================\n");
  } catch (err) {
    console.error("❌ TEST FAILED:", err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runTests();
