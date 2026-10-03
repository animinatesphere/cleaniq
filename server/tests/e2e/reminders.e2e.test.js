// "Your clean is coming up" reminders: never sent for a cancelled booking, and replaced when a
// booking is moved. Throwaway MongoDB; emails captured, not sent.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const emails = [];
require("../../utils/emailService").sendEmail = async (m) => { emails.push(m); return true; };
const sms = require("../../utils/smsService");
for (const k of Object.keys(sms)) if (typeof sms[k] === "function") sms[k] = async () => {};

const Booking = require("../../models/Booking");
const ScheduledTask = require("../../models/ScheduledTask");
const { processDueTasks, rescheduleBookingReminders } = require("../../utils/automationEngine");

let mongod;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
});
test.after(async () => { await mongoose.disconnect(); await mongod.stop(); });

const inDays = (n, hour = 10) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(hour, 0, 0, 0); return d; };
let n = 0;
const book = (over = {}) => Booking.create({
  bookingId: `BK-RM${++n}`, service: "Deep Cleaning", status: "Confirmed",
  customer: { firstName: "Ann", lastName: "Skinner", email: "ann@test.com" },
  schedule: { date: inDays(3), timeSlot: "10:00", preferredTime: "10:00" }, payment: { amount: 90 }, ...over,
});
// Make a booking's reminders due now.
const makeDue = (b) => ScheduledTask.updateMany({ "payload.bookingId": String(b._id), status: "pending" }, { runAt: new Date(Date.now() - 1000) });
const statuses = async (b) => (await ScheduledTask.find({ "payload.bookingId": String(b._id) }).sort({ runAt: 1 }).lean()).map((t) => [t.type, t.status]);

test("all three reminders (24h, 3h, 1h) are queued with the appointment time", async () => {
  const b = await book();
  assert.equal(await rescheduleBookingReminders(b), 3);
  const tasks = await ScheduledTask.find({ "payload.bookingId": String(b._id) }).lean();
  assert.deepEqual(tasks.map((t) => t.type).sort(), ["booking_reminder_1h", "booking_reminder_24h", "booking_reminder_3h"]);
  assert.equal(tasks[0].payload.time, "10:00");
  assert.ok(tasks[0].payload.bookingDateTime);
});

test("a cancelled booking gets no 'your cleaner is coming' emails", async () => {
  emails.length = 0;
  const b = await book();
  await rescheduleBookingReminders(b);
  await Booking.updateOne({ _id: b._id }, { status: "Cancelled" });
  await makeDue(b);
  await processDueTasks();
  assert.equal(emails.length, 0);
  assert.ok((await statuses(b)).every(([, s]) => s === "cancelled"));
});

test("a booking that's still on gets its reminder", async () => {
  emails.length = 0;
  const b = await book({ schedule: { date: inDays(0, 23), timeSlot: "23:00", preferredTime: "23:00" } });
  await ScheduledTask.create({ type: "booking_reminder_3h", runAt: new Date(Date.now() - 1000), payload: { bookingId: String(b._id), bookingRef: b.bookingId, email: "ann@test.com", firstName: "Ann", service: "Deep Cleaning", time: "23:00", bookingDateTime: new Date(Date.now() + 3600e3).toISOString() } });
  await processDueTasks();
  assert.equal(emails.length, 1);
  assert.match(emails[0].subject, /3 hours/);
});

test("moving a booking replaces its reminders with ones for the new date", async () => {
  const b = await book();
  await rescheduleBookingReminders(b);
  b.schedule = { date: inDays(6, 14), timeSlot: "14:00", preferredTime: "14:00" };
  await b.save();
  await rescheduleBookingReminders(b);
  const all = await ScheduledTask.find({ "payload.bookingId": String(b._id) }).lean();
  assert.equal(all.filter((t) => t.status === "cancelled").length, 3);
  const live = all.filter((t) => t.status === "pending");
  assert.equal(live.length, 3);
  assert.ok(live.every((t) => t.payload.time === "14:00"));
});

test("old reminders already queued for a booking that was moved another way are skipped", async () => {
  emails.length = 0;
  const b = await book();
  await rescheduleBookingReminders(b);
  await Booking.updateOne({ _id: b._id }, { "schedule.date": inDays(9) }); // date changed without replacing reminders
  await makeDue(b);
  await processDueTasks();
  assert.equal(emails.length, 0);
});
