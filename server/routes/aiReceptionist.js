// Admin API for the AI Receptionist dashboard. Every route requires an admin login.
const express = require("express");
const { agentNames } = require("../utils/aiBrain");
const router = express.Router();
// Any change here (prices, AI settings, knowledge, tax) shows in the AI receptionist's next reply.
router.use((req, res, next) => {
  if (req.method !== "GET") res.on("finish", () => require("../utils/aiBrain").clearInstructionsCache());
  next();
});
const adminAuth = require("../middleware/adminAuth");
const AiSettings = require("../models/AiSettings");
const KnowledgeEntry = require("../models/KnowledgeEntry");
const AiConversation = require("../models/AiConversation");
const AiCall = require("../models/AiCall");
const AiMessage = require("../models/AiMessage");
const { getInstructions, CHANNELS } = require("../utils/aiBrain");
const { toE164UK } = require("../utils/phone");

router.use(adminAuth);

// ── Overview ──────────────────────────────────────────────────────
router.get("/overview", async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [settings, knowledgeCount, conversations, needsHuman, callsToday, callsTotal, transferredToday, conversationsTotal] =
      await Promise.all([
        AiSettings.get(),
        KnowledgeEntry.countDocuments({ active: true }),
        AiConversation.countDocuments({ status: { $ne: "closed" } }),
        AiConversation.countDocuments({ $or: [{ status: "human" }, { needsAttention: true }] }),
        AiCall.countDocuments({ startedAt: { $gte: startOfToday } }),
        AiCall.countDocuments(),
        AiCall.countDocuments({ startedAt: { $gte: startOfToday }, transferred: true }),
        AiConversation.countDocuments(),
      ]);
    res.json({
      voiceEnabled: settings.voiceEnabled,
      whatsappEnabled: settings.whatsappEnabled,
      transferNumberSet: Boolean(settings.transferNumber),
      knowledgeCount,
      conversations,
      needsHuman,
      callsToday,
      callsTotal,
      transferredToday,
      conversationsTotal,
    });
  } catch (err) {
    console.error("[ai-receptionist] overview failed:", err);
    res.status(500).json({ message: "Failed to load overview" });
  }
});

