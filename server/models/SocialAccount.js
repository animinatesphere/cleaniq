// A connected social media account: a Facebook Page, an Instagram business account, a LinkedIn
// profile or company page, or an X account. Tokens are stored encrypted (utils/socialCrypto.js)
// and never sent to the browser.
const mongoose = require("mongoose");

const socialAccountSchema = new mongoose.Schema(
  {
    network: { type: String, enum: ["facebook", "instagram", "linkedin", "x"], required: true },
    externalId: { type: String, required: true }, // page id / ig user id / urn:li:person|organization:… / x user id
    name: { type: String, default: "" },
    handle: { type: String, default: "" },
    picture: { type: String, default: "" },
    token: { type: String, default: "" }, // encrypted
    refreshToken: { type: String, default: "" }, // encrypted
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true }, // included in "all accounts"
    status: { type: String, enum: ["ok", "error"], default: "ok" },
    lastError: { type: String, default: "" },
    connectedBy: { type: String, default: "" },
  },
  { timestamps: true },
);
socialAccountSchema.index({ network: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model("SocialAccount", socialAccountSchema);
