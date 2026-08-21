# Cold Email Outreach System — Full Build Spec

> Paste this entire document into your AI to replicate the cold email system.
> Stack: Node.js + Express + MongoDB (Mongoose) + React + Gmail OAuth2 API.

---

## What It Does

A full cold-email outreach tool built into an admin panel. Admins can:

1. Connect a Gmail mailbox via OAuth (one click)
2. Import contacts from a CSV file
3. Build multi-step email campaigns (each step waits N days before sending the next)
4. Launch a campaign — emails are sent via the connected Gmail account immediately
5. Track replies, opens (via Gmail thread detection), and unsubscribes
6. Manage a global suppression list (unsubscribed / bounced)

Emails look like they come from the admin's own Gmail — not a mass-mail service — so deliverability is high.

---

## Environment Variables Required

```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://admin.yourdomain.com
JWT_SECRET=your_jwt_secret_32chars
COLD_EMAIL_ENCRYPTION_KEY=any_random_32_char_string
COLD_EMAIL_DRY_RUN=false   # set true to log instead of actually sending
```

---

## NPM Packages Needed

### Backend
```
googleapis         # Gmail API + OAuth
jsonwebtoken       # JWT for unsubscribe tokens
csv-parse          # Parse uploaded CSV files
multer             # Handle multipart file uploads
```

---

## Database Models

### 1. `ColdMailbox` — connected Gmail accounts

```js
// models/ColdMailbox.js
const mongoose = require("mongoose");
const coldMailboxSchema = new mongoose.Schema({
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  provider:      { type: String, enum: ["gmail"], default: "gmail" },
  accessToken:   { type: String },   // AES-256-GCM encrypted
  refreshToken:  { type: String },   // AES-256-GCM encrypted
  tokenExpiry:   { type: Date },
  dailyLimit:    { type: Number, default: 40 },
  sentToday:     { type: Number, default: 0 },
  lastResetDate: { type: Date, default: () => new Date() },
  status:        { type: String, enum: ["active", "paused", "error"], default: "active" },
  errorMessage:  { type: String },
  createdAt:     { type: Date, default: () => new Date() },
});
module.exports = mongoose.model("ColdMailbox", coldMailboxSchema);
```

### 2. `ColdContact` — people to email

```js
// models/ColdContact.js
const mongoose = require("mongoose");
const coldContactSchema = new mongoose.Schema({
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  firstName:   { type: String, default: "" },
  lastName:    { type: String, default: "" },
  company:     { type: String, default: "" },
  extraFields: { type: Map, of: String, default: {} },
  status:      { type: String, enum: ["active", "suppressed"], default: "active" },
  importBatch: { type: String },
  importedAt:  { type: Date, default: () => new Date() },
});
coldContactSchema.index({ status: 1 });
module.exports = mongoose.model("ColdContact", coldContactSchema);
```

### 3. `ColdCampaign` — a named campaign with email steps

```js
// models/ColdCampaign.js
const mongoose = require("mongoose");
const stepSchema = new mongoose.Schema(
  {
    order:    { type: Number, required: true },
    subject:  { type: String, required: true },
    body:     { type: String, required: true },
    waitDays: { type: Number, default: 0 }, // days to wait after previous step
  },
  { _id: false }
);
const coldCampaignSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  fromName:   { type: String, default: "" },
  status:     { type: String, enum: ["draft", "active", "paused", "completed"], default: "draft" },
  steps:      [stepSchema],
  mailboxIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ColdMailbox" }],
  contactIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ColdContact" }],
  stats: {
    sent:         { type: Number, default: 0 },
    replied:      { type: Number, default: 0 },
    bounced:      { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    failed:       { type: Number, default: 0 },
  },
  createdAt:  { type: Date, default: () => new Date() },
  launchedAt: { type: Date },
});
module.exports = mongoose.model("ColdCampaign", coldCampaignSchema);
```

### 4. `ColdSend` — one row per contact per campaign step

