// The cold email inbox: replies from contacts (and our answers to them), linked to the campaign and
// the email they replied to.
const mongoose = require("mongoose");

const coldReplySchema = new mongoose.Schema({
  direction: { type: String, enum: ["in", "out"], default: "in" },
  sendId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdSend" },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdCampaign" },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdContact" },
  mailboxId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdMailbox" },
  providerMessageId: { type: String }, // Gmail message id / Microsoft Graph message id
  internetMessageId: { type: String }, // the email's Message-ID header (for threading our answers)
  threadId: { type: String },
  from: String,
  to: String,
  subject: String,
  body: String,
  // interested | question | not_interested | out_of_office | unsubscribe | wrong_person | other
  category: { type: String, default: "" },
  autoReply: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  sentBy: String, // who answered (for "out")
  receivedAt: { type: Date, default: () => new Date() },
});
coldReplySchema.index({ mailboxId: 1, providerMessageId: 1 }, { unique: true, partialFilterExpression: { providerMessageId: { $type: "string" } } });
coldReplySchema.index({ contactId: 1, receivedAt: 1 });
coldReplySchema.index({ direction: 1, read: 1, receivedAt: -1 });

module.exports = mongoose.model("ColdReply", coldReplySchema);
