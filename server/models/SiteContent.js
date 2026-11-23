// Website text edited by admins in Admin → Website Content.
// One document per page section group, e.g. "service:carpet-cleaning-manchester" or
// "location:salford". `data` is null when the page uses the text written in the website's code.
// The website reads this at build time (scripts/prerender.mjs), so edits go live when an admin
// presses Publish, which rebuilds the site.
const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: String, default: "" },
  },
  { _id: false },
);

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedBy: { type: String, default: "" },
    // Earlier versions, newest first (kept short so documents stay small).
    history: { type: [versionSchema], default: [] },
  },
  { timestamps: true, minimize: false },
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
