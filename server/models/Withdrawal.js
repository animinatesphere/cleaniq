const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    required: true,
  },
  workerName: { type: String, required: true },
  workerEmail: { type: String },
  workerPhone: { type: String },
  workerAddress: { type: String },
  workerPostcode: { type: String },

  // Earnings and amounts
  amount: { type: Number, required: true },
  completedJobs: [
    {
      bookingId: String,
      service: String,
      amount: Number,
      completedDate: Date,
    },
  ],

  // Bank details
  bankDetails: {
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    sortCode: { type: String, required: true },
    bankName: { type: String },
  },

  // Status and scheduling
  status: {
    type: String,
    enum: [
      "upcoming",
      "pending",
      "approved",
      "processing",
      "completed",
      "failed",
    ],
    default: "upcoming",
  },
  payoutType: {
    type: String,
    enum: ["weekly", "monthly", "fixed_8days"],
    default: "weekly",
  },
  expectedPayoutDate: { type: Date }, // When payout is scheduled
  reason: { type: String, default: "" }, // If failed/rejected
  adminNotes: { type: String, default: "" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  completedAt: { type: Date },
  transactionRef: { type: String }, // Bank transaction reference
});

withdrawalSchema.index({ workerId: 1, status: 1 });
withdrawalSchema.index({ expectedPayoutDate: 1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
