// Creator / influencer programme (admin → Commission).
//
//  - A creator is a customer account with role "creator" and a code, e.g. AMAKA. They share
//    cleaniqservices.com/?ref=AMAKA or the code itself (it works in the coupon box).
//  - The first time an email books or gets a quote with a code, that customer is linked to the
//    creator (CreatorCustomer). Their bookings are tagged to the creator by the admin's rule:
//    first booking only, bookings within N months, or every booking (incl. regular cleans).
//  - Commission: % of the booking before tax. "pending" until the clean is done and paid, then
//    "earned" (owed); "paid" once admin records the payout; "cancelled" if the booking is.
//  - Customers can get a discount with the code (admin sets the %, and first booking or all).
// Admin defaults live in SystemSetting "creatorProgram"; each creator can override them.
const mongoose = require("mongoose");
const SystemSetting = require("../models/SystemSetting");
const CreatorCustomer = require("../models/CreatorCustomer");

const Customer = () => mongoose.model("Customer");
const Booking = () => mongoose.model("Booking");

const DEFAULTS = {
  enabled: true,
  commissionPercent: 10,
  discountPercent: 0,
  discountAppliesTo: "first", // "first" booking only | "all" bookings
  countRule: "first",         // "first" | "months" | "forever"
  countMonths: 12,
  linkDays: 30,               // how long a ?ref= link is remembered in the browser
};
const COUNT_RULES = ["first", "months", "forever"];
const CODE_RE = /^[A-Z0-9]{3,20}$/;
const money = (n) => Math.round(Number(n || 0) * 100) / 100;
const clampPct = (n) => Math.min(100, Math.max(0, Number(n) || 0));

async function getSettings() {
  const row = await SystemSetting.findOne({ key: "creatorProgram" }).lean();
  return { ...DEFAULTS, ...(row?.value || {}) };
}

async function saveSettings(input = {}) {
  const current = await getSettings();
  const next = {
    enabled: input.enabled !== undefined ? Boolean(input.enabled) : current.enabled,
    commissionPercent: input.commissionPercent !== undefined ? clampPct(input.commissionPercent) : current.commissionPercent,
    discountPercent: input.discountPercent !== undefined ? clampPct(input.discountPercent) : current.discountPercent,
    discountAppliesTo: ["first", "all"].includes(input.discountAppliesTo) ? input.discountAppliesTo : current.discountAppliesTo,
    countRule: COUNT_RULES.includes(input.countRule) ? input.countRule : current.countRule,
    countMonths: input.countMonths !== undefined ? Math.min(120, Math.max(1, Math.round(Number(input.countMonths) || 12))) : current.countMonths,
    linkDays: input.linkDays !== undefined ? Math.min(365, Math.max(1, Math.round(Number(input.linkDays) || 30))) : current.linkDays,
  };
  await SystemSetting.updateOne({ key: "creatorProgram" }, { $set: { value: next } }, { upsert: true });
  return next;
}

// The rules that apply to one creator: their own values, else the programme defaults.
function effective(creatorDoc, settings) {
  const c = creatorDoc?.creator || {};
  const pick = (v, d) => (v === null || v === undefined || v === "" ? d : v);
  return {
    commissionPercent: pick(c.commissionPercent, settings.commissionPercent),
    discountPercent: pick(c.discountPercent, settings.discountPercent),
    discountAppliesTo: settings.discountAppliesTo,
    countRule: pick(c.countRule, settings.countRule),
    countMonths: pick(c.countMonths, settings.countMonths),
  };
}

const normaliseCode = (code) => String(code || "").trim().toUpperCase();

async function findCreatorByCode(code) {
  const c = normaliseCode(code);
  if (!CODE_RE.test(c)) return null;
  const creator = await Customer().findOne({ role: "creator", "creator.code": c, "creator.active": true });
  return creator || null;
}

const creatorName = (c) => [c.firstName, c.lastName].filter(Boolean).join(" ");

/**
 * What a code gives this customer right now: { valid, creator, discountPercent, message }.
 * Used by the coupon box, the quote form and quotes.
 */
async function checkCode(code, email = "") {
  const settings = await getSettings();
  if (!settings.enabled) return { valid: false };
  const creator = await findCreatorByCode(code);
  if (!creator) return { valid: false };
  const e = String(email || "").trim().toLowerCase();
  if (e && e === creator.email) return { valid: false, message: "You can't use your own creator code." };
  const rules = effective(creator, settings);
  let discountPercent = rules.discountPercent;
  if (discountPercent > 0 && rules.discountAppliesTo === "first" && e) {
    const before = await Booking().exists({ "customer.email": e, status: { $nin: ["Cancelled", "Rejected"] } });
    if (before) discountPercent = 0;
  }
  return {
    valid: true,
    creator,
    discountPercent,
    // The fan sees whose code it is.
    message: discountPercent > 0
      ? `Referral code from ${creator.firstName} applied — ${discountPercent}% off!`
      : `Referral code from ${creator.firstName} applied.`,
  };
}

// Link an email to a creator (the first creator code an email uses wins).
async function linkCustomer(email, creator) {
  const e = String(email || "").trim().toLowerCase();
  if (!e || !creator || e === creator.email) return null;
  try {
    return await CreatorCustomer.findOneAndUpdate(
      { email: e },
      { $setOnInsert: { email: e, creatorId: creator._id, code: creator.creator.code, linkedAt: new Date() } },
      { upsert: true, new: true },
    );
  } catch (err) {
    if (err.code === 11000) return CreatorCustomer.findOne({ email: e });
    throw err;
  }
}

/**
 * Tags a booking to the creator who brought this customer in, if the admin's rule allows it.
 * `code`: the creator code used for this booking (links the customer first). Sets the fields on
 * the document; the caller saves it (or the Booking pre-save hook does).
 */
