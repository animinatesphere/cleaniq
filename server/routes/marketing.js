const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const { sendEmail } = require('../utils/emailService');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Professional, table-based campaign template — matches the quality of the
// quote/booking emails and renders reliably across Outlook, Gmail, etc.
const campaignEmailHtml = (subject, message) => `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">

            <!-- HEADER -->
            <tr>
              <td style="background-color: #0f172a; padding: 36px 40px; text-align: center;">
                <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Services" style="height: 48px; width: auto; margin-bottom: 14px;" />
                <p style="margin: 0; font-size: 11px; font-weight: bold; letter-spacing: 2px; color: #6ee7b7; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">Cleaniq Services</p>
              </td>
            </tr>

            <!-- SUBJECT / HEADLINE -->
            <tr>
              <td style="padding: 40px 40px 0;">
                <h1 style="margin: 0; font-size: 22px; color: #0f172a; font-family: Arial, Helvetica, sans-serif;">${subject}</h1>
              </td>
            </tr>

            <!-- MESSAGE -->
            <tr>
              <td style="padding: 20px 40px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #334155; white-space: pre-wrap; font-family: Arial, Helvetica, sans-serif;">${message}</p>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding: 36px 40px; text-align: center;">
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 6px; background-color: #005B41;">
                      <a href="https://cleaniqservices.com/booking" style="display: inline-block; padding: 14px 36px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">Book a Cleaning</a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8; font-family: Arial, Helvetica, sans-serif;">Or reply to this email — it goes straight to our team.</p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center;">
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f172a; font-family: Arial, Helvetica, sans-serif;">Cleaniq Services Limited</p>
                <p style="margin: 6px 0 0; font-size: 12px; color: #64748b; font-family: Arial, Helvetica, sans-serif;">info@cleaniqservices.com &nbsp;&middot;&nbsp; cleaniqservices.com &nbsp;&middot;&nbsp; +44 7752 476368</p>
                <p style="margin: 10px 0 0; font-size: 11px; color: #94a3b8; font-family: Arial, Helvetica, sans-serif;">You received this because you're a Cleaniq customer or contacted us about our services.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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

    const html = campaignEmailHtml(subject, message);
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
 * POST /api/marketing/campaign
 * Queue a named campaign and send 1 email per minute in the background.
 * Returns immediately — poll GET /api/marketing/campaigns for progress.
 */
router.post('/campaign', async (req, res) => {
  const { name, segment, subject, body, targetEmails = [] } = req.body;

  if (!subject || !body) {
    return res.status(400).json({ message: 'Subject and body are required.' });
  }

  const validEmails = [...new Set(
    targetEmails.filter(e => e && isValidEmail(e.trim())).map(e => e.trim().toLowerCase())
  )];
  if (!validEmails.length) {
    return res.status(400).json({ message: 'No valid recipients provided.' });
  }

  let campaign;
  try {
    campaign = await Campaign.create({
      name: name || subject,
      subject,
      body,
      message: body,
      segment: segment || 'custom',
      recipientType: ['all', 'leads'].includes(segment) ? segment : 'custom',
      recipients: validEmails,
      recipientCount: validEmails.length,
      totalCount: validEmails.length,
      sentCount: 0,
      status: 'queued',
      sentAt: new Date(),
    });
  } catch (error) {
    console.error('Campaign create error:', error);
    return res.status(500).json({ message: 'Failed to create campaign.' });
  }

  // Respond immediately — don't make the client wait for all emails
  res.json({
    message: `Campaign queued — sending ${validEmails.length} email${validEmails.length !== 1 ? 's' : ''} at 1 per minute.`,
    campaign,
  });

  // Background rate-limited send: 1 email per minute
  const html = campaignEmailHtml(subject, body);
  let i = 0;

  const sendNext = async () => {
    if (i >= validEmails.length) {
      await Campaign.findByIdAndUpdate(campaign._id, { status: 'sent' });
      console.log(`✅ Campaign "${subject}" complete — ${validEmails.length} emails sent.`);
      return;
    }
    const to = validEmails[i++];
    try {
      await sendEmail({ to, subject, html });
      await Campaign.findByIdAndUpdate(campaign._id, { $inc: { sentCount: 1 }, status: 'sending' });
      console.log(`📧 Campaign [${i}/${validEmails.length}] → ${to}`);
    } catch (err) {
      console.error(`⚠️ Campaign email to ${to} failed:`, err.message);
    }
    setTimeout(sendNext, 60 * 1000);
  };

  sendNext();
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
