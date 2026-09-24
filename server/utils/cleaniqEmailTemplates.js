/* ==========================================================================
   CLEANIQ EMAIL TEMPLATES: email-client-safe redesign

   HOW TO USE (2 steps)
   1. Save this file next to your existing templates file, keeping the name
      cleaniqEmailTemplates.js.
   2. In your existing templates file, add ONE line right after the closing
      `};` of `const templates = { ... }` and BEFORE `module.exports`:

          Object.assign(templates, require("./cleaniqEmailTemplates"));

   Every template in this file replaces the old one with the same name.
   Nothing else needs to change. Your old versions can stay in the file
   (they're simply overridden) and you can delete them whenever you like.
   ========================================================================== */

/* ============================== SHARED HELPERS ============================== */

const BRAND = { green: "#0A5C43", dark: "#0F172A", mint: "#6EE7B7" };
const FONT = "Arial,Helvetica,sans-serif";
const LOGO = "https://cleaniqservices.com/preview.jpg";
const LOGO_WIDE = "https://cleaniqservices.com/lOGO.png"; // used by customInvoice
const BANK = {
  bank: "HSBC Bank",
  name: "Cleaniq Services Limited",
  sort: "40-11-56",
  acc: "81106546",
};

// Escape user-supplied text before it goes into HTML
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const nl2br = (s) => esc(s).replace(/\r?\n/g, "<br />");
const raw = (html) => ({ __raw: html }); // mark a value as already-safe HTML
const val = (v) => (v && typeof v === "object" && "__raw" in v ? v.__raw : esc(v));

