const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

router.get('/stats', async (req, res) => {
  try {
    const byStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const bySeverity = await Complaint.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    res.json({ byStatus, bySeverity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, severity } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const complaint = new Complaint({ ...req.body, updatedAt: new Date() });
    await complaint.save();
    res.status(201).json(complaint);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.status === 'resolved' && !updates.resolvedAt) {
      updates.resolvedAt = new Date();
    }
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
