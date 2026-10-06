// Creator / influencer programme — see utils/creators.js.
//   Public:  GET  /api/creators/code/:code      is this a creator code? (name + discount)
//            POST /api/creators/click           someone opened a creator's link
//   Creator: GET  /api/creators/me              dashboard (code, link, rules, earnings, bookings)
//            PUT  /api/creators/me/bank         payout bank details
//   Admin:   /api/creators/admin/...            settings, creators, commissions, payouts
const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const router = express.Router();
const Customer = require("../models/Customer");
const Booking = require("../models/Booking");
const Coupon = require("../models/Coupon");
const adminAuth = require("../middleware/adminAuth");
const { verifyCustomer } = require("./customer-auth");
const creators = require("../utils/creators");
const { sendEmail } = require("../utils/emailService");

const SITE = () => process.env.FRONTEND_URL || "https://cleaniqservices.com";
const linkFor = (code) => `${SITE()}/?ref=${encodeURIComponent(code)}`;
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pctOrNull = (v) => (v === null || v === undefined || v === "" ? null : Math.min(100, Math.max(0, Number(v) || 0)));
const firstNameOnly = (b) => [b.customer?.firstName, b.customer?.lastName ? `${b.customer.lastName[0]}.` : ""].filter(Boolean).join(" ");

// ── Public ───────────────────────────────────────────────────────────────────────────────
router.get("/code/:code", async (req, res) => {
  try {
    const r = await creators.checkCode(req.params.code, req.query.email);
    if (!r.valid) return res.json({ valid: false, message: r.message || "Code not found" });
    res.json({ valid: true, code: r.creator.creator.code, name: r.creator.firstName, discountPercent: r.discountPercent, message: r.message });
  } catch (err) {
    res.status(500).json({ valid: false, message: "Couldn't check the code" });
  }
});

router.post("/click", async (req, res) => {
  try {
    const creator = await creators.findCreatorByCode(req.body?.code);
    if (creator) await Customer.updateOne({ _id: creator._id }, { $inc: { "creator.clicks": 1 }, $set: { "creator.lastClickAt": new Date() } });
    res.json({ ok: true, valid: Boolean(creator), linkDays: (await creators.getSettings()).linkDays });
  } catch {
    res.json({ ok: true });
  }
});

// The creator code a signed-in customer was referred with (filled in at checkout).
router.get("/my-referral", verifyCustomer, async (req, res) => {
  try {
    const link = await require("../models/CreatorCustomer").findOne({ email: String(req.customer?.email || "").toLowerCase() }).lean();
    if (!link) return res.json({ code: null });
    const creator = await Customer.findOne({ _id: link.creatorId, role: "creator", "creator.active": true }).lean();
    res.json({ code: creator?.creator?.code || null });
  } catch {
    res.json({ code: null });
  }
});

// ── Creator ──────────────────────────────────────────────────────────────────────────────
async function loadCreator(req, res, next) {
  const me = await Customer.findById(req.customer?.id).catch(() => null);
  if (!me || me.role !== "creator") return res.status(403).json({ message: "Creator account required" });
  req.creatorDoc = me;
  next();
}

