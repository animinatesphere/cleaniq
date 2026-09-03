const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  company: {
    id:    { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    name:  String,
    email: String,
    phone: String,
  },
  service:  { type: String, required: true },
  details:  mongoose.Schema.Types.Mixed,
  property: mongoose.Schema.Types.Mixed,
  schedule: {
    date:          Date,
    timeSlot:      String,
    preferredTime: String,
  },
  contact: {
    name:  { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  region:   { type: String, default: "" },
  notes:    { type: String, default: "" },
  payment: {
    amount:   { type: Number, default: null },
    currency: { type: String, default: "GBP" },
  },
  status: {
    type: String,
    enum: ["pending_review", "approved", "assigned", "in_progress", "completed", "cancelled", "rejected"],
    default: "pending_review",
  },
  assignedWorker:     { type: mongoose.Schema.Types.ObjectId, ref: "Worker", default: null },
  assignedWorkerName: { type: String, default: null },
  linkedBookingId:    { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  rejectedReason:     { type: String, default: null },
  jobAcceptedTime:    { type: Date, default: null },
  jobArrivedTime:     { type: Date, default: null },
  jobStartTime:       { type: Date, default: null },
  jobEndTime:         { type: Date, default: null },
  createdAt:          { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", jobSchema);
