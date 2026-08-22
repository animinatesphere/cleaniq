const express = require("express");
const router = express.Router();
const multer = require("multer");
const SmsLog = require("../models/SmsLog");
const SmsContact = require("../models/SmsContact");
const SystemSetting = require("../models/SystemSetting");
const { sendSms, DEFAULT_TEMPLATES, normalizePhone } = require("../utils/smsService");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
      "twilio_verify_sid",
    ];
    const settings = await SystemSetting.find({ key: { $in: keys } });
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });

    const triggers = SMS_TRIGGERS.map(t => ({
      ...t,
      enabled: map[`sms_${t.key}`] === true,
    }));

    const configured       = !!(map.twilio_account_sid && map.twilio_auth_token && map.twilio_phone_number);
    const verifyConfigured = !!(map.twilio_account_sid && map.twilio_auth_token && map.twilio_verify_sid);

    res.json({
      triggers,
      configured,
      verifyConfigured,
      phoneNumber: map.twilio_phone_number
        ? `...${String(map.twilio_phone_number).slice(-4)}`
        : null,
      verifySidMasked: map.twilio_verify_sid
        ? `VA...${String(map.twilio_verify_sid).slice(-6)}`
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
    const { accountSid, authToken, phoneNumber, verifySid } = req.body;
    const updates = [];
    if (accountSid !== undefined)
      updates.push(SystemSetting.findOneAndUpdate({ key: "twilio_account_sid" },  { key: "twilio_account_sid",  value: accountSid  }, { upsert: true }));
    if (authToken !== undefined)
      updates.push(SystemSetting.findOneAndUpdate({ key: "twilio_auth_token" },   { key: "twilio_auth_token",   value: authToken   }, { upsert: true }));
    if (phoneNumber !== undefined)
      updates.push(SystemSetting.findOneAndUpdate({ key: "twilio_phone_number" }, { key: "twilio_phone_number", value: phoneNumber  }, { upsert: true }));
    if (verifySid !== undefined)
      updates.push(SystemSetting.findOneAndUpdate({ key: "twilio_verify_sid" },   { key: "twilio_verify_sid",   value: verifySid   }, { upsert: true }));
    await Promise.all(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Verify helpers ──────────────────────────────────────────────────────────
async function getVerifyClient() {
  const [sidSetting, tokenSetting, vSidSetting] = await Promise.all([
    SystemSetting.findOne({ key: "twilio_account_sid" }),
    SystemSetting.findOne({ key: "twilio_auth_token" }),
    SystemSetting.findOne({ key: "twilio_verify_sid" }),
  ]);
  const sid      = sidSetting?.value   || process.env.TWILIO_ACCOUNT_SID;
  const token    = tokenSetting?.value || process.env.TWILIO_AUTH_TOKEN;
  const verifySid = vSidSetting?.value || process.env.TWILIO_VERIFY_SID;
  if (!sid || !token || !verifySid) return null;
  const twilio = require("twilio");
  return { client: twilio(sid, token), verifySid };
}

// POST /api/sms/verify/send — send a Twilio Verify code to a phone number
router.post("/verify/send", async (req, res) => {
  try {
    const { to, channel = "sms" } = req.body;
    if (!to) return res.status(400).json({ error: "Phone number required" });

    const ctx = await getVerifyClient();
    if (!ctx) return res.status(400).json({ error: "Twilio Verify not configured. Add your Verify Service SID in Credentials." });

    const verification = await ctx.client.verify.v2
      .services(ctx.verifySid)
      .verifications.create({ to, channel });

    res.json({ success: true, status: verification.status, to: verification.to });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to send verification code" });
  }
});

// POST /api/sms/verify/check — check the code the user entered
router.post("/verify/check", async (req, res) => {
  try {
    const { to, code } = req.body;
    if (!to || !code) return res.status(400).json({ error: "Phone number and code required" });

    const ctx = await getVerifyClient();
    if (!ctx) return res.status(400).json({ error: "Twilio Verify not configured" });

    const check = await ctx.client.verify.v2
      .services(ctx.verifySid)
      .verificationChecks.create({ to, code });

    if (check.status === "approved") {
      res.json({ success: true, status: "approved" });
    } else {
      res.status(400).json({ success: false, status: check.status, error: "Incorrect code — please try again" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to verify code" });
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

// ─── Templates ───────────────────────────────────────────────────────────────

// GET /api/sms/templates — return all templates (custom DB overrides + defaults)
router.get("/templates", async (req, res) => {
  try {
    const keys    = Object.keys(DEFAULT_TEMPLATES);
    const dbRows  = await SystemSetting.find({ key: { $in: keys.map(k => `sms_tpl_${k}`) } });
    const dbMap   = {};
    dbRows.forEach(r => { dbMap[r.key] = r.value; });

    const bizRow  = await SystemSetting.findOne({ key: "business_phone" });

    const result = keys.map(key => ({
      key,
      text:     dbMap[`sms_tpl_${key}`] || DEFAULT_TEMPLATES[key],
      isCustom: !!dbMap[`sms_tpl_${key}`],
      default:  DEFAULT_TEMPLATES[key],
    }));
    res.json({ templates: result, bizPhone: bizRow?.value || "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/templates/:key — save or reset a template
router.post("/templates/:key", async (req, res) => {
  try {
    const { key } = req.params;
    if (!DEFAULT_TEMPLATES[key]) return res.status(400).json({ error: "Unknown template key" });
    const { text } = req.body;
    if (text === null || text === "") {
      // Reset to default — remove the override
      await SystemSetting.deleteOne({ key: `sms_tpl_${key}` });
    } else {
      await SystemSetting.findOneAndUpdate(
        { key: `sms_tpl_${key}` },
        { key: `sms_tpl_${key}`, value: text },
        { upsert: true },
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/config/biz-phone — save business phone shown in SMS messages
router.post("/config/biz-phone", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone?.trim()) return res.status(400).json({ error: "Phone required" });
    await SystemSetting.findOneAndUpdate(
      { key: "business_phone" },
      { key: "business_phone", value: phone.trim() },
      { upsert: true },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SMS Contacts ─────────────────────────────────────────────────────────────

// GET /api/sms/contacts
router.get("/contacts", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(200, parseInt(req.query.limit) || 50);
    const search = (req.query.search || "").trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { firstName:       { $regex: search, $options: "i" } },
        { lastName:        { $regex: search, $options: "i" } },
        { phone:           { $regex: search, $options: "i" } },
        { normalizedPhone: { $regex: search, $options: "i" } },
        { notes:           { $regex: search, $options: "i" } },
      ];
    }

    const [contacts, total] = await Promise.all([
      SmsContact.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      SmsContact.countDocuments(filter),
    ]);
    const stats = {
      active:     await SmsContact.countDocuments({ status: "active" }),
      suppressed: await SmsContact.countDocuments({ status: "suppressed" }),
    };
    res.json({ contacts, total, page, pages: Math.ceil(total / limit), stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/contacts — add single contact
router.post("/contacts", async (req, res) => {
  try {
    const { firstName = "", lastName = "", phone, notes = "", status = "active" } = req.body;
    if (!phone?.trim()) return res.status(400).json({ message: "Phone number is required" });
    const normalized = normalizePhone(phone.trim());
    const contact = await SmsContact.create({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      phone:     phone.trim(),
      normalizedPhone: normalized,
      notes:     notes.trim(),
      status,
    });
    res.json(contact);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "This phone number already exists" });
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/sms/contacts/:id — edit contact
router.put("/contacts/:id", async (req, res) => {
  try {
    const { firstName, lastName, phone, notes, status } = req.body;
    const update = {};
    if (firstName !== undefined) update.firstName = firstName.trim();
    if (lastName  !== undefined) update.lastName  = lastName.trim();
    if (phone     !== undefined) {
      update.phone = phone.trim();
      update.normalizedPhone = normalizePhone(phone.trim());
    }
    if (notes  !== undefined) update.notes  = notes.trim();
    if (status !== undefined) update.status = status;
    const contact = await SmsContact.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Phone number already exists" });
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/sms/contacts/:id — delete single
router.delete("/contacts/:id", async (req, res) => {
  try {
    await SmsContact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sms/contacts — bulk delete
router.delete("/contacts", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: "IDs required" });
    await SmsContact.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/contacts/import — CSV import (columns: phone, first_name, last_name, notes)
router.post("/contacts/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "CSV file required" });
    const csv = req.file.buffer.toString("utf-8");
    const lines = csv.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) return res.status(400).json({ message: "Empty file" });

    const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^"|"$/g, ""));
    const phoneIdx = header.indexOf("phone");
    if (phoneIdx === -1) return res.status(400).json({ message: 'CSV must have a "phone" column' });
    const fnIdx    = header.indexOf("first_name");
    const lnIdx    = header.indexOf("last_name");
    const notesIdx = header.indexOf("notes");

    let imported = 0, duplicates = 0, invalid = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const phone = cols[phoneIdx] || "";
      if (!phone) { invalid++; continue; }
      try {
        const normalized = normalizePhone(phone);
        await SmsContact.create({
          phone,
          normalizedPhone: normalized,
          firstName: fnIdx >= 0 ? (cols[fnIdx] || "") : "",
          lastName:  lnIdx >= 0 ? (cols[lnIdx] || "") : "",
          notes:     notesIdx >= 0 ? (cols[notesIdx] || "") : "",
        });
        imported++;
      } catch (e) {
        if (e.code === 11000) duplicates++; else invalid++;
      }
    }
    res.json({ imported, duplicates, invalid, total: lines.length - 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sms/bulk/send-direct — send SMS to a raw list of phone numbers (no contact lookup)
router.post("/bulk/send-direct", async (req, res) => {
  try {
    const { phones, message } = req.body;
    if (!Array.isArray(phones) || !phones.length)
      return res.status(400).json({ error: "No phone numbers provided" });
    if (!message?.trim())
      return res.status(400).json({ error: "Message is required" });

    const results = { sent: 0, failed: 0, errors: [] };
    const BATCH = 10;
    const unique = [...new Set(phones.map(p => p.trim()).filter(Boolean))];
    for (let i = 0; i < unique.length; i += BATCH) {
      const batch = unique.slice(i, i + BATCH);
      await Promise.all(batch.map(async (phone) => {
        const result = await sendSms({
          to:        phone,
          body:      message.trim(),
          trigger:   "bulk_direct",
          recipient: "customer",
        });
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ phone, error: result.error });
        }
      }));
    }
    res.json({ success: true, ...results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sms/bulk/send — send SMS to selected contact IDs
router.post("/bulk/send", async (req, res) => {
  try {
    const { ids, message } = req.body;
    if (!Array.isArray(ids) || !ids.length)
      return res.status(400).json({ error: "No contacts provided" });
    if (!message?.trim())
      return res.status(400).json({ error: "Message is required" });

    const contacts = await SmsContact.find({ _id: { $in: ids }, status: "active" });
    if (!contacts.length) return res.status(400).json({ error: "No active contacts found" });

    const results = { sent: 0, failed: 0, errors: [] };
    const BATCH = 10;
    for (let i = 0; i < contacts.length; i += BATCH) {
      const batch = contacts.slice(i, i + BATCH);
      await Promise.all(batch.map(async (c) => {
        const result = await sendSms({
          to:        c.normalizedPhone || c.phone,
          body:      message.trim(),
          trigger:   "bulk",
          recipient: "customer",
        });
        if (result.success) {
          results.sent++;
          await SmsContact.findByIdAndUpdate(c._id, { contacted: true });
        } else {
          results.failed++;
          results.errors.push({ phone: c.phone, error: result.error });
        }
      }));
    }
    res.json({ success: true, ...results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
