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

// ── Website "Get a Quote" form ───────────────────────────────────────────────
// Saved as a lead (Admin → Leads), emailed to the team, and the customer gets the usual
// "we received your message" email. The team prices it in the Quote Builder.
const QUOTE_OPTIONS = {
  property: ["Studio", "Flat", "House", "Townhouse", "Bungalow"],
  carpet: ["With Carpet Cleaning (Save 60%)", "Without Carpet Cleaning"],
  // Same as the price list (Single/Double/Range Oven Cleaning; Single fridge, Fridge and freezer,
  // American fridge freezer) so the team can price them straight in the Quote Builder.
  oven: ["Single oven", "Double oven", "Range oven"],
  fridge: ["Single fridge", "Fridge freezer", "American fridge freezer"],
};
const escHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const count = (v, max) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : null;
};

// Checks the form; returns { quote } or { error }.
function readQuoteRequest(body = {}) {
  const q = {
    service: clean(body.service, 100),
    name: clean(body.name, 100),
    email: clean(body.email, 150).toLowerCase(),
    phone: clean(body.phone, 30),
    postcode: clean(body.postcode, 10).toUpperCase(),
    bedrooms: count(body.bedrooms, 8),
    bathrooms: count(body.bathrooms, 8),
    livingRooms: count(body.livingRooms, 6),
    stairs: count(body.stairs, 6),
    property: clean(body.property, 30),
    date: clean(body.date, 10),
    notes: clean(body.notes, 2000),
    carpet: clean(body.carpet, 60),
    extras: [],
  };
  if (!q.service) return { error: "Please choose a service." };
  if (!q.name) return { error: "Please enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email)) return { error: "Please enter a valid email address." };
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(q.postcode)) return { error: "Please enter a valid UK postcode." };
  if (q.property && !QUOTE_OPTIONS.property.includes(q.property)) return { error: "Please choose a property type from the list." };
  if (q.carpet && !QUOTE_OPTIONS.carpet.includes(q.carpet)) return { error: "Please choose with or without carpet cleaning." };
  if (q.date && (!/^\d{4}-\d{2}-\d{2}$/.test(q.date) || Number.isNaN(Date.parse(q.date)))) return { error: "Please choose a valid date." };

  const extras = body.extras || {};
  if (extras.oven) {
    if (!QUOTE_OPTIONS.oven.includes(extras.ovenType)) return { error: "Please confirm the type of oven." };
    q.extras.push(`Oven Cleaning (${extras.ovenType})`);
  }
  if (extras.fridge) {
    if (!QUOTE_OPTIONS.fridge.includes(extras.fridgeType)) return { error: "Please confirm the type of fridge." };
    q.extras.push(`Fridge Cleaning (${extras.fridgeType})`);
  }
  if (body.consent !== true) return { error: "Please tick the box to let us store your details so we can reply." };
  return { quote: q };
}

function quoteRows(q) {
  const ukDate = q.date ? new Date(`${q.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
  return [
    ["Service", q.service],
    ["Name", q.name],
    ["Email", q.email],
    ["Phone", q.phone],
    ["Postcode", q.postcode],
    ["Property type", q.property],
    ["Bedrooms", q.bedrooms],
    ["Bathrooms", q.bathrooms],
    ["Living / reception rooms", q.livingRooms],
    ["Stairs / landings", q.stairs],
    ["Preferred date", ukDate],
    ["Carpet cleaning", q.carpet],
    ["Additional services (20% off)", q.extras.join(", ")],
    ["Additional information", q.notes],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "");
}

router.post('/quote-request', async (req, res) => {
  // Hidden field only bots fill in: pretend it worked and do nothing.
  if (req.body?.website) return res.json({ message: 'Quote request sent.' });
  const { quote: q, error } = readQuoteRequest(req.body);
  if (error) return res.status(400).json({ message: error });

  const rows = quoteRows(q);
  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;background:#fff;">
  <div style="background:#0F172A;padding:28px 32px;">
    <h1 style="color:#6EE7B7;margin:0;font-size:20px;">New Quote Request</h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">${escHtml(q.service)} · ${escHtml(q.postcode)}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    ${rows.map(([k, v]) => `<tr><td style="padding:10px 32px;font-size:12px;font-weight:700;color:#64748b;border-bottom:1px solid #f1f5f9;width:40%;vertical-align:top;">${escHtml(k)}</td><td style="padding:10px 32px 10px 0;font-size:14px;color:#0F172A;border-bottom:1px solid #f1f5f9;white-space:pre-wrap;">${escHtml(v)}</td></tr>`).join("")}
  </table>
  <p style="margin:20px 32px 28px;font-size:12px;color:#059669;font-weight:700;">Reply to this email to answer ${escHtml(q.name)}, or send a quote from Admin → Quotes.</p>
</div>`;

  try {
    const lead = await Lead.create({
      name: q.name,
      email: q.email,
      phone: q.phone,
      serviceInterest: q.service,
      message: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      source: 'Quote Form',
    });
    await sendEmail({
      to: process.env.EMAIL_USER || 'info@cleaniqservices.com',
      subject: `🧾 Quote request: ${q.service} — ${q.name} (${q.postcode})`,
      html,
      replyTo: q.email,
    });
    try {
      await sendEmail({ to: q.email, subject: 'We received your quote request — Cleaniq Services', html: templates.leadAcknowledgement(q.name) });
      lead.acknowledged = true;
      await lead.save();
    } catch (ackErr) {
      console.error('Quote acknowledgement email error:', ackErr.message);
    }
    res.json({ message: 'Quote request sent.' });
  } catch (err) {
    console.error('Quote request error:', err.message);
    res.status(500).json({ message: 'Failed to send your request. Please try again.' });
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
 * POST /api/contact/leads
 * Manually add a lead from the admin Leads page.
 */
router.post('/leads', async (req, res) => {
  try {
    const { name, email, phone, message, source } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const lead = await Lead.create({
      name,
      email,
      phone: phone || '',
      message: message || '',
      source: source || 'Manual',
    });
    res.status(201).json(lead);
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
module.exports.readQuoteRequest = readQuoteRequest;
module.exports.QUOTE_OPTIONS = QUOTE_OPTIONS;
