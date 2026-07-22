const express = require("express");
const router = express.Router();
const ScheduledTask = require("../models/ScheduledTask");
const SystemSetting = require("../models/SystemSetting");
const Customer = require("../models/Customer");
const { runTaskNow } = require("../utils/automationEngine");

const AUTOMATION_TYPES = [
  { key: "booking_reminder_24h",  label: "Booking Reminder — 24 hours before", category: "booking" },
  { key: "booking_reminder_3h",   label: "Booking Reminder — 3 hours before",  category: "booking" },
  { key: "review_request_2h",     label: "Review Request — 2 hours after job",  category: "after_service" },
  { key: "referral_offer_48h",    label: "Referral Offer — 48 hours after job", category: "after_service" },
  { key: "rebooking_discount_3d", label: "Re-booking Discount — 3 days after",  category: "after_service" },
  { key: "quote_followup_24h",    label: "Quote Follow-up — 24 hours",          category: "quote" },
  { key: "quote_followup_3d",     label: "Quote Follow-up — 3 days",            category: "quote" },
  { key: "lost_lead_7d",          label: "Lost Lead Win-back — 7 days",         category: "quote" },
];

// GET /api/automations/settings — return toggle states for all automation types
router.get("/settings", async (req, res) => {
  try {
    const settings = await SystemSetting.find({
      key: { $in: AUTOMATION_TYPES.map(t => `automation_${t.key}`) },
    });
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });

    const result = AUTOMATION_TYPES.map(t => ({
      ...t,
      enabled: map[`automation_${t.key}`] !== false,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/automations/settings/:type — toggle an automation on or off
router.post("/settings/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { enabled } = req.body;
    await SystemSetting.findOneAndUpdate(
      { key: `automation_${type}` },
      { $set: { value: !!enabled, updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    res.json({ success: true, type, enabled: !!enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/automations/queue — pending tasks
router.get("/queue", async (req, res) => {
  try {
    const tasks = await ScheduledTask.find({ status: "pending" })
      .sort({ runAt: 1 })
      .limit(100);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/automations/history — sent/failed tasks
router.get("/history", async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const filter = status ? { status } : { status: { $in: ["sent", "failed", "cancelled"] } };
    const tasks = await ScheduledTask.find(filter)
      .sort({ executedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await ScheduledTask.countDocuments(filter);
    res.json({ tasks, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/automations/stats — summary counts
router.get("/stats", async (req, res) => {
  try {
    const [pending, sentToday, failed, totalSent] = await Promise.all([
      ScheduledTask.countDocuments({ status: "pending" }),
      ScheduledTask.countDocuments({
        status: "sent",
        executedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      ScheduledTask.countDocuments({ status: "failed" }),
      ScheduledTask.countDocuments({ status: "sent" }),
    ]);
    res.json({ pending, sentToday, failed, totalSent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/automations/queue/:id — cancel a pending task
router.delete("/queue/:id", async (req, res) => {
  try {
    await ScheduledTask.findByIdAndUpdate(req.params.id, { status: "cancelled" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/automations/resend/:id — immediately resend a failed/cancelled task
router.post("/resend/:id", async (req, res) => {
  try {
    const task = await ScheduledTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    await runTaskNow(task.type, task.payload);

    // Log the manual resend as a new sent record
    await ScheduledTask.create({
      type: task.type,
      payload: task.payload,
      runAt: new Date(),
      status: "sent",
      executedAt: new Date(),
      attempts: 1,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Resend error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/automations/send-manual — send any automation email to a specific customer right now
router.post("/send-manual", async (req, res) => {
  try {
    const { type, customerId, service } = req.body;
    if (!type || !customerId) {
      return res.status(400).json({ message: "type and customerId are required" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const payload = {
      email: customer.email,
      firstName: customer.firstName,
      service: service || "your recent clean",
    };

    await runTaskNow(type, payload);

    await ScheduledTask.create({
      type,
      payload,
      runAt: new Date(),
      status: "sent",
      executedAt: new Date(),
      attempts: 1,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Manual send error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/automations/preview — render email HTML for a task type + payload (no send)
router.post("/preview", (req, res) => {
  const { type, payload } = req.body;
  if (!type || !payload) return res.status(400).json({ message: "type and payload are required" });

  const { automationTemplates } = require("../utils/emailService");
  const REVIEW_URL = "https://g.page/r/cleaniqservices/review";

  const builders = {
    booking_reminder_24h:  () => automationTemplates.bookingReminder24h(payload),
    booking_reminder_3h:   () => automationTemplates.bookingReminder3h(payload),
    review_request_2h:     () => automationTemplates.reviewRequest({ ...payload, reviewUrl: REVIEW_URL }),
    referral_offer_48h:    () => automationTemplates.referralOffer(payload),
    rebooking_discount_3d: () => automationTemplates.rebookingDiscount(payload),
    quote_followup_24h:    () => automationTemplates.quoteFollowup24h(payload),
    quote_followup_3d:     () => automationTemplates.quoteFollowup3d(payload),
    lost_lead_7d:          () => automationTemplates.lostLead7d(payload),
  };

  const build = builders[type];
  if (!build) return res.status(400).json({ message: `No template for type: ${type}` });

  try {
    res.json({ html: build() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
