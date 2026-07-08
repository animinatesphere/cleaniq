const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  bookingId: String,
  bookingRef: String,
  customerId: String,
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  service: String,
  type: { type: String, enum: ['quality', 'punctuality', 'communication', 'damage', 'billing', 'other'] },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['open', 'investigating', 'resolved', 'closed'], default: 'open' },
  resolution: String,
  resolvedAt: Date,
  refundAmount: { type: Number, default: 0 },
  assignedTo: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Complaint', complaintSchema);
