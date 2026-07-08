const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['note', 'call', 'email', 'follow-up', 'other'], default: 'note' },
  status: { type: String, enum: ['open', 'in-progress', 'done'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: Date,
  customerId: String,
  customerName: String,
  bookingId: String,
  bookingRef: String,
  assignedTo: String,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
