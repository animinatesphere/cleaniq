const express = require("express");
const router = express.Router();
const BlogPost = require("../models/BlogPost");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { moveToTrash } = require("../utils/trash");
const mongoose = require("mongoose");
const adminAuth = require("../middleware/adminAuth");

// Live on the website: published, and its scheduled time (if any) has come.
const liveFilter = () => ({
  published: true,
  $or: [{ publishAt: null }, { publishAt: { $exists: false } }, { publishAt: { $lte: new Date() } }],
});

// Admin form → published + publishAt. status: "now" | "schedule" | "draft"
// (older admin pages send only published "true"/"false").
function publishFields(body, existing = null) {
  const status = body.status || (String(body.published) === "true" ? "now" : "draft");
  if (status === "draft") return { published: false, publishAt: existing?.publishAt ?? null };
  if (status === "schedule") {
    const at = new Date(body.publishAt);
    if (Number.isNaN(at.getTime())) return { error: "Please choose a valid date and time to publish." };
    if (at.getTime() < Date.now() - 60 * 1000) return { error: "The scheduled time is in the past. Choose a future time, or Publish now." };
    return { published: true, publishAt: at };
  }
  // Publish now: keep the original go-live time if it already went live, else now.
  const was = existing?.publishAt && existing.publishAt <= new Date() && existing.published ? existing.publishAt : null;
  return { published: true, publishAt: was || new Date() };
}

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads/blog");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for blog image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "blog-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Photos a post uses must be ones uploaded here (/uploads/blog/...), never other addresses.
const OUR_PHOTO = /^\/uploads\/blog\/blog-[\w.-]+\.(jpe?g|png|gif|webp)$/i;
const cap = (v) => String(v || "").trim().slice(0, 200);
const parseList = (raw) => {
  if (raw === undefined) return undefined;
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v.slice(0, 40) : [];
  } catch {
    return [];
  }
};
/** gallery: [{ url, caption }] — only our own uploaded photos are kept. */
function cleanGallery(raw) {
  const list = parseList(raw);
  return list && list.filter((g) => OUR_PHOTO.test(g?.url || "")).map((g) => ({ url: g.url, caption: cap(g.caption) }));
}
/** beforeAfter: [{ before, after, caption }] — both photos must be our own uploads. */
function cleanBeforeAfter(raw) {
  const list = parseList(raw);
  return list && list.filter((p) => OUR_PHOTO.test(p?.before || "") && OUR_PHOTO.test(p?.after || "")).map((p) => ({ before: p.before, after: p.after, caption: cap(p.caption) }));
}

// Upload photos for a post (gallery, before & after, or pictures inside the article).
// Returns their addresses; they're saved with the post when it's saved.
router.post("/admin/photos", adminAuth, upload.array("photos", 20), (req, res) => {
  res.json({ urls: (req.files || []).map((f) => `/uploads/blog/${f.filename}`) });
});

