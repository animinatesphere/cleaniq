// Read-only: why a cleaner's automatic intro message shows a certain name.
// Shows the booking's cleaner, that cleaner's account name, their saved intro text, and the
// messages sent on the booking. Changes nothing.
//
//   cd ~/cleaniq/server && node scripts/check-intro-name.js 0534-1
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const WorkerCustomerMessage = require("../models/WorkerCustomerMessage");

const ref = String(process.argv[2] || "").trim().replace(/^#/, "");
if (!ref) {
  console.error("Usage: node scripts/check-intro-name.js 0534-1");
  process.exit(1);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const t = (d) => (d ? new Date(d).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "—");
const who = (w) => (w ? `${w.firstName} ${w.lastName} <${w.email}> (${w.workerId}, ${w.status})` : "—");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq");

  const bookings = await Booking.find({ bookingId: new RegExp(`${esc(ref)}$`, "i") }).lean();
  console.log(`\nBookings matching "${ref}": ${bookings.length}`);
  for (const b of bookings) {
    const worker = b.assignedWorker ? await Worker.findById(b.assignedWorker).lean() : null;
    console.log(`\n  ${b.bookingId}  ${b.service}  ${t(b.schedule?.date)}  status=${b.status}`);
    console.log(`  Customer: ${b.customer?.firstName || ""} ${b.customer?.lastName || ""} <${b.customer?.email || ""}>`);
    console.log(`  Assigned cleaner (account): ${who(worker)}`);
    console.log(`  Name saved on booking:      ${b.assignedWorkerName || "—"}`);
    if (worker) {
      const intro = worker.preferences?.autoIntro;
      console.log(`  Their intro message: ${intro?.enabled === false ? "OFF" : "on"} — ${intro?.text ? JSON.stringify(intro.text) : "(default, uses their first name)"}`);
    }
    const msgs = await WorkerCustomerMessage.find({ bookingId: b.bookingId }).sort({ createdAt: 1 }).lean();
    console.log(`  Messages: ${msgs.length}`);
    for (const m of msgs) {
      const sender = m.workerId ? await Worker.findById(m.workerId).lean() : null;
      console.log(`    ${t(m.createdAt)}  ${m.senderType}  name="${m.senderName || ""}"  account=${m.workerId ? who(sender) : "—"}`);
      console.log(`      "${String(m.text || "").slice(0, 120)}"`);
    }
  }

  // Any cleaner accounts called HEX, or with HEX typed into their intro message.
  const hex = await Worker.find({
    $or: [{ firstName: /hex/i }, { lastName: /hex/i }, { "preferences.autoIntro.text": /hex/i }],
  }).lean();
  console.log(`\nCleaner accounts named HEX or with HEX in their intro message: ${hex.length}`);
  for (const w of hex) {
    console.log(`  ${who(w)}  intro=${JSON.stringify(w.preferences?.autoIntro?.text || "(default)")}`);
  }
  console.log("");
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error("Check failed:", e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
