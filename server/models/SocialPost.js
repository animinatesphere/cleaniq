// A social media post: text (with optional per-network wording), photos, the accounts it goes to,
// and when. The scheduler publishes it at scheduledAt and records what happened per account.
const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount" },
    network: String,
    name: String,
    status: { type: String, enum: ["posted", "failed"] },
    externalId: String,
    url: String,
    error: String,
    at: Date,
  },
  { _id: false },
);

const socialPostSchema = new mongoose.Schema(
  {
    text: { type: String, default: "" },
    // Different wording for a network (e.g. shorter for X, hashtags for Instagram). Empty = use text.
    variants: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      x: { type: String, default: "" },
    },
    // Photos: "/uploads/social/…" (uploaded) or "library:our-work/…" (our own job photos).
    images: { type: [String], default: [] },
    credit: { type: String, default: "" }, // e.g. "Photo: Jane Doe on Unsplash"
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount" }],
    status: { type: String, enum: ["draft", "scheduled", "posting", "posted", "partial", "failed"], default: "draft", index: true },
    scheduledAt: { type: Date, default: null, index: true },
    postedAt: { type: Date, default: null },
    results: { type: [resultSchema], default: [] },
    source: { type: String, enum: ["manual", "autopilot"], default: "manual" },
    autopilot: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAutopilot", default: null },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SocialPost", socialPostSchema);
