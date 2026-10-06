const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customer: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
  },
  service: {
    type: String,
    required: true,
  },
  details: mongoose.Schema.Types.Mixed,
  property: mongoose.Schema.Types.Mixed,
  schedule: {
    date: Date,
    timeSlot: String,
    preferredTime: String,
  },
  payment: {
    amount: Number,
    currency: String,
    status: { type: String, default: "Pending" },
    method: String,
    billingType: { type: String, default: "hourly" }, // "hourly" | "flat" — flat = one-off fixed price, not duration-based
    stripePaymentIntentId: String, // Store Stripe PaymentIntent ID for "authorize then capture"
    authorizedAt: Date, // When payment was authorized
    capturedAt: Date, // When payment was captured (money deducted)
    // Regular cleans: later visits are charged to the saved card when the cleaner arrives.
    chargeOnArrival: { type: Boolean, default: false },
    stripeCustomerId: String,
    stripePaymentMethodId: String,
    failedAt: Date,
    failureReason: String,
    paymentLinkUrl: String, // sent to the customer when an automatic charge fails
    taxRate: Number, // % added on top (admin Settings → Tax), if any
    taxAmount: Number, // included in amount
    taxLabel: String, // e.g. "VAT"
  },
  region: String,
  leadSource: { type: String, default: "Organic" }, // Bark, Checkatrade, MyJobQuote, MyBuilder, Instagram, Facebook, TikTok, Google, Referral, Organic
  suppliesProvidedBy: { type: String, default: null }, // "Customer" | "Cleaniq"
  createdByAdmin: { type: String, default: null }, // username of the admin who created this booking, if created from the admin portal
  noPaymentRequired: { type: Boolean, default: false }, // true if payment was already collected outside the system (cash/bank transfer) when admin created the booking
  skipConfirmationEmail: { type: Boolean, default: false }, // true to silently create the booking with no confirmation email — invoice/payment link/review request can still be sent manually via CRM actions
  checklist: {
    type: [{ task: String, done: { type: Boolean, default: false } }],
    default: [],
  },
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    default: null,
  },
  assignedWorkerName: { type: String, default: null },
  status: { type: String, default: "Confirmed" },
  jobAcceptedTime: { type: Date, default: null },
  jobArrivedTime: { type: Date, default: null },
  jobStartTime: { type: Date, default: null },
  jobEndTime: { type: Date, default: null },
  jobDurationActual: { type: Number, default: 0 }, // in minutes
  workerRate: { type: Number, default: null }, // per hour rate set by admin
  workerDuration: { type: Number, default: null }, // expected duration set by admin
  workerRateBonus: { type: Number, default: 0 }, // top-rated bonus (£/hr) included in workerRate
  // The customer's rating of their cleaner after the clean (1–5 stars).
  cleanerRating: {
    stars: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: "" },
    ratedAt: Date,
  },
  rejectedBy: [{ type: String }],
  visibleToWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worker" }],
  hiddenFromWorkers: { type: Boolean, default: false }, // admin switched the job off: no cleaner sees it
  // A job split into shifts (Rota): each shift is its own booking for one worker, linked to the
  // main booking. The customer only ever sees the main booking.
  splitIntoShifts: { type: Boolean, default: false }, // on the main booking
  isShift: { type: Boolean, default: false, index: true }, // on each shift
  parentBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null, index: true },
  shiftNumber: { type: Number, default: null },
  // Booking that came through a creator / influencer (utils/creators.js).
  creator: {
    id:   { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null, index: true },
    code: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  creatorCommission: {
    percent:  { type: Number, default: null },
    amount:   { type: Number, default: 0 },
    status:   { type: String, enum: ["pending", "earned", "paid", "cancelled", null], default: null }, // earned = done & paid, owed to the creator
    earnedAt: { type: Date, default: null },
    paidAt:   { type: Date, default: null },
    payoutRef: { type: String, default: "" },
  },
  photos: [{
    photoType: { type: String, enum: ["before", "after", "damage", "other"] },
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  workerReport: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  meta: mongoose.Schema.Types.Mixed,
});

// A split job (Rota) that gets cancelled — by admin, the customer or the AI — cancels its
// unstarted shifts too, and each worker is told. Covers save() and findOneAndUpdate() paths.
async function cancelShiftsOf(doc) {
  if (!doc || !doc.splitIntoShifts || doc.status !== "Cancelled") return;
  const Booking = mongoose.model("Booking");
  const shifts = await Booking.find({ parentBooking: doc._id, isShift: true, status: { $in: ["Assigned", "Accepted", "Confirmed", "Pending"] } });
  if (!shifts.length) return;
  await Booking.updateMany({ _id: { $in: shifts.map((s) => s._id) } }, { $set: { status: "Cancelled" } });
  try {
    const { sendPushToUser } = require("../utils/pushNotifications");
    const Notification = require("./Notification");
    for (const s of shifts) {
      const message = `${s.service} at ${s.schedule?.timeSlot || ""} (${s.bookingId}) has been cancelled.`;
      await Notification.create({ workerId: s.assignedWorker, title: "Shift cancelled", message, type: "job", bookingId: s.bookingId }).catch(() => {});
      sendPushToUser("worker", s.assignedWorker, "Shift cancelled", message, { type: "job_cancelled", bookingId: s.bookingId }).catch(() => {});
    }
  } catch {}
}
bookingSchema.post("save", (doc) => { cancelShiftsOf(doc).catch((e) => console.error("Shift cancel error:", e.message)); });
bookingSchema.post("findOneAndUpdate", (doc) => { cancelShiftsOf(doc).catch((e) => console.error("Shift cancel error:", e.message)); });

// Creators: a new booking from a customer a creator brought in is tagged to that creator (by the
// admin's rule), and the commission follows the booking: earned once done and paid, cancelled
// if the booking is cancelled. See utils/creators.js.
bookingSchema.pre("save", async function tagCreator() {
  if (!this.isNew || this.creator?.id || this.isShift) return;
  try {
    await require("../utils/creators").attributeBooking(this);
  } catch (e) {
    console.error("Creator tagging error:", e.message);
  }
});
const settleCreator = (doc) => {
  if (!doc?.creator?.id) return;
  require("../utils/creators").settleCommission(doc).catch((e) => console.error("Creator commission error:", e.message));
};
bookingSchema.post("save", settleCreator);
bookingSchema.post("findOneAndUpdate", settleCreator);

module.exports = mongoose.model("Booking", bookingSchema);
