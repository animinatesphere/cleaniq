const mongoose = require("mongoose");

const SmsLogSchema = new mongoose.Schema({
  to:          { type: String, required: true },
  body:        { type: String, required: true },
  trigger:     { type: String, required: true }, // e.g. "booking_confirmed"
  bookingId:   { type: String },
  bookingRef:  { type: String },
  recipient:   { type: String, enum: ["customer", "worker"], default: "customer" },
  status:      { type: String, enum: ["sent", "failed", "pending"], default: "pending" },
  twilioSid:   { type: String },
  error:       { type: String },
  cost:        { type: String },
}, { timestamps: true });

module.exports = mongoose.model("SmsLog", SmsLogSchema);
