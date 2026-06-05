const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  region: { type: String, required: true, enum: ['UK', 'NG'] },
  // Availability
  availability: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      monday: { available: true, slots: ["09:00 - 13:00", "13:00 - 17:00"] },
      tuesday: { available: true, slots: ["09:00 - 13:00", "13:00 - 17:00"] },
      wednesday: { available: true, slots: ["09:00 - 13:00", "13:00 - 17:00"] },
      thursday: { available: true, slots: ["09:00 - 13:00", "13:00 - 17:00"] },
      friday: { available: true, slots: ["09:00 - 13:00", "13:00 - 17:00"] },
      saturday: { available: false, slots: [] },
      sunday: { available: false, slots: [] },
    },
  },
  
  // Bank Details
  bankDetails: {
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    sortCode: { type: String, default: '' },
  },
  status: { type: String, default: 'Pending', enum: ['Active', 'Pending', 'Suspended'] },
  tempPassword: { type: String },
  appAccessGranted: { type: Boolean, default: false },
  rating: { type: Number, default: 5.0 },
  jobsCompleted: { type: Number, default: 0 },
  location: {
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  createdAt: { type: Date, default: Date.now },
  meta: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Worker', workerSchema);
