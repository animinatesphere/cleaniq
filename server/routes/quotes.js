const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailService");
const Quote = require("../models/Quote");

const FREQUENCY_LABELS = {
  once: "One-time",
  weekly: "Weekly",
  biweekly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

/**
 * POST /api/quotes/send
 * Send a customized quote to a company email and persist it
 */
router.post("/send", async (req, res) => {
  try {
    const {
      companyName,
      contactName,
      email,
      phone,
      address,
      frequency,
      quoteRef,
      date,
      items,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      vat,
      grandTotal,
      validDays,
      vatRate,
      includeVat,
      sendCopy,
      paymentTerms,
      depositRequired,
      depositPercent,
      depositAmount,
      balanceDue,
      discount,
      notes,
    } = req.body;

    // Validation
    if (!email || !companyName || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: email, companyName, or items",
      });
    }

    const quoteData = {
      companyName,
      contactName,
      email,
      phone,
      address,
      frequency,
      quoteRef,
      date,
      items,
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      vat,
      grandTotal,
      validDays,
      vatRate,
      includeVat,
      paymentTerms,
      depositRequired,
      depositPercent,
      depositAmount,
      balanceDue,
      discount,
      notes,
    };

    // Generate quote email HTML
    const quoteHtml = generateQuoteEmail(quoteData);

    // Send email to company
    const emailSent = await sendEmail({
      to: email,
      subject: `Professional Service Quote - Ref: ${quoteRef} | Cleaniq Services`,
      html: quoteHtml,
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send email. Please try again.",
      });
    }

    // Persist quote record
    const quoteRecord = await Quote.create({
      ...quoteData,
      status: "sent",
    });

    // Send copy to admin if requested
    if (sendCopy) {
      await sendEmail({
        to: process.env.EMAIL_USER || "info@cleaniqservices.com",
        subject: `Quote Sent - ${companyName} | ${quoteRef}`,
        html: generateAdminNotificationEmail(quoteRecord),
      });
    }

    res.status(200).json({
      success: true,
      message: `Quote sent successfully to ${email}`,
      quoteRef,
      data: quoteRecord,
    });
  } catch (error) {
    console.error("Quote send error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * GET /api/quotes
 * Retrieve all sent quotes history
 */
router.get("/", async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const [quotes, total] = await Promise.all([
      Quote.find()
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit)),
      Quote.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: quotes,
      total,
    });
  } catch (error) {
    console.error("Quote fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quotes",
      error: error.message,
    });
  }
});

/**
 * GET /api/quotes/stats
 * Summary stats for the dashboard (total quotes, total quoted value, this month's count)
 */
router.get("/stats", async (req, res) => {
  try {
    const [total, allQuotes] = await Promise.all([
      Quote.countDocuments(),
      Quote.find({}, "grandTotal createdAt"),
    ]);

    const totalQuotedValue = allQuotes.reduce(
      (s, q) => s + (q.grandTotal || 0),
      0,
    );

    const now = new Date();
    const thisMonthCount = allQuotes.filter((q) => {
      const d = new Date(q.createdAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;

    res.status(200).json({
      success: true,
      data: { total, totalQuotedValue, thisMonthCount },
    });
  } catch (error) {
    console.error("Quote stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quote stats",
      error: error.message,
    });
  }
});

/**
 * GET /api/quotes/customer/:email
 * Retrieve quote history for a specific customer email
 */
router.get("/customer/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const quotes = await Quote.find({ email: email.toLowerCase() }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: quotes,
      total: quotes.length,
    });
  } catch (error) {
    console.error("Customer quote fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer quotes",
      error: error.message,
    });
  }
});

/**
 * GET /api/quotes/:quoteRef
 * Retrieve a specific quote by reference
 */
router.get("/:quoteRef", async (req, res) => {
  try {
    const { quoteRef } = req.params;
    const quote = await Quote.findOne({ quoteRef });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error("Quote detail error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quote",
      error: error.message,
    });
  }
});

/**
 * POST /api/quotes/resend/:quoteRef
 * Resend an existing quote to the same or different email
 */
router.post("/resend/:quoteRef", async (req, res) => {
  try {
    const { quoteRef } = req.params;
    const { email } = req.body;

    const quote = await Quote.findOne({ quoteRef });
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }

    const targetEmail = email || quote.email;
    const quoteHtml = generateQuoteEmail(quote.toObject());

    const emailSent = await sendEmail({
      to: targetEmail,
      subject: `Professional Service Quote - Ref: ${quoteRef} | Cleaniq Services`,
      html: quoteHtml,
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to resend email",
      });
    }

    res.status(200).json({
      success: true,
      message: `Quote resent to ${targetEmail}`,
    });
  } catch (error) {
    console.error("Quote resend error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend quote",
      error: error.message,
    });
  }
});

