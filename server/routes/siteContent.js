// Website content editing (/content-admin, for content editors and main admins).
// Page text lives in the website's code as JSON files (src/content/services/*.json and
// src/content/locations/*.json). The editor loads them from GitHub, keeps drafts and earlier
// versions here, and Publish commits the file to GitHub; Vercel then rebuilds the site.
//
//   GET    /api/site-content/pages             editable pages (from GitHub)
//   GET    /api/site-content/:key              the page's file on GitHub + any saved draft and versions
//   PUT    /api/site-content/:key              save a draft { data }
//   DELETE /api/site-content/:key              discard the draft
//   POST   /api/site-content/:key/restore      put an earlier version back as the draft { index }
//   POST   /api/site-content/:key/publish      commit { data, sha } to GitHub
const express = require("express");
const router = express.Router();
const contentAuth = require("../middleware/contentAuth");
const SiteContent = require("../models/SiteContent");
const github = require("../utils/github");

const KEY = /^(service|location):([a-z0-9-]{1,80})$/;
const FOLDERS = { service: "src/content/services", location: "src/content/locations" };
const MAX_BYTES = 200 * 1024;
const MAX_VERSIONS = 10;

router.use(contentAuth);

const who = (req) => ({ name: req.admin?.name || req.admin?.username || "Admin", email: req.admin?.email || "" });
const pathFor = (key) => {
  const m = KEY.exec(String(key || ""));
  return m ? `${FOLDERS[m[1]]}/${m[2]}.json` : null;
};
const fail = (res, err, fallback) => {
  if (!err.status || err.status >= 500) console.error("Site content:", err.message);
  res.status(err.status || 500).json({ message: err.status ? err.message : fallback });
};

// Only plain JSON-like content: text, numbers, true/false, lists and groups. The website shows
// text as text (never as HTML), so content can't inject code into pages.
function cleanData(value, depth = 0) {
  if (depth > 8) throw Object.assign(new Error("Content is nested too deeply."), { status: 400 });
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return value.slice(0, 20000);
  if (Array.isArray(value)) return value.slice(0, 200).map((v) => cleanData(v, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value).slice(0, 100)) {
      if (!/^[A-Za-z0-9_]{1,60}$/.test(k)) continue;
      out[k] = cleanData(v, depth + 1);
    }
    return out;
  }
  return null;
}
const validData = (raw) => {
  const data = cleanData(raw);
  if (data == null || typeof data !== "object" || Array.isArray(data)) throw Object.assign(new Error("Nothing to save."), { status: 400 });
  if (Buffer.byteLength(JSON.stringify(data)) > MAX_BYTES) throw Object.assign(new Error("This page's content is too large."), { status: 413 });
  return data;
};

// Keep the previous draft as a version before changing it.
async function saveDraft(key, data, by) {
  const doc = (await SiteContent.findOne({ key })) || new SiteContent({ key });
  if (!doc.isNew && doc.data != null) {
    doc.history = [{ data: doc.data, savedAt: doc.updatedAt || new Date(), savedBy: doc.updatedBy }, ...doc.history].slice(0, MAX_VERSIONS);
    doc.markModified("history");
  }
  doc.data = data;
  doc.updatedBy = by;
  doc.markModified("data");
  await doc.save();
  return doc;
}

router.get("/pages", async (req, res) => {
  try {
    const [services, locations] = await Promise.all([github.listFiles(FOLDERS.service), github.listFiles(FOLDERS.location)]);
    const drafts = new Set((await SiteContent.find({ data: { $ne: null } }).select("key").lean()).map((d) => d.key));
    const row = (type) => (name) => {
      const key = `${type}:${name.replace(/\.json$/, "")}`;
      return { key, hasDraft: drafts.has(key) };
    };
    res.json({ services: services.map(row("service")), locations: locations.map(row("location")) });
  } catch (err) {
    fail(res, err, "Couldn't load the list of pages");
  }
});

router.get("/:key", async (req, res) => {
  const path = pathFor(req.params.key);
  if (!path) return res.status(400).json({ message: "Unknown page" });
  try {
    const [file, doc] = await Promise.all([github.readJson(path), SiteContent.findOne({ key: req.params.key }).lean()]);
    res.json({
      key: req.params.key,
      path,
      file: file.data,
      sha: file.sha,
      draft: doc?.data ?? null,
      draftSavedAt: doc?.data != null ? doc.updatedAt : null,
      draftSavedBy: doc?.updatedBy || "",
      history: (doc?.history || []).map((h, i) => ({ index: i, savedAt: h.savedAt, savedBy: h.savedBy })),
    });
  } catch (err) {
    fail(res, err, "Couldn't load this page");
  }
});

router.put("/:key", express.json({ limit: "512kb" }), async (req, res) => {
  if (!pathFor(req.params.key)) return res.status(400).json({ message: "Unknown page" });
  try {
    const doc = await saveDraft(req.params.key, validData(req.body?.data), who(req).email || who(req).name);
    res.json({ success: true, savedAt: doc.updatedAt });
  } catch (err) {
    fail(res, err, "Failed to save the draft");
  }
});

router.delete("/:key", async (req, res) => {
  if (!pathFor(req.params.key)) return res.status(400).json({ message: "Unknown page" });
  await SiteContent.updateOne({ key: req.params.key }, { $set: { data: null } });
  res.json({ success: true });
});

router.post("/:key/restore", express.json(), async (req, res) => {
  if (!pathFor(req.params.key)) return res.status(400).json({ message: "Unknown page" });
  const doc = await SiteContent.findOne({ key: req.params.key }).lean();
  const version = doc?.history?.[Number(req.body?.index)];
  if (!version?.data) return res.status(404).json({ message: "That version wasn't found." });
  await saveDraft(req.params.key, version.data, who(req).email || who(req).name);
  res.json({ success: true, data: version.data });
});

router.post("/:key/publish", express.json({ limit: "512kb" }), async (req, res) => {
  const path = pathFor(req.params.key);
  if (!path) return res.status(400).json({ message: "Unknown page" });
  try {
    const data = validData(req.body?.data);
    const sha = String(req.body?.sha || "");
    if (!sha) return res.status(400).json({ message: "Reload the page and try again." });
    const author = who(req);
    const result = await github.writeJson(path, data, {
      sha,
      author,
      message: `Content: update ${req.params.key.replace(":", " page ")} (via content admin, ${author.name})`,
    });
    // Keep the published text as the newest version, and clear the draft.
    const by = author.email || author.name;
    const doc = (await SiteContent.findOne({ key: req.params.key })) || new SiteContent({ key: req.params.key });
    doc.history = [{ data, savedAt: new Date(), savedBy: `${by} (published)` }, ...(doc.history || [])].slice(0, MAX_VERSIONS);
    doc.data = null;
    doc.updatedBy = by;
    doc.markModified("history");
    doc.markModified("data");
    await doc.save();
    console.log(`Content published: ${path} by ${author.email || author.name} (${result.commit})`);
    res.json({ success: true, sha: result.sha, commitUrl: result.url, message: "Published. The website will update in about 2–3 minutes." });
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ message: "This page was changed on GitHub since you opened it. Your draft is saved: reload the page to get the latest version, then publish again." });
    }
    fail(res, err, "Couldn't publish. Please try again.");
  }
});

module.exports = router;
module.exports.cleanData = cleanData;
