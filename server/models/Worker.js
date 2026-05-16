const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  region: { type: String, required: true, enum: ['UK', 'NG'] },
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
