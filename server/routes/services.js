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

// Update a service by ID
router.put('/:id', async (req, res) => {
  try {
    const { name, region, rate, type, description } = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name, region, rate, type, description, updatedAt: Date.now() },
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
