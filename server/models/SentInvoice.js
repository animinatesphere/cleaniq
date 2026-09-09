const mongoose = require("mongoose");

const sentInvoiceSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  data:  { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 365 }, // auto-delete after 1 year
});

module.exports = mongoose.model("SentInvoice", sentInvoiceSchema);
