const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const Job = require("../models/Job");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const { sendEmail } = require("../utils/emailService");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "cleaniqservices@gmail.com";

/* ── Email helpers ─────────────────────────────────────────────────────────── */
const jobSubmittedEmail = (job) => `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;background:#fff;">
  <div style="background:#083D2E;padding:36px;text-align:center;">
    <h1 style="color:#6EE7B7;margin:0;font-size:26px;letter-spacing:-0.5px;">Job Request Received</h1>
    <p style="color:#94a3b8;margin-top:8px;">We've received your cleaning job request</p>
  </div>
  <div style="padding:36px;color:#1e293b;">
    <p style="font-size:16px;">Hi <strong>${job.company?.name || "there"}</strong>,</p>
    <p>Your job request has been submitted successfully. Our team will review it and confirm within <strong>24 hours</strong>.</p>
    <div style="background:#f8fafc;border-radius:16px;padding:24px;margin:24px 0;border:1px solid #e2e8f0;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Job Reference</p>
      <p style="margin:0 0 20px;font-size:22px;font-weight:900;color:#0F6B4C;">${job.jobId}</p>
      <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;background:#fff;border-radius:10px;border:1px solid #e2e8f0;">
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="font-size:13px;font-weight:700;color:#64748b;">Service</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#0F172A;">${job.service}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="font-size:13px;font-weight:700;color:#64748b;">Address</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#0F172A;">${job.property?.address || "—"}, ${job.property?.postcode || ""}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="font-size:13px;font-weight:700;color:#64748b;">Date</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#0F172A;">${job.schedule?.date ? new Date(job.schedule.date).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : "—"}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="font-size:13px;font-weight:700;color:#64748b;">Time Slot</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#0F172A;">${job.schedule?.timeSlot || "—"}</td>
        </tr>
        ${job.contact?.name ? `<tr><td style="font-size:13px;font-weight:700;color:#64748b;">Contact at Property</td><td align="right" style="font-size:13px;font-weight:700;color:#0F172A;">${job.contact.name} · ${job.contact.phone || ""}</td></tr>` : ""}
      </table>
    </div>
    <p style="color:#64748b;font-size:14px;">You'll receive another email once our team approves your job and assigns a cleaner. If you have any questions, reply to this email.</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">Cleaniq Services · cleaniqservices.com</p>
    </div>
  </div>
</div>`;

const jobApprovedEmail = (job, booking) => `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;background:#fff;">
  <div style="background:#083D2E;padding:36px;text-align:center;">
    <div style="width:60px;height:60px;border-radius:50%;background:#6EE7B7;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
      <span style="font-size:28px;">✓</span>
    </div>
    <h1 style="color:#6EE7B7;margin:0;font-size:26px;">Job Approved!</h1>
    <p style="color:#94a3b8;margin-top:8px;">Your cleaning job is confirmed</p>
  </div>
  <div style="padding:36px;color:#1e293b;">
    <p style="font-size:16px;">Hi <strong>${job.company?.name || "there"}</strong>,</p>
    <p>Great news! Your job request has been <strong style="color:#0F6B4C;">approved</strong> and a booking has been created. We're now finding the best available cleaner for your job.</p>
    <div style="background:#E4F7EE;border-radius:16px;padding:20px 24px;margin:20px 0;border:1px solid #0F6B4C30;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <p style="margin:0;font-size:11px;font-weight:800;color:#0F6B4C;text-transform:uppercase;letter-spacing:1px;">Job Reference</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#083D2E;">${job.jobId}</p>
        </div>
        ${booking ? `<div>
          <p style="margin:0;font-size:11px;font-weight:800;color:#0F6B4C;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#083D2E;">${booking.bookingId}</p>
        </div>` : ""}
      </div>
    </div>
    <div style="background:#f8fafc;border-radius:16px;padding:24px;margin:20px 0;border:1px solid #e2e8f0;">
      <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="font-size:13px;font-weight:700;color:#64748b;">Service</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#0F172A;">${job.service}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="font-size:13px;font-weight:700;color:#64748b;">Date</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#0F172A;">${job.schedule?.date ? new Date(job.schedule.date).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : "—"}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="font-size:13px;font-weight:700;color:#64748b;">Time Slot</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#0F172A;">${job.schedule?.timeSlot || "—"}</td>
        </tr>
        <tr>
          <td style="font-size:13px;font-weight:700;color:#64748b;">Address</td>
          <td align="right" style="font-size:13px;font-weight:700;color:#0F172A;">${job.property?.address || "—"}</td>
        </tr>
      </table>
    </div>
    <p style="color:#64748b;font-size:14px;">You'll receive a further update once a cleaner is assigned. If you need to make any changes, please contact us.</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">Cleaniq Services · cleaniqservices.com</p>
    </div>
  </div>
</div>`;

