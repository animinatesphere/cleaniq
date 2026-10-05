// Splitting one job into shifts for several workers (admin → Rota).
//
// Each shift is its own booking assigned to one worker, with that worker's hours, start time and
// pay — so the worker app needs no changes: a worker just sees their own job. Shifts are hidden
// from the job feed and from the customer (no emails, reminders, invoices or £0 payments).
//
// The main booking is what the customer sees: "Your cleaners: Kelvin & Mary". It follows the
// shifts: Arrived when the first cleaner arrives (the customer is told then), In Progress when
// one starts, and Completed when the last shift finishes — then the customer's payment is taken
// and they get the "all done" message, exactly like a normal job.
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const { syncCompanyJob } = require("./companyJobs");

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const STARTED = ["Arrived", "In Progress", "Completed", "Completed - Unpaid"];
const DONE = ["Completed", "Completed - Unpaid"];

const names = (list) => {
  const first = list.map((w) => w.firstName).filter(Boolean);
  if (first.length <= 1) return first[0] || "";
  return `${first.slice(0, -1).join(", ")} & ${first[first.length - 1]}`;
};

async function shiftsOf(parentId) {
  return Booking.find({ parentBooking: parentId, isShift: true, status: { $ne: "Cancelled" } }).sort({ shiftNumber: 1 });
}

/**
 * Split a booking into shifts.
 * @param {object} parent  the main booking (mongoose doc)
 * @param {{workerId:string, start:string, hours:number, workerRate?:number}[]} shifts
 * @returns {Promise<{ shifts: object[] } | { error: string }>}
 */
