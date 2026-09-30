const mongoose = require("mongoose");

// Single document (key: "default") holding the AI receptionist's configuration.
// Kept out of SystemSetting so it can only be edited through admin-authenticated routes.
const aiSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    businessName: { type: String, default: "Cleaniq Services", trim: true },
    // The receptionist's first name, used in greetings ("you're speaking with Sophie").
    assistantName: { type: String, default: "Sophie", trim: true, maxlength: 30 },
    serviceArea: { type: String, default: "Manchester and Greater Manchester, UK", trim: true },
    // Extra instructions / personality written by staff. Added to the built-in safety rules.
    instructions: { type: String, default: "" },
    // UK number (E.164, e.g. +447700900123) that phone calls are transferred to.
    transferNumber: { type: String, default: "", trim: true },
    // Added to AI bookings when Cleaniq brings the cleaning supplies and equipment (per visit).
    suppliesFee: { type: Number, default: 10, min: 0 },
    // Emailed quotes follow the Quote Builder defaults: VAT 20% on unless switched off here.
    quoteIncludeVat: { type: Boolean, default: true },
    voiceEnabled: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

aiSettingsSchema.statics.get = async function () {
  return this.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

module.exports = mongoose.model("AiSettings", aiSettingsSchema);
