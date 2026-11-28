// What happened to a cold email: sent, opened, clicked, replied, auto-reply, bounced, unsubscribed.
// One row per event, for activity timelines and day-by-day charts.
const mongoose = require("mongoose");

const coldEventSchema = new mongoose.Schema({
  type: { type: String, enum: ["sent", "opened", "clicked", "replied", "auto_reply", "bounced", "soft_bounce", "unsubscribed", "protected"], required: true },
  sendId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdSend" },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdCampaign" },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdContact" },
  mailboxId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdMailbox" },
  stepIndex: Number,
  variant: String,
  // Opens/clicks within a minute of sending, or from known email scanners, are probably security
  // software checking the email, not the person: kept, but not counted.
  bot: { type: Boolean, default: false },
  url: String,
  detail: String,
  at: { type: Date, default: () => new Date() },
});
coldEventSchema.index({ campaignId: 1, at: -1 });
coldEventSchema.index({ contactId: 1, at: -1 });
coldEventSchema.index({ type: 1, at: -1 });

module.exports = mongoose.model("ColdEvent", coldEventSchema);
