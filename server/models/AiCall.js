const mongoose = require("mongoose");

// One phone call handled by the AI receptionist. Text transcript only, never audio.
const aiCallSchema = new mongoose.Schema(
  {
    twilioCallSid: { type: String, required: true, unique: true },
    phone: { type: String, default: "", trim: true }, // caller, E.164
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    transferred: { type: Boolean, default: false },
    transcript: [
      {
        _id: false,
        role: { type: String, enum: ["customer", "ai"], required: true },
        text: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

aiCallSchema.index({ startedAt: -1 });

module.exports = mongoose.model("AiCall", aiCallSchema);
