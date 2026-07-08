const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');

router.get('/stats', async (req, res) => {
  try {
    const byStatus = await Contract.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' },
          totalMonthly: { $sum: '$monthlyValue' },
        },
      },
    ]);
    const totals = await Contract.aggregate([
      { $group: { _id: null, totalValue: { $sum: '$value' }, totalMonthly: { $sum: '$monthlyValue' } } },
    ]);
    res.json({ byStatus, totals: totals[0] || { totalValue: 0, totalMonthly: 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const contracts = await Contract.find(filter).sort({ createdAt: -1 });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const contract = new Contract(req.body);
    await contract.save();
    res.status(201).json(contract);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json({ message: 'Contract deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
