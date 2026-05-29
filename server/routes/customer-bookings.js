const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { verifyCustomer } = require('./customer-auth');

// GET /api/customer-bookings  — fetch all bookings for the logged-in customer (by email)
router.get('/', verifyCustomer, async (req, res) => {
  try {
    const bookings = await Booking.find({ 'customer.email': req.customer.email })
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/customer-bookings/:id/cancel — cancel a booking (only if future + Confirmed)
router.put('/:id/cancel', verifyCustomer, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Ownership check
    if ((booking.customer.email || '').toLowerCase() !== req.customer.email.toLowerCase()) {
      return res.status(403).json({ message: 'You can only cancel your own bookings.' });
    }

    // Only allow cancelling Confirmed or Pending bookings in the future
    if (booking.status !== 'Confirmed' && booking.status !== 'Pending') {
      return res.status(400).json({ message: `Booking cannot be cancelled (current status: ${booking.status}).` });
    }
    const bookingDate = new Date(booking.schedule?.date);
    if (bookingDate <= new Date()) {
      return res.status(400).json({ message: 'You can only cancel bookings that are in the future.' });
    }

    booking.status = 'Cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled successfully.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
