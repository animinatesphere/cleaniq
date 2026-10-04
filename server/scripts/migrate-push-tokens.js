// One-off: copy each worker's/customer's old single push token (expoPushToken) into the new
// per-device list (pushTokens). Safe to run any number of times — it only adds a token that
// isn't already in the list, and never removes anything.
//
//   cd ~/cleaniq/server && node scripts/migrate-push-tokens.js
require("dotenv").config();
const mongoose = require("mongoose");
const { migrateSingleTokens } = require("../utils/pushTokens");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq");
  const updated = await migrateSingleTokens();
  console.log(`Push token migration done: ${updated} account(s) updated.`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("Push token migration failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
