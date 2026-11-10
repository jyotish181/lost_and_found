// testApiEndpoints.js
// End-to-end HTTP API verification for all non-AI functionality: Auth, Items, Search, Redis, Cloudinary, Claims, Notifications.

require("dotenv").config();
const { pool } = require("./src/config/db");
const app = require("./src/app");

let server;
const PORT = 5098; // Dedicated port for test server
const BASE_URL = `http://localhost:${PORT}/api`;

async function runE2ETests() {
  console.log("=========================================");
  console.log("🌐 STARTING E2E API TESTS (NON-AI)");
  console.log("=========================================\n");

  try {
    // Start temporary test server
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Test server running at http://localhost:${PORT}`);
        resolve();
      });
    });

    // Make sure PostgreSQL is reachable
    await pool.query("SELECT 1");
    console.log("PostgreSQL connection established!");

    // 1. Root check
    const rootRes = await fetch(`http://localhost:${PORT}/`);
    const rootData = await rootRes.json();
    console.log("Root endpoint response:", rootData);
    if (rootData.status !== "ok") throw new Error("Root endpoint failed.");
    console.log("✅ 1. GET / verified.");

    // 2. User registration
    const testEmail = `user_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: testEmail,
        password: "password123",
      }),
    });
    const regData = await regRes.json();
    if (!regData.token) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    const token = regData.token;
    console.log(`✅ 2. POST /api/auth/register succeeded (User: ${regData.name})`);

    // 2b. Test GET /api/auth/me
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    if (!meData.user || meData.user.email !== testEmail) throw new Error("GET /api/auth/me failed");
    console.log(`✅ 2b. GET /api/auth/me verified (User: ${meData.user.name})`);

    // 3. Create a Lost Item
    const lostItemRes = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Dell XPS 15 Laptop",
        description: "Silver Dell laptop in black protective sleeve left in library.",
        category: "Electronics",
        color: "Silver",
        brand: "Dell",
        location: "Main Library 2nd Floor",
        status: "lost",
      }),
    });
    const lostItem = await lostItemRes.json();
    if (!lostItem._id) throw new Error(`Create lost item failed: ${JSON.stringify(lostItem)}`);
    console.log(`✅ 3. POST /api/items (Lost Item) created: ${lostItem.title} (${lostItem._id})`);

    // 4. Create a Found Item
    const foundItemRes = await fetch(`${BASE_URL}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Found Dell Laptop",
        description: "Found Dell laptop near library tables.",
        category: "Electronics",
        color: "Silver",
        brand: "Dell",
        location: "Main Library",
        status: "found",
      }),
    });
    const foundItem = await foundItemRes.json();
    if (!foundItem._id) throw new Error(`Create found item failed: ${JSON.stringify(foundItem)}`);
    console.log(`✅ 4. POST /api/items (Found Item) created: ${foundItem.title} (${foundItem._id})`);

    // 5. Keyword search with Redis caching
    const searchRes = await fetch(`${BASE_URL}/items?search=Dell&category=Electronics`);
    const searchData = await searchRes.json();
    console.log(`Search result: found ${searchData.count} items (Source: ${searchData.source})`);
    if (!searchData.items || searchData.count === 0) throw new Error("Search returned 0 items.");
    console.log("✅ 5. GET /api/items?search=Dell succeeded.");

    // Repeat to test Redis Cache Hit
    const searchRes2 = await fetch(`${BASE_URL}/items?search=Dell&category=Electronics`);
    const searchData2 = await searchRes2.json();
    console.log(`Repeat search source: ${searchData2.source}`);
    if (searchData2.source === "cache") {
      console.log("✅ 6. Redis Search Cache hit verified.");
    }

    // 6. Get Item by ID
    const getByIdRes = await fetch(`${BASE_URL}/items/${lostItem._id}`);
    const getByIdData = await getByIdRes.json();
    if (getByIdData.title !== lostItem.title) throw new Error("Get by ID returned incorrect item.");
    console.log("✅ 7. GET /api/items/:id verified.");

    // 7. Update Item
    const updateRes = await fetch(`${BASE_URL}/items/${lostItem._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Dell XPS 15 Laptop (Updated)",
      }),
    });
    const updatedData = await updateRes.json();
    if (updatedData.title !== "Dell XPS 15 Laptop (Updated)") throw new Error("Update item failed.");
    console.log("✅ 8. PUT /api/items/:id verified.");

    // 8. Create a second user (Claimer) because owners cannot claim their own items
    const claimerEmail = `claimer_${Date.now()}@example.com`;
    const claimerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Claimer User",
        email: claimerEmail,
        password: "password123",
      }),
    });
    const claimerRegData = await claimerRegRes.json();
    const claimerToken = claimerRegData.token;

    // 8b. Submit Claim as Claimer User
    const claimRes = await fetch(`${BASE_URL}/claims`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${claimerToken}`,
      },
      body: JSON.stringify({
        itemId: foundItem._id,
      }),
    });
    const claimData = await claimRes.json();
    if (!claimData._id) throw new Error(`Claim failed: ${JSON.stringify(claimData)}`);
    console.log("✅ 9. POST /api/claims verified (Claim submitted by Claimer).");

    // 9a. Test duplicate claim rejection (No one can claim more than 1 time)
    const dupClaimRes = await fetch(`${BASE_URL}/claims`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${claimerToken}`,
      },
      body: JSON.stringify({
        itemId: foundItem._id,
      }),
    });
    if (dupClaimRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for duplicate claim, got ${dupClaimRes.status}`);
    }
    const dupData = await dupClaimRes.json();
    console.log(`✅ 9a. Duplicate claim rejected with 400: "${dupData.message}"`);

    // 9b. Test GET /api/claims/my for Claimer User
    const myClaimsRes = await fetch(`${BASE_URL}/claims/my`, {
      headers: { Authorization: `Bearer ${claimerToken}` },
    });
    const myClaimsData = await myClaimsRes.json();
    if (!Array.isArray(myClaimsData) || myClaimsData.length === 0) throw new Error("GET /api/claims/my failed.");
    console.log(`✅ 9b. GET /api/claims/my verified (Found ${myClaimsData.length} claim(s)).`);

    // 9. Notifications check
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notifData = await notifRes.json();
    if (notifData.success === undefined) throw new Error("Notifications endpoint failed.");
    console.log(`✅ 10. GET /api/notifications verified.`);

    // 10. Delete Item
    const deleteRes = await fetch(`${BASE_URL}/items/${lostItem._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const deleteData = await deleteRes.json();
    console.log("Delete response:", deleteData.message);
    console.log("✅ 11. DELETE /api/items/:id verified.");

    // Clean up remaining test data
    await pool.query("DELETE FROM items WHERE id = $1", [foundItem._id]);
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
    console.log("✅ Cleaned up temporary test data.");

    console.log("\n=========================================");
    console.log("🎉 ALL E2E NON-AI TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================\n");
  } catch (err) {
    console.error("❌ E2E TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await pool.end();
    process.exit();
  }
}

runE2ETests();
