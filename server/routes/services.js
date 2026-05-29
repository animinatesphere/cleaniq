const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// Get all services for a region
router.get('/', async (req, res) => {
  try {
    const { region } = req.query;
    const filter = region ? { region } : {};
    // Sort by updatedAt desc to get newest first
    const services = await Service.find(filter).sort({ updatedAt: -1 });
    
    // Deduplicate by trimmed name
    const uniqueServices = [];
    const seenNames = new Set();
    
    services.forEach(s => {
      const trimmedName = s.name.trim();
      if (!seenNames.has(trimmedName)) {
        seenNames.add(trimmedName);
        uniqueServices.push(s);
      }
    });
    
    res.json(uniqueServices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update a service
router.post('/', async (req, res) => {
  try {
    const { name, region, rate, type, description } = req.body;
    const trimmedName = name?.trim();
    
    // Find existing or create new
    let service = await Service.findOneAndUpdate(
      { name: trimmedName, region },
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

// Cleanup: remove duplicate services (keep newest per name+region)
router.post('/cleanup-duplicates', async (req, res) => {
  try {
    const all = await Service.find({}).sort({ updatedAt: -1 });
    const seen = new Set();
    const toDelete = [];

    all.forEach(s => {
      const key = `${s.name.trim().toLowerCase()}__${s.region}`;
      if (seen.has(key)) {
        toDelete.push(s._id);
      } else {
        seen.add(key);
      }
    });

    if (toDelete.length > 0) {
      await Service.deleteMany({ _id: { $in: toDelete } });
    }

    res.json({ message: `Cleaned up ${toDelete.length} duplicate(s).`, removed: toDelete.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a service
router.delete('/:id', async (req, res) => {
  try {
    // Safety check to prevent 500 CastError on invalid ObjectIds
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.json({ message: 'Fallback pseudo-service ignored' });
    }

    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
