// Regular cleans (subscriptions): customers manage their own from the website account or app;
// admins manage all of them from /admin/subscriptions.
const express = require("express");
const router = express.Router();
const Subscription = require("../models/Subscription");
const adminAuth = require("../middleware/adminAuth");
const { verifyCustomer } = require("./customer-auth");
const {
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  nextVisitFor,
  visitsFor,
  cancellationQuote,
} = require("../utils/subscriptions");

const ACTIONS = { pause: pauseSubscription, resume: resumeSubscription, cancel: cancelSubscription };

async function withNextVisit(subs) {
  return Promise.all(
    subs.map(async (s) => {
      const o = s.toObject ? s.toObject() : s;
      delete o.template;
      delete o.stripeCustomerId;
      delete o.stripePaymentMethodId;
      // Every visit from now on (and the first clean), so admin and the customer can see what's
      // paid, what's charged 24 hours before, and when the next clean is.
      return { ...o, nextVisit: await nextVisitFor(s), visits: await visitsFor(s) };
    }),
  );
}

// ── Set-up fee (first clean of a regular clean) ────────────────────────────────────
router.get("/setup-fee", async (req, res) => {
  res.json(await require("../utils/subscriptions").getSetupFee());
});
router.put("/setup-fee", adminAuth, async (req, res) => {
  try {
    res.json(await require("../utils/subscriptions").saveSetupFee(req.body || {}));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Customer ───────────────────────────────────────────────────────────────────
const mine = (req) => ({ "customer.email": String(req.customer?.email || "").toLowerCase() });

router.get("/my", verifyCustomer, async (req, res) => {
  try {
    // Including ones waiting for their first payment (e.g. set up by our team with a payment link).
    const subs = await Subscription.find({ ...mine(req) }).sort({ createdAt: -1 });
    res.json(await withNextVisit(subs));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// What pausing/cancelling right now would cost (shown before the customer confirms).
router.get("/my/:id/cancellation-fee", verifyCustomer, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, ...mine(req) });
    if (!sub) return res.status(404).json({ message: "Regular clean not found" });
    const q = await cancellationQuote(sub);
    res.json({
      fee: q.fee, rule: q.rule || "", hoursUntilNextVisit: q.hoursUntilNextVisit ?? null, nextVisitStart: q.nextVisit?.start || null,
      // Next clean already paid (24h ahead): the fee is kept from its refund rather than charged.
      nextVisitPaid: Boolean(q.nextVisitPaid), refund: q.refund || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/my/:id/:action", verifyCustomer, async (req, res) => {
  const act = ACTIONS[req.params.action];
  if (!act) return res.status(404).json({ message: "Unknown action" });
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, ...mine(req) });
    if (!sub) return res.status(404).json({ message: "Regular clean not found" });
    const result = await act(sub, "customer", { chargeFee: true });
    res.json({ ...(await withNextVisit([result.sub]))[0], feeCharged: result.fee || null });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Admin ──────────────────────────────────────────────────────────────────────
router.get("/", adminAuth, async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const subs = await Subscription.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(await withNextVisit(subs));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/:action", adminAuth, async (req, res) => {
  const act = ACTIONS[req.params.action];
  if (!act) return res.status(404).json({ message: "Unknown action" });
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Regular clean not found" });
    const result = await act(sub, req.admin?.username || "admin");
    res.json((await withNextVisit([result.sub]))[0]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
