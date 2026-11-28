// Cold email open and click tracking.
//  - Opens: a 1×1 invisible image at /api/cold-email/t/o/<token>.gif in the HTML part.
//  - Clicks: links in the HTML part go to /api/cold-email/t/c/<token>?u=<link>&s=<signature> first,
//    which records the click and sends the reader on. The signature stops the address being used to
//    send people anywhere else.
// Security scanners (Microsoft Defender, Mimecast, Proofpoint…) often open emails and follow links
// seconds after delivery. Those are recorded as "bot" and not counted as real opens or clicks.
const crypto = require("crypto");
const ColdSend = require("../models/ColdSend");
const ColdEvent = require("../models/ColdEvent");
const ColdContact = require("../models/ColdContact");

const BASE = () => (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");
const SECRET = () => `${process.env.JWT_SECRET || "cleaniq_jwt_secret"}:cold-tracking`;
const BOT_UA = /bot|crawl|spider|preview|scan|proofpoint|mimecast|barracuda|safelinks|microsoft office|outlook-ios-linkpreview|google-?read-?aloud|facebookexternalhit|slurp|python|curl|wget|go-http|java\//i;
const BOT_WINDOW_MS = 60 * 1000;

const newToken = () => crypto.randomBytes(12).toString("base64url");
const sign = (token, url) => crypto.createHmac("sha256", SECRET()).update(`${token}|${url}`).digest("base64url").slice(0, 22);

/** Add the open pixel and/or tracked links to an email's HTML. */
function addTracking(html, token, { opens = true, clicks = true } = {}) {
  let out = String(html || "");
  if (clicks) {
    out = out.replace(/href=(["'])(https?:\/\/[^"']+)\1/gi, (m, q, url) => {
      // The unsubscribe link must keep working directly (and is not a "click").
      if (/\/cold-email\/unsubscribe\//.test(url)) return m;
      const decoded = url.replace(/&amp;/g, "&");
      return `href=${q}${BASE()}/api/cold-email/t/c/${token}?u=${encodeURIComponent(decoded)}&amp;s=${sign(token, decoded)}${q}`;
    });
  }
  if (opens) {
    const pixel = `<img src="${BASE()}/api/cold-email/t/o/${token}.gif" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0" />`;
    out = /<\/body>/i.test(out) ? out.replace(/<\/body>/i, `${pixel}</body>`) : `${out}${pixel}`;
  }
  return out;
}

const isBot = (send, req) => {
  const ua = String(req.headers["user-agent"] || "");
  const soon = send.sentAt && Date.now() - new Date(send.sentAt).getTime() < BOT_WINDOW_MS;
  return !!soon || BOT_UA.test(ua);
};

async function touchContact(send, stage) {
  const order = ["new", "contacted", "opened", "clicked", "replied", "interested", "meeting", "not_interested", "bounced", "unsubscribed"];
  const c = await ColdContact.findById(send.contactId).select("stage").lean();
  const upd = { lastActivityAt: new Date() };
  // Only move forward through new → contacted → opened → clicked (never undo a reply or bounce).
  if (c && order.indexOf(stage) > order.indexOf(c.stage || "new") && order.indexOf(c.stage || "new") < order.indexOf("replied")) upd.stage = stage;
  await ColdContact.updateOne({ _id: send.contactId }, upd);
}

async function recordOpen(token, req) {
  const send = await ColdSend.findOne({ trackToken: token });
  if (!send) return;
  const bot = isBot(send, req);
  await ColdEvent.create({ type: "opened", sendId: send._id, campaignId: send.campaignId, contactId: send.contactId, mailboxId: send.mailboxId, stepIndex: send.stepIndex, variant: send.variant, bot, detail: String(req.headers["user-agent"] || "").slice(0, 200) });
  if (bot) return;
  const now = new Date();
  await ColdSend.updateOne({ _id: send._id }, { $inc: { opens: 1 }, $set: { lastOpenedAt: now }, ...(send.firstOpenedAt ? {} : { $min: { firstOpenedAt: now } }) });
  await touchContact(send, "opened");
}

/** Returns where to send the reader, or null if the link isn't one of ours. */
async function recordClick(token, url, sig, req) {
  if (!url || !/^https?:\/\//i.test(url) || sign(token, url) !== sig) return null;
  const send = await ColdSend.findOne({ trackToken: token });
  if (!send) return url;
  const bot = isBot(send, req);
  await ColdEvent.create({ type: "clicked", sendId: send._id, campaignId: send.campaignId, contactId: send.contactId, mailboxId: send.mailboxId, stepIndex: send.stepIndex, variant: send.variant, bot, url: url.slice(0, 500), detail: String(req.headers["user-agent"] || "").slice(0, 200) });
  if (!bot) {
    const now = new Date();
    // A click means it was opened too (images may have been blocked).
    await ColdSend.updateOne({ _id: send._id }, {
      $inc: { clicks: 1 },
      ...(send.firstClickedAt ? {} : { $min: { firstClickedAt: now } }),
      ...(send.opens ? {} : { $set: { opens: 1, firstOpenedAt: now, lastOpenedAt: now } }),
    });
    await touchContact(send, "clicked");
  }
  return url;
}

// 1×1 transparent GIF.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

module.exports = { newToken, addTracking, recordOpen, recordClick, sign, PIXEL, touchContact };
