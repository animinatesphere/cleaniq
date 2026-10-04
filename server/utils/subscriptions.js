// Regular cleans (subscriptions), Wecasa-style:
//  1. The customer books a weekly/fortnightly/monthly clean and pays for the FIRST visit at once;
//     Stripe saves the card for later ("off-session") charges.
//  2. Later visits are Bookings created a few weeks ahead on a rolling basis (topUpVisits).
//  3. Each later visit is charged to the saved card when the cleaner arrives (chargeVisitOnArrival).
//     If that fails the clean still goes ahead: the customer is emailed a payment link and admin alerted.
//  4. Customer or admin can pause, resume or cancel; future visits are cancelled/recreated.
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

// Charges a regular-clean visit to the saved card. Called when the cleaner arrives.
// Never throws: the clean goes ahead either way.
async function chargeVisitOnArrival(booking) {
  const p = booking.payment || {};
  if (!p.chargeOnArrival || ["Completed", "Paid"].includes(p.status)) return { skipped: true };
  if (!p.stripeCustomerId || !p.stripePaymentMethodId || !(p.amount > 0)) {
    return markVisitPaymentFailed(booking, "No saved card on file");
  }
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
      { idempotencyKey: `visit-charge-${booking._id}` },
    );
    if (pi.status !== "succeeded") return markVisitPaymentFailed(booking, `Payment ${pi.status}`);
    const paid = { status: "Completed", capturedAt: new Date(), stripePaymentIntentId: pi.id };
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { "payment.status": paid.status, "payment.capturedAt": paid.capturedAt, "payment.stripePaymentIntentId": pi.id } },
    );
    applyPayment(booking, paid);
    console.log(`[subscriptions] charged £${p.amount} for ${booking.bookingId} on arrival`);
    return { charged: true, paymentIntentId: pi.id };
  } catch (err) {
    const reason = err.code === "authentication_required" ? "The bank asked the customer to approve the payment" : err.message;
    return markVisitPaymentFailed(booking, reason);
  }
}

async function markVisitPaymentFailed(booking, reason) {
  const p = booking.payment || {};
  let url = "";
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
  } catch (e) {
    console.error(`[subscriptions] couldn't create payment link for ${booking.bookingId}:`, e.message);
  }
  const failed = { status: "Failed", failedAt: new Date(), failureReason: reason, paymentLinkUrl: url };
  await Booking.updateOne(
    { _id: booking._id },
    { $set: { "payment.status": failed.status, "payment.failedAt": failed.failedAt, "payment.failureReason": reason, "payment.paymentLinkUrl": url } },
  );
  applyPayment(booking, failed);
  console.warn(`[subscriptions] charge failed for ${booking.bookingId}: ${reason}`);
  const { sendEmail } = require("./emailService");
  const amount = `£${Number(p.amount || 0).toFixed(2)}`;
  if (booking.customer?.email && url) {
    sendEmail({
      to: booking.customer.email,
      subject: `Payment needed for today's clean – ${booking.bookingId}`,
      html: `<div style="font-family:sans-serif;max-width:560px"><h2 style="color:#0F6B4C">We couldn't take today's payment</h2>
        <p>Hi ${booking.customer.firstName || "there"},</p>
        <p>Your cleaner has arrived for your regular ${booking.service}, but we couldn't charge your saved card (${amount}).</p>
        <p><a href="${url}" style="display:inline-block;background:#0F6B4C;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Pay ${amount} now</a></p>
        <p style="color:#64748b">The card you pay with will be used for your future cleans. Questions? Call or WhatsApp +44 7846 726428.</p></div>`,
    }).catch(() => {});
  }
  sendEmail({
    to: ADMIN_EMAIL(),
    subject: `⚠️ Regular clean payment failed – ${booking.bookingId}`,
    html: `<p>The automatic charge of ${amount} for ${booking.bookingId} (${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}, ${booking.customer?.email || ""}) failed when the cleaner arrived.</p><p>Reason: ${reason}</p><p>${url ? `The customer was emailed a payment link: ${url}` : "No payment link could be created: please contact the customer."}</p>`,
  }).catch(() => {});
  return { failed: true, reason, paymentLinkUrl: url };
}

const visitStart = (b) => buildBookingDateTime(b.schedule?.date, b.schedule?.timeSlot, b.schedule?.preferredTime);
const CANCELLABLE_STATUSES = ["Pending", "Confirmed", "Assigned"];

// Visits that haven't started or been paid yet, soonest first.
async function upcomingVisits(sub, now = new Date()) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const visits = await Booking.find({
    "meta.subscriptionId": sub._id,
    "schedule.date": { $gte: new Date(dayStart.getTime() - DAY_MS) },
    status: { $in: CANCELLABLE_STATUSES },
    "payment.status": { $nin: ["Completed", "Paid"] },
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
  return {
    fee,
    rule: rule || "",
    hoursUntilNextVisit: Math.round(hours * 10) / 10,
    nextVisit: { _id: next._id, bookingId: next.bookingId, start: visitStart(next) },
  };
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

// Customers pay the late-notice fee; admin actions are free (chargeFee false).
async function stopSubscription(sub, next, by, { now, chargeFee }) {
  const quote = chargeFee ? await cancellationQuote(sub, now) : { fee: 0 };
  const fee = quote.fee > 0 ? await chargeCancellationFee(sub, quote) : null;
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
      <ul><li>Your first clean is paid.</li><li>Each following clean is £${sub.pricePerVisit.toFixed(2)}, charged to your saved card on the day, when your cleaner arrives.</li>
      <li>Pause or cancel any time, free of charge, from your account or by calling +44 7846 726428.</li></ul>
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
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { "payment.status": "Completed", "payment.capturedAt": new Date(), "payment.stripePaymentIntentId": pi.id, "payment.failureReason": "" } },
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
}

module.exports = {
  minimumVisitPrice,
  isSubscriptionFrequency,
  normaliseFrequency,
  getOrCreateStripeCustomer,
  createSubscription,
  activateSubscription,
  topUpVisits,
  topUpAll,
  chargeVisitOnArrival,
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
