const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailService");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");

const WORKER_GUIDE_URL = process.env.WORKER_GUIDE_URL || "https://www.cleaniqservices.com/worker-guide";
const CUSTOMER_GUIDE_URL = process.env.CUSTOMER_GUIDE_URL || "https://www.cleaniqservices.com/customer-guide";

const workerGuideEmail = (name) => `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#061A13,#0B2D22);padding:40px 40px 32px;text-align:center">
          <div style="width:52px;height:52px;background:#10B981;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#fff;margin-bottom:16px">C</div>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">cleaniq services</h1>
          <p style="margin:6px 0 0;color:#6ee7b7;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Worker App Guide</p>
        </td>
      </tr>

      <!-- Welcome -->
      <tr>
        <td style="padding:36px 40px 0">
          <h2 style="margin:0 0 12px;color:#0F172A;font-size:20px;font-weight:800">Welcome to the team, ${name}! 🎉</h2>
          <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.7">
            We're excited to have you on board. Please take a few minutes to read through your Worker App Guide — it explains everything you need to know to get started, from logging in to completing your first job and getting paid.
          </p>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7">
            The guide covers: logging in, viewing and starting jobs, completing a checklist, your pay, your rota schedule, and what to do if something goes wrong.
          </p>
        </td>
      </tr>

      <!-- Key info -->
      <tr>
        <td style="padding:0 40px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="background:#ecfdf5;border-radius:10px;padding:16px;vertical-align:top">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#065F46;letter-spacing:1px;text-transform:uppercase">Your first step</p>
                <p style="margin:0;color:#0F172A;font-size:13px;font-weight:600">Check your email for your login link, email address, and temporary password</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#ecfdf5;border-radius:10px;padding:16px;vertical-align:top">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#065F46;letter-spacing:1px;text-transform:uppercase">Questions?</p>
                <p style="margin:0;color:#0F172A;font-size:13px;font-weight:600">Email us at cleaniqservices@gmail.com — we're always happy to help</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:32px 40px;text-align:center">
          <a href="${WORKER_GUIDE_URL}" style="display:inline-block;background:#10B981;color:#fff;font-size:15px;font-weight:800;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px">📖 Open Your Worker Guide</a>
          <p style="margin:14px 0 0;color:#94a3b8;font-size:11px">You can also save it as a PDF: open the link → File → Print → Save as PDF</p>
        </td>
      </tr>

      <!-- Steps preview -->
      <tr>
        <td style="padding:0 40px 32px">
          <p style="margin:0 0 14px;color:#0F172A;font-size:13px;font-weight:700">What the guide covers:</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["🔐","Logging in for the first time"],
              ["📋","Viewing and starting your jobs"],
              ["✅","Completing the job checklist"],
              ["💷","How your pay is calculated"],
              ["🗓️","Reading your rota schedule"],
              ["🆘","What to do if something goes wrong"],
            ].map(([icon, text]) => `
            <tr>
              <td style="padding:5px 0;border-bottom:1px solid #f1f5f9">
                <span style="font-size:13px">${icon}</span>
                <span style="color:#475569;font-size:13px;margin-left:8px">${text}</span>
              </td>
            </tr>`).join("")}
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center">
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600">cleaniq services</p>
          <p style="margin:0;color:#94a3b8;font-size:11px">cleaniqservices@gmail.com</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>`;

const customerGuideEmail = (name) => `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#036847,#061A13);padding:40px 40px 32px;text-align:center">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#fff;margin-bottom:16px">C</div>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">cleaniq services</h1>
          <p style="margin:6px 0 0;color:#6ee7b7;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase">Your Account Guide</p>
        </td>
      </tr>

      <!-- Welcome -->
      <tr>
        <td style="padding:36px 40px 0">
          <h2 style="margin:0 0 12px;color:#0F172A;font-size:20px;font-weight:800">Welcome, ${name}! 🎉</h2>
          <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.7">
            Thank you for choosing cleaniq services. We've put together a short guide explaining how to use your customer account — where you can view your bookings, track your cleans, and get in touch with our team.
          </p>
        </td>
      </tr>

      <!-- Features -->
      <tr>
        <td style="padding:0 40px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="background:#ecfdf5;border-radius:10px;padding:14px;vertical-align:top">
                <p style="margin:0 0 4px;font-size:18px">📋</p>
                <p style="margin:0 0 4px;color:#0F172A;font-size:12px;font-weight:700">Manage Bookings</p>
                <p style="margin:0;color:#475569;font-size:11px">View, track and manage all your appointments</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#ecfdf5;border-radius:10px;padding:14px;vertical-align:top">
                <p style="margin:0 0 4px;font-size:18px">💬</p>
                <p style="margin:0 0 4px;color:#0F172A;font-size:12px;font-weight:700">Live Support</p>
                <p style="margin:0;color:#475569;font-size:11px">Chat with our team directly from your dashboard</p>
              </td>
            </tr>
            <tr><td colspan="3" style="height:8px"></td></tr>
            <tr>
              <td width="48%" style="background:#ecfdf5;border-radius:10px;padding:14px;vertical-align:top">
                <p style="margin:0 0 4px;font-size:18px">🔔</p>
                <p style="margin:0 0 4px;color:#0F172A;font-size:12px;font-weight:700">Get Notified</p>
                <p style="margin:0;color:#475569;font-size:11px">Booking confirmations and updates by email</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#ecfdf5;border-radius:10px;padding:14px;vertical-align:top">
                <p style="margin:0 0 4px;font-size:18px">🔁</p>
                <p style="margin:0 0 4px;color:#0F172A;font-size:12px;font-weight:700">Easy Rebooking</p>
                <p style="margin:0;color:#475569;font-size:11px">Repeat a previous booking in just a few taps</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:32px 40px;text-align:center">
          <a href="${CUSTOMER_GUIDE_URL}" style="display:inline-block;background:#036847;color:#fff;font-size:15px;font-weight:800;padding:14px 36px;border-radius:10px;text-decoration:none">📖 Open Your Customer Guide</a>
          <p style="margin:14px 0 0;color:#94a3b8;font-size:11px">You can also save it as a PDF: open the link → File → Print → Save as PDF</p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center">
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600">cleaniq services</p>
          <p style="margin:0;color:#94a3b8;font-size:11px">cleaniqservices@gmail.com</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>`;

// POST /api/guides/send — send worker or customer guide to one or many recipients
router.post("/send", async (req, res) => {
  try {
    const { type, recipients } = req.body;
    // recipients: [{ name, email }]
    if (!["worker", "customer"].includes(type)) {
      return res.status(400).json({ message: "type must be 'worker' or 'customer'" });
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "recipients array is required" });
    }

    const results = await Promise.allSettled(
      recipients.map(({ name, email }) =>
        sendEmail({
          to: email,
          subject: type === "worker"
            ? "Your cleaniq services Worker App Guide 📖"
            : "Your cleaniq services Customer Account Guide 📖",
          html: type === "worker"
            ? workerGuideEmail(name || "Team Member")
            : customerGuideEmail(name || "Valued Customer"),
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const failed = results.length - sent;

    res.json({ sent, failed, total: results.length });
  } catch (err) {
    console.error("Guide send error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/guides/workers — return list of workers with name + email for the UI
router.get("/workers", async (req, res) => {
  try {
    const workers = await Worker.find({}, "name email status").lean();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/guides/customers — return list of customers with name + email for the UI
router.get("/customers", async (req, res) => {
  try {
    const customers = await Customer.find({}, "firstName lastName email").lean();
    res.json(customers.map((c) => ({
      _id: c._id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
