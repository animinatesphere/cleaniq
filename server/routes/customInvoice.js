const express = require("express");
const router = express.Router();
const { sendEmail, templates } = require("../utils/emailService");
const { htmlToPdfBuffer } = require("../utils/pdf");

// POST /api/custom-invoice/payment-link — generate a Stripe Checkout link
// for the invoice total, to embed as a "Pay Now" button when admin wants one.
router.post("/payment-link", async (req, res) => {
  try {
    const data = req.body;
    const subtotal = (data.items || []).reduce(
      (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0),
      0,
    );
    if (subtotal <= 0) {
      return res.status(400).json({ message: "Invoice total must be greater than zero" });
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: data.customerEmail || undefined,
      // Authorize but don't capture — money is only actually deducted once
      // the job is marked Completed (see the capture-on-complete logic in
      // the booking PUT route). If this invoice is tied to a real booking,
      // attaching bookingId here lets the existing Stripe webhook pick it
      // up and store the PaymentIntent against that booking automatically.
      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          ...(data.bookingId ? { bookingId: data.bookingId } : {}),
          invoiceNumber: data.invoiceNumber || "",
          company: "Cleaniq Services",
        },
      },
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Cleaniq Invoice${data.invoiceNumber ? ` ${data.invoiceNumber}` : ""}`,
            },
            unit_amount: Math.round(subtotal * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || "https://cleaniqservices.com"}/account/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || "https://cleaniqservices.com"}/account/dashboard?payment=cancelled`,
      metadata: {
        bookingId: data.bookingId || "",
        invoiceNumber: data.invoiceNumber || "",
        type: "custom-invoice",
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Custom invoice payment-link error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/custom-invoice/send — build and email a free-form invoice with PDF attachment
router.post("/send", async (req, res) => {
  try {
    const data = req.body;
    if (!data.customerEmail || !Array.isArray(data.items) || data.items.length === 0) {
      return res
        .status(400)
        .json({ message: "Customer email and at least one item are required" });
    }

    const html = templates.customInvoice(data);
    const invoiceLabel = data.invoiceNumber ? ` ${data.invoiceNumber}` : "";
    const subject = `Invoice${invoiceLabel} from Cleaniq Services`;

    // Generate PDF attachment so customers can download it directly from the email
    let attachments = [];
    try {
      const pdfBuffer = await htmlToPdfBuffer(html, `Cleaniq Services - Invoice${invoiceLabel}`);
      attachments = [{
        filename: `Cleaniq-Invoice${invoiceLabel.replace(/\s+/g, "-")}.pdf`,
        content: pdfBuffer,
      }];
    } catch (pdfErr) {
      console.warn("PDF attachment generation failed, sending email without attachment:", pdfErr.message);
    }

    const ok = await sendEmail({ to: data.customerEmail, subject, html, attachments });
    if (!ok) return res.status(500).json({ message: "Failed to send invoice email" });
    res.json({ message: "Invoice sent successfully" });
  } catch (err) {
    console.error("Custom invoice send error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/custom-invoice/pdf — generate the same invoice as a downloadable PDF
router.post("/pdf", async (req, res) => {
  try {
    const data = req.body;
    const html = templates.customInvoice(data);
    const pdf = await htmlToPdfBuffer(
      html,
      `Cleaniq Services - Invoice${data.invoiceNumber ? ` ${data.invoiceNumber}` : ""}`,
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Cleaniq-Invoice${data.invoiceNumber ? `-${data.invoiceNumber}` : ""}.pdf"`,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (err) {
    console.error("Custom invoice PDF error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
