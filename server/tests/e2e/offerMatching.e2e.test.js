// Wecasa-style offer matching: cleaners only see offers that suit their services, working hours,
// travel area (distance from home, extra/blocked postcode districts) and pets setting; offers show
// distance, travel time and pay (first vs following sessions). Fake postcode lookups; throwaway MongoDB.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
require("../../utils/emailService").sendEmail = async () => true;
const geo = require("../../utils/geo");
// Ramsbottom (home), Bury (~4 mi), Salford (~11 mi), Wigan (~15 mi)
const POINTS = { BL00HL: { lat: 53.647, lng: -2.316 }, BL90AA: { lat: 53.593, lng: -2.298 }, M54WT: { lat: 53.483, lng: -2.293 }, WN11AA: { lat: 53.545, lng: -2.632 } };
geo.setGeoFetcherForTests(async (url, body) => {
  if (body) return { result: body.postcodes.map((q) => ({ query: q, result: POINTS[q] ? { latitude: POINTS[q].lat, longitude: POINTS[q].lng } : null })) };
  return { result: null };
});

const Booking = require("../../models/Booking");
const Service = require("../../models/Service");
const Worker = require("../../models/Worker");
const Notification = require("../../models/Notification");
const WorkerCustomerMessage = require("../../models/WorkerCustomerMessage");

