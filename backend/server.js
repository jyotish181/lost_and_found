// server.js
// This is the entry point of our application.
// It loads environment variables and starts the Express server.

const dotenv = require("dotenv");
dotenv.config(); // Load .env variables (PORT, DB_*, JWT_SECRET)

const app = require("./src/app"); // Import our configured Express app

const PORT = process.env.PORT || 5000;

// Start the server and listen on the given port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
