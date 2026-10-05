// Read-only check: for one customer email, list their quotes and every follow-up email
// task (sent, waiting, or stopped and why). Changes nothing.
//
//   cd ~/cleaniq/server && node scripts/check-quote-followups.js customer@example.com
require("dotenv").config();
const mongoose = require("mongoose");
const Quote = require("../models/Quote");
const ScheduledTask = require("../models/ScheduledTask");

const email = String(process.argv[2] || "").trim();
if (!email) {
  console.error("Usage: node scripts/check-quote-followups.js customer@example.com");
  process.exit(1);
}
const re = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
const when = (d) => (d ? new Date(d).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "—");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq");
  const quotes = await Quote.find({ email: re }).sort({ createdAt: 1 }).lean();
  console.log(`\nQuotes for ${email}: ${quotes.length}`);
  for (const q of quotes) {
    console.log(`  ${q.quoteRef}  status=${q.status}  sent=${when(q.createdAt)}  accepted=${when(q.acceptedAt)}  £${q.grandTotal}`);
  }
  const tasks = await ScheduledTask.find({ "payload.email": re }).sort({ runAt: 1 }).lean();
  console.log(`\nAutomated emails for ${email}: ${tasks.length}`);
  for (const t of tasks) {
    console.log(`  ${t.type.padEnd(22)} ${String(t.status).padEnd(9)} due=${when(t.runAt)}  ran=${when(t.executedAt)}  quote=${t.payload?.quoteRef || "—"}${t.error ? `  (${t.error})` : ""}`);
  }
  console.log("\nstatus: sent = emailed · cancelled = stopped (reason in brackets) · pending = still waiting · failed = error\n");
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("Check failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
