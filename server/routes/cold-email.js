const express  = require("express");
const multer   = require("multer");
const jwt      = require("jsonwebtoken");
const router   = express.Router();

const ColdMailbox         = require("../models/ColdMailbox");
const ColdContact         = require("../models/ColdContact");
const ColdCampaign        = require("../models/ColdCampaign");
const ColdSend            = require("../models/ColdSend");
const ColdSuppressionList = require("../models/ColdSuppressionList");

const { encrypt, decrypt, buildOAuth2Client, REDIRECT_URI, buildMsAuthUrl, exchangeMsCode } = require("../utils/coldEmailEngine");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || "cleaniq_jwt_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GMAIL OAUTH
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/cold-email/auth/google — redirect to Google consent screen
router.get("/auth/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ message: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured in .env" });
  }
  const oauth2 = buildOAuth2Client();
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt:      "consent",
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
  if (error) return res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=${error}`);
  if (!code)  return res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=no_code`);

  try {
    const oauth2 = buildOAuth2Client();
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    // Get the email address of this account
    const { google } = require("googleapis");
    const oauth2Api  = google.oauth2({ version: "v2", auth: oauth2 });
    const userInfo   = await oauth2Api.userinfo.get();
    const email      = userInfo.data.email;

    await ColdMailbox.findOneAndUpdate(
      { email },
      {
        email,
        provider:     "gmail",
        accessToken:  encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        tokenExpiry:  tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        status:       "active",
        errorMessage: "",
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&connected=1`);
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=oauth_failed`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MICROSOFT OAUTH
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/cold-email/auth/microsoft — redirect to Microsoft consent screen
router.get("/auth/microsoft", (req, res) => {
  if (!process.env.MS_CLIENT_ID || !process.env.MS_CLIENT_SECRET) {
    return res.status(500).json({ message: "MS_CLIENT_ID / MS_CLIENT_SECRET not configured in .env" });
  }
  res.redirect(buildMsAuthUrl());
});

// GET /api/cold-email/auth/microsoft/callback — Microsoft redirects here after consent
router.get("/auth/microsoft/callback", async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=${encodeURIComponent(error)}`);
  if (!code)  return res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=no_code`);

  try {
    const tokens = await exchangeMsCode(code);

    // Get email address via Microsoft Graph
    const userRes = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user  = await userRes.json();
    const email = (user.mail || user.userPrincipalName || "").toLowerCase();
    if (!email) throw new Error("Could not retrieve email from Microsoft account");

    await ColdMailbox.findOneAndUpdate(
      { email },
      {
        email,
        provider:     "outlook",
        accessToken:  encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        tokenExpiry:  new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
        status:       "active",
        errorMessage: "",
      },
      { upsert: true, new: true }
    );

    res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&connected=1`);
  } catch (err) {
    console.error("MS OAuth callback error:", err.message);
    res.redirect(`${FRONTEND_URL}/admin/cold-email?tab=mailboxes&error=oauth_failed`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MAILBOXES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/cold-email/mailboxes
router.get("/mailboxes", async (req, res) => {
  try {
    const mailboxes = await ColdMailbox.find().sort({ createdAt: 1 }).lean();
    res.json(mailboxes.map((m) => ({ ...m, accessToken: undefined, refreshToken: undefined })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/cold-email/mailboxes/:id — update daily limit or status
router.patch("/mailboxes/:id", async (req, res) => {
  try {
    const { dailyLimit, status } = req.body;
    const update = {};
    if (dailyLimit !== undefined) update.dailyLimit = Math.max(1, Math.min(10000, Number(dailyLimit)));
    if (status     !== undefined) update.status     = status;
    const box = await ColdMailbox.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!box) return res.status(404).json({ message: "Mailbox not found" });
    res.json({ ...box, accessToken: undefined, refreshToken: undefined });
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

// GET /api/cold-email/contacts?page=1&limit=50&search=
router.get("/contacts", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || "1"));
    const limit  = Math.min(200, parseInt(req.query.limit || "50"));
    const search = (req.query.search || "").trim();
    const filter = {};
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ email: re }, { firstName: re }, { lastName: re }, { company: re }];
    }
    const [contacts, total] = await Promise.all([
      ColdContact.find(filter).sort({ importedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ColdContact.countDocuments(filter),
    ]);
    const stats = await ColdContact.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusMap = Object.fromEntries(stats.map((s) => [s._id, s.count]));
    res.json({ contacts, total, page, limit, stats: statusMap });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/contacts/import — multipart CSV upload
router.post("/contacts/import", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const { parse } = require("csv-parse/sync");
    const records = parse(req.file.buffer, {
      columns:          true,
      skip_empty_lines: true,
      trim:             true,
    });

    let imported   = 0;
    let duplicates = 0;
    let invalid    = 0;
    const batchLabel = req.file.originalname;

    // Detect email column: exact matches first, then any key containing "email"
    const headers = records.length ? Object.keys(records[0]) : [];
    const exactEmailKeys = ["email", "Email", "EMAIL", "e-mail", "E-mail", "contact_professions_email"];
    const emailKey = exactEmailKeys.find((k) => headers.includes(k))
      || headers.find((k) => k.toLowerCase().includes("email"))
      || null;

    for (const rec of records) {
      const rawEmail = emailKey ? (rec[emailKey] || "") : "";
      const email    = rawEmail.toLowerCase().trim();

      if (!email || !isValidEmail(email)) { invalid++; continue; }

      const exists = await ColdContact.findOne({ email });
      if (exists) { duplicates++; continue; }

      // Support both split first/last name columns and a combined full_name column
      let firstName = rec.first_name || rec.firstName || rec.First_Name || rec["First Name"] || "";
      let lastName  = rec.last_name  || rec.lastName  || rec.Last_Name  || rec["Last Name"]  || "";
      if (!firstName && !lastName) {
        const fullName = rec.full_name || rec.fullName || rec["Full Name"] || rec.prospect_full_name || "";
        const parts    = fullName.trim().split(/\s+/);
        firstName      = parts[0] || "";
        lastName       = parts.slice(1).join(" ") || "";
      }
      const company = rec.company || rec.Company || rec.COMPANY
        || rec.prospect_company_name || rec.company_name || rec["Company Name"] || "";

      const knownKeys = new Set([
        emailKey,
        "first_name","firstName","First_Name","First Name",
        "last_name","lastName","Last_Name","Last Name",
        "full_name","fullName","Full Name","prospect_full_name",
        "company","Company","COMPANY","prospect_company_name","company_name","Company Name",
      ]);
      const extraFields = {};
      for (const [k, v] of Object.entries(rec)) {
        if (!knownKeys.has(k) && v) extraFields[k] = v;
      }

      await ColdContact.create({ email, firstName, lastName, company, extraFields, importBatch: batchLabel });
      imported++;
    }

    res.json({ imported, duplicates, invalid, total: records.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cold-email/contacts/all-ids — returns every active contact ID (for select-all)
router.get("/contacts/all-ids", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const filter = { status: "active" };
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ email: re }, { firstName: re }, { lastName: re }, { company: re }];
    }
    const contacts = await ColdContact.find(filter).select("_id").lean();
    res.json({ ids: contacts.map((c) => c._id.toString()), total: contacts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/contacts — add a single contact manually
router.post("/contacts", async (req, res) => {
  try {
    const { email: rawEmail, firstName = "", lastName = "", company = "" } = req.body;
    const email = (rawEmail || "").toLowerCase().trim();
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    const exists = await ColdContact.findOne({ email });
    if (exists) return res.status(409).json({ message: "Contact already exists" });
    const contact = await ColdContact.create({ email, firstName, lastName, company });
    res.status(201).json(contact);
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
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids array required" });
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
    const { name, fromName, steps, mailboxIds, contactIds, emailStyle } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });
    const campaign = await ColdCampaign.create({ name, fromName, steps: steps || [], mailboxIds: mailboxIds || [], contactIds: contactIds || [], emailStyle: emailStyle || "branded" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cold-email/campaigns/:id
router.get("/campaigns/:id", async (req, res) => {
  try {
    const campaign = await ColdCampaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

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
    const { name, fromName, steps, mailboxIds, contactIds, emailStyle } = req.body;
    const update = { name, fromName, steps, mailboxIds, contactIds };
    if (emailStyle) update.emailStyle = emailStyle;
    const campaign = await ColdCampaign.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
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
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (campaign.status === "active") return res.status(400).json({ message: "Already active" });
    if (!campaign.steps || campaign.steps.length === 0) return res.status(400).json({ message: "No steps defined" });
    if (!campaign.mailboxIds || campaign.mailboxIds.length === 0) return res.status(400).json({ message: "No mailboxes selected" });
    if (!campaign.contactIds || campaign.contactIds.length === 0) return res.status(400).json({ message: "No contacts selected" });

    // Get active contacts (not suppressed)
    const suppressed = await ColdSuppressionList.find({}).select("email").lean();
    const suppressedEmails = new Set(suppressed.map((s) => s.email));

    const contacts = await ColdContact.find({
      _id: { $in: campaign.contactIds },
      status: "active",
    }).lean();

    const mailboxes = await ColdMailbox.find({ _id: { $in: campaign.mailboxIds }, status: "active" }).lean();
    const totalCap  = mailboxes.reduce((sum, m) => sum + (m.dailyLimit || 40), 0);

    const baseTime = new Date();
    let queued = 0;

    // Build sends in bulk — all scheduled for now with a tiny random jitter
    // (a few seconds apart so Gmail doesn't see a single burst timestamp)
    const sendDocs = [];
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      if (suppressedEmails.has(contact.email)) continue;

      // Skip if already has a send record for step 0
      const exists = await ColdSend.findOne({ campaignId: campaign._id, contactId: contact._id, stepIndex: 0 });
      if (exists) continue;

      // Jitter: 0–10 seconds per contact so they don't all share the exact same timestamp
      const jitterMs    = i * 10_000 + Math.floor(Math.random() * 5_000);
      const scheduledAt = new Date(baseTime.getTime() + jitterMs);

      sendDocs.push({
        campaignId:   campaign._id,
        contactId:    contact._id,
        contactEmail: contact.email,
        stepIndex:    0,
        status:       "pending",
        scheduledAt,
      });
      queued++;
    }

    if (sendDocs.length) await ColdSend.insertMany(sendDocs, { ordered: false });

    campaign.status     = "active";
    campaign.launchedAt = new Date();
    await campaign.save();

    // Kick the send processor immediately so first batch goes out now
    // rather than waiting up to 2 minutes for the automation tick
    setImmediate(async () => {
      try {
        const { processColdEmailSends } = require("../utils/coldEmailEngine");
        await processColdEmailSends();
      } catch (e) {
        console.error("Post-launch send error:", e.message);
      }
    });

    res.json({ success: true, queued, totalContacts: contacts.length });
  } catch (err) {
    console.error("Launch error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/campaigns/:id/pause
router.post("/campaigns/:id/pause", async (req, res) => {
  try {
    const campaign = await ColdCampaign.findByIdAndUpdate(req.params.id, { status: "paused" }, { new: true });
    if (!campaign) return res.status(404).json({ message: "Not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cold-email/campaigns/:id/resume
router.post("/campaigns/:id/resume", async (req, res) => {
  try {
    const campaign = await ColdCampaign.findByIdAndUpdate(req.params.id, { status: "active" }, { new: true });
    if (!campaign) return res.status(404).json({ message: "Not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cold-email/campaigns/:id/sends?page=1&limit=50
router.get("/campaigns/:id/sends", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "50"));
    const filter = { campaignId: req.params.id };
    if (req.query.status) filter.status = req.query.status;

    const [sends, total] = await Promise.all([
      ColdSend.find(filter)
        .populate("contactId", "firstName lastName email company")
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
    const page  = Math.max(1, parseInt(req.query.page  || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "50"));
    const search = (req.query.search || "").trim();
    const filter = search ? { email: new RegExp(search, "i") } : {};
    const [items, total] = await Promise.all([
      ColdSuppressionList.find(filter).sort({ addedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
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
    if (!email || !isValidEmail(email)) return res.status(400).json({ message: "Invalid email" });
    const item = await ColdSuppressionList.findOneAndUpdate(
      { email },
      { email, reason: "manual", addedAt: new Date() },
      { upsert: true, new: true }
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

router.get("/unsubscribe/:token", async (req, res) => {
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
    const email   = (decoded.email || "").toLowerCase().trim();
    if (!email) throw new Error("no email");

    await ColdSuppressionList.findOneAndUpdate(
      { email },
      { email, reason: "unsubscribed", addedAt: new Date(), campaignId: decoded.campaignId || undefined },
      { upsert: true }
    );
    await ColdContact.findOneAndUpdate({ email }, { status: "suppressed" });

    if (decoded.campaignId) {
      const contact = await ColdContact.findOne({ email });
      if (contact) {
        const alreadyUnsub = await ColdSend.findOne({
          campaignId: decoded.campaignId,
          contactId:  contact._id,
          status:     "skipped",
          error:      "Unsubscribed",
        });
        if (!alreadyUnsub) {
          await ColdSend.updateMany(
            { campaignId: decoded.campaignId, contactId: contact._id, status: "pending" },
            { status: "skipped", error: "Unsubscribed" }
          );
          await ColdCampaign.findByIdAndUpdate(decoded.campaignId, { $inc: { "stats.unsubscribed": 1 } });
        }
      }
    }

    res.send(unsubHtml("Unsubscribed", `
      <div class="icon" style="background:#ecfdf5">✓</div>
      <h1>You've been unsubscribed</h1>
      <p>You've been removed from our mailing list and won't receive any further emails from this campaign.</p>`));
  } catch {
    res.status(400).send(unsubHtml("Invalid link", `
      <div class="icon" style="background:#fef2f2">✕</div>
      <h1>Invalid link</h1>
      <p>This unsubscribe link is invalid or has expired. Please contact us directly if you'd like to be removed.</p>`));
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MANUAL REPLY CHECK
// ═══════════════════════════════════════════════════════════════════════════════

router.post("/campaigns/:id/check-replies", async (req, res) => {
  try {
    const campaign = await ColdCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const { detectReplies } = require("../utils/coldEmailEngine");
    await detectReplies();

    // Return fresh campaign stats
    const updated = await ColdCampaign.findById(req.params.id).lean();
    res.json({ message: "Reply check complete", stats: updated.stats });
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
      ColdCampaign.aggregate([{ $group: { _id: null, sent: { $sum: "$stats.sent" }, replied: { $sum: "$stats.replied" } } }]),
    ]);

    const agg = sendAgg[0] || { sent: 0, replied: 0 };
    res.json({
      totalContacts, activeContacts, suppressed,
      totalCampaigns, activeCampaigns, totalMailboxes,
      totalSent: agg.sent, totalReplied: agg.replied,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
