const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { sendEmail, templates } = require('../utils/emailService');

// GET all bookings (Admin)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new booking
router.post('/', async (req, res) => {
  const booking = new Booking(req.body);
  try {
    const newBooking = await booking.save();
    
    // Send Confirmation Email
    await sendEmail({
      to: newBooking.customer.email,
      subject: "Your CleanIQ Booking is Confirmed!",
      html: templates.bookingConfirmation(
        newBooking.customer.firstName,
        newBooking.bookingId,
        new Date(newBooking.schedule.date).toDateString(),
        newBooking.schedule.timeSlot,
        newBooking.payment.amount,
        newBooking.payment.currency
      )
    });

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
