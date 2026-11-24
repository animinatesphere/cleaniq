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
    // Extra photos shown under the article, in order, each with an optional caption.
    gallery: {
      type: [{ _id: false, url: String, caption: { type: String, default: "" } }],
      default: [],
    },
    // Before & after photo pairs shown with a slider under the article.
    beforeAfter: {
      type: [{ _id: false, before: String, after: String, caption: { type: String, default: "" } }],
      default: [],
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
    // Readable, permanent web address: /blog/<slug> (from the title when the post is first saved).
    // It isn't changed when the title is edited later, so links and Google rankings keep working.
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: { unique: true, sparse: true },
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

// "Kitchen Deep Cleaning: What Works?" -> "kitchen-deep-cleaning-what-works" (same rules as
// src/utils/slugGenerator.js), at most 80 characters, cut at a word.
function slugify(title = "") {
  let s = String(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
  if (s.length > 80) s = s.slice(0, 80).replace(/-[^-]*$/, "");
  return s.replace(/^-+|-+$/g, "") || "post";
}

async function uniqueSlug(model, base, id) {
  let slug = base;
  for (let n = 2; await model.exists({ slug, _id: { $ne: id } }); n++) slug = `${base}-${n}`;
  return slug;
}

// New posts get a slug from their title; existing slugs are never changed automatically.
blogPostSchema.pre("validate", async function setSlug() {
  if (!this.slug && this.title) this.slug = await uniqueSlug(this.constructor, slugify(this.title), this._id);
});

// Gives older posts (created before slugs existed) their slug. Safe to run any number of times.
blogPostSchema.statics.ensureSlugs = async function ensureSlugs() {
  const missing = await this.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] }).sort({ createdAt: 1 });
  for (const post of missing) {
    const slug = await uniqueSlug(this, slugify(post.title), post._id);
    await this.updateOne({ _id: post._id }, { $set: { slug } }, { timestamps: false });
  }
  return missing.length;
};

blogPostSchema.statics.slugify = slugify;

module.exports = mongoose.model("BlogPost", blogPostSchema);
