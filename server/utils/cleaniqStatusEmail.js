/* ==========================================================================
   CLEANIQ BOOKING STATUS EMAIL: email-client-safe redesign

   HOW TO USE (2 steps)
   1. Save this file next to emailService.js, keeping the name
      cleaniqStatusEmail.js
   2. In emailService.js, add ONE line right after the closing `}` of
      `function buildBookingStatusUpdateEmail(booking) { ... }` and BEFORE the
      line `// Templates` / `const templates = {`:

          buildBookingStatusUpdateEmail = require("./cleaniqStatusEmail");

   That replaces the function everywhere it's used (the export and
   workerEventEmails.bookingStatusUpdate both pick up the new version).
   Same name, same argument (a booking object).
   ========================================================================== */

const FONT = "Arial,Helvetica,sans-serif";
const LOGO = "https://cleaniqservices.com/preview.jpg";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// header = solid header colour, accent = links/emphasis, bg/border = details box,
// badge/badgeText = status pill
const STATUS = {
  Confirmed: {
    header: "#0A5C43", accent: "#059669", bg: "#f0fdf4", border: "#a7f3d0", badge: "#dcfce7", badgeText: "#166534",
    headline: "Booking Confirmed!", sub: "We’re looking forward to seeing you.",
    body: `Your booking has been <strong style="color:#059669;">confirmed</strong>. We’ll be there on the scheduled date.`,
  },
  Pending: {
    header: "#B45309", accent: "#d97706", bg: "#fffbeb", border: "#fde68a", badge: "#fef3c7", badgeText: "#92400e",
    headline: "Booking Received", sub: "We’ve got your booking request.",
    body: `Your booking is currently <strong style="color:#d97706;">pending</strong>. We will confirm it shortly.`,
  },
  Assigned: {
    header: "#1D4ED8", accent: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", badge: "#dbeafe", badgeText: "#1e40af",
    headline: "Cleaner Assigned", sub: "A cleaner has been allocated to your job.",
    body: `Great news: a cleaner has been <strong style="color:#2563eb;">assigned</strong> to your booking and will be with you on the scheduled date.`,
  },
  Arrived: {
    header: "#0E7490", accent: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", badge: "#cffafe", badgeText: "#155e75",
    headline: "Cleaner Has Arrived", sub: "Your cleaner is on-site.",
    body: `Your cleaner has <strong style="color:#0891b2;">arrived</strong> at the property and will begin shortly.`,
  },
  "In Progress": {
    header: "#C2410C", accent: "#ea580c", bg: "#fff7ed", border: "#fed7aa", badge: "#ffedd5", badgeText: "#7c2d12",
    headline: "Cleaning In Progress", sub: "Your clean is underway.",
    body: `Your cleaning service is now <strong style="color:#ea580c;">in progress</strong>. We’ll let you know when it’s done.`,
  },
  Cancelled: {
    header: "#B91C1C", accent: "#dc2626", bg: "#fef2f2", border: "#fecaca", badge: "#fee2e2", badgeText: "#991b1b",
    headline: "Booking Cancelled", sub: "We’re sorry to see this booking go.",
    body: `Your booking has been <strong style="color:#dc2626;">cancelled</strong>. If this was a mistake or you’d like to rebook, please get in touch.`,
  },
};

