// End-to-end test of a company job from the customer app through admin approval and the
// worker app, checking the worker offers feed and the job status the customer sees.
// Throwaway MongoDB; emails are replaced by a stand-in.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const emailService = require("../../utils/emailService");
emailService.sendEmail = async () => true;

const Admin = require("../../models/Admin");
const Booking = require("../../models/Booking");
const Customer = require("../../models/Customer");
const Job = require("../../models/Job");
const Notification = require("../../models/Notification");
const Worker = require("../../models/Worker");

let mongod, server, base, companyToken, adminToken, worker;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const company = await Customer.collection.insertOne({
    firstName: "Ada", lastName: "Lane", companyName: "Lane Lettings", email: "ops@lane.test", phone: "07700900001",
  });
  companyToken = jwt.sign({ id: company.insertedId.toString(), role: "company" }, process.env.JWT_SECRET);
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  adminToken = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  worker = (await Worker.collection.insertOne({
    workerId: "W-SAM", firstName: "Sam", lastName: "Cole", email: "sam@test", region: "UK", status: "Active",
  })).insertedId.toString();

  const app = express();
  app.use(express.json());
  app.use("/api/jobs", require("../../routes/jobs"));
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

const call = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};
const offers = async () => (await call("GET", "/workers/jobs?region=UK")).data.map((b) => b.bookingId);
const jobStatus = async (jobRef) => (await Job.findOne({ jobId: jobRef })).status;

const postJob = (region) =>
  call("POST", "/jobs", {
    service: "Deep Clean",
    contact: { name: "Tom", phone: "07700900002", email: "tom@test" },
    details: { duration: 3 },
    property: { address: "1 Test St", postcode: "M1 1AA" },
    schedule: { date: "2030-06-01", timeSlot: "09:00" },
    region,
  }, companyToken);

test("a posted job waits for approval, then shows in the UK worker's offers", async () => {
  const r = await postJob("North West");
  assert.equal(r.status, 201);
  const booking = await Booking.findOne({ bookingId: r.data.bookingId });
  assert.equal(booking.status, "Pending");
  assert.equal(booking.region, "UK");
  assert.equal(booking.details.area, "North West");
  const job = await Job.findOne({ jobId: r.data.jobId });
  assert.equal(String(booking.meta.jobId), String(job._id));
  assert.ok(!(await offers()).includes(booking.bookingId), "pending jobs stay hidden");

  const approved = await call("PUT", `/jobs/${job._id}/approve`);
  assert.equal(approved.status, 200);
  assert.ok((await offers()).includes(booking.bookingId), "approved job is offered to UK workers");
  assert.equal(await jobStatus(r.data.jobId), "approved");
  await new Promise((res) => setTimeout(res, 100));
  assert.equal(await Notification.countDocuments({ workerId: worker, title: "New Company Job Available!" }), 1);
});

test("worker actions update the customer's job status", async () => {
  const booking = await Booking.findOne({ status: "Confirmed" });
  const ref = booking.meta.jobRef;
  await call("POST", `/workers/jobs/${booking._id}/accept`, { workerId: worker, workerName: "Sam Cole" });
  assert.equal(await jobStatus(ref), "assigned");
  assert.equal((await Job.findOne({ jobId: ref })).assignedWorkerName, "Sam Cole");

  await call("POST", `/workers/jobs/${booking._id}/cancel`);
  assert.equal(await jobStatus(ref), "approved", "back to approved when the worker drops it");
  assert.ok((await offers()).includes(booking.bookingId));

  await call("POST", `/workers/jobs/${booking._id}/accept`, { workerId: worker, workerName: "Sam Cole" });
  await call("POST", `/workers/jobs/${booking._id}/arrive`);
  assert.equal(await jobStatus(ref), "assigned");
  await call("POST", `/workers/jobs/${booking._id}/start`);
  assert.equal(await jobStatus(ref), "in_progress");
});

test("admin confirming a pending company job from Bookings offers it and syncs the job", async () => {
  const r = await postJob("");
  const booking = await Booking.findOne({ bookingId: r.data.bookingId });
  const res = await call("PUT", `/bookings/${booking._id}`, { status: "Confirmed" }, adminToken);
  assert.equal(res.status, 200);
  assert.equal(await jobStatus(r.data.jobId), "approved");
  assert.ok((await offers()).includes(booking.bookingId));
  await new Promise((res) => setTimeout(res, 100));
  assert.equal(await Notification.countDocuments({ workerId: worker, title: "New Job Available!" }), 1);
});

test("older bookings that stored the JOB- reference still sync", async () => {
  const r = await postJob("London");
  await Booking.updateOne({ bookingId: r.data.bookingId }, { $set: { "meta.jobId": r.data.jobId, region: "London", status: "Confirmed" } });
  assert.ok((await offers()).includes(r.data.bookingId), "old area-name region still offered to UK workers");
  const booking = await Booking.findOne({ bookingId: r.data.bookingId });
  await call("POST", `/workers/jobs/${booking._id}/accept`, { workerId: worker, workerName: "Sam Cole" });
  assert.equal(await jobStatus(r.data.jobId), "assigned");
});

test("rejecting a job rejects its pending booking", async () => {
  const r = await postJob("London");
  const job = await Job.findOne({ jobId: r.data.jobId });
  await call("PUT", `/jobs/${job._id}/reject`, { reason: "Outside our area" });
  assert.equal((await Booking.findOne({ bookingId: r.data.bookingId })).status, "Rejected");
});

test("job visibility: a job limited to one worker is only offered to (and acceptable by) that worker", async () => {
  const other = (await Worker.collection.insertOne({ workerId: "W-KIM", firstName: "Kim", lastName: "Poe", email: "kim@test", region: "UK", status: "Active" })).insertedId.toString();
  const booking = await Booking.create({ bookingId: "BK-VIS1", service: "Deep Clean", status: "Confirmed", region: "UK" });
  await call("PUT", `/workers/jobs/${booking._id}/visibility`, { visibleToWorkers: [worker] });
  const feed = async (qs) => (await call("GET", `/workers/jobs?${qs}`)).data.map((b) => b.bookingId);

  assert.ok((await feed(`region=UK&workerId=${worker}`)).includes("BK-VIS1"), "chosen worker sees it");
  assert.ok(!(await feed(`region=UK&workerId=${other}`)).includes("BK-VIS1"), "other worker doesn't");
  assert.ok(!(await feed("region=UK")).includes("BK-VIS1"), "no worker given → hidden (old app versions)");
  assert.ok((await feed("all=1")).includes("BK-VIS1"), "admin view still sees it");

  const denied = await call("POST", `/workers/jobs/${booking._id}/accept`, { workerId: other, workerName: "Kim Poe" });
  assert.equal(denied.status, 403);
  const ok = await call("POST", `/workers/jobs/${booking._id}/accept`, { workerId: worker, workerName: "Sam Cole" });
  assert.equal(ok.status, 200);

  await call("PUT", `/workers/jobs/${booking._id}/visibility`, { visibleToWorkers: [] });
  await Booking.updateOne({ _id: booking._id }, { $set: { status: "Confirmed", assignedWorker: null } });
  assert.ok((await feed(`region=UK&workerId=${other}`)).includes("BK-VIS1"), "open to all again");
});
