const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');

// Generate random password
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10).toString();
};

// GET all workers
router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new worker
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, region } = req.body;
    
    // Check if email exists
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(400).json({ error: 'Worker with this email already exists' });
    }

    const workerId = `WK-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempPassword = generateTempPassword();

    const worker = new Worker({
      workerId,
      firstName,
      lastName,
      email,
      phone,
      region,
      status: 'Pending',
      tempPassword,
      appAccessGranted: true
    });

    await worker.save();
    
    // In a real app, send an email to the worker here with the tempPassword and app download links
    // await emailService.sendWorkerInvite(email, tempPassword);

    res.status(201).json(worker);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update worker status
router.put('/:id', async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedWorker);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE a worker
router.delete('/:id', async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
