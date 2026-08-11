const mongoose = require("mongoose");

const smsContactSchema = new mongoose.Schema({
  firstName:       { type: String, trim: true, default: "" },
  lastName:        { type: String, trim: true, default: "" },
  phone:           { type: String, required: true, trim: true, unique: true },
  normalizedPhone: { type: String, trim: true, default: "" },
  notes:           { type: String, trim: true, default: "" },
  status:          { type: String, enum: ["active", "suppressed"], default: "active" },
  contacted:       { type: Boolean, default: false },
  createdAt:       { type: Date, default: Date.now },
});

module.exports = mongoose.model("SmsContact", smsContactSchema);
