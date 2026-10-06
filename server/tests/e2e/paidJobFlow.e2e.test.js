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
const settle = () => new Promise((r) => setTimeout(r, 120));
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
  assert.equal(sub.pricePerVisit, 40);
  assert.equal(await Booking.countDocuments({ "customer.email": "jo@cust.uk", status: "Confirmed" }), 0);
  const link = stripeCalls.filter((c) => c[0] === "checkout").at(-1)[1];
  assert.equal(link.metadata.type, "subscription_first");
  assert.equal(link.payment_intent_data.setup_future_usage, "off_session");
  assert.ok(emails.some((e) => e.to === "jo@cust.uk" && /Payment Required/.test(e.subject)));

  // Customer pays the first clean → first visit confirmed and announced once; the rest stay Pending.
  intents.pi_first = { id: "pi_first", status: "succeeded", amount: 4000, customer: "cus_1", payment_method: "pm_1" };
  await subs.handleCheckoutCompleted({ metadata: link.metadata, payment_intent: "pi_first" });
  await settle();
  assert.equal((await Booking.findById(first._id)).status, "Confirmed");
  assert.deepEqual(await alertsFor(first.bookingId), { notifications: 1, emails: 1 });
  assert.ok((await feed()).includes(first.bookingId));
  const later = (await Booking.find({ "meta.subscriptionId": sub._id, _id: { $ne: first._id } }).sort({ "schedule.date": 1 }).lean());
  assert.ok(later.length >= 5);
  assert.ok(later.every((v) => v.status === "Pending"));
  assert.ok(!(await feed()).some((ref) => later.map((v) => v.bookingId).includes(ref)), "unpaid visits hidden from cleaners");
  assert.equal((await alertsFor(later[0].bookingId)).notifications, 0);

  // 48h before the next visit it's charged → confirmed, shown and announced (once).
  emails.length = 0;
  const startOf = (b) => require("../../utils/bookingDateTime").buildBookingDateTime(b.schedule.date, b.schedule.timeSlot, b.schedule.preferredTime);
  const at = new Date(startOf(later[0]).getTime() - 47 * 3600000);
  await subs.processDueCharges(at);
  await subs.processDueCharges(new Date(at.getTime() + 15 * 60000));
  await settle();
  const next = await Booking.findById(later[0]._id).lean();
  assert.equal(next.status, "Confirmed");
  assert.equal(next.payment.status, "Completed");
  assert.deepEqual(await alertsFor(next.bookingId), { notifications: 1, emails: 1 });
  assert.ok((await feed()).includes(next.bookingId));
  assert.equal((await Booking.findById(later[1]._id)).status, "Pending", "the visit after waits for its own payment");
});

test("one-off booking with a payment link: cleaners told when it's paid, once", async () => {
  emails.length = 0;
  const r = await adminBooking({ details: { address: "2 High St, M1 1AA", duration: 2, frequency: "Once", extras: [] } });
  await settle();
  const ref = r.data.bookingId;
  assert.deepEqual(await alertsFor(ref), { notifications: 0, emails: 0 });
  await confirmPaidBooking(r.data._id, { paymentIntentId: "pi_one", captured: false });
  await confirmPaidBooking(r.data._id, { paymentIntentId: "pi_one", captured: false }); // Stripe resend
  await settle();
  assert.equal((await Booking.findById(r.data._id)).status, "Confirmed");
  assert.deepEqual(await alertsFor(ref), { notifications: 1, emails: 1 });
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
