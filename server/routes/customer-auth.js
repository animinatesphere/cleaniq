const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const { sendEmail } = require('../utils/emailService');

// Save a new customer as a lead (name/email/phone) for future marketing,
// skipping anyone already captured by an earlier booking/quote/contact.
const captureCustomerLead = async (customer) => {
  try {
    const email = (customer.email || '').trim().toLowerCase();
    if (!email) return;
    const existing = await Lead.findOne({ email });
    if (!existing) {
      await Lead.create({
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        email,
        phone: customer.phone || '',
        source: 'Website Signup',
        acknowledged: true,
      });
    }
  } catch (err) {
    console.error('⚠️ Failed to capture signup lead:', err.message);
  }
};


const JWT_SECRET = process.env.JWT_SECRET || 'cleaniq_customer_secret_2024';

// In-memory OTP store: { email: { code, expiresAt, pendingData } }
const otpStore = new Map();

// Middleware to verify customer token
const verifyCustomer = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.customer = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// POST /api/customer-auth/send-otp  — generate & email a 6-digit OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store pending registration data + OTP
    otpStore.set(email.toLowerCase(), { code, expiresAt, pendingData: { firstName, lastName, email: email.toLowerCase(), phone: phone || '', password } });

    // Send OTP email
    await sendEmail({
      to: email,
      subject: 'Your Cleaniq Verification Code',
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;background:#fff;">
          <div style="background:#0F172A;padding:36px;text-align:center;">
            <h1 style="color:#6EE7B7;margin:0;font-size:22px;font-weight:800;">Verify Your Email</h1>
            <p style="color:#94a3b8;margin-top:8px;font-size:14px;">Cleaniq Services</p>
          </div>
          <div style="padding:40px;color:#1e293b;line-height:1.6;">
            <h2 style="font-size:18px;margin-top:0;">Hi ${firstName},</h2>
            <p>Use the code below to verify your email and complete your Cleaniq account setup.</p>
            <div style="margin:32px 0;text-align:center;">
              <div style="display:inline-block;background:#F8FAFC;border:2px solid #e2e8f0;border-radius:20px;padding:28px 48px;">
                <p style="margin:0;font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
                <p style="margin:12px 0 0 0;font-size:48px;font-weight:900;color:#0F172A;letter-spacing:12px;">${code}</p>
              </div>
            </div>
            <p style="font-size:13px;color:#64748b;text-align:center;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">If you did not request this, please ignore this email.</p>
              <p style="margin:8px 0 0 0;font-size:12px;color:#94a3b8;">© 2026 Cleaniq Services. All rights reserved.</p>
            </div>
          </div>
        </div>
      `
    });

    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-auth/verify-otp  — verify OTP and create account
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required.' });

    const entry = otpStore.get(email.toLowerCase());
    if (!entry) return res.status(400).json({ message: 'No verification request found. Please sign up again.' });
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: 'Verification code has expired. Please sign up again.' });
    }
    if (entry.code !== String(code).trim()) {
      return res.status(400).json({ message: 'Incorrect verification code. Please try again.' });
    }

    // Code correct — create the account
    otpStore.delete(email.toLowerCase());
    const { firstName, lastName, phone, password } = entry.pendingData;

    // Double-check email not taken while waiting
    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const customer = new Customer({ firstName, lastName, email: email.toLowerCase(), phone, passwordHash });
    await customer.save();
    await captureCustomerLead(customer);

    const token = jwt.sign(
      { id: customer._id, email: customer.email, firstName: customer.firstName, lastName: customer.lastName, role: customer.role || 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.status(201).json({
      token,
      customer: { id: customer._id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone, role: customer.role || 'customer' }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const customer = new Customer({ firstName, lastName, email: email.toLowerCase(), phone: phone || '', passwordHash });
    await customer.save();
    await captureCustomerLead(customer);

    const token = jwt.sign(
      { id: customer._id, email: customer.email, firstName: customer.firstName, lastName: customer.lastName, role: customer.role || 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.status(201).json({
      token,
      customer: { id: customer._id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone, role: customer.role || 'customer' }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) return res.status(401).json({ message: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });

    await Customer.findByIdAndUpdate(customer._id, {
      $set:  { lastLoginAt: new Date() },
      $inc:  { loginCount: 1 },
    });

    const token = jwt.sign(
      { id: customer._id, email: customer.email, firstName: customer.firstName, lastName: customer.lastName, role: customer.role || 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      token,
      customer: { id: customer._id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone, role: customer.role || 'customer', companyName: customer.companyName || '' }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-auth/logout  (record logout time)
router.post('/logout', verifyCustomer, async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.customer.id, { $set: { lastLogoutAt: new Date() } });
    res.json({ message: 'Logged out.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer-auth/me  (verify token + return fresh profile)
router.get('/me', verifyCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-passwordHash');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-auth/push-token
router.post("/push-token", verifyCustomer, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "token is required" });
    await Customer.findByIdAndUpdate(req.customer.id, { expoPushToken: token });
    res.json({ message: "Push token saved." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/customer-auth/profile  (update name + phone)
router.patch('/profile', verifyCustomer, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const updates = {};
    if (firstName) updates.firstName = firstName.trim();
    if (lastName)  updates.lastName  = lastName.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    const customer = await Customer.findByIdAndUpdate(
      req.customer.id,
      { $set: updates },
      { new: true, select: '-passwordHash' },
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/customer-auth/account — permanently delete the customer's own account
router.delete('/account', verifyCustomer, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const customer = await Customer.findById(req.customer.id);
    if (!customer) return res.status(404).json({ message: 'Account not found' });

    // Anonymise bookings so business records stay intact but PII is removed
    await Booking.updateMany(
      { 'customer.email': customer.email.toLowerCase() },
      {
        $set: {
          'customer.firstName': 'Deleted',
          'customer.lastName':  'User',
          'customer.email':     `deleted_${customer._id}@removed.local`,
          'customer.phone':     '',
        },
      },
    );

    // Remove any lead record captured at signup
    await Lead.deleteOne({ email: customer.email.toLowerCase() });

    // Delete the account
    await customer.deleteOne();

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ message: 'Failed to delete account. Please try again.' });
  }
});

// POST /api/customer-auth/forgot-password — send OTP to reset password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) {
      // Don't reveal whether account exists
      return res.json({ message: 'If an account exists, a reset code has been sent.' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(`reset:${email.toLowerCase()}`, { code, expiresAt });

    await sendEmail({
      to: email,
      subject: 'Reset Your Cleaniq Password',
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;background:#fff;">
          <div style="background:#0F172A;padding:36px;text-align:center;">
            <h1 style="color:#6EE7B7;margin:0;font-size:22px;font-weight:800;">Password Reset</h1>
            <p style="color:#94a3b8;margin-top:8px;font-size:14px;">Cleaniq Services</p>
          </div>
          <div style="padding:40px;color:#1e293b;line-height:1.6;">
            <h2 style="font-size:18px;margin-top:0;">Hi ${customer.firstName},</h2>
            <p>We received a request to reset your Cleaniq password. Use the code below.</p>
            <div style="margin:32px 0;text-align:center;">
              <div style="display:inline-block;background:#F8FAFC;border:2px solid #e2e8f0;border-radius:20px;padding:28px 48px;">
                <p style="margin:0;font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:2px;">Reset Code</p>
                <p style="margin:12px 0 0 0;font-size:48px;font-weight:900;color:#0F172A;letter-spacing:12px;">${code}</p>
              </div>
            </div>
            <p style="font-size:13px;color:#64748b;text-align:center;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      `,
    });

    res.json({ message: 'If an account exists, a reset code has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-auth/reset-password — verify OTP and set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const key = `reset:${email.toLowerCase()}`;
    const entry = otpStore.get(key);
    if (!entry) {
      return res.status(400).json({ message: 'No reset request found. Please request a new code.' });
    }
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }
    if (entry.code !== String(code).trim()) {
      return res.status(400).json({ message: 'Incorrect code. Please try again.' });
    }

    otpStore.delete(key);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const customer = await Customer.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { passwordHash } },
      { new: true },
    );
    if (!customer) return res.status(404).json({ message: 'Account not found.' });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.verifyCustomer = verifyCustomer;
module.exports.JWT_SECRET = JWT_SECRET;
