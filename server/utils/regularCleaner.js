// The regular cleaner of a regular clean (weekly / fortnightly / monthly).
//
// The first cleaner to accept one of its visits — or the one admin assigns — becomes its regular
// cleaner. From then on each visit is given straight to them the moment it's paid (24 hours
// before), instead of being offered to everyone. They can drop a single date (it's offered to
// other cleaners for that date only) or stop being the regular cleaner.
const mongoose = require("mongoose");

const Subscription = () => mongoose.model("Subscription");
const Booking = () => mongoose.model("Booking");
const Worker = () => mongoose.model("Worker");

const subIdOf = (booking) => booking?.meta?.subscriptionId || null;

// A cleaner accepted (or admin assigned) a visit: they become the regular cleaner if there isn't one.
async function claimRegular(booking, workerId, workerName, { replace = false } = {}) {
  const subId = subIdOf(booking);
  if (!subId || !workerId) return null;
  const filter = replace ? { _id: subId } : { _id: subId, $or: [{ "regularWorker.id": null }, { "regularWorker.id": { $exists: false } }] };
  const r = await Subscription().findOneAndUpdate(
    filter,
    { $set: { regularWorker: { id: workerId, name: workerName || "", since: new Date() } } },
    { new: true },
  );
  return r;
}

/**
 * A paid (Confirmed) visit of a regular clean: give it to the regular cleaner. Returns true if
 * it was given (then it isn't announced to everyone).
 */
async function giveToRegularWorker(booking) {
  const subId = subIdOf(booking);
  if (!subId || booking.assignedWorker || booking.meta?.regularDropped) return false;
  const sub = await Subscription().findById(subId).lean();
  const regular = sub?.regularWorker;
  if (!regular?.id) return false;
  const worker = await Worker().findOne({ _id: regular.id, status: "Active" }).lean();
  if (!worker) return false;
  const name = regular.name || `${worker.firstName || ""} ${worker.lastName || ""}`.trim();
  const given = await Booking().findOneAndUpdate(
    { _id: booking._id, assignedWorker: null, status: { $in: ["Confirmed", "Authorized", "Accepted"] } },
    { $set: { assignedWorker: worker._id, assignedWorkerName: name, status: "Assigned", jobAcceptedTime: new Date(), jobAnnouncedAt: new Date() } },
    { new: true },
  );
  if (!given) return false;
  try {
    await require("./topRatedBonus").applyBonus(given, worker._id);
    await given.save();
  } catch {}
  // Tell the cleaner to go: app notification, push and email.
  const msg = `✅ Go: ${whenText(given)} — ${given.customer?.firstName || "your customer"}'s ${given.service}${areaOf(given) ? ` in ${areaOf(given)}` : ""}. Paid and confirmed.`;
  await mongoose.model("Notification").create({ workerId: worker._id, title: "Your regular clean is confirmed", message: msg, type: "job", bookingId: given.bookingId }).catch(() => {});
  require("./pushNotifications").sendPushToUser("worker", worker._id, "✅ Go — your regular clean is confirmed", msg, { type: "job_assigned", bookingId: given.bookingId }, { channelId: "cleaniq-jobs" }).catch(() => {});
  if (worker.email) {
    const { sendEmail, templates } = require("./emailService");
    sendEmail({
      to: worker.email,
      subject: `✅ Confirmed — please go: ${given.service} ${whenText(given)}`,
      html: templates.staffShiftAssigned(given, worker),
    }).catch(() => {});
  }
  console.log(`🔁 ${given.bookingId} given to regular cleaner ${name}`);
  return true;
}

const whenText = (b) => {
  const d = b.schedule?.date ? new Date(b.schedule.date) : null;
  if (!d) return "";
  const ukDay = (x) => new Date(x).toLocaleDateString("en-CA", { timeZone: "Europe/London" });
  const rel = ukDay(d) === ukDay(new Date()) ? "today" : ukDay(d) === ukDay(new Date(Date.now() + 86400000)) ? "tomorrow" : "";
  const date = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const time = b.schedule?.preferredTime || b.schedule?.timeSlot || "";
  return `${rel ? `${rel} (${date})` : date}${time ? ` at ${time}` : ""}`;
};
const areaOf = (b) => {
  const m = String(b.details?.address || "").match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b/i);
  return m ? m[1].toUpperCase() : "";
};

