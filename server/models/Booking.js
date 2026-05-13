const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customer: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
  },
  service: {
    type: String,
    required: true,
  },
  details: mongoose.Schema.Types.Mixed,
  property: mongoose.Schema.Types.Mixed,
  schedule: {
    date: Date,
    timeSlot: String,
    preferredTime: String,
  },
  payment: {
    amount: Number,
    currency: String,
    status: { type: String, default: 'Pending' },
    method: String,
  },
  region: String,
  status: { type: String, default: 'Confirmed' },
  createdAt: { type: Date, default: Date.now },
  meta: mongoose.Schema.Types.Mixed // Catch-all for future expansions
});

module.exports = mongoose.model('Booking', bookingSchema);
