// Reads each cold email mailbox (Gmail or Microsoft 365) for new messages and works out what they are:
//  - a bounce ("Undeliverable", "Address not found"…): hard bounces stop the sequence, block the
//    address and count as bounced; soft bounces (mailbox full, try later) are only noted
//  - an automatic reply (out of office): saved to the inbox, the sequence carries on
//  - a real reply: saved to the inbox, sorted by Claude (interested, not interested…), the sequence
//    stops for that person, and "unsubscribe" replies block the address
// Each message is only read once (ColdSeenMessage). Runs every ~10 minutes from automationEngine.
const ColdMailbox = require("../models/ColdMailbox");
const ColdSend = require("../models/ColdSend");
const ColdReply = require("../models/ColdReply");
const ColdEvent = require("../models/ColdEvent");
const ColdContact = require("../models/ColdContact");
const ColdCampaign = require("../models/ColdCampaign");
const ColdSuppressionList = require("../models/ColdSuppressionList");
const ColdSeenMessage = require("../models/ColdSeenMessage");
const { classifyReply } = require("./coldClassify");

const DAYS = 14;
const MAX_PER_RUN = 300;
const emailIn = (s) => (String(s || "").match(/[A-Z0-9._%+'-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [""])[0].toLowerCase();
const header = (headers, name) => (headers.find((h) => h.name?.toLowerCase() === name.toLowerCase()) || {}).value || "";

// ── providers: new messages as { id, threadId, from, to, subject, body, headers, receivedAt, internetMessageId } ──
const adapters = {
  async gmail(mailbox, seen) {
    const engine = require("./coldEmailEngine");
    const gmail = await engine.getGmailClient(mailbox);
    const ids = [];
    let pageToken;
    do {
      const list = await gmail.users.messages.list({ userId: "me", q: `newer_than:${DAYS}d -from:me -in:drafts`, maxResults: 100, includeSpamTrash: false, pageToken });
      (list.data.messages || []).forEach((m) => ids.push(m.id));
      pageToken = list.data.nextPageToken;
    } while (pageToken && ids.length < MAX_PER_RUN);
    const out = [];
    for (const id of ids.filter((x) => !seen.has(x))) {
      const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
      const headers = msg.data.payload?.headers || [];
      out.push({
        id,
        threadId: msg.data.threadId,
        from: header(headers, "From"),
        to: header(headers, "To"),
        subject: header(headers, "Subject"),
        body: (engine.extractGmailBody(msg.data.payload) || msg.data.snippet || "").slice(0, 8000),
        headers,
        internetMessageId: header(headers, "Message-ID"),
        receivedAt: new Date(msg.data.internalDate ? Number(msg.data.internalDate) : Date.now()),
      });
    }
    return out;
  },

  async outlook(mailbox, seen) {
    const engine = require("./coldEmailEngine");
    const token = await engine.getMsAccessToken(mailbox);
    const GRAPH = process.env.MS_GRAPH_URL || "https://graph.microsoft.com";
    const auth = { Authorization: `Bearer ${token}` };
    const since = new Date(Date.now() - DAYS * 864e5).toISOString();
    let url = `${GRAPH}/v1.0/me/messages?$filter=${encodeURIComponent(`receivedDateTime ge ${since} and isDraft eq false`)}&$orderby=receivedDateTime desc&$top=50&$select=id,conversationId,from,subject,receivedDateTime`;
    const rows = [];
    while (url && rows.length < MAX_PER_RUN) {
      const res = await fetch(url, { headers: auth, signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`Microsoft mailbox read failed (HTTP ${res.status})`);
      const data = await res.json();
      rows.push(...(data.value || []));
      url = data["@odata.nextLink"];
    }
    const mine = mailbox.email.toLowerCase();
    const out = [];
    for (const r of rows) {
      if (seen.has(r.id)) continue;
      // Our own sent emails are in /me/messages too.
      if ((r.from?.emailAddress?.address || "").toLowerCase() === mine) { await markSeen(mailbox, r.id); continue; }
      const res = await fetch(`${GRAPH}/v1.0/me/messages/${r.id}?$select=id,conversationId,from,toRecipients,subject,receivedDateTime,uniqueBody,body,internetMessageHeaders,internetMessageId`, { headers: { ...auth, Prefer: 'outlook.body-content-type="text"' }, signal: AbortSignal.timeout(30000) });
      if (!res.ok) continue;
      const m = await res.json();
      out.push({
        id: m.id,
        threadId: m.conversationId,
        from: m.from?.emailAddress ? `${m.from.emailAddress.name || ""} <${m.from.emailAddress.address}>` : "",
        to: (m.toRecipients || []).map((t) => t.emailAddress?.address).join(", "),
        subject: m.subject || "",
        body: (m.uniqueBody?.content || m.body?.content || "").slice(0, 8000),
        headers: m.internetMessageHeaders || [],
        internetMessageId: m.internetMessageId || "",
        receivedAt: new Date(m.receivedDateTime || Date.now()),
      });
    }
    return out;
  },
};

async function markSeen(mailbox, id) {
  await ColdSeenMessage.updateOne({ mailboxId: mailbox._id, messageId: id }, { $setOnInsert: { at: new Date() } }, { upsert: true }).catch(() => {});
}

// ── what kind of message is it? ──────────────────────────────────────────────────────────────────
function bounceInfo(msg) {
  const from = msg.from.toLowerCase();
  const subj = msg.subject.toLowerCase();
  const looks = /mailer-daemon|postmaster|microsoftexchange|mail delivery (sub)?system/.test(from)
    || /undeliver|delivery status notification|failure notice|returned mail|delivery has failed|couldn'?t be delivered|mail delivery failed|message not delivered|delivery failure/.test(subj);
  if (!looks) return null;
  const text = `${msg.subject}\n${msg.body}`;
  const failed = header(msg.headers, "X-Failed-Recipients") || (text.match(/Final-Recipient:\s*rfc822;\s*([^\s]+)/i) || [])[1] || "";
  const soft = /\b4\.\d\.\d+\b|mailbox (is )?full|over quota|quota exceeded|temporar|try again later|deferred/i.test(text);
  const hard = /\b5\.\d\.\d+\b|does(n't| not) exist|user unknown|no such user|address not found|not found|invalid recipient|recipient rejected|mailbox unavailable|couldn'?t be found|wasn'?t found|unknown user|address rejected|blocked/i.test(text);
  const code = (text.match(/\b[45]\.\d\.\d+\b/) || [""])[0];
  const reason = (text.match(/(\b5\.\d\.\d+\b[^\n]{0,140})|(\b4\.\d\.\d+\b[^\n]{0,140})/) || [code || msg.subject])[0].trim().slice(0, 200);
  return { type: soft && !hard ? "soft" : "hard", failed: emailIn(failed), reason, text };
}

function isAutoReply(msg) {
  const auto = header(msg.headers, "Auto-Submitted");
  if (auto && auto.toLowerCase() !== "no") return true;
  if (header(msg.headers, "X-Autoreply") || header(msg.headers, "X-Autorespond") || /auto_reply|auto-reply/i.test(header(msg.headers, "Precedence"))) return true;
  return /^(automatic reply|auto(-|\s)?reply|autoreply|out of (the )?office|ooo\b|away from|on leave|on holiday|absence)/i.test(msg.subject.trim());
}

// ── effects ─────────────────────────────────────────────────────────────────────────────────────
async function stopSequence(send, why) {
  await ColdSend.updateMany({ campaignId: send.campaignId, contactId: send.contactId, status: "pending" }, { status: "skipped", error: why });
}

async function handleBounce(mailbox, msg, b) {
  // Which of our emails bounced: the address named in the notice, else any recent recipient mentioned.
  const recent = await ColdSend.find({ mailboxId: mailbox._id, status: { $in: ["sent", "replied"] }, sentAt: { $gte: new Date(Date.now() - 30 * 864e5) } }).sort({ sentAt: -1 }).select("contactEmail").lean();
  const lower = b.text.toLowerCase();
  const email = b.failed || (recent.find((s) => lower.includes(s.contactEmail)) || {}).contactEmail;
  if (!email) return false;
  const send = await ColdSend.findOne({ mailboxId: mailbox._id, contactEmail: email, status: { $in: ["sent", "bounced"] } }).sort({ sentAt: -1 });
  if (!send) return false;
  if (b.type === "soft") {
    await ColdEvent.create({ type: "soft_bounce", sendId: send._id, campaignId: send.campaignId, contactId: send.contactId, mailboxId: mailbox._id, stepIndex: send.stepIndex, variant: send.variant, detail: b.reason, at: msg.receivedAt });
    await ColdSend.updateOne({ _id: send._id }, { bounceType: "soft", bounceReason: b.reason });
    return true;
  }
  if (send.status === "bounced") return true;
  await ColdSend.updateOne({ _id: send._id }, { status: "bounced", bouncedAt: msg.receivedAt, bounceType: "hard", bounceReason: b.reason });
  await stopSequence(send, "Bounced");
  await ColdSuppressionList.updateOne({ email }, { $setOnInsert: { email, reason: "bounced", campaignId: send.campaignId, addedAt: new Date() } }, { upsert: true });
  await ColdContact.updateOne({ _id: send.contactId }, { status: "suppressed", stage: "bounced", lastActivityAt: new Date() });
  await ColdCampaign.updateOne({ _id: send.campaignId }, { $inc: { "stats.bounced": 1 } });
  await ColdEvent.create({ type: "bounced", sendId: send._id, campaignId: send.campaignId, contactId: send.contactId, mailboxId: mailbox._id, stepIndex: send.stepIndex, variant: send.variant, detail: b.reason, at: msg.receivedAt });
  return true;
}

const STAGE = { interested: "interested", question: "replied", not_interested: "not_interested", unsubscribe: "unsubscribed", wrong_person: "replied", other: "replied" };

async function handleReply(mailbox, msg, send) {
  const auto = isAutoReply(msg);
  const category = auto ? "out_of_office" : await classifyReply(msg);
  const reply = await ColdReply.create({
    direction: "in", sendId: send._id, campaignId: send.campaignId, contactId: send.contactId, mailboxId: mailbox._id,
    providerMessageId: msg.id, internetMessageId: msg.internetMessageId, threadId: msg.threadId,
    from: msg.from, to: msg.to, subject: msg.subject, body: msg.body, category, autoReply: auto || category === "out_of_office", receivedAt: msg.receivedAt,
  }).catch((e) => (e.code === 11000 ? null : Promise.reject(e)));
  if (!reply) return;
  const base = { sendId: send._id, campaignId: send.campaignId, contactId: send.contactId, mailboxId: mailbox._id, stepIndex: send.stepIndex, variant: send.variant, at: msg.receivedAt };
  if (reply.autoReply) {
    // Out of office: keep the sequence going.
    await ColdEvent.create({ type: "auto_reply", ...base, detail: msg.subject.slice(0, 200) });
    return;
  }
  await ColdEvent.create({ type: "replied", ...base, detail: category });
  await stopSequence(send, "Contact replied");
  const firstReply = !(await ColdSend.exists({ campaignId: send.campaignId, contactId: send.contactId, status: "replied" }));
  if (send.status !== "replied") {
    await ColdSend.updateOne({ _id: send._id }, { status: "replied", repliedAt: msg.receivedAt, replyFrom: msg.from, replySubject: msg.subject, replyBody: msg.body.slice(0, 5000), replyCategory: category });
  }
  if (firstReply) await ColdCampaign.updateOne({ _id: send.campaignId }, { $inc: { "stats.replied": 1 } });
  await ColdContact.updateOne({ _id: send.contactId }, { stage: STAGE[category] || "replied", lastActivityAt: new Date() });
  if (category === "unsubscribe") {
    await ColdSuppressionList.updateOne({ email: send.contactEmail }, { $setOnInsert: { email: send.contactEmail, reason: "unsubscribed", campaignId: send.campaignId, addedAt: new Date() } }, { upsert: true });
    await ColdContact.updateOne({ _id: send.contactId }, { status: "suppressed" });
  }
}

/** Read one mailbox. Returns counts for the admin "check now" button. */
async function scanMailbox(mailbox) {
  const seenRows = await ColdSeenMessage.find({ mailboxId: mailbox._id }).select("messageId").lean();
  const seen = new Set(seenRows.map((r) => r.messageId));
  const adapter = adapters[mailbox.provider === "outlook" ? "outlook" : "gmail"];
  const messages = await adapter(mailbox, seen);
  const counts = { checked: messages.length, replies: 0, bounces: 0 };
  const mine = mailbox.email.toLowerCase();
  for (const msg of messages) {
    try {
      const fromEmail = emailIn(msg.from);
      if (fromEmail === mine) { await markSeen(mailbox, msg.id); continue; }
      const b = bounceInfo(msg);
      if (b) {
        if (await handleBounce(mailbox, msg, b)) counts.bounces++;
        await markSeen(mailbox, msg.id);
        continue;
      }
      // Which of our emails is this answering: same thread, else the latest email we sent this person.
      const send = (msg.threadId && await ColdSend.findOne({ mailboxId: mailbox._id, gmailThreadId: msg.threadId }).sort({ sentAt: -1 }))
        || (fromEmail && await ColdSend.findOne({ mailboxId: mailbox._id, contactEmail: fromEmail, sentAt: { $gte: new Date(Date.now() - 90 * 864e5) } }).sort({ sentAt: -1 }));
      if (send) {
        await handleReply(mailbox, msg, send);
        counts.replies++;
      }
      await markSeen(mailbox, msg.id);
    } catch (err) {
      console.error(`[cold email] reading ${mailbox.email}: ${err.message}`);
    }
  }
  return counts;
}

let running = false;
async function scanAllMailboxes() {
  if (running) return { skipped: true };
  running = true;
  const total = { checked: 0, replies: 0, bounces: 0, errors: [] };
  try {
    for (const mailbox of await ColdMailbox.find({ status: { $in: ["active", "paused"] } })) {
      try {
        const c = await scanMailbox(mailbox);
        total.checked += c.checked;
        total.replies += c.replies;
        total.bounces += c.bounces;
      } catch (err) {
        total.errors.push(`${mailbox.email}: ${err.message}`);
        console.error(`[cold email] can't read ${mailbox.email}:`, err.message);
      }
    }
  } finally {
    running = false;
  }
  return total;
}

module.exports = { scanAllMailboxes, scanMailbox, bounceInfo, isAutoReply, adapters };
