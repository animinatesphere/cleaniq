const mongoose = require("mongoose");

// A customer's regular clean (e.g. every Thursday, 2 hours). The first visit is paid when they
// book; the card is saved with Stripe and every later visit is charged when the cleaner arrives.
// Visits are ordinary Bookings (meta.subscriptionId), created a few weeks ahead on a rolling basis.
const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionRef: { type: String, required: true, unique: true }, // e.g. SUB-7K3M9Q
    status: {
      type: String,
      enum: ["pending_payment", "active", "paused", "cancelled"],
      default: "pending_payment",
    },
    frequency: { type: String, enum: ["Weekly", "Fortnightly", "Monthly", "Quarterly"], required: true },
    customer: {
      firstName: String,
      lastName: String,
      email: { type: String, lowercase: true, trim: true },
      phone: String,
    },
    service: { type: String, required: true },
    // Price charged for every visit after the first (GBP, incl. extras and supplies).
    pricePerVisit: { type: Number, required: true, min: 0 },
    setupFee: { type: Number, default: 0 }, // one-off fee paid with the first clean (admin → Regular Cleans)
    currency: { type: String, default: "GBP" },
    startDate: { type: Date, required: true }, // first visit; later visits keep its weekday/time
    lastVisitDate: { type: Date, default: null }, // latest visit created so far
    firstBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    // Copied onto every new visit (details, property, schedule times, region, supplies, workerRate…)
    template: { type: mongoose.Schema.Types.Mixed, default: {} },
    stripeCustomerId: { type: String, default: "" },
    stripePaymentMethodId: { type: String, default: "" },
    source: { type: String, default: "Website" }, // Website | App
    pausedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, default: "" }, // "customer" | admin username
  },
  { timestamps: true },
);

subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ "customer.email": 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
