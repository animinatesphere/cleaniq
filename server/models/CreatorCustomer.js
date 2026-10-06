const mongoose = require("mongoose");

// A customer a creator brought in: the first creator code an email used wins, and later bookings
// from that email count for the creator by the admin's rule (utils/creators.js).
const creatorCustomerSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  code:      { type: String, default: "" },
  linkedAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model("CreatorCustomer", creatorCustomerSchema);
