const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CLQ-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

// GET /api/coupons — admin: list all coupons
router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});

// POST /api/coupons — admin: create coupon
router.post("/", async (req, res) => {
  try {
    const { type, code, discountPercent, maxUses, note } = req.body;
    if (!type || !discountPercent) return res.status(400).json({ error: "type and discountPercent are required" });

    let finalCode = type === "personal" ? generateCode() : (code || "").toUpperCase().trim();
    if (!finalCode) return res.status(400).json({ error: "Code is required for general coupons" });

    const coupon = new Coupon({
      code: finalCode,
      type,
      discountPercent: parseFloat(discountPercent),
      maxUses: type === "personal" ? 1 : (maxUses ? parseInt(maxUses) : null),
      note: note || "",
      isActive: true,
    });
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "This coupon code already exists" });
    res.status(500).json({ error: "Failed to create coupon" });
  }
});

// PUT /api/coupons/:id — admin: update coupon (e.g. toggle isActive)
router.put("/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: "Failed to update coupon" });
  }
});

// DELETE /api/coupons/:id — admin: delete coupon
router.delete("/:id", async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete coupon" });
  }
});

// POST /api/coupons/validate — public: check if a code is valid
router.post("/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: "No code provided" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) return res.status(404).json({ valid: false, message: "Invalid coupon code" });

    if (!coupon.isActive) return res.json({ valid: false, message: "This coupon is no longer active" });

    if (coupon.type === "personal" && coupon.usedCount >= 1) {
      return res.json({ valid: false, message: "This coupon has already been used" });
    }

    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return res.json({ valid: false, message: "This coupon has reached its usage limit" });
    }

    res.json({
      valid: true,
      discountPercent: coupon.discountPercent,
      type: coupon.type,
      message: `${coupon.discountPercent}% discount applied!`,
    });
  } catch (err) {
    res.status(500).json({ valid: false, message: "Error validating coupon" });
  }
});

// POST /api/coupons/apply — called when booking is confirmed to mark coupon as used
router.post("/apply", async (req, res) => {
  try {
    const { code, customerEmail, bookingId } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });

    coupon.usedCount += 1;
    coupon.usedBy.push({ email: customerEmail || "guest", bookingId: bookingId || "" });
    await coupon.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to apply coupon" });
  }
});

module.exports = router;
