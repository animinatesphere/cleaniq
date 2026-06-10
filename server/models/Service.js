const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { type: String, enum: ["UK", "NG"], required: true },
  rate: { type: Number, required: true },
  type: { type: String, enum: ["hourly", "flat"], required: true },
  category: {
    type: String,
    enum: ["Base", "Rooms", "Extras"],
    default: "Extras",
  },
  description: String,
  bullets: { type: [String], default: [] },
  // Worker payment rate - amount paid to worker when this service is completed
  workerPaymentRate: {
    type: Number,
    default: 0,
    description: "Fixed amount paid to worker per service completion",
  },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Service", serviceSchema);
