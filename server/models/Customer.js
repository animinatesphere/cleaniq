const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  phone:     { type: String, default: '' },
  passwordHash:   { type: String, required: true },
  expoPushToken:  { type: String, default: "" },
  lastLoginAt:    { type: Date, default: null },
  lastLogoutAt:   { type: Date, default: null },
  loginCount:     { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
