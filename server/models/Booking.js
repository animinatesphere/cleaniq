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
  details: {
    address: String,
    frequency: String,
    duration: Number,
    extras: [String],
    hasPets: Boolean,
    notes: String,
  },
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
});

module.exports = mongoose.model('Booking', bookingSchema);
