// End-to-end test of regular cleans (Wecasa-style subscriptions) with a fake Stripe:
// first visit paid at booking with the card saved, later visits booked ahead and charged when
// the cleaner arrives, failed charges, pause/resume/cancel, and the app's payment-link flow.
// Throwaway MongoDB; no real Stripe calls, no real emails.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const emails = [];
require("../../utils/emailService").sendEmail = async (m) => { emails.push(m); return true; };
const sms = require("../../utils/smsService");
for (const k of Object.keys(sms)) if (typeof sms[k] === "function") sms[k] = async () => {};

// ── Fake Stripe ────────────────────────────────────────────────────────────────
const stripeCalls = [];
const intents = {}; // id -> payment intent returned by retrieve
let nextCharge = () => ({ status: "succeeded" });
const fakeStripe = {
  customers: {
    list: async () => ({ data: [] }),
    create: async (a) => { stripeCalls.push(["customers.create", a]); return { id: "cus_1" }; },
  },
  paymentIntents: {
    retrieve: async (id) => intents[id],
    create: async (a, opts) => {
      stripeCalls.push(["paymentIntents.create", a, opts]);
      const r = nextCharge(a);
      if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code });
      return { id: `pi_visit_${stripeCalls.length}`, ...r };
    },
  },
  checkout: {
    sessions: {
      create: async (a) => { stripeCalls.push(["checkout.create", a]); return { id: "cs_1", url: `https://checkout.test/${stripeCalls.length}` }; },
    },
  },
};
const subs = require("../../utils/subscriptions");
subs.setStripeForTests(fakeStripe);

const Admin = require("../../models/Admin");
const Booking = require("../../models/Booking");
const Service = require("../../models/Service");
const Subscription = require("../../models/Subscription");
const Worker = require("../../models/Worker");

