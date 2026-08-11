const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");

const ColdMailbox = require("../models/ColdMailbox");
const ColdContact = require("../models/ColdContact");
const ColdCampaign = require("../models/ColdCampaign");
const ColdSend = require("../models/ColdSend");
const ColdSuppressionList = require("../models/ColdSuppressionList");

// ── Token encryption ──────────────────────────────────────────────────────────

const RAW_KEY =
  process.env.COLD_EMAIL_ENCRYPTION_KEY || "dev_cold_email_key_32chars_pad00";
const ENC_KEY = crypto.createHash("sha256").update(RAW_KEY).digest();

function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

function decrypt(encText) {
  if (!encText) return "";
  const [ivHex, tagHex, encHex] = encText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const dec = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(enc), dec.final()]).toString("utf8");
}

// ── Gmail OAuth client ────────────────────────────────────────────────────────

const REDIRECT_URI = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/cold-email/auth/callback`;
const MS_REDIRECT_URI = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/cold-email/auth/microsoft/callback`;

const MS_TOKEN_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MS_AUTH_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MS_SCOPES =
  "offline_access https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read";

function buildMsAuthUrl() {
  const p = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID || "",
    response_type: "code",
    redirect_uri: MS_REDIRECT_URI,
    scope: MS_SCOPES,
    response_mode: "query",
    prompt: "consent",
  });
  return `${MS_AUTH_URL}?${p.toString()}`;
}

async function exchangeMsCode(code) {
  const params = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID || "",
    client_secret: process.env.MS_CLIENT_SECRET || "",
    code,
    redirect_uri: MS_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const res = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.error_description || data.error || "MS token exchange failed",
    );
  return data;
}

async function refreshMsToken(rawRefreshToken) {
  const params = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID || "",
    client_secret: process.env.MS_CLIENT_SECRET || "",
    refresh_token: rawRefreshToken,
    grant_type: "refresh_token",
    scope: MS_SCOPES,
  });
  const res = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data.error_description || data.error || "MS token refresh failed",
    );
  return data;
}

async function getMsAccessToken(mailbox) {
  const expiry = mailbox.tokenExpiry
    ? new Date(mailbox.tokenExpiry).getTime()
    : 0;
  if (expiry - Date.now() > 5 * 60 * 1000) {
    return decrypt(mailbox.accessToken);
  }
  const raw = decrypt(mailbox.refreshToken);
  if (!raw)
    throw new Error("No Microsoft refresh token — reconnect this mailbox");
  const tokens = await refreshMsToken(raw);
  const update = {
    accessToken: encrypt(tokens.access_token),
    tokenExpiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
  };
  if (tokens.refresh_token) update.refreshToken = encrypt(tokens.refresh_token);
  await ColdMailbox.findByIdAndUpdate(mailbox._id, update);
  return tokens.access_token;
}

function buildOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

async function getGmailClient(mailbox) {
  const oauth2 = buildOAuth2Client();
  oauth2.setCredentials({
    access_token: decrypt(mailbox.accessToken),
    refresh_token: decrypt(mailbox.refreshToken),
    expiry_date: mailbox.tokenExpiry
      ? mailbox.tokenExpiry.getTime()
      : undefined,
  });

  // Persist refreshed tokens
  oauth2.on("tokens", async (tokens) => {
    const update = {};
    if (tokens.access_token) update.accessToken = encrypt(tokens.access_token);
    if (tokens.expiry_date) update.tokenExpiry = new Date(tokens.expiry_date);
    if (Object.keys(update).length) {
      await ColdMailbox.findByIdAndUpdate(mailbox._id, update);
    }
  });

  return google.gmail({ version: "v1", auth: oauth2 });
}

// ── Gmail send ────────────────────────────────────────────────────────────────

