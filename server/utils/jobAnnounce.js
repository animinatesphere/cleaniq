// Tell cleaners a job is available — only once it's confirmed (paid, or no payment needed), and
// only once per job. Unpaid (Pending / Awaiting Payment) jobs are never announced or shown in the
// worker app; they're announced the moment they're confirmed (payment, admin, regular-clean charge).
const ANNOUNCE_STATUSES = ["Confirmed", "Authorized", "Accepted"]; // same as the worker job feed

async function announceNewJob(booking) {
  try {
    if (!booking || booking.isShift || booking.assignedWorker || booking.hiddenFromWorkers) return 0;
    if (!ANNOUNCE_STATUSES.includes(booking.status)) return 0;
    if (booking.payment?.method === "Dev Mode") return 0;
    // A regular clean with a regular cleaner: the visit goes straight to them, not to everyone.
    if (await require("./regularCleaner").giveToRegularWorker(booking)) return 0;
    const Booking = require("../models/Booking");
    // Claim it atomically so two triggers at once can't announce it twice.
    const claimed = await Booking.updateOne({ _id: booking._id, jobAnnouncedAt: null }, { $set: { jobAnnouncedAt: new Date() } });
    if (!claimed.modifiedCount) return 0;

    const Worker = require("../models/Worker");
    const Notification = require("../models/Notification");
    const { workersForJob } = require("./offerMatching");
    const { sendEmail, templates } = require("./emailService");
    const { sendWorkersPush, tokensOf } = require("./pushNotifications");

    const active = await Worker.find({ status: "Active" }).lean();
    // Only cleaners the job suits (services, hours, travel area, pets) and the right region.
    const suitedIds = new Set((await workersForJob(booking, active.map((w) => ({ _id: w._id })))).map((w) => String(w._id)));
    const workers = active.filter((w) => suitedIds.has(String(w._id)) && (booking.region !== "NG" ? w.region !== "NG" : true));
    if (!workers.length) return 0;

    const dateStr = booking.schedule?.date
      ? new Date(booking.schedule.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
      : "TBC";
    const title = "New Job Available!";
    const body = `${booking.service} · ${dateStr}`;
    await Notification.insertMany(
      workers.map((w) => ({ workerId: w._id, title, message: body, type: "job", bookingId: booking.bookingId })),
      { ordered: false },
    ).catch(() => {});
    const tokens = workers.flatMap(tokensOf);
    if (tokens.length) await sendWorkersPush(tokens, { title, body, data: { type: "new_job", bookingId: booking.bookingId } }).catch(() => {});
    for (const w of workers) {
      if (!w.email) continue;
      await sendEmail({ to: w.email, subject: `🧹 New Job Alert: ${booking.service} is available!`, html: templates.staffNewJobAlert(booking) }).catch(() => {});
    }
    console.log(`📲 ${booking.bookingId}: ${workers.length} cleaners told about the new job`);
    return workers.length;
  } catch (e) {
    console.error("New job announcement error:", e.message);
    return 0;
  }
}

module.exports = { announceNewJob, ANNOUNCE_STATUSES };