// Debug endpoint - GET all blog posts (published and unpublished) for testing
router.get("/debug/all", adminAuth, async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json({
      totalCount: posts.length,
      publishedCount: posts.filter((p) => p.published).length,
      draftCount: posts.filter((p) => !p.published).length,
      posts: posts.map((p) => ({
        _id: p._id,
        title: p.title,
        published: p.published,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/blog/admin/ai-draft — Claude drafts a post for the editor (nothing is saved).
router.post("/admin/ai-draft", adminAuth, express.json(), async (req, res) => {
  try {
    const topic = String(req.body?.topic || "").trim().slice(0, 300);
    if (topic.length < 5) return res.status(400).json({ error: "Tell Claude what the post should be about." });
    const draft = await require("../utils/blogWriter").draftBlogPost({
      topic,
      keywords: String(req.body?.keywords || "").trim().slice(0, 300),
      notes: String(req.body?.notes || "").trim().slice(0, 1000),
    });
    res.json(draft);
  } catch (error) {
    console.error("[blog] AI draft failed:", error.message);
    res.status(502).json({ error: error.message || "The AI draft failed. Please try again." });
  }
});

// Blog autopilot: Claude writes and posts on a schedule (utils/blogAutopilot.js).
router.get("/admin/autopilot", adminAuth, async (req, res) => {
  try {
    res.json(await require("../utils/blogAutopilot").getSettings());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/admin/autopilot", adminAuth, express.json(), async (req, res) => {
  try {
    res.json(await require("../utils/blogAutopilot").saveSettings(req.body || {}));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.post("/admin/autopilot/run-now", adminAuth, async (req, res) => {
  try {
    const post = await require("../utils/blogAutopilot").runNow();
    res.status(201).json(post);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// GET all published blog posts (for public blog page)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    await ensureSlugs();
    // Newest first by go-live time (older posts without one use their created date).
    const posts = await BlogPost.aggregate([
      { $match: liveFilter() },
      { $addFields: { liveAt: { $ifNull: ["$publishAt", "$createdAt"] } } },
      { $sort: { liveAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const total = await BlogPost.countDocuments(liveFilter());

    res.json({
      posts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Older posts get their readable address the first time the blog is loaded after this update.
let slugsReady = null;
const ensureSlugs = () => {
  if (!slugsReady) {
    slugsReady = BlogPost.ensureSlugs()
      .then((n) => n && console.log(`[blog] gave ${n} older post(s) a readable address`))
      .catch((e) => { slugsReady = null; console.error("[blog] slug backfill:", e.message); });
  }
  return slugsReady;
};

// GET single blog post by its readable address (/blog/<slug>)
router.get("/slug/:slug", async (req, res) => {
  try {
    await ensureSlugs();
    const post = await BlogPost.findOneAndUpdate(
      { slug: String(req.params.slug).toLowerCase(), ...liveFilter() },
      { $inc: { views: 1 } },
      { new: true },
    );
    if (!post) return res.status(404).json({ error: "Blog post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single blog post
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Blog post not found" });
    // Drafts and scheduled posts aren't visible before they go live.
    const post = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, ...liveFilter() },
      { $inc: { views: 1 } },
      { new: true },
    );

    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all posts for admin (published and unpublished)
router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new blog post with image
router.post("/", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, content, author } = req.body;

    if (!title || !description || !req.file) {
      return res
        .status(400)
        .json({ error: "Title, description, and image are required" });
    }

    const live = publishFields(req.body);
    if (live.error) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: live.error });
    }
    const imagePath = `/uploads/blog/${req.file.filename}`;

    const newPost = new BlogPost({
      title,
      description,
      content: content || "",
      image: imagePath,
      gallery: cleanGallery(req.body.gallery) || [],
      beforeAfter: cleanBeforeAfter(req.body.beforeAfter) || [],
      author: author || "Cleaniq Team",
      published: live.published,
      publishAt: live.publishAt,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    // Delete uploaded file if post creation fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// UPDATE blog post
router.put("/:id", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, content, author, published } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Blog post not found" });
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Update fields
    if (title) post.title = title;
    if (description) post.description = description;
    if (content) post.content = content;
    if (author) post.author = author;
    const gallery = cleanGallery(req.body.gallery);
    if (gallery) post.gallery = gallery;
    const beforeAfter = cleanBeforeAfter(req.body.beforeAfter);
    if (beforeAfter) post.beforeAfter = beforeAfter;
    if (req.body.status || published !== undefined) {
      const live = publishFields(req.body, post);
      if (live.error) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: live.error });
      }
      post.published = live.published;
      post.publishAt = live.publishAt;
    }

    // Update image if new one is provided
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, "..", "public", post.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Error deleting old image:", err);
        });
      }

      post.image = `/uploads/blog/${req.file.filename}`;
    }

    post.updatedAt = Date.now();
    await post.save();

    res.json(post);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE blog post
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    await moveToTrash("BlogPost", post, post.title);
    await post.deleteOne();

    // Note: the image file is left on disk (not deleted) so a restore from
    // the Bin still has a working image. It's only removed if the trash
    // item is permanently purged.

    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