```js
// models/ColdSend.js
const mongoose = require("mongoose");
const coldSendSchema = new mongoose.Schema({
  campaignId:    { type: mongoose.Schema.Types.ObjectId, ref: "ColdCampaign", required: true },
  contactId:     { type: mongoose.Schema.Types.ObjectId, ref: "ColdContact",  required: true },
  contactEmail:  { type: String, required: true, lowercase: true },
  stepIndex:     { type: Number, default: 0 },
  mailboxId:     { type: mongoose.Schema.Types.ObjectId, ref: "ColdMailbox" },
  status:        { type: String, enum: ["pending","sent","failed","skipped","replied","bounced"], default: "pending" },
  scheduledAt:   { type: Date, required: true },
  sentAt:        { type: Date },
  gmailMessageId:{ type: String },
  gmailThreadId: { type: String },
  error:         { type: String },
  replyFrom:     { type: String },
  replySubject:  { type: String },
  replyBody:     { type: String },
  repliedAt:     { type: Date },
});
coldSendSchema.index({ campaignId: 1, contactId: 1, stepIndex: 1 }, { unique: true });
coldSendSchema.index({ status: 1, scheduledAt: 1 });
coldSendSchema.index({ gmailThreadId: 1 });
module.exports = mongoose.model("ColdSend", coldSendSchema);
```

### 5. `ColdSuppressionList` — never email these addresses

```js
// models/ColdSuppressionList.js
const mongoose = require("mongoose");
const coldSuppressionSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  reason:     { type: String, enum: ["unsubscribed", "bounced", "manual"], default: "manual" },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "ColdCampaign" },
  addedAt:    { type: Date, default: () => new Date() },
});
module.exports = mongoose.model("ColdSuppressionList", coldSuppressionSchema);
```

---

## Backend Engine — `utils/coldEmailEngine.js`

This file does everything: token encryption, Gmail OAuth, email sending, template rendering, send processing, and reply detection.

```js
// utils/coldEmailEngine.js
const crypto    = require("crypto");
const jwt       = require("jsonwebtoken");
const { google } = require("googleapis");

const ColdMailbox        = require("../models/ColdMailbox");
const ColdContact        = require("../models/ColdContact");
const ColdCampaign       = require("../models/ColdCampaign");
const ColdSend           = require("../models/ColdSend");
const ColdSuppressionList = require("../models/ColdSuppressionList");

// ── Token encryption (AES-256-GCM) ───────────────────────────────────────────
const RAW_KEY = process.env.COLD_EMAIL_ENCRYPTION_KEY || "dev_cold_email_key_32chars_pad00";
const ENC_KEY = crypto.createHash("sha256").update(RAW_KEY).digest();

function encrypt(text) {
  if (!text) return "";
  const iv     = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const enc    = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

function decrypt(encText) {
  if (!encText) return "";
  const [ivHex, tagHex, encHex] = encText.split(":");
  const iv  = Buffer.from(ivHex,  "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const dec = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(enc), dec.final()]).toString("utf8");
}

// ── Gmail OAuth client ────────────────────────────────────────────────────────
const REDIRECT_URI = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/cold-email/auth/callback`;

function buildOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

async function getGmailClient(mailbox) {
  const oauth2 = buildOAuth2Client();
  oauth2.setCredentials({
    access_token:  decrypt(mailbox.accessToken),
    refresh_token: decrypt(mailbox.refreshToken),
    expiry_date:   mailbox.tokenExpiry ? mailbox.tokenExpiry.getTime() : undefined,
  });
  // Auto-persist refreshed tokens
  oauth2.on("tokens", async (tokens) => {
    const update = {};
    if (tokens.access_token) update.accessToken = encrypt(tokens.access_token);
    if (tokens.expiry_date)  update.tokenExpiry  = new Date(tokens.expiry_date);
    if (Object.keys(update).length) {
      await ColdMailbox.findByIdAndUpdate(mailbox._id, update);
    }
  });
  return google.gmail({ version: "v1", auth: oauth2 });
}

// ── Send via Gmail API ────────────────────────────────────────────────────────
async function sendViaGmail(mailbox, { to, subject, html, fromName }) {
  const gmail = await getGmailClient(mailbox);
  const from  = fromName ? `${fromName} <${mailbox.email}>` : mailbox.email;
  const mime = [
    `MIME-Version: 1.0`,
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    html,
  ].join("\r\n");
  const raw = Buffer.from(mime).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const result = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  return result.data;
}

// ── Template personalization ──────────────────────────────────────────────────
// Supported merge tags: {{first_name}} {{last_name}} {{full_name}} {{company}} {{email}}
function personalizeTemplate(template, contact) {
  const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
  return template
    .replace(/\{\{first_name\}\}/gi, contact.firstName || "")
    .replace(/\{\{last_name\}\}/gi,  contact.lastName  || "")
    .replace(/\{\{full_name\}\}/gi,  fullName)
    .replace(/\{\{company\}\}/gi,    contact.company   || "")
    .replace(/\{\{email\}\}/gi,      contact.email     || "");
}

