// Quotes with add-ons and property details, and the bookings created when the customer
// accepts — including quotes accepted after their date has passed (used to show 1970).
// Throwaway MongoDB; emails are captured, not sent.
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

const Booking = require("../../models/Booking");
const Quote = require("../../models/Quote");
const Service = require("../../models/Service");

let mongod, server, base;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Service.insertMany([
    { name: "End of Tenancy Cleaning", region: "UK", rate: 25, type: "hourly", category: "Base", workerHourlyRate: 14 },
    { name: "Single Fridge", region: "UK", rate: 25, type: "flat", category: "Extras" },
    { name: "Single Oven Cleaning", region: "UK", rate: 62.5, type: "flat", category: "Extras" },
  ]);
  const app = express();
  app.use(express.json());
  app.use("/api/quotes", require("../../routes/quotes"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/quotes`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const tomorrow = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1); return d; };
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

let n = 0;
const send = (over = {}) => fetch(`${base}/send`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    companyName: "Ann Skinner", email: "ann@test.com", quoteRef: `CLQ-T${++n}`, date: "1 October 2026", frequency: "once",
    items: [{
      service: "End of Tenancy Cleaning", billingType: "hourly", qty: 4, unitPrice: 25,
      extras: [{ name: "Single Fridge", qty: 1, unitPrice: 25 }, { name: "Single Oven Cleaning", qty: 2, unitPrice: 60 }],
    }],
    property: { bedrooms: 2, bathrooms: 1 }, suppliesProvidedBy: "Cleaniq", parking: "Free street parking", keyAccess: "Key in a key safe",
    subtotal: 245, grandTotal: 245, includeVat: false,
    ...over,
  }),
}).then(async (r) => ({ status: r.status, data: await r.json() }));
const accept = (ref) => fetch(`${base}/${ref}/accept`).then((r) => r.status);

test("a quote keeps its add-ons and property details, and the email shows them", async () => {
  const r = await send({ serviceDate: day(10) });
  assert.equal(r.status, 200);
  const q = await Quote.findOne({ quoteRef: `CLQ-T${n}` }).lean();
  assert.deepEqual(q.items[0].extras.map((e) => [e.name, e.qty, e.unitPrice]), [["Single Fridge", 1, 25], ["Single Oven Cleaning", 2, 60]]);
  assert.equal(q.property.bedrooms, 2);
  assert.equal(q.suppliesProvidedBy, "Cleaniq");
  const html = emails.find((m) => m.subject.includes(q.quoteRef)).html;
  assert.match(html, /\+ Single Fridge &times; 1/);
  assert.match(html, /£245\.00/); // line total includes add-ons: 4h × £25 + £25 + 2 × £60
  assert.match(html, /2 bedrooms, 1 bathrooms/);
});

test("accepting creates a booking with the right service, add-ons, hours and date", async () => {
  await send({ serviceDate: day(10) });
  assert.equal(await accept(`CLQ-T${n}`), 200);
  const b = await Booking.findOne({ bookingId: `Q-CLQ-T${n}-1` }).lean();
  assert.equal(b.service, "End of Tenancy Cleaning"); // not "End of Tenancy Cleaning, Single Fridge"
  assert.deepEqual(b.details.extras.slice(0, 2), ["Single Fridge (x1)", "Single Oven Cleaning (x2)"]);
  assert.ok(b.details.extras.includes("Bedroom (x2)"));
  assert.ok(b.details.extras.includes("Entry: Key in a key safe"));
  assert.equal(b.details.duration, 4);
  assert.equal(b.workerRate, 14);
  assert.equal(b.suppliesProvidedBy, "Cleaniq");
  assert.ok(sameDay(b.schedule.date, day(10)));
});

test("a quote accepted after its date has passed gets the next future date, not 1970", async () => {
  await send({ serviceDate: day(-5) });
  await accept(`CLQ-T${n}`);
  const b = await Booking.findOne({ bookingId: `Q-CLQ-T${n}-1` }).lean();
  assert.ok(b.schedule.date, "has a date");
  assert.ok(new Date(b.schedule.date).getFullYear() > 2000);
  assert.ok(sameDay(b.schedule.date, tomorrow()));
  assert.match(b.details.notes, /had passed/);
  assert.ok(emails.some((m) => /Quote Accepted/.test(m.subject) && /had passed/.test(m.html)));
});

test("a weekly quote whose start passed keeps its weekday and moves forward", async () => {
  await send({ serviceDate: day(-10), frequency: "weekly" });
  await accept(`CLQ-T${n}`);
  const first = await Booking.findOne({ bookingId: `Q-CLQ-T${n}-1` }).lean();
  const second = await Booking.findOne({ bookingId: `Q-CLQ-T${n}-2` }).lean();
  const start = new Date(first.schedule.date);
  assert.ok(start >= tomorrow());
  assert.equal(start.getDay(), new Date(day(-10)).getDay());
  assert.equal((new Date(second.schedule.date) - start) / 86400000, 7);
});

test("a quote with no date still gets a real date and a note to confirm it", async () => {
  await send({ serviceDate: "" });
  await accept(`CLQ-T${n}`);
  const b = await Booking.findOne({ bookingId: `Q-CLQ-T${n}-1` }).lean();
  assert.ok(sameDay(b.schedule.date, tomorrow()));
  assert.match(b.details.notes, /no cleaning date/);
});

test("older quotes that listed an add-on as a service book it as an add-on", async () => {
  await send({
    serviceDate: day(7),
    items: [
      { service: "End of Tenancy Cleaning", billingType: "hourly", qty: 3, unitPrice: 25 },
      { service: "Single Fridge", billingType: "flat", qty: 1, unitPrice: 25 },
    ],
  });
  await accept(`CLQ-T${n}`);
  const b = await Booking.findOne({ bookingId: `Q-CLQ-T${n}-1` }).lean();
  assert.equal(b.service, "End of Tenancy Cleaning");
  assert.equal(b.details.extras[0], "Single Fridge (x1)");
  assert.equal(b.details.duration, 3);
});

test("no quote follow-ups after the customer accepts (or accepts an edited copy, or books)", async () => {
  const ScheduledTask = require("../../models/ScheduledTask");
  const { processDueTasks } = require("../../utils/automationEngine");
  const due = () => ScheduledTask.updateMany({ status: "pending" }, { runAt: new Date(Date.now() - 1000) });
  const followups = (ref) => ScheduledTask.find({ "payload.quoteRef": ref }).lean();
  const sentSubjects = () => emails.filter((m) => /Still thinking|Following up on your|discount expires/.test(m.subject)).map((m) => m.subject);

  // 1. Accepted: its follow-ups are cancelled straight away.
  await send({ email: "pat@test.com", serviceDate: day(9) });
  const ref1 = `CLQ-T${n}`;
  assert.equal((await followups(ref1)).length, 3);
  await accept(ref1);
  assert.ok((await followups(ref1)).every((t) => t.status === "cancelled"));

  // 2. Admin edits a quote and sends it again (a new quote); the customer accepts the new one.
  emails.length = 0;
  await send({ email: "sam@test.com", serviceDate: day(9) });
  const oldRef = `CLQ-T${n}`;
  await send({ email: "sam@test.com", serviceDate: day(9) });
  await accept(`CLQ-T${n}`);
  await due();
  await processDueTasks();
  assert.deepEqual(sentSubjects(), []);
  assert.ok((await followups(oldRef)).every((t) => t.status === "cancelled"));

  // 3. Not accepted, no booking: the follow-up still goes out.
  emails.length = 0;
  await send({ email: "lee@test.com", serviceDate: day(9) });
  await due();
  await processDueTasks();
  assert.ok(sentSubjects().length >= 1);
});
