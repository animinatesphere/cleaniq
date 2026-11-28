// Cold email "Sending protection" (like Apollo's):
//  - who gets emailed: skip risky (shared/role) addresses, don't start a second campaign on someone
//    who was emailed recently, and space out first emails to the same company
//  - sending safeguards: pause a mailbox or campaign whose bounce rate goes over the limit, and stop
//    using a mailbox whose sign-in has broken (it shows "Reconnect needed" in the admin)
// Every action is logged as a ColdEvent of type "protected" (detail = which rule) for the summary.
const ColdSettings = require("../models/ColdSettings");
const ColdSend = require("../models/ColdSend");
const ColdEvent = require("../models/ColdEvent");
const ColdMailbox = require("../models/ColdMailbox");
const ColdCampaign = require("../models/ColdCampaign");
const { FREE_DOMAINS } = require("./deliverability");

const DEFAULTS = { autoPause: true, maxBounceRate: 3, minSendsBeforePause: 20, skipRisky: false, oneCampaignAtATime: true, oneCampaignDays: 30, companySpacingHours: 24 };
const SENT = ["sent", "replied", "bounced"];

let cache = null;
let cachedAt = 0;
async function getSettings() {
  if (cache && Date.now() - cachedAt < 60e3) return cache;
  const doc = await ColdSettings.findOne({ key: "main" }).lean();
  cache = { ...DEFAULTS, ...(doc || {}) };
  cachedAt = Date.now();
  return cache;
}

async function saveSettings(body = {}) {
  const num = (v, min, max) => Math.max(min, Math.min(max, Number(v)));
  const upd = { updatedAt: new Date() };
  for (const k of ["autoPause", "skipRisky", "oneCampaignAtATime"]) if (typeof body[k] === "boolean") upd[k] = body[k];
  if (body.maxBounceRate !== undefined && !Number.isNaN(Number(body.maxBounceRate))) upd.maxBounceRate = num(body.maxBounceRate, 0.5, 50);
  if (body.minSendsBeforePause !== undefined && !Number.isNaN(Number(body.minSendsBeforePause))) upd.minSendsBeforePause = Math.round(num(body.minSendsBeforePause, 5, 1000));
  if (body.oneCampaignDays !== undefined && !Number.isNaN(Number(body.oneCampaignDays))) upd.oneCampaignDays = Math.round(num(body.oneCampaignDays, 1, 365));
  if (body.companySpacingHours !== undefined && !Number.isNaN(Number(body.companySpacingHours))) upd.companySpacingHours = Math.round(num(body.companySpacingHours, 0, 24 * 14));
  await ColdSettings.updateOne({ key: "main" }, { $set: upd, $setOnInsert: { key: "main" } }, { upsert: true });
  cache = null;
  return getSettings();
}

const domainOf = (contact) => String(contact.domain || String(contact.email || "").split("@")[1] || "").toLowerCase().trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function log(detail, send, extra = {}) {
  await ColdEvent.create({ type: "protected", detail, sendId: send?._id, campaignId: send?.campaignId, contactId: send?.contactId, stepIndex: send?.stepIndex, ...extra }).catch(() => {});
}

/**
 * Before an email goes out. Returns null (go ahead), { skip: reason } or { later: Date, reason }.
 * Only first emails are held back by the "other campaign" and "same company" rules; follow-ups in a
 * sequence that has started carry on.
 */
async function checkBeforeSend(contact, send) {
  const s = await getSettings();
  if (s.skipRisky && contact.verification?.status === "risky") {
    await log("risky", send);
    return { skip: "Protection: shared/role address (e.g. info@) skipped" };
  }
  if (send.stepIndex > 0) return null;

  if (s.oneCampaignAtATime) {
    const other = await ColdSend.findOne({
      contactEmail: send.contactEmail,
      campaignId: { $ne: send.campaignId },
      status: { $in: SENT },
      sentAt: { $gte: new Date(Date.now() - s.oneCampaignDays * 864e5) },
    }).sort({ sentAt: -1 }).lean();
    if (other) {
      const c = await ColdCampaign.findById(other.campaignId).select("name").lean();
      await log("other_campaign", send);
      return { skip: `Protection: already emailed by another campaign${c ? ` ("${c.name}")` : ""} in the last ${s.oneCampaignDays} days` };
    }
  }

  const domain = domainOf(contact);
  if (s.companySpacingHours > 0 && domain && !FREE_DOMAINS.has(domain)) {
    const since = new Date(Date.now() - s.companySpacingHours * 3600e3);
    const recent = await ColdSend.findOne({
      sentAt: { $gte: since },
      status: { $in: SENT },
      contactEmail: { $regex: `@${escapeRe(domain)}$`, $ne: send.contactEmail },
    }).sort({ sentAt: -1 }).lean();
    if (recent) {
      const later = new Date(recent.sentAt.getTime() + s.companySpacingHours * 3600e3 + Math.floor(Math.random() * 90) * 60e3);
      await log("company_spacing", send);
      return { later, reason: `Protection: someone else at ${domain} was emailed recently — waits until ${later.toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit" })}` };
    }
  }
  return null;
}