// ── HTML email wrapper ────────────────────────────────────────────────────────
// Wraps plain text (or HTML body) in a branded email template.
// Includes a prominent "Reply Now" mailto button so prospects reply with one click.
function buildEmailHtml(rawBody, unsubUrl, replySubject) {
  if (/<html|<!DOCTYPE/i.test(rawBody)) return rawBody; // already full HTML

  const hasHtml = /<[a-z][\s\S]*>/i.test(rawBody);
  const content = hasHtml
    ? rawBody
    : rawBody.split(/\n/).map((line) =>
        line.trim()
          ? `<tr><td style="padding:0 0 6px;color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.7;">${line}</td></tr>`
          : `<tr><td style="height:10px;font-size:10px;line-height:10px;">&nbsp;</td></tr>`
      ).join("\n");

  const logoUrl      = `${process.env.BACKEND_URL || "https://api.yourdomain.com"}/public/images/logo.jpg`;
  const replySubEnc  = encodeURIComponent("Re: " + (replySubject || "Your message"));
  const replyBodyEnc = encodeURIComponent("Hi,\n\nI'm interested in learning more. Please get in touch.\n\nKind regards,");
  const replyHref    = `mailto:info@yourdomain.com?subject=${replySubEnc}&body=${replyBodyEnc}`;

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;background:#edf1f7;-webkit-font-smoothing:antialiased}a{color:#0a6644;text-decoration:none}
@media only screen and (max-width:620px){.wrapper{width:100%!important}.inner{padding:28px 20px!important}.hdr{padding:24px 20px!important}}
</style></head>
<body style="margin:0;padding:0;background:#edf1f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#edf1f7;">
<tr><td align="center" style="padding:40px 12px 48px;">
<table class="wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

  <!-- Header -->
  <tr><td class="hdr" align="center" style="background:#073d27;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
    <img src="${logoUrl}" width="80" height="80" style="display:block;margin:0 auto 12px;border-radius:14px;object-fit:cover;border:2px solid rgba(255,255,255,0.12);" alt="logo"/>
    <p style="margin:0;color:#fff;font-family:Arial,sans-serif;font-size:20px;font-weight:800;">Your Company Name</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Your tagline here</p>
  </td></tr>

  <!-- Gradient bar -->
  <tr><td style="height:4px;background:linear-gradient(90deg,#10b981 0%,#3b82f6 60%,#8b5cf6 100%);font-size:0;">&nbsp;</td></tr>

  <!-- Body -->
  <tr><td class="inner" style="background:#fff;padding:40px 40px 32px;border-left:1px solid #dde5ed;border-right:1px solid #dde5ed;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${content}</table>
  </td></tr>

  <!-- Reply CTA button -->
  <tr><td style="background:#fff;border-left:1px solid #dde5ed;border-right:1px solid #dde5ed;padding:4px 40px 28px;text-align:center;">
    <a href="${replyHref}" style="display:inline-block;background:#073d27;color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:800;text-decoration:none;padding:14px 32px;border-radius:50px;border:2px solid #0a5c43;">&#9993;&nbsp; Yes, I'm Interested — Reply Now</a>
    <p style="margin:10px 0 0;color:#94a3b8;font-family:Arial,sans-serif;font-size:11px;">Clicking this opens your email client with a pre-filled reply</p>
  </td></tr>

  <!-- Divider -->
  <tr><td style="background:#fff;border-left:1px solid #dde5ed;border-right:1px solid #dde5ed;padding:0 40px;">
    <div style="height:1px;background:#e2e8f0;">&nbsp;</div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8fafc;border:1px solid #dde5ed;border-top:none;border-radius:0 0 16px 16px;padding:22px 40px 24px;text-align:center;">
    <p style="margin:0 0 8px;color:#94a3b8;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;">You received this because you're on our outreach list.</p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">
      <a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
      &nbsp;&nbsp;·&nbsp;&nbsp;
      <a href="https://yourdomain.com" style="color:#64748b;">yourdomain.com</a>
    </p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

// ── Daily counter reset ───────────────────────────────────────────────────────
async function resetDailyCounters() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await ColdMailbox.updateMany(
    { lastResetDate: { $lt: today } },
    { $set: { sentToday: 0, lastResetDate: new Date() } }
  );
}

