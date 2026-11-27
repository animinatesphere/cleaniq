// Social autopilot: on the chosen days and times (UK time), Claude writes a post from the
// instructions, picks a photo (ours first, Unsplash if none fits) and posts it to the accounts.
const mongoose = require("mongoose");

const socialAutopilotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: false },
    instructions: { type: String, default: "" },
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount" }],
    days: { type: [Number], default: [1, 3, 5] }, // 0 = Sunday … 6 = Saturday
    times: { type: [String], default: ["10:00"] }, // "HH:MM", UK time
    pictures: { type: String, enum: ["ours-then-unsplash", "ours", "unsplash", "none"], default: "ours-then-unsplash" },
    // Photos and videos the team chose for this autopilot. Each post uses one (Claude picks the best
    // fit) and they're all used before any repeats. When empty, "pictures" decides.
    media: {
      type: [{ _id: false, ref: String, kind: { type: String, enum: ["photo", "video"], default: "photo" }, note: { type: String, default: "" } }],
      default: [],
    },
    usedMedia: { type: [String], default: [] },
    nextRunAt: { type: Date, default: null, index: true },
    lastRunAt: { type: Date, default: null },
    lastResult: { type: String, default: "" },
    lastPost: { type: mongoose.Schema.Types.ObjectId, ref: "SocialPost", default: null },
    failures: { type: Number, default: 0 },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SocialAutopilot", socialAutopilotSchema);
