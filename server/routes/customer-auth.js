const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const { sendEmail } = require('../utils/emailService');


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

    const token = jwt.sign(
      { id: customer._id, email: customer.email, firstName: customer.firstName, lastName: customer.lastName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.status(201).json({
      token,
      customer: { id: customer._id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone }
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

    const token = jwt.sign(
      { id: customer._id, email: customer.email, firstName: customer.firstName, lastName: customer.lastName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.status(201).json({
      token,
      customer: { id: customer._id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone }
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

    const token = jwt.sign(
      { id: customer._id, email: customer.email, firstName: customer.firstName, lastName: customer.lastName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      token,
      customer: { id: customer._id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone }
    });
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

module.exports = router;
module.exports.verifyCustomer = verifyCustomer;
module.exports.JWT_SECRET = JWT_SECRET;