async function sendViaGmail(mailbox, { to, subject, html, fromName }) {
  const gmail = await getGmailClient(mailbox);
  const from = fromName ? `${fromName} <${mailbox.email}>` : mailbox.email;

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

// ── Microsoft Graph send ──────────────────────────────────────────────────────
// Creates a draft first (so we get message ID + conversationId), then sends it.
async function sendViaOutlook(mailbox, { to, subject, html, fromName }) {
  const accessToken = await getMsAccessToken(mailbox);

  const draft = {
    subject,
    body: { contentType: "HTML", content: html },
    toRecipients: [{ emailAddress: { address: to } }],
    from: { emailAddress: { name: fromName || "", address: mailbox.email } },
  };

  // Step 1 — create draft
  const createRes = await fetch(
    "https://graph.microsoft.com/v1.0/me/messages",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    },
  );
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(
      `MS Graph create: ${err?.error?.message || createRes.status}`,
    );
  }
  const msg = await createRes.json();

  // Step 2 — send
  const sendRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${msg.id}/send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!sendRes.ok) {
    const err = await sendRes.json().catch(() => ({}));
    throw new Error(`MS Graph send: ${err?.error?.message || sendRes.status}`);
  }

  return { id: msg.id, conversationId: msg.conversationId };
}

// ── Template helpers ──────────────────────────────────────────────────────────

