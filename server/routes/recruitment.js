const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Applicant = require('../models/Applicant');

// Configure Multer for File Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET all applicants (Admin)
router.get('/', async (req, res) => {
  try {
    const applicants = await Applicant.find().sort({ createdAt: -1 });
    res.json(applicants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new application (with files)
router.post('/', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'idDocument', maxCount: 1 }
]), async (req, res) => {
  try {
    const applicantData = JSON.parse(req.body.data);
    
    const applicant = new Applicant({
      ...applicantData,
      cvPath: req.files['cv'] ? req.files['cv'][0].path : null,
      idPath: req.files['idDocument'] ? req.files['idDocument'][0].path : null,
    });

    const newApplicant = await applicant.save();
    res.status(201).json(newApplicant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE applicant status (Admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const applicant = await Applicant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
    res.json(applicant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE applicant (Admin)
router.delete('/:id', async (req, res) => {
  try {
    await Applicant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Applicant deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
