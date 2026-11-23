// Content editor accounts for /content-admin.
//   POST   /api/content-editors/login     { email, password } → { token, editor }   (rate limited)
//   GET    /api/content-editors/me        the signed-in editor (content editor token)
//   GET    /api/content-editors           list accounts (main admin)
//   POST   /api/content-editors           create { name, email, password } (main admin)
//   PATCH  /api/content-editors/:id       { active?, password? } (main admin)
//   DELETE /api/content-editors/:id       remove (main admin)
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ContentEditor = require("../models/ContentEditor");
const adminAuth = require("../middleware/adminAuth");
const contentAuth = require("../middleware/contentAuth");
const { loginRateLimiter, resetLoginRateLimiter } = require("../middleware/loginRateLimiter");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongEnough = (p) => typeof p === "string" && p.length >= 10;
const publicEditor = (e) => ({ _id: e._id, name: e.name, email: e.email, active: e.active, lastLoginAt: e.lastLoginAt, createdAt: e.createdAt });

router.post("/login", express.json(), (req, res, next) => {
  // the shared rate limiter keys on body.username
  req.body = { ...req.body, username: String(req.body?.email || "") };
  next();
}, loginRateLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  try {
    const editor = await ContentEditor.findOne({ email });
    if (!editor || !editor.active) return res.status(400).json({ message: "Invalid email or password" });
    if (editor.lockUntil && editor.lockUntil > Date.now()) {
      return res.status(403).json({ message: "Too many failed attempts. Please try again in 15 minutes." });
    }
    if (!(await bcrypt.compare(password, editor.password))) {
      editor.failedLoginAttempts = (editor.failedLoginAttempts || 0) + 1;
      if (editor.failedLoginAttempts >= 5) editor.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await editor.save();
      return res.status(400).json({ message: "Invalid email or password" });
    }
    editor.failedLoginAttempts = 0;
    editor.lockUntil = null;
    editor.lastLoginAt = new Date();
    await editor.save();
    resetLoginRateLimiter(req);
    const token = jwt.sign({ id: editor._id, scope: "content" }, contentAuth.SECRET, { expiresIn: "8h" });
    res.json({ token, editor: publicEditor(editor) });
  } catch (err) {
    console.error("Content editor login error:", err);
    res.status(500).json({ message: "Sign-in failed. Please try again." });
  }
});

router.get("/me", contentAuth, (req, res) => {
  if (!req.contentEditor) return res.json({ editor: { name: req.admin?.name || req.admin?.username || "Admin", email: req.admin?.email || "", isAdmin: true } });
  res.json({ editor: publicEditor(req.contentEditor) });
});

router.get("/", adminAuth, async (req, res) => {
  const list = await ContentEditor.find().sort({ createdAt: -1 }).lean();
  res.json(list.map(publicEditor));
});

router.post("/", adminAuth, express.json(), async (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 80);
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password;
  if (!name || !EMAIL.test(email)) return res.status(400).json({ message: "Enter a name and a valid email address." });
  if (!strongEnough(password)) return res.status(400).json({ message: "Use a password of at least 10 characters." });
  if (await ContentEditor.findOne({ email })) return res.status(409).json({ message: "There's already a content editor with that email." });
  const editor = await ContentEditor.create({
    name, email, password: await bcrypt.hash(password, 12), createdBy: req.admin?.email || req.admin?.username || "",
  });
  res.status(201).json(publicEditor(editor));
});

router.patch("/:id", adminAuth, express.json(), async (req, res) => {
  const editor = await ContentEditor.findById(req.params.id).catch(() => null);
  if (!editor) return res.status(404).json({ message: "Not found" });
  if (typeof req.body?.active === "boolean") editor.active = req.body.active;
  if (req.body?.password != null) {
    if (!strongEnough(req.body.password)) return res.status(400).json({ message: "Use a password of at least 10 characters." });
    editor.password = await bcrypt.hash(req.body.password, 12);
    editor.passwordChangedAt = new Date();
    editor.failedLoginAttempts = 0;
    editor.lockUntil = null;
  }
  await editor.save();
  res.json(publicEditor(editor));
});

router.delete("/:id", adminAuth, async (req, res) => {
  await ContentEditor.deleteOne({ _id: req.params.id }).catch(() => null);
  res.json({ success: true });
});

module.exports = router;
