const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, default: null },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'restricted'], default: 'superadmin' },
  // Only relevant when role is "restricted" — list of page keys this account may access.
  // Dashboard/Revenue and Settings are never grantable, regardless of this list.
  permissions: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Admin', adminSchema);
