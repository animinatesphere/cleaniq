const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Applicant = require('../models/Applicant');
const Worker = require('../models/Worker');
const { sendEmail, templates } = require('../utils/emailService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + suffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const genTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// GET all applicants
router.get('/', async (req, res) => {
  try {
    const applicants = await Applicant.find().sort({ createdAt: -1 });
    res.json(applicants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new application (multipart with documents)
router.post('/', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'idDocument', maxCount: 1 },
  { name: 'rightToWork', maxCount: 1 },
  { name: 'dbsCheck', maxCount: 1 },
]), async (req, res) => {
  try {
    const data = req.body.data ? JSON.parse(req.body.data) : req.body;

    const applicant = new Applicant({
      ...data,
      cvPath: req.files?.cv?.[0]?.path || null,
      idPath: req.files?.idDocument?.[0]?.path || null,
      rightToWorkPath: req.files?.rightToWork?.[0]?.path || null,
      dbsCheckPath: req.files?.dbsCheck?.[0]?.path || null,
      status: 'Applied',
    });

    const saved = await applicant.save();

    await sendEmail({
      to: saved.email,
      subject: 'Application Received – Cleaniq Services',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#064E3B">Application Received</h2>
        <p>Hi ${saved.fullName},</p>
        <p>Thank you for applying to join Cleaniq Services. We have received your application and documents.</p>
        <p>Our team will review your documents within <strong>24–72 hours</strong>. You will receive an email once your application has been reviewed.</p>
        <p>Please do not reply to this email. If you have questions, contact us at info@cleaniqservices.com.</p>
        <p style="color:#6B7280;font-size:12px">Cleaniq Services · London, UK</p>
      </div>`
    });

    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `🚨 New Worker Application: ${saved.fullName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>New Job Application</h2>
        <p><strong>Source:</strong> ${saved.source || 'Unknown'}</p>
        <p><strong>Name:</strong> ${saved.fullName}</p>
        <p><strong>Email:</strong> ${saved.email}</p>
        <p><strong>Phone:</strong> ${saved.phone || '—'}</p>
        <p><strong>Right to Work Code:</strong> ${saved.rightToWorkCode || '—'}</p>
        <p><strong>Experience:</strong> ${saved.experience || '—'}</p>
        <p>Documents: CV ${saved.cvPath ? '✅' : '❌'} | ID ${saved.idPath ? '✅' : '❌'} | Right to Work ${saved.rightToWorkPath ? '✅' : '❌'} | DBS ${saved.dbsCheckPath ? '✅' : '❌'}</p>
        <a href="https://www.cleaniqservices.com/admin/applicants" style="display:inline-block;padding:10px 20px;background:#064E3B;color:#fff;border-radius:6px;text-decoration:none;margin-top:12px">Review Application</a>
      </div>`
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Helper: create Worker account from a hired applicant
async function createWorkerFromApplicant(applicant) {
  const existingWorker = await Worker.findOne({ email: applicant.email });
  if (existingWorker) return existingWorker;

  const nameParts = applicant.fullName.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '-';

  const tempPassword = genTempPassword();
  const workerId = 'WK-' + Date.now();

  const worker = new Worker({
    workerId,
    firstName,
    lastName,
    email: applicant.email,
    phone: applicant.phone || '',
    region: applicant.region || 'UK',
    role: 'Cleaner',
    status: 'Active',
    appAccessGranted: true,
    tempPassword,
    profileCompleted: false,
  });

  await worker.save();

  await sendEmail({
    to: applicant.email,
    subject: '🎉 You have been approved – Cleaniq Services',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#064E3B">Welcome to Cleaniq Services!</h2>
      <p>Hi ${firstName},</p>
      <p>Your application has been reviewed and approved. You can now log in to the Cleaniq Worker App.</p>
      <div style="background:#F0FDF4;border:1px solid #A7F3D0;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0 0 6px 0"><strong>Login Email:</strong> ${applicant.email}</p>
        <p style="margin:0"><strong>Temporary Password:</strong> <span style="font-size:18px;font-weight:700;color:#064E3B">${tempPassword}</span></p>
      </div>
      <p>Please download the <strong>Cleaniq Worker App</strong> and log in with the credentials above. You will be asked to complete your profile on first login.</p>
      <p style="color:#EF4444;font-size:13px">Keep these credentials safe. Do not share them with anyone.</p>
      <p style="color:#6B7280;font-size:12px">Cleaniq Services · London, UK</p>
    </div>`
  });

  return worker;
}

// PUT full applicant update
router.put('/:id', async (req, res) => {
  try {
    const updated = await Applicant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Applicant not found' });

    if (req.body.status === 'Hired') {
      const worker = await createWorkerFromApplicant(updated);
      return res.json({ applicant: updated, worker });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT status-only update
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const applicant = await Applicant.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });

    if (status === 'Hired') {
      const worker = await createWorkerFromApplicant(applicant);
      return res.json({ applicant, worker });
    }

    res.json(applicant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE applicant
router.delete('/:id', async (req, res) => {
  try {
    await Applicant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Applicant deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE all applicants
router.delete('/all/delete', async (req, res) => {
  try {
    await Applicant.deleteMany({});
    res.json({ message: 'All applicants deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
