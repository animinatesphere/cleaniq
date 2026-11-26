// Photos uploaded to the social dashboard's photo library (the autopilot can pick them too).
const mongoose = require("mongoose");

const socialPhotoSchema = new mongoose.Schema(
  {
    path: { type: String, required: true }, // /uploads/social/…
    kind: { type: String, enum: ["photo", "video"], default: "photo" },
    description: { type: String, default: "" }, // what's in it, so Claude can choose it
    uploadedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SocialPhoto", socialPhotoSchema);
