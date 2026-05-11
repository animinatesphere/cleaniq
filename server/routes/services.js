const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// Get all services for a region
router.get('/', async (req, res) => {
  try {
    const { region } = req.query;
    const filter = region ? { region } : {};
    const services = await Service.find(filter);
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update a service
router.post('/', async (req, res) => {
  try {
    const { name, region, rate, type, description } = req.body;
    
    // Find existing or create new
    let service = await Service.findOneAndUpdate(
      { name, region },
      { rate, type, description, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
