const { Resend } = require("resend");

// Safety: Initialize Resend only if key exists, otherwise use a dummy
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!resend) {
      console.error("❌ EMAIL ERROR: RESEND_API_KEY is missing in .env");
      return false;
    }

    console.log(`📧 Resend: Attempting to send email to: ${to}...`);
    const { data, error } = await resend.emails.send({
      from: "Cleaniq Services <info@cleaniqservices.com>",
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("❌ RESEND ERROR DETAILS:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("✅ Email sent successfully! ID:", data.id);
    return true;
  } catch (error) {
    console.error("❌ CRITICAL EMAIL ERROR:", error);
    return false;
  }
};

// Templates
const templates = {
  bookingConfirmation: (booking) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 28px; letter-spacing: -1px;">Booking Confirmed!</h1>
        <p style="color: #94a3b8; margin-top: 10px; font-weight: 500;">Thank you for choosing Cleaniq Services</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0F172A;">Hi ${booking.customer.firstName},</h2>
        <p>Your cleaning appointment is officially confirmed. Here are your booking details:</p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 20px; margin: 24px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Booking Reference:</p>
          <p style="margin: 0 0 20px 0; font-size: 20px; font-weight: 900; color: #0F172A;">${booking.bookingId}</p>
          
          <table width="100%" cellpadding="12" cellspacing="0" style="background: white; border-radius: 12px; border: 1px solid #edf2f7; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Service:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.service}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Date & Time:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${new Date(booking.schedule.date).toDateString()} — ${booking.schedule.timeSlot}${booking.schedule.preferredTime ? " (Requested Arrival: " + booking.schedule.preferredTime + ")" : ""}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Address:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.details.address}${booking.details.postcode && !booking.details.address.toLowerCase().includes(booking.details.postcode.toLowerCase()) ? ", " + booking.details.postcode : ""}</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 16px; color: #0F172A; margin-bottom: 12px;">Work Summary & Requirements</h3>
        <ul style="padding-left: 20px; margin: 0; font-size: 14px; color: #475569;">
          <li><strong>Frequency:</strong> ${booking.details.frequency}</li>
          <li><strong>Duration:</strong> ${booking.details.duration} Hours</li>
          ${(booking.details.extras || []).map((e) => `<li style="margin-top: 4px;"><strong>Requirement:</strong> ${typeof e === "object" && e !== null ? `${e.name} (x${e.qty || 1})` : e}</li>`).join("")}
          ${booking.details.Bedroom !== undefined ? `<li style="margin-top: 4px;"><strong>Bedrooms:</strong> ${booking.details.Bedroom}</li>` : ""}
          ${booking.details.Bathroom !== undefined ? `<li style="margin-top: 4px;"><strong>Bathrooms:</strong> ${booking.details.Bathroom}</li>` : ""}
          ${booking.details.Kitchen !== undefined ? `<li style="margin-top: 4px;"><strong>Kitchens:</strong> ${booking.details.Kitchen}</li>` : ""}
          ${booking.details["Living Room"] !== undefined ? `<li style="margin-top: 4px;"><strong>Living Rooms:</strong> ${booking.details["Living Room"]}</li>` : ""}
        </ul>

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: bold;">TOTAL PAID</p>
            <p style="margin: 0; font-size: 24px; font-weight: 900; color: #0F172A;">£${booking.payment.amount}</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <a href="https://cleaniqservices.com" style="display: inline-block; background-color: #0F172A; color: #6EE7B7; padding: 18px 36px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">Visit Client Dashboard</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,

  invoiceReceipt: (booking) => `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0;">
      <!-- Header -->
      <div style="background: #ffffff; padding: 40px 48px 24px; border-bottom: 3px solid #0F172A;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq" style="width: 80px; height: auto; border-radius: 8px;" />
              <p style="margin: 8px 0 0; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Professional Cleaning Services</p>
            </td>
            <td align="right" style="vertical-align: top;">
              <p style="margin: 0; font-size: 28px; font-weight: 900; color: #0F172A; letter-spacing: -1px;">INVOICE</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #64748b; font-weight: 600;">INV-${booking.bookingId}</p>
              <div style="margin-top: 12px; display: inline-block; background: #ecfdf5; border: 2px solid #6EE7B7; border-radius: 20px; padding: 4px 16px;">
                <span style="font-size: 12px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: 1px;">✓ PAID</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Billing Info -->
      <div style="padding: 32px 48px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; width: 50%;">
              <p style="margin: 0 0 6px; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Billed To</p>
              <p style="margin: 0; font-size: 15px; font-weight: 800; color: #0F172A;">${booking.customer.firstName} ${booking.customer.lastName}</p>
              <p style="margin: 2px 0; font-size: 13px; color: #64748b;">${booking.customer.email}</p>
              <p style="margin: 2px 0; font-size: 13px; color: #64748b;">${booking.customer.phone || ""}</p>
              ${booking.details?.address ? `<p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">${booking.details.address}${booking.details.postcode && !booking.details.address.toLowerCase().includes(booking.details.postcode.toLowerCase()) ? ", " + booking.details.postcode : ""}</p>` : ""}
            </td>
            <td style="vertical-align: top; text-align: right;">
              <p style="margin: 0 0 6px; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Invoice Details</p>
              <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
              <p style="margin: 2px 0; font-size: 13px; color: #334155;"><strong>Service Date:</strong> ${new Date(booking.schedule?.date || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
              <p style="margin: 2px 0; font-size: 13px; color: #334155;"><strong>Time Slot:</strong> ${booking.schedule?.timeSlot || "N/A"}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Line Items Table -->
      <div style="padding: 28px 48px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background: #0F172A;">
              <th style="padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 800; color: #6EE7B7; text-transform: uppercase; letter-spacing: 1px;">Description</th>
              <th style="padding: 12px 16px; text-align: center; font-size: 10px; font-weight: 800; color: #6EE7B7; text-transform: uppercase; letter-spacing: 1px;">Duration</th>
              <th style="padding: 12px 16px; text-align: right; font-size: 10px; font-weight: 800; color: #6EE7B7; text-transform: uppercase; letter-spacing: 1px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 16px; font-size: 14px; color: #0F172A; font-weight: 600;">
                ${booking.service}
                ${booking.details?.address ? `<br><span style="font-size: 12px; color: #64748b; font-weight: 400;">📍 ${booking.details.address}${booking.details.postcode && !booking.details.address.toLowerCase().includes(booking.details.postcode.toLowerCase()) ? ", " + booking.details.postcode : ""}</span>` : ""}
              </td>
              <td style="padding: 16px; text-align: center; font-size: 14px; color: #334155;">${booking.details?.duration || "N/A"} hrs</td>
              <td style="padding: 16px; text-align: right; font-size: 14px; font-weight: 700; color: #0F172A;">£${booking.payment.amount}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="padding: 0 48px 32px; margin-top: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr style="border-top: 1px solid #e2e8f0;">
            <td colspan="2" style="padding: 12px 16px; text-align: right; font-size: 13px; color: #64748b;">Subtotal:</td>
            <td style="padding: 12px 16px; text-align: right; font-size: 13px; font-weight: 700; color: #334155;">£${booking.payment.amount}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 16px; text-align: right; font-size: 13px; color: #64748b;">VAT (0%):</td>
            <td style="padding: 4px 16px; text-align: right; font-size: 13px; font-weight: 700; color: #334155;">£0.00</td>
          </tr>
          <tr style="background: #f8fafc; border-top: 2px solid #0F172A;">
            <td colspan="2" style="padding: 16px; text-align: right; font-size: 15px; font-weight: 900; color: #0F172A;">TOTAL PAID:</td>
            <td style="padding: 16px; text-align: right; font-size: 18px; font-weight: 900; color: #0F172A;">£${booking.payment.amount}</td>
          </tr>
        </table>
      </div>

      <!-- Thank you message -->
      <div style="margin: 0 48px 32px; padding: 20px 24px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 16px; border: 1px solid #86efac; text-align: center;">
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #065f46;">Thank you for choosing Cleaniq Services! 🌟</p>
        <p style="margin: 6px 0 0; font-size: 13px; color: #059669;">We hope you're delighted with your clean. Please leave us a review!</p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; padding: 0 48px 40px;">
        <a href="https://cleaniqservices.com/account/dashboard" style="display: inline-block; background: #0F172A; color: #6EE7B7; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; letter-spacing: 0.5px;">View Your Dashboard</a>
      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; padding: 24px 48px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">Cleaniq Services Limited · cleaniqservices.com · support@cleaniqservices.com</p>
        <p style="margin: 6px 0 0; font-size: 11px; color: #cbd5e1;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,

  applicantReceived: (applicantName, role) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 24px;">Application Received</h1>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0F172A;">Hello ${applicantName},</h2>
        <p>Thank you for your interest in joining the Cleaniq team. We've received your application for the <strong>${role}</strong> position.</p>
        <p>Our recruitment team will review your profile and get back to you if your skills match our current needs.</p>
        <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Status: <strong>Under Review</strong></p>
        </div>
      </div>
    </div>
  `,

  hiredAlert: (applicantName) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #6EE7B7; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 28px;">Welcome to the Team! 🎉</h1>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6; text-align: center;">
        <h2 style="font-size: 24px; margin-top: 0; color: #0F172A;">Congratulations ${applicantName}!</h2>
        <p style="font-size: 16px;">We are thrilled to inform you that you have been <strong>HIRED</strong> to join Cleaniq Services.</p>
        <p>Expect an onboarding email from our HR department shortly.</p>
      </div>
    </div>
  `,

  adminNewApplicantAlert: (applicantName, role, email, phone) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0F172A; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 30px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 100px; height: auto; margin-bottom: 10px; border-radius: 8px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 24px;">New Staff Application 👷‍♂️</h1>
      </div>
      <div style="padding: 30px; color: #1e293b;">
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #edf2f7;">
          <p style="margin: 5px 0; font-size: 14px;"><strong>Applicant:</strong> ${applicantName}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Position:</strong> ${role}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> ${phone}</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://cleaniqservices.com/admin/recruitment" style="display: inline-block; background-color: #0F172A; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px;">Review Application</a>
        </div>
      </div>
    </div>
  `,

  adminNewBookingAlert: (booking) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0F172A; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 30px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 100px; height: auto; margin-bottom: 10px; border-radius: 8px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 24px;">New Booking Received! 🚨</h1>
      </div>
      <div style="padding: 30px; color: #1e293b; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Reference</p>
            <p style="margin: 0; font-size: 16px; font-weight: 800; color: #0F172A;">${booking.bookingId}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Amount</p>
            <p style="margin: 0; font-size: 16px; font-weight: 800; color: #0F172A;">£${booking.payment.amount}</p>
          </div>
        </div>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Customer Info</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${booking.customer.email}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> ${booking.customer.phone}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Service Address:</strong> ${booking.details.address}${booking.details.postcode && !booking.details.address.toLowerCase().includes(booking.details.postcode.toLowerCase()) ? ", " + booking.details.postcode : ""}</p>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Service Details</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Service:</strong> ${booking.service}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(booking.schedule.date).toDateString()}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${booking.schedule.timeSlot}${booking.schedule.preferredTime ? " (Requested Arrival: " + booking.schedule.preferredTime + ")" : ""}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Frequency:</strong> ${booking.details.frequency}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Duration:</strong> ${booking.details.duration} Hours</p>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Requirements & Property Details</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          ${(booking.details.extras || []).map((e) => `<li style="margin-bottom: 5px;">${typeof e === "object" && e !== null ? `${e.name} (x${e.qty || 1})` : e}</li>`).join("")}
          ${booking.details.Bedroom !== undefined ? `<li style="margin-bottom: 5px;">Bedrooms: ${booking.details.Bedroom}</li>` : ""}
          ${booking.details.Bathroom !== undefined ? `<li style="margin-bottom: 5px;">Bathrooms: ${booking.details.Bathroom}</li>` : ""}
          ${booking.details.Kitchen !== undefined ? `<li style="margin-bottom: 5px;">Kitchens: ${booking.details.Kitchen}</li>` : ""}
          ${booking.details["Living Room"] !== undefined ? `<li style="margin-bottom: 5px;">Living Rooms: ${booking.details["Living Room"]}</li>` : ""}
        </ul>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7;">
          <a href="https://cleaniqservices.com/admin/bookings" style="display: inline-block; background-color: #0F172A; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px;">Manage in Dashboard</a>
        </div>
      </div>
    </div>
  `,

  staffActionAlert: (booking, action, details) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0F172A; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 30px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 100px; height: auto; margin-bottom: 10px; border-radius: 8px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 20px; font-weight: bold;">Staff Action Log: ${action} 🚨</h1>
      </div>
      <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 18px; margin-top: 0; color: #0F172A; border-bottom: 1px solid #edf2f7; padding-bottom: 10px;">Event Notice</h2>
        <p style="font-size: 15px; color: #334155; font-weight: 500;">${details}</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #edf2f7; margin-top: 20px;">
          <p style="margin: 5px 0; font-size: 13px;"><strong>Booking Reference::</strong> ${booking.bookingId}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Service:</strong> ${booking.service}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Customer Name:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Customer Phone:</strong> ${booking.customer.phone}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Address:</strong> ${booking.details.address}${booking.details.postcode && !booking.details.address.toLowerCase().includes(booking.details.postcode.toLowerCase()) ? ", " + booking.details.postcode : ""}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Scheduled Time:</strong> ${booking.schedule.timeSlot}${booking.schedule.preferredTime ? " (Requested Arrival: " + booking.schedule.preferredTime + ")" : ""}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://cleaniqservices.com/admin/bookings" style="display: inline-block; background-color: #0F172A; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px;">View in Admin Portal</a>
        </div>
      </div>
    </div>
  `,

  staffNewJobAlert: (booking) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0A5C43; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0A5C43; padding: 35px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 100px; height: auto; margin-bottom: 10px; border-radius: 8px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 24px;">New Job Alert! 🧹</h1>
        <p style="color: #E6F4F1; margin-top: 5px; font-size: 14px;">A new cleaning job is available on your feed</p>
      </div>
      <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 18px; margin-top: 0; color: #0A5C43;">Hello Cleaniq Staff,</h2>
        <p>A new cleaning appointment has been scheduled and is ready for acceptance. Here are the job details:</p>
        
        <div style="background-color: #F8FAFC; padding: 20px; border-radius: 16px; border: 1px solid #edf2f7; margin-bottom: 25px;">
          <p style="margin: 5px 0; font-size: 14px;"><strong>Service:</strong> ${booking.service}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(booking.schedule.date).toDateString()}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Time Slot:</strong> ${booking.schedule.timeSlot}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Duration:</strong> ${booking.details.duration} Hours</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Location / Area:</strong> ${booking.details.address.split(",").slice(-2).join(", ").trim() || "Local Region"}</p>
        </div>

        <p style="font-size: 13px; color: #64748b; font-style: italic;">Note: To protect customer privacy, the complete address and contact details will be shown only after you accept the job.</p>

        <div style="text-align: center; margin-top: 35px;">
          <p style="margin-bottom: 15px; font-weight: bold; color: #0A5C43;">Accept it now before another staff does!</p>
          <a href="https://cleaniqservices.com" style="display: inline-block; background-color: #0A5C43; color: white; padding: 18px 36px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(10, 92, 67, 0.2);">Open Cleaniq Staff App</a>
        </div>
      </div>
    </div>
  `,

  newChatMessageToAdminAlert: (staff, text) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0F172A; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 30px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 100px; height: auto; margin-bottom: 10px; border-radius: 8px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 20px;">New Support Message 💬</h1>
      </div>
      <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 18px; margin-top: 0; color: #0F172A;">Hello Admin,</h2>
        <p>Staff member <strong>${staff.firstName} ${staff.lastName}</strong> (${staff.workerId || "Staff"}) has sent you a new support chat message:</p>
        
        <div style="background-color: #F8FAFC; padding: 20px; border-radius: 16px; border-left: 4px solid #6EE7B7; margin: 20px 0; font-size: 15px; color: #334155; font-style: italic; font-weight: 500;">
          "${text}"
        </div>

        <div style="text-align: center; margin-top: 35px; border-top: 1px solid #edf2f7; padding-top: 25px;">
          <a href="https://cleaniqservices.com/admin/chat" style="display: inline-block; background-color: #0F172A; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px;">Open Support Chat Portal</a>
        </div>
      </div>
    </div>
  `,

  newChatMessageToStaffAlert: (staff, senderName, text) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0A5C43; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0A5C43; padding: 35px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 100px; height: auto; margin-bottom: 10px; border-radius: 8px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 22px;">New Support Message 💬</h1>
        <p style="color: #E6F4F1; margin-top: 5px; font-size: 14px;">The Cleaniq office team has sent you a reply</p>
      </div>
      <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 18px; margin-top: 0; color: #0A5C43;">Hello ${staff.firstName},</h2>
        <p>You have received a new support chat message from the Cleaniq Admin team (<strong>${senderName || "Admin Office"}</strong>):</p>
        
        <div style="background-color: #F8FAFC; padding: 20px; border-radius: 16px; border-left: 4px solid #6EE7B7; margin: 20px 0; font-size: 15px; color: #334155; font-style: italic; font-weight: 500;">
          "${text}"
        </div>

        <div style="text-align: center; margin-top: 35px; border-top: 1px solid #edf2f7; padding-top: 25px;">
          <a href="https://cleaniqservices.com" style="display: inline-block; background-color: #0A5C43; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px;">Open Cleaniq Staff App</a>
        </div>
      </div>
    </div>
  `,

  staffAppInvite: (staff) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0A5C43; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0A5C43; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 110px; height: auto; margin-bottom: 15px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Cleaniq! 🎉</h1>
        <p style="color: #E6F4F1; margin-top: 5px; font-size: 15px;">Your Cleaniq Staff Account has been created</p>
      </div>
      <div style="padding: 45px 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0A5C43;">Hi ${staff.firstName},</h2>
        <p>Congratulations! You have been registered as an official member of the <strong>Cleaniq Services</strong> cleaning staff team.</p>
        <p>To start accepting jobs and tracking your completed cleans, download our staff application using the secure link below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://expo.dev/artifacts/eas/j8DzdUDFEfmfLUiK7QVUSG.apk" style="display: inline-block; background-color: #0A5C43; color: white; padding: 18px 36px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(10, 92, 67, 0.2);">Download Cleaniq Staff App</a>
        </div>

        <h3 style="font-size: 15px; color: #0A5C43; text-transform: uppercase; letter-spacing: 1px; margin-top: 35px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Your Login Credentials</h3>
        
        <div style="background-color: #F8FAFC; padding: 24px; border-radius: 20px; border: 1px solid #edf2f7;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;"><strong>Login Email:</strong> <span style="font-family: monospace; font-size: 15px; color: #0F172A;">${staff.email}</span></p>
          <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #0A5C43;">${staff.tempPassword}</span></p>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 20px; font-style: italic;">Note: For security reasons, please change your password inside the app settings as soon as you log in for the first time.</p>

        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #edf2f7; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #94a3b8; font-weight: 600;">Welcome aboard!</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #0A5C43;">The Cleaniq Operations Team</p>
        </div>
      </div>
    </div>
  `,

  adminAccountInvite: (admin) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0F172A; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 110px; height: auto; margin-bottom: 15px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Welcome to the Team! 🎉</h1>
        <p style="color: #cbd5e1; margin-top: 5px; font-size: 15px;">Your Cleaniq Business Portal account is ready</p>
      </div>
      <div style="padding: 45px 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0F172A;">Hi ${admin.username},</h2>
        <p>An administrator account has been created for you on the <strong>Cleaniq Business Portal</strong>${admin.role === "booking-agent" ? ", with access to create and manage bookings" : ""}.</p>

        <h3 style="font-size: 13px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Your Login Credentials</h3>

        <div style="background-color: #F8FAFC; padding: 24px; border-radius: 20px; border: 1px solid #edf2f7;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;"><strong>Username:</strong> <span style="font-family: monospace; font-size: 15px; color: #0F172A;">${admin.username}</span></p>
          <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #0F172A;">${admin.tempPassword}</span></p>
        </div>

        <div style="text-align: center; margin: 35px 0 10px;">
          <a href="https://cleaniqservices.com/admin" style="display: inline-block; background-color: #0F172A; color: #6EE7B7; padding: 18px 40px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2);">Log In to Dashboard</a>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 25px; font-style: italic;">For security, please change your password as soon as you log in for the first time (Settings → Security).</p>

        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #edf2f7; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #94a3b8; font-weight: 600;">Welcome aboard!</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #0F172A;">The Cleaniq Operations Team</p>
        </div>
      </div>
    </div>
  `,

  paymentRequired: (booking, checkoutLink) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 28px; letter-spacing: -1px;">Payment Required</h1>
        <p style="color: #94a3b8; margin-top: 10px; font-weight: 500;">Complete your booking payment</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0F172A;">Hi ${booking.customer.firstName},</h2>
        <p>Your cleaning booking has been created! To confirm your appointment, please complete the payment using the button below.</p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 20px; margin: 24px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Booking Reference:</p>
          <p style="margin: 8px 0 20px 0; font-size: 20px; font-weight: 900; color: #0F172A;">${booking.bookingId}</p>
          
          <table width="100%" cellpadding="12" cellspacing="0" style="background: white; border-radius: 12px; border: 1px solid #edf2f7; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Service:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.service}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Date:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${new Date(booking.schedule.date).toDateString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Time:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.schedule.timeSlot}${booking.schedule.preferredTime ? " (Requested Arrival: " + booking.schedule.preferredTime + ")" : ""}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Duration:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.details.duration} Hours</td>
            </tr>
            ${
              booking.details?.address
                ? `
            <tr style="border-top: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Service Address:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.details.address}${booking.details.postcode && !booking.details.address.toLowerCase().includes(booking.details.postcode.toLowerCase()) ? ", " + booking.details.postcode : ""}</td>
            </tr>`
                : ""
            }
          </table>
        </div>

        <h3 style="font-size: 16px; color: #0F172A; margin-top: 32px; margin-bottom: 12px; font-weight: 800;">Requirements & Property Details:</h3>
        <ul style="padding-left: 20px; margin: 0; font-size: 14px; color: #475569;">
          ${(booking.details.extras || []).map((e) => `<li style="margin-top: 4px;"><strong>Requirement:</strong> ${typeof e === "object" && e !== null ? `${e.name} (x${e.qty || 1})` : e}</li>`).join("")}
          ${booking.details.Bedroom !== undefined ? `<li style="margin-top: 4px;"><strong>Bedrooms:</strong> ${booking.details.Bedroom}</li>` : ""}
          ${booking.details.Bathroom !== undefined ? `<li style="margin-top: 4px;"><strong>Bathrooms:</strong> ${booking.details.Bathroom}</li>` : ""}
          ${booking.details.Kitchen !== undefined ? `<li style="margin-top: 4px;"><strong>Kitchens:</strong> ${booking.details.Kitchen}</li>` : ""}
          ${booking.details["Living Room"] !== undefined ? `<li style="margin-top: 4px;"><strong>Living Rooms:</strong> ${booking.details["Living Room"]}</li>` : ""}
        </ul>

        <div style="margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 20px; text-align: center; border: 2px solid #86efac;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 1px;">Total Amount Due:</p>
          <p style="margin: 0; font-size: 36px; font-weight: 900; color: #15803d;">£${booking.payment.amount}</p>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <h3 style="font-size: 16px; color: #0F172A; margin-bottom: 20px; font-weight: 800;">Option 1: Pay Online</h3>
          <a href="${checkoutLink}" style="display: inline-block; background-color: #0F172A; color: white; padding: 18px 40px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); cursor: pointer;">Pay Now Securely</a>
          <p style="margin-top: 15px; font-size: 13px; color: #94a3b8; font-weight: 600;">🔒 Secure card payment powered by Stripe.</p>
        </div>

        <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e2e8f0; text-align: center;">
          <h3 style="font-size: 16px; color: #0F172A; margin-bottom: 20px; font-weight: 800;">Option 2: Pay by Bank Transfer</h3>
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #cbd5e1; display: inline-block; text-align: left;">
            <p style="margin: 0 0 10px 0; font-size: 15px; color: #334155;"><strong>Bank:</strong> HSBC Bank</p>
            <p style="margin: 0 0 10px 0; font-size: 15px; color: #334155;"><strong>Account Name:</strong> Cleaniq services Limited</p>
            <p style="margin: 0 0 10px 0; font-size: 15px; color: #334155;"><strong>Sort Code:</strong> 40-11-56</p>
            <p style="margin: 0 0 10px 0; font-size: 15px; color: #334155;"><strong>Account Number:</strong> 81106546</p>
            <div style="margin-top: 16px; padding: 12px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px;">
              <p style="margin: 0; font-size: 13px; color: #b45309;"><strong>Reference:</strong> Please use your Booking ID (<strong>${booking.bookingId}</strong>) as the payment reference.</p>
            </div>
          </div>
        </div>

        <p style="margin-top: 40px; font-size: 14px; color: #64748b; text-align: center; line-height: 1.6;">Once your payment is received and processed, your booking status will be officially updated to <strong>"Confirmed"</strong>, and you will receive a final confirmation email.</p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="https://cleaniqservices.com/account/bookings" style="display: inline-block; background-color: transparent; color: #0F172A; padding: 15px 30px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; border: 2px solid #0F172A;">View All Bookings</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,

  paymentSuccessCustomer: (booking) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0A5C43; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 28px; letter-spacing: -1px;">✓ Payment Confirmed!</h1>
        <p style="color: #E6F4F1; margin-top: 10px; font-weight: 500;">Your booking is now confirmed</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0A5C43;">Hi ${booking.customer.firstName},</h2>
        <p>Excellent! Your payment has been successfully processed. Your cleaning booking is now confirmed and scheduled.</p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 20px; margin: 24px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Booking Reference:</p>
          <p style="margin: 8px 0 20px 0; font-size: 20px; font-weight: 900; color: #0A5C43;">${booking.bookingId}</p>
          
          <table width="100%" cellpadding="12" cellspacing="0" style="background: white; border-radius: 12px; border: 1px solid #edf2f7; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Service:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.service}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Date:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${new Date(booking.schedule.date).toDateString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Time:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.schedule.timeSlot}${booking.schedule.preferredTime ? " (Requested Arrival: " + booking.schedule.preferredTime + ")" : ""}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Location:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.details.address}${booking.details.postcode && !booking.details.address.toLowerCase().includes(booking.details.postcode.toLowerCase()) ? ", " + booking.details.postcode : ""}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 32px; padding: 20px; background-color: #ECFDF5; border-radius: 20px; text-align: center; border: 1px solid #BBEDD7;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #0A5C43; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
          <p style="margin: 0; font-size: 32px; font-weight: 900; color: #0A5C43;">£${booking.payment.amount}</p>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #64748b; text-align: center;">Our team will reach out with any final details. Get ready for a sparkling clean!</p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="https://cleaniqservices.com/account/bookings" style="display: inline-block; background-color: #0A5C43; color: white; padding: 20px 40px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">Track Your Booking</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,

  adminBookingCreatedEmail1: (booking) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 45px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 130px; height: auto; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 32px; letter-spacing: -1px; font-weight: 800;">Booking Created by Admin ✓</h1>
        <p style="color: #94a3b8; margin-top: 12px; font-weight: 600; font-size: 15px;">Your cleaning appointment details</p>
      </div>
      
      <div style="padding: 50px 45px; color: #1e293b; line-height: 1.8;">
        <h2 style="font-size: 22px; margin-top: 0; margin-bottom: 10px; color: #0F172A;">Hello ${booking.customer.firstName},</h2>
        <p style="font-size: 15px; color: #475569; margin-bottom: 30px;">Your Cleaniq booking has been successfully created by our administrative team. We are thrilled to serve you! Please find your complete booking summary below, along with instructions for completing your payment via bank transfer. Here is everything you need to know:</p>
        
        <!-- BOOKING REFERENCE CARD -->
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1e3a8a 100%); padding: 32px; border-radius: 24px; margin-bottom: 32px; color: white; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);">
          <p style="margin: 0; font-size: 13px; font-weight: 800; color: #e0f2fe; text-transform: uppercase; letter-spacing: 2px;">Your Booking Reference:</p>
          <p style="margin: 12px 0 0 0; font-size: 28px; font-weight: 900; letter-spacing: 1px;">${booking.bookingId}</p>
        </div>

        <!-- SERVICE DETAILS GRID -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #6EE7B7; padding-left: 12px;">📋 Service Details</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 32px;">
          <div style="padding: 18px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; border: 1px solid #bae6fd;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 1px;">Service Type</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #0F172A;">${booking.service}</p>
          </div>
          <div style="padding: 18px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Frequency</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #0F172A;">${booking.details.frequency}</p>
          </div>
          <div style="padding: 18px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; border: 1px solid #fcd34d;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Duration</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #0F172A;">${booking.details.duration} Hours</p>
          </div>
          <div style="padding: 18px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 16px; border: 1px solid #93c5fd;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 1px;">Scheduling</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #0F172A;">As Arranged</p>
          </div>
        </div>

        <!-- DATE & TIME SECTION -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #6EE7B7; padding-left: 12px;">📅 Scheduled Date & Time</h3>
        
        <div style="padding: 24px; background-color: #f8fafc; border-radius: 20px; border: 2px solid #e2e8f0; margin-bottom: 32px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <p style="margin: 0; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Date</p>
              <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 800; color: #0F172A;">${new Date(booking.schedule.date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Time Slot</p>
              <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 800; color: #0F172A;">${booking.schedule.timeSlot} ${booking.schedule.preferredTime ? "(" + booking.schedule.preferredTime + ")" : ""}</p>
            </div>
          </div>
        </div>

        <!-- ADDRESS SECTION -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #6EE7B7; padding-left: 12px;">📍 Service Address</h3>
        
        <div style="padding: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 20px; border: 2px solid #a7f3d0; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.6;">${booking.details.address}</p>
          ${booking.details.postcode ? `<p style="margin: 8px 0 0 0; font-size: 15px; font-weight: 800; color: #065f46; letter-spacing: 1px;">${booking.details.postcode}</p>` : ""}
        </div>

        <!-- EXTRAS & REQUIREMENTS -->
        ${
          booking.details.extras && booking.details.extras.length > 0
            ? `
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #6EE7B7; padding-left: 12px;">🛠️ Extras & Special Requests</h3>
        
        <div style="padding: 24px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
          <ul style="margin: 0; padding-left: 0; list-style: none;">
            ${booking.details.extras
              .map(
                (extra, idx) => `
              <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px; color: #334155; display: flex; align-items: center;">
                <span style="display: inline-block; width: 6px; height: 6px; background-color: #6EE7B7; border-radius: 50%; margin-right: 12px;"></span>
                ${typeof extra === "object" && extra !== null ? `${extra.name} (x${extra.qty || 1})` : extra}
              </li>
            `,
              )
              .join("")}
          </ul>
        </div>
        `
            : ""
        }

        <!-- PROPERTY DETAILS -->
        ${
          (booking.property && Object.keys(booking.property).length > 0) ||
          booking.details.Bedroom !== undefined ||
          booking.details.Bathroom !== undefined
            ? `
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #6EE7B7; padding-left: 12px;">🏠 Property Information</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 32px;">
          ${booking.property?.bedrooms || booking.details.Bedroom !== undefined ? `<div style="padding: 18px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase;">Bedrooms</p><p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #0F172A;">${booking.property?.bedrooms || booking.details.Bedroom}</p></div>` : ""}
          ${booking.property?.bathrooms || booking.details.Bathroom !== undefined ? `<div style="padding: 18px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase;">Bathrooms</p><p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #0F172A;">${booking.property?.bathrooms || booking.details.Bathroom}</p></div>` : ""}
          ${booking.property?.kitchens || booking.details.Kitchen !== undefined ? `<div style="padding: 18px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase;">Kitchens</p><p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #0F172A;">${booking.property?.kitchens || booking.details.Kitchen}</p></div>` : ""}
          ${booking.property?.livingRooms || booking.details["Living Room"] !== undefined ? `<div style="padding: 18px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase;">Living Rooms</p><p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #0F172A;">${booking.property?.livingRooms || booking.details["Living Room"]}</p></div>` : ""}
        </div>
        `
            : ""
        }

        <!-- PRICING BREAKDOWN -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #6EE7B7; padding-left: 12px;">💷 Payment Summary</h3>
        
        <div style="padding: 28px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 24px; border: 2px solid #86efac; margin-bottom: 32px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #bbf7d0;">
            <span style="font-size: 15px; color: #3f6e37; font-weight: 600;">Service Charge:</span>
            <span style="font-size: 15px; color: #3f6e37; font-weight: 700;">£${booking.payment.amount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; color: #15803d; font-weight: 800; text-transform: uppercase;">Total Due:</span>
            <span style="font-size: 28px; color: #15803d; font-weight: 900;">£${booking.payment.amount}</span>
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #22863a; font-style: italic;">Status: <strong>Awaiting Payment</strong></p>
        </div>

        <!-- BANK TRANSFER DETAILS -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #6EE7B7; padding-left: 12px;">🏦 How to Pay (Bank Transfer)</h3>
        
        <div style="padding: 24px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #cbd5e1; margin-bottom: 32px;">
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #334155; line-height: 1.6;">Please complete your payment via bank transfer using the details below. Ensure you use your <strong>Booking Reference:</strong> as the payment reference so we can locate your transfer quickly.</p>
          <div style="background-color: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; font-size: 15px; color: #0F172A;"><strong>Bank Name:</strong> HSBC Bank</p>
            <p style="margin: 0 0 10px 0; font-size: 15px; color: #0F172A;"><strong>Account Name:</strong> Cleaniq Services Limited</p>
            <p style="margin: 0 0 10px 0; font-size: 15px; color: #0F172A;"><strong>Sort Code:</strong> 40-11-56</p>
            <p style="margin: 0; font-size: 15px; color: #0F172A;"><strong>Account Number:</strong> 81106546</p>
          </div>
          <div style="margin-top: 16px; padding: 12px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px;">
            <p style="margin: 0; font-size: 13px; color: #b45309;"><strong>Reference Code:</strong> ${booking.bookingId}</p>
          </div>
        </div>

        <!-- NOTES SECTION -->
        ${
          booking.details.notes
            ? `
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #6EE7B7; padding-left: 12px;">📝 Special Notes</h3>
        
        <div style="padding: 24px; background-color: #fffbeb; border-radius: 20px; border-left: 4px solid #f59e0b; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 15px; color: #92400e; line-height: 1.6;">${booking.details.notes}</p>
        </div>
        `
            : ""
        }

        <!-- NEXT STEPS -->
        <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 28px; border-radius: 20px; margin-bottom: 32px;">
          <h3 style="margin-top: 0; margin-bottom: 18px; font-size: 15px; color: #0F172A; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">✓ What Happens Next</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 12px; font-size: 14px; color: #374151; line-height: 1.6;"><strong>Payment:</strong> Please complete your bank transfer using the details provided above.</li>
            <li style="margin-bottom: 12px; font-size: 14px; color: #374151; line-height: 1.6;"><strong>Confirmation:</strong> Once payment is verified, your booking will be officially confirmed!</li>
            <li style="margin-bottom: 12px; font-size: 14px; color: #374151; line-height: 1.6;"><strong>Assignment:</strong> Our team will assign a professional cleaner to your job.</li>
            <li style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>Reminder:</strong> 24 hours before your appointment, you will receive a final reminder.</li>
          </ol>
        </div>

        <!-- SUPPORT -->
        <div style="text-align: center; padding-top: 30px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Have any questions about your booking?</p>
          <a href="https://cleaniqservices.com/contact" style="display: inline-block; background-color: #0F172A; color: white; padding: 16px 36px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">Contact Support</a>
        </div>
      </div>
      
      <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; font-weight: 600;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
        <p style="margin: 0; font-size: 11px; color: #cbd5e1;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,

  adminBookingCreatedEmail2: (booking) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0A5C43; padding: 45px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 130px; height: auto; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 32px; letter-spacing: -1px; font-weight: 800;">Your Booking is Ready! ✓</h1>
        <p style="color: #E6F4F1; margin-top: 12px; font-weight: 600; font-size: 15px;">Complete details of your scheduled appointment</p>
      </div>
      
      <div style="padding: 50px 45px; color: #1e293b; line-height: 1.8;">
        <h2 style="font-size: 22px; margin-top: 0; margin-bottom: 10px; color: #0F172A;">Hello ${booking.customer.firstName},</h2>
        <p style="font-size: 15px; color: #475569; margin-bottom: 30px;">Your cleaning appointment has been confirmed by our admin team. Everything is set, and we're ready to make your home sparkle! Here's your complete booking summary:</p>
        
        <!-- BOOKING CONFIRMATION BADGE -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 32px; border-radius: 16px; margin-bottom: 32px; color: white; text-align: center; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);">
          <p style="margin: 0; font-size: 12px; font-weight: 800; color: #d1fae5; text-transform: uppercase; letter-spacing: 2px;">✓ BOOKING CONFIRMED</p>
          <p style="margin: 12px 0 0 0; font-size: 24px; font-weight: 900;">${booking.bookingId}</p>
        </div>

        <!-- COMPLETE SERVICE DETAILS -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px;">📋 Full Service Summary</h3>
        
        <div style="padding: 24px; background-color: #f0fdf4; border-radius: 20px; border: 1px solid #bbf7d0; margin-bottom: 32px;">
          <div style="display: grid; gap: 16px;">
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 16px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #d1fae5;">
              <span style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase;">Service Type</span>
              <span style="font-size: 15px; font-weight: 700; color: #0F172A;">${booking.service}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 16px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #d1fae5;">
              <span style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase;">Frequency</span>
              <span style="font-size: 15px; font-weight: 700; color: #0F172A;">${booking.details.frequency}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 16px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #d1fae5;">
              <span style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase;">Duration</span>
              <span style="font-size: 15px; font-weight: 700; color: #0F172A;">${booking.details.duration} Hours</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 16px; align-items: center;">
              <span style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase;">Status</span>
              <span style="display: inline-block; background-color: #d1fae5; color: #065f46; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px;">✓ CONFIRMED</span>
            </div>
          </div>
        </div>

        <!-- APPOINTMENT SCHEDULE -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px;">📅 Your Appointment</h3>
        
        <div style="padding: 28px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 20px; border: 2px solid #86efac; margin-bottom: 32px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 28px;">
            <div>
              <p style="margin: 0; font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px;">📆 Date</p>
              <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 800; color: #065f46;">${new Date(booking.schedule.date).toLocaleDateString("en-GB", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px;">🕐 Time</p>
              <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 800; color: #065f46;">${booking.schedule.timeSlot}</p>
            </div>
          </div>
          <div style="padding-top: 20px; border-top: 1px solid #bbf7d0;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #047857;">⏱️ <strong>Duration:</strong> ${booking.details.duration} hours of professional cleaning</p>
          </div>
        </div>

        <!-- LOCATION & ADDRESS -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px;">📍 Service Location</h3>
        
        <div style="padding: 24px; background-color: #ecfdf5; border-radius: 20px; border: 2px solid #a7f3d0; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #065f46; line-height: 1.8;">${booking.details.address}</p>
          ${booking.details.postcode ? `<p style="margin: 8px 0 0 0; font-size: 15px; font-weight: 800; color: #065f46; letter-spacing: 1px;">${booking.details.postcode}</p>` : ""}
        </div>

        <!-- CLEANING SCOPE -->
        ${
          booking.details.extras && booking.details.extras.length > 0
            ? `
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px;">🧹 What We'll Clean</h3>
        
        <div style="padding: 24px; background-color: #f0fdf4; border-radius: 20px; border: 1px solid #bbf7d0; margin-bottom: 32px;">
          <ul style="margin: 0; padding-left: 0; list-style: none;">
            ${booking.details.extras
              .map(
                (extra) => `
              <li style="padding: 12px 0; border-bottom: 1px solid #d1fae5; font-size: 15px; color: #065f46; display: flex; align-items: center;">
                <span style="display: inline-block; width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; margin-right: 14px; flex-shrink: 0;"></span>
                <span style="font-weight: 600;">${extra}</span>
              </li>
            `,
              )
              .join("")}
          </ul>
        </div>
        `
            : ""
        }

        <!-- PRICE SUMMARY -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px;">💷 Pricing & Payment</h3>
        
        <div style="padding: 28px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 24px; border: 2px solid #86efac; margin-bottom: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #a7f3d0; font-size: 14px; color: #065f46;">Service Charge</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #a7f3d0; text-align: right; font-size: 14px; font-weight: 700; color: #065f46;">£${booking.payment.amount}</td>
            </tr>
            <tr style="background-color: rgba(16, 185, 129, 0.1);">
              <td style="padding: 16px 0; font-size: 16px; font-weight: 800; color: #065f46; text-transform: uppercase;">Total Due</td>
              <td style="padding: 16px 0; text-align: right; font-size: 24px; font-weight: 900; color: #065f46;">£${booking.payment.amount}</td>
            </tr>
          </table>
          <p style="margin: 16px 0 0 0; font-size: 13px; color: #047857; font-weight: 600;">✓ Payment Status: <strong>CONFIRMED</strong></p>
        </div>

        <!-- CUSTOMER INFORMATION -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px;">👤 Your Information</h3>
        
        <div style="padding: 20px; background-color: #f0fdf4; border-radius: 16px; border: 1px solid #bbf7d0; margin-bottom: 32px;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #065f46;"><strong>Name:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #065f46;"><strong>Email:</strong> ${booking.customer.email}</p>
          <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Phone:</strong> ${booking.customer.phone}</p>
        </div>

        <!-- FINAL NOTES -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 28px; border-radius: 20px; border-left: 4px solid #f59e0b; margin-bottom: 32px;">
          <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 15px; color: #92400e; font-weight: 800; text-transform: uppercase;">⚡ Important Reminders</h3>
          <ul style="margin: 0; padding-left: 20px; list-style: disc;">
            <li style="margin-bottom: 10px; font-size: 14px; color: #b45309; line-height: 1.5;">Please ensure someone is home or provide access instructions</li>
            <li style="margin-bottom: 10px; font-size: 14px; color: #b45309; line-height: 1.5;">You'll receive a reminder 24 hours before your appointment</li>
            <li style="margin-bottom: 10px; font-size: 14px; color: #b45309; line-height: 1.5;">Our cleaner will contact you 30 minutes before arrival</li>
            <li style="font-size: 14px; color: #b45309; line-height: 1.5;">Rate your experience after completion to help us improve</li>
          </ul>
        </div>

        <!-- SUPPORT & NEXT STEPS -->
        <div style="text-align: center; padding-top: 30px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; font-weight: 600;">Need to reschedule or have questions?</p>
          <a href="https://cleaniqservices.com/contact" style="display: inline-block; background-color: #0A5C43; color: white; padding: 16px 36px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(10, 92, 67, 0.15); margin-right: 12px; margin-bottom: 12px;">Contact Us</a>
          <a href="https://cleaniqservices.com/account/bookings" style="display: inline-block; background-color: transparent; color: #0A5C43; padding: 16px 36px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; border: 2px solid #0A5C43;">View Dashboard</a>
        </div>
      </div>
      
      <div style="background-color: #f0fdf4; padding: 24px; text-align: center; border-top: 1px solid #d1fae5;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #059669; font-weight: 600;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
        <p style="margin: 0; font-size: 11px; color: #6b7280;">Thank you for choosing Cleaniq for your cleaning needs!</p>
      </div>
    </div>
  `,

  paymentSuccessAdmin: (booking) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0F172A; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 30px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 100px; height: auto; margin-bottom: 10px; border-radius: 8px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 24px;">✓ Payment Received! 💰</h1>
      </div>
      <div style="padding: 30px; color: #1e293b; line-height: 1.5;">
        <h2 style="font-size: 18px; margin-top: 0; color: #0F172A; border-bottom: 1px solid #edf2f7; padding-bottom: 15px;">Payment Successfully Processed</h2>
        
        <div style="display: flex; justify-content: space-between; margin: 20px 0; padding-bottom: 15px; border-bottom: 1px solid #edf2f7;">
          <div>
            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Booking Reference:</p>
            <p style="margin: 0; font-size: 16px; font-weight: 800; color: #0F172A;">${booking.bookingId}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Amount Paid</p>
            <p style="margin: 0; font-size: 16px; font-weight: 800; color: #0A5C43;">£${booking.payment.amount}</p>
          </div>
        </div>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Customer Details</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${booking.customer.email}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> ${booking.customer.phone}</p>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Service Details</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Service:</strong> ${booking.service}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(booking.schedule.date).toDateString()}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${booking.schedule.timeSlot}${booking.schedule.preferredTime ? " (Requested Arrival: " + booking.schedule.preferredTime + ")" : ""}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Address:</strong> ${booking.details.address}${booking.details.postcode && !booking.details.address.toLowerCase().includes(booking.details.postcode.toLowerCase()) ? ", " + booking.details.postcode : ""}</p>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7;">
          <a href="https://cleaniqservices.com/admin/bookings" style="display: inline-block; background-color: #0F172A; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px;">Manage in Dashboard</a>
        </div>
      </div>
    </div>
  `,

  withdrawalRequestWorker: (worker, amount) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 26px;">Withdrawal Request Received ✅</h1>
        <p style="color: #94a3b8; margin-top: 10px; font-weight: 500;">Your request is being processed</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0F172A;">Hi ${worker.firstName},</h2>
        <p>We have received your withdrawal request. It is now pending admin approval. Once approved, the funds will be transferred to your registered bank account within 2-3 business days.</p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 20px; margin: 24px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 0 0 15px 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Withdrawal Details</p>
          
          <table width="100%" cellpadding="10" cellspacing="0" style="background: white; border-radius: 12px; border: 1px solid #edf2f7;">
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Amount Requested:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">£${amount.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Status:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #F59E0B;">Pending Approval</td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Requested On:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${new Date().toDateString()}</td>
            </tr>
          </table>
        </div>

        <p style="margin-top: 25px; font-size: 14px; color: #64748b;">You will receive another email notification once our admin team reviews and approves your request. If you have any questions, please reach out to our support team.</p>

        <div style="margin-top: 40px; padding: 20px; background-color: #ECFDF5; border-radius: 16px; border-left: 4px solid #0A5C43;">
          <p style="margin: 0; font-size: 13px; color: #0A5C43;"><strong>💡 Tip:</strong> Make sure your bank details in your profile are up to date for faster processing.</p>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,

  withdrawalRequestAdmin: (worker, amount, bankDetails, requestId) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 2px solid #0F172A; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 26px;">🚨 New Withdrawal Request</h1>
        <p style="color: #94a3b8; margin-top: 10px; font-weight: 500;">Pending your approval</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0F172A;">Staff Withdrawal Request</h2>
        <p>A staff member has requested a withdrawal. Please review the details below and take appropriate action.</p>
        
        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Staff Information</h3>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #edf2f7;">
          <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${worker.firstName} ${worker.lastName}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${worker.email}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> ${worker.phone}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Worker ID:</strong> ${worker._id}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Address:</strong> ${worker.address}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Postcode:</strong> ${worker.postcode}</p>
        </div>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Withdrawal Details</h3>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #edf2f7;">
          <p style="margin: 5px 0; font-size: 14px;"><strong>Amount Requested:</strong> £${amount.toFixed(2)}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Request ID:</strong> ${requestId}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Current Balance:</strong> £${worker.wallet?.balance?.toFixed(2) || "0.00"}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Requested On:</strong> ${new Date().toDateString()}</p>
        </div>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Bank Account Details</h3>
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 16px; border: 1px solid #FCD34D; border-left: 4px solid #F59E0B;">
          <p style="margin: 5px 0; font-size: 14px;"><strong>Account Holder:</strong> ${bankDetails.accountHolder || "N/A"}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Account Number:</strong> ****${bankDetails.accountNumber?.slice(-4) || "XXXX"}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Sort Code:</strong> ${bankDetails.sortCode || "N/A"}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Bank Name:</strong> ${bankDetails.bankName || "N/A"}</p>
        </div>

        <div style="text-align: center; margin-top: 35px; gap: 15px; display: flex; justify-content: center;">
          <a href="https://cleaniqservices.com/admin/withdrawals" style="display: inline-block; background-color: #0A5C43; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px;">View in Admin Portal</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,

  withdrawalApprovedWorker: (worker, amount, requestId) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #0A5C43; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0A5C43; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 26px;">✅ Withdrawal Approved!</h1>
        <p style="color: #E6F4F1; margin-top: 10px; font-weight: 500;">Your money is on the way</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0A5C43;">Hi ${worker.firstName},</h2>
        <p>Great news! Your withdrawal request has been approved by our admin team. The funds have been deducted from your account balance and will be transferred to your registered bank account within 2-3 business days.</p>
        
        <div style="background-color: #ECFDF5; padding: 24px; border-radius: 20px; margin: 24px 0; border: 1px solid #BBEDD7;">
          <p style="margin: 0 0 15px 0; font-size: 11px; font-weight: 800; color: #0A5C43; text-transform: uppercase; letter-spacing: 1px;">Withdrawal Confirmation</p>
          
          <table width="100%" cellpadding="10" cellspacing="0" style="background: white; border-radius: 12px; border: 1px solid #BBEDD7;">
            <tr style="border-bottom: 1px solid #BBEDD7;">
              <td style="font-size: 14px; font-weight: bold; color: #0A5C43;">Amount Withdrawn:</td>
              <td align="right" style="font-size: 16px; font-weight: 900; color: #0A5C43;">£${amount.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #BBEDD7;">
              <td style="font-size: 14px; font-weight: bold; color: #0A5C43;">Request ID:</td>
              <td align="right" style="font-size: 14px; font-weight: 600; color: #059669;">${requestId}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: bold; color: #0A5C43;">Approved On:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0A5C43;">${new Date().toDateString()}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 25px; padding: 20px; background-color: #E0F2FE; border-radius: 16px; border-left: 4px solid #0284C7;">
          <p style="margin: 0; font-size: 13px; color: #0C4A6E;"><strong>⏱️ Processing Time:</strong> The transfer typically takes 2-3 business days. Check your bank account for the incoming funds.</p>
        </div>

        <p style="margin-top: 25px; font-size: 14px; color: #64748b;">If you have any questions about this withdrawal or don't receive the funds within 5 business days, please contact our support team.</p>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,

  withdrawalRejectedWorker: (worker, amount, reason) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #fee2e2; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #DC2626; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #FECACA; margin: 0; font-size: 26px;">❌ Withdrawal Declined</h1>
        <p style="color: #FECACA; margin-top: 10px; font-weight: 500;">Your request could not be processed</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #DC2626;">Hi ${worker.firstName},</h2>
        <p>Unfortunately, your withdrawal request for £${amount.toFixed(2)} has been declined. Your account balance remains unchanged.</p>
        
        <div style="background-color: #FEE2E2; padding: 20px; border-radius: 16px; margin: 24px 0; border: 1px solid #FECACA; border-left: 4px solid #DC2626;">
          <p style="margin: 5px 0; font-size: 13px; color: #7F1D1D;"><strong>Reason:</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #991B1B;">${reason || "Your request does not meet the withdrawal criteria. Please contact support for more information."}</p>
        </div>

        <p style="margin-top: 25px; font-size: 14px; color: #64748b;">If you believe this is an error or would like to discuss your withdrawal request further, please reach out to our support team via the support chat in your app.</p>

        <div style="text-align: center; margin-top: 35px;">
          <a href="https://cleaniqservices.com" style="display: inline-block; background-color: #0F172A; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px;">Open Cleaniq Staff App</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,

  devModeBookingSuccess: (booking) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 45px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 130px; height: auto; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);" />
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: -1px; font-weight: 800;">✓ Booking Confirmed!</h1>
        <p style="color: #d1fae5; margin-top: 12px; font-weight: 600; font-size: 15px;">Your cleaning appointment is all set</p>
      </div>
      
      <div style="padding: 50px 45px; color: #1e293b; line-height: 1.8;">
        <h2 style="font-size: 22px; margin-top: 0; margin-bottom: 10px; color: #0F172A;">Hello ${booking.customer.firstName},</h2>
        <p style="font-size: 15px; color: #475569; margin-bottom: 30px;">Your cleaning booking has been confirmed! We're excited to help you get your home sparkling clean. Here are your complete booking details:</p>
        
        <!-- BOOKING REFERENCE CARD -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 24px; margin-bottom: 32px; color: white; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);">
          <p style="margin: 0; font-size: 13px; font-weight: 800; color: #d1fae5; text-transform: uppercase; letter-spacing: 2px;">Your Booking Reference:</p>
          <p style="margin: 12px 0 0 0; font-size: 28px; font-weight: 900; letter-spacing: 1px;">${booking.bookingId}</p>
        </div>

        <!-- SERVICE DETAILS GRID -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px;">📋 Service Details</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 32px;">
          <div style="padding: 18px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; border: 1px solid #86efac;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Service Type</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #0F172A;">${booking.service}</p>
          </div>
          <div style="padding: 18px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Frequency</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #0F172A;">${booking.details.frequency}</p>
          </div>
          <div style="padding: 18px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; border: 1px solid #fcd34d;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Duration</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #0F172A;">${booking.details.duration} Hours</p>
          </div>
          <div style="padding: 18px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; border: 1px solid #bae6fd;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 1px;">Amount</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #0F172A;">£${booking.payment.amount}</p>
          </div>
        </div>

        <!-- DATE & TIME SECTION -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px;">📅 Scheduled Date & Time</h3>
        
        <div style="padding: 24px; background-color: #f0fdf4; border-radius: 20px; border: 2px solid #86efac; margin-bottom: 32px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <p style="margin: 0; font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Date</p>
              <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 800; color: #0F172A;">${new Date(booking.schedule.date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Time Slot</p>
              <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 800; color: #0F172A;">${booking.schedule.timeSlot} ${booking.schedule.preferredTime ? "(" + booking.schedule.preferredTime + ")" : ""}</p>
            </div>
          </div>
        </div>

        <!-- ADDRESS SECTION -->
        <h3 style="font-size: 16px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 800; border-left: 4px solid #10b981; padding-left: 12px;">📍 Service Address</h3>
        
        <div style="padding: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 20px; border: 2px solid #a7f3d0; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.6;">${booking.details.address}</p>
          ${booking.details.postcode ? `<p style="margin: 8px 0 0 0; font-size: 15px; font-weight: 800; color: #0F172A; letter-spacing: 1px;">${booking.details.postcode}</p>` : ""}
        </div>

        <!-- NEXT STEPS -->
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 28px; border-radius: 20px; margin-bottom: 32px; border: 2px solid #86efac;">
          <h3 style="margin-top: 0; margin-bottom: 18px; font-size: 15px; color: #0F172A; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">✓ What Happens Next</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 12px; font-size: 14px; color: #374151; line-height: 1.6;"><strong>Booking Confirmed:</strong> Your appointment is locked in and ready to go!</li>
            <li style="margin-bottom: 12px; font-size: 14px; color: #374151; line-height: 1.6;"><strong>Professional Assigned:</strong> Our team will assign the best cleaner for your home.</li>
            <li style="margin-bottom: 12px; font-size: 14px; color: #374151; line-height: 1.6;"><strong>Reminder Email:</strong> You'll get a reminder 24 hours before your appointment.</li>
            <li style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>Quality Guaranteed:</strong> We stand behind our work with a 100% satisfaction guarantee!</li>
          </ol>
        </div>

        <!-- SUPPORT -->
        <div style="text-align: center; padding-top: 30px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Have any questions about your booking?</p>
          <a href="https://cleaniqservices.com/contact" style="display: inline-block; background-color: #10b981; color: white; padding: 16px 36px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);">Contact Support</a>
        </div>
      </div>
      
      <div style="background-color: #f0fdf4; padding: 24px; text-align: center; border-top: 1px solid #86efac;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #059669; font-weight: 600;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
        <p style="margin: 0; font-size: 11px; color: #6ee7b7;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,

  // ─── REVIEW REQUEST EMAIL ──────────────────────────────────────────────────
  reviewRequest: (booking, reviewUrl) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <!-- HEADER -->
      <div style="background: linear-gradient(135deg, #0F172A 0%, #1e293b 100%); padding: 50px 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 50%; object-fit: cover; border: 3px solid #6EE7B7; box-shadow: 0 0 0 6px rgba(110,231,183,0.15);" />
        <div style="font-size: 48px; margin-bottom: 12px;">⭐</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 30px; letter-spacing: -1px; font-weight: 800;">How did we do?</h1>
        <p style="color: #94a3b8; margin-top: 10px; font-size: 15px; font-weight: 500;">Your feedback helps us be better</p>
      </div>

      <!-- BODY -->
      <div style="padding: 50px 40px; color: #1e293b; line-height: 1.8;">
        <h2 style="font-size: 22px; margin-top: 0; margin-bottom: 8px; color: #0F172A; font-weight: 800;">Hi ${booking.customer.firstName},</h2>
        <p style="font-size: 15px; color: #475569; margin-bottom: 30px;">We hope you loved your recent cleaning session! Your experience and honest feedback means the world to us and helps us keep delivering 5-star results.</p>

        <!-- BOOKING REFERENCE CARD -->
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%); padding: 24px 28px; border-radius: 20px; margin-bottom: 32px; color: white; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Booking Reference</p>
            <p style="margin: 8px 0 0 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">${booking.bookingId}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Service</p>
            <p style="margin: 8px 0 0 0; font-size: 15px; font-weight: 700; color: #6EE7B7;">${booking.service}</p>
          </div>
        </div>

        <!-- STAR RATING VISUAL -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Tap a star to leave your rating</p>
          <div style="display: inline-block;">
            <a href="${reviewUrl}&rating=1" style="text-decoration: none; font-size: 36px; margin: 0 4px;">⭐</a>
            <a href="${reviewUrl}&rating=2" style="text-decoration: none; font-size: 36px; margin: 0 4px;">⭐</a>
            <a href="${reviewUrl}&rating=3" style="text-decoration: none; font-size: 36px; margin: 0 4px;">⭐</a>
            <a href="${reviewUrl}&rating=4" style="text-decoration: none; font-size: 36px; margin: 0 4px;">⭐</a>
            <a href="${reviewUrl}&rating=5" style="text-decoration: none; font-size: 36px; margin: 0 4px;">⭐</a>
          </div>
        </div>

        <!-- CTA BUTTON -->
        <div style="text-align: center; margin: 36px 0;">
          <a href="https://g.page/r/CTGJLR1Z7dySEBM/review" style="display: inline-block; background: linear-gradient(135deg, #6EE7B7 0%, #10b981 100%); color: #0F172A; padding: 20px 48px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 10px 25px rgba(16,185,129,0.35);">Leave a Review →</a>
        </div>

        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 24px;">It only takes 30 seconds and makes a huge difference. Thank you! 🙏</p>
      </div>

      <!-- FOOTER -->
      <div style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">Cleaniq Services — Professional Cleaning</p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">© 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,

  // ─── PAYMENT LINK EMAIL ────────────────────────────────────────────────────
  paymentLinkEmail: (booking, items, totalAmount, payUrl, note) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <!-- HEADER -->
      <div style="background: linear-gradient(135deg, #0F172A 0%, #1e293b 100%); padding: 50px 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 50%; object-fit: cover; border: 3px solid #6EE7B7; box-shadow: 0 0 0 6px rgba(110,231,183,0.15);" />
        <div style="font-size: 48px; margin-bottom: 12px;">💳</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 30px; letter-spacing: -1px; font-weight: 800;">Payment Request</h1>
        <p style="color: #94a3b8; margin-top: 10px; font-size: 15px; font-weight: 500;">Secure payment for your Cleaniq services</p>
      </div>

      <!-- BODY -->
      <div style="padding: 50px 40px; color: #1e293b; line-height: 1.8;">
        <h2 style="font-size: 22px; margin-top: 0; margin-bottom: 8px; color: #0F172A; font-weight: 800;">Hi ${booking.customer.firstName},</h2>
        <p style="font-size: 15px; color: #475569; margin-bottom: 32px;">A payment has been prepared for you by the Cleaniq team. Please review the details below and click the button to pay securely online.</p>

        <!-- BOOKING REF -->
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%); padding: 20px 28px; border-radius: 18px; margin-bottom: 28px; color: white;">
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Booking Reference</p>
          <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 900;">${booking.bookingId}</p>
        </div>

        <!-- ITEMS TABLE -->
        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; border-left: 4px solid #6EE7B7; padding-left: 12px; margin-bottom: 16px;">📋 Service Items</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 28px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="text-align: left; padding: 14px 18px; font-size: 12px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0;">Service / Item</th>
              <th style="text-align: center; padding: 14px 18px; font-size: 12px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0;">Qty</th>
              <th style="text-align: right; padding: 14px 18px; font-size: 12px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(items || [])
              .map(
                (item, i) => `
              <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#fafafa"}; border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #1e293b;">${item.name}</td>
                <td style="padding: 14px 18px; font-size: 14px; color: #64748b; text-align: center;">${item.qty || 1}</td>
                <td style="padding: 14px 18px; font-size: 14px; font-weight: 700; color: #0F172A; text-align: right;">£${((item.amount || 0) * (item.qty || 1)).toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <!-- TOTAL -->
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 24px 28px; border-radius: 18px; border: 2px solid #86efac; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 13px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">Total Amount Due</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 36px; font-weight: 900; color: #065f46;">£${Number(totalAmount).toFixed(2)}</p>
          </div>
        </div>

        ${
          note
            ? `
        <!-- NOTE FROM ADMIN -->
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px 22px; border-radius: 12px; margin-bottom: 28px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 1px;">Note from Cleaniq</p>
          <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">${note}</p>
        </div>
        `
            : ""
        }

        <!-- PAY BUTTON -->
        <div style="text-align: center; margin: 36px 0 24px;">
          <a href="${payUrl}" style="display: inline-block; background: linear-gradient(135deg, #0F172A 0%, #1e3a5f 100%); color: #6EE7B7; padding: 22px 56px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 18px; letter-spacing: 0.5px; box-shadow: 0 15px 30px rgba(15,23,42,0.3);">🔒 Pay Securely Now</a>
          <p style="margin-top: 14px; font-size: 12px; color: #94a3b8; font-weight: 600;">Powered by Stripe — 100% Secure &amp; Encrypted</p>
        </div>

        <!-- BANK TRANSFER OPTION -->
        <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e2e8f0; text-align: center;">
          <h3 style="font-size: 15px; color: #0F172A; margin-bottom: 18px; font-weight: 800;">Or Pay by Bank Transfer</h3>
          <div style="background-color: #f8fafc; padding: 22px; border-radius: 16px; border: 1px solid #cbd5e1; display: inline-block; text-align: left;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Bank:</strong> HSBC Bank</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Account Name:</strong> Cleaniq services Limited</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Sort Code:</strong> 40-11-56</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Account Number:</strong> 81106546</p>
            <div style="margin-top: 14px; padding: 10px 14px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px;">
              <p style="margin: 0; font-size: 13px; color: #b45309;"><strong>Reference:</strong> ${booking.bookingId}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">Cleaniq Services — Professional Cleaning</p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">© 2026 Cleaniq Services. All rights reserved.</p>
      </div>
    </div>
  `,
};

module.exports = { sendEmail, templates };