let mongod, server, base, worker;
const job = (over = {}) => Booking.create({
  bookingId: `BK-${Math.floor(Math.random() * 1e6)}`, service: "Regular House Cleaning", status: "Confirmed", region: "UK",
  customer: { firstName: "Ann", lastName: "Skinner", email: "ann@test.com" },
  details: { postcode: "BL9 0AA", duration: 3, frequency: "Fortnightly", hasPet: "No" },
  schedule: { date: new Date("2030-06-06T00:00:00Z"), preferredTime: "10:00", timeSlot: "10:00" }, // a Thursday
  workerRate: 13,
  ...over,
});

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Service.create({ name: "Regular House Cleaning", region: "UK", rate: 20.9, type: "hourly", category: "Base", workerHourlyRate: 13, workerFollowingRate: 15 });
  await Service.create({ name: "Deep Cleaning", region: "UK", rate: 30.85, type: "hourly", category: "Base", workerHourlyRate: 14 });
  worker = await Worker.create({ workerId: "W-1", firstName: "Kelvin", lastName: "Obi", email: "k@test.com", phone: "1", region: "UK", status: "Active", postcode: "BL0 0HL" });
  const app = express();
  app.use(express.json());
  app.use("/api/workers", require("../../routes/workers"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/workers`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

const call = async (method, path, body) => {
  const res = await fetch(base + path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json() };
};
const feed = async () => (await call("GET", `/jobs?region=UK&workerId=${worker._id}`)).data;

test("defaults: home postcode from profile, 10 miles, all services, 08:00–20:00 every day", async () => {
  const r = await call("GET", `/${worker._id}/preferences`);
  assert.equal(r.status, 200);
  assert.equal(r.data.preferences.travel.homePostcode, "BL0 0HL");
  assert.equal(r.data.preferences.travel.radiusMiles, 10);
  assert.deepEqual(r.data.preferences.workingHours.thursday, { on: true, start: "08:00", end: "20:00" });
  assert.ok(r.data.services.some((s) => s.name === "Regular House Cleaning"));
});

test("feed only shows offers that suit the cleaner, with distance, travel time and pay", async () => {
  const near = await job();
  const far = await job({ details: { postcode: "M5 4WT", duration: 3, frequency: "Once" } });
  let offers = await feed();
  const ids = offers.map((o) => o.bookingId);
  assert.ok(ids.includes(near.bookingId), "Bury is within 10 miles");
  assert.ok(!ids.includes(far.bookingId), "Salford is ~11 miles away");
  const o = offers.find((x) => x.bookingId === near.bookingId).offer;
  assert.ok(o.distanceMiles > 2 && o.distanceMiles < 6);
  assert.ok(o.travelMinutes >= 5);
  assert.deepEqual({ first: o.pay.firstRate, following: o.pay.followingRate, hours: o.pay.hours }, { first: 13, following: 15, hours: 3 });
  assert.equal(o.pay.monthlyEstimate, 97.5, "£15 × 3h × 26/12 visits");

  // Add Salford's district → offered despite the distance; block Bury's → hidden.
  await call("PUT", `/${worker._id}/preferences`, { travel: { addPostcodes: ["M5"], removePostcodes: ["BL9 0AA"] } });
  offers = (await feed()).map((x) => x.bookingId);
  assert.ok(offers.includes(far.bookingId));
  assert.ok(!offers.includes(near.bookingId));
  await call("PUT", `/${worker._id}/preferences`, { travel: { addPostcodes: [], removePostcodes: [] } });
});

test("services, working hours and pets filter offers", async () => {
  const deep = await job({ service: "Deep Cleaning", details: { postcode: "BL9 0AA", duration: 2, hasPet: "Yes" } });
  const late = await job({ schedule: { date: new Date("2030-06-06T00:00:00Z"), preferredTime: "18:30", timeSlot: "18:30" } });
  let ids = (await feed()).map((x) => x.bookingId);
  assert.ok(ids.includes(deep.bookingId), "deep clean with pets is offered by default");
  assert.ok(!ids.includes(late.bookingId), "18:30 + 3h ends 21:30, after the default 20:00 finish");

  await call("PUT", `/${worker._id}/preferences`, { services: ["Regular House Cleaning"] });
  assert.ok(!(await feed()).map((x) => x.bookingId).includes(deep.bookingId), "service not chosen");
  await call("PUT", `/${worker._id}/preferences`, { services: [], refusePets: true });
  assert.ok(!(await feed()).map((x) => x.bookingId).includes(deep.bookingId), "has pets");

  // 18:30 for 3 hours ends 21:30 — after 20:00.
  assert.ok(!(await feed()).map((x) => x.bookingId).includes(late.bookingId), "outside working hours");
  await call("PUT", `/${worker._id}/preferences`, { workingHours: { thursday: { on: true, start: "08:00", end: "22:00" } } });
  assert.ok((await feed()).map((x) => x.bookingId).includes(late.bookingId));
  await call("PUT", `/${worker._id}/preferences`, { workingHours: { thursday: { on: false, start: "08:00", end: "22:00" } } });
  assert.ok(!(await feed()).map((x) => x.bookingId).includes(late.bookingId), "Thursday off");
  await call("PUT", `/${worker._id}/preferences`, { refusePets: false, workingHours: { thursday: { on: true, start: "08:00", end: "20:00" } } });
});

test("bad input is rejected; an unknown home postcode is refused", async () => {
  assert.equal((await call("PUT", `/${worker._id}/preferences`, { travel: { radiusMiles: 500 } })).status, 400);
  assert.equal((await call("PUT", `/${worker._id}/preferences`, { workingHours: { monday: { start: "18:00", end: "09:00" } } })).status, 400);
  assert.equal((await call("PUT", `/${worker._id}/preferences`, { travel: { homePostcode: "ZZ9 9ZZ" } })).status, 400);
});

test("offer page: open, taken by another cleaner, or mine", async () => {
  const b = await job();
  let r = await call("GET", `/jobs/${b._id}?workerId=${worker._id}`);
  assert.equal(r.data.offer.availability, "open");
  assert.equal(r.data.offer.customerName, "Ann S.");
  const other = await Worker.create({ workerId: "W-2", firstName: "Bo", lastName: "B", email: "b@test.com", phone: "2", region: "UK", status: "Active" });
  await Booking.updateOne({ _id: b._id }, { $set: { assignedWorker: other._id, status: "Assigned" } });
  r = await call("GET", `/jobs/${b._id}?workerId=${worker._id}`);
  assert.equal(r.data.offer.availability, "taken");
  r = await call("GET", `/jobs/${b._id}?workerId=${other._id}`);
  assert.equal(r.data.offer.availability, "mine");
});

test("accepting sends the cleaner's automatic intro message (once), unless switched off", async () => {
  const b = await job();
  await call("POST", `/jobs/${b._id}/accept`, { workerId: String(worker._id), workerName: "Kelvin Obi" });
  // Sent in the background: wait up to 4s for it.
  let msgs = [];
  for (let i = 0; i < 40 && !msgs.length; i++) {
    msgs = await WorkerCustomerMessage.find({ bookingId: b.bookingId }).lean();
    if (!msgs.length) await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(msgs.length, 1);
  assert.match(msgs[0].text, /^Hello, I'm Kelvin, your cleaner from Cleaniq\. Our clean is booked for Thursday 6 June at 10:00/);

  await call("PUT", `/${worker._id}/preferences`, { autoIntro: { enabled: false } });
  const b2 = await job();
  await call("POST", `/jobs/${b2._id}/accept`, { workerId: String(worker._id), workerName: "Kelvin Obi" });
  await new Promise((r) => setTimeout(r, 500));
  assert.equal(await WorkerCustomerMessage.countDocuments({ bookingId: b2.bookingId }), 0);
});

test("job moves to another cleaner: they send their own intro, and only see their own messages", async () => {
  const first = await Worker.create({ workerId: "W-HX", firstName: "Hex", lastName: "Sean", email: "hx@test.com", phone: "5", region: "UK", status: "Active", postcode: "BL0 0HL" });
  const second = await Worker.create({ workerId: "W-SO", firstName: "Solomon", lastName: "Okoro", email: "so@test.com", phone: "6", region: "UK", status: "Active", postcode: "BL0 0HL" });
  const b = await job();
  const waitMsgs = async (n) => {
    for (let i = 0; i < 40; i++) {
      const m = await WorkerCustomerMessage.find({ bookingId: b.bookingId, senderType: "Worker" }).sort({ createdAt: 1 }).lean();
      if (m.length >= n) return m;
      await new Promise((r) => setTimeout(r, 100));
    }
    return [];
  };
  await call("POST", `/jobs/${b._id}/accept`, { workerId: String(first._id), workerName: "Hex Sean" });
  assert.match((await waitMsgs(1))[0].text, /^Hello, I'm Hex,/);
  await call("POST", `/jobs/${b._id}/cancel`, { workerId: String(first._id) });
  await WorkerCustomerMessage.create({ bookingId: b.bookingId, workerId: first._id, customerEmail: "ann@test.com", senderType: "Customer", senderName: "Ann", text: "Key is under the mat" });

  await call("POST", `/jobs/${b._id}/accept`, { workerId: String(second._id), workerName: "Solomon Okoro" });
  const msgs = await waitMsgs(2);
  assert.equal(msgs.length, 2);
  assert.match(msgs[1].text, /^Hello, I'm Solomon,/);

  // Solomon's chat: his intro and the customer's message — not Hex's intro shown as his.
  const chat = express();
  chat.use(express.json());
  chat.use("/api/worker-chat", require("../../routes/worker-chat"));
  const srv = chat.listen(0);
  const res = await fetch(`http://127.0.0.1:${srv.address().port}/api/worker-chat/${b.bookingId}?workerId=${second._id}`);
  const thread = await res.json();
  srv.close();
  assert.equal(thread.length, 2);
  assert.ok(thread.some((m) => /^Hello, I'm Solomon/.test(m.text)));
  assert.ok(thread.some((m) => m.text === "Key is under the mat"));
  assert.ok(!thread.some((m) => /Hex/.test(m.text)), "no previous cleaner's messages");
});

test("My offers lists recent suitable jobs with their status", async () => {
  const r = await call("GET", `/${worker._id}/offers-history`);
  assert.equal(r.status, 200);
  assert.ok(r.data.some((o) => o.status === "Accepted by you"));
  assert.ok(r.data.some((o) => o.status === "Available"));
  assert.ok(r.data.every((o) => o.pay && o.customerName));
});

test("new-job alerts only go to cleaners the job suits", async () => {
  const { notifyWorkersNewJob } = require("../../utils/companyJobs");
  await call("PUT", `/${worker._id}/preferences`, { services: ["Deep Cleaning"] });
  const b = await job();
  await notifyWorkersNewJob(b);
  assert.equal(await Notification.countDocuments({ workerId: worker._id, bookingId: b.bookingId }), 0, "Kelvin only does deep cleans");
  await call("PUT", `/${worker._id}/preferences`, { services: [] });
  await notifyWorkersNewJob(b);
  assert.equal(await Notification.countDocuments({ workerId: worker._id, bookingId: b.bookingId }), 1);
});

test("cleaners never receive the customer's phone or email; admin's all-jobs list still does", async () => {
  const b = await job({ customer: { firstName: "Ann", lastName: "Skinner", email: "ann@test.com", phone: "07700900111" } });
  const inFeed = (await feed()).find((x) => x.bookingId === b.bookingId);
  assert.ok(inFeed);
  assert.equal(inFeed.customer.phone, undefined);
  assert.equal(inFeed.customer.email, undefined);
  assert.equal(inFeed.customer.firstName, "Ann");
  const detail = (await call("GET", `/jobs/${b._id}`)).data;
  assert.equal(detail.customer.phone, undefined);
  await call("POST", `/jobs/${b._id}/accept`, { workerId: String(worker._id), workerName: "Kelvin Obi" });
  for (const path of [`/jobs/my-jobs/${worker._id}`, `/${worker._id}/schedule`]) {
    const mine = (await call("GET", path)).data.find((x) => x.bookingId === b.bookingId);
    assert.ok(mine, path);
    assert.equal(mine.customer.phone, undefined, path);
    assert.equal(mine.customer.email, undefined, path);
  }
  const admin = (await call("GET", "/jobs?all=1")).data;
  assert.ok(Array.isArray(admin));
});

test("Personal information and My documents for the cleaner", async () => {
  const Applicant = require("../../models/Applicant");
  const profile = await call("GET", `/${worker._id}/profile`);
  assert.equal(profile.status, 200);
  assert.equal(profile.data.firstName, "Kelvin");
  assert.equal(profile.data.bankDetails, undefined);
  assert.equal(profile.data.tempPassword, undefined);

  let docs = (await call("GET", `/${worker._id}/documents`)).data;
  assert.equal(docs.documents.length, 4);
  assert.ok(docs.documents.every((d) => d.path === null));

  await Applicant.create({ fullName: "Kelvin Obi", email: "K@Test.com", idPath: "uploads\\idDocument-1.jpg", dbsCheckPath: "uploads/dbsCheck-2.pdf", rightToWorkCode: "W12 345 678" });
  docs = (await call("GET", `/${worker._id}/documents`)).data;
  const by = Object.fromEntries(docs.documents.map((d) => [d.key, d.path]));
  assert.equal(by.idPath, "uploads/idDocument-1.jpg");
  assert.equal(by.dbsCheckPath, "uploads/dbsCheck-2.pdf");
  assert.equal(by.cvPath, null);
  assert.equal(docs.rightToWorkCode, "W12 345 678");
});

test("admin switches a job off: gone from the feed, can't be accepted; back on: shows again", async () => {
  const jwt = require("jsonwebtoken");
  const Admin = require("../../models/Admin");
  const admin = await Admin.collection.insertOne({ username: "vis-admin", password: "x", role: "superadmin" });
  const token = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  const b = await job();
  const put = (hidden, auth = true) => fetch(`${base}/jobs/${b._id}/hidden`, {
    method: "PUT", headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ hidden }),
  });
  assert.ok((await feed()).some((x) => x.bookingId === b.bookingId));
  assert.equal((await put(true, false)).status, 401); // admins only
  assert.equal((await put(true)).status, 200);
  assert.ok(!(await feed()).some((x) => x.bookingId === b.bookingId));
  assert.equal((await call("GET", `/jobs/${b._id}?workerId=${worker._id}`)).data.offer.availability, "unavailable");
  assert.equal((await call("POST", `/jobs/${b._id}/accept`, { workerId: String(worker._id), workerName: "Kelvin Obi" })).status, 403);
  // Admin's own list still shows it.
  assert.ok((await call("GET", "/jobs?all=1")).data.some((x) => x.bookingId === b.bookingId));
  assert.equal((await put(false)).status, 200);
  assert.ok((await feed()).some((x) => x.bookingId === b.bookingId));
});
