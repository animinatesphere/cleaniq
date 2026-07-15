const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  city: String,
  experience: String,
  hasTransport: Boolean,
  cvPath: String,
  idPath: String,
  rightToWorkPath: String,     // Right to Work share code document
  rightToWorkCode: String,     // The actual share code string (text)
  dbsCheckPath: String,        // DBS certificate
  additionalNotes: String,
  region: { type: String, default: 'UK' },
  source: { type: String, default: null }, // 'Website' | 'Manual' | null
  status: { type: String, default: 'Applied' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Applicant', applicantSchema);
