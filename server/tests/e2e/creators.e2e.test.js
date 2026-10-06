// Creator / influencer programme: admin creates creators, bookings through a creator's code are
// tagged, commission is earned once the clean is done & paid, and admin records payouts.
// Throwaway MongoDB; emails captured, not sent.
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

const Admin = require("../../models/Admin");
const Booking = require("../../models/Booking");
const Customer = require("../../models/Customer");
const Coupon = require("../../models/Coupon");
const Quote = require("../../models/Quote");
const Service = require("../../models/Service");
const creators = require("../../utils/creators");

let mongod, server, base, adminToken;
const auth = (token) => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });
const call = async (method, path, body, token) => {
  const res = await fetch(base + path, { method, headers: token ? auth(token) : { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
const settle = () => new Promise((r) => setTimeout(r, 60));
let n = 0;
const book = (email, extra = {}) => Booking.create({
  bookingId: `BK-C${++n}`,
  customer: { firstName: "Jo", lastName: "Bloggs", email },
  service: "Deep Cleaning",
  schedule: { date: new Date(Date.now() + 5 * 86400000), timeSlot: "09:00" },
  payment: { amount: 120, taxAmount: 20, status: "Pending" },
  status: "Confirmed",
  ...extra,
});
const finish = async (b) => {
  const doc = await Booking.findById(b._id);
  doc.status = "Completed";
  doc.payment.status = "Completed";
  await doc.save();
  await settle();
  return Booking.findById(b._id).lean();
};

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  adminToken = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  await Coupon.create({ code: "SUMMER10", type: "general", discountPercent: 10 });
  const app = express();
  app.use(express.json());
  app.use("/api/creators", require("../../routes/creators"));
  app.use("/api/coupons", require("../../routes/coupons"));
  app.use("/api/customer-auth", require("../../routes/customer-auth"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

let amaka;
const creatorToken = async (doc) => jwt.sign({ id: String(doc._id), email: doc.email, role: "creator" }, process.env.JWT_SECRET);

test("admin sets the programme and creates a creator; the creator is emailed their code and link", async () => {
  const s = await call("PUT", "/creators/admin/settings", { commissionPercent: 10, discountPercent: 15, discountAppliesTo: "first", countRule: "forever" }, adminToken);
  assert.equal(s.status, 200);
  assert.equal(s.data.discountPercent, 15);

  assert.equal((await call("POST", "/creators/admin", { firstName: "Amaka", lastName: "Obi", email: "amaka@creator.uk", code: "AMAKA" })).status, 401, "admin only");
  const r = await call("POST", "/creators/admin", { firstName: "Amaka", lastName: "Obi", email: "amaka@creator.uk", code: "amaka" }, adminToken);
  assert.equal(r.status, 201);
  assert.equal(r.data.code, "AMAKA");
  assert.match(r.data.link, /\?ref=AMAKA$/);
  amaka = await Customer.findById(r.data._id);
  assert.equal(amaka.role, "creator");
  await settle();
  assert.ok(emails.some((e) => e.to === "amaka@creator.uk" && /AMAKA/.test(e.html) && /Forgot password/.test(e.html)));

  // Codes are unique across creators and coupons.
  assert.equal((await call("POST", "/creators/admin", { firstName: "X", lastName: "Y", email: "x@creator.uk", code: "SUMMER10" }, adminToken)).status, 400);
  assert.equal((await call("POST", "/creators/admin", { firstName: "X", lastName: "Y", email: "x@creator.uk", code: "AMAKA" }, adminToken)).status, 400);
});

test("the code works in the coupon box: discount for a first booking, never for the creator", async () => {
  let v = await call("POST", "/coupons/validate", { code: "amaka", email: "new@cust.uk" });
  assert.equal(v.data.valid, true);
  assert.equal(v.data.discountPercent, 15);
  v = await call("POST", "/coupons/validate", { code: "AMAKA", email: "amaka@creator.uk" });
  assert.equal(v.data.valid, false);
  assert.equal((await call("POST", "/coupons/validate", { code: "NOPE1" })).status, 404);
  assert.equal((await call("POST", "/coupons/validate", { code: "SUMMER10" })).data.discountPercent, 10, "normal coupons still work");
});

test("a booking with the code is tagged; the customer is linked; commission is earned when done & paid", async () => {
  const b = await book("new@cust.uk");
  assert.equal((await Booking.findById(b._id)).creator?.id ?? null, null);

  // Someone else can't tag this booking.
  await call("POST", "/coupons/apply", { code: "AMAKA", customerEmail: "other@cust.uk", bookingId: String(b._id) });
  assert.equal((await Booking.findById(b._id)).creator?.id ?? null, null);

  await call("POST", "/coupons/apply", { code: "AMAKA", customerEmail: "new@cust.uk", bookingId: String(b._id) });
  let tagged = await Booking.findById(b._id).lean();
  assert.equal(String(tagged.creator.id), String(amaka._id));
  assert.equal(tagged.creatorCommission.status, "pending");
  assert.equal(tagged.creatorCommission.percent, 10);

  tagged = await finish(b);
  assert.equal(tagged.creatorCommission.status, "earned");
  assert.equal(tagged.creatorCommission.amount, 10, "10% of £100 before tax");

  // Discount was for the first booking only.
  assert.equal((await call("POST", "/coupons/validate", { code: "AMAKA", email: "new@cust.uk" })).data.discountPercent, 0);
});

test("the admin's 'which bookings count' rule: forever, first only, N months", async () => {
  // Forever (set above): the customer's next booking, without the code, counts too.
  let later = await book("new@cust.uk");
  assert.equal(String((await Booking.findById(later._id)).creator.id), String(amaka._id));

  // First booking only.
  await call("PUT", `/creators/admin/${amaka._id}`, { countRule: "first" }, adminToken);
  later = await book("new@cust.uk");
  assert.equal((await Booking.findById(later._id)).creator?.id ?? null, null);

  // Within 12 months: yes; after: no.
  await call("PUT", `/creators/admin/${amaka._id}`, { countRule: "months", countMonths: 12 }, adminToken);
  later = await book("new@cust.uk");
  assert.ok((await Booking.findById(later._id)).creator?.id);
  await require("../../models/CreatorCustomer").updateOne({ email: "new@cust.uk" }, { $set: { linkedAt: new Date(Date.now() - 400 * 86400000) } });
  later = await book("new@cust.uk");
  assert.equal((await Booking.findById(later._id)).creator?.id ?? null, null);
  await call("PUT", `/creators/admin/${amaka._id}`, { countRule: null }, adminToken); // back to the default
});

test("cancelled bookings earn nothing", async () => {
  const b = await book("cancel@cust.uk");
  await creators.attributeSavedBooking(b._id, { code: "AMAKA" });
  await Booking.findByIdAndUpdate(b._id, { status: "Cancelled" }, { new: true });
  await settle();
  const after = await Booking.findById(b._id).lean();
  assert.equal(after.creatorCommission.status, "cancelled");
  assert.equal(after.creatorCommission.amount, 0);
});

test("the creator's dashboard: code, link, earnings and bookings (customer first name + initial only)", async () => {
  const token = await creatorToken(amaka);
  const me = await call("GET", "/creators/me", null, token);
  assert.equal(me.status, 200);
  assert.equal(me.data.code, "AMAKA");
  assert.ok(me.data.stats.earned >= 10);
  assert.ok(me.data.bookings.length >= 2);
  assert.ok(me.data.bookings.every((b) => b.customer === "Jo B."));
  assert.equal(me.data.rules.commissionPercent, 10);

  const bank = await call("PUT", "/creators/me/bank", { accountName: "A Obi", sortCode: "12-34-56", accountNumber: "12345678" }, token);
  assert.equal(bank.status, 200);
  assert.equal((await call("PUT", "/creators/me/bank", { accountNumber: "12" }, token)).status, 400);

  // A normal customer can't open it.
  const cust = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), email: "c@x.uk", role: "customer" }, process.env.JWT_SECRET);
  assert.equal((await call("GET", "/creators/me", null, cust)).status, 403);
});

test("admin sees commissions and records a payout", async () => {
  const earned = await call("GET", "/creators/admin/commissions?status=earned", null, adminToken);
  assert.equal(earned.status, 200);
  assert.ok(earned.data.length >= 1);
  const ids = earned.data.map((b) => b._id);
  const paid = await call("POST", "/creators/admin/payouts", { bookingIds: ids, reference: "BACS 6 Oct" }, adminToken);
  assert.equal(paid.data.paid, ids.length);
  const b = await Booking.findById(ids[0]).lean();
  assert.equal(b.creatorCommission.status, "paid");
  assert.equal(b.creatorCommission.payoutRef, "BACS 6 Oct");
  // Paid commissions stay paid even if the booking is edited later.
  await Booking.findByIdAndUpdate(ids[0], { notes: "edited" }, { new: true });
  await settle();
  assert.equal((await Booking.findById(ids[0])).creatorCommission.status, "paid");

  const list = await call("GET", "/creators/admin", null, adminToken);
  const row = list.data.find((c) => c.code === "AMAKA");
  assert.ok(row.stats.paid >= 10);
});

test("instant quote with the code: discount on the quote; accepting tags the bookings", async () => {
  await Service.collection.insertOne({ name: "End of Tenancy Cleaning", region: "UK", rate: 25, type: "hourly", category: "Base" });
  const { sendInstantQuote } = require("../../utils/instantQuote");
  const r = await sendInstantQuote({ service: "End of Tenancy Cleaning", hours: 4, email: "quote@cust.uk", name: "Quinn", address: "1 High St", postcode: "M1 1AA", ref: "AMAKA" });
  const q = await Quote.findOne({ quoteRef: r.quoteRef });
  assert.equal(q.creatorCode, "AMAKA");
  assert.equal(q.discount, 15);
  assert.equal(q.subtotal, 100);
  assert.equal(q.discountAmount, 15);
  assert.equal(q.subtotalAfterDiscount, 85);

  const { generateBookingsFromQuote } = require("../../routes/quotes");
  q.serviceDate = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  await generateBookingsFromQuote(q);
  const b = await Booking.findOne({ bookingId: `Q-${q.quoteRef}-1` }).lean();
  assert.equal(String(b.creator.id), String(amaka._id));
  assert.equal(b.creatorCommission.status, "pending");
});

test("sign-up with a referral code links the customer; a wrong code is caught before the email code", async () => {
  const bad = await call("POST", "/customer-auth/register", { firstName: "Ref", lastName: "One", email: "ref1@cust.uk", password: "secret12", referralCode: "NOPE99" });
  assert.equal(bad.status, 400);
  assert.match(bad.data.message, /referral code/i);
  assert.equal(await Customer.exists({ email: "ref1@cust.uk" }), null);

  const ok = await call("POST", "/customer-auth/register", { firstName: "Ref", lastName: "One", email: "ref1@cust.uk", password: "secret12", referralCode: "amaka" });
  assert.equal(ok.status, 201);
  assert.equal((await call("GET", "/creators/my-referral", null, ok.data.token)).data.code, "AMAKA");

  // Their bookings count for the creator, even without typing the code again.
  await call("PUT", `/creators/admin/${amaka._id}`, { countRule: "forever" }, adminToken);
  const b = await book("ref1@cust.uk");
  assert.equal(String((await Booking.findById(b._id)).creator.id), String(amaka._id));

  // Sign-up with email verification carries the code through too.
  const otp = await call("POST", "/customer-auth/send-otp", { firstName: "Ref", lastName: "Two", email: "ref2@cust.uk", password: "secret12", referralCode: "AMAKA" });
  assert.equal(otp.status, 200);
  const code = emails.filter((e) => e.to === "ref2@cust.uk").at(-1).html.match(/>(\d{6})</)[1];
  const verified = await call("POST", "/customer-auth/verify-otp", { email: "ref2@cust.uk", code });
  assert.equal(verified.status, 201);
  assert.equal((await call("GET", "/creators/my-referral", null, verified.data.token)).data.code, "AMAKA");
});

test("a paused (inactive) creator's code stops working", async () => {
  await call("PUT", `/creators/admin/${amaka._id}`, { active: false }, adminToken);
  assert.equal((await call("POST", "/coupons/validate", { code: "AMAKA" })).status, 404);
  const b = await book("late@cust.uk");
  await call("POST", "/coupons/apply", { code: "AMAKA", customerEmail: "late@cust.uk", bookingId: String(b._id) });
  assert.equal((await Booking.findById(b._id)).creator?.id ?? null, null);
});
