const ScheduledTask = require("../models/ScheduledTask");
const SystemSetting = require("../models/SystemSetting");
const Customer = require("../models/Customer");
const Booking = require("../models/Booking");
const { sendEmail, automationTemplates } = require("./emailService");
// Phone notification for a booking reminder (task.payload.bookingId is the booking's _id).
async function remindByPush(task, title, body) {
  const { bookingId, bookingRef, email } = task.payload || {};
  if (!email) return;
  await require("./pushNotifications").pushToBookingCustomer(
    { _id: bookingId, bookingId: bookingRef, customer: { email } }, title, body, { type: "reminder" },
  ).catch(() => {});
}
const sms = require("./smsService");

const GOOGLE_REVIEW_URL = "https://g.page/r/cleaniqservices/review";

// Check if a specific automation type is enabled (default: true)
async function isEnabled(type) {
  try {
    const setting = await SystemSetting.findOne({ key: `automation_${type}` });
    if (!setting) return true; // default on
    return setting.value !== false;
  } catch {
    return true;
  }
}

// Why a quote follow-up ("still thinking about it?", "following up", the 10% win-back) shouldn't
// go out, or null if it should. Stops once the customer has answered — this quote accepted or
// declined, or ANY quote to the same email accepted, or a booking made, since this one was sent
// (an edited quote is sent as a new quote, so the old one's follow-ups must stop too).
const QUOTE_FOLLOWUPS = ["quote_followup_24h", "quote_followup_3d", "lost_lead_7d"];
async function quoteFollowupStopReason(task) {
  if (!QUOTE_FOLLOWUPS.includes(task.type)) return null;
  const Quote = require("../models/Quote");
  const { quoteId, quoteRef, email } = task.payload || {};
  const quote = quoteId
    ? await Quote.findById(quoteId).lean().catch(() => null)
    : quoteRef ? await Quote.findOne({ quoteRef }).lean().catch(() => null) : null;
  if ((quoteId || quoteRef) && !quote) return "Quote was deleted";
  if (quote && ["accepted", "booked"].includes(quote.status)) return "Quote was accepted";
  if (quote?.status === "declined") return "Customer declined the quote";
  if (!email) return null;
  const since = quote?.createdAt || task.createdAt || new Date(0);
  const re = new RegExp(`^${String(email).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  if (await Quote.exists({ email: re, status: { $in: ["accepted", "booked"] }, acceptedAt: { $gte: since } })) {
    return "Customer accepted another quote";
  }
  if (await Booking.exists({ "customer.email": re, createdAt: { $gte: since }, status: { $nin: ["Cancelled", "Rejected"] } })) {
    return "Customer has booked since";
  }
  return null;
}

// Stop every quote follow-up still waiting for this customer (called when a quote is accepted).
async function cancelQuoteFollowups(email, reason = "Quote accepted") {
  if (!email) return 0;
  const re = new RegExp(`^${String(email).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  const r = await ScheduledTask.updateMany(
    { status: "pending", type: { $in: QUOTE_FOLLOWUPS }, "payload.email": re },
    { $set: { status: "cancelled", error: reason, executedAt: new Date() } },
  );
  return r.modifiedCount || 0;
}

// Handlers per task type
const handlers = {
  // The AI receptionist's WhatsApp chat has gone quiet: email the team (utils/aiFinishedAlerts.js).
  ai_chat_finished: async (task) => {
    await require("./aiFinishedAlerts").sendChatFinishedAlert(task);
  },

  booking_reminder_24h: async (task) => {
    const { email, firstName, service, date, time, bookingRef, amount, bookingDateTime } = task.payload;
    // Guard: if appointment is now less than 4 hours away this reminder is stale — skip it
    if (bookingDateTime) {
      const apptMs = new Date(bookingDateTime).getTime();
      if (apptMs - Date.now() < 4 * 60 * 60 * 1000) return;
    }
    // Determine "today" vs "tomorrow" based on UK date at fire time
    let when = "tomorrow";
    if (bookingDateTime) {
      const apptUKDate = new Date(bookingDateTime).toLocaleDateString("en-GB", { timeZone: "Europe/London" });
      const nowUKDate  = new Date().toLocaleDateString("en-GB", { timeZone: "Europe/London" });
      if (apptUKDate === nowUKDate) when = "today";
    }
    await sendEmail({
      to: email,
      subject: `Reminder: Your ${service} clean is ${when}`,
      html: automationTemplates.bookingReminder24h({ firstName, service, date, time, bookingRef, amount, when }),
    });
    await remindByPush(task, `Your clean is ${when}`, `${service}${time ? ` at ${time}` : ""}. See you then!`);
    // Also send SMS reminder
    if (task.payload.bookingId) {
      try {
        const booking = await Booking.findById(task.payload.bookingId);
        if (booking) await sms.triggerBookingReminder24h(booking);
      } catch (err) {
        console.error("SMS 24h reminder error:", err.message);
      }
    }
  },

  booking_reminder_3h: async (task) => {
    const { email, firstName, service, date, time, bookingRef, bookingDateTime } = task.payload;
    // Guard: if appointment has already passed, skip
    if (bookingDateTime && new Date(bookingDateTime).getTime() < Date.now()) return;
    await sendEmail({
      to: email,
      subject: `Your cleaner arrives in approximately 3 hours`,
      html: automationTemplates.bookingReminder3h({ firstName, service, date, time, bookingRef }),
    });
    await remindByPush(task, "Your cleaner arrives in about 3 hours", `${service}${time ? ` at ${time}` : ""}.`);
  },

  booking_reminder_1h: async (task) => {
    const { email, firstName, service, date, time, bookingRef, bookingDateTime } = task.payload;
    // Guard: if appointment has already passed, skip
    if (bookingDateTime && new Date(bookingDateTime).getTime() < Date.now()) return;
    await sendEmail({
      to: email,
      subject: `Your cleaner arrives in 1 hour! ⏰`,
      html: automationTemplates.bookingReminder1h({ firstName, service, date, time, bookingRef }),
    });
    await remindByPush(task, "Your cleaner arrives in 1 hour ⏰", `${service}${time ? ` at ${time}` : ""}.`);
  },

  review_request_2h: async (task) => {
    const { email, firstName, service } = task.payload;
    await sendEmail({
      to: email,
      subject: `How was your ${service} clean? Leave us a review`,
      html: automationTemplates.reviewRequest({ firstName, service, reviewUrl: GOOGLE_REVIEW_URL }),
    });
  },

  referral_offer_48h: async (task) => {
    const { email, firstName } = task.payload;
    await sendEmail({
      to: email,
      subject: `Share Cleaniq with a friend — you both save!`,
      html: automationTemplates.referralOffer({ firstName }),
    });
  },

  rebooking_discount_3d: async (task) => {
    const { email, firstName, service } = task.payload;
    await sendEmail({
      to: email,
      subject: `Ready for your next clean? Here's 10% off`,
      html: automationTemplates.rebookingDiscount({ firstName, service }),
    });
  },

  quote_followup_24h: async (task) => {
    const { email, firstName, service, quoteRef, amount } = task.payload;
    if (await quoteFollowupStopReason(task)) return;
    await sendEmail({
      to: email,
      subject: `Still thinking about it? Your Cleaniq quote is ready`,
      html: automationTemplates.quoteFollowup24h({ firstName, service, quoteRef, amount }),
    });
  },

  quote_followup_3d: async (task) => {
    const { email, firstName, service, quoteRef, amount } = task.payload;
    if (await quoteFollowupStopReason(task)) return;
    await sendEmail({
      to: email,
      subject: `Following up on your Cleaniq quote`,
      html: automationTemplates.quoteFollowup3d({ firstName, service, quoteRef, amount }),
    });
  },

  lost_lead_7d: async (task) => {
    const { email, firstName, service, quoteRef } = task.payload;
    if (await quoteFollowupStopReason(task)) return;
    await sendEmail({
      to: email,
      subject: `${firstName}, your 10% discount expires soon`,
      html: automationTemplates.lostLead7d({ firstName, service, quoteRef }),
    });
  },

  followup_1w: async (task) => {
    const { email, firstName, service } = task.payload;
    await sendEmail({
      to: email,
      subject: `Following up — how's your space looking, ${firstName}?`,
      html: automationTemplates.followup1w({ firstName, service }),
    });
  },

  followup_2w: async (task) => {
    const { email, firstName, service } = task.payload;
    await sendEmail({
      to: email,
      subject: `Quick check-in from cleaniq services`,
      html: automationTemplates.followup2w({ firstName, service }),
    });
  },

  followup_1m: async (task) => {
    const { email, firstName, service } = task.payload;
    await sendEmail({
      to: email,
      subject: `A month on — time for your next clean?`,
      html: automationTemplates.followup1m({ firstName, service }),
    });
  },

  followup_2m: async (task) => {
    const { email, firstName } = task.payload;
    await sendEmail({
      to: email,
      subject: `Checking back in — cleaniq services`,
      html: automationTemplates.followup2m({ firstName }),
    });
  },

  followup_3m: async (task) => {
    const { email, firstName } = task.payload;
    await sendEmail({
      to: email,
      subject: `We're still here whenever you need us, ${firstName}`,
      html: automationTemplates.followup3m({ firstName }),
    });
  },
};

const BEFORE_CLEAN = ["booking_reminder_24h", "booking_reminder_3h", "booking_reminder_1h"];
const AFTER_CLEAN = ["review_request_2h", "referral_offer_48h", "rebooking_discount_3d"];

// Why a booking email shouldn't be sent any more, or null if it should.
async function staleBookingReason(task) {
  const isBefore = BEFORE_CLEAN.includes(task.type);
  const isAfter = AFTER_CLEAN.includes(task.type);
  const id = task.payload?.bookingId;
  if ((!isBefore && !isAfter) || !id) return null;
  const booking = await Booking.findById(id).select("status schedule.date").lean().catch(() => null);
  if (!booking) return "Booking no longer exists";
  if (["Cancelled", "Rejected"].includes(booking.status)) return `Booking is ${booking.status.toLowerCase()}`;
  if (isBefore && ["Completed", "Completed - Unpaid"].includes(booking.status)) return "Booking is already completed";
  // Rescheduled to another day: this reminder was for the old date.
  const when = task.payload?.bookingDateTime || task.payload?.date;
  if (isBefore && booking.schedule?.date && task.payload?.bookingDateTime) {
    const uk = (d) => new Date(d).toLocaleDateString("en-GB", { timeZone: "Europe/London" });
    if (uk(booking.schedule.date) !== uk(when)) return "Booking was moved to another date";
  }
  return null;
}

async function processDueTasks() {
  const now = new Date();
  const tasks = await ScheduledTask.find({
    status: "pending",
    runAt: { $lte: now },
  }).limit(20);

  for (const task of tasks) {
    const enabled = await isEnabled(task.type);
    if (!enabled) {
      task.status = "cancelled";
      await task.save();
      continue;
    }

    // Check if this customer has opted out of CRM emails
    if (task.payload?.email) {
      const customer = await Customer.findOne(
        { email: task.payload.email.toLowerCase() },
        "crmEmailsEnabled"
      ).catch(() => null);
      if (customer && customer.crmEmailsEnabled === false) {
        task.status = "cancelled";
        task.error = "CRM emails disabled for this customer";
        task.executedAt = new Date();
        await task.save();
        continue;
      }
    }

    // Booking emails only go out while the booking is still going ahead: a cancelled booking
    // (by the customer, in the app or by admin) never gets "your cleaner arrives soon".
    const stale = (await staleBookingReason(task)) || (await quoteFollowupStopReason(task));
    if (stale) {
      task.status = "cancelled";
      task.error = stale;
      task.executedAt = new Date();
      await task.save();
      continue;
    }

    task.attempts += 1;
    const handler = handlers[task.type];

    if (!handler) {
      task.status = "failed";
      task.error = `No handler for type: ${task.type}`;
      task.executedAt = new Date();
      await task.save();
      continue;
    }

    try {
      await handler(task);
      task.status = "sent";
      task.executedAt = new Date();
    } catch (err) {
      task.error = err.message;
      if (task.attempts >= 3) {
        task.status = "failed";
      }
      // else leave as pending to retry next cycle
    }
    await task.save();
  }
}

let coldEmailTick = 0;

function startAutomationEngine() {
  console.log("⚙️  Automation engine started — checking every 2 minutes");

  const tick = async () => {
    await processDueTasks();

    // Cold email sends — every tick (2 min)
    try {
      const { processColdEmailSends } = require("./coldEmailEngine");
      await processColdEmailSends();
    } catch (e) {
      console.error("Cold email send error:", e.message);
    }

    // Reply detection — every 5th tick (~10 min) to avoid Gmail API quota
    coldEmailTick++;
    if (coldEmailTick % 5 === 0) {
      try {
        const { detectReplies } = require("./coldEmailEngine");
        await detectReplies();
      } catch (e) {
        console.error("Reply detection error:", e.message);
      }
    }
  };

  tick(); // run immediately on startup
  setInterval(tick, 2 * 60 * 1000);
}

// Schedule a task (idempotent — won't duplicate for same booking/quote + type)
async function scheduleTask(type, runAt, payload) {
  try {
    // Build a dedup filter using only the key that's actually present
    const dedupFilter = { type, status: "pending" };
    if (payload.bookingRef) dedupFilter["payload.bookingRef"] = payload.bookingRef;
    else if (payload.quoteRef) dedupFilter["payload.quoteRef"] = payload.quoteRef;

    if (payload.bookingRef || payload.quoteRef) {
      const exists = await ScheduledTask.findOne(dedupFilter);
      if (exists) return exists;
    }
    return await ScheduledTask.create({ type, runAt, payload });
  } catch (err) {
    console.error("scheduleTask error:", err.message);
  }
}

// Run a task handler immediately (used by manual-send and resend routes)
async function runTaskNow(type, payload) {
  const handler = handlers[type];
  if (!handler) throw new Error(`No handler for type: ${type}`);
  await handler({ type, payload, attempts: 1 });
}

// Replace a booking's "your clean is coming up" reminders (24h, 3h, 1h before) — used when a
// booking is moved. Old reminders are cancelled; new ones are only queued while it's going ahead.
async function rescheduleBookingReminders(booking) {
  const id = String(booking._id);
  await ScheduledTask.updateMany(
    { status: "pending", type: { $in: BEFORE_CLEAN }, "payload.bookingId": id },
    { $set: { status: "cancelled", error: "Booking was moved", executedAt: new Date() } },
  );
  const goingAhead = booking.noPaymentRequired || ["Confirmed", "Authorized", "Accepted", "Assigned"].includes(booking.status);
  if (!goingAhead || !booking.schedule?.date || !booking.customer?.email) return 0;
  const { buildBookingDateTime } = require("./bookingDateTime");
  const at = buildBookingDateTime(booking.schedule.date, booking.schedule.timeSlot, booking.schedule.preferredTime);
  if (!at || at <= new Date()) return 0;
  const payload = {
    bookingId: id,
    bookingRef: booking.bookingId,
    email: booking.customer.email,
    firstName: booking.customer.firstName,
    service: booking.service,
    date: at.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" }),
    time: at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }),
    bookingDateTime: at.toISOString(),
    amount: booking.payment?.amount,
  };
  const MIN_LEAD = 15 * 60 * 1000;
  let n = 0;
  for (const [type, hours] of [["booking_reminder_24h", 24], ["booking_reminder_3h", 3], ["booking_reminder_1h", 1]]) {
    const runAt = at.getTime() - hours * 3600 * 1000;
    if (runAt > Date.now() + MIN_LEAD) {
      await ScheduledTask.create({ type, runAt: new Date(runAt), payload });
      n++;
    }
  }
  return n;
}

module.exports = { startAutomationEngine, scheduleTask, runTaskNow, rescheduleBookingReminders, processDueTasks, staleBookingReason, quoteFollowupStopReason, cancelQuoteFollowups };
