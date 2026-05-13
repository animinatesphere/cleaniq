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
    
    // Send Confirmation Email to Customer
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

    // Send Alert Email to Admin
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `🚨 New Booking: ${newBooking.bookingId}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0F172A;">New Booking Received!</h2>
          <p><strong>Customer:</strong> ${newBooking.customer.firstName} ${newBooking.customer.lastName}</p>
          <p><strong>Service:</strong> ${newBooking.service}</p>
          <p><strong>Amount:</strong> ${newBooking.payment.currency} ${newBooking.payment.amount}</p>
          <p><strong>Location:</strong> ${newBooking.details.address}</p>
          <hr />
          <a href="https://cleaniqservices.com/admin/bookings" style="display: inline-block; padding: 10px 20px; background: #0F172A; color: white; text-decoration: none; border-radius: 5px;">View in Dashboard</a>
        </div>
      `
    });

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a booking (Admin)
router.put('/:id', async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedBooking) return res.status(404).json({ message: 'Booking not found' });
    res.json(updatedBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a booking (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE ALL bookings (Admin) - USE WITH CAUTION
router.delete('/all/delete', async (req, res) => {
  try {
    await Booking.deleteMany({});
    res.json({ message: 'All bookings cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
