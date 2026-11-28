// Cold email protection rules (one document, key "main"), like Apollo's "Sending protection".
const mongoose = require("mongoose");

const coldSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true },
  // Sending safeguards: pause a mailbox / campaign whose bounce rate (last 30 days) goes over the limit.
  autoPause: { type: Boolean, default: true },
  maxBounceRate: { type: Number, default: 3 },   // %
  minSendsBeforePause: { type: Number, default: 20 },
  // Who gets emailed
  skipRisky: { type: Boolean, default: false },  // shared/role addresses (info@, sales@)
  oneCampaignAtATime: { type: Boolean, default: true },
  oneCampaignDays: { type: Number, default: 30 },
  companySpacingHours: { type: Number, default: 24 }, // 0 = off; same company (domain), first emails only
  updatedAt: { type: Date, default: () => new Date() },
});

module.exports = mongoose.model("ColdSettings", coldSettingsSchema);