// ── Pick an available mailbox (one with remaining daily capacity) ─────────────
async function pickMailbox(mailboxIds) {
  const boxes = await ColdMailbox.find({ _id: { $in: mailboxIds }, status: "active" });
  for (const box of boxes) {
    if (box.sentToday < box.dailyLimit) return box;
  }
  return null; // all at daily limit
}

// ── Schedule the next step for a contact ─────────────────────────────────────
async function scheduleNextStep(send, campaign) {
  const nextIdx = send.stepIndex + 1;
  if (nextIdx >= campaign.steps.length) return;
  const nextStep = campaign.steps[nextIdx];
  const base = new Date();
  base.setDate(base.getDate() + (nextStep.waitDays || 1));
  base.setHours(9 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 60), 0, 0);
  const exists = await ColdSend.findOne({ campaignId: send.campaignId, contactId: send.contactId, stepIndex: nextIdx });
  if (exists) return;
  await ColdSend.create({
    campaignId: send.campaignId, contactId: send.contactId,
    contactEmail: send.contactEmail, stepIndex: nextIdx,
    status: "pending", scheduledAt: base,
  });
}

// ── Process a single send record ─────────────────────────────────────────────
async function processSingleSend(send) {
  const campaign = await ColdCampaign.findById(send.campaignId);
  if (!campaign || campaign.status !== "active")
    return ColdSend.findByIdAndUpdate(send._id, { status: "skipped", error: "Campaign not active" });

  const suppressed = await ColdSuppressionList.findOne({ email: send.contactEmail });
  if (suppressed)
    return ColdSend.findByIdAndUpdate(send._id, { status: "skipped", error: "Suppressed" });

  const contact = await ColdContact.findById(send.contactId);
  if (!contact || contact.status !== "active")
    return ColdSend.findByIdAndUpdate(send._id, { status: "skipped", error: "Contact inactive" });

  const mailbox = await pickMailbox(campaign.mailboxIds);
  if (!mailbox) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0);
    return ColdSend.findByIdAndUpdate(send._id, { scheduledAt: tomorrow });
  }

  const step = campaign.steps[send.stepIndex];
  if (!step) return ColdSend.findByIdAndUpdate(send._id, { status: "skipped", error: "Step missing" });

  const subject   = personalizeTemplate(step.subject, contact);
  const body      = personalizeTemplate(step.body, contact);
  const unsubToken = jwt.sign(
    { email: contact.email, campaignId: send.campaignId.toString() },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "90d" }
  );
  const unsubUrl  = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/cold-email/unsubscribe/${unsubToken}`;
  const fullHtml  = buildEmailHtml(body, unsubUrl, subject);

  if (process.env.COLD_EMAIL_DRY_RUN === "true") {
    console.log(`[DRY RUN] → ${contact.email} | Step ${send.stepIndex + 1} | "${subject}"`);
    await ColdSend.findByIdAndUpdate(send._id, { status: "sent", sentAt: new Date(), mailboxId: mailbox._id });
    await ColdMailbox.findByIdAndUpdate(mailbox._id, { $inc: { sentToday: 1 } });
    await ColdCampaign.findByIdAndUpdate(send.campaignId, { $inc: { "stats.sent": 1 } });
    await scheduleNextStep(send, campaign);
    return;
  }

  const result = await sendViaGmail(mailbox, { to: contact.email, subject, html: fullHtml, fromName: campaign.fromName || "" });

  await ColdSend.findByIdAndUpdate(send._id, { status: "sent", sentAt: new Date(), mailboxId: mailbox._id, gmailMessageId: result.id, gmailThreadId: result.threadId });
  await ColdMailbox.findByIdAndUpdate(mailbox._id, { $inc: { sentToday: 1 } });
  await ColdCampaign.findByIdAndUpdate(send.campaignId, { $inc: { "stats.sent": 1 } });
  await scheduleNextStep(send, campaign);
}

// ── Main send processor (called on a timer every 2 minutes) ──────────────────
let sendRunning = false;
async function processColdEmailSends() {
  if (sendRunning) return;
  sendRunning = true;
  try {
    await resetDailyCounters();
    const now     = new Date();
    const pending = await ColdSend.find({ status: "pending", scheduledAt: { $lte: now } })
      .sort({ scheduledAt: 1 })
      .limit(150)       // process up to 150 per tick
      .lean();

    const CONCURRENCY = 5;  // send 5 in parallel at a time
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      const chunk = pending.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map(async (send) => {
        try {
          await processSingleSend(send);
        } catch (err) {
          console.error(`Send error (${send.contactEmail}):`, err.message);
          await ColdSend.findByIdAndUpdate(send._id, { status: "failed", error: err.message });
          if (err.message?.includes("invalid_grant") || err.message?.includes("Invalid Credentials")) {
            if (send.mailboxId)
              await ColdMailbox.findByIdAndUpdate(send.mailboxId, { status: "error", errorMessage: err.message });
          }
        }
      }));
    }
  } finally {
    sendRunning = false;
  }
}

// ── Reply detection (runs every ~10 minutes) ──────────────────────────────────
// Checks Gmail inbox for replies to sent threads and marks them in ColdSend.
function b64Decode(data) {
  if (!data) return "";
  try { return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); } catch { return ""; }
}

function extractGmailBody(payload, depth = 0) {
  if (!payload || depth > 6) return "";
  if (payload.body?.data) {
    const text = b64Decode(payload.body.data);
    if (text.trim()) return text;
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractGmailBody(part, depth + 1);
      if (text.trim()) return text;
    }
  }
  return "";
}

async function detectRepliesForMailbox(mailbox) {
  const gmail = await getGmailClient(mailbox);
  // Find ColdSend records that were sent from this mailbox and have a Gmail thread
  const sentSends = await ColdSend.find({
    mailboxId: mailbox._id, status: "sent", gmailThreadId: { $exists: true, $ne: null },
  }).limit(200).lean();

  for (const send of sentSends) {
    try {
      const thread = await gmail.users.threads.get({ userId: "me", id: send.gmailThreadId });
      const messages = thread.data.messages || [];
      if (messages.length < 2) continue; // only the original, no reply yet

      const reply = messages.find((m) => m.id !== send.gmailMessageId);
      if (!reply) continue;

      const headers    = reply.payload?.headers || [];
      const fromHeader = headers.find((h) => h.name.toLowerCase() === "from");
      const subHeader  = headers.find((h) => h.name.toLowerCase() === "subject");
      const replyFrom  = fromHeader?.value || "";
      const replySubject = subHeader?.value || "";
      const replyBody  = extractGmailBody(reply.payload);

      await ColdSend.findByIdAndUpdate(send._id, {
        status: "replied", repliedAt: new Date(),
        replyFrom, replySubject,
        replyBody: replyBody.slice(0, 2000),
      });
      await ColdCampaign.findByIdAndUpdate(send.campaignId, { $inc: { "stats.replied": 1 } });
    } catch { /* skip individual thread errors */ }
  }
}

let replyRunning = false;
async function detectReplies() {
  if (replyRunning) return;
  replyRunning = true;
  try {
    const mailboxes = await ColdMailbox.find({ status: "active" });
    for (const mailbox of mailboxes) {
      try { await detectRepliesForMailbox(mailbox); }
      catch (err) { console.error(`Reply detect error (${mailbox.email}):`, err.message); }
    }
  } finally { replyRunning = false; }
}

module.exports = {
  encrypt, decrypt, buildOAuth2Client, REDIRECT_URI,
  processColdEmailSends, detectReplies, buildEmailHtml,
};
```

