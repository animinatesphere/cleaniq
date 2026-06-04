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
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.details.address}</td>
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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 28px; letter-spacing: -1px;">Receipt & Invoice</h1>
        <p style="color: #94a3b8; margin-top: 10px; font-weight: 500;">Your cleaning service is completed!</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0F172A;">Hi ${booking.customer.firstName},</h2>
        <p>This is a formal receipt for your recently completed cleaning service. The payment authorized at the time of booking has now been fully processed.</p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 20px; margin: 24px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Invoice Reference</p>
          <p style="margin: 0 0 20px 0; font-size: 20px; font-weight: 900; color: #0F172A;">INV-${booking.bookingId}</p>
          
          <table width="100%" cellpadding="12" cellspacing="0" style="background: white; border-radius: 12px; border: 1px solid #edf2f7; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Service:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.service}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Date Completed:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${new Date().toDateString()}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: bold; color: #64748b;">Duration:</td>
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.details.duration} Hours</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: bold;">TOTAL CHARGED</p>
            <p style="margin: 0; font-size: 24px; font-weight: 900; color: #0F172A;">£${booking.payment.amount}</p>
          </div>
          <div style="background-color: #ecfdf5; color: #059669; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
            Paid
          </div>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you have any questions about this receipt, please contact our support team via your dashboard.</p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="https://cleaniqservices.com/account/dashboard" style="display: inline-block; background-color: #0F172A; color: #6EE7B7; padding: 18px 36px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">Visit Dashboard</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Cleaniq Services. All rights reserved.</p>
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
        <p style="margin: 5px 0; font-size: 14px;"><strong>Service Address:</strong> ${booking.details.address}</p>

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
          <p style="margin: 5px 0; font-size: 13px;"><strong>Address:</strong> ${booking.details.address}</p>
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
              <td align="right" style="font-size: 14px; font-weight: bold; color: #0F172A;">${booking.details.address}</td>
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
        <p style="margin: 5px 0; font-size: 14px;"><strong>Address:</strong> ${booking.details.address}</p>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7;">
          <a href="https://cleaniqservices.com/admin/bookings" style="display: inline-block; background-color: #0F172A; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px;">Manage in Dashboard</a>
        </div>
      </div>
    </div>
  `,
};

module.exports = { sendEmail, templates };
