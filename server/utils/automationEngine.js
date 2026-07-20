const ScheduledTask = require("../models/ScheduledTask");
const SystemSetting = require("../models/SystemSetting");
const Customer = require("../models/Customer");
const Booking = require("../models/Booking");
const { sendEmail, automationTemplates } = require("./emailService");
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

// Handlers per task type
const handlers = {
  booking_reminder_24h: async (task) => {
    const { email, firstName, service, date, bookingRef, amount } = task.payload;
    await sendEmail({
      to: email,
      subject: `Reminder: Your ${service} clean is tomorrow`,
      html: automationTemplates.bookingReminder24h({ firstName, service, date, bookingRef, amount }),
    });
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
    const { email, firstName, service, date, bookingRef } = task.payload;
    await sendEmail({
      to: email,
      subject: `Your cleaner arrives in approximately 3 hours`,
      html: automationTemplates.bookingReminder3h({ firstName, service, date, bookingRef }),
    });
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
    // Cancel if they've since booked (quote converted to booking)
    const { quoteId } = task.payload;
    if (quoteId) {
      const Quote = require("../models/Quote");
      const quote = await Quote.findById(quoteId).catch(() => null);
      if (quote?.status === "accepted" || quote?.status === "booked") return;
    }
    await sendEmail({
      to: email,
      subject: `Still thinking about it? Your Cleaniq quote is ready`,
      html: automationTemplates.quoteFollowup24h({ firstName, service, quoteRef, amount }),
    });
  },

  quote_followup_3d: async (task) => {
    const { email, firstName, service, quoteRef, amount } = task.payload;
    if (task.payload.quoteId) {
      const Quote = require("../models/Quote");
      const quote = await Quote.findById(task.payload.quoteId).catch(() => null);
      if (quote?.status === "accepted" || quote?.status === "booked") return;
    }
    await sendEmail({
      to: email,
      subject: `Following up on your Cleaniq quote`,
      html: automationTemplates.quoteFollowup3d({ firstName, service, quoteRef, amount }),
    });
  },

  lost_lead_7d: async (task) => {
    const { email, firstName, service, quoteRef } = task.payload;
    if (task.payload.quoteId) {
      const Quote = require("../models/Quote");
      const quote = await Quote.findById(task.payload.quoteId).catch(() => null);
      if (quote?.status === "accepted" || quote?.status === "booked") return;
    }
    await sendEmail({
      to: email,
      subject: `${firstName}, your 10% discount expires soon`,
      html: automationTemplates.lostLead7d({ firstName, service, quoteRef }),
    });
  },
};

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

function startAutomationEngine() {
  console.log("⚙️  Automation engine started — checking every 2 minutes");
  processDueTasks(); // run immediately on startup
  setInterval(processDueTasks, 2 * 60 * 1000);
}

// Schedule a task (idempotent for booking reminders — won't duplicate)
async function scheduleTask(type, runAt, payload) {
  try {
    // Avoid duplicates for booking/quote-specific automations
    const keyField = payload.bookingRef || payload.quoteRef;
    if (keyField) {
      const exists = await ScheduledTask.findOne({
        type,
        "payload.bookingRef": payload.bookingRef,
        "payload.quoteRef": payload.quoteRef,
        status: "pending",
      });
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

module.exports = { startAutomationEngine, scheduleTask, runTaskNow };
