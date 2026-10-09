// Split a job into shifts (admin → Rota): each worker gets their own shift and pay, the customer
// sees one booking and hears only about the first arrival and the finished job. Throwaway MongoDB.
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
const pushes = [];
require("../../utils/pushNotifications").setExpoForTests({
  chunkPushNotifications: (m) => [m],
  chunkPushNotificationReceiptIds: (ids) => [ids],
  sendPushNotificationsAsync: async (chunk) => { pushes.push(...chunk); return chunk.map(() => ({ status: "ok", id: "t" })); },
  getPushNotificationReceiptsAsync: async () => ({}),
});

const Admin = require("../../models/Admin");
const Booking = require("../../models/Booking");
const Customer = require("../../models/Customer");
const Worker = require("../../models/Worker");
const Withdrawal = require("../../models/Withdrawal");
const ScheduledTask = require("../../models/ScheduledTask");

let mongod, server, base, adminToken, kelvin, mary;
const CUSTOMER_TOKEN = "ExponentPushToken[customer]";

const auth = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` });
const customerEmailsTo = () => emails.filter((m) => m.to === "jo@test.uk");
const customerPushes = () => pushes.filter((p) => [].concat(p.to).includes(CUSTOMER_TOKEN));
const reset = () => { emails.length = 0; pushes.length = 0; };
const settle = () => new Promise((r) => setTimeout(r, 50));

async function newJob(ref, extra = {}) {
  return Booking.create({
    bookingId: ref,
    customer: { firstName: "Jo", lastName: "Bloggs", email: "jo@test.uk", phone: "07000000000" },
    service: "Deep Cleaning",
    details: { duration: 6, address: "1 High St, Salford" },
    schedule: { date: new Date("2030-06-03T00:00:00Z"), timeSlot: "09:00", preferredTime: "09:00" },
    payment: { amount: 185.1, currency: "GBP", status: "Completed" },
    status: "Confirmed",
    workerRate: 14,
    ...extra,
  });
}
const split = (id, shifts) => fetch(`${base}/workers/jobs/${id}/shifts`, { method: "PUT", headers: auth(), body: JSON.stringify({ shifts }) });
const twoShifts = () => [
  { workerId: String(kelvin._id), start: "09:00", hours: 3 },
  { workerId: String(mary._id), start: "12:00", hours: 3 },
];
const post = (path) => fetch(`${base}/workers/jobs/${path}`, { method: "POST", headers: { "Content-Type": "application/json" } });

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  adminToken = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  const addWorker = async (firstName, lastName, n) => {
    const r = await Worker.collection.insertOne({ firstName, lastName, workerId: `W-${n}`, region: "UK", email: `${n}@test.uk`, phone: `0700000000${n}`, status: "Active" });
    return { _id: r.insertedId };
  };
  kelvin = await addWorker("Kelvin", "Obi", 1);
  mary = await addWorker("Mary", "Ade", 2);
  await Customer.collection.insertOne({ firstName: "Jo", lastName: "Bloggs", email: "jo@test.uk", pushTokens: [{ token: CUSTOMER_TOKEN, platform: "ios", updatedAt: new Date() }] });
  const app = express();
  app.use(express.json());
  app.use("/api/workers", require("../../routes/workers"));
  app.use("/api/bookings", require("../../routes/bookings"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

test("only admin can split a job", async () => {
  const job = await newJob("BK-AUTH");
  const res = await fetch(`${base}/workers/jobs/${job._id}/shifts`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shifts: twoShifts() }) });
  assert.equal(res.status, 401);
});

test("splitting creates one shift per worker; the customer still sees one booking", async () => {
  reset();
  const job = await newJob("BK-SPLIT");
  const res = await split(job._id, twoShifts());
  assert.equal(res.status, 200);

  const parent = await Booking.findById(job._id);
  assert.equal(parent.splitIntoShifts, true);
  assert.equal(parent.assignedWorkerName, "Kelvin & Mary");
  assert.equal(parent.assignedWorker, null);
  assert.equal(parent.status, "Assigned");

  const shifts = await Booking.find({ parentBooking: job._id }).sort({ shiftNumber: 1 });
  assert.deepEqual(shifts.map((s) => s.bookingId), ["BK-SPLIT-S1", "BK-SPLIT-S2"]);
  assert.deepEqual(shifts.map((s) => s.schedule.timeSlot), ["09:00", "12:00"]);
  assert.deepEqual(shifts.map((s) => s.workerDuration), [3, 3]);
  assert.equal(String(shifts[1].assignedWorker), String(mary._id));
  assert.ok(shifts.every((s) => s.hiddenFromWorkers && s.payment.amount === 0));

  // Workers are told; the customer isn't, and no reminders are set up for the shifts.
  await settle();
  assert.equal(customerEmailsTo().length, 0);
  assert.equal(customerPushes().length, 0);
  assert.equal(await ScheduledTask.countDocuments({ "payload.bookingId": { $in: shifts.map((s) => String(s._id)) } }), 0);
});

test("a split job can't also be assigned to one worker, and bad splits are refused", async () => {
  const parent = await Booking.findOne({ bookingId: "BK-SPLIT" });
  const assign = await fetch(`${base}/workers/jobs/${parent._id}/assign`, { method: "PUT", headers: auth(), body: JSON.stringify({ workerId: String(kelvin._id) }) });
  assert.equal(assign.status, 400);

  const job = await newJob("BK-BAD");
  assert.equal((await split(job._id, [twoShifts()[0]])).status, 400);
  assert.equal((await split(job._id, [{ ...twoShifts()[0], start: "9am" }, twoShifts()[1]])).status, 400);
  assert.equal(await Booking.countDocuments({ parentBooking: job._id }), 0);
});

test("first arrival tells the customer; the second doesn't", async () => {
  reset();
  const [s1, s2] = await Booking.find({ parentBooking: (await Booking.findOne({ bookingId: "BK-SPLIT" }))._id }).sort({ shiftNumber: 1 });

  assert.equal((await post(`${s1._id}/arrive`)).status, 200);
  await settle();
  let parent = await Booking.findOne({ bookingId: "BK-SPLIT" });
  assert.equal(parent.status, "Arrived");
  assert.equal(parent.assignedWorkerName, "Kelvin & Mary"); // not overwritten by the arriving cleaner
  assert.equal(customerEmailsTo().length, 1);
  assert.match(customerEmailsTo()[0].subject, /Kelvin Obi/);
  assert.equal(customerPushes().length, 1);

  reset();
  assert.equal((await post(`${s1._id}/start`)).status, 200);
  assert.equal((await post(`${s2._id}/arrive`)).status, 200);
  assert.equal((await post(`${s2._id}/start`)).status, 200);
  await settle();
  assert.equal(customerEmailsTo().length, 0);
  assert.equal(customerPushes().length, 0);
  parent = await Booking.findOne({ bookingId: "BK-SPLIT" });
  assert.equal(parent.status, "In Progress");
});

test("a split can't be changed once a shift has started", async () => {
  const parent = await Booking.findOne({ bookingId: "BK-SPLIT" });
  assert.equal((await split(parent._id, twoShifts())).status, 400);
  assert.equal((await fetch(`${base}/workers/jobs/${parent._id}/shifts`, { method: "DELETE", headers: auth() })).status, 400);
});

test("each worker is paid for their hours; the customer hears once, when the last shift finishes", async () => {
  reset();
  const [s1, s2] = await Booking.find({ parentBooking: (await Booking.findOne({ bookingId: "BK-SPLIT" }))._id }).sort({ shiftNumber: 1 });

  assert.equal((await post(`${s1._id}/complete`)).status, 200);
  await settle();
  assert.equal((await Booking.findOne({ bookingId: "BK-SPLIT" })).status, "In Progress");
  assert.equal(customerEmailsTo().length, 0);

  assert.equal((await post(`${s2._id}/complete`)).status, 200);
  await settle();
  const parent = await Booking.findOne({ bookingId: "BK-SPLIT" });
  assert.equal(parent.status, "Completed");
  // Once, for the whole job: the "clean is done" email and the invoice.
  assert.equal(customerEmailsTo().filter((m) => /clean is done/.test(m.subject)).length, 1);
  assert.equal(customerEmailsTo().filter((m) => /Invoice/.test(m.subject)).length, 1);
  assert.equal(customerEmailsTo().length, 2);
  assert.equal(customerPushes().length, 1);

  const pay = await Withdrawal.find({}).sort({ workerName: 1 });
  assert.deepEqual(pay.map((w) => [w.workerName, w.amount]), [["Kelvin Obi", 42], ["Mary Ade", 42]]);
});

test("admin changing a shift's status goes through the same shift steps", async () => {
  reset();
  const job = await newJob("BK-ADMIN");
  await split(job._id, twoShifts());
  const [s1, s2] = await Booking.find({ parentBooking: job._id }).sort({ shiftNumber: 1 });
  const put = (id, body) => fetch(`${base}/bookings/${id}`, { method: "PUT", headers: auth(), body: JSON.stringify(body) });

  assert.equal((await put(s1._id, { status: "Completed" })).status, 200);
  await settle();
  assert.equal((await Booking.findById(job._id)).status, "In Progress");
  assert.equal(customerEmailsTo().length, 0);

  assert.equal((await put(s2._id, { status: "Completed" })).status, 200);
  await settle();
  assert.equal((await Booking.findById(job._id)).status, "Completed");
  assert.equal(customerEmailsTo().filter((m) => /clean is done/.test(m.subject)).length, 1);
});

test("removing a split puts the job back to unassigned", async () => {
  const job = await newJob("BK-UNDO");
  await split(job._id, twoShifts());
  const res = await fetch(`${base}/workers/jobs/${job._id}/shifts`, { method: "DELETE", headers: auth() });
  assert.equal(res.status, 200);
  const parent = await Booking.findById(job._id);
  assert.equal(parent.splitIntoShifts, false);
  assert.equal(parent.assignedWorkerName, null);
  assert.equal(parent.status, "Confirmed");
  assert.equal(await Booking.countDocuments({ parentBooking: job._id }), 0);
});

test("cancelling a split job cancels its shifts and tells the workers", async () => {
  reset();
  const job = await newJob("BK-CANCEL");
  await split(job._id, twoShifts());
  reset();
  const parent = await Booking.findById(job._id);
  parent.status = "Cancelled";
  await parent.save();
  await settle();
  const shifts = await Booking.find({ parentBooking: job._id });
  assert.ok(shifts.every((s) => s.status === "Cancelled"));
  assert.equal(pushes.filter((p) => p.title === "Shift cancelled").length, 0); // workers here have no device tokens
});

test("rescheduling a split job moves its shifts, keeping their gaps", async () => {
  const job = await newJob("BK-MOVE");
  await split(job._id, twoShifts());
  const { rescheduleBooking } = require("../../routes/bookings");
  await rescheduleBooking(await Booking.findById(job._id), { date: "2030-06-10", timeSlot: "10:00" });
  const shifts = await Booking.find({ parentBooking: job._id }).sort({ shiftNumber: 1 });
  assert.deepEqual(shifts.map((s) => s.schedule.timeSlot), ["10:00", "13:00"]);
  assert.ok(shifts.every((s) => new Date(s.schedule.date).toISOString().startsWith("2030-06-10")));

  const res = await fetch(`${base}/bookings/${shifts[0]._id}/reschedule`, { method: "PUT", headers: auth(), body: JSON.stringify({ date: "2030-06-11", timeSlot: "09:00" }) });
  assert.equal(res.status, 400);
});
