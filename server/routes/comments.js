const express = require("express");
const router = express.Router();
const BlogComment = require("../models/BlogComment");

// GET all approved comments for a blog post
router.get("/:postId", async (req, res) => {
  try {
    const comments = await BlogComment.find({
      postId: req.params.postId,
      approved: true,
    }).sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all comments for a blog post (including unapproved) - for admin
router.get("/admin/:postId", async (req, res) => {
  try {
    const comments = await BlogComment.find({ postId: req.params.postId }).sort(
      {
        createdAt: -1,
      },
    );

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new comment
router.post("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { name, email, content } = req.body;

    if (!name || !email || !content) {
      return res
        .status(400)
        .json({ error: "Name, email, and content are required" });
    }

    if (content.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Comment must be at least 3 characters" });
    }

    const newComment = new BlogComment({
      postId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      content: content.trim(),
      approved: false,
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// APPROVE comment - admin only
router.put("/approve/:commentId", async (req, res) => {
  try {
    const comment = await BlogComment.findByIdAndUpdate(
      req.params.commentId,
      { approved: true },
      { new: true },
    );

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE comment - admin only
router.delete("/:commentId", async (req, res) => {
  try {
    const comment = await BlogComment.findByIdAndDelete(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
