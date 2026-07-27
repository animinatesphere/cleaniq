const express = require('express');
const router = express.Router();
const SystemSetting = require('../models/SystemSetting');

// Public endpoint — no auth needed, mobile app reads this to decide whether to show prices
router.get('/show-prices', async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: 'showPricesPublic' });
    res.json({ showPrices: setting ? Boolean(setting.value) : true });
  } catch (err) {
    res.json({ showPrices: true }); // default open if DB unreachable
  }
});

// GET all settings
router.get('/', async (req, res) => {
  try {
    const settings = await SystemSetting.find();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST or update a setting
router.post('/', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    let setting = await SystemSetting.findOne({ key });
    if (setting) {
      setting.value = value;
      setting.updatedAt = new Date();
      await setting.save();
    } else {
      setting = new SystemSetting({ key, value });
      await setting.save();
    }
    res.json(setting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
