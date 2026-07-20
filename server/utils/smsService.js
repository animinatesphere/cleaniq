const SmsLog = require("../models/SmsLog");
const SystemSetting = require("../models/SystemSetting");

// ── Helpers ────────────────────────────────────────────────────────────────
async function getTwilioClient() {
  const [sidSetting, tokenSetting] = await Promise.all([
    SystemSetting.findOne({ key: "twilio_account_sid" }),
    SystemSetting.findOne({ key: "twilio_auth_token" }),
  ]);
  const sid   = sidSetting?.value   || process.env.TWILIO_ACCOUNT_SID;
  const token = tokenSetting?.value || process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  const twilio = require("twilio");
  return twilio(sid, token);
}

async function getFromNumber() {
  const setting = await SystemSetting.findOne({ key: "twilio_phone_number" });
  return setting?.value || process.env.TWILIO_PHONE_NUMBER || "";
}

async function isTriggerEnabled(trigger) {
  const setting = await SystemSetting.findOne({ key: `sms_${trigger}` });
  if (!setting) return false; // SMS defaults OFF until credentials entered
  return setting.value !== false;
}

// ── Core send ──────────────────────────────────────────────────────────────
async function sendSms({ to, body, trigger, bookingId, bookingRef, recipient = "customer" }) {
  const log = await SmsLog.create({ to, body, trigger, bookingId, bookingRef, recipient, status: "pending" });

  try {
    const client = await getTwilioClient();
    if (!client) {
      await SmsLog.findByIdAndUpdate(log._id, { status: "failed", error: "Twilio not configured" });
      return { success: false, error: "Twilio not configured" };
    }

    const from = await getFromNumber();
    if (!from) {
      await SmsLog.findByIdAndUpdate(log._id, { status: "failed", error: "No sender number configured" });
      return { success: false, error: "No sender number" };
    }

    const message = await client.messages.create({ to, from, body });
    await SmsLog.findByIdAndUpdate(log._id, {
      status: "sent",
      twilioSid: message.sid,
      cost: message.price,
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    await SmsLog.findByIdAndUpdate(log._id, { status: "failed", error: err.message });
    return { success: false, error: err.message };
  }
}

// ── Templates ──────────────────────────────────────────────────────────────
const templates = {
  booking_confirmed: (b) =>
    `Hi ${b.firstName}, your ${b.service} clean is confirmed for ${b.date} at ${b.time}. Ref: ${b.bookingRef}. Questions? Call us on 0121 000 0000. — CleanIQ`,

  worker_assigned: (b) =>
    `Great news ${b.firstName}! ${b.workerName} has been assigned to your clean on ${b.date} at ${b.time}. Ref: ${b.bookingRef}. — CleanIQ`,

  booking_reminder_24h: (b) =>
    `Reminder: Your ${b.service} clean is tomorrow at ${b.time}. Please ensure access to the property. Ref: ${b.bookingRef}. Need help? Reply STOP to opt out. — CleanIQ`,

  booking_completed: (b) =>
    `Your clean is done! Thanks for choosing CleanIQ, ${b.firstName}. ⭐ Leave us a review: https://g.page/r/cleaniqservices/review — We hope to see you again!`,

  booking_cancelled: (b) =>
    `Your booking ${b.bookingRef} on ${b.date} has been cancelled. Contact us to rebook: 0121 000 0000. — CleanIQ`,

  worker_job_assigned: (b) =>
    `New job: ${b.customerName} at ${b.address} on ${b.date} at ${b.time}. Ref: ${b.bookingRef}. Log in for details. — CleanIQ`,
};

// ── Trigger functions (called from booking route) ──────────────────────────
async function triggerBookingConfirmed(booking) {
  if (!await isTriggerEnabled("booking_confirmed")) return;
  const phone = booking.customer?.phone;
  if (!phone) return;
  await sendSms({
    to: phone,
    body: templates.booking_confirmed({
      firstName:  booking.customer?.firstName || "there",
      service:    booking.service || "cleaning",
      date:       booking.schedule?.date || "",
      time:       booking.schedule?.preferredTime || "",
      bookingRef: booking.bookingId || "",
    }),
    trigger:    "booking_confirmed",
    bookingId:  booking._id?.toString(),
    bookingRef: booking.bookingId,
  });
}

async function triggerWorkerAssigned(booking, workerName) {
  if (!await isTriggerEnabled("worker_assigned")) return;
  const phone = booking.customer?.phone;
  if (!phone) return;
  await sendSms({
    to: phone,
    body: templates.worker_assigned({
      firstName:  booking.customer?.firstName || "there",
      workerName: workerName || "your cleaner",
      date:       booking.schedule?.date || "",
      time:       booking.schedule?.preferredTime || "",
      bookingRef: booking.bookingId || "",
    }),
    trigger:    "worker_assigned",
    bookingId:  booking._id?.toString(),
    bookingRef: booking.bookingId,
  });
}

async function triggerBookingReminder24h(booking) {
  if (!await isTriggerEnabled("booking_reminder_24h")) return;
  const phone = booking.customer?.phone;
  if (!phone) return;
  await sendSms({
    to: phone,
    body: templates.booking_reminder_24h({
      firstName:  booking.customer?.firstName || "there",
      service:    booking.service || "cleaning",
      time:       booking.schedule?.preferredTime || "",
      bookingRef: booking.bookingId || "",
    }),
    trigger:    "booking_reminder_24h",
    bookingId:  booking._id?.toString(),
    bookingRef: booking.bookingId,
  });
}

async function triggerBookingCompleted(booking) {
  if (!await isTriggerEnabled("booking_completed")) return;
  const phone = booking.customer?.phone;
  if (!phone) return;
  await sendSms({
    to: phone,
    body: templates.booking_completed({
      firstName: booking.customer?.firstName || "there",
    }),
    trigger:    "booking_completed",
    bookingId:  booking._id?.toString(),
    bookingRef: booking.bookingId,
  });
}

async function triggerBookingCancelled(booking) {
  if (!await isTriggerEnabled("booking_cancelled")) return;
  const phone = booking.customer?.phone;
  if (!phone) return;
  await sendSms({
    to: phone,
    body: templates.booking_cancelled({
      bookingRef: booking.bookingId || "",
      date:       booking.schedule?.date || "",
    }),
    trigger:    "booking_cancelled",
    bookingId:  booking._id?.toString(),
    bookingRef: booking.bookingId,
  });
}

async function triggerWorkerJobAssigned(booking, worker) {
  if (!await isTriggerEnabled("worker_job_assigned")) return;
  const phone = worker?.phone;
  if (!phone) return;
  await sendSms({
    to: phone,
    body: templates.worker_job_assigned({
      customerName: `${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim() || "Customer",
      address:      booking.details?.address || booking.address || "",
      date:         booking.schedule?.date || "",
      time:         booking.schedule?.preferredTime || "",
      bookingRef:   booking.bookingId || "",
    }),
    trigger:    "worker_job_assigned",
    bookingId:  booking._id?.toString(),
    bookingRef: booking.bookingId,
    recipient:  "worker",
  });
}

module.exports = {
  sendSms,
  isTriggerEnabled,
  triggerBookingConfirmed,
  triggerWorkerAssigned,
  triggerBookingReminder24h,
  triggerBookingCompleted,
  triggerBookingCancelled,
  triggerWorkerJobAssigned,
};
