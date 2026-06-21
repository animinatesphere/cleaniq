const express = require('express');
const router = express.Router();
const { sendEmail, templates } = require('../utils/emailService');
const Lead = require('../models/Lead');
const { moveToTrash } = require('../utils/trash');

// POST /api/contact — forward a contact form message to the organisation email
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email and message are required.' });
  }

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 36px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 100px; height: auto; margin-bottom: 16px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 22px; letter-spacing: -0.5px;">New Contact Enquiry</h1>
        <p style="color: #94a3b8; margin-top: 8px; font-size: 13px; font-weight: 500;">A visitor has submitted a message via your website.</p>
      </div>
      <div style="padding: 36px; color: #1e293b; line-height: 1.7;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 16px; background: #f8fafc; border-radius: 12px 12px 0 0; border-bottom: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">From</p>
              <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #0F172A;">${name}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Email</p>
              <a href="mailto:${email}" style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #005B41; display: block;">${email}</a>
            </td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Phone</p>
              <a href="tel:${phone}" style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #005B41; display: block;">${phone}</a>
            </td>
          </tr>` : ''}
          ${subject ? `
          <tr>
            <td style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-radius: 0;">
              <p style="margin: 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Subject</p>
              <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #0F172A;">${subject}</p>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding: 12px 16px; background: #f8fafc; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Message</p>
              <p style="margin: 8px 0 0; font-size: 14px; font-weight: 500; color: #475569; white-space: pre-wrap;">${message}</p>
            </td>
          </tr>
        </table>

        <div style="margin-top: 28px; padding: 16px; background: #ecfdf5; border-radius: 16px; border: 1px solid #a7f3d0;">
          <p style="margin: 0; font-size: 12px; color: #059669; font-weight: 700;">
            💡 Reply directly to this email to respond to ${name}.
          </p>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: process.env.EMAIL_USER || 'info@cleaniqservices.com',
      subject: subject ? `📩 Contact Enquiry: ${subject}` : `📩 New Contact Enquiry from ${name}`,
      html,
    });

    // Store as a lead so it's available for email marketing campaigns later.
    const lead = await Lead.create({
      name,
      email,
      phone: phone || '',
      message,
      source: 'Contact Form',
    });

    // One-time automated acknowledgement to the person who reached out.
    try {
      await sendEmail({
        to: email,
        subject: 'We received your message — Cleaniq Services',
        html: templates.leadAcknowledgement(name),
      });
      lead.acknowledged = true;
      await lead.save();
    } catch (ackErr) {
      console.error('Lead acknowledgement email error:', ackErr);
    }

    res.json({ message: 'Message sent successfully.' });
  } catch (err) {
    console.error('Contact form email error:', err);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

/**
 * GET /api/contact/leads
 * List captured contact-form leads (for the admin Marketing/Leads view)
 */
router.get('/leads', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }).limit(500);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/contact/leads/stats
 * Lead counts for the dashboard — total, this week, this month.
 */
router.get('/leads/stats', async (req, res) => {
  try {
    const leads = await Lead.find({}, 'createdAt');
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeek = leads.filter((l) => new Date(l.createdAt) >= startOfWeek).length;
    const thisMonth = leads.filter((l) => new Date(l.createdAt) >= startOfMonth).length;

    res.json({ total: leads.length, thisWeek, thisMonth });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/contact/leads/:id
 */
router.delete('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    await moveToTrash('Lead', lead, `${lead.name} — ${lead.email}`);
    await lead.deleteOne();
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
