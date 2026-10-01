// Admin can read every cleaner↔customer chat in Chat Support (admin login required). Throwaway MongoDB.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const Admin = require("../../models/Admin");
const Booking = require("../../models/Booking");
const Worker = require("../../models/Worker");
const WorkerCustomerMessage = require("../../models/WorkerCustomerMessage");

let mongod, server, base, token;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  token = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  const worker = await Worker.create({ workerId: "W-1", firstName: "Kelvin", lastName: "Obi", email: "k@test.com", phone: "1", region: "UK", status: "Active" });
  await Booking.create({ bookingId: "BK-CHAT1", service: "Deep Cleaning", status: "Assigned", customer: { firstName: "Ann", lastName: "Skinner", email: "ann@test.com" }, assignedWorker: worker._id });
  const msg = (senderType, senderName, text, mins) => WorkerCustomerMessage.create({
    bookingId: "BK-CHAT1", workerId: worker._id, customerEmail: "ann@test.com", senderType, senderName, text, createdAt: new Date(Date.now() - mins * 60000),
  });
  await msg("Worker", "Kelvin Obi", "Hello, I'm Kelvin, your cleaner", 30);
  await msg("Customer", "Ann Skinner", "Hi Kelvin, the key is under the mat", 20);
  await msg("Worker", "Kelvin Obi", "Thanks, on my way", 10);
  const app = express();
  app.use(express.json());
  app.use("/api/customer-chat", require("../../routes/customer-chat"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/customer-chat`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

const get = async (path, auth = true) => {
  const res = await fetch(base + path, { headers: auth ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status, data: await res.json() };
};

test("cleaner↔customer chats need an admin login", async () => {
  assert.equal((await get("/admin/cleaner-threads", false)).status, 401);
  assert.equal((await get("/admin/cleaner-thread/BK-CHAT1", false)).status, 401);
});

test("admin sees each conversation with names and the full message history", async () => {
  const threads = (await get("/admin/cleaner-threads")).data;
  assert.equal(threads.length, 1);
  assert.equal(threads[0]._id, "BK-CHAT1");
  assert.equal(threads[0].workerName, "Kelvin Obi");
  assert.equal(threads[0].booking.customer.firstName, "Ann");
  assert.equal(threads[0].lastMessage, "Thanks, on my way");
  assert.equal(threads[0].count, 3);

  const messages = (await get("/admin/cleaner-thread/BK-CHAT1")).data;
  assert.deepEqual(messages.map((m) => m.senderType), ["Worker", "Customer", "Worker"]);
  assert.equal(messages[1].text, "Hi Kelvin, the key is under the mat");
  // Reading doesn't mark anything as read for the cleaner or customer.
  assert.equal(await WorkerCustomerMessage.countDocuments({ isRead: true }), 0);
});

test("customer Messages tab lists only their own cleaner chats, with unread counts", async () => {
  const { JWT_SECRET } = require("../../routes/customer-auth");
  const tokenFor = (email) => jwt.sign({ id: new mongoose.Types.ObjectId().toString(), email, firstName: "Ann", lastName: "Skinner" }, JWT_SECRET);
  const worker = await Worker.findOne({ workerId: "W-1" });
  // An upcoming booking with a cleaner but no messages yet still shows, so they can say hello.
  await Booking.create({ bookingId: "BK-CHAT2", service: "Regular House Cleaning", status: "Assigned", customer: { firstName: "Ann", lastName: "Skinner", email: "Ann@Test.com" }, assignedWorker: worker._id, assignedWorkerName: "Kelvin Obi" });
  await Booking.create({ bookingId: "BK-OTHER", service: "Deep Cleaning", status: "Assigned", customer: { firstName: "Bob", lastName: "Jones", email: "bob@test.com" }, assignedWorker: worker._id });

  const res = await fetch(`${base}/my/conversations`, { headers: { Authorization: `Bearer ${tokenFor("ann@test.com")}` } });
  assert.equal(res.status, 200);
  const list = await res.json();
  assert.deepEqual(list.map((c) => c.bookingId), ["BK-CHAT1", "BK-CHAT2"]);
  assert.equal(list[0].workerName, "Kelvin Obi");
  assert.equal(list[0].lastMessage, "Thanks, on my way");
  assert.equal(list[0].unreadCount, 2); // two cleaner messages not yet read
  assert.equal(list[1].hasMessages, false);

  assert.equal((await fetch(`${base}/my/conversations`)).status, 401);
});
