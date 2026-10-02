// Cleaner numbers worked out from records: jobs done, star rating from customers, earnings
// (earned / on hold / withdrawn / available), and the admin's top-rated pay bonus.
// Throwaway MongoDB.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
require("../../utils/geo").setGeoFetcherForTests(async (url, body) => (body ? { result: [] } : { result: null }));
require("../../utils/emailService").sendEmail = async () => true;
const sms = require("../../utils/smsService");
for (const k of Object.keys(sms)) if (typeof sms[k] === "function") sms[k] = async () => {};

const Admin = require("../../models/Admin");
const Booking = require("../../models/Booking");
const Service = require("../../models/Service");
const SystemSetting = require("../../models/SystemSetting");
const Withdrawal = require("../../models/Withdrawal");
const Worker = require("../../models/Worker");

let mongod, server, base, adminToken, worker, other;
let n = 0;
const booking = (over = {}) => Booking.create({
  bookingId: `BK-ST${++n}`, service: "Regular House Cleaning", status: "Completed", region: "UK",
  customer: { firstName: "Ann", lastName: "Skinner", email: "ann@test.com" },
  details: { postcode: "BL0 0HL", duration: 3 }, schedule: { date: new Date() },
  workerRate: 13, assignedWorker: worker._id, assignedWorkerName: "Kelvin Obi",
  ...over,
});
const payout = (amount, status) => Withdrawal.create({
  workerId: worker._id, workerName: "Kelvin Obi", amount, status,
  bankDetails: { accountName: "K Obi", accountNumber: "12345678", sortCode: "00-00-00" },
  expectedPayoutDate: new Date(Date.now() + 8 * 86400000),
});
const customerToken = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), email: "ann@test.com", firstName: "Ann", lastName: "Skinner" }, require("../../routes/customer-auth").JWT_SECRET);

