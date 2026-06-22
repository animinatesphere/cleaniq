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
  rejectedBy: [{ type: String }], // Array of worker IDs who turned down this job
  createdAt: { type: Date, default: Date.now },
  meta: mongoose.Schema.Types.Mixed, // Catch-all for future expansions
});

module.exports = mongoose.model("Booking", bookingSchema);
