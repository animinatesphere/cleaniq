const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  html: { type: String, required: true },
  success: { type: Boolean, default: true },
  sentAt: { type: Date, default: Date.now },
});

emailLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);
