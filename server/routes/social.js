// Social media dashboard (/social): connect Facebook Pages, Instagram, LinkedIn and X; write,
// schedule or post now; photo library; autopilots where Claude writes and posts by itself.
// Signed-in social users (their own logins) and main admins can use it; only main admins manage
// the logins.
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const SocialUser = require("../models/SocialUser");
const SocialAccount = require("../models/SocialAccount");
const SocialPost = require("../models/SocialPost");
const SocialAutopilot = require("../models/SocialAutopilot");
const SocialPhoto = require("../models/SocialPhoto");
const socialAuth = require("../middleware/socialAuth");
const { loginRateLimiter, resetLoginRateLimiter } = require("../middleware/loginRateLimiter");
const { encrypt } = require("../utils/socialCrypto");
const networks = require("../utils/socialNetworks");
const scheduler = require("../utils/socialScheduler");

const json = express.json({ limit: "1mb" });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NETWORKS = ["facebook", "instagram", "linkedin", "x", "google", "threads", "tiktok", "pinterest"];
const CONNECT = ["meta", "linkedin", "x", "google", "threads", "tiktok", "pinterest"];
const CONNECT_NAMES = { meta: "Facebook/Instagram", linkedin: "LinkedIn", x: "X", google: "Google Business Profile", threads: "Threads", tiktok: "TikTok", pinterest: "Pinterest" };
const APP_URL = () => (process.env.SOCIAL_APP_URL || "https://www.cleaniqservices.com/social").replace(/\/+$/, "");
const isId = (id) => mongoose.isValidObjectId(id);
const adminOnly = (req, res, next) => (req.socialUser ? res.status(403).json({ message: "Only main admins can manage social media logins." }) : next());
const fail = (res, err, fallback) => {
  if (!err.status || err.status >= 500) console.error("[social]", err.message);
  res.status(err.status && err.status < 500 ? err.status : 500).json({ message: err.status && err.status < 500 ? err.message : `${fallback}: ${err.message}` });
};
const bad = (message) => Object.assign(new Error(message), { status: 400 });

// ── sign in ───────────────────────────────────────────────────────────────────
const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, active: u.active, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt });

router.post("/login", json, (req, res, next) => {
  req.body = { ...req.body, username: String(req.body?.email || "") };
  next();
}, loginRateLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  try {
    const user = await SocialUser.findOne({ email });
    if (!user || !user.active) return res.status(400).json({ message: "Invalid email or password" });
    if (user.lockUntil && user.lockUntil > Date.now()) return res.status(403).json({ message: "Too many failed attempts. Please try again in 15 minutes." });
    if (!(await bcrypt.compare(password, user.password))) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      return res.status(400).json({ message: "Invalid email or password" });
    }
    Object.assign(user, { failedLoginAttempts: 0, lockUntil: null, lastLoginAt: new Date() });
    await user.save();
    resetLoginRateLimiter(req);
    res.json({ token: jwt.sign({ id: user._id, scope: "social" }, socialAuth.SECRET, { expiresIn: "12h" }), user: publicUser(user) });
  } catch (err) {
    fail(res, err, "Sign-in failed");
  }
});

router.get("/me", socialAuth, (req, res) => {
  if (req.socialUser) return res.json({ user: publicUser(req.socialUser) });
  res.json({ user: { name: req.admin?.name || req.admin?.username || "Admin", email: req.admin?.email || "", isAdmin: true } });
});

