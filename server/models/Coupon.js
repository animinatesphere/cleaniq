const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ["general", "personal"], required: true },
  discountPercent: { type: Number, required: true, min: 1, max: 100 },
  maxUses: { type: Number, default: null }, // null = unlimited; personal always gets 1
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  note: { type: String, default: "" },
  usedBy: [{
    email: String,
    bookingId: String,
    usedAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Coupon", couponSchema);
