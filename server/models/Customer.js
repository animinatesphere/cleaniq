const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  phone:     { type: String, default: '' },
  passwordHash:   { type: String, required: true },
  expoPushToken:  { type: String, default: "" },
  // Every phone this person is logged in on (see utils/pushTokens.js).
  pushTokens: {
    type: [{ token: String, platform: { type: String, default: "" }, updatedAt: Date, _id: false }],
    default: [],
  },
  lastLoginAt:    { type: Date, default: null },
  lastLogoutAt:   { type: Date, default: null },
  loginCount:     { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  crmEmailsEnabled: { type: Boolean, default: true },
  emailUnsubscribed: { type: Boolean, default: false },
  role:        { type: String, enum: ["customer", "company"], default: "customer" },
  companyName: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

customerSchema.index({ "pushTokens.token": 1 });
module.exports = mongoose.model('Customer', customerSchema);
