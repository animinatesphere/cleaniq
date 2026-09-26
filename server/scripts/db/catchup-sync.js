// Copies documents created or updated on the SOURCE after a given time into the TARGET.
// Used right after switching the backend to the new database, to pick up anything
// that was written to the old one during the final copy.
//
//   SOURCE_URI=... TARGET_URI=... SINCE="2026-09-27T02:00:00Z" node scripts/db/catchup-sync.js           # dry run
//   SOURCE_URI=... TARGET_URI=... SINCE="2026-09-27T02:00:00Z" node scripts/db/catchup-sync.js --apply   # write
//
// A document is picked up if its ObjectId was created after SINCE, or its
// updatedAt / createdAt is after SINCE. Deletions made during the window are NOT copied.
const mongoose = require("mongoose");

const { SOURCE_URI, TARGET_URI, SINCE } = process.env;
const APPLY = process.argv.includes("--apply");

if (!SOURCE_URI || !TARGET_URI || !SINCE) {
  console.error("❌ Set SOURCE_URI, TARGET_URI and SINCE (ISO time, e.g. 2026-09-27T02:00:00Z)");
  process.exit(1);
}
const since = new Date(SINCE);
if (isNaN(since)) {
  console.error("❌ SINCE is not a valid date");
  process.exit(1);
}

(async () => {
  const src = await mongoose.createConnection(SOURCE_URI).asPromise();
  const dst = await mongoose.createConnection(TARGET_URI).asPromise();
  console.log(`${APPLY ? "APPLY" : "DRY RUN"} — changes on ${src.db.databaseName} since ${since.toISOString()}\n`);

  const sinceId = mongoose.Types.ObjectId.createFromTime(Math.floor(since.getTime() / 1000));
  const filter = {
    $or: [
      { _id: { $gte: sinceId } },
      { updatedAt: { $gte: since } },
      { createdAt: { $gte: since } },
    ],
  };

  const names = (await src.db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."))
    .sort();

  let total = 0;
  for (const name of names) {
    const docs = await src.db.collection(name).find(filter).toArray();
    if (!docs.length) continue;
    total += docs.length;
    console.log(`• ${name}: ${docs.length} document(s)`);
    if (APPLY) {
      await dst.db.collection(name).bulkWrite(
        docs.map((doc) => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } })),
        { ordered: false }
      );
    }
  }

  console.log(total ? `\n${APPLY ? "✅ Copied" : "Would copy"} ${total} document(s)` : "\n✅ Nothing changed since SINCE");
  if (!APPLY && total) console.log("Run again with --apply to write them.");
  await src.close();
  await dst.close();
})().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