// ── Settings ──────────────────────────────────────────────────────
router.get("/settings", async (req, res) => {
  try {
    res.json(await AiSettings.get());
  } catch (err) {
    console.error("[ai-receptionist] get settings failed:", err);
    res.status(500).json({ message: "Failed to load settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const update = {};
    for (const field of ["businessName", "serviceArea", "instructions"]) {
      if (typeof req.body[field] === "string") update[field] = req.body[field];
    }
    if (typeof req.body.assistantName === "string") {
      const names = agentNames({ assistantName: req.body.assistantName }, { strict: true });
      if (!names) {
        return res.status(400).json({ message: "Receptionist names must be first names separated by commas, e.g. John, Mark (up to 10)" });
      }
      update.assistantName = names.join(", ");
    }
    for (const field of ["voiceEnabled", "whatsappEnabled", "quoteIncludeVat"]) {
      if (typeof req.body[field] === "boolean") update[field] = req.body[field];
    }
    if (req.body.suppliesFee !== undefined) {
      const fee = Number(req.body.suppliesFee);
      if (!Number.isFinite(fee) || fee < 0 || fee > 500) {
        return res.status(400).json({ message: "Supplies fee must be a number between 0 and 500" });
      }
      update.suppliesFee = Math.round(fee * 100) / 100;
    }
    if (typeof req.body.transferNumber === "string") {
      const raw = req.body.transferNumber.trim();
      const normalised = toE164UK(raw);
      if (raw && !normalised) {
        return res.status(400).json({ message: "Transfer number must be a valid phone number, e.g. 07700 900123" });
      }
      update.transferNumber = normalised;
    }
    await AiSettings.get(); // make sure the document exists
    const settings = await AiSettings.findOneAndUpdate({ key: "default" }, { $set: update }, { new: true });
    console.log(`[ai-receptionist] settings updated by ${req.admin.username || req.admin._id}:`, Object.keys(update).join(", "));
    res.json(settings);
  } catch (err) {
    console.error("[ai-receptionist] update settings failed:", err);
    res.status(400).json({ message: err.message });
  }
});

// ── Knowledge base ────────────────────────────────────────────────
const pickEntry = (body) => {
  const out = {};
  for (const field of ["title", "content", "category"]) {
    if (typeof body[field] === "string") out[field] = body[field];
  }
  if (typeof body.active === "boolean") out.active = body.active;
  return out;
};

router.get("/knowledge", async (req, res) => {
  try {
    res.json(await KnowledgeEntry.find().sort({ category: 1, title: 1 }));
  } catch (err) {
    console.error("[ai-receptionist] list knowledge failed:", err);
    res.status(500).json({ message: "Failed to load knowledge" });
  }
});

router.post("/knowledge", async (req, res) => {
  try {
    const entry = await KnowledgeEntry.create(pickEntry(req.body));
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/knowledge/:id", async (req, res) => {
  try {
    const entry = await KnowledgeEntry.findByIdAndUpdate(req.params.id, { $set: pickEntry(req.body) }, {
      new: true,
      runValidators: true,
    });
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/knowledge/:id", async (req, res) => {
  try {
    const entry = await KnowledgeEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Prompt preview: exactly what the AI will be told ──────────────
router.get("/prompt-preview", async (req, res) => {
  try {
    const channel = CHANNELS.includes(req.query.channel) ? req.query.channel : "whatsapp";
    res.json({ channel, instructions: await getInstructions(channel) });
  } catch (err) {
    console.error("[ai-receptionist] prompt preview failed:", err);
    res.status(500).json({ message: "Failed to build preview" });
  }
});

// ── Conversations (WhatsApp) ──────────────────────────────────────
const WINDOW_MS = 24 * 60 * 60 * 1000; // WhatsApp free-form reply window after the customer's last message
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const windowInfo = (c) => {
  const last = c.lastCustomerMessageAt ? new Date(c.lastCustomerMessageAt).getTime() : 0;
  const closesAt = last ? new Date(last + WINDOW_MS) : null;
  return { replyWindowOpen: Boolean(last && Date.now() < last + WINDOW_MS), replyWindowClosesAt: closesAt };
};

router.get("/conversations", async (req, res) => {
  try {
    const filter = {};
    if (["ai", "human", "closed"].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.attention === "1") filter.needsAttention = true;
    const q = String(req.query.q || "").trim();
    if (q) filter.$or = [{ phone: { $regex: escapeRegex(q) } }, { name: { $regex: escapeRegex(q), $options: "i" } }];
    const conversations = await AiConversation.find(filter).sort({ lastMessageAt: -1 }).limit(200).lean();
    res.json(conversations.map((c) => ({ ...c, ...windowInfo(c) })));
  } catch (err) {
    console.error("[ai-receptionist] list conversations failed:", err);
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const conversation = await AiConversation.findByIdAndUpdate(req.params.id, { $set: { unreadCount: 0 } }, { new: true }).lean();
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    const messages = await AiMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 }).limit(500).lean();
    res.json({ conversation: { ...conversation, ...windowInfo(conversation) }, messages });
  } catch (err) {
    console.error("[ai-receptionist] get conversation failed:", err);
    res.status(500).json({ message: "Failed to load conversation" });
  }
});

// Take over (human), hand back to the AI (ai), or archive (closed).
router.post("/conversations/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["ai", "human", "closed"].includes(status)) return res.status(400).json({ message: "Invalid status" });
    const update = { status };
    if (status === "ai") update.needsAttention = false;
    const conversation = await AiConversation.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    console.log(`[ai-receptionist] ${conversation.phone} set to ${status} by ${req.admin.username || req.admin._id}`);
    res.json({ ...conversation, ...windowInfo(conversation) });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Staff reply from the admin. WhatsApp only allows free text within 24h of the customer's last message.
router.post("/conversations/:id/reply", async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Message is empty" });
    if (text.length > 1600) return res.status(400).json({ message: "Message is too long (max 1600 characters)" });
    const conversation = await AiConversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!windowInfo(conversation).replyWindowOpen) {
      return res.status(400).json({
        message: "WhatsApp's 24-hour reply window has closed. The customer must message you first before you can reply.",
      });
    }
    // Replying as staff means a person is handling this chat now.
    if (conversation.status === "ai") await AiConversation.updateOne({ _id: conversation._id }, { $set: { status: "human" } });
    const { sendAndRecord } = require("../utils/whatsapp");
    const message = await sendAndRecord(conversation, "staff", text, { staff: req.admin._id });
    if (message.deliveryStatus === "failed") {
      return res.status(502).json({ message: `WhatsApp didn't accept the message: ${message.error}`, sent: message });
    }
    res.status(201).json(message);
  } catch (err) {
    console.error("[ai-receptionist] staff reply failed:", err);
    res.status(500).json({ message: "Failed to send reply" });
  }
});

// ── Calls ─────────────────────────────────────────────────────────
router.get("/calls", async (req, res) => {
  try {
    const calls = await AiCall.find().sort({ startedAt: -1 }).limit(200).select("-transcript").lean();
    res.json(calls);
  } catch (err) {
    console.error("[ai-receptionist] list calls failed:", err);
    res.status(500).json({ message: "Failed to load calls" });
  }
});

router.get("/calls/:id", async (req, res) => {
  try {
    const call = await AiCall.findById(req.params.id).lean();
    if (!call) return res.status(404).json({ message: "Call not found" });
    res.json(call);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
