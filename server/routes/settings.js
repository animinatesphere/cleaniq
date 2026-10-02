const express = require('express');
const router = express.Router();
// Any change here (prices, AI settings, knowledge, tax) shows in the AI receptionist's next reply.
router.use((req, res, next) => {
  if (req.method !== "GET") res.on("finish", () => require("../utils/aiBrain").clearInstructionsCache());
  next();
});
const SystemSetting = require('../models/SystemSetting');
const adminAuth = require('../middleware/adminAuth');

// Public endpoint — no auth needed, mobile app reads this to decide whether to show prices
router.get('/show-prices', async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: 'showPricesPublic' });
    res.json({ showPrices: setting ? Boolean(setting.value) : true });
  } catch (err) {
    res.json({ showPrices: true }); // default open if DB unreachable
  }
});

// Public — the website and customer app add this tax to prices (see utils/tax.js).
router.get('/tax', async (req, res) => {
  const { getTax } = require('../utils/tax');
  res.json(await getTax());
});

// GET all settings
router.get('/', adminAuth, async (req, res) => {
  try {
    const settings = await SystemSetting.find();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST or update a setting
router.post('/', adminAuth, async (req, res) => {
  try {
    const { key } = req.body;
    let { value } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    if (key === 'tax') value = require('../utils/tax').cleanTax(value || {});
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
