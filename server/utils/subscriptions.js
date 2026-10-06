// Regular cleans (subscriptions), Wecasa-style:
//  1. The customer books a weekly/fortnightly/monthly clean and pays for the FIRST visit at once;
//     Stripe saves the card for later ("off-session") charges.
//  2. Later visits are Bookings created a few weeks ahead on a rolling basis (topUpVisits).
//  3. Each later visit is charged to the saved card 48 hours before the clean (processDueCharges).
//     If that fails: the customer is emailed a payment link and admin alerted; the card is tried
//     again 24 hours before; still unpaid 12 hours before → that clean is cancelled (the regular
//     clean carries on). Arrival still charges anything missed (chargeVisitOnArrival) as a safety net.
//  4. Customer or admin can pause, resume or cancel; future visits are cancelled/recreated, and
//     visits already paid are refunded (minus any late-notice fee).
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Subscription = require("../models/Subscription");
const Notification = require("../models/Notification");
const { buildBookingDateTime } = require("./bookingDateTime");
const { rateForFrequency, offeredFrequencies } = require("./pricing");
const { workerRateFor } = require("./workerRate");

let stripeClient = null;
const stripe = () => stripeClient || (stripeClient = require("stripe")(process.env.STRIPE_SECRET_KEY));
function setStripeForTests(fake) {
  stripeClient = fake;
}

const FREQUENCIES = {
  Weekly: { days: 7 },
  Fortnightly: { days: 14 },
  "Bi-weekly": { days: 14 },
  Monthly: { months: 1 },
  Quarterly: { months: 3 },
};
const normaliseFrequency = (f) => (f === "Bi-weekly" ? "Fortnightly" : f);
const isSubscriptionFrequency = (f) => Boolean(FREQUENCIES[f]);
// Keep visits booked this far ahead, so cleaners can see and accept them.
const HORIZON_DAYS = { Weekly: 56, Fortnightly: 56, Monthly: 93, Quarterly: 190 };
const FRONTEND = () => process.env.FRONTEND_URL || "https://cleaniqservices.com";
const ADMIN_EMAIL = () => process.env.EMAIL_USER || "info@cleaniqservices.com";

function addInterval(date, frequency) {
  const rule = FREQUENCIES[frequency];
  const d = new Date(date);
  if (rule.days) d.setDate(d.getDate() + rule.days);
  else d.setMonth(d.getMonth() + rule.months);
  return d;
}
const startOfTomorrow = (now = new Date()) => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
};
const DAY_MS = 86400000;
const HOUR_MS = 3600000;
// When a visit is charged, retried and (if still unpaid) cancelled, in hours before the clean.
const CHARGE_BEFORE_H = 48;
const RETRY_BEFORE_H = 24;
const CANCEL_UNPAID_BEFORE_H = 12;
const MIN_RETRY_GAP_H = 6;
const pence = (gbp) => Math.round(Number(gbp || 0) * 100);
const ukDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" });
const ukWeekday = (d) => new Date(d).toLocaleDateString("en-GB", { weekday: "long", timeZone: "Europe/London" });
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function uniqueRef(prefix, exists) {
  for (let i = 0; i < 20; i++) {
    const ref = `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    if (!(await exists(ref))) return ref;
  }
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

// Lowest believable price for one visit (service rate × hours), so a tampered client price can't
// set up cheap future charges. Extras and supplies only ever add to it.
async function findService(serviceName) {
  if (!serviceName) return null;
  const matches = await Service.find({ name: new RegExp(`^${escapeRegex(String(serviceName).trim())}$`, "i") }).lean();
  return matches.find((x) => x.category === "Base") || matches[0] || null;
}

async function minimumVisitPrice(serviceName, hours, frequency) {
  const s = await findService(serviceName);
  if (!s) return 0;
  const rate = rateForFrequency(s, frequency);
  const price = s.type === "hourly" ? rate * Number(hours || 0) : rate;
  // Prices are shown with tax added when admin has tax switched on.
  const { getTax, withTax } = require("./tax");
  return withTax(price, await getTax());
}

async function getOrCreateStripeCustomer({ email, name, phone }) {
  const found = await stripe().customers.list({ email, limit: 1 });
  if (found.data?.[0]) return found.data[0].id;
  const created = await stripe().customers.create({ email, name, phone, metadata: { company: "Cleaniq Services" } });
  return created.id;
}

// Everything a new visit copies from the first booking.
function templateFrom(booking) {
  const b = booking.toObject ? booking.toObject() : booking;
  return {
    customer: b.customer,
    service: b.service,
    details: b.details,
    property: b.property,
    schedule: { timeSlot: b.schedule?.timeSlot, preferredTime: b.schedule?.preferredTime },
    region: b.region,
    leadSource: b.leadSource,
    suppliesProvidedBy: b.suppliesProvidedBy,
    workerRate: b.workerRate,
    workerDuration: b.workerDuration,
    payment: { currency: b.payment?.currency || "GBP", billingType: b.payment?.billingType || "hourly" },
  };
}

// One-off set-up fee added to the FIRST payment of a regular clean (admin → Regular Cleans).
// Later cleans are the normal price.
const SETUP_FEE_DEFAULTS = { enabled: false, amount: 0, label: "Set-up fee" };
async function getSetupFee() {
  const row = await require("../models/SystemSetting").findOne({ key: "regularSetupFee" }).lean();
  const v = { ...SETUP_FEE_DEFAULTS, ...(row?.value || {}) };
  const amount = Math.max(0, Math.round(Number(v.amount || 0) * 100) / 100);
  return { enabled: Boolean(v.enabled) && amount > 0, amount, label: String(v.label || SETUP_FEE_DEFAULTS.label).slice(0, 40) };
}
async function saveSetupFee(input = {}) {
  const value = {
    enabled: Boolean(input.enabled),
    amount: Math.min(1000, Math.max(0, Math.round(Number(input.amount || 0) * 100) / 100)),
    label: String(input.label || SETUP_FEE_DEFAULTS.label).trim().slice(0, 40) || SETUP_FEE_DEFAULTS.label,
  };
  await require("../models/SystemSetting").updateOne({ key: "regularSetupFee" }, { $set: { value } }, { upsert: true });
  return getSetupFee();
}

async function createSubscription(firstBooking, { visitPrice, source = "Website", status = "pending_payment" } = {}) {
  const frequency = normaliseFrequency(firstBooking.details?.frequency);
  if (!isSubscriptionFrequency(frequency)) throw new Error(`Not a regular frequency: ${firstBooking.details?.frequency}`);
  // Only frequencies admin has priced for this service are offered (e.g. Deep Cleaning: monthly / every 3 months).
  const service = await findService(firstBooking.service);
  if (service && !offeredFrequencies(service).includes(frequency)) {
    throw new Error(`${firstBooking.service} isn't offered ${frequency.toLowerCase()}`);
  }
  const floor = await minimumVisitPrice(firstBooking.service, firstBooking.details?.duration, frequency);
  const claimed = Number(visitPrice ?? firstBooking.payment?.amount ?? 0);
  const pricePerVisit = Math.round(Math.max(claimed, floor) * 100) / 100;
  const subscriptionRef = await uniqueRef("SUB-", (ref) => Subscription.exists({ subscriptionRef: ref }));
  const sub = await Subscription.create({
    subscriptionRef,
    status,
    frequency,
    customer: firstBooking.customer,
    service: firstBooking.service,
    pricePerVisit,
    currency: firstBooking.payment?.currency || "GBP",
    startDate: firstBooking.schedule?.date,
    firstBooking: firstBooking._id,
    setupFee: Number(firstBooking.meta?.setupFee) || 0,
    template: templateFrom(firstBooking),
    source,
  });
  await Booking.updateOne(
    { _id: firstBooking._id },
    { $set: { "meta.subscriptionId": sub._id, "meta.subscriptionRef": subscriptionRef, "meta.recurringGroup": subscriptionRef } },
  );
  return sub;
}

