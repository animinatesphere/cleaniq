const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Get unique customers from bookings
router.get('/', async (req, res) => {
  try {
    const customers = await Booking.aggregate([
      {
        $group: {
          _id: "$customer.email",
          firstName: { $first: "$customer.firstName" },
          lastName: { $first: "$customer.lastName" },
          phone: { $first: "$customer.phone" },
          totalBookings: { $sum: 1 },
          lastBooking: { $max: "$createdAt" },
          totalSpent: { $sum: "$payment.amount" },
          region: { $first: "$region" }
        }
      },
      {
        $project: {
          _id: 0,
          email: "$_id",
          firstName: 1,
          lastName: 1,
          phone: 1,
          totalBookings: 1,
          lastBooking: 1,
          totalSpent: 1,
          region: 1
        }
      },
      { $sort: { lastBooking: -1 } }
    ]);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
