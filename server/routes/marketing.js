const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/emailService');

// Send Broadcast Email to ALL Customers
router.post('/broadcast', async (req, res) => {
  const { subject, message } = req.body;

  try {
    // 1. Get all unique customer emails from the database
    const bookings = await Booking.find({}, 'customer');
    const emails = [...new Set(bookings.map(b => b.customer.email))];

    if (emails.length === 0) {
      return res.status(404).json({ message: 'No customers found to broadcast to.' });
    }

    console.log(`📢 Broadcasting to ${emails.length} customers...`);

    // 2. Loop through and send emails
    // Note: In production with Resend, you can use batch sending, 
    // but for now we'll do them in a promise map.
    const emailPromises = emails.map(email => 
      sendEmail({
        to: email,
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
            <div style="background: #0F172A; padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; color: #6EE7B7;">CleanIQ Services</h1>
            </div>
            <div style="padding: 40px; color: #334155; line-height: 1.6;">
              <h2 style="color: #0F172A;">Important Announcement</h2>
              <p style="white-space: pre-wrap;">${message}</p>
              <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                You received this because you are a valued CleanIQ customer.
                <br />UK & Nigeria Premium Cleaning Services
              </p>
            </div>
          </div>
        `
      })
    );

    await Promise.all(emailPromises);

    res.json({ message: `Successfully broadcasted to ${emails.length} customers!` });
  } catch (error) {
    console.error('Broadcast Error:', error);
    res.status(500).json({ message: 'Failed to send broadcast.' });
  }
});

module.exports = router;