let mongod, server, base, adminToken;
const DAY = 86400000;
const inDays = (n) => { const d = new Date(Date.now() + n * DAY); d.setHours(10, 0, 0, 0); return d; };

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Service.create({ name: "Regular House Cleaning", region: "UK", rate: 20.5, type: "hourly", category: "Base" });
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  adminToken = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  const app = express();
  app.use(express.json());
  app.use("/api/customer-bookings", require("../../routes/customer-bookings"));
  app.use("/api/workers", require("../../routes/workers"));
  app.use("/api/subscriptions", require("../../routes/subscriptions"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

const call = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};
const customerToken = (email) => jwt.sign({ id: new mongoose.Types.ObjectId().toString(), email, role: "customer" }, process.env.JWT_SECRET);

const websiteBooking = (over = {}) => ({
  bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
  customer: { firstName: "Jane", lastName: "Smith", email: "jane@test.com", phone: "07700900123" },
  service: "Regular House Cleaning",
  details: { address: "1 Oak Rd, M14 5TQ", frequency: "Weekly", duration: 2, extras: [] },
  schedule: { date: inDays(3), timeSlot: "07:30", preferredTime: "07:30" },
  region: "UK",
  subscribe: true,
  subscription: { visitPrice: 41 },
  payment: { amount: 41, currency: "GBP", method: "Stripe", status: "Completed", stripePaymentIntentId: "pi_first" },
  ...over,
});
const visitsOf = (sub) => Booking.find({ "meta.subscriptionId": sub._id }).sort({ "schedule.date": 1 }).lean();

let sub;

test("website: first clean paid + card saved → active regular clean with weekly visits booked ahead", async () => {
  intents.pi_first = { id: "pi_first", status: "succeeded", amount: 4100, customer: "cus_1", payment_method: "pm_1" };
  const r = await call("POST", "/customer-bookings", websiteBooking());
  assert.equal(r.status, 201);
  assert.equal(r.data.subscription.status, "active");
  sub = await Subscription.findOne({ subscriptionRef: r.data.subscription.subscriptionRef });
  assert.equal(sub.frequency, "Weekly");
  assert.equal(sub.pricePerVisit, 41);
  assert.equal(sub.stripePaymentMethodId, "pm_1");

  const first = await Booking.findById(sub.firstBooking).lean();
  assert.equal(first.payment.status, "Completed");
  assert.equal(first.payment.chargeOnArrival, false);

  const visits = (await visitsOf(sub)).filter((v) => String(v._id) !== String(first._id));
  assert.ok(visits.length >= 7 && visits.length <= 9, `about 8 weeks ahead, got ${visits.length}`);
  const gaps = visits.map((v, i) => (i ? (new Date(v.schedule.date) - new Date(visits[i - 1].schedule.date)) / DAY : 7));
  assert.ok(gaps.every((g) => Math.round(g) === 7), "every visit is a week apart");
  for (const v of visits) {
    assert.equal(v.status, "Confirmed");
    assert.equal(v.payment.status, "Pending");
    assert.equal(v.payment.chargeOnArrival, true);
    assert.equal(v.payment.amount, 41);
    assert.equal(v.payment.stripePaymentMethodId, "pm_1");
    assert.equal(v.schedule.preferredTime, "07:30");
  }
  assert.ok(emails.some((e) => /Your regular clean is set up/.test(e.subject)));
  // Running the top-up again doesn't double-book.
  assert.equal(await subs.topUpAll(), 0);
});

test("a tampered low price can't set up cheap future charges", async () => {
  intents.pi_cheap = { id: "pi_cheap", status: "succeeded", amount: 100, customer: "cus_1", payment_method: "pm_1" };
  const r = await call("POST", "/customer-bookings", websiteBooking({
    customer: { firstName: "Tim", lastName: "T", email: "tim@test.com", phone: "07700900222" },
    subscription: { visitPrice: 1 },
    payment: { amount: 1, currency: "GBP", method: "Stripe", stripePaymentIntentId: "pi_cheap" },
  }));
  const s = await Subscription.findOne({ subscriptionRef: r.data.subscription.subscriptionRef });
  assert.equal(s.pricePerVisit, 41, "at least rate × hours (20.50 × 2)");
});

test("an unpaid first clean doesn't activate anything and admin is alerted", async () => {
  intents.pi_unpaid = { id: "pi_unpaid", status: "requires_payment_method", amount: 4100, customer: "cus_1", payment_method: null };
  const r = await call("POST", "/customer-bookings", websiteBooking({
    customer: { firstName: "Una", lastName: "P", email: "una@test.com", phone: "07700900333" },
    payment: { amount: 41, currency: "GBP", method: "Stripe", status: "Completed", stripePaymentIntentId: "pi_unpaid" },
  }));
  assert.equal(r.data.subscription.status, "pending_payment");
  assert.equal((await Booking.findById(r.data._id)).payment.status, "Processing", "client can't mark it paid");
  const s = await Subscription.findOne({ subscriptionRef: r.data.subscription.subscriptionRef });
  assert.equal((await visitsOf(s)).length, 1, "no future visits");
  assert.ok(emails.some((e) => /Regular clean setup needs checking/.test(e.subject)));
});

test("cleaner arrives → the visit is charged to the saved card, once", async () => {
  const visit = (await visitsOf(sub))[1];
  const before = stripeCalls.length;
  const r = await call("POST", `/workers/jobs/${visit._id}/arrive`);
  assert.equal(r.status, 200);
  assert.equal(r.data.visitPayment.charged, true);
  const charge = stripeCalls[before];
  assert.equal(charge[0], "paymentIntents.create");
  assert.equal(charge[1].amount, 4100);
  assert.equal(charge[1].customer, "cus_1");
  assert.equal(charge[1].payment_method, "pm_1");
  assert.equal(charge[1].off_session, true);
  assert.equal(charge[1].confirm, true);
  assert.equal(charge[2].idempotencyKey, `visit-charge-${visit._id}`);
  assert.equal((await Booking.findById(visit._id)).payment.status, "Completed");

  const again = await call("POST", `/workers/jobs/${visit._id}/arrive`);
  assert.equal(again.data.visitPayment.skipped, true);
  assert.equal(stripeCalls.length, before + 1, "not charged twice");
});

test("a failed charge: clean goes ahead, customer gets a payment link, admin is alerted; paying it fixes the card", async () => {
  const visit = (await visitsOf(sub))[2];
  nextCharge = () => ({ error: { code: "card_declined", message: "Your card was declined." } });
  emails.length = 0;
  const r = await call("POST", `/workers/jobs/${visit._id}/arrive`);
  nextCharge = () => ({ status: "succeeded" });
  assert.equal(r.status, 200, "arrival still recorded");
  assert.equal(r.data.visitPayment.failed, true);
  const b = await Booking.findById(visit._id).lean();
  assert.equal(b.status, "Arrived");
  assert.equal(b.payment.status, "Failed");
  assert.match(b.payment.failureReason, /declined/);
  assert.match(b.payment.paymentLinkUrl, /^https:\/\/checkout\.test\//);
  await new Promise((res) => setTimeout(res, 20));
  assert.ok(emails.some((e) => e.to === "jane@test.com" && /Payment needed/.test(e.subject)));
  assert.ok(emails.some((e) => /payment failed/i.test(e.subject)));

  // Customer pays the link with a new card → visit paid, future visits use the new card.
  intents.pi_link = { id: "pi_link", status: "succeeded", amount: 4100, customer: "cus_1", payment_method: "pm_2" };
  const handled = await subs.handleCheckoutCompleted({ metadata: { type: "visit_payment", bookingId: String(visit._id) }, payment_intent: "pi_link" });
  assert.equal(handled, true);
  assert.equal((await Booking.findById(visit._id)).payment.status, "Completed");
  assert.equal((await Subscription.findById(sub._id)).stripePaymentMethodId, "pm_2");
  const later = (await visitsOf(sub)).filter((v) => v.payment.status === "Pending");
  assert.ok(later.length && later.every((v) => v.payment.stripePaymentMethodId === "pm_2"));
});

test("customer can see, pause, resume and cancel only their own regular clean", async () => {
  const jane = customerToken("jane@test.com");
  const list = await call("GET", "/subscriptions/my", null, jane);
  assert.equal(list.data.length, 1);
  assert.ok(list.data[0].nextVisit);
  assert.equal(list.data[0].stripePaymentMethodId, undefined, "card details not exposed");

  assert.equal((await call("POST", `/subscriptions/my/${sub._id}/pause`, null, customerToken("tim@test.com"))).status, 404);

  const paused = await call("POST", `/subscriptions/my/${sub._id}/pause`, null, jane);
  assert.equal(paused.data.status, "paused");
  const tomorrow = new Date(); tomorrow.setHours(0, 0, 0, 0); tomorrow.setDate(tomorrow.getDate() + 1);
  const future = (await visitsOf(sub)).filter((v) => new Date(v.schedule.date) >= tomorrow && v.status !== "Cancelled" && v.payment.status !== "Completed");
  assert.equal(future.length, 0, "no unpaid future visits while paused (paid ones are kept)");
  assert.ok((await visitsOf(sub)).filter((v) => v.status === "Cancelled").every((v) => !v.payment.chargeOnArrival), "cancelled visits can't be charged");
  assert.equal(await subs.topUpAll(), 0, "paused subscriptions aren't topped up");

  const resumed = await call("POST", `/subscriptions/my/${sub._id}/resume`, null, jane);
  assert.equal(resumed.data.status, "active");
  const active = (await visitsOf(sub)).filter((v) => v.status === "Confirmed" && v.payment.status === "Pending");
  assert.ok(active.length >= 5);
  const weekday = new Date(sub.startDate).getDay();
  assert.ok(active.every((v) => new Date(v.schedule.date).getDay() === weekday), "same weekday as before");

  const cancelled = await call("POST", `/subscriptions/my/${sub._id}/cancel`, null, jane);
  assert.equal(cancelled.data.status, "cancelled");
  assert.equal((await visitsOf(sub)).filter((v) => v.status === "Confirmed" && v.payment.status === "Pending").length, 0);
});

test("admin lists regular cleans (login required)", async () => {
  assert.equal((await call("GET", "/subscriptions")).status, 401);
  const r = await call("GET", "/subscriptions?status=cancelled", null, adminToken);
  assert.equal(r.status, 200);
  assert.ok(r.data.some((s) => String(s._id) === String(sub._id)));
});

test("app: regular clean gets a payment link that saves the card; paying it activates the subscription", async () => {
  const r = await call("POST", "/customer-bookings", websiteBooking({
    customer: { firstName: "Ann", lastName: "App", email: "ann@test.com", phone: "07700900444" },
    details: { address: "2 Elm St", frequency: "Fortnightly", duration: 3, extras: [] },
    payment: { amount: 61.5, currency: "GBP", method: "Invoice", status: "Pending" },
    status: "Awaiting Payment",
  }));
  assert.equal(r.status, 201);
  assert.equal(r.data.subscription.status, "pending_payment");
  assert.match(r.data.checkoutUrl, /^https:\/\/checkout\.test\//);
  const checkout = stripeCalls.filter((c) => c[0] === "checkout.create").at(-1)[1];
  assert.equal(checkout.payment_intent_data.setup_future_usage, "off_session");
  assert.equal(checkout.payment_intent_data.capture_method, undefined, "charged now, not held");
  assert.equal(checkout.metadata.type, "subscription_first");

  const appSub = await Subscription.findOne({ subscriptionRef: r.data.subscription.subscriptionRef });
  intents.pi_app = { id: "pi_app", status: "succeeded", amount: 6150, customer: "cus_1", payment_method: "pm_3" };
  await subs.handleCheckoutCompleted({ metadata: checkout.metadata, payment_intent: "pi_app" });
  const activeSub = await Subscription.findById(appSub._id);
  assert.equal(activeSub.status, "active");
  const visits = await visitsOf(activeSub);
  assert.equal((await Booking.findById(activeSub.firstBooking)).status, "Confirmed");
  assert.ok(visits.length >= 4);
  const second = visits[1];
  assert.equal(Math.round((new Date(second.schedule.date) - new Date(visits[0].schedule.date)) / DAY), 14, "fortnightly");
});

test("one-off bookings are unchanged (no subscription, no saved-card charges)", async () => {
  const r = await call("POST", "/customer-bookings", websiteBooking({
    customer: { firstName: "Olly", lastName: "Once", email: "olly@test.com", phone: "07700900555" },
    details: { address: "3 Ash Rd", frequency: "Once", duration: 2, extras: [] },
    subscribe: false,
    payment: { amount: 41, currency: "GBP", method: "Stripe", status: "Authorized", stripePaymentIntentId: "pi_oneoff" },
  }));
  assert.equal(r.data.subscription, undefined);
  const b = await Booking.findById(r.data._id).lean();
  assert.equal(b.payment.status, "Authorized");
  assert.ok(!b.payment.chargeOnArrival);
});

test("late-notice fees on pause/cancel: 24h+ free, 2–24h £10, under 2h 80%; admin actions free", async () => {
  // A regular clean whose NEXT visit starts at a chosen time from "now".
  const makeSub = async (email) => {
    intents[`pi_${email}`] = { id: `pi_${email}`, status: "succeeded", amount: 4100, customer: "cus_1", payment_method: "pm_9" };
    const r = await call("POST", "/customer-bookings", websiteBooking({
      customer: { firstName: "Fee", lastName: "Test", email, phone: "07700900666" },
      payment: { amount: 41, currency: "GBP", method: "Stripe", stripePaymentIntentId: `pi_${email}` },
    }));
    const s = await Subscription.findOne({ subscriptionRef: r.data.subscription.subscriptionRef });
    const next = (await visitsOf(s)).find((v) => v.payment.status === "Pending");
    return { s, next };
  };
  const startOf = (b) => require("../../utils/bookingDateTime").buildBookingDateTime(b.schedule.date, b.schedule.timeSlot, b.schedule.preferredTime);
  const nowBefore = (b, hours) => new Date(startOf(b).getTime() - hours * 3600000);

  const a = await makeSub("fee-a@test.com");
  assert.equal((await subs.cancellationQuote(a.s, nowBefore(a.next, 30))).fee, 0);
  assert.equal((await subs.cancellationQuote(a.s, nowBefore(a.next, 10))).fee, 10);
  assert.equal((await subs.cancellationQuote(a.s, nowBefore(a.next, 5))).fee, 10);
  assert.equal((await subs.cancellationQuote(a.s, nowBefore(a.next, 1))).fee, 32.8, "80% of £41");

  // Customer pauses with 5h notice: £10 charged to the saved card, that visit cancelled.
  const before = stripeCalls.length;
  const paused = await subs.pauseSubscription(a.s, "customer", { now: nowBefore(a.next, 5), chargeFee: true });
  assert.equal(paused.fee.amount, 10);
  assert.equal(paused.fee.status, "Paid");
  const feeCall = stripeCalls[before];
  assert.equal(feeCall[1].amount, 1000);
  assert.equal(feeCall[1].payment_method, "pm_9");
  assert.equal(feeCall[1].metadata.type, "cancellation_fee");
  assert.equal(feeCall[2].idempotencyKey, `cancel-fee-${a.next._id}`);
  const nextAfter = await Booking.findById(a.next._id).lean();
  assert.equal(nextAfter.status, "Cancelled", "the clean in 5 hours is cancelled too");
  assert.equal(nextAfter.meta.cancellationFee.amount, 10);

  // Cancelling while paused: no upcoming visits, no fee.
  const c1 = await subs.cancelSubscription(paused.sub, "customer", { chargeFee: true });
  assert.equal(c1.fee, null);

  // Admin cancels with 1h notice: free.
  const b = await makeSub("fee-b@test.com");
  const n = stripeCalls.length;
  const adminCancel = await subs.cancelSubscription(b.s, "staff1", { now: nowBefore(b.next, 1) });
  assert.equal(adminCancel.fee, null);
  assert.equal(stripeCalls.length, n, "no charge for admin cancellations");

  // Fee can't be charged (card declined): cancellation still happens, admin alerted.
  const c = await makeSub("fee-c@test.com");
  nextCharge = () => ({ error: { code: "card_declined", message: "Your card was declined." } });
  emails.length = 0;
  const declined = await subs.cancelSubscription(c.s, "customer", { now: nowBefore(c.next, 3), chargeFee: true });
  nextCharge = () => ({ status: "succeeded" });
  assert.equal(declined.sub.status, "cancelled");
  assert.equal(declined.fee.status, "Failed");
  await new Promise((res) => setTimeout(res, 20));
  assert.ok(emails.some((e) => /Cancellation fee not collected/.test(e.subject)));
});

test("customer sees the fee before confirming", async () => {
  intents.pi_prev = { id: "pi_prev", status: "succeeded", amount: 4100, customer: "cus_1", payment_method: "pm_1" };
  const r = await call("POST", "/customer-bookings", websiteBooking({
    customer: { firstName: "Pre", lastName: "View", email: "preview@test.com", phone: "07700900777" },
    payment: { amount: 41, currency: "GBP", method: "Stripe", stripePaymentIntentId: "pi_prev" },
  }));
  const s = await Subscription.findOne({ subscriptionRef: r.data.subscription.subscriptionRef });
  const q = await call("GET", `/subscriptions/my/${s._id}/cancellation-fee`, null, customerToken("preview@test.com"));
  assert.equal(q.status, 200);
  assert.equal(q.data.fee, 0, "next unpaid visit is over a week away");
  assert.ok(q.data.nextVisitStart);
});
