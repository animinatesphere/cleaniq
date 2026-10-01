const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { type: String, enum: ["UK", "NG"], required: true },
  rate: { type: Number, required: true },
  // Optional hourly prices for regular cleans (admin → Services). Empty = use the normal rate.
  weeklyRate: { type: Number, default: null },
  fortnightlyRate: { type: Number, default: null },
  monthlyRate: { type: Number, default: null },
  quarterlyRate: { type: Number, default: null }, // every 3 months
  type: { type: String, enum: ["hourly", "flat"], required: true },
  category: {
    type: String,
    enum: ["Base", "Rooms", "Extras"],
    default: "Extras",
  },
  description: String,
  bullets: { type: [String], default: [] },
  // Worker payment rate - amount paid to worker per hour (hourly services)
  workerHourlyRate: {
    type: Number,
    default: 0,
    description: "Amount paid to worker per hour for hourly services",
  },
  // Worker payment rate - fixed amount paid to worker per service completion (flat services)
  workerPaymentRate: {
    type: Number,
    default: 0,
    description:
      "Fixed amount paid to worker per service completion for flat-rate services",
  },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Service", serviceSchema);
