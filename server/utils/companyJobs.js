// Company jobs (posted from the customer app) live as a Job the customer sees plus a
// Booking that admin and workers use. These helpers keep the two in step.
const Job = require("../models/Job");
const Worker = require("../models/Worker");
const Notification = require("../models/Notification");
const { sendWorkersPush } = require("./pushNotifications");

// Booking status → the Job status shown in the customer app.
const JOB_STATUS_FOR = {
  Pending: "pending_review",
  Confirmed: "approved",
  Authorized: "approved",
  Assigned: "assigned",
  Arrived: "assigned",
  "In Progress": "in_progress",
  Completed: "completed",
  "Completed - Unpaid": "completed",
  Cancelled: "cancelled",
  Rejected: "rejected",
};

// meta.jobId is the Job's _id, but older bookings stored its "JOB-XXXXXXXX" reference.
function jobFilter(ref) {
  const s = String(ref);
  return /^[a-f0-9]{24}$/i.test(s) ? { _id: s } : { jobId: s };
}

async function syncCompanyJob(booking, extra = {}) {
  const ref = booking?.meta?.jobId;
  if (!ref) return;
  const status = JOB_STATUS_FOR[booking.status];
  const update = { ...(status ? { status } : {}), ...extra };
  if (!Object.keys(update).length) return;
  try {
    await Job.updateOne(jobFilter(ref), update);
  } catch (e) {
    console.error(`Company job sync failed for ${booking.bookingId}:`, e.message);
  }
}

// Tell every active worker a job is up for grabs (in-app notification + push).
async function notifyWorkersNewJob(booking, title = "New Job Available!") {
  try {
    const dateStr = booking.schedule?.date
      ? new Date(booking.schedule.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
      : "TBC";
    const body = `${booking.service} · ${dateStr}`;
    // Only cleaners the job suits (services, hours, travel area, pets).
    const { workersForJob } = require("./offerMatching");
    const workers = await workersForJob(booking, await Worker.find({ status: "Active" }).select("_id").lean());
    if (!workers.length) return;
    await Notification.insertMany(
      workers.map((w) => ({ workerId: w._id, title, message: body, type: "job", bookingId: booking.bookingId })),
      { ordered: false },
    ).catch(() => {});
    const tokens = workers.map((w) => w.expoPushToken).filter(Boolean);
    if (tokens.length) {
      await sendWorkersPush(tokens, { title, body, data: { type: "new_job", bookingId: booking.bookingId } });
    }
  } catch (e) {
    console.error("New job worker notification error:", e.message);
  }
}

module.exports = { syncCompanyJob, notifyWorkersNewJob, JOB_STATUS_FOR };
