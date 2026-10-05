// Website "Get a Quote" form: saved as a lead, emailed to the team (reply goes to the customer),
// and the customer gets a confirmation. Throwaway MongoDB.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const emails = [];
require("../../utils/emailService").sendEmail = async (m) => { emails.push(m); return true; };
const Lead = require("../../models/Lead");

let mongod, server, base;
const send = (body) => fetch(`${base}/contact/quote-request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const good = (extra = {}) => ({
  service: "End of Tenancy Cleaning", name: "Jo Bloggs", email: "Jo@Test.uk", phone: "07700000000", postcode: "m5 4wt",
  bedrooms: "2", bathrooms: "1", livingRooms: "1", property: "Flat", date: "2030-06-03", notes: "Keys with the concierge",
  carpet: "With Carpet Cleaning (Save 60%) — £75",
  extras: { oven: true, ovenType: "Double oven", fridge: true, fridgeType: "Fridge freezer", clearance: false },
  consent: true, ...extra,
});

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const app = express();
  app.use(express.json());
  app.use("/api/contact", require("../../routes/contact"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

test("a quote request is saved as a lead, sent to the team and confirmed to the customer", async () => {
  emails.length = 0;
  const res = await send(good());
  assert.equal(res.status, 200);

  const lead = await Lead.findOne({ email: "jo@test.uk" });
  assert.equal(lead.source, "Quote Form");
  assert.equal(lead.serviceInterest, "End of Tenancy Cleaning");
  assert.equal(lead.acknowledged, true);
  assert.match(lead.message, /Postcode: M5 4WT/);
  assert.match(lead.message, /Oven Cleaning \(Double oven\), Fridge Cleaning \(Fridge freezer\)/);
  assert.match(lead.message, /With Carpet Cleaning \(Save 60%\) — £75/);

  const [team, customer] = emails;
  assert.match(team.subject, /Quote request: End of Tenancy Cleaning — Jo Bloggs \(M5 4WT\)/);
  assert.equal(team.replyTo, "jo@test.uk");
  assert.match(team.html, /Monday,? 3 June 2030/);
  assert.equal(customer.to, "jo@test.uk");
});

test("oven and fridge cleaning need their type confirmed", async () => {
  let res = await send(good({ extras: { oven: true, ovenType: "" } }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).message, /type of oven/);
  res = await send(good({ extras: { fridge: true, fridgeType: "Mini bar" } }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).message, /type of fridge/);
});

test("required details and consent are checked", async () => {
  assert.equal((await send(good({ consent: false }))).status, 400);
  assert.equal((await send(good({ postcode: "12345" }))).status, 400);
  assert.equal((await send(good({ email: "nope" }))).status, 400);
  assert.equal((await send(good({ service: "" }))).status, 400);
  assert.equal((await send(good({ property: "Castle" }))).status, 400);
});

test("bots filling the hidden field are ignored", async () => {
  const before = await Lead.countDocuments();
  emails.length = 0;
  assert.equal((await send(good({ website: "http://spam.example" }))).status, 200);
  assert.equal(await Lead.countDocuments(), before);
  assert.equal(emails.length, 0);
});

test("what people type can't inject HTML into the team email", async () => {
  emails.length = 0;
  await send(good({ name: "<img src=x onerror=alert(1)>", notes: "<script>bad()</script>" }));
  assert.ok(!emails[0].html.includes("<script>"));
  assert.ok(!emails[0].html.includes("<img src=x"));
  assert.ok(emails[0].html.includes("&lt;script&gt;"));
});