// Marks the first visit paid and the subscription active once Stripe has taken the first payment
// and saved the card. Used by the website (after confirmCardPayment) and the checkout webhook (app).
async function activateSubscription(sub, paymentIntentId, { now = new Date() } = {}) {
  if (sub.status === "active" && sub.stripePaymentMethodId) return { sub, alreadyActive: true };
  const pi = await stripe().paymentIntents.retrieve(paymentIntentId);
  const first = await Booking.findById(sub.firstBooking);
  if (!first) throw new Error("First booking not found");
  if (pi.status !== "succeeded") throw new Error(`First payment not completed (status ${pi.status})`);
  if (Math.abs(pi.amount - pence(first.payment?.amount)) > 1) throw new Error("First payment amount doesn't match the booking");
  const customerId = typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
  const paymentMethodId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id;
  if (!customerId || !paymentMethodId) throw new Error("Card wasn't saved for future payments");

  await Booking.updateOne(
    { _id: first._id },
    {
      $set: {
        "payment.status": "Completed",
        "payment.capturedAt": now,
        "payment.stripePaymentIntentId": pi.id,
        "payment.stripeCustomerId": customerId,
        "payment.stripePaymentMethodId": paymentMethodId,
        "payment.chargeOnArrival": false,
        status: ["Pending", "Awaiting Payment"].includes(first.status) ? "Confirmed" : first.status,
      },
    },
  );
  sub.status = "active";
  sub.stripeCustomerId = customerId;
  sub.stripePaymentMethodId = paymentMethodId;
  sub.template = { ...sub.template, payment: { ...(sub.template?.payment || {}), stripeCustomerId: customerId, stripePaymentMethodId: paymentMethodId } };
  await sub.save();
  const created = await topUpVisits(sub, { now });
  sendSetupEmail(sub).catch((e) => console.error("[subscriptions] setup email failed:", e.message));
  console.log(`[subscriptions] ${sub.subscriptionRef} active (${sub.frequency}, £${sub.pricePerVisit}/visit), ${created} visits booked ahead`);
  return { sub, created };
}

// Creates the next visits up to the horizon. Skips dates before tomorrow (e.g. after a pause).
async function topUpVisits(sub, { now = new Date() } = {}) {
  if (sub.status !== "active") return 0;
  const horizon = new Date(now.getTime() + (HORIZON_DAYS[sub.frequency] || 56) * 86400000);
  const earliest = startOfTomorrow(now);
  let cursor = new Date(sub.lastVisitDate || sub.startDate);
  let created = 0;
  for (let guard = 0; guard < 60; guard++) {
    const next = addInterval(cursor, sub.frequency);
    if (next > horizon) break;
    cursor = next;
    if (next < earliest) continue;
    // Never book the same visit twice (e.g. two top-ups running at once).
    if (await Booking.exists({ "meta.subscriptionId": sub._id, "schedule.date": next, status: { $ne: "Cancelled" } })) continue;
    const t = sub.template || {};
    const bookingId = await uniqueRef("BK-S", (ref) => Booking.exists({ bookingId: ref }));
    // Later visits pay the cleaner the "following sessions" rate (admin → Staff Pay).
    const workerRate = await workerRateFor(sub.service, { following: true });
    await Booking.create({
      ...t,
      workerRate,
      bookingId,
      schedule: { ...(t.schedule || {}), date: next },
      status: "Confirmed",
      skipConfirmationEmail: true,
      noPaymentRequired: false,
      payment: {
        amount: sub.pricePerVisit,
        currency: sub.currency || "GBP",
        status: "Pending",
        method: "Card on file",
        billingType: t.payment?.billingType || "hourly",
        chargeOnArrival: true,
        stripeCustomerId: sub.stripeCustomerId,
        stripePaymentMethodId: sub.stripePaymentMethodId,
      },
      meta: { subscriptionId: sub._id, subscriptionRef: sub.subscriptionRef, recurringGroup: sub.subscriptionRef },
    });
    created++;
  }
  if (!sub.lastVisitDate || cursor > sub.lastVisitDate) {
    sub.lastVisitDate = cursor;
    await Subscription.updateOne({ _id: sub._id }, { $set: { lastVisitDate: cursor } });
  }
  return created;
}

