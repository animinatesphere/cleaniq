const express = require("express");
const router = express.Router();
const EmailLog = require("../models/EmailLog");
const { sendEmail } = require("../utils/emailService");

// POST /api/email-logs/send — send a one-off transactional email
router.post("/send", async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ message: "to, subject and html are required" });
  }
  try {
    const ok = await sendEmail({ to, subject, html });
    if (!ok) return res.status(500).json({ message: "Email delivery failed" });
    res.json({ message: "Email sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/email-logs — list everything sent, most recent first
router.get("/", async (req, res) => {
  try {
    const { limit = 200 } = req.query;
    const logs = await EmailLog.find()
      .select("-html")
      .sort({ sentAt: -1 })
      .limit(parseInt(limit));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/email-logs/:id — full record including HTML, for viewing/downloading
router.get("/:id", async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Email not found" });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
