const crypto   = require("crypto");
const jwt       = require("jsonwebtoken");
const { google } = require("googleapis");

const ColdMailbox        = require("../models/ColdMailbox");
const ColdContact        = require("../models/ColdContact");
const ColdCampaign       = require("../models/ColdCampaign");
const ColdSend           = require("../models/ColdSend");
const ColdSuppressionList = require("../models/ColdSuppressionList");

// ── Token encryption ──────────────────────────────────────────────────────────

const RAW_KEY = process.env.COLD_EMAIL_ENCRYPTION_KEY || "dev_cold_email_key_32chars_pad00";
const ENC_KEY = crypto.createHash("sha256").update(RAW_KEY).digest();

function encrypt(text) {
  if (!text) return "";
  const iv      = crypto.randomBytes(16);
  const cipher  = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const enc     = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag     = cipher.getAuthTag();
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

  // Persist refreshed tokens
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

// ── Gmail send ────────────────────────────────────────────────────────────────

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

  const raw = Buffer.from(mime)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return result.data;
}

// ── Template helpers ──────────────────────────────────────────────────────────

function personalizeTemplate(template, contact) {
  const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
  return template
    .replace(/\{\{first_name\}\}/gi, contact.firstName || "")
    .replace(/\{\{last_name\}\}/gi,  contact.lastName  || "")
    .replace(/\{\{full_name\}\}/gi,  fullName)
    .replace(/\{\{company\}\}/gi,    contact.company   || "")
    .replace(/\{\{email\}\}/gi,      contact.email     || "");
}

function wrapBody(body) {
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#1e293b">${body.replace(/\n/g, "<br>")}</div>`;
}

function unsubscribeFooter(url) {
  return `
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;text-align:center">
  <p style="margin:0">You received this because you're on our outreach list.</p>
  <p style="margin:6px 0 0"><a href="${url}" style="color:#64748b;text-decoration:underline">Unsubscribe</a> · cleaniq services · cleaniqservices@gmail.com</p>
</div>`;
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

// ── Pick available mailbox ────────────────────────────────────────────────────

async function pickMailbox(mailboxIds) {
  const boxes = await ColdMailbox.find({ _id: { $in: mailboxIds }, status: "active" });
  for (const box of boxes) {
    if (box.sentToday < box.dailyLimit) return box;
  }
  return null;
}

// ── Schedule next step ────────────────────────────────────────────────────────

async function scheduleNextStep(send, campaign) {
  const nextIdx = send.stepIndex + 1;
  if (nextIdx >= campaign.steps.length) return;
  const nextStep = campaign.steps[nextIdx];

  const base = new Date();
  base.setDate(base.getDate() + (nextStep.waitDays || 1));
  base.setHours(9 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 60), 0, 0);

  // Deduplicate — may already exist if this step was scheduled before
  const exists = await ColdSend.findOne({
    campaignId: send.campaignId,
    contactId:  send.contactId,
    stepIndex:  nextIdx,
  });
  if (exists) return;

  await ColdSend.create({
    campaignId:   send.campaignId,
    contactId:    send.contactId,
    contactEmail: send.contactEmail,
    stepIndex:    nextIdx,
    status:       "pending",
    scheduledAt:  base,
  });
}

// ── Process one send ──────────────────────────────────────────────────────────

