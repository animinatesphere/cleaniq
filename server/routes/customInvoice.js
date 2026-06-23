const express = require("express");
const router = express.Router();
const { sendEmail, templates } = require("../utils/emailService");
const { htmlToPdfBuffer } = require("../utils/pdf");

// POST /api/custom-invoice/send — build and email a free-form invoice
router.post("/send", async (req, res) => {
  try {
    const data = req.body;
    if (!data.customerEmail || !Array.isArray(data.items) || data.items.length === 0) {
      return res
        .status(400)
        .json({ message: "Customer email and at least one item are required" });
    }

    const html = templates.customInvoice(data);
    const ok = await sendEmail({
      to: data.customerEmail,
      subject: `Invoice${data.invoiceNumber ? ` ${data.invoiceNumber}` : ""} from Cleaniq Services`,
      html,
    });

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
