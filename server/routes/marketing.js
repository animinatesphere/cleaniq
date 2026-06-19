const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const { sendEmail } = require('../utils/emailService');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const campaignEmailHtml = (message) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
    <div style="background: #0F172A; padding: 30px; text-align: center; color: white;">
      <h1 style="margin: 0; color: #6EE7B7;">Cleaniq Services</h1>
    </div>
    <div style="padding: 40px; color: #334155; line-height: 1.6;">
      <p style="white-space: pre-wrap;">${message}</p>
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        You received this because you're a Cleaniq customer or contacted us about our services.
        <br />UK & Nigeria Premium Cleaning Services
      </p>
    </div>
  </div>
`;

/**
 * POST /api/marketing/send
 * Send an email campaign right now, to one of:
 *  - "all"    every unique customer email (from Bookings + Customer accounts)
 *  - "leads"  everyone who's submitted the Contact Us form
 *  - "custom" a hand-picked list of email addresses
 */
router.post('/send', async (req, res) => {
  const { subject, message, recipientType = 'custom', recipients = [] } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required.' });
  }

  try {
    let emails = [];

    if (recipientType === 'all') {
      const [bookings, customers] = await Promise.all([
        Booking.find({}, 'customer.email'),
        Customer.find({}, 'email'),
      ]);
      emails = [
        ...bookings.map((b) => b.customer?.email),
        ...customers.map((c) => c.email),
      ];
    } else if (recipientType === 'leads') {
      const leads = await Lead.find({}, 'email');
      emails = leads.map((l) => l.email);
    } else {
      emails = Array.isArray(recipients) ? recipients : [];
    }

    emails = [...new Set(emails.filter(Boolean).map((e) => e.trim().toLowerCase()))]
      .filter(isValidEmail);

    if (emails.length === 0) {
      return res.status(400).json({ message: 'No valid recipients found for this campaign.' });
    }

    console.log(`📢 Sending campaign "${subject}" to ${emails.length} recipient(s)...`);

    const html = campaignEmailHtml(message);
    const results = await Promise.allSettled(
      emails.map((email) => sendEmail({ to: email, subject, html })),
    );
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value,
    ).length;

    const campaign = await Campaign.create({
      subject,
      message,
      recipientType,
      recipients: emails,
      recipientCount: successCount,
    });

    res.json({
      message: `Campaign sent to ${successCount} of ${emails.length} recipient(s).`,
      campaign,
    });
  } catch (error) {
    console.error('Campaign send error:', error);
    res.status(500).json({ message: 'Failed to send campaign.' });
  }
});

/**
 * GET /api/marketing/campaigns
 * Recent campaign history
 */
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ sentAt: -1 }).limit(50);
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
