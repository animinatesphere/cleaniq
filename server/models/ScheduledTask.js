const mongoose = require("mongoose");

const scheduledTaskSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "booking_reminder_24h",
      "booking_reminder_3h",
      "review_request_2h",
      "referral_offer_48h",
      "rebooking_discount_3d",
      "quote_followup_24h",
      "quote_followup_3d",
      "lost_lead_7d",
      "followup_1w",
      "followup_2w",
      "followup_1m",
      "followup_2m",
      "followup_3m",
    ],
  },
  status: {
    type: String,
    enum: ["pending", "sent", "failed", "cancelled"],
    default: "pending",
    index: true,
  },
  runAt: { type: Date, required: true, index: true },
  payload: {
    bookingId: String,
    quoteId: String,
    quoteRef: String,
    email: String,
    firstName: String,
    lastName: String,
    service: String,
    date: String,
    bookingRef: String,
    amount: Number,
  },
  attempts: { type: Number, default: 0 },
  error: String,
  executedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ScheduledTask", scheduledTaskSchema);