---

## Backend Routes — `routes/cold-email.js`

Register all routes at `/api/cold-email` in your Express app:
```js
app.use("/api/cold-email", require("./routes/cold-email"));
```

### Gmail OAuth
| Method | Path | What it does |
|--------|------|-------------|
| GET | `/auth/google` | Redirects admin to Google consent screen |
| GET | `/auth/callback` | Google redirects here; saves encrypted tokens to mailbox |

### Mailboxes
| Method | Path | What it does |
|--------|------|-------------|
| GET | `/mailboxes` | List all connected mailboxes (tokens hidden) |
| PATCH | `/mailboxes/:id` | Update `dailyLimit` or `status` |
| DELETE | `/mailboxes/:id` | Remove a mailbox |

### Contacts
| Method | Path | What it does |
|--------|------|-------------|
| GET | `/contacts?page&limit&search` | Paginated contact list with status counts |
| GET | `/contacts/all-ids?search` | Returns all active contact IDs (for select-all) |
| POST | `/contacts/import` | CSV upload — multipart, field `file` |
| POST | `/contacts` | Add a single contact manually |
| DELETE | `/contacts/:id` | Delete one contact |
| DELETE | `/contacts` (body: `{ids:[]}`) | Bulk delete |

### Campaigns
| Method | Path | What it does |
|--------|------|-------------|
| GET | `/campaigns` | List all campaigns |
| POST | `/campaigns` | Create a campaign |
| GET | `/campaigns/:id` | Get campaign + send breakdown stats |
| PUT | `/campaigns/:id` | Update campaign (name, steps, mailboxes, contacts) |
| DELETE | `/campaigns/:id` | Delete campaign + all its sends |
| POST | `/campaigns/:id/launch` | Schedule sends for all contacts, kick processor |
| POST | `/campaigns/:id/pause` | Pause campaign |
| POST | `/campaigns/:id/resume` | Resume paused campaign |
| GET | `/campaigns/:id/sends?page&limit&status` | Paginated send log |
| POST | `/campaigns/:id/check-replies` | Manually trigger reply detection |

