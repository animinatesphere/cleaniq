// Completed bookings that never got their invoice (before the worker-app fix), last N days.
// Lists them only. Add --send to email each customer their invoice now (once per booking).
//
//   cd ~/cleaniq/server && node scripts/missed-invoices.js            # list, last 30 days
//   cd ~/cleaniq/server && node scripts/missed-invoices.js 60 --send  # send for the last 60 days
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const days = Number(process.argv.find((a) => /^\d+$/.test(a)) || 30);
const send = process.argv.includes("--send");
const t = (d) => (d ? new Date(d).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "—");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq");
  const since = new Date(Date.now() - days * 86400000);
  const list = await Booking.find({
    status: "Completed",
    isShift: { $ne: true },
    "meta.invoiceSentAt": { $exists: false },
    "customer.email": { $nin: [null, ""] },
    $or: [{ jobEndTime: { $gte: since } }, { jobEndTime: null, "schedule.date": { $gte: since } }],
  }).sort({ jobEndTime: 1 });
  console.log(`\nCompleted in the last ${days} days with no invoice sent: ${list.length}`);
  for (const b of list) {
    console.log(`  ${b.bookingId}  ${b.service}  done ${t(b.jobEndTime)}  £${b.payment?.amount ?? "—"} (${b.payment?.status || "—"})  ${b.customer.email}`);
  }
  if (send && list.length) {
    const { sendCompletionInvoice } = require("../utils/bookingInvoice");
    let sent = 0;
    for (const b of list) if (await sendCompletionInvoice(b)) sent++;
    console.log(`\nInvoices sent: ${sent}/${list.length}`);
  } else if (list.length) {
    console.log("\nNothing sent. Run again with --send to email these invoices.");
  }
  console.log("");
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error("Failed:", e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