router.get("/me", verifyCustomer, loadCreator, async (req, res) => {
  try {
    const me = req.creatorDoc;
    const settings = await creators.getSettings();
    const rules = creators.effective(me, settings);
    const recent = await Booking.find({ "creator.id": me._id })
      .sort({ createdAt: -1 }).limit(100)
      .select("bookingId service schedule.date status customer.firstName customer.lastName creatorCommission createdAt").lean();
    res.json({
      name: creators.creatorName(me),
      email: me.email,
      code: me.creator?.code,
      active: me.creator?.active !== false,
      link: linkFor(me.creator?.code || ""),
      clicks: me.creator?.clicks || 0,
      rules,
      bank: me.creator?.bank || {},
      stats: await creators.statsFor(me._id),
      // Customers' privacy: first name and initial only.
      bookings: recent.map((b) => ({
        bookingId: b.bookingId, service: b.service, date: b.schedule?.date, status: b.status,
        customer: firstNameOnly(b), commission: b.creatorCommission, createdAt: b.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/me/bank", verifyCustomer, loadCreator, async (req, res) => {
  const clean = (v, max) => String(v ?? "").trim().slice(0, max);
  const bank = {
    accountName: clean(req.body?.accountName, 80),
    sortCode: clean(req.body?.sortCode, 8).replace(/[^\d-]/g, ""),
    accountNumber: clean(req.body?.accountNumber, 12).replace(/\D/g, ""),
  };
  if (bank.sortCode && !/^\d{2}-?\d{2}-?\d{2}$/.test(bank.sortCode)) return res.status(400).json({ message: "Sort code should look like 12-34-56." });
  if (bank.accountNumber && !/^\d{8}$/.test(bank.accountNumber)) return res.status(400).json({ message: "Account number should be 8 digits." });
  await Customer.updateOne({ _id: req.creatorDoc._id }, { $set: { "creator.bank": bank } });
  res.json({ bank });
});

// ── Admin ────────────────────────────────────────────────────────────────────────────────
router.get("/admin/settings", adminAuth, async (req, res) => res.json(await creators.getSettings()));
router.put("/admin/settings", adminAuth, async (req, res) => {
  try {
    res.json(await creators.saveSettings(req.body || {}));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const adminView = async (c, settings) => ({
  _id: c._id,
  firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
  code: c.creator?.code, active: c.creator?.active !== false, link: linkFor(c.creator?.code || ""),
  commissionPercent: c.creator?.commissionPercent ?? null,
  discountPercent: c.creator?.discountPercent ?? null,
  countRule: c.creator?.countRule ?? null,
  countMonths: c.creator?.countMonths ?? null,
  notes: c.creator?.notes || "",
  bank: c.creator?.bank || {},
  clicks: c.creator?.clicks || 0,
  rules: creators.effective(c, settings),
  stats: await creators.statsFor(c._id),
  createdAt: c.createdAt,
});

router.get("/admin", adminAuth, async (req, res) => {
  try {
    const settings = await creators.getSettings();
    const list = await Customer.find({ role: "creator" }).sort({ createdAt: -1 }).lean();
    res.json(await Promise.all(list.map((c) => adminView(c, settings))));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function readOverrides(body = {}) {
  const out = {};
  if ("commissionPercent" in body) out["creator.commissionPercent"] = pctOrNull(body.commissionPercent);
  if ("discountPercent" in body) out["creator.discountPercent"] = pctOrNull(body.discountPercent);
  if ("countRule" in body) out["creator.countRule"] = creators.COUNT_RULES.includes(body.countRule) ? body.countRule : null;
  if ("countMonths" in body) out["creator.countMonths"] = body.countMonths === null || body.countMonths === "" ? null : Math.min(120, Math.max(1, Math.round(Number(body.countMonths) || 12)));
  if ("active" in body) out["creator.active"] = Boolean(body.active);
  if ("notes" in body) out["creator.notes"] = String(body.notes || "").slice(0, 1000);
  return out;
}

async function codeTaken(code, exceptId) {
  const [creator, coupon] = await Promise.all([
    Customer.exists({ "creator.code": code, ...(exceptId ? { _id: { $ne: exceptId } } : {}) }),
    Coupon.exists({ code }),
  ]);
  return Boolean(creator || coupon);
}

router.post("/admin", adminAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const firstName = String(b.firstName || "").trim();
    const lastName = String(b.lastName || "").trim();
    const email = String(b.email || "").trim().toLowerCase();
    const code = creators.normaliseCode(b.code);
    if (!firstName || !lastName) return res.status(400).json({ message: "First and last name are required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "A valid email is required." });
    if (!creators.CODE_RE.test(code)) return res.status(400).json({ message: "Code must be 3–20 letters or numbers, e.g. AMAKA10." });
    if (await Customer.exists({ email })) return res.status(400).json({ message: "That email already has an account. Use another email for the creator account." });
    if (await codeTaken(code)) return res.status(400).json({ message: `The code ${code} is already used (by a creator or a coupon).` });

    // A random password: the creator sets their own with "Forgot password".
    const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12);
    const creator = await Customer.create({
      firstName, lastName, email, phone: String(b.phone || "").trim(), passwordHash, role: "creator",
      creator: { code, active: true },
    });
    const overrides = readOverrides(b);
    if (Object.keys(overrides).length) await Customer.updateOne({ _id: creator._id }, { $set: overrides });

    const settings = await creators.getSettings();
    const fresh = await Customer.findById(creator._id).lean();
    const rules = creators.effective(fresh, settings);
    sendEmail({
      to: email,
      subject: "Welcome to the Cleaniq creator programme",
      html: `<div style="font-family:sans-serif;max-width:560px">
        <h2 style="color:#0F6B4C">Welcome, ${esc(firstName)}!</h2>
        <p>Your Cleaniq creator account is ready. Share your link or code — every booking that comes through you earns you <strong>${rules.commissionPercent}% commission</strong> once the clean is done and paid.</p>
        <p style="background:#f1f5f9;border-radius:12px;padding:14px 16px;font-size:15px">
          Your code: <strong style="font-size:18px">${esc(code)}</strong><br>
          Your link: <a href="${esc(linkFor(code))}">${esc(linkFor(code))}</a>
        </p>
        ${rules.discountPercent > 0 ? `<p>Your followers get <strong>${rules.discountPercent}% off</strong> with your code.</p>` : ""}
        <p><strong>To log in:</strong> open the Cleaniq app or <a href="${esc(SITE())}/account/login">${esc(SITE())}/account/login</a>, tap <em>Forgot password</em>, enter <strong>${esc(email)}</strong> and set your own password. You'll then see your clicks, bookings and earnings.</p>
        <p style="color:#64748b">Questions? Call or WhatsApp +44 7846 726428.</p></div>`,
    }).catch(() => {});
    res.status(201).json(await adminView(fresh, settings));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/admin/:id", adminAuth, async (req, res) => {
  try {
    const creator = await Customer.findOne({ _id: req.params.id, role: "creator" });
    if (!creator) return res.status(404).json({ message: "Creator not found" });
    const set = readOverrides(req.body);
    for (const k of ["firstName", "lastName", "phone"]) if (k in (req.body || {})) set[k] = String(req.body[k] || "").trim();
    if ("code" in (req.body || {})) {
      const code = creators.normaliseCode(req.body.code);
      if (!creators.CODE_RE.test(code)) return res.status(400).json({ message: "Code must be 3–20 letters or numbers." });
      if (code !== creator.creator?.code && (await codeTaken(code, creator._id))) return res.status(400).json({ message: `The code ${code} is already used.` });
      set["creator.code"] = code;
    }
    await Customer.updateOne({ _id: creator._id }, { $set: set });
    res.json(await adminView(await Customer.findById(creator._id).lean(), await creators.getSettings()));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Bookings with a creator: filter by status (pending | earned | paid | cancelled) and creator.
router.get("/admin/commissions", adminAuth, async (req, res) => {
  try {
    const q = { "creator.id": { $ne: null } };
    if (req.query.status) q["creatorCommission.status"] = req.query.status;
    if (req.query.creatorId) q["creator.id"] = req.query.creatorId;
    const rows = await Booking.find(q).sort({ createdAt: -1 }).limit(500)
      .select("bookingId service schedule.date status payment.amount payment.status customer creator creatorCommission createdAt").lean();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record a payout: earned commissions → paid.
router.post("/admin/payouts", adminAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.bookingIds) ? req.body.bookingIds : [];
    if (!ids.length) return res.status(400).json({ message: "Choose the commissions to mark as paid." });
    const reference = String(req.body?.reference || "").trim().slice(0, 100);
    const r = await Booking.updateMany(
      { _id: { $in: ids }, "creatorCommission.status": "earned" },
      { $set: { "creatorCommission.status": "paid", "creatorCommission.paidAt": new Date(), "creatorCommission.payoutRef": reference } },
    );
    res.json({ paid: r.modifiedCount || 0 });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