### Suppression
| Method | Path | What it does |
|--------|------|-------------|
| GET | `/suppression?page&limit&search` | Paginated suppression list |
| POST | `/suppression` | Add email manually |
| DELETE | `/suppression/:email` | Remove email (also re-activates contact) |

### Unsubscribe (public — no auth)
| Method | Path | What it does |
|--------|------|-------------|
| GET | `/unsubscribe/:token` | Validates JWT, adds to suppression, shows confirmation page |

### Stats
| Method | Path | What it does |
|--------|------|-------------|
| GET | `/stats` | Dashboard totals: contacts, campaigns, mailboxes, sends |

---

## Automation Engine Integration

Call `processColdEmailSends` on a timer (every 2 minutes) and `detectReplies` every 10 minutes. Also call `processColdEmailSends` immediately when a campaign is launched:

```js
// In your automation engine or server startup:
const { processColdEmailSends, detectReplies } = require("./utils/coldEmailEngine");

let coldEmailTick = 0;

function startColdEmailEngine() {
  const tick = async () => {
    try { await processColdEmailSends(); }
    catch (e) { console.error("Cold email send error:", e.message); }

    coldEmailTick++;
    if (coldEmailTick % 5 === 0) {
      try { await detectReplies(); }
      catch (e) { console.error("Reply detection error:", e.message); }
    }
  };
  tick();
  setInterval(tick, 2 * 60 * 1000); // every 2 minutes
}
```

In the launch route, fire the processor immediately so first emails go out without waiting:
```js
setImmediate(async () => {
  try { const { processColdEmailSends } = require("../utils/coldEmailEngine"); await processColdEmailSends(); }
  catch (e) { console.error("Post-launch send error:", e.message); }
});
```

---

## Launch Route — Key Logic

The most important route. When admin clicks "Launch":

```js
// POST /campaigns/:id/launch
// 1. Check campaign has steps, mailboxes, contacts
// 2. Load all active contacts from campaign.contactIds (filter out suppressed)
// 3. Create ColdSend records for each contact with scheduledAt = NOW + small jitter
// 4. Save campaign.status = "active"
// 5. Call processColdEmailSends() immediately via setImmediate

// Scheduling logic (avoids all-same-timestamp, but sends quickly):
const sendDocs = contacts.map((contact, i) => ({
  campaignId:   campaign._id,
  contactId:    contact._id,
  contactEmail: contact.email,
  stepIndex:    0,
  status:       "pending",
  scheduledAt:  new Date(Date.now() + i * 10_000 + Math.random() * 5_000), // 10s jitter per contact
}));
await ColdSend.insertMany(sendDocs, { ordered: false });
```

---

## Frontend — React Components

Build 5 tabs inside a single admin page:

### Tab 1: Campaigns
- Card list of all campaigns (name, status badge, sent/replied counts, steps count)
- "New Campaign" button opens a slide-over panel with:
  - Name field
  - From Name field
  - Step builder (add/remove steps — each step has Subject, Body textarea, Wait Days)
  - Mailbox selector (checkboxes)
  - Contact selector (search + paginated list + select-all checkbox)
  - Preview button per step (renders email in iframe with sample data)
  - Save as Draft / Launch buttons
- Each campaign card has Launch / Pause / Resume / View Replies / Delete actions
- Campaign detail view shows per-contact send log table

### Tab 2: Contacts
- Paginated table with search
- Import CSV button (drag-drop or click-to-upload)
- Add single contact form
- Status chips (active / suppressed)
- Bulk select + delete
- Import result toast: "✓ 45 imported, 3 duplicates, 1 invalid"

