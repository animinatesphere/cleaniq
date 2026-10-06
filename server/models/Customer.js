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
  role:        { type: String, enum: ["customer", "company", "creator"], default: "customer" },
  companyName: { type: String, default: "" },
  // Creator / influencer accounts (admin → Commission). Empty values use the programme defaults.
  creator: {
    code:              { type: String, uppercase: true, trim: true },
    active:            { type: Boolean, default: true },
    commissionPercent: { type: Number, default: null }, // % of each counted booking (before tax)
    discountPercent:   { type: Number, default: null }, // % off for customers using the code
    countRule:         { type: String, enum: ["first", "months", "forever", null], default: null },
    countMonths:       { type: Number, default: null },
    clicks:            { type: Number, default: 0 },
    lastClickAt:       { type: Date, default: null },
    bank:              { accountName: String, sortCode: String, accountNumber: String },
    notes:             { type: String, default: "" },
  },
  createdAt: { type: Date, default: Date.now }
});

customerSchema.index({ "pushTokens.token": 1 });
customerSchema.index({ "creator.code": 1 }, { unique: true, partialFilterExpression: { "creator.code": { $type: "string" } } });
module.exports = mongoose.model('Customer', customerSchema);
