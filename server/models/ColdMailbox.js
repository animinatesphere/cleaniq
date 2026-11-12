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
  // Warm-up (utils/deliverability.js): new mailboxes start at 5 emails a day and grow by 3 a day up to
  // dailyLimit. Older mailboxes count from createdAt.
  warmupEnabled: { type: Boolean, default: true },
  warmupStartedAt: { type: Date },
  // Earliest time this mailbox may send its next email (a random 4–9 minute gap after each one).
  nextSendAt: { type: Date },
  // Last DNS check of the mailbox's domain (SPF/DKIM/DMARC/MX).
  health: { type: Object },
  errorMessage: { type: String },
  createdAt: { type: Date, default: () => new Date() },
});

module.exports = mongoose.model("ColdMailbox", coldMailboxSchema);
