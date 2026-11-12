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
});

coldSendSchema.index({ campaignId: 1, contactId: 1, stepIndex: 1 }, { unique: true });
coldSendSchema.index({ status: 1, scheduledAt: 1 });
coldSendSchema.index({ gmailThreadId: 1 });

module.exports = mongoose.model("ColdSend", coldSendSchema);