// Mirror a DB payment update onto the in-memory booking the caller is still using, so a later
// booking.save() or email in the same request sees the new status.
function applyPayment(booking, fields) {
  if (!booking.payment) return;
  for (const [k, v] of Object.entries(fields)) booking.payment[k] = v;
}

const isPaidVisit = (b) => ["Completed", "Paid"].includes(b.payment?.status);

// Charges a visit to the saved card. Returns { charged, paymentIntentId } or { failed, reason }.
// The idempotency key makes a repeated call return the same Stripe result instead of charging twice.
async function chargeSavedCard(booking, idempotencyKey) {
  const p = booking.payment || {};
  if (!p.stripeCustomerId || !p.stripePaymentMethodId || !(p.amount > 0)) return { failed: true, reason: "No saved card on file" };
  try {
    const pi = await stripe().paymentIntents.create(
      {
        amount: pence(p.amount),
        currency: (p.currency || "GBP").toLowerCase(),
        customer: p.stripeCustomerId,
        payment_method: p.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: `Cleaniq ${booking.service} – ${booking.bookingId}`,
        metadata: { bookingId: String(booking._id), bookingRef: booking.bookingId, subscriptionRef: booking.meta?.subscriptionRef || "", company: "Cleaniq Services" },
      },
      { idempotencyKey },
    );
    if (pi.status !== "succeeded") return { failed: true, reason: `Payment ${pi.status}` };
    return { charged: true, paymentIntentId: pi.id };
  } catch (err) {
    return { failed: true, reason: err.code === "authentication_required" ? "The bank asked the customer to approve the payment" : err.message };
  }
}

async function markVisitPaid(booking, paymentIntentId, note) {
  const paid = { status: "Completed", capturedAt: new Date(), stripePaymentIntentId: paymentIntentId, failureReason: "" };
  await Booking.updateOne(
    { _id: booking._id },
    { $set: { "payment.status": paid.status, "payment.capturedAt": paid.capturedAt, "payment.stripePaymentIntentId": paymentIntentId, "payment.failureReason": "" } },
  );
  applyPayment(booking, paid);
  await expirePaymentLink(booking);
  console.log(`[subscriptions] charged £${booking.payment?.amount} for ${booking.bookingId} ${note}`);
  return { charged: true, paymentIntentId };
}

// Charges a regular-clean visit that wasn't paid in advance (safety net). Called when the cleaner
// arrives. Never throws: the clean goes ahead either way.
async function chargeVisitOnArrival(booking) {
  const p = booking.payment || {};
  if (!p.chargeOnArrival || ["Completed", "Paid"].includes(p.status)) return { skipped: true };
  const r = await chargeSavedCard(booking, `visit-charge-${booking._id}`);
  if (r.charged) return markVisitPaid(booking, r.paymentIntentId, "on arrival");
  return markVisitPaymentFailed(booking, r.reason);
}

// A payment link we sent is no longer needed (paid another way, or the clean was cancelled).
async function expirePaymentLink(booking) {
  const id = booking.meta?.paymentLinkSessionId;
  if (!id) return;
  try {
    await stripe().checkout.sessions.expire(id);
  } catch (e) {
    // Already paid/expired: nothing to do.
  }
  await Booking.updateOne({ _id: booking._id }, { $unset: { "meta.paymentLinkSessionId": "" } });
}

const visitWhen = (booking) => {
  const start = visitStart(booking);
  const time = start ? start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }) : "";
  return `${ukDate(booking.schedule?.date)}${time ? ` at ${time}` : ""}`;
};

