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

// ── Phone normalisation to E.164 ───────────────────────────────────────────
// Handles UK numbers stored without country code or with double-prefix.
// Default country: GB (+44). Extend the map for other countries if needed.
function normalizePhone(raw, defaultCountry = "GB") {
  if (!raw) return raw;
  // Strip whitespace, dashes, parentheses, dots
  let n = String(raw).replace(/[\s\-().]/g, "").trim();

  // Fix common double-prefix mistake: +4407... → +447...
  n = n.replace(/^\+440/, "+44");

  // UK numbers stored without country code: 07... → +447...
  if (/^0[1-9]\d{8,9}$/.test(n)) {
    n = "+44" + n.slice(1);
  }

  // If it already starts with + it's assumed E.164 — return as-is
  // If it starts with digits only and isn't handled above, prepend +44 as a last resort
  if (defaultCountry === "GB" && /^\d{10,11}$/.test(n)) {
    n = "+44" + (n.startsWith("0") ? n.slice(1) : n);
  }

  return n;
}

// ── Core send ──────────────────────────────────────────────────────────────
async function sendSms({ to, body, trigger, bookingId, bookingRef, recipient = "customer" }) {
  const normalizedTo = normalizePhone(to);
  const log = await SmsLog.create({ to: normalizedTo, body, trigger, bookingId, bookingRef, recipient, status: "pending" });

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

    const message = await client.messages.create({ to: normalizedTo, from, body });
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

// ── Date formatter ─────────────────────────────────────────────────────────
function fmtDate(raw) {
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  } catch { return String(raw); }
}

// ── Default templates (string with {placeholder} syntax, editable in admin) ─
const DEFAULT_TEMPLATES = {
  booking_confirmed:
    "Hi {firstName}, your {service} clean is confirmed for {date} at {time}. Ref: {bookingRef}. Questions? Call {bizPhone}. — Cleaniq Services",
  worker_assigned:
    "Great news {firstName}! {workerName} has been assigned to your clean on {date} at {time}. Ref: {bookingRef}. — Cleaniq Services",
  booking_reminder_24h:
    "Reminder: Your {service} clean is tomorrow at {time}. Please ensure access. Ref: {bookingRef}. Reply STOP to opt out. — Cleaniq Services",
  booking_completed:
    "Your clean is done! Thanks for choosing Cleaniq Services, {firstName}. Leave us a review: https://g.page/r/cleaniqservices/review",
  booking_cancelled:
    "Your booking {bookingRef} on {date} has been cancelled. To rebook call {bizPhone}. — Cleaniq Services",
  worker_job_assigned:
    "New job: {customerName} at {address} on {date} at {time}. Ref: {bookingRef}. Log in for details. — Cleaniq Services",
};

// Substitutes {key} placeholders with values from vars object
function renderTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ""));
}

// Load template from DB if admin has saved a custom version, else use default
async function getTemplate(key) {
  try {
    const s = await SystemSetting.findOne({ key: `sms_tpl_${key}` });
    if (s?.value) return s.value;
  } catch {}
  return DEFAULT_TEMPLATES[key] || "";
}

// Business contact number shown inside SMS messages
async function getBizPhone() {
  try {
    const s = await SystemSetting.findOne({ key: "business_phone" });
    return s?.value || "";
  } catch { return ""; }
}

// ── Phone resolver — uses booking phone or falls back to Customer record ───
async function resolvePhone(booking) {
  const phone = booking.customer?.phone;
  if (phone) return phone;
  const email = booking.customer?.email;
  if (!email) return "";
  try {
    const Customer = require("../models/Customer");
    const cust = await Customer.findOne({ email: email.toLowerCase() }, "phone");
    return cust?.phone || "";
  } catch { return ""; }
}

// ── Trigger functions (called from booking route) ──────────────────────────
async function triggerBookingConfirmed(booking) {
  if (!await isTriggerEnabled("booking_confirmed")) return;
  const phone = await resolvePhone(booking);
  if (!phone) return;
  const [tpl, bizPhone] = await Promise.all([getTemplate("booking_confirmed"), getBizPhone()]);
  await sendSms({
    to: phone,
    body: renderTemplate(tpl, {
      firstName:  booking.customer?.firstName || "there",
      service:    booking.service || "cleaning",
      date:       fmtDate(booking.schedule?.date),
      time:       booking.schedule?.preferredTime || "",
      bookingRef: booking.bookingId || "",
      bizPhone,
    }),
    trigger:    "booking_confirmed",
    bookingId:  booking._id?.toString(),
    bookingRef: booking.bookingId,
  });
}

async function triggerWorkerAssigned(booking, workerName) {
  if (!await isTriggerEnabled("worker_assigned")) return;
  const phone = await resolvePhone(booking);
  if (!phone) return;
  const tpl = await getTemplate("worker_assigned");
  await sendSms({
    to: phone,
    body: renderTemplate(tpl, {
      firstName:  booking.customer?.firstName || "there",
      workerName: workerName || "your cleaner",
      date:       fmtDate(booking.schedule?.date),
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
  const phone = await resolvePhone(booking);
  if (!phone) return;
  const tpl = await getTemplate("booking_reminder_24h");
  await sendSms({
    to: phone,
    body: renderTemplate(tpl, {
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
  const phone = await resolvePhone(booking);
  if (!phone) return;
  const tpl = await getTemplate("booking_completed");
  await sendSms({
    to: phone,
    body: renderTemplate(tpl, {
      firstName: booking.customer?.firstName || "there",
    }),
    trigger:    "booking_completed",
    bookingId:  booking._id?.toString(),
    bookingRef: booking.bookingId,
  });
}

async function triggerBookingCancelled(booking) {
  if (!await isTriggerEnabled("booking_cancelled")) return;
  const phone = await resolvePhone(booking);
  if (!phone) return;
  const [tpl, bizPhone] = await Promise.all([getTemplate("booking_cancelled"), getBizPhone()]);
  await sendSms({
    to: phone,
    body: renderTemplate(tpl, {
      bookingRef: booking.bookingId || "",
      date:       fmtDate(booking.schedule?.date),
      bizPhone,
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
  const tpl = await getTemplate("worker_job_assigned");
  await sendSms({
    to: phone,
    body: renderTemplate(tpl, {
      customerName: `${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim() || "Customer",
      address:      booking.details?.address || booking.address || "",
      date:         fmtDate(booking.schedule?.date),
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
  normalizePhone,
  isTriggerEnabled,
  triggerBookingConfirmed,
  triggerWorkerAssigned,
  triggerBookingReminder24h,
  triggerBookingCompleted,
  triggerBookingCancelled,
  triggerWorkerJobAssigned,
  DEFAULT_TEMPLATES,
  getTemplate,
  renderTemplate,
};
