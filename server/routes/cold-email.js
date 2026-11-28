const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const router = express.Router();

const ColdMailbox = require("../models/ColdMailbox");
const ColdContact = require("../models/ColdContact");
const ColdCampaign = require("../models/ColdCampaign");
const ColdSend = require("../models/ColdSend");
const ColdSuppressionList = require("../models/ColdSuppressionList");
const ColdTemplate = require("../models/ColdTemplate");
const ColdEvent = require("../models/ColdEvent");
const ColdReply = require("../models/ColdReply");
const mongoose = require("mongoose");
const adminAuth = require("../middleware/adminAuth");
const { recordOpen, recordClick, PIXEL } = require("../utils/coldTracking");
const { verifyEmail } = require("../utils/coldVerify");
const { resolveContactDomain } = require("../utils/contactDomain");
const { checkDomain, effectiveDailyLimit, warmupDay, inSendingWindow } = require("../utils/deliverability");

// What the admin page shows for a mailbox (never the tokens), with today's warm-up limit.
const publicMailbox = (m) => ({
  ...m,
  accessToken: undefined,
  refreshToken: undefined,
  smtp: m.smtp ? { ...m.smtp, pass: undefined, hasPassword: !!m.smtp.pass } : undefined,
  needsReconnect: m.status === "error",
  warmupDay: warmupDay(m),
  todayLimit: effectiveDailyLimit(m),
});