/** Tell a regular clean's cleaner NOT to go (a date cancelled, or the regular clean stopped). */
async function tellRegularDontGo(subId, message) {
  const sub = await Subscription().findById(subId).select("regularWorker").lean();
  const id = sub?.regularWorker?.id;
  if (!id) return false;
  await mongoose.model("Notification").create({ workerId: id, title: "❌ Don't go", message, type: "job" }).catch(() => {});
  require("./pushNotifications").sendPushToUser("worker", id, "❌ Don't go", message, { type: "job_cancelled" }).catch(() => {});
  return true;
}

// The regular cleaner stops: future visits not started go back to other cleaners.
async function dropRegular(booking, workerId) {
  const subId = subIdOf(booking);
  if (!subId) return { error: "This isn't a regular clean." };
  const sub = await Subscription().findById(subId);
  if (!sub || String(sub.regularWorker?.id || "") !== String(workerId)) return { error: "You're not the regular cleaner for this." };
  sub.regularWorker = { id: null, name: "", since: null };
  await sub.save();
  const future = await Booking().find({
    "meta.subscriptionId": subId, assignedWorker: workerId, status: "Assigned", jobArrivedTime: null,
  });
  for (const v of future) {
    v.assignedWorker = null;
    v.assignedWorkerName = null;
    v.status = "Confirmed";
    v.jobAcceptedTime = null;
    v.jobAnnouncedAt = null;
    await v.save();
    await require("./jobAnnounce").announceNewJob(v); // offered to other cleaners
  }
  return { released: future.length };
}

// A plain description of how often, for the job details: "every Tuesday at 10:00".
function everyText(sub) {
  const wd = sub.startDate ? new Date(sub.startDate).toLocaleDateString("en-GB", { weekday: "long", timeZone: "Europe/London" }) : "";
  const time = sub.template?.schedule?.preferredTime || sub.template?.schedule?.timeSlot || "";
  const every = sub.frequency === "Weekly" ? `every ${wd}` : sub.frequency === "Fortnightly" ? `every other ${wd}` : sub.frequency === "Quarterly" ? "every 3 months" : "every month";
  return `${every}${time ? ` at ${time}` : ""}`;
}

/** The regular-clean part of a job's details, for the worker app. */
async function regularInfo(booking, workerId) {
  const subId = subIdOf(booking);
  if (!subId) return null;
  const sub = await Subscription().findById(subId).lean();
  if (!sub) return null;
  const visits = await require("./subscriptions").visitsFor(sub);
  const assigned = await Booking().find({ _id: { $in: visits.map((v) => v._id) } }).select("assignedWorker").lean();
  const byId = new Map(assigned.map((b) => [String(b._id), b.assignedWorker ? String(b.assignedWorker) : ""]));
  const mineId = workerId ? String(workerId) : "";
  return {
    subscriptionRef: sub.subscriptionRef,
    frequency: sub.frequency,
    every: everyText(sub),
    status: sub.status,
    regularWorker: sub.regularWorker?.id ? { id: String(sub.regularWorker.id), name: sub.regularWorker.name } : null,
    isRegularCleaner: Boolean(mineId && sub.regularWorker?.id && String(sub.regularWorker.id) === mineId),
    visits: visits
      .filter((v) => v.state !== "cancelled")
      .map((v) => ({
        bookingId: v.bookingId,
        _id: v._id,
        date: v.date,
        time: v.time,
        state: v.state, // confirmed (paid) | charged_before (paid 24h before) | awaiting_first_payment | payment_needed | done
        mine: Boolean(mineId && byId.get(String(v._id)) === mineId),
        current: String(v._id) === String(booking._id),
      })),
  };
}

module.exports = { claimRegular, giveToRegularWorker, dropRegular, regularInfo, tellRegularDontGo, whenText };