async function processSingleSend(send) {
  // Campaign still active?
  const campaign = await ColdCampaign.findById(send.campaignId);
  if (!campaign || campaign.status !== "active") {
    return ColdSend.findByIdAndUpdate(send._id, { status: "skipped", error: "Campaign not active" });
  }

  // Suppressed?
  const suppressed = await ColdSuppressionList.findOne({ email: send.contactEmail });
  if (suppressed) {
    return ColdSend.findByIdAndUpdate(send._id, { status: "skipped", error: "Suppressed" });
  }

  // Contact still active?
  const contact = await ColdContact.findById(send.contactId);
  if (!contact || contact.status !== "active") {
    return ColdSend.findByIdAndUpdate(send._id, { status: "skipped", error: "Contact inactive" });
  }

  // Pick mailbox
  const mailbox = await pickMailbox(campaign.mailboxIds);
  if (!mailbox) {
    // Defer to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0);
    return ColdSend.findByIdAndUpdate(send._id, { scheduledAt: tomorrow });
  }

  const step = campaign.steps[send.stepIndex];
  if (!step) {
    return ColdSend.findByIdAndUpdate(send._id, { status: "skipped", error: "Step missing" });
  }

  const subject = personalizeTemplate(step.subject, contact);
  const body    = wrapBody(personalizeTemplate(step.body, contact));

  const unsubToken = jwt.sign(
    { email: contact.email, campaignId: send.campaignId.toString() },
    process.env.JWT_SECRET || "cleaniq_jwt_secret",
    { expiresIn: "90d" }
  );
  const unsubUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/cold-email/unsubscribe/${unsubToken}`;
  const fullHtml = body + unsubscribeFooter(unsubUrl);

  // ── Dry-run mode ──────────────────────────────────────────────────────────
  if (process.env.COLD_EMAIL_DRY_RUN === "true") {
    console.log(`[COLD EMAIL DRY RUN] → ${contact.email} | Step ${send.stepIndex + 1} | Subject: "${subject}"`);
    await ColdSend.findByIdAndUpdate(send._id, { status: "sent", sentAt: new Date(), mailboxId: mailbox._id });
    await ColdMailbox.findByIdAndUpdate(mailbox._id, { $inc: { sentToday: 1 } });
    await ColdCampaign.findByIdAndUpdate(send.campaignId, { $inc: { "stats.sent": 1 } });
    await scheduleNextStep(send, campaign);
    return;
  }

  // ── Real send ─────────────────────────────────────────────────────────────
  const result = await sendViaGmail(mailbox, {
    to:       contact.email,
    subject,
    html:     fullHtml,
    fromName: campaign.fromName || "",
  });

  await ColdSend.findByIdAndUpdate(send._id, {
    status:         "sent",
    sentAt:         new Date(),
    mailboxId:      mailbox._id,
    gmailMessageId: result.id,
    gmailThreadId:  result.threadId,
  });
  await ColdMailbox.findByIdAndUpdate(mailbox._id, { $inc: { sentToday: 1 } });
  await ColdCampaign.findByIdAndUpdate(send.campaignId, { $inc: { "stats.sent": 1 } });
  await scheduleNextStep(send, campaign);
}

// ── Main send processor ───────────────────────────────────────────────────────

let sendRunning = false;

async function processColdEmailSends() {
  if (sendRunning) return;
  sendRunning = true;
  try {
    await resetDailyCounters();

    const now     = new Date();
    const pending = await ColdSend.find({ status: "pending", scheduledAt: { $lte: now } })
      .sort({ scheduledAt: 1 })
      .limit(15)
      .lean();

    for (const send of pending) {
      try {
        await processSingleSend(send);
      } catch (err) {
        console.error(`Cold send error (${send.contactEmail}):`, err.message);
        await ColdSend.findByIdAndUpdate(send._id, { status: "failed", error: err.message });
        // If Gmail auth fails, pause the mailbox
        if (err.message && (err.message.includes("invalid_grant") || err.message.includes("Invalid Credentials"))) {
          if (send.mailboxId) {
            await ColdMailbox.findByIdAndUpdate(send.mailboxId, { status: "error", errorMessage: err.message });
          }
        }
      }
    }
  } finally {
    sendRunning = false;
  }
}

// ── Reply detection ───────────────────────────────────────────────────────────

let replyRunning = false;

async function detectReplies() {
  if (replyRunning) return;
  replyRunning = true;
  try {
    const mailboxes = await ColdMailbox.find({ status: "active" });
    for (const mailbox of mailboxes) {
      try {
        await detectRepliesForMailbox(mailbox);
      } catch (err) {
        console.error(`Reply detect error (${mailbox.email}):`, err.message);
      }
    }
  } finally {
    replyRunning = false;
  }
}

async function detectRepliesForMailbox(mailbox) {
  const gmail = await getGmailClient(mailbox);

  const list = await gmail.users.messages.list({
    userId:     "me",
    q:          "in:inbox newer_than:3d",
    maxResults: 50,
  });

  if (!list.data.messages) return;

  for (const ref of list.data.messages) {
    const msg = await gmail.users.messages.get({
      userId:          "me",
      id:              ref.id,
      format:          "metadata",
      metadataHeaders: ["From"],
    });

    const threadId = msg.data.threadId;
    if (!threadId) continue;

    const originalSend = await ColdSend.findOne({ gmailThreadId: threadId, status: "sent" });
    if (!originalSend) continue;

    // Stop sequence — mark all pending sends for this contact in this campaign
    await ColdSend.updateMany(
      { campaignId: originalSend.campaignId, contactId: originalSend.contactId, status: "pending" },
      { status: "skipped", error: "Contact replied" }
    );
    // Mark the original send as replied
    await ColdSend.findByIdAndUpdate(originalSend._id, { status: "replied" });
    // Increment campaign replied counter (only once per contact)
    const alreadyCounted = await ColdSend.findOne({
      campaignId: originalSend.campaignId,
      contactId:  originalSend.contactId,
      status:     "replied",
      _id:        { $ne: originalSend._id },
    });
    if (!alreadyCounted) {
      await ColdCampaign.findByIdAndUpdate(originalSend.campaignId, { $inc: { "stats.replied": 1 } });
    }
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  encrypt,
  decrypt,
  buildOAuth2Client,
  processColdEmailSends,
  detectReplies,
  REDIRECT_URI,
};
