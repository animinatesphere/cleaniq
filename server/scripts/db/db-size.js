// Read-only: prints how much space each collection uses.
//
//   node scripts/db/db-size.js                 # uses MONGODB_URI from server/.env
//   node scripts/db/db-size.js "mongodb://..." # or pass a URI
//
// Never writes anything.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");

const uri = process.argv[2] || process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ No URI. Pass one as an argument or set MONGODB_URI in server/.env");
  process.exit(1);
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";

async function collectionStats(db, name) {
  try {
    const [row] = await db
      .collection(name)
      .aggregate([{ $collStats: { storageStats: {} } }])
      .toArray();
    const s = row.storageStats;
    return { docs: s.count, data: s.size, storage: s.storageSize, indexes: s.totalIndexSize };
  } catch {
    // Some hosted tiers restrict $collStats; fall back to a document count only.
    const docs = await db.collection(name).estimatedDocumentCount();
    return { docs, data: 0, storage: 0, indexes: 0 };
  }
}

(async () => {
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;
  console.log(`\nDatabase name: ${db.databaseName}\n`);

  const names = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));

  const rows = [];
  for (const name of names) rows.push({ name, ...(await collectionStats(db, name)) });
  rows.sort((a, b) => b.storage + b.indexes - (a.storage + a.indexes));

  console.log("Collection".padEnd(32), "Docs".padStart(10), "Data".padStart(12), "On disk".padStart(12), "Indexes".padStart(12));
  for (const r of rows) {
    console.log(r.name.padEnd(32), String(r.docs).padStart(10), mb(r.data).padStart(12), mb(r.storage).padStart(12), mb(r.indexes).padStart(12));
  }

  try {
    const stats = await db.command({ dbStats: 1 });
    console.log(`\nTotal data: ${mb(stats.dataSize)} | On disk: ${mb(stats.storageSize)} | Indexes: ${mb(stats.indexSize)}`);
  } catch (err) {
    console.log(`\n(dbStats not available on this server: ${err.message})`);
  }

  await conn.close();
})().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
