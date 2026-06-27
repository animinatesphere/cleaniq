const mongoose = require("mongoose");

const EXPENSE_CATEGORIES = [
  "Supplies & Equipment",
  "Fuel & Transport",
  "Marketing",
  "Rent & Utilities",
  "Insurance",
  "Software & Subscriptions",
  "Wages & Bonuses",
  "Other",
];

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  category: { type: String, enum: EXPENSE_CATEGORIES, default: "Other" },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Bank Transfer", "Card", "Other"],
    default: "Bank Transfer",
  },
  notes: { type: String, default: "" },
  createdByAdmin: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

expenseSchema.index({ date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