async function bounceStats(match) {
  const [r] = await ColdSend.aggregate([
    { $match: { ...match, sentAt: { $gte: new Date(Date.now() - 30 * 864e5) }, status: { $in: SENT } } },
    { $group: { _id: null, sent: { $sum: 1 }, bounced: { $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] } } } },
  ]);
  const sent = r?.sent || 0;
  const bounced = r?.bounced || 0;
  return { sent, bounced, rate: sent ? Math.round((bounced / sent) * 1000) / 10 : 0 };
}

/** After a hard bounce: pause the mailbox and/or campaign if its bounce rate is over the limit. */
async function afterBounce(mailboxId, campaignId) {
  const s = await getSettings();
  if (!s.autoPause) return {};
  const out = {};
  const check = async (Model, id, field, what) => {
    if (!id) return;
    const st = await bounceStats({ [field]: id });
    if (st.sent < s.minSendsBeforePause || st.rate <= s.maxBounceRate) return;
    const reason = `Paused automatically: ${st.rate}% of emails bounced in the last 30 days (limit ${s.maxBounceRate}%). Check the bounce log, remove bad addresses, then resume.`;
    const res = await Model.updateOne({ _id: id, status: "active" }, { status: "paused", pausedReason: reason, autoPausedAt: new Date() });
    if (res.modifiedCount) {
      out[what] = reason;
      await log("auto_pause", null, { [field]: id, url: what });
      console.warn(`[cold email] ${what} ${id} ${reason}`);
    }
  };
  await check(ColdMailbox, mailboxId, "mailboxId", "mailbox");
  await check(ColdCampaign, campaignId, "campaignId", "campaign");
  return out;
}

// Google / Microsoft / SMTP saying the saved sign-in no longer works.
const SIGN_IN_ERROR = /invalid_grant|unauthorized_client|invalid_client|Invalid Credentials|InvalidAuthenticationToken|AADSTS\d+|reconnect this mailbox|Token has been expired or revoked|\b535\b|AUTHENTICATIONFAILED|Invalid login|authentication failed|Username and Password not accepted|EAUTH/i;
const isSignInError = (msg = "") => SIGN_IN_ERROR.test(String(msg));

function friendlySignIn(msg = "") {
  const m = String(msg);
  if (/AADSTS50076|AADSTS50079|multi-factor/i.test(m)) return "Microsoft now asks for two-step sign-in. Click Reconnect and sign in again (approve the code).";
  if (/AADSTS65001|consent/i.test(m)) return "Your Microsoft 365 admin needs to approve the app. Click Reconnect and ask the admin to approve.";
  if (/unauthorized_client|invalid_client/i.test(m)) return "This mailbox was connected with different Google keys than the server has now. Click Reconnect.";
  if (/invalid_grant|expired or revoked/i.test(m)) return "The sign-in expired or was removed (password changed, or access removed in the Google/Microsoft account). Click Reconnect.";
  if (/\b535\b|AUTHENTICATIONFAILED|Invalid login|authentication failed|Username and Password not accepted|EAUTH/i.test(m)) return "The email password was refused (changed, or the provider needs an app password). Update the password.";
  return "The sign-in for this mailbox stopped working. Click Reconnect.";
}

/** Marks a mailbox as needing reconnection (so nothing tries to use it until it's fixed). */
async function markSignInBroken(mailboxId, message) {
  if (!mailboxId) return;
  await ColdMailbox.updateOne({ _id: mailboxId }, { status: "error", errorMessage: `${friendlySignIn(message)} (${String(message).slice(0, 200)})` });
}

async function summary(days = 30) {
  const rows = await ColdEvent.aggregate([
    { $match: { type: "protected", at: { $gte: new Date(Date.now() - days * 864e5) } } },
    { $group: { _id: "$detail", n: { $sum: 1 } } },
  ]);
  const by = Object.fromEntries(rows.map((r) => [r._id, r.n]));
  return {
    riskyHeld: by.risky || 0,
    otherCampaign: by.other_campaign || 0,
    spacedOut: by.company_spacing || 0,
    invalidSkipped: by.invalid || 0,
    autoPaused: by.auto_pause || 0,
  };
}

module.exports = { getSettings, saveSettings, checkBeforeSend, afterBounce, bounceStats, isSignInError, friendlySignIn, markSignInBroken, summary, log, DEFAULTS };
