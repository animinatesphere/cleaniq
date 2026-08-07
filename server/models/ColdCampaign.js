const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    waitDays: { type: Number, default: 0 }, // days after previous step
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
  emailStyle:       { type: String, enum: ["branded", "plain"], default: "branded" },
  createdAt:        { type: Date, default: () => new Date() },
  launchedAt:       { type: Date },
  scheduledStartAt: { type: Date },
});

module.exports = mongoose.model("ColdCampaign", coldCampaignSchema);
