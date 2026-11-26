// Social media dashboard logins (/social): can schedule and post to the business's social accounts
// only. They can't use the main admin (bookings, customers, payments…). Main admins manage them.
const mongoose = require("mongoose");

const socialUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, never returned by the API
    active: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SocialUser", socialUserSchema);
