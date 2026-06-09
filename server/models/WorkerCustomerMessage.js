const mongoose = require("mongoose");

const workerCustomerMessageSchema = new mongoose.Schema({
  bookingId: { type: String, required: true },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    default: null,
  },
  customerEmail: { type: String, required: true },
  senderType: { type: String, enum: ["Worker", "Customer"], required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for fast retrieval
workerCustomerMessageSchema.index({ bookingId: 1, createdAt: -1 });
workerCustomerMessageSchema.index({ workerId: 1, createdAt: -1 });
workerCustomerMessageSchema.index({ customerEmail: 1, createdAt: -1 });
workerCustomerMessageSchema.index({ bookingId: 1, isRead: 1 });

module.exports = mongoose.model(
  "WorkerCustomerMessage",
  workerCustomerMessageSchema,
);