async function attributeBooking(booking, { code } = {}) {
  if (booking.creator?.id || booking.isShift) return false;
  const email = String(booking.customer?.email || "").trim().toLowerCase();
  if (!email) return false;
  const settings = await getSettings();
  if (!settings.enabled) return false;

  let link = null;
  if (code) {
    const creator = await findCreatorByCode(code);
    if (creator) link = await linkCustomer(email, creator);
  }
  if (!link) link = await CreatorCustomer.findOne({ email }).lean();
  if (!link) return false;

  const creator = await Customer().findOne({ _id: link.creatorId, role: "creator", "creator.active": true });
  if (!creator) return false;
  const rules = effective(creator, settings);
  if (rules.countRule === "first") {
    const already = await Booking().exists({ "creator.id": creator._id, "customer.email": email, _id: { $ne: booking._id } });
    if (already) return false;
  } else if (rules.countRule === "months") {
    const until = new Date(link.linkedAt);
    until.setMonth(until.getMonth() + Number(rules.countMonths || 12));
    if (new Date() > until) return false;
  }

  booking.creator = { id: creator._id, code: creator.creator.code, name: creatorName(creator) };
  booking.creatorCommission = { percent: rules.commissionPercent, amount: 0, status: "pending" };
  return true;
}

// Tags an already-saved booking (coupon box after checkout, accepted quotes).
async function attributeSavedBooking(bookingId, { code } = {}) {
  const booking = await Booking().findById(bookingId);
  if (!booking || booking.creator?.id) return false;
  const tagged = await attributeBooking(booking, { code });
  if (tagged) await booking.save(); // post-save settles the commission if it's already done & paid
  return tagged;
}

/** Keeps the commission in step with the booking (called after every booking save/update). */
async function settleCommission(doc) {
  if (!doc?.creator?.id) return;
  const c = doc.creatorCommission || {};
  if (c.status === "paid") return;
  const pay = doc.payment || {};
  const cancelled = ["Cancelled", "Rejected"].includes(doc.status) || ["Refunded"].includes(pay.status);
  const done = doc.status === "Completed" && ["Completed", "Paid"].includes(pay.status);
  let update = null;
  if (cancelled) {
    if (c.status !== "cancelled") update = { "creatorCommission.status": "cancelled", "creatorCommission.amount": 0 };
  } else if (done) {
    // Before tax, and not on a regular clean's one-off set-up fee.
    const base = Math.max(0, Number(pay.amount || 0) - Number(pay.taxAmount || 0) - Number(doc.meta?.setupFee || 0));
    const amount = money((base * Number(c.percent || 0)) / 100);
    if (c.status !== "earned" || money(c.amount) !== amount) {
      update = { "creatorCommission.status": "earned", "creatorCommission.amount": amount, "creatorCommission.earnedAt": c.earnedAt || new Date() };
    }
  } else if (c.status !== "pending") {
    update = { "creatorCommission.status": "pending", "creatorCommission.amount": 0 };
  }
  if (update) await Booking().updateOne({ _id: doc._id }, { $set: update });
}

// Safety net: settle anything a hook missed (bulk updates). Runs every 6 hours.
async function settleAll() {
  const open = await Booking().find({ "creator.id": { $ne: null }, "creatorCommission.status": { $in: ["pending", "earned"] } })
    .select("status payment creator creatorCommission meta.setupFee").lean();
  for (const b of open) await settleCommission(b).catch(() => {});
  return open.length;
}
function startCreatorScheduler() {
  setInterval(() => settleAll().catch((e) => console.error("[creators] settle:", e.message)), 6 * 3600 * 1000);
}

// Passwords admin sets for creators are kept encrypted (AES-256-GCM, key from the server
// secret) so admin can show them again. Never the creator's own password.
const crypto = require("crypto");
const pwKey = () => crypto.createHash("sha256").update(`creator-pw:${process.env.CREATOR_PASSWORD_KEY || process.env.JWT_SECRET || ""}`).digest();
function sealPassword(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", pwKey(), iv);
  const data = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(":");
}
function openPassword(sealed) {
  try {
    const [iv, tag, data] = String(sealed || "").split(":").map((x) => Buffer.from(x, "base64"));
    const d = crypto.createDecipheriv("aes-256-gcm", pwKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Numbers for a creator's dashboard / the admin list. */
async function statsFor(creatorId) {
  const id = new mongoose.Types.ObjectId(String(creatorId));
  const [rows, customers] = await Promise.all([
    Booking().aggregate([
      { $match: { "creator.id": id } },
      { $group: { _id: "$creatorCommission.status", count: { $sum: 1 }, amount: { $sum: "$creatorCommission.amount" }, sales: { $sum: "$payment.amount" } } },
    ]),
    CreatorCustomer.countDocuments({ creatorId: id }),
  ]);
  const by = Object.fromEntries(rows.map((r) => [r._id || "pending", r]));
  const n = (k, f) => money(by[k]?.[f] || 0);
  return {
    customers,
    bookings: rows.filter((r) => r._id !== "cancelled").reduce((s, r) => s + r.count, 0),
    pendingBookings: by.pending?.count || 0,
    earned: n("earned", "amount"),   // owed, not paid yet
    paid: n("paid", "amount"),
    sales: money((by.earned?.sales || 0) + (by.paid?.sales || 0)),
  };
}

module.exports = {
  DEFAULTS, COUNT_RULES, CODE_RE,
  getSettings, saveSettings, effective, normaliseCode, findCreatorByCode, checkCode, linkCustomer,
  sealPassword, openPassword,
  attributeBooking, attributeSavedBooking, settleCommission, settleAll, startCreatorScheduler, statsFor, creatorName,
};
