// Shared invoice HTML builder — used by both the email template and the
// public PDF download route. Design mirrors the InvoiceBuilder exactly.
function buildBookingInvoiceHtml(booking, opts = {}) {
  const { includeDownloadButton = false, downloadUrl = "" } = opts;

  const logoUrl = "https://cleaniqservices.com/preview.jpg";

  const issueDate   = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const serviceDateRaw = booking.schedule?.date ? new Date(booking.schedule.date) : null;
  const serviceDate = serviceDateRaw
    ? serviceDateRaw.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const amount      = booking.payment?.amount ?? "0.00";
  const isFlat      = booking.payment?.billingType === "flat";
  const isPaid      = ["Completed", "Paid"].includes(booking.status);
  const bookingId   = booking.bookingId || "";

  const customer = booking.customer || {};
  const details  = booking.details  || {};
  const schedule = booking.schedule || {};

  const firstName = customer.firstName || "";
  const lastName  = customer.lastName  || "";
  const email     = customer.email     || "";
  const phone     = customer.phone     || "";
  const address   = details.address   || "";
  const postcode  = details.postcode  || "";
  const duration  = details.duration  || "";
  const frequency = details.frequency || "";
  const service   = booking.service   || "Cleaning Service";
  const timeSlot  = schedule.timeSlot || "";

  const addressLine = address
    ? address + (postcode && !address.toLowerCase().includes(postcode.toLowerCase()) ? ", " + postcode : "")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Invoice ${bookingId} — Cleaniq Services</title>
<style>
  @media only screen and (max-width:600px){
    .em-card{width:100%!important;border-radius:0!important}
    .em-col-half{display:block!important;width:100%!important}
  }
  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,'Helvetica Neue',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table class="em-card" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.09);">

  <!-- HEADER -->
  <tr><td style="background:#0A5C43;padding:32px 44px 26px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle" style="width:50%;">
        <img src="${logoUrl}" alt="Cleaniq Services" style="height:52px;width:auto;display:block;border-radius:8px;" />
        <p style="margin:8px 0 0;font-size:9px;font-weight:800;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:2px;">Professional Cleaning Services</p>
      </td>
      <td valign="middle" align="right" style="width:50%;">
        <p style="margin:0;font-size:34px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1;">INVOICE</p>
        <p style="margin:6px 0 0;font-size:13px;font-weight:700;color:#6EE7B7;">${bookingId}</p>
        ${isPaid ? `<span style="display:inline-block;margin-top:10px;background:#6ee7b7;color:#064e3b;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;padding:4px 14px;border-radius:999px;">&#10003; PAID IN FULL</span>` : ""}
      </td>
    </tr></table>
  </td></tr>

  <!-- META BAR -->
  <tr><td style="background:#f0fdf4;border-top:3px solid #0A5C43;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td class="em-col-half" style="padding:11px 18px;border-right:1px solid #bbf7d0;width:25%;">
        <p style="margin:0 0 3px;font-size:7px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;">Invoice #</p>
        <p style="margin:0;font-size:11px;font-weight:700;color:#0f172a;">${bookingId}</p>
      </td>
      <td class="em-col-half" style="padding:11px 18px;border-right:1px solid #bbf7d0;width:25%;">
        <p style="margin:0 0 3px;font-size:7px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;">Issue Date</p>
        <p style="margin:0;font-size:11px;font-weight:700;color:#0f172a;">${issueDate}</p>
      </td>
      <td class="em-col-half" style="padding:11px 18px;border-right:1px solid #bbf7d0;width:25%;">
        <p style="margin:0 0 3px;font-size:7px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;">Service Date</p>
        <p style="margin:0;font-size:11px;font-weight:700;color:#0f172a;">${serviceDate}</p>
      </td>
      <td class="em-col-half" style="padding:11px 18px;width:25%;">
        <p style="margin:0 0 3px;font-size:7px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;">Status</p>
        <p style="margin:0;font-size:11px;font-weight:800;color:${isPaid ? "#16a34a" : "#d97706"};">${isPaid ? "&#10003; Paid" : "Payment Due"}</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- BILLING INFO -->
  <tr><td style="padding:28px 44px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td class="em-col-half" valign="top" style="width:50%;padding-right:16px;">
        <p style="margin:0 0 8px;font-size:8px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;border-bottom:2px solid #d1fae5;padding-bottom:5px;">Billed To</p>
        <p style="margin:0;font-size:15px;font-weight:800;color:#0f172a;">${firstName} ${lastName}</p>
        ${email    ? `<p style="margin:3px 0 0;font-size:12px;color:#64748b;">${email}</p>` : ""}
        ${phone    ? `<p style="margin:2px 0 0;font-size:12px;color:#64748b;">${phone}</p>` : ""}
        ${addressLine ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;line-height:1.5;">${addressLine}</p>` : ""}
      </td>
      <td class="em-col-half" valign="top" align="right" style="width:50%;padding-left:16px;">
        <p style="margin:0 0 8px;font-size:8px;font-weight:800;color:#0A5C43;text-transform:uppercase;letter-spacing:1.2px;border-bottom:2px solid #d1fae5;padding-bottom:5px;">From</p>
        <p style="margin:0;font-size:15px;font-weight:800;color:#0f172a;">Cleaniq Services Ltd</p>
        <p style="margin:3px 0 0;font-size:12px;color:#64748b;">info@cleaniqservices.com</p>
        <p style="margin:2px 0 0;font-size:12px;color:#64748b;">+44 7752 476368</p>
        <p style="margin:2px 0 0;font-size:12px;color:#64748b;">cleaniqservices.com</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- LINE ITEMS -->
  <tr><td style="padding:0 44px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
      <thead>
        <tr style="background:#0f172a;">
          <th style="padding:12px 16px;font-size:8px;font-weight:800;color:#6ee7b7;text-transform:uppercase;letter-spacing:1px;text-align:left;">Service Description</th>
          <th style="padding:12px 16px;font-size:8px;font-weight:800;color:#6ee7b7;text-transform:uppercase;letter-spacing:1px;text-align:center;width:100px;">${isFlat ? "Type" : "Duration"}</th>
          <th style="padding:12px 16px;font-size:8px;font-weight:800;color:#6ee7b7;text-transform:uppercase;letter-spacing:1px;text-align:right;width:110px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background:#ffffff;">
          <td style="padding:16px;font-size:13px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">
            ${service}
            ${timeSlot  ? `<br><span style="font-size:11px;color:#64748b;font-weight:500;">Time: ${timeSlot}</span>` : ""}
            ${frequency ? `<br><span style="font-size:11px;color:#64748b;font-weight:500;">Frequency: ${frequency}</span>` : ""}
            ${addressLine ? `<br><span style="font-size:11px;color:#64748b;font-weight:500;">&#128205; ${addressLine}</span>` : ""}
          </td>
          <td style="padding:16px;font-size:13px;color:#334155;font-weight:600;text-align:center;border-bottom:1px solid #f1f5f9;">${isFlat ? "Flat Rate" : (duration ? duration + " hrs" : "N/A")}</td>
          <td style="padding:16px;font-size:14px;font-weight:800;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">&#163;${amount}</td>
        </tr>
      </tbody>
    </table>
  </td></tr>

  <!-- TOTAL -->
  <tr><td style="padding:16px 44px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td></td>
      <td style="width:220px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A5C43;border-radius:0 0 12px 12px;overflow:hidden;">
          <tr>
            <td style="padding:14px 18px;font-size:10px;font-weight:800;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">${isPaid ? "Total Paid" : "Total Due"}</td>
            <td style="padding:14px 18px;font-size:22px;font-weight:900;color:#ffffff;text-align:right;">&#163;${amount}</td>
          </tr>
        </table>
      </td>
    </tr></table>
  </td></tr>

  <!-- THANK YOU + REVIEW -->
  <tr><td style="padding:0 44px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:22px;text-align:center;">
        <p style="margin:0;font-size:15px;font-weight:800;color:#065f46;">Thank you for choosing Cleaniq Services!</p>
        <p style="margin:6px 0 14px;font-size:13px;color:#059669;">We hope you&#39;re delighted with your clean.</p>
        <a href="https://g.page/r/CTGJLR1Z7dySEBM/review" style="display:inline-block;background:#059669;color:#fff;padding:11px 26px;border-radius:8px;text-decoration:none;font-weight:800;font-size:13px;">Leave a Review &#11088;</a>
      </td>
    </tr></table>
  </td></tr>

  ${includeDownloadButton ? `
  <!-- DOWNLOAD/PRINT BUTTON (only in email, hidden when printing) -->
  <tr><td style="padding:0 44px 32px;text-align:center;" class="no-print">
    <a href="${downloadUrl}" style="display:inline-block;background:#0f172a;color:#6EE7B7;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.5px;">&#11015; Download PDF Receipt</a>
  </td></tr>
  ` : `
  <!-- PRINT BUTTON (shown in browser, hidden when printing) -->
  <tr><td style="padding:0 44px 32px;text-align:center;" class="no-print">
    <button onclick="window.print()" style="display:inline-block;background:#0f172a;color:#6EE7B7;padding:16px 40px;border-radius:10px;border:none;cursor:pointer;font-weight:800;font-size:14px;letter-spacing:0.5px;font-family:Arial,sans-serif;">&#11015; Save / Print as PDF</button>
    <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">In the print dialog, choose &ldquo;Save as PDF&rdquo;</p>
  </td></tr>
  `}

  <!-- FOOTER -->
  <tr><td style="background:#0A5C43;padding:20px 44px;text-align:center;">
    <p style="margin:0;font-size:13px;font-weight:800;color:#ffffff;">Thank you for choosing Cleaniq Services</p>
    <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.6);">We&#39;re committed to delivering a spotless clean every time.</p>
  </td></tr>
  <tr><td style="background:#0f172a;padding:16px 44px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#64748b;font-weight:600;">Cleaniq Services Limited</p>
    <p style="margin:4px 0 0;font-size:10px;color:#475569;">info@cleaniqservices.com &nbsp;&middot;&nbsp; cleaniqservices.com &nbsp;&middot;&nbsp; +44 7752 476368</p>
    <p style="margin:6px 0 0;font-size:9px;color:#334155;">&copy; ${new Date().getFullYear()} Cleaniq Services. All rights reserved.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

module.exports = { buildBookingInvoiceHtml };
