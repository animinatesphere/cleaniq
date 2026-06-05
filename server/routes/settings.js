const express = require('express');
const router = express.Router();
const SystemSetting = require('../models/SystemSetting');

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
