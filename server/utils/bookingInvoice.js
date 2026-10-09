// The customer's invoice & receipt when a clean is completed — whether the cleaner finishes it in
// the worker app or admin marks it Completed. Sent once per booking (meta.invoiceSentAt); admin can
// still resend from the booking (POST /api/bookings/:id/send-invoice).

// PDF copy of the invoice; [] if PDF generation isn't available (the email still goes).
async function buildInvoiceAttachment(booking) {
  try {
    const { buildBookingInvoiceHtml } = require("./invoiceHtml");
    const { htmlToPdfBuffer } = require("./pdf");
    const html = buildBookingInvoiceHtml(booking, { includeDownloadButton: false });
    const buf = await htmlToPdfBuffer(html, `Cleaniq Invoice ${booking.bookingId}`);
    return [{ filename: `Cleaniq-Invoice-${booking.bookingId}.pdf`, content: buf.toString("base64") }];
  } catch {
    return [];
  }
}

/** @returns {Promise<boolean>} true if this call sent it */
async function sendCompletionInvoice(booking) {
  const Booking = require("../models/Booking");
  const { sendEmail, templates } = require("./emailService");
  const email = String(booking?.customer?.email || "").trim();
  if (!email) return false;

  // Atomic claim: only one completion (worker app or admin) sends it.
  const now = new Date();
  const claimed = await Booking.updateOne(
    { _id: booking._id, "meta.invoiceSentAt": { $exists: false } },
    { $set: { "meta.invoiceSentAt": now } },
  );
  if (!claimed.modifiedCount) return false;

  try {
    const ok = await sendEmail({
      to: email,
      subject: `Your Cleaniq Invoice & Receipt: ${booking.bookingId}`,
      html: templates.invoiceReceipt(booking),
      attachments: await buildInvoiceAttachment(booking),
    });
    if (ok === false) throw new Error("email service refused it");
    booking.meta = { ...(booking.meta || {}), invoiceSentAt: now };
    console.log(`📧 Invoice sent to ${email} for ${booking.bookingId}`);
    return true;
  } catch (err) {
    // Let it be sent again (next completion or admin's Send Invoice).
    await Booking.updateOne({ _id: booking._id, "meta.invoiceSentAt": now }, { $unset: { "meta.invoiceSentAt": "" } }).catch(() => {});
    console.error(`❌ Invoice email failed for ${booking.bookingId}:`, err.message);
    return false;
  }
}

module.exports = { buildInvoiceAttachment, sendCompletionInvoice };