// ── logins (main admins) ──────────────────────────────────────────────────────
router.get("/users", socialAuth, adminOnly, async (req, res) => {
  res.json((await SocialUser.find().sort({ createdAt: -1 }).lean()).map(publicUser));
});
router.post("/users", socialAuth, adminOnly, json, async (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 80);
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password;
  if (!name || !EMAIL.test(email)) return res.status(400).json({ message: "Enter a name and a valid email address." });
  if (typeof password !== "string" || password.length < 10) return res.status(400).json({ message: "Use a password of at least 10 characters." });
  if (await SocialUser.findOne({ email })) return res.status(409).json({ message: "There's already a login with that email." });
  const user = await SocialUser.create({ name, email, password: await bcrypt.hash(password, 12), createdBy: req.actor });
  res.status(201).json(publicUser(user));
});
router.patch("/users/:id", socialAuth, adminOnly, json, async (req, res) => {
  const user = isId(req.params.id) ? await SocialUser.findById(req.params.id) : null;
  if (!user) return res.status(404).json({ message: "Not found" });
  if (typeof req.body?.active === "boolean") user.active = req.body.active;
  if (req.body?.password != null) {
    if (String(req.body.password).length < 10) return res.status(400).json({ message: "Use a password of at least 10 characters." });
    user.password = await bcrypt.hash(String(req.body.password), 12);
    user.passwordChangedAt = new Date();
  }
  await user.save();
  res.json(publicUser(user));
});
router.delete("/users/:id", socialAuth, adminOnly, async (req, res) => {
  if (isId(req.params.id)) await SocialUser.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

// ── connected accounts ────────────────────────────────────────────────────────
const publicAccount = (a) => ({ _id: a._id, network: a.network, name: a.name, handle: a.handle, picture: a.picture, active: a.active, status: a.status, lastError: a.lastError, expiresAt: a.expiresAt, createdAt: a.createdAt });

router.get("/status", socialAuth, (req, res) => {
  res.json({
    configured: networks.configured(),
    unsplash: !!process.env.UNSPLASH_ACCESS_KEY,
    ai: !!process.env.ANTHROPIC_API_KEY,
    callbacks: Object.fromEntries(CONNECT.map((n) => [n, networks.callbackUrl(n)])),
  });
});

router.get("/accounts", socialAuth, async (req, res) => {
  res.json((await SocialAccount.find().sort({ network: 1, name: 1 }).lean()).map(publicAccount));
});
router.patch("/accounts/:id", socialAuth, json, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: "Not found" });
  const a = await SocialAccount.findByIdAndUpdate(req.params.id, { active: !!req.body?.active }, { new: true }).lean();
  if (!a) return res.status(404).json({ message: "Not found" });
  res.json(publicAccount(a));
});
router.delete("/accounts/:id", socialAuth, async (req, res) => {
  if (isId(req.params.id)) await SocialAccount.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

// OAuth: the dashboard asks for a sign-in link, the network sends the person back to /callback.
const oauthState = mongoose.models.SocialOAuthState || mongoose.model("SocialOAuthState", new mongoose.Schema({
  state: { type: String, unique: true },
  network: String,
  verifier: String,
  by: String,
  createdAt: { type: Date, default: Date.now, expires: 900 },
}));

router.post("/connect/:network/start", socialAuth, async (req, res) => {
  const network = req.params.network;
  const keys = networks.configured();
  if (!CONNECT.includes(network)) return res.status(404).json({ message: "Unknown network" });
  if (!keys[network]) return res.status(400).json({ message: `The ${CONNECT_NAMES[network]} app keys aren't set on the server yet. See the setup steps on this page.` });
  const state = crypto.randomBytes(24).toString("base64url");
  const verifier = crypto.randomBytes(48).toString("base64url");
  await oauthState.create({ state, network, verifier, by: req.actor });
  res.json({ url: networks.authUrl(network, state, verifier) });
});

router.get("/connect/:network/callback", async (req, res) => {
  const back = (q) => res.redirect(`${APP_URL()}?${new URLSearchParams(q)}#accounts`);
  const { code, state, error, error_description: desc } = req.query;
  const row = state ? await oauthState.findOneAndDelete({ state: String(state), network: req.params.network }) : null;
  if (!row) return back({ error: "That sign-in link has expired. Please try connecting again." });
  if (error || !code) return back({ error: String(desc || error || "Connection was cancelled.").slice(0, 200) });
  try {
    const found = await networks.finishConnect(row.network, String(code), row.verifier);
    for (const a of found) {
      await SocialAccount.findOneAndUpdate(
        { network: a.network, externalId: a.externalId },
        { $set: { name: a.name, handle: a.handle, picture: a.picture, token: encrypt(a.token), refreshToken: encrypt(a.refreshToken || ""), expiresAt: a.expiresAt || null, status: "ok", lastError: "", connectedBy: row.by }, $setOnInsert: { active: true } },
        { upsert: true },
      );
    }
    back({ connected: String(found.length) });
  } catch (err) {
    console.error("[social] connect", row.network, err.message);
    back({ error: err.message.slice(0, 200) });
  }
});

// ── photos ────────────────────────────────────────────────────────────────────
fs.mkdirSync(networks.UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: networks.UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `social-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${path.extname(file.originalname).toLowerCase().replace(/[^.a-z]/g, "") || ".jpg"}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => cb(/^image\/(jpeg|png)$/.test(file.mimetype) && /\.(jpe?g|png)$/i.test(file.originalname) ? null : bad("Photos must be JPEG or PNG (Instagram needs JPEG)."), true),
});

router.get("/photos", socialAuth, async (req, res) => {
  const uploaded = await SocialPhoto.find().sort({ createdAt: -1 }).limit(300).lean();
  res.json({
    uploaded: uploaded.map((p) => ({ _id: p._id, ref: p.path, description: p.description, createdAt: p.createdAt })),
    ours: networks.ourPhotos(),
  });
});
router.post("/photos", socialAuth, (req, res, next) => upload.array("photos", 10)(req, res, (err) => (err ? res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Each photo must be under 8 MB." : err.message }) : next())), async (req, res) => {
  const description = String(req.body?.description || "").trim().slice(0, 300);
  const rows = await SocialPhoto.insertMany((req.files || []).map((f) => ({ path: `/uploads/social/${f.filename}`, description, uploadedBy: req.actor })));
  res.status(201).json(rows.map((p) => ({ _id: p._id, ref: p.path, description: p.description })));
});
router.patch("/photos/:id", socialAuth, json, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: "Not found" });
  await SocialPhoto.updateOne({ _id: req.params.id }, { description: String(req.body?.description || "").trim().slice(0, 300) });
  res.json({ ok: true });
});
router.delete("/photos/:id", socialAuth, async (req, res) => {
  if (isId(req.params.id)) await SocialPhoto.deleteOne({ _id: req.params.id }); // file kept: older posts may use it
  res.json({ ok: true });
});

// ── posts ─────────────────────────────────────────────────────────────────────
const PHOTO_REF = /^(\/uploads\/social\/[\w.-]+|library:our-work\/[\w.-]+)$/;
async function postFields(body, existing) {
  const text = String(body.text ?? existing?.text ?? "").slice(0, 5000);
  const variants = {};
  for (const n of NETWORKS) variants[n] = String(body.variants?.[n] ?? existing?.variants?.[n] ?? "").slice(0, 5000);
  const images = (body.images ?? existing?.images ?? []).map(String).filter((r) => PHOTO_REF.test(r)).slice(0, 10);
  const ids = (body.accounts ?? existing?.accounts ?? []).map(String).filter(isId);
  const accounts = await SocialAccount.find({ _id: { $in: ids } }).select("_id network").lean();
  if (!text.trim() && !NETWORKS.some((n) => variants[n].trim())) throw bad("Write something to post.");
  return { text, variants, images, accounts, credit: String(body.credit ?? existing?.credit ?? "").slice(0, 200) };
}
function checkPostable(f) {
  if (!f.accounts.length) throw bad("Choose at least one account to post to.");
  for (const [n, label] of [["instagram", "Instagram"], ["tiktok", "TikTok"], ["pinterest", "Pinterest"]]) {
    if (f.accounts.some((a) => a.network === n) && !f.images.length) throw bad(`${label} posts need a photo. Add a photo or untick ${label}.`);
  }
  const xText = networks.textFor({ text: f.text, variants: f.variants, credit: f.credit }, "x");
  if (f.accounts.some((a) => a.network === "x") && !xText.trim()) throw bad("Write the text for X.");
}

router.get("/posts", socialAuth, async (req, res) => {
  const q = {};
  if (req.query.status) q.status = { $in: String(req.query.status).split(",") };
  if (req.query.from || req.query.to) q.scheduledAt = { ...(req.query.from ? { $gte: new Date(req.query.from) } : {}), ...(req.query.to ? { $lte: new Date(req.query.to) } : {}) };
  const posts = await SocialPost.find(q).sort({ scheduledAt: -1, createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 200, 500)).lean();
  res.json(posts);
});

router.post("/posts", socialAuth, json, async (req, res) => {
  try {
    const f = await postFields(req.body || {});
    const action = req.body?.action || "draft"; // now | schedule | draft
    if (action !== "draft") checkPostable(f);
    let scheduledAt = null;
    if (action === "schedule") {
      scheduledAt = new Date(req.body.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt < new Date(Date.now() - 60 * 1000)) throw bad("Choose a time in the future.");
    }
    const post = await SocialPost.create({ ...f, accounts: f.accounts.map((a) => a._id), status: action === "now" ? "posting" : action === "schedule" ? "scheduled" : "draft", scheduledAt: action === "now" ? new Date() : scheduledAt, createdBy: req.actor });
    res.status(201).json(action === "now" ? await scheduler.publishPost(post._id) : post);
  } catch (err) {
    fail(res, err, "Couldn't save the post");
  }
});

router.patch("/posts/:id", socialAuth, json, async (req, res) => {
  try {
    const post = isId(req.params.id) ? await SocialPost.findById(req.params.id) : null;
    if (!post) return res.status(404).json({ message: "Not found" });
    if (["posting", "posted", "partial"].includes(post.status)) throw bad("This post has already gone out, so it can't be changed.");
    const f = await postFields(req.body || {}, post);
    const action = req.body?.action || (post.status === "scheduled" ? "schedule" : "draft");
    if (action !== "draft") checkPostable(f);
    Object.assign(post, f, { accounts: f.accounts.map((a) => a._id), results: [] });
    if (action === "schedule") {
      const at = new Date(req.body.scheduledAt ?? post.scheduledAt);
      if (Number.isNaN(at.getTime()) || at < new Date(Date.now() - 60 * 1000)) throw bad("Choose a time in the future.");
      Object.assign(post, { status: "scheduled", scheduledAt: at });
    } else if (action === "now") Object.assign(post, { status: "posting", scheduledAt: new Date() });
    else Object.assign(post, { status: "draft" });
    await post.save();
    res.json(action === "now" ? await scheduler.publishPost(post._id) : post);
  } catch (err) {
    fail(res, err, "Couldn't save the post");
  }
});

router.post("/posts/:id/retry", socialAuth, async (req, res) => {
  const post = isId(req.params.id) ? await SocialPost.findById(req.params.id) : null;
  if (!post) return res.status(404).json({ message: "Not found" });
  if (!["failed", "partial"].includes(post.status)) return res.status(400).json({ message: "Only posts that didn't go out everywhere can be retried." });
  res.json(await scheduler.publishPost(post._id, { onlyFailed: true }));
});

router.delete("/posts/:id", socialAuth, async (req, res) => {
  // Removes it from the dashboard (and stops it if scheduled). Already-published posts stay on the networks.
  if (isId(req.params.id)) await SocialPost.deleteOne({ _id: req.params.id, status: { $ne: "posting" } });
  res.json({ ok: true });
});

// ── autopilots ────────────────────────────────────────────────────────────────
async function autopilotFields(body, existing = {}) {
  const name = String(body.name ?? existing.name ?? "").trim().slice(0, 80);
  if (!name) throw bad("Give the autopilot a name.");
  const ids = (body.accounts ?? existing.accounts ?? []).map(String).filter(isId);
  const accounts = (await SocialAccount.find({ _id: { $in: ids } }).select("_id").lean()).map((a) => a._id);
  const days = [...new Set((body.days ?? existing.days ?? []).map(Number).filter((d) => d >= 0 && d <= 6))].sort();
  const times = [...new Set((body.times ?? existing.times ?? []).map(String).filter((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)))].sort().slice(0, 6);
  const pictures = ["ours-then-unsplash", "ours", "unsplash", "none"].includes(body.pictures) ? body.pictures : existing.pictures || "ours-then-unsplash";
  const instructions = String(body.instructions ?? existing.instructions ?? "").slice(0, 4000);
  const enabled = typeof body.enabled === "boolean" ? body.enabled : !!existing.enabled;
  if (enabled) {
    if (instructions.trim().length < 10) throw bad("Write the instructions for Claude before switching the autopilot on.");
    if (!accounts.length) throw bad("Choose at least one account before switching the autopilot on.");
    if (!days.length || !times.length) throw bad("Choose at least one day and one time.");
  }
  return { name, accounts, days, times, pictures, instructions, enabled };
}

router.get("/autopilots", socialAuth, async (req, res) => {
  res.json(await SocialAutopilot.find().sort({ createdAt: 1 }).lean());
});
router.post("/autopilots", socialAuth, json, async (req, res) => {
  try {
    const f = await autopilotFields(req.body || {});
    const ap = new SocialAutopilot({ ...f, createdBy: req.actor });
    ap.nextRunAt = f.enabled ? scheduler.nextRunAfter(ap) : null;
    await ap.save();
    res.status(201).json(ap);
  } catch (err) {
    fail(res, err, "Couldn't save the autopilot");
  }
});
router.patch("/autopilots/:id", socialAuth, json, async (req, res) => {
  try {
    const ap = isId(req.params.id) ? await SocialAutopilot.findById(req.params.id) : null;
    if (!ap) return res.status(404).json({ message: "Not found" });
    Object.assign(ap, await autopilotFields(req.body || {}, ap.toObject()));
    ap.nextRunAt = ap.enabled ? scheduler.nextRunAfter(ap) : null;
    ap.failures = 0;
    await ap.save();
    res.json(ap);
  } catch (err) {
    fail(res, err, "Couldn't save the autopilot");
  }
});
router.delete("/autopilots/:id", socialAuth, async (req, res) => {
  if (isId(req.params.id)) await SocialAutopilot.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});
// "Try it": Claude writes a post and photo now, saved as a draft (nothing is posted).
router.post("/autopilots/:id/preview", socialAuth, async (req, res) => {
  try {
    const ap = isId(req.params.id) ? await SocialAutopilot.findById(req.params.id) : null;
    if (!ap) return res.status(404).json({ message: "Not found" });
    if (ap.instructions.trim().length < 10) throw bad("Write the instructions for Claude first.");
    res.json(await scheduler.runAutopilot(ap, { publish: false }));
  } catch (err) {
    fail(res, err, "Claude couldn't write the post");
  }
});
// "Post one now": write and publish straight away.
router.post("/autopilots/:id/run", socialAuth, async (req, res) => {
  try {
    const ap = isId(req.params.id) ? await SocialAutopilot.findById(req.params.id) : null;
    if (!ap) return res.status(404).json({ message: "Not found" });
    if (ap.instructions.trim().length < 10) throw bad("Write the instructions for Claude first.");
    if (!ap.accounts.length) throw bad("Choose at least one account first.");
    const post = await scheduler.runAutopilot(ap);
    await SocialAutopilot.updateOne({ _id: ap._id }, { lastRunAt: new Date(), lastPost: post._id, lastResult: `Posted to ${post.results.filter((r) => r.status === "posted").length} of ${post.accounts.length} accounts (posted by hand)` });
    res.json(post);
  } catch (err) {
    fail(res, err, "Claude couldn't write the post");
  }
});

module.exports = router;
