// Mailbox messages already checked for replies/bounces (so each is only fetched once). Forgotten after 30 days.
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  mailboxId: { type: mongoose.Schema.Types.ObjectId, required: true },
  messageId: { type: String, required: true },
  at: { type: Date, default: () => new Date(), expires: 30 * 24 * 3600 },
});
schema.index({ mailboxId: 1, messageId: 1 }, { unique: true });

module.exports = mongoose.model("ColdSeenMessage", schema);
