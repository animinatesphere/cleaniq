const mongoose = require("mongoose");

const coldSendSchema = new mongoose.Schema({
  campaignId:   { type: mongoose.Schema.Types.ObjectId, ref: "ColdCampaign", required: true },
  contactId:    { type: mongoose.Schema.Types.ObjectId, ref: "ColdContact",  required: true },
  contactEmail: { type: String, required: true, lowercase: true },
  stepIndex:    { type: Number, default: 0 },
  mailboxId:    { type: mongoose.Schema.Types.ObjectId, ref: "ColdMailbox" },
  status: {
    type: String,
    enum: ["pending", "sent", "failed", "skipped", "replied", "bounced"],
    default: "pending",
  },
  scheduledAt:     { type: Date, required: true },
  sentAt:          { type: Date },
  gmailMessageId:  { type: String },
  gmailThreadId:   { type: String },
  error:           { type: String },
  // Network problems (e.g. "fetch failed") are retried automatically up to 3 times, 10 minutes apart.
  attempts:        { type: Number, default: 0 },
  replyFrom:       { type: String },
  replySubject:    { type: String },
  replyBody:       { type: String },
  repliedAt:       { type: Date   },
  // A/B test version of the step used for this email ("A" or "B").
  variant:         { type: String, default: "A" },
  // Tracking (utils/coldTracking.js): a random token in the open pixel and the tracked links.
  trackToken:      { type: String },
  opens:           { type: Number, default: 0 },
  firstOpenedAt:   { type: Date },
  lastOpenedAt:    { type: Date },
  clicks:          { type: Number, default: 0 },
  firstClickedAt:  { type: Date },
  // Bounces found in the mailbox (utils/coldInbox.js).
  bouncedAt:       { type: Date },
  bounceType:      { type: String }, // hard | soft
  bounceReason:    { type: String },
  replyCategory:   { type: String },
});

coldSendSchema.index({ campaignId: 1, contactId: 1, stepIndex: 1 }, { unique: true });
coldSendSchema.index({ status: 1, scheduledAt: 1 });
coldSendSchema.index({ gmailThreadId: 1 });
coldSendSchema.index({ trackToken: 1 }, { sparse: true });
coldSendSchema.index({ mailboxId: 1, contactEmail: 1, sentAt: -1 });

module.exports = mongoose.model("ColdSend", coldSendSchema);