function personalizeTemplate(template, contact) {
  const fullName =
    `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
  return template
    .replace(/\{\{first_name\}\}/gi, contact.firstName || "")
    .replace(/\{\{last_name\}\}/gi, contact.lastName || "")
    .replace(/\{\{full_name\}\}/gi, fullName)
    .replace(/\{\{company\}\}/gi, contact.company || "")
    .replace(/\{\{email\}\}/gi, contact.email || "")
    .replace(/\{\{domain\}\}/gi, contact.domain || "");
}

function buildEmailHtml(rawBody, unsubUrl, replySubject) {
  // Already a full HTML doc — use as-is
  if (/<html|<!DOCTYPE/i.test(rawBody)) return rawBody;

  // Convert plain text to styled <p> blocks; preserve existing HTML tags
  const hasHtml = /<[a-z][\s\S]*>/i.test(rawBody);
  const content = hasHtml
    ? rawBody
    : rawBody
        .split(/\n/)
        .map((line) => {
          if (!line.trim())
            return `<tr><td style="height:10px;font-size:10px;line-height:10px;">&nbsp;</td></tr>`;
          return `<tr><td style="padding:0 0 6px;color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;">${line}</td></tr>`;
        })
        .join("\n");

  const logoUrl = `${process.env.BACKEND_URL || "https://api.cleaniqservices.com"}/public/images/logo.jpg`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>Email from cleaniq services</title>
<style>
  body { margin:0; padding:0; -webkit-font-smoothing:antialiased; background:#edf1f7; }
  a { color:#0a6644; text-decoration:none; }
  @media only screen and (max-width:620px) {
    .wrapper { width:100% !important; }
    .inner-cell { padding:28px 20px !important; }
    .header-cell { padding:24px 20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#edf1f7;">

<!-- Preheader (hidden, shows in inbox preview) -->
<div style="display:none;max-height:0;overflow:hidden;color:#edf1f7;font-size:1px;">
  A message from the cleaniq services team.&nbsp;
  &#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:#edf1f7;min-height:100%;">
  <tr>
    <td align="center" style="padding:40px 12px 48px;">

      <!-- Card wrapper -->
      <table class="wrapper" role="presentation" cellpadding="0" cellspacing="0" border="0"
             style="width:600px;max-width:600px;">

        <!-- ── HEADER ── -->
        <tr>
          <td class="header-cell" align="center"
              style="background:#073d27;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">

            <!-- Logo image with text fallback -->
            <img src="${logoUrl}"
                 alt="cleaniq services"
                 width="80" height="80"
                 style="display:block;margin:0 auto 12px;width:80px;height:80px;border-radius:14px;object-fit:cover;border:2px solid rgba(255,255,255,0.12);" />

            <p style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.4px;line-height:1.2;">cleaniq services</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.45);font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;">Professional Cleaning Solutions</p>
          </td>
        </tr>

        <!-- Gradient accent bar -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#10b981 0%,#3b82f6 60%,#8b5cf6 100%);font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td class="inner-cell"
              style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #dde5ed;border-right:1px solid #dde5ed;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${content}
            </table>
          </td>
        </tr>

        <!-- ── REPLY CTA ── -->
        <tr>
          <td style="background:#ffffff;border-left:1px solid #dde5ed;border-right:1px solid #dde5ed;padding:4px 40px 32px;text-align:center;">
            <a href="mailto:info@cleaniqservices.com?subject=${encodeURIComponent("Re: " + (replySubject || "Your message"))}&body=${encodeURIComponent("Hi,\n\nI received your email and I'm interested in learning more about your cleaning services.\n\nPlease get in touch.\n\nKind regards,")}"
               style="display:inline-block;background:#073d27;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;letter-spacing:0.2px;text-decoration:none;padding:14px 32px;border-radius:50px;border:2px solid #0a5c43;">
              &#9993;&nbsp; Yes, I'm Interested — Reply Now
            </a>
            <p style="margin:12px 0 0;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;">
              Clicking this opens your email client with a pre-filled reply to us
            </p>
          </td>
        </tr>

        <!-- Divider before footer -->
        <tr>
          <td style="background:#ffffff;border-left:1px solid #dde5ed;border-right:1px solid #dde5ed;padding:0 40px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0 20%,#e2e8f0 80%,transparent);font-size:0;line-height:0;">&nbsp;</div>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#f8fafc;border:1px solid #dde5ed;border-top:none;border-radius:0 0 16px 16px;padding:22px 40px 24px;text-align:center;">

            <!-- Brand badge -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 14px;">
              <tr>
                <td style="background:#073d27;border-radius:50px;padding:6px 14px;">
                  <span style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.3px;">cleaniq services</span>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">
              You received this because you're on our outreach list.
            </p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;">
              <a href="${unsubUrl}"
                 style="color:#64748b;text-decoration:underline;text-underline-offset:2px;">Unsubscribe</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="https://cleaniqservices.com"
                 style="color:#64748b;text-decoration:none;">cleaniqservices.com</a>
            </p>
          </td>
        </tr>

        <!-- Bottom spacing -->
        <tr>
          <td style="height:24px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildPlainEmailHtml(rawBody, unsubUrl) {
  const content = (rawBody || "")
    .split(/\n/)
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 14px;color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.75;">${line}</p>`
        : `<p style="margin:0 0 14px;font-size:15px;">&nbsp;</p>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="max-width:600px;margin:0 auto;padding:40px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
${content}
<p style="margin:36px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;line-height:1.6;font-family:Arial,sans-serif;">
  <a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
</p>
</div>
</body></html>`;
}

// Keep legacy alias used by older code paths
function unsubscribeFooter(url) {
  return `<p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:32px;">
    <a href="${url}" style="color:#64748b;">Unsubscribe</a> · cleaniq services</p>`;
}

// ── Daily counter reset ───────────────────────────────────────────────────────

async function resetDailyCounters() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await ColdMailbox.updateMany(
    { lastResetDate: { $lt: today } },
    { $set: { sentToday: 0, lastResetDate: new Date() } },
  );
}

// ── Pick available mailbox ────────────────────────────────────────────────────

async function pickMailbox(mailboxIds) {
  const boxes = await ColdMailbox.find({
    _id: { $in: mailboxIds },
    status: "active",
  });
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
  base.setHours(
    9 + Math.floor(Math.random() * 7),
    Math.floor(Math.random() * 60),
    0,
    0,
  );

  // Deduplicate — may already exist if this step was scheduled before
  const exists = await ColdSend.findOne({
    campaignId: send.campaignId,
    contactId: send.contactId,
    stepIndex: nextIdx,
  });
  if (exists) return;

  await ColdSend.create({
    campaignId: send.campaignId,
    contactId: send.contactId,
    contactEmail: send.contactEmail,
    stepIndex: nextIdx,
    status: "pending",
    scheduledAt: base,
  });
}

