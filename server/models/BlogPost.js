const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: "Cleaniq Team",
    },
    published: {
      type: Boolean,
      default: true,
    },
    // When the post goes live on the website. Published posts with a future date are "scheduled":
    // hidden until then, then shown automatically. null = live since it was created.
    // "manual" (written in admin) or "autopilot" (written and posted by Claude on a schedule).
    source: {
      type: String,
      default: "manual",
    },
    publishAt: {
      type: Date,
      default: null,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BlogPost", blogPostSchema);