// stage: "advance" (48h before), "retry" (24h before) or "arrival" (cleaner arrived, not paid).
async function markVisitPaymentFailed(booking, reason, { stage = "arrival" } = {}) {
  const p = booking.payment || {};
  let url = "";
  await expirePaymentLink(booking); // one live link at a time
  let sessionId = "";
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      ...(p.stripeCustomerId ? { customer: p.stripeCustomerId } : { customer_email: booking.customer?.email }),
      payment_intent_data: {
        setup_future_usage: "off_session", // the card they pay with becomes the saved card
        metadata: { bookingId: String(booking._id), type: "visit_payment" },
      },
      line_items: [{
        price_data: {
          currency: (p.currency || "GBP").toLowerCase(),
          product_data: { name: `Cleaniq – ${booking.service}`, description: `Booking ${booking.bookingId}` },
          unit_amount: pence(p.amount),
        },
        quantity: 1,
      }],
      metadata: { bookingId: String(booking._id), type: "visit_payment" },
      success_url: `${FRONTEND()}/payment/success?bookingId=${booking._id}`,
      cancel_url: `${FRONTEND()}/`,
    });
    url = session.url || "";
    sessionId = session.id || "";
  } catch (e) {
    console.error(`[subscriptions] couldn't create payment link for ${booking.bookingId}:`, e.message);
  }
  const failed = { status: "Failed", failedAt: new Date(), failureReason: reason, paymentLinkUrl: url };
  await Booking.updateOne(
    { _id: booking._id },
    {
      $set: {
        "payment.status": failed.status, "payment.failedAt": failed.failedAt, "payment.failureReason": reason, "payment.paymentLinkUrl": url,
        ...(sessionId ? { "meta.paymentLinkSessionId": sessionId } : {}),
      },
    },
  );
  applyPayment(booking, failed);
  if (sessionId) booking.meta = { ...(booking.meta || {}), paymentLinkSessionId: sessionId };
  console.warn(`[subscriptions] charge failed (${stage}) for ${booking.bookingId}: ${reason}`);
  const { sendEmail } = require("./emailService");
  const amount = `£${Number(p.amount || 0).toFixed(2)}`;
  const when = visitWhen(booking);
  const name = booking.customer?.firstName || "there";
  const button = `<p><a href="${url}" style="display:inline-block;background:#0F6B4C;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Pay ${amount} now</a></p>`;
  const footer = `<p style="color:#64748b">The card you pay with will be used for your future cleans. Questions? Call or WhatsApp +44 7846 726428.</p>`;
  const message = {
    advance: {
      subject: `Action needed: payment for your clean on ${ukDate(booking.schedule?.date)} – ${booking.bookingId}`,
      title: "We couldn't take payment for your next clean",
      body: `<p>We tried to charge your saved card ${amount} for your regular ${booking.service} on <strong>${when}</strong>, but the payment didn't go through.</p>
        <p>Please pay using the button below. We'll try your card again 24 hours before the clean. If it's still unpaid 12 hours before, this clean will be cancelled (your regular clean carries on as normal).</p>`,
      push: [`Payment needed for your clean on ${ukDate(booking.schedule?.date)}`, `We couldn't charge your saved card (${amount}). Check your email for a link to pay.`],
      admin: "failed 48 hours before the clean",
    },
    retry: {
      subject: `Reminder: payment still needed for your clean on ${ukDate(booking.schedule?.date)} – ${booking.bookingId}`,
      title: "Your next clean is still unpaid",
      body: `<p>We tried your saved card again for your regular ${booking.service} on <strong>${when}</strong> (${amount}), but it didn't go through.</p>
        <p><strong>Please pay at least 12 hours before the clean</strong>, otherwise this clean will be cancelled. Your regular clean carries on as normal.</p>`,
      push: [`Last reminder: pay for your clean on ${ukDate(booking.schedule?.date)}`, `Please pay ${amount} at least 12 hours before, or this clean will be cancelled.`],
      admin: "failed again 24 hours before the clean (it will be cancelled 12 hours before if still unpaid)",
    },
    arrival: {
      subject: `Payment needed for today's clean – ${booking.bookingId}`,
      title: "We couldn't take today's payment",
      body: `<p>Your cleaner has arrived for your regular ${booking.service}, but we couldn't charge your saved card (${amount}).</p>`,
      push: ["Payment needed for today's clean", `We couldn't charge your saved card (${amount}). Check your email for a link to pay.`],
      admin: "failed when the cleaner arrived",
    },
  }[stage];
  if (booking.customer?.email && url) {
    sendEmail({
      to: booking.customer.email,
      subject: message.subject,
      html: `<div style="font-family:sans-serif;max-width:560px"><h2 style="color:#0F6B4C">${message.title}</h2>
        <p>Hi ${name},</p>${message.body}${button}${footer}</div>`,
    }).catch(() => {});
  }
  if (url) {
    require("./pushNotifications").pushToBookingCustomer(booking, message.push[0], message.push[1], { type: "payment" }).catch(() => {});
  }
  sendEmail({
    to: ADMIN_EMAIL(),
    subject: `⚠️ Regular clean payment failed – ${booking.bookingId}`,
    html: `<p>The automatic charge of ${amount} for ${booking.bookingId} on ${when} (${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}, ${booking.customer?.email || ""}) ${message.admin}.</p><p>Reason: ${reason}</p><p>${url ? `The customer was emailed a payment link: ${url}` : "No payment link could be created: please contact the customer."}</p>`,
  }).catch(() => {});
  return { failed: true, reason, paymentLinkUrl: url };
}

// Receipt for an advance charge (push + short email).
function sendChargeReceipt(booking) {
  const amount = `£${Number(booking.payment?.amount || 0).toFixed(2)}`;
  const when = visitWhen(booking);
  require("./pushNotifications").pushToBookingCustomer(booking, "Payment taken for your next clean",
    `${amount} for your ${booking.service} on ${when}.`, { type: "payment" }).catch(() => {});
  if (!booking.customer?.email) return;
  const { sendEmail } = require("./emailService");
  sendEmail({
    to: booking.customer.email,
    subject: `Payment received for your clean on ${ukDate(booking.schedule?.date)} – ${booking.bookingId}`,
    html: `<div style="font-family:sans-serif;max-width:560px"><h2 style="color:#0F6B4C">Payment received</h2>
      <p>Hi ${booking.customer.firstName || "there"},</p>
      <p>We've taken <strong>${amount}</strong> from your saved card for your regular ${booking.service} on <strong>${when}</strong>.</p>
      <p style="color:#64748b">Need to change or cancel? Do it from your account or call +44 7846 726428. With 24 hours' notice or more you get a full refund.<br>Reference: ${booking.bookingId}</p></div>`,
  }).catch(() => {});
}

