const mongoose = require("mongoose");

const trashSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    enum: [
      "Booking",
      "Lead",
      "Customer",
      "Worker",
      "Quote",
      "BlogPost",
      "Service",
    ],
  },
  originalId: { type: String, required: true },
  label: { type: String, default: "" }, // human-readable summary shown in the Bin
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // full original document, for restore
  deletedAt: { type: Date, default: Date.now },
});

// Auto-purge anything sitting in the bin for more than 30 days.
trashSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("Trash", trashSchema);
