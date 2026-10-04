// End-to-end test of the AI receptionist's send_quote tool against a throwaway MongoDB.
// Emails are replaced by a stand-in, so nothing is sent.
//
//   node --test tests/e2e/*.test.js
//
// The first run downloads a MongoDB binary (~70 MB) into ~/.cache/mongodb-binaries.
const test = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const sentEmails = [];
const emailService = require("../../utils/emailService");
emailService.sendEmail = async (msg) => {
  sentEmails.push(msg);
  return true;
};

const Service = require("../../models/Service");
const Quote = require("../../models/Quote");
const Lead = require("../../models/Lead");
const Booking = require("../../models/Booking");
const AiSettings = require("../../models/AiSettings");
const { makeToolRunner } = require("../../utils/aiTools");

let mongod;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Service.insertMany([
    { name: "Deep Clean", region: "UK", rate: 30.85, type: "hourly", category: "Base" },
    { name: "Single Oven Cleaning", region: "UK", rate: 62.5, type: "flat", category: "Extras" },
  ]);
  await Booking.create({
    bookingId: "BK-9",
    service: "x",
    schedule: { date: new Date("2030-05-02"), timeSlot: "Flexible", preferredTime: "09:00" },
    details: { duration: 3 },
    status: "Confirmed",
  });
});
test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const run = makeToolRunner({ phone: "+447700900123" });
const args = {
  customerName: "Jane Smith",
  email: "Jane@Example.com",
  phone: "07911 123456",
  address: "12 Oak Road, Manchester M14 5TQ",
  services: [{ service: "deep clean", hours: 3, description: "2 bed flat, kitchen and bathroom focus" }],
  extras: [{ name: "Single Oven Cleaning" }],
  suppliesProvidedBy: "Cleaniq",
  frequency: "once",
  customerConfirmed: false,
};

test("preview uses the Quote Builder maths (VAT 20% on by default) and sends nothing", async () => {
  const r = await run("send_quote", args);
  assert.equal(r.preview, true);
  assert.equal(r.subtotal, 165.05); // 3 × 30.85 + 62.50 + £10 supplies
  assert.equal(r.vat, 33.01);
  assert.equal(r.grandTotal, 198.06);
  assert.equal(r.lines.length, 3);
  assert.equal(sentEmails.length, 0);
  assert.equal(await Quote.countDocuments(), 0);
});

test("VAT can be switched off in AI Settings", async () => {
  await AiSettings.get();
  await AiSettings.updateOne({ key: "default" }, { $set: { quoteIncludeVat: false } });
  try {
    const r = await run("send_quote", args);
    assert.equal(r.vat, 0);
    assert.equal(r.grandTotal, 165.05);
  } finally {
    await AiSettings.updateOne({ key: "default" }, { $set: { quoteIncludeVat: true } });
  }
});

test("customer details are required: name, email, phone and address", async () => {
  let r = await run("send_quote", { ...args, phone: undefined });
  assert.match(r.error, /their phone number/);
  r = await run("send_quote", { ...args, phone: "12" });
  assert.match(r.error, /valid phone number/);
  r = await run("send_quote", { ...args, email: "nope", suppliesProvidedBy: undefined, customerName: "" });
  assert.match(r.error, /valid email/);
  assert.match(r.error, /supplies/);
  assert.match(r.error, /their name/);
  r = await run("send_quote", { ...args, address: "" });
  assert.match(r.error, /property address/);
});

test("never invents a price for a service we don't list", async () => {
  const r = await run("send_quote", { ...args, services: [{ service: "After Builders Clean", hours: 5 }] });
  assert.match(r.error, /don't have a set price/);
});

test("a preferred time that clashes with an existing booking is refused", async () => {
  const r = await run("send_quote", { ...args, serviceDate: "2030-05-02", time: "10am" });
  assert.match(r.error, /not available/);
});

test("after YES it's sent through the Quote Builder code: saved, emailed with admin copy, lead captured", async () => {
  const r = await run("send_quote", {
    ...args,
    frequency: "monthly",
    companyName: "Oak Lettings Ltd",
    serviceDate: "2030-05-02",
    time: "1pm",
    customerConfirmed: true,
  });
  const q = await Quote.findOne({ quoteRef: r.quoteRef }).lean();
  assert.ok(q);
  assert.equal(q.status, "sent");
  assert.equal(q.companyName, "Oak Lettings Ltd");
  assert.equal(q.contactName, "Jane Smith");
  assert.equal(q.email, "jane@example.com");
  assert.equal(q.phone, "+447911123456");
  assert.equal(q.address, "12 Oak Road, Manchester M14 5TQ");
  assert.equal(q.grandTotal, 198.06);
  assert.equal(q.includeVat, true);
  assert.equal(q.paymentTerms, "Net 30");
  assert.equal(q.validDays, 30);
  assert.equal(q.frequency, "monthly");
  assert.equal(q.serviceDate, "2030-05-02");
  assert.equal(q.serviceTimeSlot, "13:00");
  assert.equal(q.items[0].billingType, "hourly");
  assert.equal(q.items[0].qty, 3);
  // Extras and supplies are add-ons on the service (like the admin Quote Builder), not services.
  assert.equal(q.items.length, 1);
  assert.deepEqual(q.items[0].extras.map((e) => e.name), ["Single Oven Cleaning", "Cleaning supplies & equipment"]);
  assert.equal(sentEmails.length, 2); // customer + admin copy
  assert.equal(sentEmails[0].to, "jane@example.com");
  assert.equal(await Lead.countDocuments({ email: "jane@example.com" }), 1);
  assert.match(r.nextStep, /emailed to jane@example.com/);
  assert.equal(r.when, "2030-05-02 1pm–4pm");
});

test("only the frequencies offered for a service: a deep clean can't be weekly", async () => {
  const r = await run("send_quote", { ...args, frequency: "weekly" });
  assert.match(r.error, /isn't offered weekly.*monthly, every 3 months/);
});

test("at most 3 AI quotes per phone per day", async () => {
  await run("send_quote", { ...args, customerConfirmed: true });
  await run("send_quote", { ...args, customerConfirmed: true });
  const r = await run("send_quote", { ...args, customerConfirmed: true });
  assert.match(r.error, /Several quotes/);
});

test("chat test mode doesn't email or save", async () => {
  const dry = makeToolRunner({ phone: "+447911000000", dryRun: true });
  const before = await Quote.countDocuments();
  const emailsBefore = sentEmails.length;
  const r = await dry("send_quote", { ...args, phone: "07911 000000", customerConfirmed: true });
  assert.equal(r.dryRun, true);
  assert.equal(await Quote.countDocuments(), before);
  assert.equal(sentEmails.length, emailsBefore);
});
