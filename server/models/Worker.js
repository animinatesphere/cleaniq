const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  region: { type: String, required: true, enum: ["UK", "NG"] },
  role: { type: String, default: "Cleaner" }, // Job position, e.g. Cleaner, Team Leader, Supervisor
  address: { type: String, default: "" },
  postcode: { type: String, default: "" },
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
    bankName: { type: String, default: "" },
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    sortCode: { type: String, default: "" },
  },

  // Wallet & Payments
  wallet: {
    totalEarned: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    onHold: { type: Number, default: 0 },
    withdrawn: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },

  status: {
    type: String,
    default: "Pending",
    enum: ["Active", "Pending", "Suspended"],
  },
  profileCompleted: { type: Boolean, default: false }, // must fill in address/bank details before using the app
  tempPassword: { type: String },
  appAccessGranted: { type: Boolean, default: false },
  rating: { type: Number, default: 5.0 },
  jobsCompleted: { type: Number, default: 0 },
  location: {
    lat: Number,
    lng: Number,
    lastUpdated: Date,
    sharing: { type: Boolean, default: false }, // true while the worker has location sharing switched on for an active job
    activeBookingId: { type: String, default: null }, // which job this location is being shared for
  },
  expoPushToken: { type: String, default: "" },
  // Every phone this person is logged in on (see utils/pushTokens.js).
  pushTokens: {
    type: [{ token: String, platform: { type: String, default: "" }, updatedAt: Date, _id: false }],
    default: [],
  },
  // Offer settings chosen in the app (services, working hours, travel area, pets, intro message).
  // See utils/offerMatching.js for the shape and defaults.
  preferences: { type: mongoose.Schema.Types.Mixed, default: undefined },
  lastLoginAt: { type: Date, default: null },   // last time they signed in to the worker app
  lastActiveAt: { type: Date, default: null },  // last time the app was used (logins last 30 days)
  loginCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  meta: mongoose.Schema.Types.Mixed,
});

workerSchema.index({ "pushTokens.token": 1 });
module.exports = mongoose.model("Worker", workerSchema);