const {
  encrypt,
  decrypt,
  buildOAuth2Client,
  REDIRECT_URI,
  buildMsAuthUrl,
  exchangeMsCode,
} = require("../utils/coldEmailEngine");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const JWT_SECRET = process.env.JWT_SECRET || "cleaniq_jwt_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Everything here needs the admin login, except: tracking links and the unsubscribe page (opened by
// the people we email), and Google/Microsoft sending people back after connecting a mailbox. The
// "connect a mailbox" links are opened in the browser, so they carry the admin token as ?t=.
const PUBLIC_PATHS = [/^\/t\//, /^\/unsubscribe\//, /^\/auth\/callback$/, /^\/auth\/microsoft\/callback$/];
router.use((req, res, next) => {
  if (PUBLIC_PATHS.some((r) => r.test(req.path))) return next();
  if ((req.path === "/auth/google" || req.path === "/auth/microsoft") && req.query.t && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.t}`;
  }
  return adminAuth(req, res, next);
});

// ── Tracking (public) ─────────────────────────────────────────────────────────
router.get("/t/o/:token.gif", async (req, res) => {
  res.set({ "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache, must-revalidate, private", Pragma: "no-cache" });
  res.end(PIXEL);
  recordOpen(req.params.token, req).catch((e) => console.error("[cold email] open:", e.message));
});
router.get("/t/c/:token", async (req, res) => {
  try {
    const to = await recordClick(req.params.token, String(req.query.u || ""), String(req.query.s || ""), req);
    if (!to) return res.status(400).send("This link isn't valid.");
    res.redirect(302, to);
  } catch (err) {
    console.error("[cold email] click:", err.message);
    const u = String(req.query.u || "");
    return /^https?:\/\//.test(u) && require("../utils/coldTracking").sign(req.params.token, u) === req.query.s ? res.redirect(302, u) : res.status(400).send("This link isn't valid.");
  }
});

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GMAIL OAUTH
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/cold-email/auth/google — redirect to Google consent screen
router.get("/auth/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      message: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured in .env",
    });
  }
  const oauth2 = buildOAuth2Client();
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(url);
});

// GET /api/cold-email/auth/callback — Google redirects here after consent
router.get("/auth/callback", async (req, res) => {
  const { code, error } = req.query;
  if (error)
    return res.redirect(
      `${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=${error}`,
    );
  if (!code)
    return res.redirect(
      `${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=no_code`,
    );

  try {
    const oauth2 = buildOAuth2Client();
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    // Get the email address of this account
    const { google } = require("googleapis");
    const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
    const userInfo = await oauth2Api.userinfo.get();
    const email = userInfo.data.email;

    await ColdMailbox.findOneAndUpdate(
      { email },
      {
        email,
        provider: "gmail",
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : undefined,
        tokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
        status: "active",
        errorMessage: "",
        pausedReason: "",
      },
      { upsert: true, new: true },
    );

    res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&connected=1`);
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    res.redirect(
      `${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=oauth_failed`,
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MICROSOFT OAUTH
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/cold-email/auth/microsoft — redirect to Microsoft consent screen
router.get("/auth/microsoft", (req, res) => {
  if (!process.env.MS_CLIENT_ID || !process.env.MS_CLIENT_SECRET) {
    return res.status(500).json({
      message: "MS_CLIENT_ID / MS_CLIENT_SECRET not configured in .env",
    });
  }
  res.redirect(buildMsAuthUrl());
});

// GET /api/cold-email/auth/microsoft/callback — Microsoft redirects here after consent
router.get("/auth/microsoft/callback", async (req, res) => {
  const { code, error } = req.query;
  if (error)
    return res.redirect(
      `${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=${encodeURIComponent(error)}`,
    );
  if (!code)
    return res.redirect(
      `${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=no_code`,
    );

  try {
    const tokens = await exchangeMsCode(code);

    // Get email address via Microsoft Graph
    const userRes = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );
    const user = await userRes.json();
    const email = (user.mail || user.userPrincipalName || "").toLowerCase();
    if (!email)
      throw new Error("Could not retrieve email from Microsoft account");

    await ColdMailbox.findOneAndUpdate(
      { email },
      {
        email,
        provider: "outlook",
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : undefined,
        tokenExpiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
        status: "active",
        errorMessage: "",
        pausedReason: "",
      },
      { upsert: true, new: true },
    );

    res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&connected=1`);
  } catch (err) {
    console.error("MS OAuth callback error:", err.message);
    res.redirect(
      `${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=oauth_failed`,
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MAILBOXES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/cold-email/mailboxes
router.get("/mailboxes", async (req, res) => {
  try {
    const mailboxes = await ColdMailbox.find().sort({ createdAt: 1 }).lean();
    res.json(mailboxes.map(publicMailbox));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/cold-email/mailboxes/:id — update daily limit or status
router.patch("/mailboxes/:id", async (req, res) => {
  try {
    const { dailyLimit, status, warmupEnabled, restartWarmup } = req.body;
    const update = {};
    if (dailyLimit !== undefined)
      update.dailyLimit = Math.max(1, Math.min(10000, Number(dailyLimit)));
    if (status !== undefined) update.status = status;
    if (status === "active") { update.pausedReason = ""; update.autoPausedAt = null; }
    if (warmupEnabled !== undefined) update.warmupEnabled = !!warmupEnabled;
    if (restartWarmup) {
      update.warmupEnabled = true;
      update.warmupStartedAt = new Date();
    }
    const box = await ColdMailbox.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).lean();
    if (!box) return res.status(404).json({ message: "Mailbox not found" });
    res.json(publicMailbox(box));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cold-email/mailboxes/:id/health — checks the mailbox's domain DNS (MX, SPF, DKIM, DMARC)
// and saves the result. Read-only: nothing in DNS is changed.
router.get("/mailboxes/:id/health", async (req, res) => {
  try {
    const box = await ColdMailbox.findById(req.params.id).lean();
    if (!box) return res.status(404).json({ message: "Mailbox not found" });
    const health = await checkDomain(box.email.split("@")[1], box.provider);
    await ColdMailbox.updateOne({ _id: box._id }, { $set: { health } });
    res.json({ ...health, sendingWindowOpen: inSendingWindow() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/mailboxes/smtp — connect (or update the password of) an "other email"
// mailbox: GoDaddy, Zoho, Hostinger… Logs in to check the details work before saving.
router.post("/mailboxes/smtp", async (req, res) => {
  try {
    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter the email address." });
    const existing = await ColdMailbox.findOne({ email });
    if (existing && existing.provider !== "smtp") return res.status(400).json({ message: `${email} is already connected through ${existing.provider === "outlook" ? "Outlook" : "Gmail"}. Use Reconnect on it instead.` });
    const cfg = {
      host: String(b.host || "").trim(),
      port: Number(b.port) || 465,
      secure: b.secure !== undefined ? !!b.secure : Number(b.port || 465) === 465,
      user: String(b.user || email).trim(),
      imapHost: String(b.imapHost || "").trim(),
      imapPort: Number(b.imapPort) || 993,
      imapSecure: b.imapSecure !== undefined ? !!b.imapSecure : true,
    };
    if (!cfg.host) return res.status(400).json({ message: "Enter the sending (SMTP) server, or pick your email provider." });
    let pass = String(b.password || "");
    if (!pass && existing?.smtp?.pass) pass = decrypt(existing.smtp.pass);
    if (!pass) return res.status(400).json({ message: "Enter the email password (or app password)." });
    try {
      await require("../utils/coldSmtp").testConnection(cfg, pass);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
    const box = await ColdMailbox.findOneAndUpdate(
      { email },
      {
        $set: {
          email, provider: "smtp", smtp: { ...cfg, pass: encrypt(pass) }, fromName: String(b.fromName || existing?.fromName || "").slice(0, 80),
          status: "active", errorMessage: "", pausedReason: "",
          ...(b.dailyLimit ? { dailyLimit: Math.max(1, Math.min(500, Number(b.dailyLimit))) } : {}),
        },
        $setOnInsert: { createdAt: new Date(), warmupEnabled: true, warmupStartedAt: new Date() },
      },
      { upsert: true, new: true },
    ).lean();
    res.json(publicMailbox(box));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  DOMAINS (mailboxes grouped by domain, with DNS health, warm-up and bounce rate)
// ═══════════════════════════════════════════════════════════════════════════════
const domainOfEmail = (e) => String(e || "").split("@")[1] || "";

async function mailboxStats30() {
  const rows = await ColdSend.aggregate([
    { $match: { sentAt: { $gte: new Date(Date.now() - 30 * 864e5) }, status: { $in: ["sent", "replied", "bounced"] }, mailboxId: { $ne: null } } },
    { $group: {
      _id: "$mailboxId",
      sent: { $sum: 1 },
      bounced: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } },
      replied: { $sum: { $cond: [{ $eq: ["$status", "replied"] }, 1, 0] } },
      opened: { $sum: { $cond: [{ $gt: ["$opens", 0] }, 1, 0] } },
    } },
  ]);
  const r1 = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  return Object.fromEntries(rows.map((r) => [String(r._id), { ...r, _id: undefined, bounceRate: r1(r.bounced, r.sent), replyRate: r1(r.replied, r.sent - r.bounced), openRate: r1(r.opened, r.sent - r.bounced) }]));
}

function mailboxIssues(m, st, maxBounce) {
  const issues = [];
  if (m.status === "error") issues.push({ level: "bad", text: m.errorMessage || "The sign-in stopped working. Reconnect this mailbox." });
  if (m.status === "paused" && m.pausedReason) issues.push({ level: "bad", text: m.pausedReason });
  else if (m.status === "paused") issues.push({ level: "warn", text: "Paused by you." });
  if (st?.sent >= 10 && st.bounceRate > maxBounce) issues.push({ level: "bad", text: `Bounce rate ${st.bounceRate}% (keep it under ${maxBounce}%).` });
  return issues;
}

router.get("/domains", async (req, res) => {
  try {
    const settings = await require("../utils/coldProtection").getSettings();
    const [boxes, stats] = await Promise.all([ColdMailbox.find().sort({ createdAt: 1 }).lean(), mailboxStats30()]);
    const groups = {};
    for (const m of boxes) {
      const d = domainOfEmail(m.email);
      groups[d] = groups[d] || { domain: d, mailboxes: [], health: null };
      const st = stats[String(m._id)] || { sent: 0, bounced: 0, replied: 0, opened: 0, bounceRate: 0, replyRate: 0, openRate: 0 };
      groups[d].mailboxes.push({ ...publicMailbox(m), stats: st, issues: mailboxIssues(m, st, settings.maxBounceRate) });
      if (m.health && (!groups[d].health || new Date(m.health.checkedAt) > new Date(groups[d].health.checkedAt))) groups[d].health = m.health;
    }
    const domains = Object.values(groups).map((g) => {
      const sent = g.mailboxes.reduce((n, m) => n + m.stats.sent, 0);
      const bounced = g.mailboxes.reduce((n, m) => n + m.stats.bounced, 0);
      const problems = g.mailboxes.filter((m) => m.issues.some((i) => i.level === "bad")).length;
      const score = g.health?.score;
      const status = problems ? "attention" : score === undefined ? "unchecked" : score >= 90 ? "excellent" : score >= 70 ? "good" : "attention";
      return { ...g, sent, bounced, bounceRate: sent ? Math.round((bounced / sent) * 1000) / 10 : 0, problems, status };
    });
    res.json({ domains, maxBounceRate: settings.maxBounceRate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /domains/:domain/check — re-reads the domain's DNS (SPF, DKIM, DMARC, MX) and saves it.
router.post("/domains/:domain/check", async (req, res) => {
  try {
    const domain = String(req.params.domain || "").toLowerCase();
    const boxes = await ColdMailbox.find({ email: { $regex: `@${domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }).lean();
    if (!boxes.length) return res.status(404).json({ message: "No mailbox on that domain." });
    const health = await checkDomain(domain, boxes[0].provider === "smtp" ? "" : boxes[0].provider);
    await ColdMailbox.updateMany({ _id: { $in: boxes.map((b) => b._id) } }, { $set: { health } });
    res.json(health);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PROTECTION (sending rules), BOUNCE LOG, ALERTS
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/protection", async (req, res) => {
  try {
    const p = require("../utils/coldProtection");
    const [settings, summary] = await Promise.all([p.getSettings(), p.summary(30)]);
    const boxes = await ColdMailbox.find().select("email health").lean();
    const domains = {};
    for (const b of boxes) {
      const d = domainOfEmail(b.email);
      if (!domains[d] || (b.health && (!domains[d].health || new Date(b.health.checkedAt) > new Date(domains[d].health.checkedAt)))) domains[d] = { domain: d, health: b.health || null };
    }
    const list = Object.values(domains).map((d) => ({
      domain: d.domain,
      checked: !!d.health,
      checks: (d.health?.checks || []).map((c) => ({ key: c.key, label: c.label, level: c.level })),
    }));
    res.json({ settings, summary, domains: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/protection", async (req, res) => {
  try {
    res.json(await require("../utils/coldProtection").saveSettings(req.body || {}));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /bounces?page=&type=hard|soft — every bounce with its reason.
router.get("/bounces", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = 50;
    const types = req.query.type === "soft" ? ["soft_bounce"] : req.query.type === "hard" ? ["bounced"] : ["bounced", "soft_bounce"];
    const filter = { type: { $in: types } };
    const [rows, total] = await Promise.all([
      ColdEvent.find(filter).sort({ at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ColdEvent.countDocuments(filter),
    ]);
    const [contacts, boxes, camps] = await Promise.all([
      ColdContact.find({ _id: { $in: rows.map((r) => r.contactId) } }).select("email firstName lastName company").lean(),
      ColdMailbox.find({ _id: { $in: rows.map((r) => r.mailboxId) } }).select("email").lean(),
      ColdCampaign.find({ _id: { $in: rows.map((r) => r.campaignId) } }).select("name").lean(),
    ]);
    const map = (l) => Object.fromEntries(l.map((x) => [String(x._id), x]));
    const C = map(contacts); const B = map(boxes); const K = map(camps);
    res.json({
      total, page,
      bounces: rows.map((r) => ({
        _id: r._id, at: r.at, type: r.type === "bounced" ? "hard" : "soft", reason: r.detail || "",
        contact: C[String(r.contactId)] || null, mailbox: B[String(r.mailboxId)]?.email || "", campaign: K[String(r.campaignId)]?.name || "", campaignId: r.campaignId,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /alerts — things that need the owner: broken sign-ins, auto-paused mailboxes and campaigns.
router.get("/alerts", async (req, res) => {
  try {
    const [boxes, camps] = await Promise.all([
      ColdMailbox.find({ $or: [{ status: "error" }, { status: "paused", pausedReason: { $nin: ["", null] } }] }).select("email provider status errorMessage pausedReason").lean(),
      ColdCampaign.find({ status: "paused", pausedReason: { $nin: ["", null] } }).select("name pausedReason").lean(),
    ]);
    res.json({
      alerts: [
        ...boxes.map((b) => ({ kind: b.status === "error" ? "reconnect" : "mailbox_paused", id: b._id, provider: b.provider, title: b.status === "error" ? `${b.email} needs reconnecting` : `${b.email} was paused`, text: b.status === "error" ? b.errorMessage : b.pausedReason })),
        ...camps.map((c) => ({ kind: "campaign_paused", id: c._id, title: `Campaign "${c.name}" was paused`, text: c.pausedReason })),
      ],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cold-email/mailboxes/:id
router.delete("/mailboxes/:id", async (req, res) => {
  try {
    await ColdMailbox.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CONTACTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/cold-email/contacts?page=1&limit=50&search=&view=all|emailed|not-emailed
router.get("/contacts", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || "1"));
    const limit = Math.min(200, parseInt(req.query.limit || "50"));
    const search = (req.query.search || "").trim();
    const view   = (req.query.view   || "all").toLowerCase();

    const filter = {};
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ email: re }, { firstName: re }, { lastName: re }, { company: re }];
    }

    // Fetch all matching IDs first so we can determine contacted status
    const allMatching = await ColdContact.find(filter).select("_id email domain").lean();

    // Aggregate ColdSend to find which contacts have been sent to
    const allIds = allMatching.map((c) => c._id);
    const sentMatches = allIds.length
      ? await ColdSend.aggregate([
          { $match: { contactId: { $in: allIds }, status: { $in: ["sent", "replied", "bounced"] } } },
          { $group: { _id: "$contactId" } },
        ])
      : [];
    const contactedSet = new Set(sentMatches.map((m) => m._id.toString()));

    // Apply view filter
    const viewFiltered = allMatching.filter((c) => {
      const emailed = contactedSet.has(c._id.toString());
      if (view === "emailed")     return emailed;
      if (view === "not-emailed") return !emailed;
      return true;
    });

    const total = viewFiltered.length;
    const pageSlice = viewFiltered.slice((page - 1) * limit, page * limit);

    // Fetch full documents for the page slice
    const pageIds = pageSlice.map((c) => c._id);
    const contactsResult = await ColdContact.find({ _id: { $in: pageIds } })
      .sort({ importedAt: -1 })
      .lean();

    const contacts = [];
    for (const contact of contactsResult) {
      const resolvedDomain = resolveContactDomain(contact.domain, contact.email);
      if (resolvedDomain && !contact.domain) {
        await ColdContact.updateOne({ _id: contact._id }, { $set: { domain: resolvedDomain } });
      }
      contacts.push({
        ...contact,
        domain:    resolvedDomain || contact.domain || "",
        contacted: contactedSet.has(contact._id.toString()),
      });
    }

    const statsAgg = await ColdContact.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusMap = Object.fromEntries(statsAgg.map((s) => [s._id, s.count]));
    statusMap.emailed     = contactedSet.size;
    statusMap.notEmailed  = allMatching.length - contactedSet.size;

    res.json({ contacts, total, page, limit, stats: statusMap });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/contacts/backfill-domains — fill missing domains from existing email addresses
router.post("/contacts/backfill-domains", async (req, res) => {
  try {
    const contacts = await ColdContact.find({
      $or: [{ domain: "" }, { domain: null }, { domain: { $exists: false } }],
    })
      .select("_id email domain")
      .lean();

    let updated = 0;
    for (const contact of contacts) {
      const computedDomain = resolveContactDomain(
        contact.domain,
        contact.email,
      );
      if (!computedDomain || computedDomain === contact.domain) continue;
      await ColdContact.updateOne(
        { _id: contact._id },
        { $set: { domain: computedDomain } },
      );
      updated += 1;
    }

    res.json({ updated, total: contacts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/contacts/import-bulk — paste a list of emails (JSON body)
// Accepts { emails: ["a@b.com", "c@d.com", ...] } — no file needed.
router.post("/contacts/import-bulk", async (req, res) => {
  const raw = req.body.emails;
  if (!Array.isArray(raw) || raw.length === 0) {
    return res.status(400).json({ message: "No emails provided" });
  }

  let imported = 0;
  let duplicates = 0;
  let invalid = 0;

  for (const entry of raw) {
    const email = (entry || "").toString().toLowerCase().trim();
    if (!email || !isValidEmail(email)) { invalid++; continue; }
    const exists = await ColdContact.findOne({ email });
    if (exists) { duplicates++; continue; }
    const domain = resolveContactDomain("", email);
    await ColdContact.create({ email, domain });
    imported++;
  }

  setImmediate(() => verifyUnchecked().catch((e) => console.error("[cold email] email check:", e.message)));
  res.json({ imported, duplicates, invalid, total: raw.length });
});

// POST /api/cold-email/contacts/import — multipart CSV upload
router.post("/contacts/import", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const { parse } = require("csv-parse/sync");
    const records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let imported = 0;
    let duplicates = 0;
    let invalid = 0;
    const batchLabel = req.file.originalname;

    // Detect email column: exact matches first, then any key containing "email"
    const headers = records.length ? Object.keys(records[0]) : [];
    const exactEmailKeys = [
      "email",
      "Email",
      "EMAIL",
      "e-mail",
      "E-mail",
      "contact_professions_email",
    ];
    const emailKey =
      exactEmailKeys.find((k) => headers.includes(k)) ||
      headers.find((k) => k.toLowerCase().includes("email")) ||
      null;
    const domainKey =
      [
        "domain",
        "Domain",
        "DOMAIN",
        "company_domain",
        "Company_Domain",
        "companyDomain",
        "CompanyDomain",
        "website",
        "Website",
        "WEBSITE",
        "website_url",
        "Website_Url",
        "websiteUrl",
      ].find((k) => headers.includes(k)) ||
      headers.find(
        (k) =>
          k.toLowerCase().includes("domain") ||
          k.toLowerCase().includes("website"),
      ) ||
      null;

    for (const rec of records) {
      const rawEmail = emailKey ? rec[emailKey] || "" : "";
      const email = rawEmail.toLowerCase().trim();

      if (!email || !isValidEmail(email)) {
        invalid++;
        continue;
      }

      const exists = await ColdContact.findOne({ email });
      if (exists) {
        duplicates++;
        continue;
      }

      // Support both split first/last name columns and a combined full_name column
      let firstName =
        rec.first_name ||
        rec.firstName ||
        rec.First_Name ||
        rec["First Name"] ||
        "";
      let lastName =
        rec.last_name ||
        rec.lastName ||
        rec.Last_Name ||
        rec["Last Name"] ||
        "";
      if (!firstName && !lastName) {
        const fullName =
          rec.full_name ||
          rec.fullName ||
          rec["Full Name"] ||
          rec.prospect_full_name ||
          "";
        const parts = fullName.trim().split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }
      const company =
        rec.company ||
        rec.Company ||
        rec.COMPANY ||
        rec.prospect_company_name ||
        rec.company_name ||
        rec["Company Name"] ||
        "";
      const rawDomain = domainKey ? rec[domainKey] || "" : "";
      const domain = resolveContactDomain(rawDomain, email);

      const knownKeys = new Set([
        emailKey,
        domainKey,
        "first_name",
        "firstName",
        "First_Name",
        "First Name",
        "last_name",
        "lastName",
        "Last_Name",
        "Last Name",
        "full_name",
        "fullName",
        "Full Name",
        "prospect_full_name",
        "company",
        "Company",
        "COMPANY",
        "prospect_company_name",
        "company_name",
        "Company Name",
      ]);
      const extraFields = {};
      for (const [k, v] of Object.entries(rec)) {
        if (!knownKeys.has(k) && v) extraFields[k] = v;
      }

      await ColdContact.create({
        email,
        firstName,
        lastName,
        company,
        domain,
        extraFields,
        importBatch: batchLabel,
      });
      imported++;
    }

    setImmediate(() => verifyUnchecked().catch((e) => console.error("[cold email] email check:", e.message)));
    res.json({ imported, duplicates, invalid, total: records.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cold-email/contacts/all-ids — returns active contact IDs (optionally limited)
router.get("/contacts/all-ids", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const limit = parseInt(req.query.limit) || 0; // 0 = no limit
    const view = (req.query.view || "all").toLowerCase();
    const filter = { status: "active" };
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [
        { email: re },
        { firstName: re },
        { lastName: re },
        { company: re },
        { domain: re },
      ];
    }

    const contacts = await ColdContact.find(filter).select("_id email").lean();
    const contactIds = contacts.map((contact) => contact._id);
    const sentMatches = contactIds.length
      ? await ColdSend.aggregate([
          {
            $match: {
              contactId: { $in: contactIds },
              status: { $in: ["sent", "replied", "bounced"] },
            },
          },
          { $group: { _id: "$contactId" } },
        ])
      : [];
    const contactedIds = new Set(
      sentMatches.map((match) => match._id.toString()),
    );

    const filteredContacts = contacts.filter((contact) => {
      const contacted = contactedIds.has(contact._id.toString());
      if (view === "contacted") return contacted;
      if (view === "not-contacted") return !contacted;
      return true;
    });

    const slicedContacts =
      limit > 0 ? filteredContacts.slice(0, limit) : filteredContacts;
    res.json({
      ids: slicedContacts.map((c) => c._id.toString()),
      total: filteredContacts.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/contacts — add a single contact manually
router.post("/contacts", async (req, res) => {
  try {
    const {
      email: rawEmail,
      firstName = "",
      lastName = "",
      company = "",
      domain = "",
    } = req.body;
    const email = (rawEmail || "").toLowerCase().trim();
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    const exists = await ColdContact.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Contact already exists" });
    const contact = await ColdContact.create({
      email,
      firstName,
      lastName,
      company,
      domain: resolveContactDomain(domain, email),
      verification: await verifyEmail(email),
    });
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cold-email/contacts/:id — update an existing contact
router.put("/contacts/:id", async (req, res) => {
  try {
    const {
      email: rawEmail,
      firstName = "",
      lastName = "",
      company = "",
      domain = "",
    } = req.body;
    const email = (rawEmail || "").toLowerCase().trim();
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const existing = await ColdContact.findById(req.params.id);
    if (!existing)
      return res.status(404).json({ message: "Contact not found" });

    const duplicate = await ColdContact.findOne({
      email,
      _id: { $ne: existing._id },
    });
    if (duplicate)
      return res
        .status(409)
        .json({ message: "A contact with that email already exists" });

    const updated = await ColdContact.findByIdAndUpdate(
      req.params.id,
      {
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        company: company || "",
        domain: resolveContactDomain(domain, email),
      },
      { new: true },
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cold-email/contacts/:id
router.delete("/contacts/:id", async (req, res) => {
  try {
    await ColdContact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cold-email/contacts  (bulk, body: { ids: [...] })
router.delete("/contacts", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "ids array required" });
    await ColdContact.deleteMany({ _id: { $in: ids } });
    res.json({ deleted: ids.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/cold-email/campaigns
router.get("/campaigns", async (req, res) => {
  try {
    const campaigns = await ColdCampaign.find().sort({ createdAt: -1 }).lean();
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/campaigns
router.post("/campaigns", async (req, res) => {
  try {
    const {
      name,
      fromName,
      steps,
      mailboxIds,
      contactIds,
      emailStyle,
      status,
      trackOpens,
      trackClicks,
      skipInvalid,
    } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });
    const campaign = await ColdCampaign.create({
      name,
      fromName,
      steps: steps || [],
      mailboxIds: mailboxIds || [],
      contactIds: contactIds || [],
      emailStyle: emailStyle || "branded",
      status: status || "draft",
      ...(typeof trackOpens === "boolean" ? { trackOpens } : {}),
      ...(typeof trackClicks === "boolean" ? { trackClicks } : {}),
      ...(typeof skipInvalid === "boolean" ? { skipInvalid } : {}),
    });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cold-email/campaigns/:id
router.get("/campaigns/:id", async (req, res) => {
  try {
    const campaign = await ColdCampaign.findById(req.params.id).lean();
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });

    // Enrich with send stats breakdown
    const sendStats = await ColdSend.aggregate([
      { $match: { campaignId: campaign._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const sendMap = Object.fromEntries(sendStats.map((s) => [s._id, s.count]));

    res.json({ ...campaign, sendBreakdown: sendMap });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cold-email/campaigns/:id
router.put("/campaigns/:id", async (req, res) => {
  try {
    const {
      name,
      fromName,
      steps,
      mailboxIds,
      contactIds,
      emailStyle,
      status,
    } = req.body;
    const update = { name, fromName, steps, mailboxIds, contactIds };
    if (emailStyle) update.emailStyle = emailStyle;
    for (const k of ["trackOpens", "trackClicks", "skipInvalid"]) if (typeof req.body[k] === "boolean") update[k] = req.body[k];
    if (status !== undefined) update.status = status;
    const campaign = await ColdCampaign.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true },
    );
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cold-email/campaigns/:id
router.delete("/campaigns/:id", async (req, res) => {
  try {
    await ColdCampaign.findByIdAndDelete(req.params.id);
    await ColdSend.deleteMany({ campaignId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/campaigns/:id/launch
router.post("/campaigns/:id/launch", async (req, res) => {
  try {
    const campaign = await ColdCampaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    if (campaign.status === "active" || campaign.status === "scheduled")
      return res
        .status(400)
        .json({ message: "Campaign already queued or running" });
    if (!campaign.steps || campaign.steps.length === 0)
      return res.status(400).json({ message: "No steps defined" });
    if (!campaign.mailboxIds || campaign.mailboxIds.length === 0)
      return res.status(400).json({ message: "No mailboxes selected" });
    if (!campaign.contactIds || campaign.contactIds.length === 0)
      return res.status(400).json({ message: "No contacts selected" });

    // Get active contacts (not suppressed)
    const suppressed = await ColdSuppressionList.find({})
      .select("email")
      .lean();
    const suppressedEmails = new Set(suppressed.map((s) => s.email));

    const contacts = await ColdContact.find({
      _id: { $in: campaign.contactIds },
      status: "active",
    }).lean();

    const mailboxes = await ColdMailbox.find({
      _id: { $in: campaign.mailboxIds },
      status: "active",
    }).lean();
    const totalCap = mailboxes.reduce(
      (sum, m) => sum + (m.dailyLimit || 40),
      0,
    );

    const now = new Date();
    const rawScheduled = req.body?.scheduledStartAt
      ? new Date(req.body.scheduledStartAt)
      : null;
    const isScheduled = rawScheduled && rawScheduled > now;
    const baseTime = isScheduled ? rawScheduled : now;
    let queued = 0;

    // Build sends — all anchored to baseTime with a tiny jitter so timestamps are staggered
    const sendDocs = [];
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      if (suppressedEmails.has(contact.email)) continue;

      // Skip if already has a send record for step 0
      const exists = await ColdSend.findOne({
        campaignId: campaign._id,
        contactId: contact._id,
        stepIndex: 0,
      });
      if (exists) continue;

      // Jitter: 0–10 seconds per contact so they don't all share the exact same timestamp
      const jitterMs = i * 10_000 + Math.floor(Math.random() * 5_000);
      const scheduledAt = new Date(baseTime.getTime() + jitterMs);

      sendDocs.push({
        campaignId: campaign._id,
        contactId: contact._id,
        contactEmail: contact.email,
        stepIndex: 0,
        status: "pending",
        scheduledAt,
      });
      queued++;
    }

    if (sendDocs.length)
      await ColdSend.insertMany(sendDocs, { ordered: false });

    campaign.status = isScheduled ? "scheduled" : "active";
    campaign.launchedAt = now;
    campaign.scheduledStartAt = isScheduled ? rawScheduled : undefined;
    await campaign.save();

    // Only kick immediate processor if sending now (not scheduled for future)
    if (!isScheduled) {
      setImmediate(async () => {
        try {
          const { processColdEmailSends } = require("../utils/coldEmailEngine");
          await processColdEmailSends();
        } catch (e) {
          console.error("Post-launch send error:", e.message);
        }
      });
    }

    res.json({ success: true, queued, totalContacts: contacts.length });
  } catch (err) {
    console.error("Launch error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/campaigns/:id/pause
router.post("/campaigns/:id/pause", async (req, res) => {
  try {
    const campaign = await ColdCampaign.findByIdAndUpdate(
      req.params.id,
      { status: "paused" },
      { new: true },
    );
    if (!campaign) return res.status(404).json({ message: "Not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/campaigns/:id/resume
router.post("/campaigns/:id/resume", async (req, res) => {
  try {
    const campaign = await ColdCampaign.findByIdAndUpdate(
      req.params.id,
      { status: "active", pausedReason: "", autoPausedAt: null },
      { new: true },
    );
    if (!campaign) return res.status(404).json({ message: "Not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cold-email/campaigns/:id/sends?page=1&limit=50
// POST /api/cold-email/campaigns/:id/retry-failed — puts this campaign's failed emails back in the
// queue (sent at the normal pace and only in sending hours).
router.post("/campaigns/:id/retry-failed", async (req, res) => {
  try {
    const result = await ColdSend.updateMany(
      { campaignId: req.params.id, status: "failed" },
      { $set: { status: "pending", scheduledAt: new Date(), attempts: 0 }, $unset: { error: "" } },
    );
    res.json({ retried: result.modifiedCount || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/campaigns/:id/sends", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "50"));
    const filter = { campaignId: req.params.id };
    if (req.query.status === "opened") filter.opens = { $gt: 0 };
    else if (req.query.status === "clicked") filter.clicks = { $gt: 0 };
    else if (req.query.status === "delivered") filter.status = { $in: ["sent", "replied"] };
    else if (req.query.status) filter.status = req.query.status;

    const [sends, total] = await Promise.all([
      ColdSend.find(filter)
        .populate("contactId", "firstName lastName email company stage verification")
        .sort({ scheduledAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ColdSend.countDocuments(filter),
    ]);
    res.json({ sends, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  SUPPRESSION LIST
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/cold-email/suppression
router.get("/suppression", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "50"));
    const search = (req.query.search || "").trim();
    const filter = search ? { email: new RegExp(search, "i") } : {};
    const [items, total] = await Promise.all([
      ColdSuppressionList.find(filter)
        .sort({ addedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ColdSuppressionList.countDocuments(filter),
    ]);
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/suppression — manually add email
router.post("/suppression", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    if (!email || !isValidEmail(email))
      return res.status(400).json({ message: "Invalid email" });
    const item = await ColdSuppressionList.findOneAndUpdate(
      { email },
      { email, reason: "manual", addedAt: new Date() },
      { upsert: true, new: true },
    );
    // Also mark contact
    await ColdContact.findOneAndUpdate({ email }, { status: "suppressed" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cold-email/suppression/:email
router.delete("/suppression/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();
    await ColdSuppressionList.findOneAndDelete({ email });
    await ColdContact.findOneAndUpdate({ email }, { status: "active" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  UNSUBSCRIBE  (public — no auth)
// ═══════════════════════════════════════════════════════════════════════════════

// GET = the link in the email; POST = Gmail/Yahoo's one-click "Unsubscribe" button
// (List-Unsubscribe-Post header). Both remove the person the same way.
const unsubscribeHandler = async (req, res) => {
  const unsubHtml = (heading, body) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${heading}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{background:#fff;border-radius:20px;padding:48px 40px;text-align:center;max-width:420px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.08)}
.icon{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px}
h1{color:#0f172a;font-size:22px;font-weight:800;margin-bottom:12px}p{color:#64748b;font-size:15px;line-height:1.7}
.brand{margin-top:32px;font-size:12px;color:#94a3b8;font-weight:600;letter-spacing:.5px}
</style></head>
<body><div class="card">${body}<p class="brand">cleaniq services</p></div></body></html>`;

  try {
    const decoded = jwt.verify(req.params.token, JWT_SECRET);
    const email = (decoded.email || "").toLowerCase().trim();
    if (!email) throw new Error("no email");

    await ColdSuppressionList.findOneAndUpdate(
      { email },
      {
        email,
        reason: "unsubscribed",
        addedAt: new Date(),
        campaignId: decoded.campaignId || undefined,
      },
      { upsert: true },
    );
    await ColdContact.findOneAndDelete({ email });

    if (decoded.campaignId) {
      const contact = await ColdContact.findOne({ email });
      if (contact) {
        const alreadyUnsub = await ColdSend.findOne({
          campaignId: decoded.campaignId,
          contactId: contact._id,
          status: "skipped",
          error: "Unsubscribed",
        });
        if (!alreadyUnsub) {
          await ColdSend.updateMany(
            {
              campaignId: decoded.campaignId,
              contactId: contact._id,
              status: "pending",
            },
            { status: "skipped", error: "Unsubscribed" },
          );
          await ColdCampaign.findByIdAndUpdate(decoded.campaignId, {
            $inc: { "stats.unsubscribed": 1 },
          });
          await ColdEvent.create({ type: "unsubscribed", campaignId: decoded.campaignId, contactId: contact._id });
          await ColdContact.updateOne({ _id: contact._id }, { stage: "unsubscribed", lastActivityAt: new Date() });
        }
      }
    }

    res.send(
      unsubHtml(
        "Unsubscribed",
        `
      <div class="icon" style="background:#ecfdf5">✓</div>
      <h1>You've been unsubscribed</h1>
      <p>You've been removed from our mailing list and won't receive any further emails from this campaign.</p>`,
      ),
    );
  } catch {
    res.status(400).send(
      unsubHtml(
        "Invalid link",
        `
      <div class="icon" style="background:#fef2f2">✕</div>
      <h1>Invalid link</h1>
      <p>This unsubscribe link is invalid or has expired. Please contact us directly if you'd like to be removed.</p>`,
      ),
    );
  }
};
router.get("/unsubscribe/:token", unsubscribeHandler);
router.post("/unsubscribe/:token", unsubscribeHandler);

// ═══════════════════════════════════════════════════════════════════════════════
//  MANUAL REPLY CHECK
// ═══════════════════════════════════════════════════════════════════════════════

router.post("/campaigns/:id/check-replies", async (req, res) => {
  try {
    const campaign = await ColdCampaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });

    const found = await require("../utils/coldInbox").scanAllMailboxes();
    const updated = await ColdCampaign.findById(req.params.id).lean();
    res.json({ message: `Checked ${found.checked || 0} new messages: ${found.replies || 0} replies, ${found.bounces || 0} bounces`, stats: updated.stats, found });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  OVERALL STATS
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/stats", async (req, res) => {
  try {
    const [
      totalContacts,
      activeContacts,
      suppressed,
      totalCampaigns,
      activeCampaigns,
      totalMailboxes,
      sendAgg,
    ] = await Promise.all([
      ColdContact.countDocuments(),
      ColdContact.countDocuments({ status: "active" }),
      ColdSuppressionList.countDocuments(),
      ColdCampaign.countDocuments(),
      ColdCampaign.countDocuments({ status: "active" }),
      ColdMailbox.countDocuments({ status: "active" }),
      ColdCampaign.aggregate([
        {
          $group: {
            _id: null,
            sent: { $sum: "$stats.sent" },
            replied: { $sum: "$stats.replied" },
          },
        },
      ]),
    ]);

    const agg = sendAgg[0] || { sent: 0, replied: 0 };
    res.json({
      totalContacts,
      activeContacts,
      suppressed,
      totalCampaigns,
      activeCampaigns,
      totalMailboxes,
      totalSent: agg.sent,
      totalReplied: agg.replied,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  EMAIL CHECKS (does the address's domain accept email?)
// ═══════════════════════════════════════════════════════════════════════════════
let verifying = false;
async function verifyUnchecked(limit = 500) {
  if (verifying) return 0;
  verifying = true;
  try {
    const rows = await ColdContact.find({ $or: [{ "verification.checkedAt": null }, { "verification.checkedAt": { $exists: false } }] }).select("email").limit(limit).lean();
    for (const c of rows) await ColdContact.updateOne({ _id: c._id }, { verification: await verifyEmail(c.email) });
    return rows.length;
  } finally {
    verifying = false;
  }
}
router.verifyUnchecked = verifyUnchecked;

// POST /contacts/verify { ids?: [...] } — check (again) the given contacts, or everyone not checked yet.
router.post("/contacts/verify", async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((x) => mongoose.isValidObjectId(x)).slice(0, 2000) : null;
    if (ids?.length) {
      const rows = await ColdContact.find({ _id: { $in: ids } }).select("email").lean();
      for (const c of rows) await ColdContact.updateOne({ _id: c._id }, { verification: await verifyEmail(c.email) });
    } else {
      await verifyUnchecked(2000);
    }
    const counts = await ColdContact.aggregate([{ $group: { _id: "$verification.status", n: { $sum: 1 } } }]);
    res.json({ counts: Object.fromEntries(counts.map((c) => [c._id || "unknown", c.n])) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CONTACT ACTIVITY + STAGE
// ═══════════════════════════════════════════════════════════════════════════════
const STAGES = ["new", "contacted", "opened", "clicked", "replied", "interested", "meeting", "not_interested", "bounced", "unsubscribed"];

router.get("/contacts/:id/activity", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Not found" });
    const contact = await ColdContact.findById(req.params.id).lean();
    if (!contact) return res.status(404).json({ message: "Not found" });
    const [events, replies, campaigns] = await Promise.all([
      ColdEvent.find({ contactId: contact._id, bot: { $ne: true } }).sort({ at: -1 }).limit(300).lean(),
      ColdReply.find({ contactId: contact._id }).sort({ receivedAt: -1 }).limit(100).lean(),
      ColdCampaign.find({ _id: { $in: await ColdSend.distinct("campaignId", { contactId: contact._id }) } }).select("name").lean(),
    ]);
    res.json({ contact, events, replies, campaigns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/contacts/:id/stage", async (req, res) => {
  const { stage, notes } = req.body || {};
  if (stage !== undefined && !STAGES.includes(stage)) return res.status(400).json({ message: "Unknown stage" });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Not found" });
  const upd = {};
  if (stage) upd.stage = stage;
  if (typeof notes === "string") upd.notes = notes.slice(0, 5000);
  const c = await ColdContact.findByIdAndUpdate(req.params.id, upd, { new: true }).lean();
  if (!c) return res.status(404).json({ message: "Not found" });
  res.json(c);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  INBOX (replies from contacts, and our answers)
// ═══════════════════════════════════════════════════════════════════════════════
// GET /inbox?category=&unread=1&campaignId=&page=
router.get("/inbox", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = 50;
    const match = { direction: "in" };
    if (req.query.category === "auto") match.autoReply = true;
    else if (req.query.category) { match.category = req.query.category; match.autoReply = false; }
    else if (req.query.all !== "1") match.autoReply = false;
    if (req.query.unread === "1") match.read = false;
    if (req.query.campaignId && mongoose.isValidObjectId(req.query.campaignId)) match.campaignId = new mongoose.Types.ObjectId(req.query.campaignId);
    // One row per contact: their latest message.
    const rows = await ColdReply.aggregate([
      { $match: match },
      { $sort: { receivedAt: -1 } },
      { $group: { _id: "$contactId", latest: { $first: "$$ROOT" }, unread: { $sum: { $cond: ["$read", 0, 1] } }, count: { $sum: 1 } } },
      { $sort: { "latest.receivedAt": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);
    const contacts = await ColdContact.find({ _id: { $in: rows.map((r) => r._id) } }).select("email firstName lastName company stage").lean();
    const campaigns = await ColdCampaign.find({ _id: { $in: rows.map((r) => r.latest.campaignId) } }).select("name").lean();
    const byId = (list) => Object.fromEntries(list.map((x) => [String(x._id), x]));
    const cMap = byId(contacts);
    const kMap = byId(campaigns);
    const counts = await ColdReply.aggregate([
      { $match: { direction: "in" } },
      { $group: { _id: { $cond: ["$autoReply", "auto", "$category"] }, n: { $sum: 1 }, unread: { $sum: { $cond: ["$read", 0, 1] } } } },
    ]);
    res.json({
      threads: rows.map((r) => ({ ...r.latest, unread: r.unread, count: r.count, contact: cMap[String(r._id)] || null, campaign: kMap[String(r.latest.campaignId)] || null })),
      counts: Object.fromEntries(counts.map((c) => [c._id || "other", { total: c.n, unread: c.unread }])),
      page,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /inbox/contact/:contactId — the whole conversation: our emails, their replies, our answers.
router.get("/inbox/contact/:contactId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contactId)) return res.status(404).json({ message: "Not found" });
    const contactId = req.params.contactId;
    const [contact, replies, sends] = await Promise.all([
      ColdContact.findById(contactId).lean(),
      ColdReply.find({ contactId }).sort({ receivedAt: 1 }).lean(),
      ColdSend.find({ contactId, sentAt: { $ne: null }, status: { $in: ["sent", "replied", "bounced"] } }).sort({ sentAt: 1 }).lean(),
    ]);
    if (!contact) return res.status(404).json({ message: "Not found" });
    const campaigns = await ColdCampaign.find({ _id: { $in: sends.map((s) => s.campaignId) } }).lean();
    const cMap = Object.fromEntries(campaigns.map((c) => [String(c._id), c]));
    const { personalizeTemplate } = require("../utils/coldEmailEngine");
    // Our emails as they were sent (step + A/B version), so the thread reads naturally.
    const ours = sends.map((s) => {
      const step = cMap[String(s.campaignId)]?.steps?.[s.stepIndex];
      const b = s.variant === "B";
      return {
        _id: `send-${s._id}`, kind: "sent", at: s.sentAt, campaign: cMap[String(s.campaignId)]?.name || "", stepIndex: s.stepIndex, variant: s.variant,
        subject: step ? personalizeTemplate(b && step.subjectB?.trim() ? step.subjectB : step.subject, contact) : "",
        body: step ? personalizeTemplate(b && step.bodyB?.trim() ? step.bodyB : step.body, contact) : "",
        status: s.status, opens: s.opens || 0, clicks: s.clicks || 0, bounceReason: s.bounceReason || "",
      };
    });
    const theirs = replies.map((r) => ({ _id: r._id, kind: r.direction === "in" ? "reply" : "answer", at: r.receivedAt, subject: r.subject, body: r.body, from: r.from, category: r.category, autoReply: r.autoReply, read: r.read, sentBy: r.sentBy }));
    await ColdReply.updateMany({ contactId, direction: "in", read: false }, { read: true });
    res.json({ contact, messages: [...ours, ...theirs].sort((a, b) => new Date(a.at) - new Date(b.at)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/inbox/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Not found" });
  const upd = {};
  if (typeof req.body?.read === "boolean") upd.read = req.body.read;
  if (typeof req.body?.category === "string") upd.category = req.body.category.slice(0, 40);
  const r = await ColdReply.findByIdAndUpdate(req.params.id, upd, { new: true }).lean();
  if (!r) return res.status(404).json({ message: "Not found" });
  res.json(r);
});

// POST /inbox/contact/:contactId/respond { text } — answer their latest reply, in the same thread,
// from the mailbox they replied to.
router.post("/inbox/contact/:contactId/respond", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ message: "Write your answer first." });
    if (!mongoose.isValidObjectId(req.params.contactId)) return res.status(404).json({ message: "Not found" });
    const last = await ColdReply.findOne({ contactId: req.params.contactId, direction: "in" }).sort({ receivedAt: -1 });
    if (!last) return res.status(400).json({ message: "There's no reply to answer yet." });
    const mailbox = await ColdMailbox.findById(last.mailboxId);
    if (!mailbox) return res.status(400).json({ message: "The mailbox that received this reply isn't connected any more." });
    const campaign = await ColdCampaign.findById(last.campaignId).select("fromName").lean();
    const engine = require("../utils/coldEmailEngine");
    const to = (String(last.from).match(/[^\s<>]+@[^\s<>]+/) || [""])[0];
    const sent = mailbox.provider === "outlook"
      ? await engine.sendOutlookReply(mailbox, { messageId: last.providerMessageId, text })
      : mailbox.provider === "smtp"
      ? await require("../utils/coldSmtp").sendSmtpReply(mailbox, { to, subject: last.subject || "", text, inReplyTo: last.internetMessageId, fromName: campaign?.fromName || "" })
      : await engine.sendGmailReply(mailbox, { to, subject: last.subject || "", text, threadId: last.threadId, inReplyTo: last.internetMessageId, fromName: campaign?.fromName || "" });
    const out = await ColdReply.create({
      direction: "out", sendId: last.sendId, campaignId: last.campaignId, contactId: last.contactId, mailboxId: mailbox._id,
      providerMessageId: sent.id || undefined, threadId: sent.threadId || last.threadId, from: mailbox.email, to, subject: last.subject, body: text, read: true,
      sentBy: req.admin?.username || req.admin?.email || "admin", receivedAt: new Date(),
    });
    res.json(out);
  } catch (err) {
    console.error("[cold email] answer:", err.message);
    res.status(500).json({ message: `Couldn't send: ${err.message}` });
  }
});

// POST /inbox/check — read the mailboxes now (instead of waiting ~10 minutes).
router.post("/inbox/check", async (req, res) => {
  try {
    res.json(await require("../utils/coldInbox").scanAllMailboxes());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
// Emails that actually went out.
const SENT_STATUSES = ["sent", "replied", "bounced"];
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);

async function funnel(match) {
  const [row] = await ColdSend.aggregate([
    { $match: { ...match, sentAt: { $ne: null }, status: { $in: SENT_STATUSES } } },
    { $group: {
      _id: null,
      sent: { $sum: 1 },
      bounced: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } },
      opened: { $sum: { $cond: [{ $gt: ["$opens", 0] }, 1, 0] } },
      clicked: { $sum: { $cond: [{ $gt: ["$clicks", 0] }, 1, 0] } },
      replied: { $sum: { $cond: [{ $eq: ["$status", "replied"] }, 1, 0] } },
      interested: { $sum: { $cond: [{ $eq: ["$replyCategory", "interested"] }, 1, 0] } },
    } },
  ]);
  const f = row || { sent: 0, bounced: 0, opened: 0, clicked: 0, replied: 0, interested: 0 };
  const delivered = f.sent - f.bounced;
  return {
    sent: f.sent, delivered, bounced: f.bounced, opened: f.opened, clicked: f.clicked, replied: f.replied, interested: f.interested,
    deliveredRate: pct(delivered, f.sent), bounceRate: pct(f.bounced, f.sent), openRate: pct(f.opened, delivered), clickRate: pct(f.clicked, delivered), replyRate: pct(f.replied, delivered),
  };
}

async function breakdown(match, field) {
  const rows = await ColdSend.aggregate([
    { $match: { ...match, sentAt: { $ne: null }, status: { $in: SENT_STATUSES } } },
    { $group: {
      _id: `$${field}`,
      sent: { $sum: 1 },
      bounced: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } },
      opened: { $sum: { $cond: [{ $gt: ["$opens", 0] }, 1, 0] } },
      clicked: { $sum: { $cond: [{ $gt: ["$clicks", 0] }, 1, 0] } },
      replied: { $sum: { $cond: [{ $eq: ["$status", "replied"] }, 1, 0] } },
    } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => {
    const delivered = r.sent - r.bounced;
    return { key: r._id, ...r, delivered, openRate: pct(r.opened, delivered), clickRate: pct(r.clicked, delivered), replyRate: pct(r.replied, delivered), bounceRate: pct(r.bounced, r.sent) };
  });
}

async function daily(match, days = 30) {
  const since = new Date(Date.now() - days * 864e5);
  const rows = await ColdEvent.aggregate([
    { $match: { ...match, at: { $gte: since }, bot: { $ne: true }, type: { $in: ["sent", "opened", "clicked", "replied", "bounced"] } } },
    { $group: { _id: { d: { $dateToString: { format: "%Y-%m-%d", date: "$at", timezone: "Europe/London" } }, t: "$type" }, n: { $sum: 1 } } },
  ]);
  const out = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toLocaleDateString("en-CA", { timeZone: "Europe/London" });
    out[d] = { date: d, sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 };
  }
  for (const r of rows) if (out[r._id.d]) out[r._id.d][r._id.t] = r.n;
  return Object.values(out);
}

// GET /analytics — everything; /campaigns/:id/analytics — one campaign
router.get("/analytics", async (req, res) => {
  try {
    const [total, campaigns, mailboxes, days, replies] = await Promise.all([
      funnel({}),
      breakdown({}, "campaignId"),
      breakdown({}, "mailboxId"),
      daily({}),
      ColdReply.aggregate([{ $match: { direction: "in" } }, { $group: { _id: { $cond: ["$autoReply", "out_of_office", "$category"] }, n: { $sum: 1 } } }]),
    ]);
    const names = Object.fromEntries((await ColdCampaign.find({ _id: { $in: campaigns.map((c) => c.key) } }).select("name status").lean()).map((c) => [String(c._id), c]));
    const boxes = Object.fromEntries((await ColdMailbox.find({ _id: { $in: mailboxes.map((m) => m.key) } }).select("email").lean()).map((m) => [String(m._id), m.email]));
    res.json({
      total, daily: days,
      campaigns: campaigns.map((c) => ({ ...c, name: names[String(c.key)]?.name || "(deleted)", status: names[String(c.key)]?.status })),
      mailboxes: mailboxes.map((m) => ({ ...m, email: boxes[String(m.key)] || "(removed)" })),
      replyCategories: Object.fromEntries(replies.map((r) => [r._id || "other", r.n])),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/campaigns/:id/analytics", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Not found" });
    const campaignId = new mongoose.Types.ObjectId(req.params.id);
    const campaign = await ColdCampaign.findById(campaignId).lean();
    if (!campaign) return res.status(404).json({ message: "Not found" });
    const [total, steps, variants, mailboxes, days, pending, unsubscribed] = await Promise.all([
      funnel({ campaignId }),
      breakdown({ campaignId }, "stepIndex"),
      ColdSend.aggregate([
        { $match: { campaignId, sentAt: { $ne: null }, status: { $in: SENT_STATUSES } } },
        { $group: { _id: { s: "$stepIndex", v: "$variant" }, sent: { $sum: 1 }, bounced: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } }, opened: { $sum: { $cond: [{ $gt: ["$opens", 0] }, 1, 0] } }, clicked: { $sum: { $cond: [{ $gt: ["$clicks", 0] }, 1, 0] } }, replied: { $sum: { $cond: [{ $eq: ["$status", "replied"] }, 1, 0] } } } },
        { $sort: { "_id.s": 1, "_id.v": 1 } },
      ]),
      breakdown({ campaignId }, "mailboxId"),
      daily({ campaignId }),
      ColdSend.countDocuments({ campaignId, status: "pending" }),
      ColdEvent.countDocuments({ campaignId, type: "unsubscribed" }),
    ]);
    const boxes = Object.fromEntries((await ColdMailbox.find({ _id: { $in: mailboxes.map((m) => m.key) } }).select("email").lean()).map((m) => [String(m._id), m.email]));
    res.json({
      total: { ...total, pending, unsubscribed: Math.max(unsubscribed, campaign.stats?.unsubscribed || 0) },
      steps: steps.map((s) => ({ ...s, subject: campaign.steps?.[s.key]?.subject || "" })),
      variants: variants.map((v) => { const d = v.sent - v.bounced; return { step: v._id.s, variant: v._id.v || "A", ...v, _id: undefined, delivered: d, openRate: pct(v.opened, d), clickRate: pct(v.clicked, d), replyRate: pct(v.replied, d) }; }),
      mailboxes: mailboxes.map((m) => ({ ...m, email: boxes[String(m.key)] || "(removed)" })),
      daily: days,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Templates ─────────────────────────────────────────────────────────────────

// GET /api/cold-email/templates
router.get("/templates", async (req, res) => {
  try {
    const templates = await ColdTemplate.find().sort({ createdAt: -1 }).lean();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/templates
router.post("/templates", async (req, res) => {
  try {
    const { name, steps } = req.body;
    if (!name?.trim())
      return res.status(400).json({ message: "Name is required" });
    if (!steps?.length)
      return res.status(400).json({ message: "At least one step is required" });
    const template = await ColdTemplate.create({ name: name.trim(), steps });
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cold-email/templates/:id
router.delete("/templates/:id", async (req, res) => {
  try {
    await ColdTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
