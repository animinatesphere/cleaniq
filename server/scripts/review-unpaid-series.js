// Read-only report: booking series made BEFORE the "pay before it's confirmed" fix, whose future
// visits were created as Confirmed + "no payment needed" although the first booking needed paying.
// Lists them so admin can decide (send payment links, or cancel and re-book as a regular clean).
// Changes nothing.
//
//   cd ~/cleaniq/server && node scripts/review-unpaid-series.js
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq");
  const groups = await Booking.aggregate([
    { $match: { "meta.recurringGroup": { $exists: true, $ne: null }, status: { $nin: ["Cancelled"] } } },
    { $sort: { "schedule.date": 1 } },
    { $group: {
      _id: "$meta.recurringGroup",
      first: { $first: "$$ROOT" },
      future: { $push: { $cond: [{ $and: [{ $gt: ["$schedule.date", new Date()] }, { $eq: ["$noPaymentRequired", true] }, { $eq: ["$status", "Confirmed"] }] }, { ref: "$bookingId", date: "$schedule.date", amount: "$payment.amount" }, "$$REMOVE"] } },
    } },
  ]);
  const flagged = groups.filter((g) => !g.first.noPaymentRequired && g.future.length);
  console.log(`\n${flagged.length} series with unpaid visits marked Confirmed:\n`);
  for (const g of flagged) {
    const c = g.first.customer || {};
    console.log(`${g._id}  ${c.firstName || ""} ${c.lastName || ""} <${c.email || ""}>  ${g.first.service}  first: ${g.first.bookingId} (${g.first.status}, payment ${g.first.payment?.status})`);
    for (const v of g.future) console.log(`   ${v.ref}  ${new Date(v.date).toLocaleDateString("en-GB")}  £${v.amount}`);
  }
  console.log("\nThese visits show to cleaners as paid jobs. Either send each a payment link, or cancel the series and re-create it as a weekly booking with a payment link (it then becomes a regular clean).\n");
  await mongoose.disconnect();
})().catch(async (e) => { console.error("Report failed:", e.message); await mongoose.disconnect().catch(() => {}); process.exit(1); });