// ── Process one send ──────────────────────────────────────────────────────────

async function processSingleSend(send) {
  const campaign = await ColdCampaign.findById(send.campaignId);
  if (!campaign) {
    return ColdSend.findByIdAndUpdate(send._id, {
      status: "skipped",
      error: "Campaign not found",
    });
  }

  // Auto-activate scheduled campaigns whose start time has arrived
  if (campaign.status === "scheduled") {
    if (campaign.scheduledStartAt && campaign.scheduledStartAt <= new Date()) {
      campaign.status = "active";
      await campaign.save();
    } else {
      return; // not time yet — leave pending
    }
  }

  if (campaign.status !== "active") {
    return ColdSend.findByIdAndUpdate(send._id, {
      status: "skipped",
      error: "Campaign not active",
    });
  }

  // Suppressed?
  const suppressed = await ColdSuppressionList.findOne({
    email: send.contactEmail,
  });
  if (suppressed) {
    return ColdSend.findByIdAndUpdate(send._id, {
      status: "skipped",
      error: "Suppressed",
    });
  }

  // Contact still active?
  const contact = await ColdContact.findById(send.contactId);
  if (!contact || contact.status !== "active") {
    return ColdSend.findByIdAndUpdate(send._id, {
      status: "skipped",
      error: "Contact inactive",
    });
  }

  // Pick mailbox
  const mailbox = await pickMailbox(campaign.mailboxIds);
  if (!mailbox) {
    // Defer to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(
      9 + Math.floor(Math.random() * 6),
      Math.floor(Math.random() * 60),
      0,
      0,
    );
    return ColdSend.findByIdAndUpdate(send._id, { scheduledAt: tomorrow });
  }

  const step = campaign.steps[send.stepIndex];
  if (!step) {
    return ColdSend.findByIdAndUpdate(send._id, {
      status: "skipped",
      error: "Step missing",
    });
  }

  const subject = personalizeTemplate(step.subject, contact);
  const body = personalizeTemplate(step.body, contact);

  const unsubToken = jwt.sign(
    { email: contact.email, campaignId: send.campaignId.toString() },
    process.env.JWT_SECRET || "cleaniq_jwt_secret",
    { expiresIn: "90d" },
  );
  const unsubUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/cold-email/unsubscribe/${unsubToken}`;
  const fullHtml =
    campaign.emailStyle === "plain"
      ? buildPlainEmailHtml(body, unsubUrl)
      : buildEmailHtml(body, unsubUrl, subject);

  // ── Dry-run mode ──────────────────────────────────────────────────────────
  if (process.env.COLD_EMAIL_DRY_RUN === "true") {
    console.log(
      `[COLD EMAIL DRY RUN] → ${contact.email} | Step ${send.stepIndex + 1} | Subject: "${subject}"`,
    );
    await ColdSend.findByIdAndUpdate(send._id, {
      status: "sent",
      sentAt: new Date(),
      mailboxId: mailbox._id,
    });
    await ColdMailbox.findByIdAndUpdate(mailbox._id, {
      $inc: { sentToday: 1 },
    });
    await ColdCampaign.findByIdAndUpdate(send.campaignId, {
      $inc: { "stats.sent": 1 },
    });
    await scheduleNextStep(send, campaign);
    return;
  }

  // ── Real send — route based on provider ──────────────────────────────────
  const sendOpts = {
    to: contact.email,
    subject,
    html: fullHtml,
    fromName: campaign.fromName || "",
  };
  const result =
    mailbox.provider === "outlook"
      ? await sendViaOutlook(mailbox, sendOpts)
      : await sendViaGmail(mailbox, sendOpts);

  await ColdSend.findByIdAndUpdate(send._id, {
    status: "sent",
    sentAt: new Date(),
    mailboxId: mailbox._id,
    gmailMessageId: result.id,
    gmailThreadId:
      mailbox.provider === "outlook" ? result.conversationId : result.threadId,
  });
  await ColdMailbox.findByIdAndUpdate(mailbox._id, { $inc: { sentToday: 1 } });
  await ColdCampaign.findByIdAndUpdate(send.campaignId, {
    $inc: { "stats.sent": 1 },
  });
  await scheduleNextStep(send, campaign);
}

// ── Main send processor ───────────────────────────────────────────────────────

let sendRunning = false;

async function processColdEmailSends() {
  if (sendRunning) return;
  sendRunning = true;
  try {
    await resetDailyCounters();

    const now = new Date();
    const pending = await ColdSend.find({
      status: "pending",
      scheduledAt: { $lte: now },
    })
      .sort({ scheduledAt: 1 })
      .limit(150)
      .lean();

    // Process in parallel batches of 5 to stay within Gmail API rate limits
    const CONCURRENCY = 5;
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      const chunk = pending.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async (send) => {
          try {
            await processSingleSend(send);
          } catch (err) {
            console.error(
              `Cold send error (${send.contactEmail}):`,
              err.message,
            );
            await ColdSend.findByIdAndUpdate(send._id, {
              status: "failed",
              error: err.message,
            });
            const tokenError =
              err.message &&
              (err.message.includes("invalid_grant") ||
                err.message.includes("Invalid Credentials") ||
                err.message.includes("InvalidAuthenticationToken") ||
                err.message.includes("reconnect this mailbox"));
            if (tokenError && send.mailboxId) {
              await ColdMailbox.findByIdAndUpdate(send.mailboxId, {
                status: "error",
                errorMessage: err.message,
              });
            }
          }
        }),
      );
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
        if (mailbox.provider === "outlook") {
          await detectRepliesForOutlookMailbox(mailbox);
        } else {
          await detectRepliesForMailbox(mailbox);
        }
      } catch (err) {
        console.error(`Reply detect error (${mailbox.email}):`, err.message);
      }
    }
  } finally {
    replyRunning = false;
  }
}

// Decode Gmail base64url safely
function b64Decode(data) {
  if (!data) return "";
  try {
    // Gmail uses base64url (- and _ instead of + and /)
    const std = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(std, "base64").toString("utf8");
  } catch {
    return "";
  }
}

// Recursively search MIME parts for text content
function extractGmailBody(payload, depth = 0) {
  if (!payload || depth > 6) return "";

  // Direct body data (simple messages)
  if (payload.body?.data) {
    const text = b64Decode(payload.body.data);
    if (text.trim()) return text;
  }

  if (!payload.parts) return "";

  // Search text/plain parts first (most reliable for reply content)
  for (const part of payload.parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      const text = b64Decode(part.body.data);
      if (text.trim()) return text;
    }
  }

  // Recursively search nested multipart containers
  for (const part of payload.parts) {
    if (part.mimeType?.startsWith("multipart/")) {
      const nested = extractGmailBody(part, depth + 1);
      if (nested) return nested;
    }
  }

  // Fall back to text/html (strip tags)
  for (const part of payload.parts) {
    if (part.mimeType === "text/html" && part.body?.data) {
      const html = b64Decode(part.body.data);
      if (html.trim()) {
        return html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/[ \t]{2,}/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }
    }
  }

  return "";
}

async function detectRepliesForOutlookMailbox(mailbox) {
  const accessToken = await getMsAccessToken(mailbox);

  const sentSends = await ColdSend.find({
    mailboxId: mailbox._id,
    status: "sent",
    gmailThreadId: { $exists: true, $ne: null },
  })
    .limit(200)
    .lean();

  for (const send of sentSends) {
    try {
      const url = `https://graph.microsoft.com/v1.0/me/messages?$filter=conversationId eq '${send.gmailThreadId}' and isDraft eq false&$orderby=receivedDateTime asc&$select=id,from,subject,bodyPreview,receivedDateTime`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const messages = data.value || [];

      const reply = messages.find(
        (m) =>
          m.id !== send.gmailMessageId &&
          m.from?.emailAddress?.address?.toLowerCase() !==
            mailbox.email.toLowerCase(),
      );
      if (!reply) continue;

      const replyFrom = reply.from?.emailAddress?.address || "";
      const replySubject = reply.subject || "";
      const replyBody = (reply.bodyPreview || "").slice(0, 2000);

      await ColdSend.updateMany(
        {
          campaignId: send.campaignId,
          contactId: send.contactId,
          status: "pending",
        },
        { status: "skipped", error: "Contact replied" },
      );
      await ColdSend.findByIdAndUpdate(send._id, {
        status: "replied",
        repliedAt: new Date(reply.receivedDateTime),
        replyFrom,
        replySubject,
        replyBody,
      });
      const alreadyCounted = await ColdSend.findOne({
        campaignId: send.campaignId,
        contactId: send.contactId,
        status: "replied",
        _id: { $ne: send._id },
      });
      if (!alreadyCounted) {
        await ColdCampaign.findByIdAndUpdate(send.campaignId, {
          $inc: { "stats.replied": 1 },
        });
      }
    } catch {
      continue;
    }
  }
}