const call = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Service.create({ name: "Regular House Cleaning", region: "UK", rate: 20.9, type: "hourly", category: "Base", workerHourlyRate: 13 });
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  adminToken = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  worker = await Worker.create({ workerId: "W-1", firstName: "Kelvin", lastName: "Obi", email: "k@test.com", phone: "1", region: "UK", status: "Active", postcode: "BL0 0HL", jobsCompleted: 0, rating: 5 });
  other = await Worker.create({ workerId: "W-2", firstName: "Mary", lastName: "Ade", email: "m@test.com", phone: "2", region: "UK", status: "Active", postcode: "BL0 0HL" });
  const app = express();
  app.use(express.json());
  app.use("/api/workers", require("../../routes/workers"));
  app.use("/api/payments", require("../../routes/payments"));
  app.use("/api/customer-bookings", require("../../routes/customer-bookings"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

test("a new cleaner: no jobs, no rating yet (not a made-up 5.0), £0 everywhere", async () => {
  const s = (await call("GET", `/workers/${worker._id}/stats`)).data;
  assert.equal(s.jobsDone, 0);
  assert.equal(s.rating, null);
  assert.equal(s.ratingCount, 0);
  assert.equal(s.totalEarned, 0);
  assert.equal(s.balance, 0);
});

test("jobs done and earnings come from completed bookings and payout records", async () => {
  await booking();                                               // 3h × £13 = £39
  await booking({ details: { postcode: "BL0 0HL", duration: 2.5 } }); // 2.5h × £13 = £32.50
  await booking({ status: "Completed - Unpaid" });                // £39 — the clean was done
  await booking({ status: "Assigned" });                          // not done yet: doesn't count
  await booking({ status: "Cancelled" });
  await booking({ assignedWorker: other._id });                   // someone else's

  await payout(39, "completed"); // paid
  await payout(32.5, "upcoming"); // waiting for payday
  await payout(10, "failed");     // failed → money is available again

  const s = (await call("GET", `/workers/${worker._id}/stats`)).data;
  assert.equal(s.jobsDone, 3);
  assert.equal(s.totalEarned, 110.5);
  assert.equal(s.withdrawn, 39);
  assert.equal(s.onHold, 32.5);
  assert.equal(s.balance, 39);
  assert.equal(s.nextPayout.amount, 32.5);

  // The wallet the app's earnings card reads gives the same figures, and fixes the stored copy.
  await Worker.updateOne({ _id: worker._id }, { wallet: { totalEarned: 0, balance: 0, onHold: 999, withdrawn: 0 } });
  const w = (await call("GET", `/payments/wallet/${worker._id}`)).data;
  assert.deepEqual([w.totalEarned, w.onHold, w.withdrawn, w.balance], [110.5, 32.5, 39, 39]);
  assert.equal((await Worker.findById(worker._id)).wallet.onHold, 32.5);
  assert.equal((await Worker.findById(worker._id)).jobsCompleted, 3);
});

test("customers rate their cleaner after the clean; the rating is the real average", async () => {
  const done = await Booking.find({ assignedWorker: worker._id, status: { $in: ["Completed", "Completed - Unpaid"] } });
  const upcoming = await Booking.findOne({ assignedWorker: worker._id, status: "Assigned" });

  // Not finished yet → can't rate. Wrong customer → refused. Bad stars → refused.
  assert.equal((await call("POST", `/customer-bookings/${upcoming._id}/rate`, { stars: 5 }, customerToken)).status, 400);
  const stranger = jwt.sign({ id: "x", email: "bob@test.com" }, require("../../routes/customer-auth").JWT_SECRET);
  assert.equal((await call("POST", `/customer-bookings/${done[0]._id}/rate`, { stars: 5 }, stranger)).status, 403);
  assert.equal((await call("POST", `/customer-bookings/${done[0]._id}/rate`, { stars: 7 }, customerToken)).status, 400);

  await call("POST", `/customer-bookings/${done[0]._id}/rate`, { stars: 5, comment: "Spotless" }, customerToken);
  await call("POST", `/customer-bookings/${done[1]._id}/rate`, { stars: 4 }, customerToken);
  const r = await call("POST", `/customer-bookings/${done[2]._id}/rate`, { stars: 5 }, customerToken);
  assert.equal(r.status, 200);
  assert.equal(r.data.workerRating, 4.7); // (5 + 4 + 5) / 3 = 4.67

  // Changing a rating updates the average rather than adding another.
  await call("POST", `/customer-bookings/${done[1]._id}/rate`, { stars: 5 }, customerToken);
  const s = (await call("GET", `/workers/${worker._id}/stats`)).data;
  assert.equal(s.rating, 5);
  assert.equal(s.ratingCount, 3);
  assert.equal(s.ratingBreakdown[5], 3);
  assert.equal((await Worker.findById(worker._id)).rating, 5);
});

test("top-rated bonus: admin sets extra £/hr; only cleaners with enough high ratings get it", async () => {
  await SystemSetting.create({ key: "topRatedBonus", value: { amount: 2, minRating: 4.8, minRatings: 3 } });
  const open = () => Booking.create({
    bookingId: `BK-OPEN${++n}`, service: "Regular House Cleaning", status: "Confirmed", region: "UK",
    customer: { firstName: "Tom", lastName: "Price", email: "tom@test.com" },
    details: { postcode: "BL0 0HL", duration: 3 }, schedule: { date: new Date(Date.now() + 3 * 86400000), timeSlot: "10:00" },
    workerRate: 13,
  });

  // Kelvin: 5.0 from 3 ratings → qualifies. The offer shows £15/h before he accepts.
  const job = await open();
  const offer = (await call("GET", `/workers/jobs/${job._id}?workerId=${worker._id}`)).data.offer;
  assert.equal(offer.pay.firstRate, 15);
  assert.equal(offer.pay.bonus, 2);
  assert.equal((await call("POST", `/workers/jobs/${job._id}/accept`, { workerId: String(worker._id), workerName: "Kelvin Obi" })).status, 200);
  let saved = await Booking.findById(job._id);
  assert.equal(saved.workerRate, 15);
  assert.equal(saved.workerRateBonus, 2);

  // He hands it back: the job returns to its base rate for whoever takes it next.
  await call("POST", `/workers/jobs/${job._id}/cancel`, { workerId: String(worker._id) });
  saved = await Booking.findById(job._id);
  assert.equal(saved.workerRate, 13);
  assert.equal(saved.workerRateBonus, 0);

  // Mary has no ratings → no bonus.
  await call("POST", `/workers/jobs/${job._id}/accept`, { workerId: String(other._id), workerName: "Mary Ade" });
  assert.equal((await Booking.findById(job._id)).workerRate, 13);

  // Admin assigning Kelvin adds his bonus; a rate admin types in is used as-is.
  const job2 = await open();
  await call("PUT", `/workers/jobs/${job2._id}/assign`, { workerId: String(worker._id) });
  assert.equal((await Booking.findById(job2._id)).workerRate, 15);
  const job3 = await open();
  await call("PUT", `/workers/jobs/${job3._id}/assign`, { workerId: String(worker._id), workerRate: 14 });
  assert.equal((await Booking.findById(job3._id)).workerRate, 14);

  // Admin overview lists who qualifies.
  const list = (await call("GET", "/workers/ratings", null, adminToken)).data;
  assert.equal(list.settings.amount, 2);
  assert.deepEqual(list.workers.map((w) => [w.name, w.qualifies]), [["Kelvin Obi", true], ["Mary Ade", false]]);
  assert.equal((await call("GET", "/workers/ratings")).status, 401);
});
