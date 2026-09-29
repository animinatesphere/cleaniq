const mongoose = require("mongoose");

// What the AI did while producing a reply (quotes, bookings, …), shown on the Conversations page.
const toolEventSchema = new mongoose.Schema(
  { name: String, ok: Boolean, detail: String },
  { _id: false },
);

const aiMessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "AiConversation", required: true },
    role: { type: String, enum: ["customer", "ai", "staff"], required: true },
    text: { type: String, required: true },
    // Meta's message id. Unique so a webhook Meta re-sends is only processed once.
    whatsappMessageId: { type: String, default: undefined },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    deliveryStatus: { type: String, enum: ["", "sent", "failed"], default: "" },
    error: { type: String, default: "" },
    tools: { type: [toolEventSchema], default: undefined },
  },
  { timestamps: true },
);

aiMessageSchema.index({ conversation: 1, createdAt: -1 });
aiMessageSchema.index({ whatsappMessageId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("AiMessage", aiMessageSchema);
module.exports.toolEventSchema = toolEventSchema;
