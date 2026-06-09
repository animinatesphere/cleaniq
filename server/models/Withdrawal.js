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
  amount: { type: Number, required: true },
  bankDetails: {
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    sortCode: { type: String, required: true },
    bankName: { type: String },
  },
  status: {
    type: String,
    enum: ["pending", "approved", "processing", "completed", "failed"],
    default: "pending",
  },
  reason: { type: String, default: "" }, // If failed/rejected
  adminNotes: { type: String, default: "" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  completedAt: { type: Date },
  transactionRef: { type: String }, // Bank transaction reference
});

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
