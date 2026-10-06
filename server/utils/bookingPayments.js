// A customer has paid for a booking (Stripe webhook): confirm it and tell them — once.
//
// Stripe can report one payment through several events (checkout.session.completed,
// payment_intent.amount_capturable_updated for a held card, payment_intent.succeeded for a
// charged card), sometimes at the same moment. Whichever arrives first confirms the booking; the
// others only keep the payment record up to date. Only bookings still waiting for payment
// (Pending / Awaiting Payment) are moved to Confirmed — never one admin or a cleaner has moved on.
const mongoose = require("mongoose");

const WAITING = ["Pending", "Awaiting Payment"];

const findQuery = (ref) => (mongoose.isValidObjectId(ref) ? { _id: ref } : { bookingId: String(ref || "") });

/**
 * @param {string} ref booking _id (or booking reference)
 * @param {{ paymentIntentId: string, captured?: boolean, amount?: number, currency?: string }} payment
 *   captured: true when the money was taken (not just held on the card)
 * @returns {Promise<{ found: boolean, confirmed: boolean, booking?: object }>}
 */
async function confirmPaidBooking(ref, { paymentIntentId, captured = false, amount, currency } = {}) {
  const Booking = require("../models/Booking");
  const now = new Date();
  const payStatus = captured ? "Completed" : "Authorized";

  // Atomic: only one event can move it from waiting to Confirmed.
  const booking = await Booking.findOneAndUpdate(
    { ...findQuery(ref), status: { $in: WAITING } },
    {
      $set: {
        status: "Confirmed",
        "payment.stripePaymentIntentId": paymentIntentId,
        "payment.status": payStatus,
        [captured ? "payment.capturedAt" : "payment.authorizedAt"]: now,
      },
    },
    { new: true },
  );

  if (!booking) {
    // Already confirmed (another event got there first, or admin did it): keep the record right.
    const existing = await Booking.findOne(findQuery(ref));
    if (!existing) return { found: false, confirmed: false };
    const p = existing.payment || {};
    const recorded = p.stripePaymentIntentId === paymentIntentId && ["Authorized", "Completed"].includes(p.status);
    if (!recorded || (captured && p.status !== "Completed")) {
      const set = { "payment.stripePaymentIntentId": paymentIntentId };
      if (p.status !== "Completed") set["payment.status"] = payStatus; // never downgrade a captured payment
      set[captured ? "payment.capturedAt" : "payment.authorizedAt"] = (captured ? p.capturedAt : p.authorizedAt) || now;
      await Booking.updateOne({ _id: existing._id }, { $set: set });
    }
    console.log(`💳 Payment recorded for ${existing.bookingId} (status left as ${existing.status})`);
    return { found: true, confirmed: false, booking: existing };
  }

  console.log(`✅ ${booking.bookingId} confirmed — payment ${captured ? "taken" : "held on the card"}`);
  await afterConfirmed(booking, { amount, currency });
  return { found: true, confirmed: true, booking };
}

// Everything that should happen the moment a paid booking is confirmed.
async function afterConfirmed(booking, { amount, currency } = {}) {
  const { sendEmail, templates } = require("./emailService");

  // The customer's booking confirmation — straight away (even if admin skipped the email when
  // creating the booking: this is the "you've paid, you're booked" email).
  if (booking.customer?.email) {
    await sendEmail({
      to: booking.customer.email,
      subject: `Booking Confirmed ✅ — ${booking.bookingId} | Cleaniq Services`,
      html: templates.bookingConfirmation(booking),
    }).catch((e) => console.error("Confirmation email error:", e.message));
  }
  require("./pushNotifications")
    .pushToBookingCustomer(booking, "Booking confirmed ✅", `Your ${booking.service} is confirmed. Thank you for your payment.`, { type: "status" })
    .catch(() => {});

  setImmediate(() => {
    require("./smsService").triggerBookingConfirmed?.(booking)?.catch?.((e) => console.error("SMS confirm error:", e.message));
  });
  try {
    require("./metaCapi").sendCapiEvent?.("Purchase", {
      email: booking.customer?.email,
      phone: booking.customer?.phone,
      value: amount ?? booking.payment?.amount,
      currency: (currency || "gbp").toUpperCase(),
      bookingId: booking._id,
      sourceUrl: "https://cleaniqservices.com/book",
    })?.catch?.(() => {});
  } catch {}

  // Reminders before the clean (replaces any from before it was paid).
  await require("./automationEngine").rescheduleBookingReminders(booking).catch((e) => console.error("Reminder error:", e.message));
}

module.exports = { confirmPaidBooking, afterConfirmed, WAITING };
