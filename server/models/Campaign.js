const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  message: { type: String, required: true },
  recipientType: {
    type: String,
    enum: ["all", "leads", "custom"],
    default: "custom",
  },
  recipients: [{ type: String }],
  recipientCount: { type: Number, default: 0 },
  sentAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Campaign", campaignSchema);
