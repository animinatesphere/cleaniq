const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  name: { type: String },
  subject: { type: String, required: true },
  message: { type: String },
  body: { type: String },
  segment: { type: String, default: "custom" },
  recipientType: {
    type: String,
    enum: ["all", "leads", "custom", "vip", "regular", "new", "at-risk"],
    default: "custom",
  },
  recipients: [{ type: String }],
  recipientCount: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  status: { type: String, enum: ["sent", "draft", "failed"], default: "sent" },
  sentAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Campaign", campaignSchema);
