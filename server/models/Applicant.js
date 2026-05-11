const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  city: String,
  experience: String,
  hasTransport: Boolean,
  cvPath: String, // Path to stored CV on VPS
  idPath: String, // Path to stored ID on VPS
  region: String,
  status: { type: String, default: 'Pending' }, // Pending, Reviewed, Interviewed, Hired, Rejected
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Applicant', applicantSchema);