// Unpaid 12 hours before the clean: cancel that one visit. The regular clean carries on.
async function cancelUnpaidVisit(booking) {
  await expirePaymentLink(booking);
  await Booking.updateOne(
    { _id: booking._id },
    { $set: { status: "Cancelled", "payment.chargeOnArrival": false, "meta.cancelledReason": "Not paid 12 hours before the clean" } },
  );
  const when = visitWhen(booking);
  const amount = `£${Number(booking.payment?.amount || 0).toFixed(2)}`;
  if (booking.assignedWorker) {
    const message = `${booking.service} on ${when} (${booking.bookingId}) was cancelled.`;
    await Notification.create({ workerId: booking.assignedWorker, title: "Job cancelled", message, type: "job", bookingId: booking.bookingId }).catch(() => {});
    require("./pushNotifications").sendPushToUser("worker", booking.assignedWorker, "Job cancelled", message, { type: "job_cancelled" }).catch(() => {});
  }
  const { sendEmail } = require("./emailService");
  if (booking.customer?.email) {
    sendEmail({
      to: booking.customer.email,
      subject: `Your clean on ${ukDate(booking.schedule?.date)} has been cancelled – ${booking.bookingId}`,
      html: `<div style="font-family:sans-serif;max-width:560px"><h2 style="color:#0F6B4C">This clean has been cancelled</h2>
        <p>Hi ${booking.customer.firstName || "there"},</p>
        <p>We couldn't take payment (${amount}) for your regular ${booking.service} on <strong>${when}</strong>, so this clean has been cancelled. You haven't been charged.</p>
        <p>Your regular clean carries on as normal. To avoid this next time, please update your card by paying for your next clean from your account, or call us on +44 7846 726428.</p></div>`,
    }).catch(() => {});
  }
  require("./pushNotifications").pushToBookingCustomer(booking, "Clean cancelled: payment not received",
    `Your clean on ${when} was cancelled because we couldn't take payment. Your regular clean carries on.`, { type: "payment" }).catch(() => {});
  sendEmail({
    to: ADMIN_EMAIL(),
    subject: `Regular clean visit cancelled (unpaid) – ${booking.bookingId}`,
    html: `<p>${booking.bookingId} on ${when} (${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}, ${booking.customer?.email || ""}) was cancelled automatically: still unpaid 12 hours before the clean.${booking.assignedWorker ? " The cleaner has been told." : ""}</p>`,
  }).catch(() => {});
  console.warn(`[subscriptions] ${booking.bookingId} cancelled: unpaid 12h before`);
}

// Runs every 15 minutes: charges visits 48h ahead, retries failed ones 24h ahead, and cancels
// visits still unpaid 12h ahead.
async function processDueCharges(now = new Date()) {
  const visits = await Booking.find({
    "meta.subscriptionId": { $exists: true },
    "payment.chargeOnArrival": true,
    "payment.status": { $in: ["Pending", "Failed"] },
    status: { $in: ["Pending", "Confirmed", "Assigned", "Accepted"] },
    "schedule.date": { $gte: new Date(now.getTime() - DAY_MS), $lte: new Date(now.getTime() + 4 * DAY_MS) },
  });
  const done = { charged: 0, failed: 0, cancelled: 0 };
  for (const visit of visits) {
    try {
      const start = visitStart(visit);
      const hours = start ? (start - now) / HOUR_MS : NaN;
      if (!(hours > 0)) continue; // started or past: arrival handles anything missed
      const meta = visit.meta || {};
      const attempts = Number(meta.chargeAttempts || 0);
      const sinceLast = meta.lastChargeAttemptAt ? (now - new Date(meta.lastChargeAttemptAt)) / HOUR_MS : Infinity;

      if (visit.payment.status === "Failed") {
        // Cancel only if the customer had real time to pay (the first try was 12h+ before).
        if (hours <= CANCEL_UNPAID_BEFORE_H) {
          if (meta.canAutoCancel) { await cancelUnpaidVisit(visit); done.cancelled++; }
          continue;
        }
        if (hours > RETRY_BEFORE_H || attempts >= 2 || sinceLast < MIN_RETRY_GAP_H) continue;
      } else if (hours > CHARGE_BEFORE_H) {
        continue;
      }

      const attempt = attempts + 1;
      await Booking.updateOne(
        { _id: visit._id },
        { $set: { "meta.chargeAttempts": attempt, "meta.lastChargeAttemptAt": now, ...(attempt === 1 ? { "meta.canAutoCancel": hours > CANCEL_UNPAID_BEFORE_H } : {}) } },
      );
      visit.meta = { ...meta, chargeAttempts: attempt, lastChargeAttemptAt: now, ...(attempt === 1 ? { canAutoCancel: hours > CANCEL_UNPAID_BEFORE_H } : {}) };
      const key = attempt === 1 ? `visit-charge-${visit._id}` : `visit-charge-${visit._id}-${attempt}`;
      const r = await chargeSavedCard(visit, key);
      if (r.charged) {
        await markVisitPaid(visit, r.paymentIntentId, `${Math.round(hours)}h before the clean`);
        sendChargeReceipt(visit);
        done.charged++;
      } else {
        await markVisitPaymentFailed(visit, r.reason, { stage: attempt === 1 ? "advance" : "retry" });
        done.failed++;
      }
    } catch (e) {
      console.error(`[subscriptions] advance charge error for ${visit.bookingId}:`, e.message);
    }
  }
  if (done.charged || done.failed || done.cancelled) console.log(`[subscriptions] advance charges: ${JSON.stringify(done)}`);
  return done;
}

