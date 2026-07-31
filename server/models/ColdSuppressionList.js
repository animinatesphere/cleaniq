const mongoose = require("mongoose");

const coldSuppressionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  reason: {
    type: String,
    enum: ["unsubscribed", "bounced", "manual"],
    default: "manual",
  },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdCampaign" },
  addedAt:    { type: Date, default: () => new Date() },
});

module.exports = mongoose.model("ColdSuppressionList", coldSuppressionSchema);
