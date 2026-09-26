const mongoose = require("mongoose");

// One thread per customer phone number per channel (WhatsApp for now).
const aiConversationSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true }, // E.164, e.g. +447700900123
    name: { type: String, default: "", trim: true }, // WhatsApp profile name if provided
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    channel: { type: String, enum: ["whatsapp"], default: "whatsapp" },
    // ai = AI replies automatically; human = staff took over; closed = archived
    status: { type: String, enum: ["ai", "human", "closed"], default: "ai" },
    lastCustomerMessageAt: { type: Date, default: null }, // drives the 24-hour WhatsApp window
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: "" },
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

aiConversationSchema.index({ phone: 1, channel: 1 }, { unique: true });
aiConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("AiConversation", aiConversationSchema);
