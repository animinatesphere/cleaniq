// Read-only: compares document counts per collection between two databases.
//
//   SOURCE_URI="mongodb+srv://...atlas..." TARGET_URI="mongodb://...127.0.0.1..." \
//     node scripts/db/verify-copy.js
//
// Both URIs must include the database name (…/<dbname>?…).
const mongoose = require("mongoose");

const { SOURCE_URI, TARGET_URI } = process.env;
if (!SOURCE_URI || !TARGET_URI) {
  console.error("❌ Set SOURCE_URI and TARGET_URI");
  process.exit(1);
}

(async () => {
  const src = await mongoose.createConnection(SOURCE_URI).asPromise();
  const dst = await mongoose.createConnection(TARGET_URI).asPromise();
  console.log(`Source DB: ${src.db.databaseName}  →  Target DB: ${dst.db.databaseName}\n`);

  const names = (await src.db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."))
    .sort();

  let mismatches = 0;
  for (const name of names) {
    const a = await src.db.collection(name).countDocuments();
    const b = await dst.db.collection(name).countDocuments();
    const ok = a === b;
    if (!ok) mismatches++;
    console.log(`${ok ? "✅" : "⚠️ "} ${name.padEnd(32)} source=${a}  target=${b}`);
  }

  console.log(mismatches ? `\n⚠️  ${mismatches} collection(s) differ` : "\n✅ All collection counts match");
  await src.close();
  await dst.close();
  process.exit(mismatches ? 2 : 0);
})().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
