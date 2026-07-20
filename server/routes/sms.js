const express = require("express");
const router = express.Router();
const SmsLog = require("../models/SmsLog");
const SystemSetting = require("../models/SystemSetting");
const { sendSms } = require("../utils/smsService");

const SMS_TRIGGERS = [
  { key: "booking_confirmed",    label: "Booking Confirmed",        recipient: "customer", description: "Sent when a booking status changes to Confirmed" },
  { key: "worker_assigned",      label: "Worker Assigned",          recipient: "customer", description: "Sent when a worker is assigned to a booking" },
  { key: "booking_reminder_24h", label: "24h Reminder",             recipient: "customer", description: "Sent 24 hours before the scheduled clean" },
  { key: "booking_completed",    label: "Job Completed + Review",   recipient: "customer", description: "Sent when a booking is marked Completed, includes review link" },
  { key: "booking_cancelled",    label: "Booking Cancelled",        recipient: "customer", description: "Sent when a booking is cancelled" },
  { key: "worker_job_assigned",  label: "Worker: New Job Assigned", recipient: "worker",   description: "Sent to the worker when they are assigned a new job" },
];

// GET /api/sms/config — return all trigger states + Twilio credentials status
router.get("/config", async (req, res) => {
  try {
    const keys = [
      ...SMS_TRIGGERS.map(t => `sms_${t.key}`),
      "twilio_account_sid",
      "twilio_auth_token",
      "twilio_phone_number",
    ];
    const settings = await SystemSetting.find({ key: { $in: keys } });
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });

    const triggers = SMS_TRIGGERS.map(t => ({
      ...t,
      enabled: map[`sms_${t.key}`] === true,
    }));

    const configured = !!(map.twilio_account_sid && map.twilio_auth_token && map.twilio_phone_number);

    res.json({
      triggers,
      configured,
      phoneNumber: map.twilio_phone_number
        ? `...${String(map.twilio_phone_number).slice(-4)}`
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/config/trigger — toggle a trigger on/off
router.post("/config/trigger", async (req, res) => {
  try {
    const { key, enabled } = req.body;
    const valid = SMS_TRIGGERS.find(t => t.key === key);
    if (!valid) return res.status(400).json({ error: "Unknown trigger" });

    await SystemSetting.findOneAndUpdate(
      { key: `sms_${key}` },
      { key: `sms_${key}`, value: !!enabled },
      { upsert: true, new: true },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/config/credentials — save Twilio credentials
router.post("/config/credentials", async (req, res) => {
  try {
    const { accountSid, authToken, phoneNumber } = req.body;
    const updates = [];
    if (accountSid !== undefined)
      updates.push(SystemSetting.findOneAndUpdate({ key: "twilio_account_sid" },  { key: "twilio_account_sid",  value: accountSid  }, { upsert: true }));
    if (authToken !== undefined)
      updates.push(SystemSetting.findOneAndUpdate({ key: "twilio_auth_token" },   { key: "twilio_auth_token",   value: authToken   }, { upsert: true }));
    if (phoneNumber !== undefined)
      updates.push(SystemSetting.findOneAndUpdate({ key: "twilio_phone_number" }, { key: "twilio_phone_number", value: phoneNumber  }, { upsert: true }));
    await Promise.all(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/test — send a test SMS
router.post("/test", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "Phone number required" });
    const result = await sendSms({
      to,
      body: "✅ CleanIQ SMS is working! This is a test message from your admin panel.",
      trigger: "test",
    });
    if (result.success) {
      res.json({ success: true, sid: result.sid });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sms/logs — paginated SMS history
router.get("/logs", async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const trigger = req.query.trigger;
    const status  = req.query.status;

    const filter = {};
    if (trigger && trigger !== "all") filter.trigger = trigger;
    if (status  && status  !== "all") filter.status  = status;

    const [logs, total] = await Promise.all([
      SmsLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      SmsLog.countDocuments(filter),
    ]);

    const stats = await SmsLog.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statMap = { sent: 0, failed: 0, pending: 0 };
    stats.forEach(s => { statMap[s._id] = s.count; });

    res.json({ logs, total, page, pages: Math.ceil(total / limit), stats: statMap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sms/logs — clear all logs
router.delete("/logs", async (req, res) => {
  try {
    await SmsLog.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
