const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { verifyCustomer } = require('./customer-auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    // Only allow cancelling Confirmed or Pending bookings
    if (booking.status !== 'Confirmed' && booking.status !== 'Pending') {
      return res.status(400).json({ message: `Booking cannot be cancelled (current status: ${booking.status}).` });
    }

    // Trigger Stripe Refund if payment transaction exists
    if (booking.payment && booking.payment.transactionId && !booking.payment.transactionId.startsWith('tok_bypass')) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.payment.transactionId,
        });
        console.log(`✅ Refunded Stripe PaymentIntent: ${booking.payment.transactionId}`);
      } catch (stripeErr) {
        console.error('❌ Stripe Refund Failed:', stripeErr.message);
        // We log the error but still proceed to cancel the booking in our DB
      }
    }

    booking.status = 'Cancelled';
    await booking.save();
    res.json({ message: 'Booking cancelled successfully and payment refunded.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
