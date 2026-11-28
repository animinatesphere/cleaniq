const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    waitDays: { type: Number, default: 0 }, // days after previous step
    // A/B test: a second subject and/or text. Contacts are split evenly between A and B.
    subjectB: { type: String, default: "" },
    bodyB: { type: String, default: "" },
  },
  { _id: false }
);

const coldCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  fromName: { type: String, default: "" },
  status: {
    type: String,
    enum: ["draft", "active", "scheduled", "paused", "completed"],
    default: "draft",
  },
  // Paused automatically by Protection (e.g. too many bounces): why and when.
  pausedReason: { type: String, default: "" },
  autoPausedAt: { type: Date },
  steps: [stepSchema],
  mailboxIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ColdMailbox" }],
  contactIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ColdContact" }],
  stats: {
    sent:         { type: Number, default: 0 },
    replied:      { type: Number, default: 0 },
    bounced:      { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    failed:       { type: Number, default: 0 },
  },
  // "plain" reads like a normal personal email and lands in the inbox far more often than the
  // designed "branded" template, so it's the default for new campaigns.
  emailStyle:       { type: String, enum: ["branded", "plain"], default: "plain" },
  // Open tracking (a tiny invisible image) and click tracking (links go via our server first).
  trackOpens:       { type: Boolean, default: true },
  trackClicks:      { type: Boolean, default: true },
  // Skip contacts whose email check says the address can't receive email.
  skipInvalid:      { type: Boolean, default: true },
  createdAt:        { type: Date, default: () => new Date() },
  launchedAt:       { type: Date },
  scheduledStartAt: { type: Date },
});

module.exports = mongoose.model("ColdCampaign", coldCampaignSchema);
