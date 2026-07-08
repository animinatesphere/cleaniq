const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailService");
const Quote = require("../models/Quote");
const Booking = require("../models/Booking");
const Lead = require("../models/Lead");
const { moveToTrash } = require("../utils/trash");
const { scheduleTask } = require("../utils/automationEngine");

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
      serviceDate,
      serviceTimeSlot,
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
      serviceDate,
      serviceTimeSlot,
    };

    // Generate quote email HTML
    const quoteHtml = generateQuoteEmail(quoteData);

    // Send email to company
    const emailSent = await sendEmail({
      to: email,
      subject: `Professional Cleaning Service Quote ${quoteRef}`,
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

    // Capture the recipient as a lead (name/email/phone) so they're
    // available for future email marketing campaigns.
    try {
      const leadEmail = (email || "").trim().toLowerCase();
      if (leadEmail) {
        const existingLead = await Lead.findOne({ email: leadEmail });
        if (!existingLead) {
          await Lead.create({
            name: contactName || companyName || "",
            email: leadEmail,
            phone: phone || "",
            source: "Quote",
            acknowledged: true,
          });
        }
      }
    } catch (leadErr) {
      console.error("⚠️ Failed to capture quote lead:", leadErr.message);
    }

    // Send copy to admin if requested
    if (sendCopy) {
      await sendEmail({
        to: process.env.EMAIL_USER || "info@cleaniqservices.com",
        subject: `Quote Sent - ${companyName} | ${quoteRef}`,
        html: generateAdminNotificationEmail(quoteRecord),
      });
    }

    // Schedule quote follow-up automations
    try {
      const now = new Date();
      const firstName = contactName || companyName || "there";
      const serviceLabel = items?.[0]?.description || "cleaning service";
      const totalAmount = grandTotal || subtotal;
      const payload = {
        quoteId: quoteRecord._id.toString(),
        quoteRef,
        email,
        firstName,
        service: serviceLabel,
        amount: totalAmount,
      };
      await scheduleTask("quote_followup_24h", new Date(now.getTime() + 24 * 60 * 60 * 1000), payload);
      await scheduleTask("quote_followup_3d",  new Date(now.getTime() + 3  * 24 * 60 * 60 * 1000), payload);
      await scheduleTask("lost_lead_7d",       new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000), payload);
    } catch (schedErr) {
      console.error("⚠️ Failed to schedule quote automations:", schedErr.message);
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
      Quote.find({}, "grandTotal createdAt status"),
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

    const accepted = allQuotes.filter((q) => q.status === "accepted");
    const declined = allQuotes.filter((q) => q.status === "declined");
    const pending = allQuotes.filter(
      (q) => q.status !== "accepted" && q.status !== "declined",
    );
    const acceptedValue = accepted.reduce((s, q) => s + (q.grandTotal || 0), 0);
    const responded = accepted.length + declined.length;
    const acceptanceRate = responded > 0 ? (accepted.length / responded) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        totalQuotedValue,
        thisMonthCount,
        accepted: accepted.length,
        declined: declined.length,
        pending: pending.length,
        acceptedValue,
        acceptanceRate,
      },
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
 * GET /api/quotes/:quoteRef/accept
 * Public link clicked from the quote email — marks the quote as accepted,
 * notifies the admin, and shows the company a proper confirmation page.
 * No authentication, since the recipient is a company contact, not an admin.
 */
router.get("/:quoteRef/accept", async (req, res) => {
  const { quoteRef } = req.params;
  try {
    const quote = await Quote.findOne({ quoteRef });

    if (!quote) {
      return res.status(404).send(generateOutcomePage({ type: "notfound" }));
    }

    if (quote.status === "declined") {
      // They already declined — let them flip to accepted, but don't silently
      // resurrect a dead lead without telling the admin it changed.
      quote.status = "accepted";
      quote.acceptedAt = new Date();
      quote.declinedAt = null;
      await quote.save();
      const bookingsCreated = await generateBookingsFromQuote(quote);
      await sendEmail({
        to: process.env.EMAIL_USER || "info@cleaniqservices.com",
        subject: `✅ Quote Accepted (after declining) - ${quote.companyName} | ${quote.quoteRef}`,
        html: generateQuoteResponseAlert(quote, "accepted", bookingsCreated),
      });
    } else if (quote.status !== "accepted") {
      quote.status = "accepted";
      quote.acceptedAt = new Date();
      await quote.save();
      const bookingsCreated = await generateBookingsFromQuote(quote);
      await sendEmail({
        to: process.env.EMAIL_USER || "info@cleaniqservices.com",
        subject: `✅ Quote Accepted - ${quote.companyName} | ${quote.quoteRef}`,
        html: generateQuoteResponseAlert(quote, "accepted", bookingsCreated),
      });
    }

    res.send(generateOutcomePage({ type: "accept", quote }));
  } catch (error) {
    console.error("Quote accept error:", error);
    res.status(500).send(generateOutcomePage({ type: "error" }));
  }
});

/**
 * GET /api/quotes/:quoteRef/decline
 * Public link clicked from the quote email — marks the quote as declined
 * and notifies the admin, so a dead lead doesn't sit silently as "sent".
 */
router.get("/:quoteRef/decline", async (req, res) => {
  const { quoteRef } = req.params;
  try {
    const quote = await Quote.findOne({ quoteRef });

    if (!quote) {
      return res.status(404).send(generateOutcomePage({ type: "notfound" }));
    }

    if (quote.status !== "declined") {
      quote.status = "declined";
      quote.declinedAt = new Date();
      await quote.save();
      await sendEmail({
        to: process.env.EMAIL_USER || "info@cleaniqservices.com",
        subject: `❌ Quote Declined - ${quote.companyName} | ${quote.quoteRef}`,
        html: generateQuoteResponseAlert(quote, "declined"),
      });
    }

    res.send(generateOutcomePage({ type: "decline", quote }));
  } catch (error) {
    console.error("Quote decline error:", error);
    res.status(500).send(generateOutcomePage({ type: "error" }));
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
      subject: `Professional Cleaning Service Quote ${quoteRef}`,
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
 * DELETE /api/quotes/:quoteRef
 * Permanently remove a quote from history
 */
router.delete("/:quoteRef", async (req, res) => {
  try {
    const { quoteRef } = req.params;
    const quote = await Quote.findOne({ quoteRef });
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }
    await moveToTrash(
      "Quote",
      quote,
      `${quote.quoteRef} — ${quote.companyName || quote.contactName || ""}`,
    );
    await quote.deleteOne();
    res.status(200).json({
      success: true,
      message: "Quote deleted",
    });
  } catch (error) {
    console.error("Quote delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete quote",
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
    .map((item, idx) => {
      const isHourly = item.billingType === "hourly";
      const pricingLabel = isHourly
        ? `${item.qty} hrs &times; £${Number(item.unitPrice || 0).toFixed(2)}/hr`
        : `Qty ${item.qty} &times; £${Number(item.unitPrice || 0).toFixed(2)}`;
      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      return `
    <tr style="background-color: ${rowBg};">
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: left; font-family: Arial, Helvetica, sans-serif;">
        <p style="margin: 0; font-weight: bold; color: #0f172a; font-size: 14px;">${item.service || item.customService}</p>
        ${item.description ? `<p style="margin: 6px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">${item.description}</p>` : ""}
        <p style="margin: 6px 0 0; font-size: 11px; color: #94a3b8;">${pricingLabel}</p>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #0f172a; font-size: 14px; font-family: Arial, Helvetica, sans-serif; white-space: nowrap;">£${(Number(item.unitPrice || 0) * item.qty).toFixed(2)}</td>
    </tr>`;
    })
    .join("");

  const summaryRow = (label, value, opts = {}) => `
    <tr>
      <td style="padding: 8px 0; font-size: 13px; color: ${opts.color || "#64748b"}; font-family: Arial, Helvetica, sans-serif;">${label}</td>
      <td style="padding: 8px 0; font-size: 13px; color: ${opts.color || "#0f172a"}; font-weight: ${opts.bold ? "bold" : "normal"}; text-align: right; font-family: Arial, Helvetica, sans-serif;">${value}</td>
    </tr>`;

  return `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">

            <!-- HEADER -->
            <tr>
              <td style="background-color: #0f172a; padding: 32px 40px; text-align: center;">
                <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Services" style="height: 48px; width: auto; margin-bottom: 16px;" />
                <p style="margin: 0; font-size: 11px; font-weight: bold; letter-spacing: 2px; color: #6ee7b7; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">Service Quote</p>
              </td>
            </tr>

            <!-- INTRO -->
            <tr>
              <td style="padding: 40px 40px 0;">
                <p style="margin: 0 0 4px; font-size: 13px; color: #64748b; font-family: Arial, Helvetica, sans-serif;">Quote Reference</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size: 22px; font-weight: bold; color: #0f172a; font-family: Arial, Helvetica, sans-serif;">${quoteRef}</td>
                    <td style="text-align: right; font-size: 13px; color: #64748b; font-family: Arial, Helvetica, sans-serif;">${date}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- PREPARED FOR -->
            <tr>
              <td style="padding: 28px 40px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 10px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif;">Prepared For</p>
                      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #0f172a; font-family: Arial, Helvetica, sans-serif;">${companyName}</p>
                      ${contactName ? `<p style="margin: 6px 0 0; font-size: 13px; color: #475569; font-family: Arial, Helvetica, sans-serif;">Attn: ${contactName}</p>` : ""}
                      ${phone ? `<p style="margin: 4px 0 0; font-size: 13px; color: #475569; font-family: Arial, Helvetica, sans-serif;">${phone}</p>` : ""}
                      ${address ? `<p style="margin: 4px 0 0; font-size: 13px; color: #475569; font-family: Arial, Helvetica, sans-serif;">${address}</p>` : ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- GREETING -->
            <tr>
              <td style="padding: 28px 40px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #334155; font-family: Arial, Helvetica, sans-serif;">Thank you for the opportunity to quote for your cleaning requirements. Please find the full breakdown of services and pricing below.</p>
              </td>
            </tr>

            <!-- SERVICES TABLE -->
            <tr>
              <td style="padding: 28px 40px 0;">
                <p style="margin: 0 0 12px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif;">Services & Scope of Work</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px;">
                  <tr style="background-color: #0f172a;">
                    <td style="padding: 12px 16px; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif;">Service</td>
                    <td style="padding: 12px 16px; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; font-family: Arial, Helvetica, sans-serif;">Amount</td>
                  </tr>
                  ${itemsHtml}
                </table>
              </td>
            </tr>

            <!-- PRICING SUMMARY -->
            <tr>
              <td style="padding: 24px 40px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="55%">&nbsp;</td>
                    <td width="45%">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        ${summaryRow("Subtotal", `£${subtotal.toFixed(2)}`)}
                        ${discountAmount > 0 ? summaryRow(`Discount (${discount}%)`, `-£${discountAmount.toFixed(2)}`, { color: "#059669" }) : ""}
                        ${discountAmount > 0 ? summaryRow("Subtotal after discount", `£${subtotalAfterDiscount.toFixed(2)}`) : ""}
                        ${includeVat && vat > 0 ? summaryRow(`VAT (${vatRate}%)`, `£${vat.toFixed(2)}`) : ""}
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px; border-top: 2px solid #0f172a;">
                        <tr>
                          <td style="padding: 12px 0 0; font-size: 14px; font-weight: bold; color: #0f172a; font-family: Arial, Helvetica, sans-serif;">Total${frequency !== "once" ? ` <span style="font-weight: normal; color: #64748b; font-size: 12px;">/ ${frequencyLabel.toLowerCase()}</span>` : ""}</td>
                          <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold; color: #0f172a; text-align: right; font-family: Arial, Helvetica, sans-serif;">£${grandTotal.toFixed(2)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${
              depositRequired && depositAmount > 0
                ? `
            <tr>
              <td style="padding: 20px 40px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      ${summaryRow(`Deposit required (${depositPercent}%)`, `£${depositAmount.toFixed(2)}`, { bold: true, color: "#0f172a" })}
                      ${summaryRow("Balance due", `£${balanceDue.toFixed(2)}`, { bold: true, color: "#0f172a" })}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }

            <!-- PAYMENT TERMS / RECURRING / VALIDITY -->
            <tr>
              <td style="padding: 24px 40px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 14px 0; border-top: 1px solid #e5e7eb; font-size: 13px; color: #475569; font-family: Arial, Helvetica, sans-serif;">
                      <strong style="color: #0f172a;">Payment terms:</strong> ${paymentTerms}
                    </td>
                  </tr>
                  ${
                    frequency !== "once"
                      ? `
                  <tr>
                    <td style="padding: 14px 0; border-top: 1px solid #e5e7eb; font-size: 13px; color: #475569; font-family: Arial, Helvetica, sans-serif;">
                      <strong style="color: #0f172a;">Recurring service:</strong> billed ${frequencyLabel.toLowerCase()}.
                    </td>
                  </tr>`
                      : ""
                  }
                  <tr>
                    <td style="padding: 14px 0; border-top: 1px solid #e5e7eb; font-size: 13px; color: #475569; font-family: Arial, Helvetica, sans-serif;">
                      <strong style="color: #0f172a;">Valid for:</strong> ${validDays} days from the date of issue.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${
              notes
                ? `
            <tr>
              <td style="padding: 4px 40px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      <p style="margin: 0 0 6px; font-size: 11px; font-weight: bold; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif;">Terms & Conditions</p>
                      <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">${notes}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }

            <!-- CTA -->
            <tr>
              <td style="padding: 32px 40px; text-align: center;">
                <p style="margin: 0 0 18px; font-size: 14px; color: #334155; font-family: Arial, Helvetica, sans-serif;">Ready to go ahead?</p>
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 6px; background-color: #005B41;">
                      <a href="https://api.cleaniqservices.com/api/quotes/${quoteRef}/accept" style="display: inline-block; padding: 14px 40px; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">Accept This Quote</a>
                    </td>
                  </tr>
                </table>
                <table cellpadding="0" cellspacing="0" style="margin: 18px auto 0;">
                  <tr>
                    <td style="padding: 0 14px; font-size: 12px;">
                      <a href="https://api.cleaniqservices.com/api/quotes/${quoteRef}/decline" style="color: #94a3b8; text-decoration: underline; font-family: Arial, Helvetica, sans-serif;">Not interested right now</a>
                    </td>
                    <td style="color: #cbd5e1;">|</td>
                    <td style="padding: 0 14px; font-size: 12px;">
                      <a href="mailto:info@cleaniqservices.com?subject=${encodeURIComponent(`Re: Quote ${quoteRef} - ${companyName}`)}" style="color: #0f172a; text-decoration: underline; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">Reply with questions</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center;">
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f172a; font-family: Arial, Helvetica, sans-serif;">Cleaniq Services Limited</p>
                <p style="margin: 6px 0 0; font-size: 12px; color: #64748b; font-family: Arial, Helvetica, sans-serif;">info@cleaniqservices.com &nbsp;&middot;&nbsp; cleaniqservices.com &nbsp;&middot;&nbsp; +44 7752 476368</p>
                <p style="margin: 10px 0 0; font-size: 11px; color: #94a3b8; font-family: Arial, Helvetica, sans-serif;">This is a confidential quote intended solely for the recipient named above.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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

// Simple branded confirmation page shown when a company clicks the
// "Accept This Quote" link from their email — this is a public, unauthenticated
// page, so it's rendered server-side rather than requiring a frontend route.
// Public-facing outcome page shown when a company clicks Accept/Decline from
// their quote email. Unauthenticated, so it's rendered server-side rather
// than requiring a frontend route + build.
function generateOutcomePage({ type, quote }) {
  const config = {
    accept: {
      badgeColor: "#059669",
      badgeBg: "#d1fae5",
      icon: "✓",
      heading: "Quote Accepted",
      message: `Thank you, ${quote?.contactName || quote?.companyName || "there"}! We've let our team know you'd like to go ahead with quote <strong>${quote?.quoteRef}</strong>.`,
      steps: [
        "Our team will review and confirm scheduling within 1 business day",
        "You'll receive a booking confirmation with the visit date & time",
        `${quote?.depositRequired ? "We'll send a secure payment link for the deposit" : "No deposit needed — we'll invoice per your agreed payment terms"}`,
      ],
    },
    decline: {
      badgeColor: "#64748b",
      badgeBg: "#f1f5f9",
      icon: "✕",
      heading: "Quote Declined",
      message: `No problem at all — thanks for letting us know, ${quote?.contactName || quote?.companyName || "there"}. We've closed out quote <strong>${quote?.quoteRef}</strong> on our end.`,
      steps: [
        "If the price or scope didn't quite fit, just reply to the original email — we're happy to revise it",
        "If now isn't the right time, we'll be here whenever you're ready",
      ],
    },
    notfound: {
      badgeColor: "#dc2626",
      badgeBg: "#fee2e2",
      icon: "!",
      heading: "Quote not found",
      message: "We couldn't find that quote. Please contact us directly and we'll help sort it out.",
      steps: [],
    },
    error: {
      badgeColor: "#dc2626",
      badgeBg: "#fee2e2",
      icon: "!",
      heading: "Something went wrong",
      message: "Please contact us directly so we can confirm your quote.",
      steps: [],
    },
  }[type];

  const stepsHtml = config.steps.length
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px; background-color: #f8fafc; border-radius: 8px;">
      <tr><td style="padding: 18px 22px 6px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">What happens next</td></tr>
      ${config.steps
        .map(
          (s, i) => `
      <tr>
        <td style="padding: 8px 22px ${i === config.steps.length - 1 ? "18px" : "0"};">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align: top; padding-right: 10px;"><span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: #0f172a; color: #ffffff; font-size: 11px; font-weight: bold; text-align: center; line-height: 20px;">${i + 1}</span></td>
            <td style="font-size: 13px; line-height: 1.6; color: #334155;">${s}</td>
          </tr></table>
        </td>
      </tr>`,
        )
        .join("")}
    </table>`
    : "";

  return `
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Cleaniq Services</title></head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 48px 16px;">
      <tr>
        <td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="width: 520px; max-width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="background-color: #0f172a; padding: 28px; text-align: center;">
                <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Services" style="height: 40px;" />
              </td>
            </tr>
            <tr>
              <td style="padding: 44px 40px; text-align: center;">
                <span style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: ${config.badgeBg}; color: ${config.badgeColor}; font-size: 26px; font-weight: bold;">${config.icon}</span>
                <h1 style="margin: 20px 0 12px; font-size: 22px; color: #0f172a;">${config.heading}</h1>
                <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #475569;">${config.message}</p>
                ${quote?.quoteRef ? `<p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">Reference: ${quote.quoteRef}</p>` : ""}
                ${stepsHtml}
                <a href="https://cleaniqservices.com" style="display: inline-block; margin-top: 28px; padding: 12px 28px; background-color: #005B41; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold;">Return to Cleaniq Services</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function generateQuoteResponseAlert(quote, outcome, bookingsCreated = 0) {
  const isAccepted = outcome === "accepted";
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: ${isAccepted ? "#059669" : "#475569"}; padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">${isAccepted ? "✅ Quote Accepted" : "❌ Quote Declined"}</h1>
      </div>
      <div style="padding: 32px;">
        <p style="margin: 0 0 20px; font-size: 14px; color: #475569;"><strong>${quote.companyName}</strong> has ${isAccepted ? "accepted" : "declined"} their quote.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 8px;">
          <tr><td style="padding: 16px 20px 4px; font-size: 12px; color: #64748b;">Quote Ref</td></tr>
          <tr><td style="padding: 0 20px 16px; font-size: 15px; font-weight: bold; color: #0f172a;">${quote.quoteRef}</td></tr>
          <tr><td style="padding: 0 20px 4px; font-size: 12px; color: #64748b;">Company</td></tr>
          <tr><td style="padding: 0 20px 16px; font-size: 15px; color: #0f172a;">${quote.companyName}${quote.contactName ? ` (Attn: ${quote.contactName})` : ""}</td></tr>
          <tr><td style="padding: 0 20px 4px; font-size: 12px; color: #64748b;">Contact</td></tr>
          <tr><td style="padding: 0 20px 16px; font-size: 15px; color: #0f172a;">${quote.email}${quote.phone ? ` &middot; ${quote.phone}` : ""}</td></tr>
          <tr><td style="padding: 0 20px 4px; font-size: 12px; color: #64748b;">Total Value</td></tr>
          <tr><td style="padding: 0 20px ${bookingsCreated ? "4px" : "20px"}; font-size: 18px; font-weight: bold; color: ${isAccepted ? "#059669" : "#475569"};">£${Number(quote.grandTotal || 0).toFixed(2)}</td></tr>
          ${
            bookingsCreated
              ? `<tr><td style="padding: 0 20px 20px; font-size: 13px; color: #059669; font-weight: bold;">📅 ${bookingsCreated} booking${bookingsCreated > 1 ? "s" : ""} added to the calendar automatically</td></tr>`
              : ""
          }
        </table>
        <a href="https://cleaniqservices.com/admin/quotes" style="display: block; text-align: center; margin-top: 24px; background-color: #0f172a; color: #ffffff; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px;">View in Quote History</a>
      </div>
    </div>`;
}

// When a quote with a scheduled service date/time is accepted, automatically
// create the matching booking(s) so they appear on the calendar — a single
// booking for one-time quotes, or a forward-looking series for recurring ones.
async function generateBookingsFromQuote(quote) {
  if (!quote.serviceDate) return 0;

  const OCCURRENCES_BY_FREQUENCY = {
    once: 1,
    weekly: 12,
    biweekly: 8,
    monthly: 6,
    quarterly: 4,
    yearly: 2,
  };
  const occurrenceCount = OCCURRENCES_BY_FREQUENCY[quote.frequency] || 1;

  const addInterval = (date, frequency, index) => {
    const d = new Date(date);
    switch (frequency) {
      case "weekly":
        d.setDate(d.getDate() + 7 * index);
        break;
      case "biweekly":
        d.setDate(d.getDate() + 14 * index);
        break;
      case "monthly":
        d.setMonth(d.getMonth() + index);
        break;
      case "quarterly":
        d.setMonth(d.getMonth() + 3 * index);
        break;
      case "yearly":
        d.setFullYear(d.getFullYear() + index);
        break;
      default:
        break;
    }
    return d;
  };

  const serviceLabel =
    quote.items
      .map((i) => i.service || i.customService)
      .filter(Boolean)
      .join(", ") || "Quoted Cleaning Service";

  const [firstName, ...rest] = (quote.contactName || quote.companyName || "Customer").split(" ");

  const bookings = Array.from({ length: occurrenceCount }, (_, i) => ({
    bookingId: `Q-${quote.quoteRef}-${i + 1}`,
    customer: {
      firstName: firstName || quote.companyName,
      lastName: rest.join(" ") || quote.companyName,
      email: quote.email,
      phone: quote.phone || "",
    },
    service: serviceLabel,
    details: {
      address: quote.address || "",
      frequency:
        quote.frequency === "once"
          ? "Once"
          : FREQUENCY_LABELS[quote.frequency] || quote.frequency,
      duration: 2,
      notes: `Generated from accepted quote ${quote.quoteRef} (${quote.companyName})`,
    },
    schedule: {
      date: addInterval(quote.serviceDate, quote.frequency, i),
      timeSlot: quote.serviceTimeSlot || "Morning (8am-12pm)",
    },
    payment: {
      amount: quote.grandTotal || 0,
      currency: "GBP",
      status: "Pending",
    },
    region: "UK",
    leadSource: "Quote Accepted",
    // Accepting a quote doesn't mean payment has happened yet — stays
    // Pending until an invoice is sent (Confirmed) and the job is done
    // (Completed).
    status: "Pending",
    meta:
      occurrenceCount > 1 ? { recurringGroup: `Q-${quote.quoteRef}` } : {},
  }));

  await Booking.insertMany(bookings);
  return bookings.length;
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
