const express = require("express");
const router = express.Router();
const BlogPost = require("../models/BlogPost");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

// Debug endpoint - GET all blog posts (published and unpublished) for testing
router.get("/debug/all", async (req, res) => {
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

// GET all published blog posts (for public blog page)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await BlogPost.find({ published: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments({ published: true });

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

// GET single blog post
router.get("/:id", async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
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
router.get("/admin/all", async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new blog post with image
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, content, author, published } = req.body;

    if (!title || !description || !req.file) {
      return res
        .status(400)
        .json({ error: "Title, description, and image are required" });
    }

    const imagePath = `/uploads/blog/${req.file.filename}`;

    const newPost = new BlogPost({
      title,
      description,
      content: content || "",
      image: imagePath,
      author: author || "Cleaniq Team",
      published: published === "true" ? true : false,
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
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, content, author, published } = req.body;
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
    if (published !== undefined) post.published = published === "true";

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
router.delete("/:id", async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Delete image file
    const imagePath = path.join(__dirname, "..", "public", post.image);
    if (fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Error deleting image:", err);
      });
    }

    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
