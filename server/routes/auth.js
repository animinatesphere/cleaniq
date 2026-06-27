const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail, templates } = require('../utils/emailService');

// Pages a "restricted" account can ever be granted. Dashboard (revenue) and
// Settings (which includes this very admin-management screen) are never
// grantable, regardless of what the creating superadmin requests.
const GRANTABLE_PERMISSIONS = [
  'bookings', 'calendar', 'quotes', 'services', 'leads', 'checklist',
  'recurring', 'email-history', 'invoice-builder', 'staff-pay', 'payments',
  'withdrawals', 'expenses', 'workers', 'applicants', 'customers', 'blog',
  'chat',
];

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'cleaniq_secret_key_2026', { expiresIn: '1d' });
    res.json({
      token,
      username: admin.username,
      role: admin.role || 'superadmin',
      permissions: admin.role === 'restricted' ? (admin.permissions || []) : [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/auth/admins
 * List all admin/staff accounts (excludes password hashes)
 */
router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/auth/admins
 * Create a new admin/staff account with a given role (e.g. a restricted
 * "restricted" account scoped to only the pages it's granted)
 */
router.post('/admins', async (req, res) => {
  const { username, email, password, role, permissions } = req.body;
  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'That username is already taken' });
    }
    const finalRole = role === 'superadmin' ? 'superadmin' : 'restricted';
    const finalPermissions =
      finalRole === 'restricted'
        ? (Array.isArray(permissions) ? permissions : []).filter((p) =>
            GRANTABLE_PERMISSIONS.includes(p),
          )
        : [];
    const admin = new Admin({
      username,
      email,
      password,
      role: finalRole,
      permissions: finalPermissions,
    });
    await admin.save();

    if (email) {
      await sendEmail({
        to: email,
        subject: 'Your Cleaniq Business Portal account is ready',
        html: templates.adminAccountInvite({ username, role: admin.role, tempPassword: password }),
      });
    }

    res.status(201).json({
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/auth/admins/:id
 * Remove an admin/staff account
 */
router.delete('/admins/:id', async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    if (admin.role === 'superadmin') {
      const superadminCount = await Admin.countDocuments({ role: 'superadmin' });
      if (superadminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last superadmin account' });
      }
    }
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin account deleted' });
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
