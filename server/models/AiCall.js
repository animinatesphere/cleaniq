const mongoose = require("mongoose");
const { toolEventSchema } = require("./AiMessage");

// One phone call handled by the AI receptionist. Text transcript only, never audio.
const aiCallSchema = new mongoose.Schema(
  {
    twilioCallSid: { type: String, required: true, unique: true },
    phone: { type: String, default: "", trim: true }, // caller, E.164
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    customerName: { type: String, default: "" },
    agentName: { type: String, default: "" }, // receptionist name used on this call
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    transferred: { type: Boolean, default: false },
    endReason: { type: String, default: "" }, // e.g. "caller hung up", "transferred", "ai error"
    transcript: [
      {
        _id: false,
        role: { type: String, enum: ["customer", "ai"], required: true },
        text: { type: String, required: true },
        at: { type: Date, default: Date.now },
        tools: { type: [toolEventSchema], default: undefined },
      },
    ],
  },
  { timestamps: true },
);

aiCallSchema.index({ startedAt: -1 });

module.exports = mongoose.model("AiCall", aiCallSchema);
