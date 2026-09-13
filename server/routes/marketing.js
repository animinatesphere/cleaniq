const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const CampaignTemplate = require('../models/CampaignTemplate');
const { sendEmail } = require('../utils/emailService');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Personalise placeholders in the message body
function personalise(text, email, customerMap) {
  const cust = customerMap[(email || '').toLowerCase()];
  const name = cust?.firstName || 'there';
  return text
    .replace(/\[Name\]/gi, name)
    .replace(/\[Your name\]/gi, 'Cleaniq Team')
    .replace(/\[Business address\]/gi, 'Greater Manchester, UK');
}

// Build the campaign email HTML with per-recipient unsubscribe link
function campaignEmailHtml(subject, bodyText, recipientEmail) {
  const unsubUrl = `https://api.cleaniqservices.com/api/unsubscribe?email=${encodeURIComponent(recipientEmail || '')}`;
  const bodyHtml = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 18px;font-size:15px;line-height:1.85;color:#374151;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;">')
    .replace(/\n/g, '<br>')
    .replace(/\[Unsubscribe\]/gi, `<a href="${unsubUrl}" style="color:#10b981;text-decoration:underline;">unsubscribe here</a>`);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header bar -->
        <tr>
          <td style="background:linear-gradient(135deg,#064e3b 0%,#065f46 100%);padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:28px 0 24px;">
                  <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    ✦ Cleaniq<span style="color:#6ee7b7;">.</span>
                  </p>
                  <p style="margin:4px 0 0;font-size:11px;font-weight:600;letter-spacing:2px;color:#6ee7b7;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Professional Cleaning Services</p>
                </td>
                <td align="right" style="padding:28px 0 24px;">
                  <span style="display:inline-block;padding:6px 14px;background:rgba(110,231,183,0.15);border:1px solid rgba(110,231,183,0.3);border-radius:20px;font-size:11px;font-weight:700;color:#6ee7b7;letter-spacing:1px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">MANCHESTER, UK</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Subject line accent -->
        <tr>
          <td style="padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-bottom:3px solid #10b981;padding:28px 0 0;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;line-height:1.3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${subject}</h1>
            </td></tr></table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 40px 8px;">
            <p style="margin:0 0 18px;font-size:15px;line-height:1.85;color:#374151;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${bodyHtml}</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px 40px 36px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:8px;">
                  <a href="https://cleaniqservices.com/booking" style="display:inline-block;padding:15px 36px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Book a Cleaning →</a>
                </td>
                <td style="padding-left:16px;">
                  <a href="https://cleaniqservices.com" style="font-size:13px;color:#6b7280;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">or visit our website</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Trust bar -->
        <tr>
          <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <p style="margin:0;font-size:12px;color:#9ca3af;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    ⭐ Fully insured &nbsp;&middot;&nbsp; ⏱ Reliable scheduling &nbsp;&middot;&nbsp; 🏆 Greater Manchester's trusted cleaners
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#111827;padding:24px 40px;border-radius:0 0 12px 12px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Cleaniq Services Limited</p>
                  <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    <a href="mailto:info@cleaniqservices.com" style="color:#10b981;text-decoration:none;">info@cleaniqservices.com</a>
                    &nbsp;&middot;&nbsp; +44 7752 476368 &nbsp;&middot;&nbsp; Greater Manchester, UK
                  </p>
                </td>
                <td align="right" valign="top">
                  <a href="https://cleaniqservices.com" style="font-size:12px;color:#6b7280;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">cleaniqservices.com</a>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:14px;border-top:1px solid #1f2937;margin-top:14px;">
                  <p style="margin:0;font-size:11px;color:#6b7280;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    You received this because you're a Cleaniq customer or enquired about our services.
                    &nbsp;&middot;&nbsp;
                    <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

// ─── Customer Activity ──────────────────────────────────────────────────────
// Returns all customers with their last booking date and booking count
router.get('/customer-activity', async (req, res) => {
  try {
    const [customers, bookingActivity] = await Promise.all([
      Customer.find({}, 'firstName lastName email').lean(),
      Booking.aggregate([
        { $match: { 'customer.email': { $exists: true, $ne: '' } } },
        { $group: {
          _id: { $toLower: '$customer.email' },
          lastBookingDate: { $max: '$schedule.date' },
          bookingCount: { $sum: 1 },
        }},
      ]),
    ]);
    const actMap = {};
    for (const b of bookingActivity) {
      if (b._id) actMap[b._id] = { lastBookingDate: b.lastBookingDate, bookingCount: b.bookingCount };
    }
    const result = customers
      .filter(c => c.email)
      .map(c => ({
        _id: c._id,
        email: c.email,
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        lastBookingDate: actMap[c.email.toLowerCase()]?.lastBookingDate || null,
        bookingCount: actMap[c.email.toLowerCase()]?.bookingCount || 0,
      }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Campaign Templates ─────────────────────────────────────────────────────
router.get('/templates', async (req, res) => {
  try {
    const templates = await CampaignTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    if (!name || !subject || !body) return res.status(400).json({ message: 'name, subject and body are required' });
    const t = await CampaignTemplate.create({ name, subject, body });
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    if (!name || !subject || !body) return res.status(400).json({ message: 'name, subject and body are required' });
    const t = await CampaignTemplate.findByIdAndUpdate(req.params.id, { name, subject, body }, { new: true });
    if (!t) return res.status(404).json({ message: 'Template not found' });
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    await CampaignTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Campaign Send (legacy, immediate) ─────────────────────────────────────
router.post('/send', async (req, res) => {
  const { subject, message, recipientType = 'custom', recipients = [] } = req.body;
  if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required.' });
  try {
    let emails = [];
    if (recipientType === 'all') {
      const [bookings, customers] = await Promise.all([
        Booking.find({}, 'customer.email'),
        Customer.find({}, 'email'),
      ]);
      emails = [...bookings.map(b => b.customer?.email), ...customers.map(c => c.email)];
    } else if (recipientType === 'leads') {
      const leads = await Lead.find({}, 'email');
      emails = leads.map(l => l.email);
    } else {
      emails = Array.isArray(recipients) ? recipients : [];
    }
    emails = [...new Set(emails.filter(Boolean).map(e => e.trim().toLowerCase()))].filter(isValidEmail);
    if (!emails.length) return res.status(400).json({ message: 'No valid recipients found.' });

    const customerMap = {};
    const customers = await Customer.find({}, 'email firstName lastName').lean();
    for (const c of customers) customerMap[c.email.toLowerCase()] = c;

    const results = await Promise.allSettled(
      emails.map(email => {
        const body = personalise(message, email, customerMap);
        return sendEmail({ to: email, subject, html: campaignEmailHtml(subject, body, email), isCampaign: true });
      })
    );
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const campaign = await Campaign.create({ subject, message, recipientType, recipients: emails, recipientCount: successCount });
    res.json({ message: `Campaign sent to ${successCount} of ${emails.length} recipient(s).`, campaign });
  } catch (error) {
    console.error('Campaign send error:', error);
    res.status(500).json({ message: 'Failed to send campaign.' });
  }
});

// ─── Campaign Queue (1/min, background) ────────────────────────────────────
router.post('/campaign', async (req, res) => {
  const { name, segment, subject, body, targetEmails = [] } = req.body;
  if (!subject || !body) return res.status(400).json({ message: 'Subject and body are required.' });

  const validEmails = [...new Set(
    targetEmails.filter(e => e && isValidEmail(e.trim())).map(e => e.trim().toLowerCase())
  )];
  if (!validEmails.length) return res.status(400).json({ message: 'No valid recipients provided.' });

  let campaign;
  try {
    campaign = await Campaign.create({
      name: name || subject, subject, body, message: body,
      segment: segment || 'custom',
      recipientType: ['all', 'leads'].includes(segment) ? segment : 'custom',
      recipients: validEmails, recipientCount: validEmails.length,
      totalCount: validEmails.length, sentCount: 0, status: 'queued', sentAt: new Date(),
    });
  } catch (error) {
    console.error('Campaign create error:', error);
    return res.status(500).json({ message: 'Failed to create campaign.' });
  }

  res.json({
    message: `Campaign queued — sending ${validEmails.length} email${validEmails.length !== 1 ? 's' : ''} at 1 per minute.`,
    campaign,
  });

  // Build customer map for personalisation
  const customerMap = {};
  try {
    const customers = await Customer.find({}, 'email firstName lastName').lean();
    for (const c of customers) customerMap[c.email.toLowerCase()] = c;
  } catch {}

  let i = 0;
  const sendNext = async () => {
    if (i >= validEmails.length) {
      await Campaign.findByIdAndUpdate(campaign._id, { status: 'sent' });
      console.log(`✅ Campaign "${subject}" complete — ${validEmails.length} emails sent.`);
      return;
    }
    const to = validEmails[i++];
    try {
      const personalBody = personalise(body, to, customerMap);
      await sendEmail({ to, subject, html: campaignEmailHtml(subject, personalBody, to), isCampaign: true });
      await Campaign.findByIdAndUpdate(campaign._id, { $inc: { sentCount: 1 }, status: 'sending' });
      console.log(`📧 Campaign [${i}/${validEmails.length}] → ${to}`);
    } catch (err) {
      console.error(`⚠️ Campaign email to ${to} failed:`, err.message);
    }
    setTimeout(sendNext, 60 * 1000);
  };
  sendNext();
});

// ─── Campaign History ───────────────────────────────────────────────────────
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ sentAt: -1 }).limit(50);
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/campaigns/:id', async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