const visitStart = (b) => buildBookingDateTime(b.schedule?.date, b.schedule?.timeSlot, b.schedule?.preferredTime);
const CANCELLABLE_STATUSES = ["Pending", "Confirmed", "Assigned"];

// Visits that haven't started yet (paid in advance or not), soonest first.
async function upcomingVisits(sub, now = new Date()) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const visits = await Booking.find({
    "meta.subscriptionId": sub._id,
    "schedule.date": { $gte: new Date(dayStart.getTime() - DAY_MS) },
    status: { $in: CANCELLABLE_STATUSES },
  }).lean();
  return visits.filter((v) => visitStart(v) > now).sort((a, b) => visitStart(a) - visitStart(b));
}

// Late-notice fee from the Terms: 24h+ free, 2–24h £10, under 2h 80% of that clean's price.
const LATE_FEE_FLAT = 10;
function cancellationFeeFor(visit, now = new Date()) {
  const hours = (visitStart(visit) - now) / 3600000;
  if (hours >= 24) return { fee: 0, hours };
  if (hours >= 2) return { fee: LATE_FEE_FLAT, hours, rule: "less than 24 hours' notice" };
  return { fee: Math.round(Number(visit.payment?.amount || 0) * 0.8 * 100) / 100, hours, rule: "less than 2 hours' notice (80% of the clean)" };
}

// What pausing/cancelling now would cost the customer (for the confirm screen and the action).
async function cancellationQuote(sub, now = new Date()) {
  if (sub.status !== "active") return { fee: 0 };
  const [next] = await upcomingVisits(sub, now);
  if (!next) return { fee: 0 };
  const { fee, hours, rule } = cancellationFeeFor(next, now);
  const paid = isPaidVisit(next);
  return {
    fee,
    rule: rule || "",
    hoursUntilNextVisit: Math.round(hours * 10) / 10,
    nextVisit: { _id: next._id, bookingId: next.bookingId, start: visitStart(next) },
    // Already paid in advance: the fee comes off the refund instead of being charged.
    nextVisitPaid: paid,
    refund: paid ? Math.max(0, Math.round((Number(next.payment?.amount || 0) - fee) * 100) / 100) : 0,
  };
}

// Refunds a visit paid in advance (amount = what goes back; the rest is kept as the late fee).
async function refundVisit(visit, amount, reason) {
  const full = Number(visit.payment?.amount || 0);
  const value = Math.max(0, Math.min(full, Math.round(Number(amount) * 100) / 100));
  const record = { amount: value, reason, at: new Date() };
  if (value <= 0) {
    Object.assign(record, { status: "None" });
  } else {
    try {
      const r = await stripe().refunds.create(
        { payment_intent: visit.payment.stripePaymentIntentId, amount: pence(value), metadata: { bookingRef: visit.bookingId, type: "visit_refund", company: "Cleaniq Services" } },
        { idempotencyKey: `refund-visit-${visit._id}` },
      );
      Object.assign(record, { status: "Refunded", refundId: r.id });
    } catch (err) {
      Object.assign(record, { status: "Failed", error: err.message });
      const { sendEmail } = require("./emailService");
      sendEmail({
        to: ADMIN_EMAIL(),
        subject: `⚠️ Refund failed – ${visit.bookingId}`,
        html: `<p>${visit.bookingId} (${visit.customer?.firstName || ""} ${visit.customer?.lastName || ""}, ${visit.customer?.email || ""}) was cancelled and £${value.toFixed(2)} should be refunded, but Stripe refused: ${err.message}. Please refund it from the Stripe dashboard.</p>`,
      }).catch(() => {});
    }
  }
  const status = record.status === "Refunded" ? (value >= full ? "Refunded" : "Partially refunded") : visit.payment?.status;
  await Booking.updateOne({ _id: visit._id }, { $set: { "meta.refund": record, "payment.status": status } });
  return record;
}

async function chargeCancellationFee(sub, quote) {
  const visitId = quote.nextVisit._id;
  const record = { amount: quote.fee, reason: quote.rule, bookingId: quote.nextVisit.bookingId, at: new Date() };
  try {
    const pi = await stripe().paymentIntents.create(
      {
        amount: pence(quote.fee),
        currency: (sub.currency || "GBP").toLowerCase(),
        customer: sub.stripeCustomerId,
        payment_method: sub.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: `Cleaniq late cancellation fee – ${quote.nextVisit.bookingId}`,
        metadata: { type: "cancellation_fee", subscriptionRef: sub.subscriptionRef, bookingRef: quote.nextVisit.bookingId, company: "Cleaniq Services" },
      },
      { idempotencyKey: `cancel-fee-${visitId}` },
    );
    Object.assign(record, { status: pi.status === "succeeded" ? "Paid" : "Failed", paymentIntentId: pi.id });
  } catch (err) {
    Object.assign(record, { status: "Failed", error: err.message });
    const { sendEmail } = require("./emailService");
    sendEmail({
      to: ADMIN_EMAIL(),
      subject: `⚠️ Cancellation fee not collected – ${sub.subscriptionRef}`,
      html: `<p>${sub.customer?.firstName || ""} ${sub.customer?.lastName || ""} (${sub.customer?.email || ""}) cancelled/paused with ${quote.rule} before ${quote.nextVisit.bookingId}. The £${quote.fee.toFixed(2)} fee couldn't be charged: ${err.message}</p>`,
    }).catch(() => {});
  }
  await Booking.updateOne({ _id: visitId }, { $set: { "meta.cancellationFee": record } });
  return record;
}

