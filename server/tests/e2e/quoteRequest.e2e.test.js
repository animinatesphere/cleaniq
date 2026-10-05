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
const Quote = require("../../models/Quote");
const Service = require("../../models/Service");

let mongod, server, base;
const send = (body) => fetch(`${base}/contact/quote-request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const good = (extra = {}) => ({
  service: "End of Tenancy Cleaning", name: "Jo Bloggs", email: "Jo@Test.uk", phone: "07700000000", postcode: "m5 4wt",
  address: "Flat 4, 10 Quay St, Salford", hours: 3, carpets: "2", supplies: "Customer", time: "08:30",
  kitchens: "1", hasPet: "No",
  bedrooms: "2", bathrooms: "1", livingRooms: "1", stairs: "1", property: "Flat", date: "2030-06-03", notes: "Keys with the concierge",
  carpet: "With Carpet Cleaning (Save 60%)",
  extras: { oven: true, ovenType: "Double oven", fridge: true, fridgeType: "Fridge freezer" },
  consent: true, ...extra,
});

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  // Live price-list data has older type values the schema no longer accepts, so insert it raw.
  await Service.collection.insertMany([
    { name: "End of Tenancy Cleaning", region: "UK", rate: 25, type: "hourly", category: "Base" },
    { name: "Oven cleaning", region: "UK", rate: 60, type: "Cleaning", category: "Base" },
    { name: "Carpet Cleaning", region: "UK", rate: 30, type: "flat", category: "Extras" },
    { name: "Double Oven Cleaning", region: "UK", rate: 62.5, type: "flat", category: "Extras" },
    { name: "Fridge and freezer", region: "UK", rate: 30, type: "flat", category: "Extras" },
    { name: "Stairs/Landing", region: "UK", rate: 15, type: "Cleaning", category: "Extras" },
  ]);
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
  assert.equal(lead.stage, "Quoted"); // the instant quote is their confirmation
  assert.match(lead.message, /Postcode: M5 4WT/);
  assert.match(lead.message, /Oven Cleaning \(Double oven\), Fridge Cleaning \(Fridge freezer\)/);
  assert.match(lead.message, /With Carpet Cleaning \(Save 60%\)/);
  assert.match(lead.message, /Stairs \/ landings: 1/);

  const team = emails.find((e) => /Quote request:/.test(e.subject));
  assert.match(team.subject, /Quote request: End of Tenancy Cleaning — Jo Bloggs \(M5 4WT\)/);
  assert.equal(team.replyTo, "jo@test.uk");
  assert.match(team.html, /Monday,? 3 June 2030/);
  assert.match(team.html, /Instant quote CLQ-/);
});

test("an instant quote is emailed from the price list: hours × rate, 60% off carpets, 20% off oven/fridge", async () => {
  emails.length = 0;
  const res = await send(good({ email: "price@test.uk", stairs: "1" }));
  const body = await res.json();
  assert.equal(body.instantQuote, true);
  const q = await Quote.findOne({ quoteRef: body.quoteRef }).lean();
  const item = q.items[0];
  assert.equal(item.service, "End of Tenancy Cleaning");
  assert.equal(item.qty, 3);
  assert.equal(item.unitPrice, 25);
  assert.deepEqual(item.extras.map((e) => [e.name, e.qty, e.unitPrice]), [
    ["Carpet Cleaning – 60% off", 2, 12],
    ["Double Oven Cleaning – 20% off", 1, 50],
    ["Fridge and freezer – 20% off", 1, 24],
    ["Stairs/Landing", 1, 15],
  ]);
  assert.equal(q.subtotal, 75 + 24 + 50 + 24 + 15);
  assert.equal(q.grandTotal, Math.round((q.subtotal + q.vat) * 100) / 100);
  assert.equal(q.address, "Flat 4, 10 Quay St, Salford, M5 4WT");
  assert.equal(q.serviceDate, "2030-06-03");
  assert.equal(q.property.bedrooms, 2);
  assert.equal(q.property.kitchens, 1);
  assert.equal(q.serviceTimeSlot, "08:30", "preferred time pre-fills the accept page");
  assert.equal(q.suppliesProvidedBy, "Customer");
  assert.equal(q.hasPet, "No");
  // The customer gets the quote (with its Accept button), not a second "we received it" email.
  const toCustomer = emails.filter((e) => e.to === "price@test.uk");
  assert.equal(toCustomer.length, 1);
  assert.match(toCustomer[0].subject, /Quote/);
  assert.match(toCustomer[0].html, /accept/i);
  assert.equal((await Lead.findOne({ email: "price@test.uk", source: "Quote Form" })).stage, "Quoted");
});

test("supplies brought by Cleaniq add the supplies fee, like the receptionist's quotes", async () => {
  const res = await send(good({ email: "supplies@test.uk", supplies: "Cleaniq", carpet: "", carpets: "", extras: {} }));
  const q = await Quote.findOne({ quoteRef: (await res.json()).quoteRef }).lean();
  const fee = Number((await require("../../models/AiSettings").get()).suppliesFee);
  const supplies = q.items[0].extras.find((e) => e.name === "Cleaning supplies & equipment");
  assert.equal(supplies?.unitPrice, fee);
  assert.equal(q.suppliesProvidedBy, "Cleaniq");
});

test("services not priced by the hour go to the team instead (customer gets 'we received it')", async () => {
  emails.length = 0;
  const res = await send(good({ email: "oven@test.uk", service: "Oven cleaning" }));
  const body = await res.json();
  assert.equal(body.instantQuote, false);
  assert.equal(await Quote.countDocuments({ email: "oven@test.uk" }), 0);
  assert.ok(emails.some((e) => e.to === "oven@test.uk" && /We received your quote request/.test(e.subject)));
  assert.ok(emails.some((e) => /Quote request:/.test(e.subject) && /No instant quote/.test(e.html)));
});

test("hours, full address and number of carpets are required", async () => {
  assert.match((await (await send(good({ hours: "" }))).json()).message, /how many hours/);
  assert.match((await (await send(good({ hours: 0.7 }))).json()).message, /how many hours/);
  assert.match((await (await send(good({ address: "" }))).json()).message, /full address/);
  assert.match((await (await send(good({ carpets: "0" }))).json()).message, /how many carpets/);
  assert.match((await (await send(good({ supplies: "" }))).json()).message, /cleaning supplies/);
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
  const team = emails.find((e) => /Quote request:/.test(e.subject));
  assert.ok(team.html.includes("&lt;script&gt;"));
  // Nothing typed reaches any email as HTML: the team alert, the quote and its team copy.
  for (const e of emails) {
    assert.ok(!e.html.includes("<script>"), e.subject);
    assert.ok(!e.html.includes("<img src=x"), e.subject);
  }
});
