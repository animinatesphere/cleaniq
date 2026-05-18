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
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    default: null
  },
  assignedWorkerName: { type: String, default: null },
  status: { type: String, default: 'Confirmed' },
  jobArrivedTime: { type: Date, default: null },
  jobStartTime: { type: Date, default: null },
  jobEndTime: { type: Date, default: null },
  jobDurationActual: { type: Number, default: 0 }, // in minutes
  createdAt: { type: Date, default: Date.now },
  meta: mongoose.Schema.Types.Mixed // Catch-all for future expansions
});

module.exports = mongoose.model('Booking', bookingSchema);
