const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["info", "success", "warning", "error", "job"],
    default: "info",
  },
  // Booking reference (e.g. BK-1234) so tapping a "New offer" notification opens that offer.
  bookingId: { type: String, default: "" },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
