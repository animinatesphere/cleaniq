const mongoose = require("mongoose");

const quoteItemSchema = new mongoose.Schema(
  {
    service: String,
    customService: String,
    description: String, // cleaning details / scope of work shown to the customer
    billingType: { type: String, enum: ["flat", "hourly"], default: "flat" },
    qty: { type: Number, default: 1 }, // visits, or hours when billingType is "hourly"
    unitPrice: { type: Number, default: 0 }, // flat unit price, or hourly rate when billingType is "hourly"
    subtotal: { type: Number, default: 0 },
  },
  { _id: false },
);

const quoteSchema = new mongoose.Schema({
  quoteRef: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  contactName: String,
  email: { type: String, required: true, lowercase: true },
  phone: String,
  address: String,
  frequency: {
    type: String,
    enum: ["once", "weekly", "biweekly", "monthly", "quarterly", "yearly"],
    default: "once",
  },
  date: String,
  // First scheduled cleaning date/time — used to generate calendar bookings
  // automatically once the quote is accepted (recurring frequencies generate
  // a forward-looking series, not just a single booking).
  serviceDate: { type: String, default: null },
  serviceTimeSlot: { type: String, default: null },
  items: [quoteItemSchema],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  subtotalAfterDiscount: { type: Number, default: 0 },
  includeVat: { type: Boolean, default: true },
  vatRate: { type: Number, default: 20 },
  vat: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  validDays: { type: Number, default: 30 },
  paymentTerms: String,
  depositRequired: { type: Boolean, default: false },
  depositPercent: { type: Number, default: 0 },
  depositAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  notes: String,
  status: { type: String, default: "sent" }, // sent | accepted | declined
  acceptedAt: { type: Date, default: null },
  declinedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

quoteSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model("Quote", quoteSchema);
