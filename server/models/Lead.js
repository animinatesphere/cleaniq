const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, default: "" },
  message: { type: String, default: "" },
  source: { type: String, default: "Contact Form" }, // Contact Form, Quote, Booking, etc.
  acknowledged: { type: Boolean, default: false }, // one-time "thanks for reaching out" email sent
  createdAt: { type: Date, default: Date.now },
});

leadSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model("Lead", leadSchema);
