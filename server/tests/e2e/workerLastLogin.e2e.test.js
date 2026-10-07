// Admin → Staff shows when each worker last logged in to the app and last used it.
// Throwaway MongoDB.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const Worker = require("../../models/Worker");

let mongod, server, base;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Worker.create({
    workerId: "W-LIN", firstName: "Lin", lastName: "Park", email: "lin@test", phone: "07700900002",
    region: "UK", status: "Active", appAccessGranted: true, tempPassword: "pw123",
  });
  const app = express();
  app.use(express.json());
  app.use("/api/workers", require("../../routes/workers"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

const waitFor = async (fn, ms = 4000) => {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v || Date.now() > end) return v;
    await new Promise((r) => setTimeout(r, 50));
  }
};

test("a login is recorded (time and count); using the app updates last active", async () => {
  let w = await Worker.findOne({ email: "lin@test" }).lean();
  assert.equal(w.lastLoginAt, null);
  assert.equal(w.loginCount, 0);

  const bad = await fetch(`${base}/workers/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "lin@test", password: "nope" }) });
  assert.equal(bad.status, 401);
  assert.equal((await Worker.findOne({ email: "lin@test" }).lean()).loginCount, 0); // a wrong password isn't a login

  const before = Date.now();
  const ok = await fetch(`${base}/workers/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "lin@test", password: "pw123" }) });
  assert.equal(ok.status, 200);
  w = await Worker.findOne({ email: "lin@test" }).lean();
  assert.ok(w.lastLoginAt >= new Date(before - 1000));
  assert.equal(w.loginCount, 1);

  // Still logged in days later: opening the app (my jobs) counts as active.
  await Worker.updateOne({ _id: w._id }, { $set: { lastActiveAt: new Date(Date.now() - 3 * 86400000) } });
  await fetch(`${base}/workers/jobs/my-jobs/${w._id}`);
  const active = await waitFor(async () => {
    const x = await Worker.findById(w._id).lean();
    return x.lastActiveAt > new Date(before - 1000) ? x : null;
  });
  assert.ok(active, "last active updated");
  assert.equal(active.loginCount, 1); // not a new login
});
