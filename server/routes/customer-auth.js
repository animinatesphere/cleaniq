const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const JWT_SECRET = process.env.JWT_SECRET || 'cleaniq_customer_secret_2024';

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
