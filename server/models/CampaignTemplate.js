const mongoose = require("mongoose");
const campaignTemplateSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  subject: { type: String, required: true },
  body:    { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("CampaignTemplate", campaignTemplateSchema);
