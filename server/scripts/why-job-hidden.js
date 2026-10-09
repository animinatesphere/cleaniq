// Read-only: why a job does or doesn't show in cleaners' Jobs feed. Runs the same rules as the
// worker app's feed (status, visibility, regular cleaner, then each cleaner's services, working
// hours, travel area and pets). Changes nothing.
//
//   cd ~/cleaniq/server && node scripts/why-job-hidden.js 173845-1
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const geo = require("../utils/geo");
const om = require("../utils/offerMatching");

const ref = String(process.argv[2] || "").trim().replace(/^#/, "");
if (!ref) {
  console.error("Usage: node scripts/why-job-hidden.js 173845-1");
  process.exit(1);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const t = (d) => (d ? new Date(d).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "—");
const REASONS = {
  service: "doesn't do this service (Settings → Services)",
  pets: "doesn't take homes with pets",
  hours: "not working at that day/time (Settings → Working hours)",
  day: "not working that day (Settings → Working hours)",
  distance: "too far (Settings → Travel area)",
  area: "postcode area blocked (Settings → Travel area)",
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq");
  console.log(`\nServer code has the new service mapping: ${typeof om.serviceMatches === "function" ? "YES" : "NO — git pull + pm2 restart needed"}`);

  const b = await Booking.findOne({ bookingId: new RegExp(`${esc(ref)}$`, "i") });
  if (!b) { console.log(`No booking ending in "${ref}"`); return mongoose.disconnect(); }
  console.log(`\n${b.bookingId}`);
  console.log(`  Service:  ${b.service}`);
  console.log(`  Date:     ${t(b.schedule?.date)}  ${b.schedule?.preferredTime || b.schedule?.timeSlot || ""}`);
  console.log(`  Status:   ${b.status}   Payment: ${b.payment?.status || "—"}`);
  console.log(`  Postcode: ${om.jobPostcode(b) || "— (none found)"}   Region: ${b.region || "—"}`);

  // The feed's job-level rules.
  const blockers = [];
  if (!["Confirmed", "Authorized", "Accepted"].includes(b.status)) blockers.push(`status is "${b.status}" — only Confirmed/Authorized/Accepted jobs are offered (unpaid, or not confirmed yet)`);
  if (b.region === "NG") blockers.push("region is NG (UK cleaners don't see it)");
  if (b.hiddenFromWorkers) blockers.push("switched OFF on the Job Visibility page");
  if ((b.visibleToWorkers || []).length) blockers.push(`only visible to ${b.visibleToWorkers.length} chosen cleaner(s) (Job Visibility)`);
  if (b.assignedWorker) blockers.push(`already taken by ${b.assignedWorkerName || b.assignedWorker}`);
  if (b.schedule?.date && new Date(b.schedule.date) < new Date(Date.now() - 86400000)) blockers.push("the date has passed");
  console.log(blockers.length ? `\n  Hidden from everyone because:\n${blockers.map((x) => `   - ${x}`).join("\n")}` : "\n  Job-level rules: OK (offered to cleaners whose settings suit it)");

  // Each cleaner's settings.
  const workers = await Worker.find({ status: "Active", appAccessGranted: true, region: { $ne: "NG" } }).lean();
  const jobPoint = om.jobPostcode(b) ? await geo.pointFor(om.jobPostcode(b)) : null;
  console.log(`\n  Cleaners (${workers.length} active with app access):`);
  let can = 0;
  for (const w of workers) {
    const prefs = om.prefsOf(w);
    const homePoint = prefs.travel.home || (prefs.travel.homePostcode ? await geo.pointFor(prefs.travel.homePostcode) : null);
    const m = om.checkMatch(prefs, b, { jobPoint, homePoint });
    if (m.ok) can++;
    const services = prefs.services.length ? prefs.services.join(", ") : "all services";
    const why = m.ok ? "✅ would see it" : `❌ ${m.fails.map((f) => REASONS[f] || f).join("; ")}`;
    const dist = m.distanceMiles != null ? ` · ${m.distanceMiles} mi` : "";
    console.log(`   ${w.firstName} ${w.lastName}${dist} — ${why}\n      services: ${services}`);
  }
  console.log(`\n  ${can} of ${workers.length} cleaners' settings suit this job${blockers.length ? " (but the job itself is hidden, see above)" : ""}.\n`);
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error("Check failed:", e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
