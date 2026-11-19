// Multi-property quotes from Commercial Hub (e.g. end of tenancy for several houses): the email
// shows the property sizes, included work and optional extras; accepting asks for a date per
// property and creates one booking per property at its discounted price.
// Throwaway MongoDB; emails are captured, not sent.
//
//   node --test tests/e2e/multiQuote.e2e.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const emails = [];
require("../../utils/emailService").sendEmail = async (m) => { emails.push(m); return true; };
const checkouts = [];
require("../../routes/quotes").setStripeForTests({
  checkout: { sessions: { create: async (a) => { checkouts.push(a); return { id: "cs_x", url: "https://checkout.test/x" }; } } },
});
const Booking = require("../../models/Booking");
const Quote = require("../../models/Quote");

let mongod, server, base;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api/quotes", require("../../routes/quotes"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/quotes`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

const day = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };

const PROPS = [
  { name: "Carlton Road", bedrooms: 5, bathrooms: 2, price: 380 },
  { name: "Bolton Road", bedrooms: 7, bathrooms: 2, price: 480 },
  { name: "Devonshire Road", bedrooms: 3, bathrooms: 2, price: 260 },
];
let n = 0;
const sendMulti = (over = {}) => fetch(`${base}/send`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    companyName: "Salford Lettings", contactName: "Bell", email: "bell@test.com", quoteRef: `CLQ-M${++n}`,
    date: "19 November 2026", frequency: "once", paymentTerms: "Due on completion", validDays: 30,
    quoteType: "multi",
    multi: {
      title: "End of Tenancy Clean", subtitle: "Salford properties · all with 2 bathrooms",
      sizes: [{ bedrooms: 3, bathrooms: 2, price: 260 }, { bedrooms: 5, bathrooms: 2, price: 380 }, { bedrooms: 7, bathrooms: 2, price: 480 }],
      properties: PROPS,
      discountCondition: "If all 3 properties are booked",
      included: ["Kitchen: oven, hob and extractor deep cleaned", "<b>Bathrooms</b> sanitised"],
      optionalExtras: [{ name: "Carpet steam cleaning", unit: "per room", price: 40 }, { name: "Rubbish removal", unit: "", price: "" }],
    },
    items: PROPS.map((p) => ({ service: "End of Tenancy Clean", description: `${p.name} · ${p.bedrooms} bed · ${p.bathrooms} bath`, qty: 1, unitPrice: p.price })),
    subtotal: 1120, discount: 10, discountAmount: 112, subtotalAfterDiscount: 1008, includeVat: false, vat: 0, grandTotal: 1008,
    ...over,
  }),
}).then(async (r) => ({ status: r.status, data: await r.json() }));

test("the quote email shows the sizes, properties, what's included and optional extras", async () => {
  emails.length = 0;
  const r = await sendMulti();
  assert.equal(r.status, 200);
  const q = await Quote.findOne({ quoteRef: "CLQ-M1" }).lean();
  assert.equal(q.quoteType, "multi");
  assert.equal(q.multi.properties.length, 3);
  const html = emails.find((e) => e.to === "bell@test.com").html;
  for (const t of ["End of Tenancy Clean", "Price per property size", "Your Properties", "Carlton Road", "What's included", "Optional extras", "Carpet steam cleaning", "Quoted on request", "If all 3 properties are booked", "£1008.00"]) {
    assert.ok(html.includes(t), `email should include "${t}"`);
  }
  // Text typed by the admin is shown as text, not HTML.
  assert.ok(html.includes("&lt;b&gt;Bathrooms&lt;/b&gt;"));
});

test("a multi-property quote needs at least one property", async () => {
  const r = await sendMulti({ multi: { title: "End of Tenancy Clean", properties: [] } });
  assert.equal(r.status, 400);
});