async function detectRepliesForMailbox(mailbox) {
  const gmail = await getGmailClient(mailbox);

  const list = await gmail.users.messages.list({
    userId: "me",
    q: "in:inbox newer_than:14d",
    maxResults: 100,
  });

  if (!list.data.messages) return;

  for (const ref of list.data.messages) {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: ref.id,
      format: "full",
      metadataHeaders: ["From", "Subject"],
    });

    const threadId = msg.data.threadId;
    if (!threadId) continue;

    const originalSend = await ColdSend.findOne({
      gmailThreadId: threadId,
      status: "sent",
    });
    if (!originalSend) continue;

    // Extract reply content
    const headers = msg.data.payload?.headers || [];
    const fromHdr = headers.find((h) => h.name?.toLowerCase() === "from");
    const subHdr = headers.find((h) => h.name?.toLowerCase() === "subject");
    const replyFrom = fromHdr?.value || "";
    const replySubject = subHdr?.value || "";
    // Try full body extraction first, fall back to Gmail snippet
    let replyBody = extractGmailBody(msg.data.payload);
    if (!replyBody && msg.data.snippet) replyBody = msg.data.snippet;
    replyBody = replyBody.slice(0, 5000); // cap at 5k chars

    // Stop sequence — mark all pending sends for this contact in this campaign
    await ColdSend.updateMany(
      {
        campaignId: originalSend.campaignId,
        contactId: originalSend.contactId,
        status: "pending",
      },
      { status: "skipped", error: "Contact replied" },
    );
    // Mark the original send as replied with reply content
    await ColdSend.findByIdAndUpdate(originalSend._id, {
      status: "replied",
      replyFrom,
      replySubject,
      replyBody,
      repliedAt: new Date(
        msg.data.internalDate ? parseInt(msg.data.internalDate) : Date.now(),
      ),
    });
    // Increment campaign replied counter (only once per contact)
    const alreadyCounted = await ColdSend.findOne({
      campaignId: originalSend.campaignId,
      contactId: originalSend.contactId,
      status: "replied",
      _id: { $ne: originalSend._id },
    });
    if (!alreadyCounted) {
      await ColdCampaign.findByIdAndUpdate(originalSend.campaignId, {
        $inc: { "stats.replied": 1 },
      });
    }
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  encrypt,
  decrypt,
  buildOAuth2Client,
  buildMsAuthUrl,
  exchangeMsCode,
  processColdEmailSends,
  detectReplies,
  REDIRECT_URI,
  MS_REDIRECT_URI,
};