// Cancels this subscription's visits that haven't started or been paid yet.
async function cancelFutureVisits(sub, reason, now = new Date()) {
  const visits = await upcomingVisits(sub, now);
  if (!visits.length) return 0;
  await Booking.updateMany(
    { _id: { $in: visits.map((v) => v._id) } },
    { $set: { status: "Cancelled", "payment.chargeOnArrival": false, "meta.cancelledReason": reason } },
  );
  const notices = visits
    .filter((v) => v.assignedWorker)
    .map((v) => ({ workerId: v.assignedWorker, title: "Job cancelled", message: `${v.service} on ${ukDate(v.schedule.date)} (${v.bookingId}) was cancelled.`, type: "job" }));
  if (notices.length) await Notification.insertMany(notices, { ordered: false }).catch(() => {});
  // Tell the cleaners on their phones too (not just in the app).
  const { sendPushToUser } = require("./pushNotifications");
  await Promise.all(notices.map((n) =>
    sendPushToUser("worker", n.workerId, n.title, n.message, { type: "job_cancelled" }).catch(() => {})));
  return visits.length;
}

// Customers pay the late-notice fee; admin actions are free (chargeFee false). Visits already paid
// in advance are refunded; for the next visit the late fee is kept from that refund.
async function stopSubscription(sub, next, by, { now, chargeFee }) {
  const quote = chargeFee ? await cancellationQuote(sub, now) : { fee: 0 };
  let fee = null;
  for (const visit of await upcomingVisits(sub, now)) {
    const isNext = String(visit._id) === String(quote.nextVisit?._id);
    const keep = isNext ? quote.fee : 0;
    if (isPaidVisit(visit)) {
      await refundVisit(visit, Number(visit.payment.amount) - keep, keep > 0 ? quote.rule : `Regular clean ${next}`);
      if (keep > 0) fee = { amount: keep, reason: quote.rule, bookingId: visit.bookingId, status: "Kept from payment", at: now };
      if (keep > 0) await Booking.updateOne({ _id: visit._id }, { $set: { "meta.cancellationFee": fee } });
    } else {
      await expirePaymentLink(visit);
      // A visit whose card just failed isn't charged a fee on top.
      if (keep > 0 && visit.payment?.status !== "Failed") fee = await chargeCancellationFee(sub, quote);
    }
  }
  const cancelled = await cancelFutureVisits(sub, next === "paused" ? "Regular clean paused" : "Regular clean cancelled", now);
  sub.status = next;
  if (next === "paused") sub.pausedAt = now;
  else Object.assign(sub, { cancelledAt: now, cancelledBy: by });
  await sub.save();
  console.log(`[subscriptions] ${sub.subscriptionRef} ${next} by ${by}; ${cancelled} visits cancelled${fee ? `; fee £${fee.amount} ${fee.status}` : ""}`);
  return { sub, cancelled, fee };
}

async function pauseSubscription(sub, by, { now = new Date(), chargeFee = false } = {}) {
  if (sub.status !== "active") throw new Error("Only an active regular clean can be paused");
  return stopSubscription(sub, "paused", by, { now, chargeFee });
}

async function resumeSubscription(sub, by, { now = new Date() } = {}) {
  if (sub.status !== "paused") throw new Error("Only a paused regular clean can be resumed");
  // Carry on the same weekday cadence from the last visit that still stands.
  const last = await Booking.findOne({ "meta.subscriptionId": sub._id, status: { $ne: "Cancelled" } }).sort({ "schedule.date": -1 }).lean();
  sub.status = "active";
  sub.pausedAt = null;
  sub.lastVisitDate = last?.schedule?.date || sub.startDate;
  await sub.save();
  const created = await topUpVisits(sub, { now });
  console.log(`[subscriptions] ${sub.subscriptionRef} resumed by ${by}; ${created} visits booked`);
  return { sub, created };
}

async function cancelSubscription(sub, by, { now = new Date(), chargeFee = false } = {}) {
  if (sub.status === "cancelled") return { sub, cancelled: 0 };
  // A paused subscription has no upcoming visits, so no fee.
  return stopSubscription(sub, "cancelled", by, { now, chargeFee: chargeFee && sub.status === "active" });
}

// The customer cancels ONE visit of their regular clean. Visits are charged 48h ahead, so a paid
// visit is refunded under the same late-notice rule (24h+ full refund; 2–24h £10 kept; under 2h
// 80% kept). Unpaid visits are cancelled free.
function visitCancellationQuote(visit, now = new Date()) {
  const paid = isPaidVisit(visit);
  const { fee, hours, rule } = cancellationFeeFor(visit, now);
  const kept = paid ? Math.min(fee, Number(visit.payment?.amount || 0)) : 0;
  return { paid, fee: kept, rule: kept ? rule : "", hours, refund: paid ? Math.round((Number(visit.payment.amount) - kept) * 100) / 100 : 0 };
}

async function cancelVisitByCustomer(visit, { now = new Date() } = {}) {
  const q = visitCancellationQuote(visit, now);
  let refund = null;
  if (q.paid) refund = await refundVisit(visit, q.refund, q.fee ? q.rule : "Cancelled by customer");
  else await expirePaymentLink(visit);
  if (q.fee) await Booking.updateOne({ _id: visit._id }, { $set: { "meta.cancellationFee": { amount: q.fee, reason: q.rule, status: "Kept from payment", at: now } } });
  return { ...q, refundStatus: refund?.status || null };
}

async function nextVisitFor(sub, now = new Date()) {
  return Booking.findOne({ "meta.subscriptionId": sub._id, status: { $ne: "Cancelled" }, "schedule.date": { $gte: new Date(now.getTime() - 12 * 3600000) } })
    .sort({ "schedule.date": 1 })
    .select("bookingId schedule status payment.status")
    .lean();
}

