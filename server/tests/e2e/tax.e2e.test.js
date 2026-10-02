// Tax set by admin (Settings → Tax): public read, admin-only save with clean values, and the
// server's minimum regular-clean price includes it. Throwaway MongoDB.
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
const Service = require("../../models/Service");
const { minimumVisitPrice } = require("../../utils/subscriptions");
const { withTax, taxOn } = require("../../utils/tax");

let mongod, server, base, token;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Service.create({ name: "Regular House Cleaning", region: "UK", rate: 20.9, weeklyRate: 18, type: "hourly", category: "Base" });
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  token = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  const app = express();
  app.use(express.json());
  app.use("/api/settings", require("../../routes/settings"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/settings`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

const save = (value, auth = true) => fetch(base, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify({ key: "tax", value }),
});

test("tax is off until admin switches it on; only admins can change it", async () => {
  assert.deepEqual(await (await fetch(`${base}/tax`)).json(), { enabled: false, rate: 20, label: "VAT" });
  assert.equal((await save({ enabled: true, rate: 20 }, false)).status, 401);
  assert.equal(await minimumVisitPrice("Regular House Cleaning", 3, "Weekly"), 54); // 3 × £18, no tax
});

test("once on, the rate is cleaned up and regular-clean prices include it", async () => {
  assert.equal((await save({ enabled: "yes", rate: "17.5", label: "  VAT  " })).status, 200);
  assert.deepEqual(await (await fetch(`${base}/tax`)).json(), { enabled: true, rate: 17.5, label: "VAT" });
  assert.equal(await minimumVisitPrice("Regular House Cleaning", 3, "Weekly"), 63.45); // £54 + 17.5%
  assert.equal(taxOn(92.55, { enabled: true, rate: 20 }), 18.51);
  assert.equal(withTax(92.55, { enabled: true, rate: 20 }), 111.06);
  // A silly rate falls back to 20%.
  await save({ enabled: true, rate: 500 });
  assert.equal((await (await fetch(`${base}/tax`)).json()).rate, 20);
});
