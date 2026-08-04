const mongoose = require("mongoose");

const coldMailboxSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  provider: { type: String, enum: ["gmail", "outlook"], default: "gmail" },
  accessToken: { type: String },       // AES-256-GCM encrypted
  refreshToken: { type: String },      // AES-256-GCM encrypted
  tokenExpiry: { type: Date },
  dailyLimit: { type: Number, default: 40 },
  sentToday: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: () => new Date() },
  status: { type: String, enum: ["active", "paused", "error"], default: "active" },
  errorMessage: { type: String },
  createdAt: { type: Date, default: () => new Date() },
});

module.exports = mongoose.model("ColdMailbox", coldMailboxSchema);
