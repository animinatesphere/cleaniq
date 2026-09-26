const mongoose = require("mongoose");

// Business information the AI receptionist is allowed to answer from
// (FAQs, policies, opening hours, areas covered). Prices come from Service, not here.
const knowledgeEntrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["FAQ", "Policy", "Hours", "Area", "Booking", "Other"],
      default: "FAQ",
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

knowledgeEntrySchema.index({ category: 1, title: 1 });

module.exports = mongoose.model("KnowledgeEntry", knowledgeEntrySchema);
