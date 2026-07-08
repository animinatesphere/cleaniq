const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    const { stage, search } = req.query;
    const filter = {};
    if (stage) filter.stage = stage;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/leads
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message, serviceInterest, source, stage } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }
    const lead = await Lead.create({
      name,
      email,
      phone: phone || '',
      message: message || '',
      serviceInterest: serviceInterest || '',
      source: source || 'Manual',
      stage: stage || 'New',
    });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/leads/:id
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['name', 'email', 'phone', 'message', 'serviceInterest', 'source', 'stage', 'acknowledged'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
