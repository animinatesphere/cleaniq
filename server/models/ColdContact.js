const mongoose = require("mongoose");

const coldContactSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  company: { type: String, default: "" },
  extraFields: { type: Map, of: String, default: {} },
  status: {
    type: String,
    enum: ["active", "suppressed"],
    default: "active",
  },
  importBatch: { type: String },       // label / filename of the import
  importedAt: { type: Date, default: () => new Date() },
});

coldContactSchema.index({ status: 1 });

module.exports = mongoose.model("ColdContact", coldContactSchema);
