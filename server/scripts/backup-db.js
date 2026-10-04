// Copies every collection in the database to JSON files (MongoDB Extended JSON, so dates and
// ids are kept exactly), for a quick backup before a deploy. Uses MONGODB_URI from .env.
// Read-only: it never changes the database.
//
//   cd ~/cleaniq/server && node scripts/backup-db.js
//   → ~/cleaniq-backups/2026-10-04T10-30-00/<collection>.json
require("dotenv").config();
const fs = require("fs");
const os = require("os");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = require("bson");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq");
  const db = mongoose.connection.db;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = path.join(os.homedir(), "cleaniq-backups", stamp);
  fs.mkdirSync(dir, { recursive: true });
  const collections = await db.listCollections().toArray();
  let total = 0;
  for (const { name } of collections) {
    if (name.startsWith("system.")) continue;
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(dir, `${name}.json`), EJSON.stringify(docs, null, 0, { relaxed: false }));
    total += docs.length;
    console.log(`  ${name}: ${docs.length}`);
  }
  console.log(`Backup done: ${collections.length} collections, ${total} documents → ${dir}`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("Backup failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
