// Jobs only go to cleaners once they're paid. A weekly booking admin creates with a payment link
// is a regular clean: every visit stays Pending (not shown, no alerts) until it's paid, then it's
// Confirmed and cleaners are told — once. Throwaway MongoDB, fake Stripe, emails captured.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
require("../../utils/geo").setGeoFetcherForTests(async (url, body) => (body ? { result: [] } : { result: null }));
const emails = [];
require("../../utils/emailService").sendEmail = async (m) => { emails.push(m); return true; };
const sms = require("../../utils/smsService");
for (const k of Object.keys(sms)) if (typeof sms[k] === "function") sms[k] = async () => {};

const stripeCalls = [];
const intents = {};
const subs = require("../../utils/subscriptions");
subs.setStripeForTests({
  customers: { list: async () => ({ data: [] }), create: async () => ({ id: "cus_1" }) },
  paymentIntents: {
    retrieve: async (id) => intents[id],
    create: async (a, opts) => { stripeCalls.push(["pi", a, opts]); return { id: `pi_${stripeCalls.length}`, status: "succeeded" }; },
  },
  checkout: { sessions: {
    create: async (a) => { stripeCalls.push(["checkout", a]); return { id: `cs_${stripeCalls.length}`, url: `https://checkout.test/${stripeCalls.length}` }; },
    expire: async () => ({}),
  } },
  refunds: { create: async () => ({ id: "re_1" }) },
});

const Admin = require("../../models/Admin");
const Booking = require("../../models/Booking");
const Notification = require("../../models/Notification");
const Service = require("../../models/Service");
const Subscription = require("../../models/Subscription");
const Worker = require("../../models/Worker");
const { confirmPaidBooking } = require("../../utils/bookingPayments");

