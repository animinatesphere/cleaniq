const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');

// Mobile App Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find worker by email
    const worker = await Worker.findOne({ email });
    if (!worker) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if access is granted and not suspended
    if (!worker.appAccessGranted || worker.status === 'Suspended') {
      return res.status(403).json({ error: 'App access is denied or suspended.' });
    }

    // Verify password (currently using tempPassword, in future hash check)
    // Note: If they set a permanent password later, you'd check that instead or alongside.
    if (worker.tempPassword !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Automatically activate the worker if they were Pending and successfully logged in
    if (worker.status === 'Pending') {
      worker.status = 'Active';
      await worker.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { workerId: worker._id, email: worker.email, region: worker.region },
      process.env.JWT_SECRET || 'cleaniq_super_secret_mobile_key',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      worker: {
        id: worker._id,
        workerId: worker.workerId,
        firstName: worker.firstName,
        lastName: worker.lastName,
        email: worker.email,
        status: worker.status,
        region: worker.region
      }
    });
  } catch (error) {
    console.error('Login error detailed:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Generate random password
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10).toString();
};

// GET available jobs (all bookings without region restriction)
router.get('/jobs', async (req, res) => {
  try {
    // Fetch bookings that need cleaning (Confirmed or Pending)
    const jobs = await Booking.find({ 
      status: { $in: ['Confirmed', 'Pending'] } 
    }).sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal server error fetching jobs' });
  }
});

// GET jobs accepted by a specific worker
router.get('/jobs/my-jobs/:workerId', async (req, res) => {
  try {
    const jobs = await Booking.find({ 
      assignedWorker: req.params.workerId 
    }).sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching my jobs:', error);
    res.status(500).json({ error: 'Internal server error fetching my jobs' });
  }
});

// POST accept a job
router.post('/jobs/:id/accept', async (req, res) => {
  try {
    const { workerId, workerName } = req.body;
    
    // Find the booking and make sure it is not already assigned
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.assignedWorker) {
      return res.status(400).json({ error: 'Job has already been accepted by someone else' });
    }
    
    // Update booking
    booking.assignedWorker = workerId;
    booking.assignedWorkerName = workerName;
    booking.status = 'Assigned';
    
    await booking.save();
    
    res.json({ message: 'Job accepted successfully', booking });
  } catch (error) {
    console.error('Error accepting job:', error);
    res.status(500).json({ error: 'Internal server error accepting job' });
  }
});

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
