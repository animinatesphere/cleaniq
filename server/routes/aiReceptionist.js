// Admin API for the AI Receptionist dashboard. Every route requires an admin login.
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const AiSettings = require("../models/AiSettings");
const KnowledgeEntry = require("../models/KnowledgeEntry");
const AiConversation = require("../models/AiConversation");
const AiCall = require("../models/AiCall");
const { getInstructions, CHANNELS } = require("../utils/aiBrain");
const { toE164UK } = require("../utils/phone");

router.use(adminAuth);

// ── Overview ──────────────────────────────────────────────────────
router.get("/overview", async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [settings, knowledgeCount, conversations, needsHuman, callsToday, callsTotal, transferredToday] =
      await Promise.all([
        AiSettings.get(),
        KnowledgeEntry.countDocuments({ active: true }),
        AiConversation.countDocuments({ status: { $ne: "closed" } }),
        AiConversation.countDocuments({ status: "human" }),
        AiCall.countDocuments({ startedAt: { $gte: startOfToday } }),
        AiCall.countDocuments(),
        AiCall.countDocuments({ startedAt: { $gte: startOfToday }, transferred: true }),
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
    for (const field of ["voiceEnabled", "whatsappEnabled"]) {
      if (typeof req.body[field] === "boolean") update[field] = req.body[field];
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

module.exports = router;
