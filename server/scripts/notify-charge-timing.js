// One-off: tell customers with an active or paused regular clean that later cleans are now
// charged 48 hours before the clean (they signed up when it was "on the day"). Each customer is
// emailed once; running it again skips anyone already told.
//
//   cd ~/cleaniq/server && node scripts/notify-charge-timing.js          # list who would be emailed
//   cd ~/cleaniq/server && node scripts/notify-charge-timing.js --send   # send the emails
require("dotenv").config();
const mongoose = require("mongoose");
const Subscription = require("../models/Subscription");
const { sendEmail } = require("../utils/emailService");

const SEND = process.argv.includes("--send");
const NOTICE = "chargeTiming48h";

const html = (sub) => `<div style="font-family:sans-serif;max-width:560px">
  <h2 style="color:#0F6B4C">A small change to how your regular clean is paid</h2>
  <p>Hi ${sub.customer?.firstName || "there"},</p>
  <p>From now on, each clean in your regular ${sub.service} (${sub.subscriptionRef}) will be charged to your saved card
  <strong>48 hours before the clean</strong>, instead of on the day. The price doesn't change: £${Number(sub.pricePerVisit).toFixed(2)} per clean.</p>
  <ul>
    <li>We'll send you a receipt each time.</li>
    <li>If a payment doesn't go through, we'll email you a link to pay and try again 24 hours before. If it's still unpaid 12 hours before, that clean is cancelled and your regular clean carries on.</li>
    <li>Cancel or pause with 24 hours' notice or more and any clean already paid is refunded in full.</li>
  </ul>
  <p>Questions? Call or WhatsApp +44 7846 726428.</p>
  <p style="color:#64748b">Cleaniq Services</p></div>`;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq");
  const subs = await Subscription.find({ status: { $in: ["active", "paused"] }, [`notices.${NOTICE}`]: { $exists: false } });
  console.log(`${subs.length} regular clean(s) to tell${SEND ? "" : " (dry run: add --send to email them)"}:`);
  let sent = 0;
  for (const sub of subs) {
    const email = sub.customer?.email;
    console.log(`  ${sub.subscriptionRef}  ${sub.status.padEnd(6)}  ${email || "(no email)"}`);
    if (!SEND || !email) continue;
    const ok = await sendEmail({ to: email, subject: "Your regular clean: payment now taken 48 hours before each clean", html: html(sub) });
    if (ok) {
      await Subscription.collection.updateOne({ _id: sub._id }, { $set: { [`notices.${NOTICE}`]: new Date() } });
      sent++;
    }
  }
  if (SEND) console.log(`Sent ${sent} of ${subs.length}.`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("Notice failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
