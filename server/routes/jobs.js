const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const Job = require("../models/Job");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");

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
      details:  req.body.details,
      property: req.body.property,
      schedule: req.body.schedule,
      region:   req.body.region || "",
      notes:    req.body.notes || "",
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
        firstName: job.company.name,
        lastName:  "",
        email:     job.company.email,
        phone:     job.company.phone,
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
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