/**
 * POST /api/quotes/schedule
 * Schedule recurring quotes to be sent automatically
 */
router.post("/schedule", async (req, res) => {
  try {
    const {
      companyName,
      email,
      frequency, // weekly, biweekly, monthly, quarterly, yearly
      items,
      subtotal,
      grandTotal,
      active = true,
    } = req.body;

    if (!email || !frequency || !items) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for scheduling",
      });
    }

    // Validate frequency
    const validFrequencies = [
      "weekly",
      "biweekly",
      "monthly",
      "quarterly",
      "yearly",
    ];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid frequency. Must be weekly, biweekly, monthly, quarterly, or yearly",
      });
    }

    const scheduleRecord = {
      id: `SCH-${Date.now()}`,
      companyName,
      email,
      frequency,
      items,
      subtotal,
      grandTotal,
      active,
      createdAt: new Date().toISOString(),
      nextSendDate: calculateNextSendDate(frequency),
      sentCount: 0,
    };

    // In a real implementation, store this in database and use a cron job
    console.log("📅 Quote schedule created:", scheduleRecord);

    res.status(201).json({
      success: true,
      message: "Recurring quote schedule created",
      schedule: scheduleRecord,
      note: "In production, implement cron job or job queue for automatic sending",
    });
  } catch (error) {
    console.error("Schedule quote error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule quote",
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────

function generateQuoteEmail(quote) {
  const {
    companyName,
    contactName,
    quoteRef,
    date,
    items,
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    vat,
    grandTotal,
    depositAmount,
    balanceDue,
    validDays,
    vatRate,
    includeVat,
    frequency,
    paymentTerms,
    depositRequired,
    depositPercent,
    discount,
    notes,
    address,
    phone,
  } = quote;

  const frequencyLabel = FREQUENCY_LABELS[frequency] || "One-time";

  const itemsHtml = items
    .filter((i) => i.service || i.customService)
    .map((item) => {
      const isHourly = item.billingType === "hourly";
      const pricingLabel = isHourly
        ? `${item.qty} hrs @ £${Number(item.unitPrice || 0).toFixed(2)}/hr`
        : `Qty ${item.qty} × £${Number(item.unitPrice || 0).toFixed(2)}`;
      return `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 14px 16px; text-align: left;">
        <p style="margin: 0; font-weight: 700; color: #0F172A; font-size: 14px;">${item.service || item.customService}</p>
        ${item.description ? `<p style="margin: 6px 0 0; font-size: 12px; color: #64748b;"><strong>What's included:</strong> ${item.description}</p>` : ""}
        <p style="margin: 6px 0 0; font-size: 11px; color: #94a3b8; font-weight: 600;">${pricingLabel}</p>
      </td>
      <td style="padding: 14px 16px; text-align: center; color: #64748b; font-size: 14px;">${item.qty}${isHourly ? " hrs" : ""}</td>
      <td style="padding: 14px 16px; text-align: right; color: #64748b; font-size: 14px;">£${Number(item.unitPrice || 0).toFixed(2)}${isHourly ? "/hr" : ""}</td>
      <td style="padding: 14px 16px; text-align: right; font-weight: 700; color: #0F172A; font-size: 14px;">£${(Number(item.unitPrice || 0) * item.qty).toFixed(2)}</td>
    </tr>
  `;
    })
    .join("");

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 750px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
      <!-- PREMIUM HEADER -->
      <div style="background: linear-gradient(135deg, #0F172A 0%, #1e293b 50%, #6EE7B7 100%); padding: 60px 40px; text-align: center; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.05;">
          <div style="font-size: 80px; font-weight: 900; color: white;">💼</div>
        </div>
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 110px; height: 110px; margin-bottom: 20px; border-radius: 50%; object-fit: cover; border: 4px solid #6EE7B7; box-shadow: 0 10px 25px rgba(110, 231, 183, 0.2); position: relative; z-index: 1;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 36px; letter-spacing: -1px; font-weight: 800; position: relative; z-index: 1;">PROFESSIONAL SERVICE QUOTE</h1>
        <p style="color: #cbd5e1; margin: 8px 0 0; font-size: 14px; position: relative; z-index: 1;">Cleaniq Services - Premium Cleaning Solutions</p>
      </div>

      <!-- MAIN CONTENT -->
      <div style="padding: 50px 40px;">
        <!-- QUOTE REF & DATE -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px;">
          <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #6366f1;">
            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">📋 Quote Reference</p>
            <p style="margin: 12px 0 0 0; font-size: 26px; font-weight: 900; color: #0F172A; font-family: monospace;">${quoteRef}</p>
          </div>
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #991b1b; text-transform: uppercase; letter-spacing: 1px;">📅 Quote Date</p>
            <p style="margin: 12px 0 0 0; font-size: 26px; font-weight: 900; color: #0F172A;">${date}</p>
          </div>
        </div>

        <!-- COMPANY DETAILS -->
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 28px; margin-bottom: 40px; border: 2px solid #0369a1;">
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">✓ Prepared For</p>
          <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 900; color: #0F172A;">${companyName}</p>
          ${contactName ? `<p style="margin: 8px 0; font-size: 14px; color: #0c4a6e; font-weight: 600;">👤 Contact: ${contactName}</p>` : ""}
          ${phone ? `<p style="margin: 8px 0; font-size: 14px; color: #0c4a6e; font-weight: 600;">📱 Phone: ${phone}</p>` : ""}
          ${address ? `<p style="margin: 8px 0; font-size: 14px; color: #0c4a6e; font-weight: 600;">📍 Address: ${address}</p>` : ""}
        </div>

        <!-- SERVICES TABLE -->
        <div style="margin-bottom: 32px;">
          <p style="margin: 0 0 16px 0; font-size: 13px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; border-left: 4px solid #6EE7B7; padding-left: 12px;">🧹 Cleaning Services & Scope of Work</p>
          <div style="overflow: hidden; border-radius: 12px; border: 2px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: white;">
              <thead>
                <tr style="background: linear-gradient(to right, #0f172a, #1e293b); border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 16px; text-align: left; font-size: 11px; font-weight: 800; color: #6EE7B7; text-transform: uppercase; letter-spacing: 1px;">Service & Details</th>
                  <th style="padding: 16px; text-align: center; font-size: 11px; font-weight: 800; color: #6EE7B7; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                  <th style="padding: 16px; text-align: right; font-size: 11px; font-weight: 800; color: #6EE7B7; text-transform: uppercase; letter-spacing: 1px;">Unit Price</th>
                  <th style="padding: 16px; text-align: right; font-size: 11px; font-weight: 800; color: #6EE7B7; text-transform: uppercase; letter-spacing: 1px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <!-- PRICING SUMMARY - PROFESSIONAL LAYOUT -->
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 32px; margin-bottom: 32px; border: 2px solid #cbd5e1;">
          <p style="margin: 0 0 20px 0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px;">💰 Pricing Summary</p>

          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 14px; color: #64748b;">Subtotal</span>
            <span style="font-size: 16px; font-weight: 700; color: #0F172A;">£${subtotal.toFixed(2)}</span>
          </div>

          ${
            discountAmount > 0
              ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 14px; color: #64748b;">Discount (${discount}%)</span>
            <span style="font-size: 16px; font-weight: 700; color: #10b981;">-£${discountAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 14px; color: #64748b;">Subtotal after discount</span>
            <span style="font-size: 16px; font-weight: 700; color: #0F172A;">£${subtotalAfterDiscount.toFixed(2)}</span>
          </div>
          `
              : ""
          }

          ${
            includeVat && vat > 0
              ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px solid #cbd5e1;">
            <span style="font-size: 14px; color: #64748b;">VAT (${vatRate}%)</span>
            <span style="font-size: 16px; font-weight: 700; color: #0F172A;">£${vat.toFixed(2)}</span>
          </div>
          `
              : ""
          }

          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #6EE7B7 0%, #10b981 100%); border-radius: 12px;">
            <span style="font-size: 16px; font-weight: 800; color: white;">GRAND TOTAL</span>
            <span style="font-size: 20px; font-weight: 900; color: white;">£${grandTotal.toFixed(2)}${frequency !== "once" ? ` / ${frequencyLabel.toLowerCase()}` : ""}</span>
          </div>

          ${
            depositRequired && depositAmount > 0
              ? `
          <div style="background: #eef2ff; border-radius: 12px; padding: 16px; border-left: 4px solid #6366f1;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 13px; font-weight: 700; color: #4f46e5;">Deposit Required (${depositPercent}%)</span>
              <span style="font-size: 14px; font-weight: 800; color: #4f46e5;">£${depositAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 13px; font-weight: 700; color: #4f46e5;">Balance Due</span>
              <span style="font-size: 14px; font-weight: 800; color: #4f46e5;">£${balanceDue.toFixed(2)}</span>
            </div>
          </div>
          `
              : ""
          }
        </div>

        <!-- PAYMENT TERMS -->
        <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px;">💳 Payment Terms</p>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: #92400e; font-weight: 600;">${paymentTerms}</p>
        </div>

        <!-- RECURRING NOTICE -->
        ${
          frequency !== "once"
            ? `
        <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: 12px; padding: 20px; margin-bottom: 32px; border-left: 4px solid #6366f1;">
          <p style="margin: 0; font-size: 12px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px;">📅 Recurring Service</p>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: #4f46e5; font-weight: 600;">This is a recurring contract with <strong>${frequencyLabel.toLowerCase()}</strong> billing. Services will be provided and invoiced accordingly.</p>
        </div>
        `
            : ""
        }

        <!-- NOTES & TERMS -->
        ${
          notes
            ? `
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 12px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px;">📝 Terms & Conditions</p>
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #92400e; line-height: 1.7; font-weight: 500;">${notes}</p>
        </div>
        `
            : ""
        }

        <!-- VALIDITY -->
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 20px; margin-bottom: 32px; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">✓ Validity Period</p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #047857; font-weight: 600;">This quote is valid for <strong>${validDays} days</strong> from the date of issue. After this period, prices and availability are subject to change.</p>
        </div>

        <!-- CTA BUTTONS -->
        <div style="text-align: center; margin-top: 40px; padding-top: 32px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; font-weight: 600;">Ready to proceed with this professional service quote?</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 auto; max-width: 100%;">
            <tr>
              <td align="center">
                <a href="https://cleaniqservices.com/booking" style="display: inline-block; background: linear-gradient(135deg, #6EE7B7 0%, #10b981 100%); color: #0F172A; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(110, 231, 183, 0.3);">Accept & Book Now</a>
              </td>
              <td style="width: 20px;"></td>
              <td align="center">
                <a href="https://cleaniqservices.com/pages/contact" style="display: inline-block; background: white; color: #0F172A; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border: 2px solid #0F172A;">Contact Us</a>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="background: linear-gradient(135deg, #0F172A 0%, #1e293b 100%); padding: 40px; text-align: center; border-top: 2px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #6EE7B7;">Cleaniq Services Limited</p>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #cbd5e1;">Professional Cleaning Solutions</p>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">📧 info@cleaniqservices.com | 🌐 cleaniqservices.com | 📞 +44 7752 476368</p>
        <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b;">&copy; 2026 Cleaniq Services. All rights reserved. This is a confidential quote.</p>
      </div>
    </div>
  `;
}

function generateAdminNotificationEmail(quote) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <!-- HEADER -->
      <div style="background: linear-gradient(135deg, #6EE7B7 0%, #10b981 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">✓ Quote Sent</h1>
      </div>

      <!-- CONTENT -->
      <div style="padding: 40px;">
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b;">A service quote has been sent to a company. Here are the details:</p>

        <div style="background: #f8fafc; border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; space-y: 3;">
          <div style="margin-bottom: 12px;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Quote Ref</p>
            <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 800; color: #0F172A;">${quote.quoteRef}</p>
          </div>
          <div style="margin-bottom: 12px;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Company</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #0F172A;">${quote.companyName}</p>
          </div>
          <div style="margin-bottom: 12px;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Email</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #0F172A;">${quote.email}</p>
          </div>
          <div style="margin-bottom: 12px;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Total Amount</p>
            <p style="margin: 6px 0 0 0; font-size: 18px; font-weight: 800; color: #6EE7B7;">£${quote.grandTotal.toFixed(2)}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Frequency</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #0F172A;">${FREQUENCY_LABELS[quote.frequency] || "One-time"}</p>
          </div>
        </div>

        <a href="https://cleaniqservices.com/admin/quotes" style="display: block; text-align: center; background-color: #0F172A; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase;">View All Quotes</a>
      </div>

      <!-- FOOTER -->
      <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `;
}

function calculateNextSendDate(frequency) {
  const today = new Date();
  const next = new Date(today);

  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      return null;
  }

  return next.toISOString();
}

module.exports = router;