const fmtDate = (d) => {
  const dt = new Date(d);
  return isNaN(dt)
    ? ""
    : dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
const timeLabel = (s = {}) =>
  [s.timeSlot, s.preferredTime && `(${s.preferredTime})`].filter(Boolean).join(" ");
const fullAddress = (d = {}) => {
  const a = d.address || "";
  const pc = d.postcode || "";
  if (!pc) return a;
  if (!a) return pc;
  return a.toLowerCase().includes(pc.toLowerCase()) ? a : `${a}, ${pc}`;
};
const extraLabel = (e) =>
  e && typeof e === "object" ? `${e.name}${(e.qty || 1) > 1 ? ` × ${e.qty}` : ""}` : e;
const propertyRows = (booking) => {
  const d = booking.details || {};
  const p = booking.property || {};
  return [
    ["Bedrooms", p.bedrooms ?? d.Bedroom],
    ["Bathrooms", p.bathrooms ?? d.Bathroom],
    ["Kitchens", p.kitchens ?? d.Kitchen],
    ["Living rooms", p.livingRooms ?? d["Living Room"]],
  ];
};

/* ---- Page shell: header + body + footer (600px, tables only) ---- */
const layout = ({
  title,
  preheader = "",
  headerBg = BRAND.green,
  subColor = "#d1fae5",
  logoSrc = LOGO,
  logoWidth = 70,
  eyebrow = "",
  heading = "",
  sub = "",
  badge = "",
  body = "",
}) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${esc(title)} — Cleaniq Services</title>
<style>
  @media only screen and (max-width:600px){
    .em-card{width:100%!important;border-radius:0!important}
    .em-pad{padding:28px 20px!important}
    .em-hpad{padding:32px 20px!important}
    .stack{display:block!important;width:100%!important;padding-left:0!important;padding-right:0!important;padding-bottom:12px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#eef0f3;font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#eef0f3;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef0f3" style="background-color:#eef0f3;">
<tr><td align="center" style="padding:32px 12px;">

  <table role="presentation" class="em-card" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;">

    <!-- HEADER -->
    <tr>
      <td class="em-hpad" align="center" bgcolor="${headerBg}" style="background-color:${headerBg};padding:40px 48px;text-align:center;border-radius:16px 16px 0 0;">
        ${logoSrc ? `<img src="${logoSrc}" alt="Cleaniq Services" width="${logoWidth}" style="display:block;width:${logoWidth}px;max-width:100%;height:auto;border:0;border-radius:10px;margin:0 auto 18px;" />` : ""}
        ${eyebrow ? `<p style="margin:0;font-family:${FONT};color:${BRAND.mint};font-size:11px;line-height:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${esc(eyebrow)}</p>` : ""}
        <h1 style="margin:8px 0 0;font-family:${FONT};color:#ffffff;font-size:26px;line-height:32px;font-weight:800;">${esc(heading)}</h1>
        ${sub ? `<p style="margin:10px 0 0;font-family:${FONT};color:${subColor};font-size:14px;line-height:20px;">${esc(sub)}</p>` : ""}
        ${badge ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:14px auto 0;"><tr><td bgcolor="${BRAND.mint}" style="background-color:${BRAND.mint};border-radius:20px;padding:6px 18px;font-family:${FONT};font-size:11px;line-height:14px;font-weight:800;color:#064e3b;text-transform:uppercase;letter-spacing:1.5px;">${esc(badge)}</td></tr></table>` : ""}
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td class="em-pad" style="padding:36px 48px;font-family:${FONT};color:#1e293b;">
        ${body}
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td align="center" bgcolor="#f8fafc" style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 32px;text-align:center;border-radius:0 0 16px 16px;font-family:${FONT};">
        <p style="margin:0 0 4px;font-size:12px;line-height:18px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Cleaniq Services Ltd &nbsp;&middot;&nbsp; Manchester, UK</p>
        <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">Questions? <a href="mailto:info@cleaniqservices.com" style="color:${BRAND.green};text-decoration:none;">info@cleaniqservices.com</a></p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

/* ---- Content blocks ---- */
const h2 = (html, color = BRAND.dark) =>
  `<h2 style="margin:0 0 12px;font-family:${FONT};font-size:20px;line-height:26px;font-weight:700;color:${color};">${html}</h2>`;
const hello = (name) => h2(`Hi ${esc(name)},`);
const p = (html, style = "") =>
  `<p style="margin:0 0 18px;font-family:${FONT};font-size:15px;line-height:24px;color:#475569;${style}">${html}</p>`;
const small = (html) =>
  `<p style="margin:10px 0 24px;font-family:${FONT};font-size:12px;line-height:18px;color:#94a3b8;text-align:center;">${html}</p>`;
const sectionTitle = (text) =>
  `<p style="margin:28px 0 10px;font-family:${FONT};font-size:11px;line-height:16px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">${esc(text)}</p>`;

// Label / value rows. Values are escaped unless wrapped in raw().
const kv = (rows, { labelWidth = "36%" } = {}) => {
  const list = rows.filter((r) => r && r[1] !== undefined && r[1] !== null && r[1] !== "");
  if (!list.length) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;margin-bottom:24px;">${list
    .map(([label, value], i) => {
      const bb = i === list.length - 1 ? "" : "border-bottom:1px solid #e2e8f0;";
      return `<tr>
        <td width="${labelWidth}" valign="top" bgcolor="#f8fafc" style="background-color:#f8fafc;padding:12px 16px;${bb}font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;color:#64748b;">${esc(label)}</td>
        <td valign="top" style="padding:12px 16px;${bb}font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#1e293b;">${val(value)}</td>
      </tr>`;
    })
    .join("")}</table>`;
};

// Tinted callout box (optional coloured left bar)
const box = (inner, { bg = "#f8fafc", border = "#e2e8f0", bar = "", align = "left" } = {}) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr><td align="${align}" bgcolor="${bg}" style="background-color:${bg};border:1px solid ${border};${bar ? `border-left:4px solid ${bar};` : ""}border-radius:10px;padding:18px 20px;font-family:${FONT};text-align:${align};">${inner}</td></tr></table>`;

const refBadge = (label, value) =>
  box(
    `<p style="margin:0 0 4px;font-size:11px;line-height:16px;font-weight:700;color:#166534;letter-spacing:2px;text-transform:uppercase;">${esc(label)}</p>
     <p style="margin:0;font-size:22px;line-height:28px;font-weight:800;color:${BRAND.green};letter-spacing:0.5px;word-break:break-all;">${value}</p>`,
    { bg: "#f0fdf4", border: "#bbf7d0" },
  );

const amountBox = (label, amountHtml, { bg = "#f0fdf4", border = "#bbf7d0", labelColor = "#166534", color = BRAND.green, note = "" } = {}) =>
  box(
    `<p style="margin:0 0 4px;font-size:11px;line-height:16px;font-weight:700;color:${labelColor};letter-spacing:2px;text-transform:uppercase;">${esc(label)}</p>
     <p style="margin:0;font-size:34px;line-height:40px;font-weight:800;color:${color};">${amountHtml}</p>
     ${note ? `<p style="margin:6px 0 0;font-size:12px;line-height:18px;color:${labelColor};">${esc(note)}</p>` : ""}`,
    { bg, border, align: "center" },
  );

// Bulletproof button (works in Outlook)
const button = (href, label, { bg = BRAND.green, color = "#ffffff", border = "" } = {}) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 24px;"><tr><td align="center" bgcolor="${bg}" style="background-color:${bg};border-radius:8px;${border ? `border:2px solid ${border};` : ""}"><a href="${href}" target="_blank" style="display:inline-block;padding:15px 36px;font-family:${FONT};font-size:14px;line-height:18px;font-weight:700;color:${color};text-decoration:none;border-radius:8px;">${esc(label)}</a></td></tr></table>`;

const checkList = (items) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">${items
    .map(
      (t) =>
        `<tr><td width="24" valign="top" style="padding:4px 0;font-family:${FONT};font-size:14px;line-height:22px;font-weight:700;color:${BRAND.green};">&#10003;</td><td valign="top" style="padding:4px 0;font-family:${FONT};font-size:14px;line-height:22px;color:#334155;">${esc(t)}</td></tr>`,
    )
    .join("")}</table>`;

// Numbered steps. Items are trusted HTML strings.
const steps = (items) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">${items
    .map(
      (t, i) =>
        `<tr><td width="34" valign="top" style="padding:0 0 12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="24" height="24" align="center" bgcolor="${BRAND.green}" style="background-color:${BRAND.green};border-radius:12px;font-family:Arial,sans-serif;font-size:12px;line-height:24px;font-weight:700;color:#ffffff;">${i + 1}</td></tr></table></td><td valign="top" style="padding:0 0 12px;font-family:${FONT};font-size:14px;line-height:22px;color:#374151;">${t}</td></tr>`,
    )
    .join("")}</table>`;

// Two columns that stack on phones
const twoCol = (left, right) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr>
    <td class="stack" width="50%" valign="top" style="padding-right:12px;font-family:${FONT};">${left}</td>
    <td class="stack" width="50%" valign="top" style="padding-left:12px;font-family:${FONT};">${right}</td>
  </tr></table>`;

const mono = (text) =>
  raw(`<span style="font-family:Consolas,'Courier New',monospace;font-size:14px;">${esc(text)}</span>`);

/* ============================== TEMPLATES ============================== */

const redesigned = {
  /* ---------- CUSTOMER-FACING ---------- */

  adminBookingCreatedEmail1: (booking) => {
    const d = booking.details || {};
    const s = booking.schedule || {};
    const props = propertyRows(booking).filter(([, v]) => v !== undefined && v !== null && v !== "");
    const extras = (d.extras || []).map(extraLabel);
    return layout({
      title: "Booking Created",
      preheader: `Booking ${booking.bookingId} is reserved. Complete your bank transfer to confirm it.`,
      eyebrow: "Booking Created",
      heading: "Your booking is reserved",
      sub: "Complete your payment to confirm it",
      body: `
        ${hello(booking.customer.firstName)}
        ${p("Your Cleaniq booking has been created by our team. Below is your booking summary and the bank transfer details to complete your payment.")}
        ${refBadge("Booking Reference", esc(booking.bookingId))}

        ${sectionTitle("Service details")}
        ${kv([
          ["Service", booking.service],
          ["Frequency", d.frequency],
          ["Duration", d.duration ? `${d.duration} hours` : ""],
          ["Date", fmtDate(s.date)],
          ["Time", timeLabel(s)],
          ["Address", fullAddress(d)],
        ])}

        ${props.length ? `${sectionTitle("Property")}${kv(props)}` : ""}
        ${extras.length ? `${sectionTitle("Extras & special requests")}${checkList(extras)}` : ""}

        ${sectionTitle("Payment summary")}
        ${amountBox("Total due", `&pound;${esc(booking.payment.amount)}`, { bg: "#fffbeb", border: "#fde68a", labelColor: "#92400e", color: "#b45309", note: "Status: awaiting payment" })}

        ${sectionTitle("How to pay (bank transfer)")}
        ${p("Please use your booking reference as the payment reference so we can match your transfer quickly.")}
        ${kv([
          ["Bank", BANK.bank],
          ["Account name", BANK.name],
          ["Sort code", BANK.sort],
          ["Account number", BANK.acc],
          ["Reference", raw(`<strong>${esc(booking.bookingId)}</strong>`)],
        ], { labelWidth: "40%" })}
        ${button(`https://api.cleaniqservices.com/api/bookings/${esc(booking._id)}/confirm-payment-sent`, "✓ I’ve sent the payment", { bg: "#059669" })}
        ${small("Click once you’ve made the transfer. We’ll verify it and confirm your booking.")}

        ${d.notes ? `${sectionTitle("Special notes")}${box(`<p style="margin:0;font-size:14px;line-height:22px;color:#92400e;">${nl2br(d.notes)}</p>`, { bg: "#fffbeb", border: "#fde68a", bar: "#f59e0b" })}` : ""}

        ${sectionTitle("What happens next")}
        ${steps([
          "<strong>Payment:</strong> complete your bank transfer using the details above.",
          "<strong>Confirmation:</strong> once payment is verified, your booking is officially confirmed.",
          "<strong>Assignment:</strong> we assign a professional cleaner to your job.",
          "<strong>Reminder:</strong> you’ll get a final reminder 24 hours before your appointment.",
        ])}

        <p style="margin:8px 0 0;font-family:${FONT};font-size:14px;line-height:22px;color:#64748b;text-align:center;">Have any questions about your booking?</p>
        ${button("https://cleaniqservices.com/contact", "Contact Support", { bg: BRAND.dark })}
      `,
    });
  },

  applicantReceived: (applicantName, role) =>
    layout({
      title: "Application Received",
      preheader: `We’ve received your application for ${role}.`,
      eyebrow: "Application Received",
      heading: "Thanks for applying",
      sub: "Your application is with our recruitment team",
      body: `
        ${h2(`Hello ${esc(applicantName)},`)}
        ${p(`Thank you for your interest in joining the Cleaniq team. We’ve received your application for the <strong>${esc(role)}</strong> position.`)}
        ${p("Our recruitment team will review your profile and get back to you if your skills match our current needs.")}
        ${box(`<p style="margin:0;font-size:14px;color:#64748b;">Status: <strong style="color:#1e293b;">Under Review</strong></p>`, { align: "center" })}
      `,
    }),

  hiredAlert: (applicantName) =>
    layout({
      title: "Welcome to the Team",
      preheader: "Congratulations, you’ve been hired at Cleaniq Services.",
      eyebrow: "You’re hired",
      heading: "Welcome to the team!",
      body: `
        ${h2(`Congratulations ${esc(applicantName)}!`)}
        ${p("We’re thrilled to let you know you’ve been <strong>hired</strong> to join Cleaniq Services.", "font-size:16px;")}
        ${p("Expect an onboarding email from our HR department shortly.")}
      `,
    }),

  leadAcknowledgement: (name) =>
    layout({
      title: "Thanks for Reaching Out",
      preheader: "We’ve received your message and will reply within 1 business day.",
      eyebrow: "Message Received",
      heading: "Thanks for reaching out!",
      body: `
        ${hello(name)}
        ${p("We’ve received your message and a member of our team will get back to you shortly, usually within 1 business day.")}
        ${p("In the meantime, feel free to browse our services or get an instant quote on our website.")}
        ${button("https://cleaniqservices.com/services", "Browse Our Services")}
      `,
    }),

  staffAppInvite: (staff) => {
    const androidLink = "https://expo.dev/artifacts/eas/j8DzdUDFEfmfLUiK7QVUSG.apk";
    // Plug in the TestFlight public link once it's live (App Store Connect → TestFlight → External Testing).
    const iosLink = process.env.IOS_TESTFLIGHT_LINK || "https://testflight.apple.com/join/PLACEHOLDER";
    const dl = (href, label, subText, bg) =>
      `<a href="${esc(href)}" target="_blank" style="display:block;background-color:${bg};color:#ffffff;padding:16px 12px;border-radius:10px;text-decoration:none;font-family:${FONT};font-weight:700;font-size:14px;line-height:20px;text-align:center;">${label}<br /><span style="font-size:12px;font-weight:400;color:#cbd5e1;">${subText}</span></a>`;
    return layout({
      title: "Welcome to Cleaniq Service Pro",
      preheader: "Your staff account is ready. Download the app and log in.",
      eyebrow: "Cleaniq Service Pro",
      heading: "Welcome to the team!",
      sub: "Your staff account is ready to go",
      body: `
        ${hello(staff.firstName)}
        ${p("Congratulations! You’ve been registered as an official member of the <strong>Cleaniq Services</strong> cleaning team. Everything you need to find, accept and manage jobs lives in one place: the <strong>Cleaniq Service Pro</strong> app.")}

        ${sectionTitle("Download Cleaniq Service Pro")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;"><tr>
          <td class="stack" width="50%" valign="top" style="padding:0 6px 0 0;">${dl(iosLink, "iOS", "via TestFlight", BRAND.dark)}</td>
          <td class="stack" width="50%" valign="top" style="padding:0 0 0 6px;">${dl(androidLink, "Android", "Direct APK", BRAND.green)}</td>
        </tr></table>

        ${sectionTitle("Your login credentials")}
        ${kv([
          ["Login email", mono(staff.email)],
          ["Temporary password", mono(staff.tempPassword)],
        ], { labelWidth: "40%" })}
        ${p("For security, please change your password inside the app as soon as you log in for the first time.", "font-size:13px;color:#64748b;")}

        ${sectionTitle("What happens next")}
        ${steps([
          "Install Cleaniq Service Pro using the button for your phone above.",
          "Log in with the credentials above and set a new password.",
          "Browse the Jobs feed and accept your first cleaning job.",
        ])}
        <p style="margin:24px 0 0;font-family:${FONT};font-size:14px;line-height:22px;text-align:center;color:#94a3b8;">Welcome aboard!<br /><strong style="color:${BRAND.green};">The Cleaniq Operations Team</strong></p>
      `,
    });
  },

  withdrawalRequestWorker: (worker, amount) =>
    layout({
      title: "Withdrawal Request Received",
      preheader: `Your withdrawal request for £${amount.toFixed(2)} is pending approval.`,
      eyebrow: "Withdrawal",
      heading: "Request received",
      sub: "Your request is being processed",
      body: `
        ${hello(worker.firstName)}
        ${p("We’ve received your withdrawal request. It’s now pending admin approval. Once approved, the funds will be transferred to your registered bank account within 2–3 business days.")}
        ${sectionTitle("Withdrawal details")}
        ${kv([
          ["Amount requested", `£${amount.toFixed(2)}`],
          ["Status", raw(`<span style="color:#d97706;">Pending approval</span>`)],
          ["Requested on", new Date().toDateString()],
        ])}
        ${p("You’ll receive another email once our admin team reviews your request. If you have any questions, please contact our support team.", "font-size:14px;color:#64748b;")}
        ${box(`<p style="margin:0;font-size:13px;line-height:20px;color:${BRAND.green};"><strong>Tip:</strong> make sure your bank details in your profile are up to date for faster processing.</p>`, { bg: "#ecfdf5", border: "#bbf7d0", bar: BRAND.green })}
      `,
    }),

  withdrawalApprovedWorker: (worker, amount, requestId) =>
    layout({
      title: "Withdrawal Approved",
      preheader: `Your withdrawal of £${amount.toFixed(2)} has been approved.`,
      eyebrow: "Withdrawal",
      heading: "Withdrawal approved!",
      sub: "Your money is on the way",
      body: `
        ${hello(worker.firstName)}
        ${p("Great news! Your withdrawal request has been approved. The funds have been deducted from your balance and will be transferred to your registered bank account within 2–3 business days.")}
        ${sectionTitle("Withdrawal confirmation")}
        ${kv([
          ["Amount withdrawn", raw(`<span style="font-size:16px;color:${BRAND.green};">£${esc(amount.toFixed(2))}</span>`)],
          ["Request ID", requestId],
          ["Approved on", new Date().toDateString()],
        ])}
        ${box(`<p style="margin:0;font-size:13px;line-height:20px;color:#0c4a6e;"><strong>Processing time:</strong> transfers typically take 2–3 business days. Check your bank account for the incoming funds.</p>`, { bg: "#e0f2fe", border: "#bae6fd", bar: "#0284c7" })}
        ${p("If you have any questions, or don’t receive the funds within 5 business days, please contact our support team.", "font-size:14px;color:#64748b;")}
      `,
    }),

  withdrawalRejectedWorker: (worker, amount, reason) =>
    layout({
      title: "Withdrawal Declined",
      preheader: `Your withdrawal request for £${amount.toFixed(2)} was declined.`,
      headerBg: "#B91C1C",
      subColor: "#fecaca",
      eyebrow: "Withdrawal",
      heading: "Withdrawal declined",
      sub: "Your request could not be processed",
      body: `
        ${h2(`Hi ${esc(worker.firstName)},`, "#B91C1C")}
        ${p(`Unfortunately, your withdrawal request for £${esc(amount.toFixed(2))} has been declined. Your account balance remains unchanged.`)}
        ${box(
          `<p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Reason</p>
           <p style="margin:0;font-size:14px;line-height:22px;color:#991b1b;">${esc(reason || "Your request does not meet the withdrawal criteria. Please contact support for more information.")}</p>`,
          { bg: "#fee2e2", border: "#fecaca", bar: "#dc2626" },
        )}
        ${p("If you believe this is an error or would like to discuss it, please reach out to our support team via the support chat in your app.", "font-size:14px;color:#64748b;")}
        ${button("https://cleaniqservices.com", "Open Cleaniq Staff App", { bg: BRAND.dark })}
      `,
    }),

  staffNewJobAlert: (booking) => {
    const d = booking.details || {};
    const s = booking.schedule || {};
    const area = (d.address || "").split(",").slice(-2).join(", ").trim() || "Local Region";
    return layout({
      title: "New Job Alert",
      preheader: `New ${booking.service} job available on ${fmtDate(s.date)}.`,
      eyebrow: "New Job Alert",
      heading: "A new job is available",
      sub: "It’s waiting on your feed",
      body: `
        ${h2("Hello Cleaniq Staff,", BRAND.green)}
        ${p("A new cleaning appointment has been scheduled and is ready for acceptance:")}
        ${kv([
          ["Service", booking.service],
          ["Date", fmtDate(s.date)],
          ["Time slot", s.timeSlot],
          ["Duration", d.duration ? `${d.duration} hours` : ""],
          ["Location / area", area],
        ])}
        ${p("To protect customer privacy, the full address and contact details are shown only after you accept the job.", "font-size:13px;font-style:italic;color:#64748b;")}
        <p style="margin:0 0 4px;font-family:${FONT};font-size:14px;font-weight:700;text-align:center;color:${BRAND.green};">Accept it now before another staff member does!</p>
        ${button("cleaniqworker://home", "View Job in Staff App")}
        ${small("Opens the Cleaniq Staff App directly. Make sure it’s installed on your phone.")}
      `,
    });
  },

  staffShiftAssigned: (booking, worker) => {
    const d = booking.details || {};
    const s = booking.schedule || {};
    const c = booking.customer || {};
    return layout({
      title: "New Shift Assigned",
      preheader: `You’ve been scheduled for ${booking.service} on ${fmtDate(s.date)}.`,
      eyebrow: "New Shift",
      heading: "You’ve been assigned a shift",
      sub: "Scheduled by the admin team",
      body: `
        ${h2(`Hi ${esc(worker.firstName)},`, BRAND.green)}
        ${p("The admin team has scheduled you for the shift below. It’s already confirmed, so there’s no need to accept it from your feed.")}
        ${kv([
          ["Service", booking.service],
          ["Date", fmtDate(s.date)],
          ["Time slot", s.timeSlot || "N/A"],
          ["Your hours", `${booking.workerDuration || d.duration || "N/A"} hours`],
          ["Customer", [c.firstName, c.lastName].filter(Boolean).join(" ")],
          ["Address", d.address || "See app for details"],
        ])}
        ${button("cleaniqworker://home", "View in Staff App")}
        ${small("Check your Schedule tab for the full shift details.")}
      `,
    });
  },

  newChatMessageToStaffAlert: (staff, senderName, text) =>
    layout({
      title: "New Support Message",
      preheader: "The Cleaniq office team has sent you a reply.",
      eyebrow: "Support Chat",
      heading: "New support message",
      sub: "The Cleaniq office team has sent you a reply",
      body: `
        ${h2(`Hello ${esc(staff.firstName)},`, BRAND.green)}
        ${p(`You have a new support chat message from the Cleaniq Admin team (<strong>${esc(senderName || "Admin Office")}</strong>):`)}
        ${box(`<p style="margin:0;font-size:15px;line-height:24px;font-style:italic;color:#334155;">${nl2br(text)}</p>`, { bar: BRAND.green })}
        ${button("https://cleaniqservices.com", "Open Cleaniq Staff App")}
      `,
    }),

  /* ---------- INTERNAL / ADMIN ---------- */

  adminNewApplicantAlert: (applicantName, role, email, phone) =>
    layout({
      title: "New Staff Application",
      preheader: `${applicantName} applied for ${role}.`,
      headerBg: BRAND.dark,
      subColor: "#cbd5e1",
      eyebrow: "Recruitment",
      heading: "New staff application",
      body: `
        ${kv([
          ["Applicant", applicantName],
          ["Position", role],
          ["Email", email],
          ["Phone", phone],
        ])}
        ${button("https://cleaniqservices.com/admin/recruitment", "Review Application", { bg: BRAND.dark })}
      `,
    }),

  adminNewBookingAlert: (booking) => {
    const d = booking.details || {};
    const s = booking.schedule || {};
    const c = booking.customer || {};
    const reqs = [
      ...(d.extras || []).map(extraLabel),
      ...propertyRows(booking)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${k}: ${v}`),
    ];
    return layout({
      title: "New Booking Received",
      preheader: `New booking ${booking.bookingId}: ${booking.service}.`,
      headerBg: BRAND.dark,
      subColor: "#cbd5e1",
      eyebrow: "New Booking",
      heading: "New booking received",
      body: `
        ${kv([
          ["Reference", raw(`<strong>${esc(booking.bookingId)}</strong>`)],
          ["Amount", raw(`<strong style="color:${BRAND.green};">&pound;${esc(booking.payment.amount)}</strong>`)],
        ])}
        ${sectionTitle("Customer")}
        ${kv([
          ["Name", [c.firstName, c.lastName].filter(Boolean).join(" ")],
          ["Email", c.email],
          ["Phone", c.phone],
          ["Address", fullAddress(d)],
        ])}
        ${sectionTitle("Service")}
        ${kv([
          ["Service", booking.service],
          ["Date", fmtDate(s.date)],
          ["Time", timeLabel(s)],
          ["Frequency", d.frequency],
          ["Duration", d.duration ? `${d.duration} hours` : ""],
        ])}
        ${reqs.length ? `${sectionTitle("Requirements & property")}${checkList(reqs)}` : ""}
        ${button("https://cleaniqservices.com/admin/bookings", "Manage in Dashboard", { bg: BRAND.dark })}
      `,
    });
  },

  staffActionAlert: (booking, action, details) => {
    const d = booking.details || {};
    const s = booking.schedule || {};
    const c = booking.customer || {};
    return layout({
      title: "Staff Action Log",
      preheader: `${action}: ${booking.bookingId}`,
      headerBg: BRAND.dark,
      subColor: "#cbd5e1",
      eyebrow: "Staff Action Log",
      heading: action,
      body: `
        ${h2("Event notice")}
        ${p(esc(details), "color:#334155;font-weight:500;")}
        ${kv([
          ["Booking reference", booking.bookingId],
          ["Service", booking.service],
          ["Customer", [c.firstName, c.lastName].filter(Boolean).join(" ")],
          ["Customer phone", c.phone],
          ["Address", fullAddress(d)],
          ["Scheduled time", timeLabel(s)],
        ], { labelWidth: "40%" })}
        ${button("https://cleaniqservices.com/admin/bookings", "View in Admin Portal", { bg: BRAND.dark })}
      `,
    });
  },

  newChatMessageToAdminAlert: (staff, text) =>
    layout({
      title: "New Support Message",
      preheader: `${staff.firstName} ${staff.lastName} sent a support message.`,
      headerBg: BRAND.dark,
      subColor: "#cbd5e1",
      eyebrow: "Support Chat",
      heading: "New support message",
      body: `
        ${h2("Hello Admin,")}
        ${p(`Staff member <strong>${esc(staff.firstName)} ${esc(staff.lastName)}</strong> (${esc(staff.workerId || "Staff")}) has sent you a new support chat message:`)}
        ${box(`<p style="margin:0;font-size:15px;line-height:24px;font-style:italic;color:#334155;">${nl2br(text)}</p>`, { bar: BRAND.green })}
        ${button("https://cleaniqservices.com/admin/chat", "Open Support Chat Portal", { bg: BRAND.dark })}
      `,
    }),

  adminAccountInvite: (admin) =>
    layout({
      title: "Welcome to the Business Portal",
      preheader: "Your Cleaniq Business Portal account is ready.",
      headerBg: BRAND.dark,
      subColor: "#cbd5e1",
      eyebrow: "Business Portal",
      heading: "Welcome to the team!",
      sub: "Your account is ready",
      body: `
        ${hello(admin.username)}
        ${p(`An administrator account has been created for you on the <strong>Cleaniq Business Portal</strong>${admin.role === "restricted" ? ", with access to specific sections only" : ""}.`)}
        ${sectionTitle("Your login credentials")}
        ${kv([
          ["Username", mono(admin.username)],
          ["Temporary password", mono(admin.tempPassword)],
        ], { labelWidth: "40%" })}
        ${button("https://cleaniqservices.com/admin", "Log In to Dashboard", { bg: BRAND.dark, color: BRAND.mint })}
        ${p("For security, please change your password as soon as you log in for the first time (Settings → Security).", "font-size:13px;color:#64748b;text-align:center;")}
        <p style="margin:24px 0 0;font-family:${FONT};font-size:14px;line-height:22px;text-align:center;color:#94a3b8;">Welcome aboard!<br /><strong style="color:${BRAND.dark};">The Cleaniq Operations Team</strong></p>
      `,
    }),

  adminLoginAlert: (admin, location, userAgent, dateTime) =>
    layout({
      title: "Admin Login Alert",
      preheader: "Your admin account was signed in.",
      headerBg: BRAND.dark,
      subColor: "#cbd5e1",
      eyebrow: "Security",
      heading: "Admin login alert",
      sub: "Your admin account was signed in successfully",
      body: `
        ${hello(admin.username)}
        ${p("We detected an admin login to your account:")}
        ${kv([
          ["Date & time", dateTime],
          ["Location / IP", location],
          ["Device", userAgent],
        ])}
        ${p("If this was you, no action is needed. If you didn’t sign in, please change your password immediately and contact support.", "font-size:14px;")}
        ${button("https://cleaniqservices.com/admin/settings", "Review Security Settings", { bg: BRAND.dark })}
      `,
    }),

  adminPasswordChangedAlert: (admin, location, userAgent, dateTime) =>
    layout({
      title: "Password Change Alert",
      preheader: "Your admin password was changed.",
      headerBg: BRAND.dark,
      subColor: "#cbd5e1",
      eyebrow: "Security",
      heading: "Password change alert",
      sub: "This email confirms your admin password was changed",
      body: `
        ${hello(admin.username)}
        ${p("Your admin password was updated successfully:")}
        ${kv([
          ["Date & time", dateTime],
          ["Location / IP", location],
          ["Device", userAgent],
        ])}
        ${p("If you didn’t change your password, please reset it immediately and contact support.", "font-size:14px;")}
        ${button("https://cleaniqservices.com/admin/security", "Review Security Settings", { bg: BRAND.dark })}
      `,
    }),

  paymentSuccessAdmin: (booking) => {
    const d = booking.details || {};
    const s = booking.schedule || {};
    const c = booking.customer || {};
    return layout({
      title: "Payment Received",
      preheader: `Payment received for ${booking.bookingId}: £${booking.payment.amount}.`,
      headerBg: BRAND.dark,
      subColor: "#cbd5e1",
      eyebrow: "Payment",
      heading: "Payment received",
      sub: "Payment successfully processed",
      body: `
        ${kv([
          ["Booking reference", raw(`<strong>${esc(booking.bookingId)}</strong>`)],
          ["Amount paid", raw(`<strong style="color:${BRAND.green};">&pound;${esc(booking.payment.amount)}</strong>`)],
        ], { labelWidth: "40%" })}
        ${sectionTitle("Customer")}
        ${kv([
          ["Name", [c.firstName, c.lastName].filter(Boolean).join(" ")],
          ["Email", c.email],
          ["Phone", c.phone],
        ])}
        ${sectionTitle("Service")}
        ${kv([
          ["Service", booking.service],
          ["Date", fmtDate(s.date)],
          ["Time", timeLabel(s)],
          ["Address", fullAddress(d)],
        ])}
        ${button("https://cleaniqservices.com/admin/bookings", "Manage in Dashboard", { bg: BRAND.dark })}
      `,
    });
  },

  withdrawalRequestAdmin: (worker, amount, bankDetails = {}, requestId) =>
    layout({
      title: "New Withdrawal Request",
      preheader: `${worker.firstName} ${worker.lastName} requested £${amount.toFixed(2)}.`,
      headerBg: BRAND.dark,
      subColor: "#cbd5e1",
      eyebrow: "Withdrawal",
      heading: "New withdrawal request",
      sub: "Pending your approval",
      body: `
        ${p("A staff member has requested a withdrawal. Please review the details below and take appropriate action.")}
        ${sectionTitle("Staff information")}
        ${kv([
          ["Name", `${worker.firstName} ${worker.lastName}`],
          ["Email", worker.email],
          ["Phone", worker.phone],
          ["Worker ID", worker._id],
          ["Address", worker.address],
          ["Postcode", worker.postcode],
        ])}
        ${sectionTitle("Withdrawal details")}
        ${kv([
          ["Amount requested", raw(`<strong>&pound;${esc(amount.toFixed(2))}</strong>`)],
          ["Request ID", requestId],
          ["Current balance", `£${worker.wallet?.balance?.toFixed(2) || "0.00"}`],
          ["Requested on", new Date().toDateString()],
        ])}
        ${sectionTitle("Bank account details")}
        ${box(
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${[
              ["Account holder", bankDetails.accountHolder || "N/A"],
              ["Account number", `****${bankDetails.accountNumber?.slice(-4) || "XXXX"}`],
              ["Sort code", bankDetails.sortCode || "N/A"],
              ["Bank name", bankDetails.bankName || "N/A"],
            ]
              .map(([k, v]) => `<tr><td width="40%" style="padding:4px 0;font-size:13px;color:#92400e;">${esc(k)}</td><td style="padding:4px 0;font-size:14px;font-weight:700;color:#78350f;">${esc(v)}</td></tr>`)
              .join("")}
          </table>`,
          { bg: "#fef3c7", border: "#fcd34d", bar: "#f59e0b" },
        )}
        ${button("https://cleaniqservices.com/admin/withdrawals", "View in Admin Portal")}
      `,
    }),

  /* ---------- FREE-FORM INVOICE (admin Invoice Builder) ---------- */

  customInvoice: (data) => {
    const {
      invoiceNumber = "",
      customerName = "",
      customerEmail = "",
      invoiceDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
      items = [],
      notes = "",
      paymentInstructions = "",
      showPaidBadge = false,
      currencySymbol = "£",
      paymentLink = "",
      customerPhone = "",
      customerAddress = "",
      serviceDate = "",
      downloadUrl = "",
    } = data;

    const cur = esc(currencySymbol);
    const lineTotal = (i) => (Number(i.qty) || 0) * (Number(i.rate) || 0);
    const total = items.reduce((sum, i) => sum + lineTotal(i), 0);

    const party = (label, name, lines) =>
      `<p style="margin:0 0 8px;font-size:11px;line-height:16px;font-weight:700;color:${BRAND.green};letter-spacing:1.5px;text-transform:uppercase;border-bottom:2px solid #d1fae5;padding-bottom:6px;">${label}</p>
       <p style="margin:0 0 4px;font-size:16px;line-height:22px;font-weight:800;color:#0f172a;">${name}</p>
       ${lines.filter(Boolean).map((l) => `<p style="margin:0 0 2px;font-size:13px;line-height:20px;color:#64748b;">${l}</p>`).join("")}`;

    const th = (label, align = "left", width = "") =>
      `<td ${width ? `width="${width}"` : ""} bgcolor="#0f172a" align="${align}" style="background-color:#0f172a;padding:12px 14px;font-family:${FONT};font-size:11px;line-height:14px;font-weight:700;color:${BRAND.mint};text-transform:uppercase;letter-spacing:1px;text-align:${align};">${label}</td>`;

    const rows = items
      .map((item, idx) => {
        const bg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
        const td = (content, align = "left", extra = "") =>
          `<td align="${align}" bgcolor="${bg}" style="background-color:${bg};padding:14px;border-bottom:1px solid #f1f5f9;font-family:${FONT};font-size:14px;line-height:20px;text-align:${align};${extra}">${content}</td>`;
        return `<tr>
          ${td(esc(item.description || "—"), "left", "color:#0f172a;font-weight:600;")}
          ${td(esc(item.qty || 1), "center", "color:#64748b;")}
          ${td(`${cur}${Number(item.rate || 0).toFixed(2)}`, "right", "color:#64748b;")}
          ${td(`${cur}${lineTotal(item).toFixed(2)}`, "right", "color:#0f172a;font-weight:700;")}
        </tr>`;
      })
      .join("");

    return layout({
      title: `Invoice ${invoiceNumber}`,
      preheader: `Invoice ${invoiceNumber || ""} from Cleaniq Services: ${currencySymbol}${total.toFixed(2)} ${showPaidBadge ? "paid" : "due"}.`,
      logoSrc: LOGO_WIDE,
      logoWidth: 220,
      eyebrow: "Invoice",
      heading: invoiceNumber || "—",
      sub: "Professional Cleaning Services",
      badge: showPaidBadge ? "✓ Paid in full" : "",
      body: `
        ${kv([
          ["Invoice date", invoiceDate],
          ["Service date", serviceDate],
          ["Status", raw(showPaidBadge ? `<span style="color:#16a34a;">✓ Paid</span>` : `<span style="color:#d97706;">Payment due</span>`)],
        ])}

        ${twoCol(
          party("Billed to", esc(customerName || "—"), [esc(customerEmail), esc(customerPhone), esc(customerAddress)]),
          party("From", "Cleaniq Services Ltd", ["info@cleaniqservices.com", "+44 7752 476368", "cleaniqservices.com"]),
        )}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-collapse:separate;border-radius:10px;margin-bottom:16px;">
          <tr>${th("Description")}${th("Qty", "center", "48")}${th("Rate", "right", "80")}${th("Amount", "right", "90")}</tr>
          ${rows}
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;"><tr>
          <td bgcolor="${BRAND.green}" style="background-color:${BRAND.green};border-radius:10px;padding:18px 22px;font-family:${FONT};font-size:13px;line-height:20px;font-weight:700;color:#d1fae5;text-transform:uppercase;letter-spacing:1.2px;">Total ${showPaidBadge ? "paid" : "due"}</td>
          <td align="right" bgcolor="${BRAND.green}" style="background-color:${BRAND.green};border-radius:10px;padding:18px 22px;font-family:${FONT};font-size:26px;line-height:32px;font-weight:800;color:#ffffff;text-align:right;">${cur}${total.toFixed(2)}</td>
        </tr></table>

        ${paymentLink ? `<p style="margin:0 0 4px;font-family:${FONT};font-size:14px;font-weight:700;text-align:center;color:#0f172a;">Ready to pay online?</p>${button(esc(paymentLink), "Pay Now Securely")}${small("Encrypted &middot; Powered by Stripe")}` : ""}

        ${paymentInstructions ? `${sectionTitle("Bank transfer details")}${box(`<p style="margin:0;font-size:13px;line-height:24px;font-weight:500;color:#334155;">${nl2br(paymentInstructions)}</p>`)}` : ""}

        ${notes ? box(`<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${BRAND.green};text-transform:uppercase;letter-spacing:1px;">Note</p><p style="margin:0;font-size:13px;line-height:22px;color:#065f46;">${nl2br(notes)}</p>`, { bg: "#f0fdf4", border: "#bbf7d0", bar: BRAND.green }) : ""}

        ${downloadUrl ? `${p("Your invoice is also attached to this email, or download it anytime:", "font-size:13px;text-align:center;color:#64748b;")}${button(esc(downloadUrl), "Download Invoice PDF")}` : ""}

        <p style="margin:8px 0 0;font-family:${FONT};font-size:14px;line-height:22px;text-align:center;color:#64748b;">Thank you for choosing Cleaniq Services. We’re committed to delivering a spotless clean every time.</p>
      `,
    });
  },
};

module.exports = redesigned;