const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { sendEmail, templates } = require('../utils/emailService');

// GET all bookings (Admin)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('assignedWorker', 'firstName lastName email phone region workerId')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE ALL bookings (Admin) - IMPORTANT: Must be above /:id
router.delete('/all/delete', async (req, res) => {
  try {
    console.log('☢️ CLEARING ALL BOOKINGS...');
    await Booking.deleteMany({});
    res.json({ message: 'All bookings cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new booking
// POST a new booking
router.post('/', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    // Explicitly set Mixed fields to bypass potential strict schema stripping
    booking.set('details', req.body.details);
    booking.set('property', req.body.property);
    booking.set('meta', req.body.meta);
    
    const newBooking = await booking.save();
    
    // Send Confirmation Email to Customer
    await sendEmail({
      to: newBooking.customer.email,
      subject: "Your Cleaniq Booking is Confirmed!",
      html: templates.bookingConfirmation(newBooking)
    });

    // Send Alert Email to Admin
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `🚨 New Booking: ${newBooking.bookingId}`,
      html: templates.adminNewBookingAlert(newBooking)
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

// DELETE a single booking (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
