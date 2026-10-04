// Push notifications: per-device tokens (no duplicates, moved between accounts, removed on
// logout), the rerunnable migration, Expo ticket/receipt errors logged and dead tokens removed,
// and the token routes (old worker route still works; new ones need a login). Fake Expo client;
// throwaway MongoDB.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const Worker = require("../../models/Worker");
const Customer = require("../../models/Customer");
const push = require("../../utils/pushNotifications");
const { addToken, removeTokenFromUser, migrateSingleTokens } = require("../../utils/pushTokens");

const T = (n) => `ExponentPushToken[device-${n}]`;
let sentBatches = [];
let ticketsFor = () => ({ status: "ok", id: `t-${Math.random()}` });
push.setExpoForTests({
  chunkPushNotifications: (m) => [m],
  chunkPushNotificationReceiptIds: (ids) => [ids],
  sendPushNotificationsAsync: async (chunk) => { sentBatches.push(chunk); return chunk.map((m) => ticketsFor(m.to)); },
  getPushNotificationReceiptsAsync: async () => ({}),
});

let mongod, server, base, worker, customer, workerToken, customerToken;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  worker = await Worker.create({ workerId: "W-P", firstName: "Kelvin", lastName: "Obi", email: "k@test.com", phone: "1", region: "UK", status: "Active" });
  customer = await Customer.create({ firstName: "Ann", lastName: "Skinner", email: "ann@test.com", password: "x".repeat(20) }).catch(async () =>
    Customer.collection.insertOne({ firstName: "Ann", lastName: "Skinner", email: "ann@test.com" }).then((r) => Customer.findById(r.insertedId)));
  workerToken = jwt.sign({ workerId: worker._id, email: worker.email }, process.env.JWT_SECRET);
  customerToken = jwt.sign({ id: String(customer._id), email: "ann@test.com" }, require("../../routes/customer-auth").JWT_SECRET);
  const app = express();
  app.use(express.json());
  app.use("/api/workers", require("../../routes/workers"));
  app.use("/api/customer-auth", require("../../routes/customer-auth"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

const call = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
const tokensOfWorker = async () => (await Worker.findById(worker._id).lean()).pushTokens.map((t) => t.token);

test("several devices per user, no duplicates; a phone moves to whoever logs in on it", async () => {
  await addToken(Worker, worker._id, T(1), "ios");
  await addToken(Worker, worker._id, T(2), "android");
  await addToken(Worker, worker._id, T(1), "ios"); // same phone again: refreshed, not duplicated
  assert.deepEqual((await tokensOfWorker()).sort(), [T(1), T(2)]);
  assert.equal((await Worker.findById(worker._id)).expoPushToken, T(1)); // latest, for older code
  assert.equal(await addToken(Worker, worker._id, "not-a-token"), false);

  // The customer logs in on device 2: it's no longer the worker's.
  await addToken(Customer, customer._id, T(2), "android");
  assert.deepEqual(await tokensOfWorker(), [T(1)]);
  assert.deepEqual((await Customer.findById(customer._id).lean()).pushTokens.map((t) => t.token), [T(2)]);

  // Logout on device 1.
  await removeTokenFromUser(Worker, worker._id, T(1));
  assert.deepEqual(await tokensOfWorker(), []);
  assert.equal((await Worker.findById(worker._id)).expoPushToken, "");
});

test("the migration copies old single tokens and is safe to run again", async () => {
  const w = await Worker.create({ workerId: "W-OLD", firstName: "Old", lastName: "App", email: "old@test.com", phone: "2", region: "UK", expoPushToken: T(9) });
  assert.equal(await migrateSingleTokens(), 1);
  assert.equal(await migrateSingleTokens(), 0); // second run: nothing to do
  assert.deepEqual((await Worker.findById(w._id).lean()).pushTokens.map((t) => t.token), [T(9)]);
});

test("sendPushToUser reaches every device with a title and body; dead tokens are removed", async () => {
  await addToken(Worker, worker._id, T(3), "ios");
  await addToken(Worker, worker._id, T(4), "android");
  sentBatches = [];
  const logged = [];
  const origError = console.error;
  console.error = (...a) => logged.push(a.join(" "));
  ticketsFor = (to) => to === T(4)
    ? { status: "error", message: "not registered", details: { error: "DeviceNotRegistered" } }
    : { status: "error", message: "no APNs key", details: { error: "InvalidCredentials" } };
  const r = await push.sendPushToUser("worker", worker._id, "New job", "Deep Cleaning · Sat 3 Oct", { type: "new_job" });
  console.error = origError;
  ticketsFor = () => ({ status: "ok", id: "t-1" });

  assert.equal(sentBatches[0].length, 2);
  assert.ok(sentBatches[0].every((m) => m.title === "New job" && m.body && m.sound === "default" && m.priority === "high"));
  assert.deepEqual(r, { sent: 0, failed: 2 });
  assert.ok(logged.some((l) => /\[push\] ticket error .*InvalidCredentials.*eas credentials/i.test(l)));
  assert.ok(logged.some((l) => /DeviceNotRegistered/.test(l)));
  assert.deepEqual(await tokensOfWorker(), [T(3)]); // the unregistered phone is gone
});

test("old worker route still works; new routes need the user's own login", async () => {
  // Old app version: no login, token in the body.
  assert.equal((await call("POST", "/workers/push-token", { workerId: String(worker._id), token: T(5) })).status, 200);
  assert.ok((await tokensOfWorker()).includes(T(5)));

  assert.equal((await call("POST", "/workers/me/push-token", { token: T(6) })).status, 401);
  assert.equal((await call("POST", "/workers/me/push-token", { token: T(6), platform: "ios" }, workerToken)).status, 200);
  assert.ok((await tokensOfWorker()).includes(T(6)));
  assert.equal((await call("DELETE", "/workers/me/push-token", { token: T(6) }, workerToken)).status, 200);
  assert.ok(!(await tokensOfWorker()).includes(T(6)));

  assert.equal((await call("POST", "/customer-auth/push-token", { token: T(7), platform: "android" }, customerToken)).status, 200);
  assert.ok((await Customer.findById(customer._id).lean()).pushTokens.some((t) => t.token === T(7)));
  assert.equal((await call("DELETE", "/customer-auth/push-token", { token: T(7) }, customerToken)).status, 200);
  assert.ok(!(await Customer.findById(customer._id).lean()).pushTokens.some((t) => t.token === T(7)));
});