async function sendSetupEmail(sub) {
  const { sendEmail } = require("./emailService");
  const t = sub.template || {};
  const time = t.schedule?.preferredTime || t.schedule?.timeSlot || "";
  const every =
    sub.frequency === "Weekly" ? `every ${ukWeekday(sub.startDate)}`
    : sub.frequency === "Fortnightly" ? `every other ${ukWeekday(sub.startDate)}`
    : sub.frequency === "Quarterly" ? "every 3 months"
    : "every month";
  await sendEmail({
    to: sub.customer?.email,
    subject: `Your regular clean is set up – ${sub.subscriptionRef}`,
    html: `<div style="font-family:sans-serif;max-width:560px"><h2 style="color:#0F6B4C">Your regular clean is booked</h2>
      <p>Hi ${sub.customer?.firstName || "there"},</p>
      <p><strong>${sub.service}</strong>, ${every}${time ? ` at ${time}` : ""}, starting ${ukDate(sub.startDate)}.</p>
      <ul><li>Your first clean is paid${sub.setupFee > 0 ? ` (including the one-off £${Number(sub.setupFee).toFixed(2)} set-up fee)` : ""}.</li><li>Each following clean is £${sub.pricePerVisit.toFixed(2)}, charged to your saved card 48 hours before the clean. We'll send you a receipt each time.</li>
      <li>Pause or cancel any time from your account or by calling +44 7846 726428. With 24 hours' notice or more it's free, and any clean already paid is refunded in full.</li></ul>
      <p style="color:#64748b">Reference: ${sub.subscriptionRef}</p></div>`,
  });
}

// Stripe Checkout finished for a regular-clean payment link:
//  - "subscription_first": the app's first-visit payment → activate the subscription
//  - "visit_payment": the customer paid a visit whose automatic charge failed → mark it paid and
//    make the card they used the saved card for future visits.
// Returns true when handled (so the generic booking webhook logic is skipped).
async function handleCheckoutCompleted(session) {
  const type = session.metadata?.type;
  if (type === "subscription_first") {
    const sub = await Subscription.findById(session.metadata.subscriptionId);
    if (sub && session.payment_intent) await activateSubscription(sub, session.payment_intent);
    return true;
  }
  if (type === "visit_payment") {
    const booking = await Booking.findById(session.metadata.bookingId);
    if (!booking || !session.payment_intent) return true;
    const pi = await stripe().paymentIntents.retrieve(session.payment_intent);
    const customerId = typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
    const paymentMethodId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id;
    if (booking.status === "Cancelled") {
      // Paid just as the visit was cancelled for non-payment: give the money back.
      await Booking.updateOne({ _id: booking._id }, { $set: { "payment.status": "Completed", "payment.stripePaymentIntentId": pi.id } });
      await refundVisit(await Booking.findById(booking._id).lean(), booking.payment?.amount, "Paid after the visit was cancelled");
      console.log(`[subscriptions] ${booking.bookingId} paid after cancellation: refunded`);
      return true;
    }
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { "payment.status": "Completed", "payment.capturedAt": new Date(), "payment.stripePaymentIntentId": pi.id, "payment.failureReason": "" }, $unset: { "meta.paymentLinkSessionId": "" } },
    );
    const subId = booking.meta?.subscriptionId;
    if (subId && customerId && paymentMethodId) {
      await Subscription.updateOne({ _id: subId }, { $set: { stripeCustomerId: customerId, stripePaymentMethodId: paymentMethodId, "template.payment.stripeCustomerId": customerId, "template.payment.stripePaymentMethodId": paymentMethodId } });
      await Booking.updateMany(
        { "meta.subscriptionId": subId, "payment.status": "Pending", "payment.chargeOnArrival": true },
        { $set: { "payment.stripeCustomerId": customerId, "payment.stripePaymentMethodId": paymentMethodId } },
      );
    }
    console.log(`[subscriptions] ${booking.bookingId} paid by payment link`);
    return true;
  }
  return false;
}

// Keeps every active subscription booked ahead. Runs every 6 hours.
async function topUpAll(now = new Date()) {
  const subs = await Subscription.find({ status: "active" });
  let created = 0;
  for (const sub of subs) {
    try {
      created += await topUpVisits(sub, { now });
    } catch (e) {
      console.error(`[subscriptions] top-up failed for ${sub.subscriptionRef}:`, e.message);
    }
  }
  if (created) console.log(`[subscriptions] booked ${created} upcoming regular visits`);
  return created;
}
function startSubscriptionScheduler() {
  setTimeout(() => topUpAll().catch(() => {}), 60 * 1000);
  setInterval(() => topUpAll().catch(() => {}), 6 * 60 * 60 * 1000);
  // Advance charges (48h before each clean), retries and unpaid cancellations.
  setTimeout(() => processDueCharges().catch((e) => console.error("[subscriptions] charges:", e.message)), 90 * 1000);
  setInterval(() => processDueCharges().catch((e) => console.error("[subscriptions] charges:", e.message)), 15 * 60 * 1000);
}

module.exports = {
  minimumVisitPrice,
  getSetupFee,
  saveSetupFee,
  isSubscriptionFrequency,
  normaliseFrequency,
  getOrCreateStripeCustomer,
  createSubscription,
  activateSubscription,
  topUpVisits,
  topUpAll,
  chargeVisitOnArrival,
  processDueCharges,
  visitCancellationQuote,
  cancelVisitByCustomer,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  nextVisitFor,
  cancellationQuote,
  handleCheckoutCompleted,
  startSubscriptionScheduler,
  setStripeForTests,
  stripe,
};