const buildBookingStatusUpdateEmail = (booking) => {
  const b = booking || {};
  const status = b.status || "";
  const cfg = STATUS[status] || {
    header: "#475569", accent: "#475569", bg: "#f8fafc", border: "#e2e8f0", badge: "#f1f5f9", badgeText: "#334155",
    headline: `Booking ${esc(status)}`.trim(), sub: "Your booking status has been updated.",
    body: `Your booking status has been updated to <strong>${esc(status)}</strong>.`,
  };

  const firstName = b.customer?.firstName || "there";
  const bookingId = b.bookingId || "";
  const service = b.service || "Cleaning Service";

  let dateStr = "";
  if (b.schedule?.date) {
    const dt = new Date(b.schedule.date);
    if (!isNaN(dt)) {
      dateStr = dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
  }
  const timeSlot = b.schedule?.timeSlot || "";
  const address = b.details?.address || "";
  const amountNum = Number(b.payment?.amount);
  const amount = b.payment?.amount !== undefined && b.payment?.amount !== null && b.payment?.amount !== "" && Number.isFinite(amountNum)
    ? `£${amountNum.toFixed(2)}`
    : "";

  const rows = [
    ["Service", service],
    ["Date", dateStr],
    ["Time Slot", timeSlot],
    ["Address", address],
    ["Amount", amount],
  ].filter(([, v]) => v);

  const rowsHtml = rows
    .map(
      ([label, value], i) => `<tr>
        <td width="38%" valign="top" style="padding:11px 0;${i < rows.length - 1 ? `border-bottom:1px solid ${cfg.border};` : ""}font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;color:#64748b;">${esc(label)}</td>
        <td valign="top" align="right" style="padding:11px 0;${i < rows.length - 1 ? `border-bottom:1px solid ${cfg.border};` : ""}font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#0f172a;text-align:right;">${esc(value)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${cfg.headline} — Cleaniq Services</title>
<style>
  @media only screen and (max-width:600px){
    .em-card{width:100%!important;border-radius:0!important}
    .em-pad{padding:28px 20px!important}
    .em-hpad{padding:32px 20px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#eef0f3;font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#eef0f3;">${esc(`${cfg.headline.replace(/<[^>]*>/g, "")} Booking ${bookingId}: ${status}.`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef0f3" style="background-color:#eef0f3;">
<tr><td align="center" style="padding:32px 12px;">

  <table role="presentation" class="em-card" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;">

    <!-- HEADER -->
    <tr>
      <td class="em-hpad" align="center" bgcolor="${cfg.header}" style="background-color:${cfg.header};padding:40px 48px;text-align:center;border-radius:16px 16px 0 0;">
        <img src="${LOGO}" alt="Cleaniq Services" width="70" style="display:block;width:70px;max-width:100%;height:auto;border:0;border-radius:10px;margin:0 auto 18px;" />
        ${status ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 14px;"><tr><td bgcolor="${cfg.badge}" style="background-color:${cfg.badge};border-radius:20px;padding:6px 18px;font-family:${FONT};font-size:11px;line-height:14px;font-weight:800;color:${cfg.badgeText};text-transform:uppercase;letter-spacing:1.5px;">${esc(status)}</td></tr></table>` : ""}
        <h1 style="margin:0;font-family:${FONT};color:#ffffff;font-size:26px;line-height:32px;font-weight:800;">${cfg.headline}</h1>
        <p style="margin:10px 0 0;font-family:${FONT};color:#f1f5f9;font-size:14px;line-height:20px;">${cfg.sub}</p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td class="em-pad" style="padding:36px 48px;font-family:${FONT};color:#1e293b;">
        <h2 style="margin:0 0 12px;font-family:${FONT};font-size:20px;line-height:26px;font-weight:700;color:#0F172A;">Hi ${esc(firstName)},</h2>
        <p style="margin:0 0 24px;font-family:${FONT};font-size:15px;line-height:24px;color:#475569;">${cfg.body}</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
          <tr>
            <td bgcolor="${cfg.bg}" style="background-color:${cfg.bg};border:1px solid ${cfg.border};border-radius:12px;padding:22px 22px 12px;font-family:${FONT};">
              <p style="margin:0 0 4px;font-size:11px;line-height:16px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Booking Reference</p>
              <p style="margin:0 0 14px;font-size:22px;line-height:28px;font-weight:800;color:#0F172A;word-break:break-all;">${esc(bookingId)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${cfg.border};">
                ${rowsHtml}
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 24px;font-family:${FONT};font-size:13px;line-height:22px;color:#64748b;">Questions or changes? Contact us at <a href="mailto:info@cleaniqservices.com" style="color:${cfg.accent};font-weight:700;text-decoration:none;">info@cleaniqservices.com</a>.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
          <tr><td align="center" bgcolor="#0A5C43" style="background-color:#0A5C43;border-radius:8px;"><a href="https://cleaniqservices.com" target="_blank" style="display:inline-block;padding:15px 36px;font-family:${FONT};font-size:14px;line-height:18px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">Visit Cleaniq Services</a></td></tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td align="center" bgcolor="#f8fafc" style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 32px;text-align:center;border-radius:0 0 16px 16px;font-family:${FONT};">
        <p style="margin:0 0 4px;font-size:12px;line-height:18px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Cleaniq Services Ltd &nbsp;&middot;&nbsp; Manchester, UK</p>
        <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">Professional Cleaning You Can Trust</p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
};

module.exports = buildBookingStatusUpdateEmail;