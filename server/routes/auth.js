const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'cleaniq_secret_key_2026', { expiresIn: '1d' });
    res.json({ token, username: admin.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/change-password', async (req, res) => {
  const { username, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    admin.password = newPassword; // The pre-save hook will hash this
    await admin.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