const jobRejectedEmail = (job, reason) => `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;background:#fff;">
  <div style="background:#1e0a0a;padding:36px;text-align:center;">
    <h1 style="color:#FCA5A5;margin:0;font-size:26px;">Job Request Update</h1>
    <p style="color:#94a3b8;margin-top:8px;">Regarding your recent submission</p>
  </div>
  <div style="padding:36px;color:#1e293b;">
    <p style="font-size:16px;">Hi <strong>${job.company?.name || "there"}</strong>,</p>
    <p>After reviewing your job request <strong>${job.jobId}</strong>, we're unfortunately unable to fulfil it at this time.</p>
    <div style="background:#FEF2F2;border-radius:14px;padding:18px 22px;margin:20px 0;border-left:4px solid #EF4444;">
      <p style="margin:0;font-size:12px;font-weight:800;color:#b91c1c;text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
      <p style="margin:6px 0 0;font-size:15px;color:#7f1d1d;">${reason || "Please contact us for further information."}</p>
    </div>
    <p style="color:#64748b;font-size:14px;">We're sorry for any inconvenience. You're welcome to submit a new request or contact our team if you'd like to discuss this further.</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">Cleaniq Services · cleaniqservices.com</p>
    </div>
  </div>
</div>`;

const JWT_SECRET = process.env.JWT_SECRET || "cleaniq_customer_secret_2024";