test("the accept page asks for a date for each property", async () => {
  const html = await (await fetch(`${base}/CLQ-M1/accept`)).text();
  assert.ok(html.includes("When should we clean each property?"));
  for (let i = 0; i < 3; i++) assert.ok(html.includes(`name="date_${i}"`));
  assert.ok(html.includes("Devonshire Road"));
});

test("a missing date is refused and nothing is booked", async () => {
  const r = await fetch(`${base}/CLQ-M1/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ date_0: day(5), date_1: day(6) }).toString(),
  });
  assert.equal(r.status, 400);
  assert.ok((await r.text()).includes("Please choose a date (from tomorrow) for Devonshire Road"));
  assert.equal(await Booking.countDocuments({ bookingId: /^Q-CLQ-M1-/ }), 0);
  assert.equal((await Quote.findOne({ quoteRef: "CLQ-M1" })).status, "sent");
});

test("accepting books every property straight away, at its discounted price, on its own date", async () => {
  emails.length = 0;
  checkouts.length = 0;
  const dates = [day(5), day(9), day(12)];
  const r = await fetch(`${base}/CLQ-M1/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ date_0: dates[0], date_1: dates[1], date_2: dates[2] }).toString(),
  });
  assert.equal(r.status, 200);
  const q = await Quote.findOne({ quoteRef: "CLQ-M1" }).lean();
  assert.equal(q.status, "accepted");
  const bookings = await Booking.find({ bookingId: /^Q-CLQ-M1-/ }).sort({ bookingId: 1 }).lean();
  assert.equal(bookings.length, 3);
  assert.deepEqual(bookings.map((b) => b.details.address), ["Carlton Road", "Bolton Road", "Devonshire Road"]);
  assert.deepEqual(bookings.map((b) => b.payment.amount), [342, 432, 234]); // 10% off 380, 480, 260
  assert.deepEqual(bookings.map((b) => new Date(b.schedule.date).toISOString().slice(0, 10)), dates);
  assert.deepEqual(bookings.map((b) => b.property.bedrooms), [5, 7, 3]);
  assert.ok(bookings.every((b) => b.service === "End of Tenancy Clean" && b.status === "Pending"));
  // No card payment link for a multi-property job; admin is told to invoice.
  assert.equal(checkouts.length, 0);
  const alert = emails.find((e) => /Quote Accepted/.test(e.subject));
  assert.ok(alert && alert.html.includes("send the customer an invoice"));
});

test("accepting twice doesn't book the properties twice", async () => {
  await fetch(`${base}/CLQ-M1/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ date_0: day(5), date_1: day(9), date_2: day(12) }).toString(),
  });
  assert.equal(await Booking.countDocuments({ bookingId: /^Q-CLQ-M1-/ }), 3);
});

test("VAT is added to each property's booking when the quote includes it", async () => {
  await sendMulti({ quoteRef: "CLQ-VAT", includeVat: true, vatRate: 20, discount: 0, discountAmount: 0, subtotalAfterDiscount: 1120, vat: 224, grandTotal: 1344 });
  const r = await fetch(`${base}/CLQ-VAT/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ date_0: day(3), date_1: day(4), date_2: day(5) }).toString(),
  });
  assert.equal(r.status, 200);
  const b = await Booking.findOne({ bookingId: "Q-CLQ-VAT-1" }).lean();
  assert.equal(b.payment.amount, 456); // 380 + 20%
  assert.equal(b.payment.taxAmount, 76);
});

test("normal quotes still use the single date-and-time page", async () => {
  await fetch(`${base}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "Ann", email: "ann@test.com", quoteRef: "CLQ-S1", date: "1 Oct 2026", frequency: "once",
      items: [{ service: "Deep Cleaning", qty: 1, unitPrice: 100 }], subtotal: 100, grandTotal: 100, includeVat: false,
    }),
  });
  const q = await Quote.findOne({ quoteRef: "CLQ-S1" }).lean();
  assert.equal(q.quoteType, "standard");
  const html = await (await fetch(`${base}/CLQ-S1/accept`)).text();
  assert.ok(html.includes("When should we come?"));
});
