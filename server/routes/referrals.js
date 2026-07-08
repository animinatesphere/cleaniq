const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');

router.get('/stats', async (req, res) => {
  try {
    const total = await Referral.countDocuments();
    const booked = await Referral.countDocuments({ status: 'booked' });
    const completed = await Referral.countDocuments({ status: { $in: ['completed', 'rewarded'] } });
    const rewardsAgg = await Referral.aggregate([
      { $match: { rewardPaid: true } },
      { $group: { _id: null, totalRewardsPaid: { $sum: '$rewardAmount' } } },
    ]);
    res.json({
      total,
      booked,
      completed,
      totalRewardsPaid: rewardsAgg[0] ? rewardsAgg[0].totalRewardsPaid : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const referrals = await Referral.find().sort({ createdAt: -1 });
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const referral = new Referral(req.body);
    await referral.save();
    res.status(201).json(referral);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const referral = await Referral.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!referral) return res.status(404).json({ message: 'Referral not found' });
    res.json(referral);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const referral = await Referral.findByIdAndDelete(req.params.id);
    if (!referral) return res.status(404).json({ message: 'Referral not found' });
    res.json({ message: 'Referral deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
