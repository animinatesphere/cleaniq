// Read-only: what happened to one customer's bookings — each booking (date, status, payment,
// regular clean), their regular cleans, and every email sent to them, in time order.
// Changes nothing.
//
//   cd ~/cleaniq/server && node scripts/inspect-customer.js customer@example.com
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Subscription = require("../models/Subscription");
const EmailLog = require("../models/EmailLog");

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/inspect-customer.js customer@example.com");
  process.exit(1);
}
const re = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
const t = (d) => (d ? new Date(d).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "—");
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" }) : "—");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq");

  const subs = await Subscription.find({ "customer.email": re }).sort({ createdAt: 1 }).lean();
  console.log(`\nRegular cleans for ${email}: ${subs.length}`);
  for (const s of subs) {
    console.log(`  ${s.subscriptionRef}  ${s.status}  ${s.frequency}  £${s.pricePerVisit}/clean  set-up fee £${s.setupFee || 0}  source ${s.source}  start ${day(s.startDate)}  created ${t(s.createdAt)}  card ${s.stripePaymentMethodId ? "saved" : "none"}`);
  }

  const bookings = await Booking.find({ "customer.email": re }).sort({ "schedule.date": 1 }).lean();
  console.log(`\nBookings: ${bookings.length}`);
  for (const b of bookings) {
    const p = b.payment || {};
    console.log(`  ${day(b.schedule?.date)} ${b.schedule?.preferredTime || b.schedule?.timeSlot || ""}  ${b.bookingId}  status=${b.status}  payment=${p.status} £${p.amount}${p.chargeOnArrival ? " (charged 48h before)" : ""}${b.noPaymentRequired ? " [no payment needed]" : ""}  ${b.meta?.subscriptionRef ? `regular ${b.meta.subscriptionRef}` : b.meta?.recurringGroup ? `series ${b.meta.recurringGroup}` : "one-off"}  created ${t(b.createdAt)}${p.capturedAt ? `  paid ${t(p.capturedAt)}` : ""}${p.authorizedAt ? `  held ${t(p.authorizedAt)}` : ""}`);
  }

  const mails = await EmailLog.find({ to: re }).sort({ sentAt: 1 }).select("subject success sentAt").lean();
  console.log(`\nEmails to ${email}: ${mails.length}`);
  for (const m of mails) console.log(`  ${t(m.sentAt)}  ${m.success ? "sent  " : "FAILED"}  ${m.subject}`);
  console.log("");
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error("Inspect failed:", e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
