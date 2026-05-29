const mongoose = require('mongoose');

const customerMessageSchema = new mongoose.Schema({
  bookingId: { type: String, required: true },        // bookingId string (e.g. BK-1234)
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customerEmail: { type: String, required: true },    // fallback match if no customerId
  senderType: { type: String, enum: ['Customer', 'Admin'], required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

customerMessageSchema.index({ bookingId: 1, createdAt: 1 });
customerMessageSchema.index({ customerEmail: 1, createdAt: -1 });

module.exports = mongoose.model('CustomerMessage', customerMessageSchema);