const verifyCompany = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    if (decoded.role !== "company")
      return res.status(403).json({ message: "Company accounts only" });
    req.customer = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const verifyCustomerAny = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });
  try {
    req.customer = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// POST /api/jobs — company posts a new job
router.post("/", verifyCompany, async (req, res) => {
  try {
    const company = await Customer.findById(req.customer.id);
    if (!company) return res.status(404).json({ message: "Account not found" });

    const jobId = "JOB-" + nanoid(8).toUpperCase();
    const job = await Job.create({
      jobId,
      company: {
        id:    company._id,
        name:  company.companyName || `${company.firstName} ${company.lastName}`,
        email: company.email,
        phone: company.phone,
      },
      service:  req.body.service,
      contact:  req.body.contact  || {},
      details:  req.body.details,
      property: req.body.property,
      schedule: req.body.schedule,
      region:   req.body.region || "",
      notes:    req.body.notes || "",
    });

    // Emails: confirmation to company + notification to admin
    setImmediate(async () => {
      try {
        await sendEmail({
          to: company.email,
          subject: `Job Request Received – ${job.jobId}`,
          html: jobSubmittedEmail(job),
        });
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `[New Job] ${job.jobId} – ${job.service} – ${job.company.name}`,
          html: `<p><strong>New job submitted:</strong> ${job.jobId}</p><p>Company: ${job.company.name}</p><p>Service: ${job.service}</p><p>Date: ${job.schedule?.date ? new Date(job.schedule.date).toDateString() : "—"}</p><p>Address: ${job.property?.address || "—"}</p>`,
        });
      } catch (e) { console.error("Job submit email error:", e.message); }
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/my — get all jobs posted by this company
router.get("/my", verifyCompany, async (req, res) => {
  try {
    const jobs = await Job.find({ "company.id": req.customer.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/slots?date=YYYY-MM-DD — available time slots for a date
router.get("/slots", verifyCompany, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date is required" });

    const dayStart = new Date(date + "T00:00:00.000Z");
    const dayEnd   = new Date(date + "T23:59:59.999Z");

    const bookings = await Booking.find({
      "schedule.date": { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["Cancelled"] },
    });

    const takenSlots = new Set();
    const takenTimes = new Set();

    bookings.forEach(b => {
      const slot = b.schedule?.timeSlot;
      if (slot && slot !== "Flexible") takenSlots.add(slot);
      if (slot === "Flexible" && b.schedule?.preferredTime) {
        takenTimes.add(b.schedule.preferredTime);
        const [h] = b.schedule.preferredTime.split(":").map(Number);
        if      (h < 12) takenSlots.add("Morning");
        else if (h < 16) takenSlots.add("Afternoon");
        else             takenSlots.add("Evening");
      }
    });

    const ALL_SLOTS = ["Morning", "Afternoon", "Evening"];
    const available = ALL_SLOTS.filter(s => !takenSlots.has(s));

    // All 30-min specific times 08:00 – 20:00
    const allTimes = [];
    for (let h = 8; h < 20; h++) {
      allTimes.push(`${String(h).padStart(2, "0")}:00`);
      allTimes.push(`${String(h).padStart(2, "0")}:30`);
    }
    allTimes.push("20:00");

    const availableTimes = allTimes.filter(t => !takenTimes.has(t));

    res.json({
      available,
      taken:          [...takenSlots],
      takenTimes:     [...takenTimes],
      availableTimes,
      bookingCount:   bookings.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/:id — get single job detail
router.get("/:id", verifyCustomerAny, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    // companies can only see their own jobs
    if (req.customer.role === "company" && job.company.id.toString() !== req.customer.id)
      return res.status(403).json({ message: "Not authorised" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Admin routes (no auth middleware — admin uses its own auth) ---

// GET /api/jobs — admin gets all jobs
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/jobs/:id/approve — admin approves and creates a booking
router.put("/:id/approve", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const bookingId = "BK" + nanoid(8).toUpperCase();
    const booking = await Booking.create({
      bookingId,
      customer: {
        firstName: job.contact?.name  || job.company.name,
        lastName:  "",
        email:     job.contact?.email || job.company.email,
        phone:     job.contact?.phone || job.company.phone,
      },
      service:  job.service,
      details:  job.details,
      property: job.property,
      schedule: job.schedule,
      region:   job.region,
      status:   "Confirmed",
      leadSource:      "Company Job",
      noPaymentRequired: true,
      meta: { jobId: job._id },
    });

    job.status = "approved";
    job.linkedBookingId = booking._id;
    await job.save();

    // Email company
    setImmediate(async () => {
      try {
        await sendEmail({
          to: job.company.email,
          subject: `✓ Job Approved – ${job.jobId} | Cleaniq Services`,
          html: jobApprovedEmail(job, booking),
        });
        // Also email the contact person if they have an email
        if (job.contact?.email && job.contact.email !== job.company.email) {
          await sendEmail({
            to: job.contact.email,
            subject: `Upcoming Cleaning – ${new Date(job.schedule?.date || Date.now()).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}`,
            html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;background:#f8fafc;border-radius:16px;"><h2 style="color:#0F6B4C;">Hi ${job.contact.name},</h2><p>A cleaning has been arranged at your property:</p><p><strong>Date:</strong> ${job.schedule?.date ? new Date(job.schedule.date).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : "—"}</p><p><strong>Time:</strong> ${job.schedule?.timeSlot || "—"}</p><p><strong>Service:</strong> ${job.service}</p><p>Our cleaner will contact you on arrival. If you have any questions please contact ${job.company.name}.</p><p style="color:#94a3b8;font-size:12px;margin-top:24px;">Cleaniq Services</p></div>`,
          });
        }
      } catch (e) { console.error("Job approved email error:", e.message); }
    });

    res.json({ job, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/jobs/:id/reject — admin rejects a job
router.put("/:id/reject", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    job.status = "rejected";
    job.rejectedReason = req.body.reason || "";
    await job.save();

    // Email company
    setImmediate(async () => {
      try {
        await sendEmail({
          to: job.company.email,
          subject: `Job Request Update – ${job.jobId} | Cleaniq Services`,
          html: jobRejectedEmail(job, job.rejectedReason),
        });
      } catch (e) { console.error("Job rejected email error:", e.message); }
    });

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
