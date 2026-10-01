// Worker pay rates: new bookings take the service's Staff Pay rate, and saving a rate on
// the Staff Pay page never sets open bookings to £0. Throwaway MongoDB.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
require("../../utils/emailService").sendEmail = async () => true;

const Admin = require("../../models/Admin");
const Booking = require("../../models/Booking");
const Customer = require("../../models/Customer");
const Service = require("../../models/Service");
const SystemSetting = require("../../models/SystemSetting");
const { workerRateFor } = require("../../utils/workerRate");

let mongod, server, base, adminToken, companyToken;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Service.insertMany([
    { name: "Regular House Cleaning", region: "UK", rate: 20.5, type: "hourly", category: "Base", workerHourlyRate: 15 },
    { name: "Deep Cleaning", region: "UK", rate: 30.85, type: "hourly", category: "Base" },
  ]);
  // Live data has older type values the schema no longer accepts, so insert it raw.
  await Service.collection.insertOne({ name: "Carpet cleaning", region: "UK", rate: 75.8, type: "Cleaning", category: "Base", workerHourlyRate: 0, workerPaymentRate: 0 });
  await SystemSetting.create({ key: "defaultWorkerRate", value: 14 });
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  adminToken = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  const company = await Customer.collection.insertOne({ firstName: "Ada", lastName: "Lane", email: "ops@lane.test" });
  companyToken = jwt.sign({ id: company.insertedId.toString(), role: "company" }, process.env.JWT_SECRET);
  const app = express();
  app.use(express.json());
  app.use("/api/services", require("../../routes/services"));
  app.use("/api/jobs", require("../../routes/jobs"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

test("service rate first, then the standard rate", async () => {
  assert.equal(await workerRateFor("Regular House Cleaning"), 15);
  assert.equal(await workerRateFor("regular house cleaning "), 15);
  assert.equal(await workerRateFor("Deep Cleaning"), 14);
  assert.equal(await workerRateFor("Something else"), 14);
  await SystemSetting.deleteMany({});
  assert.equal(await workerRateFor("Deep Cleaning"), 13);
  await SystemSetting.create({ key: "defaultWorkerRate", value: 14 });
});

test("a customer company job gets the service's pay rate", async () => {
  const res = await fetch(`${base}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${companyToken}` },
    body: JSON.stringify({ service: "Regular House Cleaning", details: { duration: 3 }, schedule: { date: "2030-06-01", timeSlot: "09:00" } }),
  });
  const data = await res.json();
  assert.equal((await Booking.findOne({ bookingId: data.bookingId })).workerRate, 15);
});

test("saving a rate on a flat-price service syncs the hourly rate, never £0", async () => {
  const carpet = await Service.findOne({ name: "Carpet cleaning" });
  await Booking.create({ bookingId: "BK-1", service: "Carpet cleaning", status: "Confirmed", workerRate: 13 });
  const put = (body) => fetch(`${base}/services/${carpet._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(body),
  });
  assert.equal((await put({ workerHourlyRate: 16 })).status, 200);
  assert.equal((await Booking.findOne({ bookingId: "BK-1" })).workerRate, 16);
  await put({ workerHourlyRate: 0 });
  assert.equal((await Booking.findOne({ bookingId: "BK-1" })).workerRate, 16, "clearing the rate leaves bookings alone");
});

test("admin saves weekly/fortnightly prices on a service (and can clear them)", async () => {
  const svc = await Service.findOne({ name: "Regular House Cleaning" });
  const put = (body) => fetch(`${base}/services/${svc._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(body),
  });
  assert.equal((await put({ weeklyRate: "17.90", fortnightlyRate: 18.9 })).status, 200);
  let s = await Service.findById(svc._id).lean();
  assert.equal(s.weeklyRate, 17.9);
  assert.equal(s.fortnightlyRate, 18.9);
  assert.equal(s.rate, 20.5, "normal price untouched");
  assert.equal((await put({ weeklyRate: "", fortnightlyRate: "abc" })).status, 400);
  assert.equal((await put({ weeklyRate: "" })).status, 200);
  s = await Service.findById(svc._id).lean();
  assert.equal(s.weeklyRate, null);
  const pub = await (await fetch(`${base}/services?booking=1`)).json();
  assert.ok(pub.find((x) => x.name === "Regular House Cleaning" && x.fortnightlyRate === 18.9), "public list includes the prices");
});
