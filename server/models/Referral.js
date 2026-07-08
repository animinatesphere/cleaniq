const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerName: String,
  referrerEmail: String,
  referrerCustomerId: String,
  refereeName: String,
  refereeEmail: String,
  refereePhone: String,
  status: { type: String, enum: ['pending', 'booked', 'completed', 'rewarded'], default: 'pending' },
  bookingId: String,
  bookingRef: String,
  rewardAmount: { type: Number, default: 20 },
  rewardPaid: { type: Boolean, default: false },
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Referral', referralSchema);