async function splitIntoShifts(parent, shifts) {
  if (parent.isShift) return { error: "This is already a shift. Split the main booking instead." };
  if (["Cancelled", ...DONE, "Arrived", "In Progress"].includes(parent.status)) {
    return { error: `A ${parent.status.toLowerCase()} booking can't be split.` };
  }
  if (!Array.isArray(shifts) || shifts.length < 2 || shifts.length > 6) return { error: "Add between 2 and 6 shifts." };

  const workerIds = [];
  for (const [i, s] of shifts.entries()) {
    const n = i + 1;
    if (!mongoose.isValidObjectId(s.workerId)) return { error: `Shift ${n}: choose a worker.` };
    if (!TIME_RE.test(String(s.start || ""))) return { error: `Shift ${n}: start time must be like 09:00.` };
    const h = Number(s.hours);
    if (!(h > 0 && h <= 12)) return { error: `Shift ${n}: hours must be between 0.5 and 12.` };
    if (s.workerRate != null && s.workerRate !== "" && !(Number(s.workerRate) > 0)) return { error: `Shift ${n}: pay must be a positive amount.` };
    workerIds.push(String(s.workerId));
  }
  const workers = await Worker.find({ _id: { $in: workerIds } }).select("firstName lastName status expoPushToken pushTokens").lean();
  const byId = new Map(workers.map((w) => [String(w._id), w]));
  for (const [i, id] of workerIds.entries()) {
    if (!byId.has(id)) return { error: `Shift ${i + 1}: worker not found.` };
  }

  // Replace any earlier split, as long as none of it has started.
  const existing = await shiftsOf(parent._id);
  if (existing.some((s) => STARTED.includes(s.status))) return { error: "A shift has already started, so the split can't be changed." };
  if (existing.length) await Booking.deleteMany({ _id: { $in: existing.map((s) => s._id) } });

  // Pay: what admin typed for the shift, else the main booking's rate (without any top-rated bonus).
  const baseRate = (Number(parent.workerRate) || 0) - (Number(parent.workerRateBonus) || 0);
  const created = [];
  for (const [i, s] of shifts.entries()) {
    const w = byId.get(String(s.workerId));
    const hours = Math.round(Number(s.hours) * 100) / 100;
    created.push(await Booking.create({
      bookingId: `${parent.bookingId}-S${i + 1}`,
      customer: parent.customer,
      service: parent.service,
      details: { ...(parent.details || {}), duration: hours },
      property: parent.property,
      schedule: { date: parent.schedule?.date, timeSlot: s.start, preferredTime: s.start },
      payment: { amount: 0, currency: parent.payment?.currency || "GBP", status: "Not charged", billingType: "hourly" },
      region: parent.region,
      leadSource: parent.leadSource,
      suppliesProvidedBy: parent.suppliesProvidedBy,
      noPaymentRequired: true,
      skipConfirmationEmail: true,
      workerRate: Number(s.workerRate) > 0 ? Number(s.workerRate) : baseRate || null,
      workerDuration: hours,
      assignedWorker: w._id,
      assignedWorkerName: `${w.firstName} ${w.lastName}`.trim(),
      status: "Assigned",
      jobAcceptedTime: new Date(),
      hiddenFromWorkers: true, // never on the job feed; only the assigned worker sees it
      isShift: true,
      parentBooking: parent._id,
      shiftNumber: i + 1,
      meta: { shiftOf: parent.bookingId },
    }));
  }

  parent.splitIntoShifts = true;
  parent.hiddenFromWorkers = true;
  parent.assignedWorker = null;
  parent.assignedWorkerName = names(shifts.map((s) => byId.get(String(s.workerId))));
  // Unpaid (Pending) bookings stay Pending until paid; paid ones show as assigned.
  if (["Confirmed", "Authorized", "Accepted"].includes(parent.status)) parent.status = "Assigned";
  await parent.save();

  // Tell each worker about their shift.
  try {
    const Notification = require("../models/Notification");
    const { sendPushToUser } = require("./pushNotifications");
    const day = parent.schedule?.date
      ? new Date(parent.schedule.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
      : "";
    for (const shift of created) {
      const message = `${shift.service}${day ? ` on ${day}` : ""} at ${shift.schedule.timeSlot} for ${shift.workerDuration}h.`;
      await Notification.create({ workerId: shift.assignedWorker, title: "New shift assigned to you", message, type: "job", bookingId: shift.bookingId }).catch(() => {});
      sendPushToUser("worker", shift.assignedWorker, "New shift assigned to you", message, { type: "job_assigned", bookingId: shift.bookingId }, { channelId: "cleaniq-jobs" }).catch(() => {});
    }
  } catch {}
  return { shifts: created };
}

// Undo a split (only while no shift has started): the main booking goes back to one job.
async function removeShifts(parent) {
  const existing = await shiftsOf(parent._id);
  if (existing.some((s) => STARTED.includes(s.status))) return { error: "A shift has already started, so the split can't be removed." };
  await Booking.deleteMany({ _id: { $in: existing.map((s) => s._id) } });
  parent.splitIntoShifts = false;
  parent.hiddenFromWorkers = false;
  parent.assignedWorker = null;
  parent.assignedWorkerName = null;
  if (parent.status === "Assigned") parent.status = "Confirmed";
  await parent.save();
  return { removed: existing.length };
}

// A worker arrived for their shift. Returns the main booking if this is the FIRST arrival
// (so the customer is told, and a regular-clean visit is charged), otherwise null.
async function shiftArrived(shift) {
  const parent = await Booking.findById(shift.parentBooking);
  if (!parent) return null;
  const siblings = await shiftsOf(parent._id);
  const earlier = siblings.some((s) => String(s._id) !== String(shift._id) && s.jobArrivedTime);
  if (earlier || STARTED.includes(parent.status)) return null;
  parent.status = "Arrived";
  parent.jobArrivedTime = new Date();
  await parent.save();
  await syncCompanyJob(parent, { jobArrivedTime: parent.jobArrivedTime });
  return parent;
}

async function shiftStarted(shift) {
  const parent = await Booking.findById(shift.parentBooking);
  if (!parent || !["Assigned", "Arrived", "Confirmed"].includes(parent.status)) return;
  parent.status = "In Progress";
  parent.jobStartTime = parent.jobStartTime || new Date();
  await parent.save();
  await syncCompanyJob(parent, { jobStartTime: parent.jobStartTime });
}

// A shift finished. When it's the LAST one, the main booking is completed and returned (the
// caller then takes the payment and tells the customer); otherwise null.
async function shiftCompleted(shift) {
  const parent = await Booking.findById(shift.parentBooking);
  if (!parent || DONE.includes(parent.status)) return null;
  const siblings = await shiftsOf(parent._id);
  if (!siblings.every((s) => DONE.includes(s.status))) {
    if (!["In Progress"].includes(parent.status)) { parent.status = "In Progress"; await parent.save(); await syncCompanyJob(parent); }
    return null;
  }
  parent.status = "Completed";
  parent.jobEndTime = new Date();
  parent.jobStartTime = parent.jobStartTime || siblings[0]?.jobStartTime || null;
  parent.jobDurationActual = siblings.reduce((sum, s) => sum + (Number(s.jobDurationActual) || 0), 0);
  await parent.save();
  await syncCompanyJob(parent, { jobEndTime: parent.jobEndTime });
  return parent;
}

// "09:00", "9:30 AM", "2pm" → minutes after midnight (null if unreadable).
function toMinutes(t) {
  const m = String(t || "").trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = Number(m[1]) % 24;
  const ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + Number(m[2] || 0);
}
const toHHMM = (mins) => {
  const v = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};

// The main booking was rescheduled: move its unstarted shifts to the new day, keeping each
// shift's gap from the job's start time, and tell each worker their new time.
async function moveShifts(parent, { oldSlot, newSlot }) {
  const oldStart = toMinutes(oldSlot);
  const newStart = toMinutes(newSlot);
  const offset = oldStart != null && newStart != null ? newStart - oldStart : 0;
  const { sendPushToUser } = require("./pushNotifications");
  const Notification = require("../models/Notification");
  const day = new Date(parent.schedule.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  let moved = 0;
  for (const shift of await shiftsOf(parent._id)) {
    if (STARTED.includes(shift.status)) continue;
    const start = toMinutes(shift.schedule?.timeSlot);
    const time = start != null ? toHHMM(start + offset) : shift.schedule?.timeSlot;
    shift.schedule = { ...(shift.schedule?.toObject?.() || shift.schedule || {}), date: parent.schedule.date, timeSlot: time, preferredTime: time };
    await shift.save();
    moved++;
    const message = `${shift.service} is now on ${day} at ${time} for ${shift.workerDuration}h.`;
    await Notification.create({ workerId: shift.assignedWorker, title: "Your shift has moved", message, type: "job", bookingId: shift.bookingId }).catch(() => {});
    sendPushToUser("worker", shift.assignedWorker, "Your shift has moved", message, { type: "job_assigned", bookingId: shift.bookingId }, { channelId: "cleaniq-jobs" }).catch(() => {});
  }
  return moved;
}

module.exports = { splitIntoShifts, removeShifts, moveShifts, shiftsOf, shiftArrived, shiftStarted, shiftCompleted };