let mongod, server, base, adminToken, worker;
const settle = () => new Promise((r) => setTimeout(r, 400));
// Alerts are sent in the background: wait (up to 5s) until they match, then compare.
async function alertsBecome(ref, expected) {
  let got;
  for (let i = 0; i < 50; i++) {
    got = await alertsFor(ref);
    if (got.notifications === expected.notifications && got.emails === expected.emails) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.deepEqual(got, expected);
}
const alertsFor = async (ref) => ({
  notifications: await Notification.countDocuments({ workerId: worker, title: "New Job Available!", bookingId: ref }),
  // Worker alert emails sent since the test cleared the list (each test checks one job at a time).
  emails: emails.filter((e) => e.to === "kelvin@worker.uk" && /New Job Alert/.test(e.subject)).length,
});
const feed = async () => (await (await fetch(`${base}/workers/jobs?workerId=${worker}`)).json()).map((j) => j.bookingId);
const inDays = (n) => { const d = new Date(Date.now() + n * 86400000); d.setHours(10, 0, 0, 0); return d; };

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Service.create({ name: "Regular House Cleaning", region: "UK", rate: 20, type: "hourly", category: "Base", weeklyRate: 20, fortnightlyRate: 20 });
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  adminToken = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  worker = (await Worker.collection.insertOne({ firstName: "Kelvin", lastName: "Obi", workerId: "W-1", region: "UK", email: "kelvin@worker.uk", status: "Active", appAccessGranted: true })).insertedId;
  const app = express();
  app.use(express.json());
  app.use("/api/bookings", require("../../routes/bookings"));
  app.use("/api/workers", require("../../routes/workers"));
  app.use("/api/customer-bookings", require("../../routes/customer-bookings"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

const adminBooking = (over = {}) => fetch(`${base}/bookings`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({
    bookingId: `BK-${Math.floor(10000 + Math.random() * 89999)}`,
    customer: { firstName: "Jo", lastName: "Bloggs", email: "jo@cust.uk", phone: "07700900000" },
    service: "Regular House Cleaning",
    details: { address: "1 High St, M1 1AA", duration: 2, frequency: "Weekly", extras: [] },
    schedule: { date: inDays(4), timeSlot: "10:00", preferredTime: "10:00" },
    payment: { amount: 40, currency: "GBP", status: "Pending", billingType: "hourly" },
    status: "Pending",
    region: "UK",
    ...over,
  }),
}).then(async (r) => ({ status: r.status, data: await r.json() }));

test("admin weekly booking with a payment link: nothing is confirmed or sent to cleaners until paid", async () => {
  emails.length = 0;
  await subs.saveSetupFee({ enabled: true, amount: 4, per: "hour", label: "Sign-up fee" }); // £4 per hour
  const r = await adminBooking();
  assert.equal(r.status, 201);
  await settle();
  const first = await Booking.findById(r.data._id).lean();
  assert.equal(first.status, "Pending");
  assert.deepEqual(await alertsFor(first.bookingId), { notifications: 0, emails: 0 }, "no 'new job' alert while unpaid");
  assert.ok(!(await feed()).includes(first.bookingId), "not in the worker app");

  // It's a regular clean: one payment link that saves the card (no 12 free 'Confirmed' visits).
  const sub = await Subscription.findOne({ firstBooking: first._id });
  assert.ok(sub, "set up as a regular clean");
  assert.equal(sub.source, "Admin");
  assert.equal(sub.pricePerVisit, 40, "following cleans: normal price");
  assert.equal(sub.setupFee, 8, "£4/hour × 2 hours");
  assert.equal(first.payment.amount, 48, "first payment = clean + sign-up fee");

  // All the weekly visits show straight away, Pending, and can't be charged before the card is saved.
  const ahead = await Booking.find({ "meta.subscriptionId": sub._id, _id: { $ne: first._id } }).lean();
  assert.ok(ahead.length >= 5, `visits booked ahead: ${ahead.length}`);
  assert.ok(ahead.every((v) => v.status === "Pending" && v.payment.amount === 40 && !v.payment.chargeOnArrival));
  assert.ok(!(await feed()).some((ref) => ahead.map((v) => v.bookingId).includes(ref)));
  assert.equal((await subs.processDueCharges(new Date(Date.now() + 5 * 86400000))).charged, 0, "nothing charged before the first payment");
  assert.equal(await Booking.countDocuments({ "customer.email": "jo@cust.uk", status: "Confirmed" }), 0);
  const link = stripeCalls.filter((c) => c[0] === "checkout").at(-1)[1];
  assert.equal(link.metadata.type, "subscription_first");
  assert.equal(link.line_items[0].price_data.unit_amount, 4800);
  assert.equal(link.payment_intent_data.setup_future_usage, "off_session");
  // The customer gets the full summary: dates, price, set-up fee, first payment, Pay button.
  const summary = emails.find((e) => e.to === "jo@cust.uk" && /regular clean — summary/.test(e.subject));
  assert.ok(summary, "summary email sent");
  assert.match(summary.html, /Your upcoming cleans/);
  assert.match(summary.html, /first clean/);
  assert.match(summary.html, /Set-up fee/);
  assert.match(summary.html, /Pay £48\.00 to confirm/);
  assert.match(summary.html, /checkout\.test/);

  // Customer pays the first clean → first visit confirmed and announced once; the rest stay Pending.
  intents.pi_first = { id: "pi_first", status: "succeeded", amount: 4800, customer: "cus_1", payment_method: "pm_1" };
  await subs.handleCheckoutCompleted({ metadata: link.metadata, payment_intent: "pi_first" });
  await settle();
  assert.equal((await Booking.findById(first._id)).status, "Confirmed");
  await alertsBecome(first.bookingId, { notifications: 1, emails: 1 });
  assert.ok((await feed()).includes(first.bookingId));
  const later = (await Booking.find({ "meta.subscriptionId": sub._id, _id: { $ne: first._id } }).sort({ "schedule.date": 1 }).lean());
  assert.ok(later.length >= 5);
  assert.ok(later.every((v) => v.status === "Pending"));
  assert.ok(later.every((v) => v.payment.chargeOnArrival && v.payment.stripePaymentMethodId === "pm_1"), "now chargeable 48h before");
  assert.equal(later.length, new Set(later.map((v) => String(v.schedule.date))).size, "no visit booked twice");

  // The Regular Cleans pages list each visit with what's paid and what's next.
  const visits = await subs.visitsFor(await Subscription.findById(sub._id));
  assert.equal(visits[0].first, true);
  assert.equal(visits[0].state, "confirmed");
  assert.equal(visits[0].setupFee, 8);
  assert.ok(visits.slice(1).every((v) => v.state === "charged_before"));
  assert.ok(!(await feed()).some((ref) => later.map((v) => v.bookingId).includes(ref)), "unpaid visits hidden from cleaners");
  assert.equal((await alertsFor(later[0].bookingId)).notifications, 0);

  // 48h before the next visit it's charged → confirmed, shown and announced (once).
  await settle();
  emails.length = 0;
  const startOf = (b) => require("../../utils/bookingDateTime").buildBookingDateTime(b.schedule.date, b.schedule.timeSlot, b.schedule.preferredTime);
  const at = new Date(startOf(later[0]).getTime() - 23 * 3600000);
  await subs.processDueCharges(at);
  await subs.processDueCharges(new Date(at.getTime() + 15 * 60000));
  await settle();
  const next = await Booking.findById(later[0]._id).lean();
  assert.equal(next.status, "Confirmed");
  assert.equal(next.payment.status, "Completed");
  await alertsBecome(next.bookingId, { notifications: 1, emails: 1 });
  assert.ok((await feed()).includes(next.bookingId));
  assert.equal((await Booking.findById(later[1]._id)).status, "Pending", "the visit after waits for its own payment");
  await subs.saveSetupFee({ enabled: false, amount: 4 });
});

test("one-off booking with a payment link: cleaners told when it's paid, once", async () => {
  await settle();
  emails.length = 0;
  const r = await adminBooking({ details: { address: "2 High St, M1 1AA", duration: 2, frequency: "Once", extras: [] } });
  await settle();
  const ref = r.data.bookingId;
  assert.deepEqual(await alertsFor(ref), { notifications: 0, emails: 0 });
  await confirmPaidBooking(r.data._id, { paymentIntentId: "pi_one", captured: false });
  await confirmPaidBooking(r.data._id, { paymentIntentId: "pi_one", captured: false }); // Stripe resend
  await settle();
  assert.equal((await Booking.findById(r.data._id)).status, "Confirmed");
  await alertsBecome(ref, { notifications: 1, emails: 1 });
});

test("admin confirming by hand also tells cleaners once", async () => {
  const r = await adminBooking({ details: { address: "3 High St, M1 1AA", duration: 2, frequency: "Once", extras: [] } });
  const put = (body) => fetch(`${base}/bookings/${r.data._id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(body) });
  await put({ status: "Confirmed" });
  await put({ status: "Pending" });
  await put({ status: "Confirmed" });
  await settle();
  assert.equal((await alertsFor(r.data.bookingId)).notifications, 1);
});

test("weekly booking marked 'already paid / no payment needed': visits confirmed, as before", async () => {
  const r = await adminBooking({
    customer: { firstName: "Paid", lastName: "Up", email: "paid@cust.uk", phone: "07700900001" },
    noPaymentRequired: true, status: "Confirmed",
  });
  await settle();
  assert.equal(await Subscription.countDocuments({ firstBooking: r.data._id }), 0);
  const series = await Booking.find({ "customer.email": "paid@cust.uk" }).lean();
  assert.ok(series.length > 1);
  assert.ok(series.every((b) => b.status === "Confirmed" && b.noPaymentRequired));
  assert.equal((await alertsFor(r.data.bookingId)).notifications, 1);
});

test("customer can cancel a job a cleaner has accepted; the cleaner is told", async () => {
  const b = await Booking.create({
    bookingId: "BK-ASSIGNED", customer: { firstName: "Ann", lastName: "C", email: "ann@cust.uk" }, service: "Deep Cleaning",
    schedule: { date: inDays(6), timeSlot: "10:00" }, payment: { amount: 80, status: "Pending" },
    status: "Assigned", assignedWorker: worker, assignedWorkerName: "Kelvin Obi",
  });
  const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), email: "ann@cust.uk", role: "customer" }, process.env.JWT_SECRET);
  const r = await fetch(`${base}/customer-bookings/${b._id}/cancel`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.equal((await Booking.findById(b._id)).status, "Cancelled");
  assert.ok(await Notification.exists({ workerId: worker, title: "Job cancelled", bookingId: "BK-ASSIGNED" }));
});