### Tab 3: Mailboxes
- Card per connected Gmail account showing email, daily limit, sent today, status
- "Connect Gmail" button → calls `/auth/google` which redirects to Google consent
- Edit daily limit inline
- Pause/resume mailbox

### Tab 4: Replies
- Flat list of all ColdSend records with `status: "replied"`
- Shows: contact name, email, company, campaign name, reply preview, replied-at date
- Click to expand full reply body
- "Check for New Replies" button calls `/campaigns/:id/check-replies`

### Tab 5: Suppression
- Searchable table of suppressed emails with reason + date
- Add manually, remove (re-activates contact)

---

## Template Merge Tags (use in campaign subject/body)

| Tag | Replaced with |
|-----|--------------|
| `{{first_name}}` | Contact's first name |
| `{{last_name}}` | Contact's last name |
| `{{full_name}}` | First + last name |
| `{{company}}` | Contact's company |
| `{{email}}` | Contact's email address |

---

## CSV Import Format

The importer auto-detects the email column. Supported column names:

- Email: `email`, `Email`, `EMAIL`, `e-mail`, or any column containing "email"
- First name: `first_name`, `firstName`, `First Name`
- Last name: `last_name`, `lastName`, `Last Name`
- Full name (split automatically): `full_name`, `Full Name`, `prospect_full_name`
- Company: `company`, `Company`, `company_name`, `prospect_company_name`
- Any other columns are stored in `extraFields` map

---

## Complete Flow (end to end)

```
1. Admin connects Gmail mailbox
   GET /api/cold-email/auth/google → Google OAuth → callback saves encrypted tokens

2. Admin imports contacts
   POST /api/cold-email/contacts/import (CSV upload)
   → Parsed, deduplicated, saved to ColdContact collection

3. Admin creates a campaign
   POST /api/cold-email/campaigns
   → name, fromName, steps[], mailboxIds[], contactIds[]

4. Admin launches campaign
   POST /api/cold-email/campaigns/:id/launch
   → Creates ColdSend record per contact (scheduledAt = now + tiny jitter)
   → Sets campaign.status = "active"
   → Fires processColdEmailSends() immediately

5. Engine processes sends (every 2 minutes, 150/tick, 5 parallel)
   processColdEmailSends()
   → Finds pending ColdSend records with scheduledAt <= now
   → For each: personalizes subject + body, builds HTML, sends via Gmail API
   → Updates ColdSend: status="sent", gmailMessageId, gmailThreadId
   → Increments mailbox.sentToday + campaign.stats.sent
   → Creates next-step ColdSend if campaign has more steps (waitDays later)

6. Engine detects replies (every 10 minutes)
   detectReplies()
   → For each sent ColdSend with a gmailThreadId: fetches the thread
   → If thread has > 1 message: marks ColdSend as "replied", stores reply text

7. Contact clicks Unsubscribe link in email footer
   GET /api/cold-email/unsubscribe/:jwt-token
   → Adds to ColdSuppressionList, sets contact.status = "suppressed"
   → Cancels remaining pending sends for this contact

8. Contact clicks "Yes, I'm Interested" mailto button
   → Opens their email client pre-addressed to info@yourdomain.com
   → Admin receives reply directly in Gmail inbox
```

---

## Google Cloud Setup (required)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Gmail API**
3. OAuth consent screen → External → add scopes: `gmail.send`, `gmail.readonly`, `userinfo.email`
4. Credentials → OAuth 2.0 Client ID → Web application
5. Authorized redirect URIs: `https://api.yourdomain.com/api/cold-email/auth/callback`
6. Copy Client ID + Client Secret → put in `.env`

---

## Notes for the AI

- Keep all OAuth tokens AES-256-GCM encrypted at rest — never store plaintext
- Never return `accessToken` or `refreshToken` fields in API responses
- The suppression list must be checked on every send — never email a suppressed contact
- `ColdSend` has a unique compound index on `(campaignId, contactId, stepIndex)` — use `insertMany({ ordered: false })` so duplicates are silently skipped
- The `processColdEmailSends` function uses a `sendRunning` lock to prevent concurrent runs
- Reply detection reads Gmail threads, not inbox — it only looks at threads started by your sends
- Daily limit resets automatically at midnight via `resetDailyCounters()`
- Use `setImmediate` for fire-and-forget work (never `await` the post-launch processor in the request handler)
