const { Resend } = require('resend');

// Safety: Initialize Resend only if key exists, otherwise use a dummy
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!resend) {
      console.error('❌ EMAIL ERROR: RESEND_API_KEY is missing in .env');
      return false;
    }

    console.log(`📧 Resend: Attempting to send email to: ${to}...`);
    const { data, error } = await resend.emails.send({
      from: 'Cleaniq Services <info@cleaniqservices.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ RESEND ERROR:', error);
      return false;
    }

    console.log('✅ Email sent successfully! ID:', data.id);
    return true;
  } catch (error) {
    console.error('❌ CRITICAL EMAIL ERROR:', error);
    return false;
  }
};

// Templates
const templates = {
  bookingConfirmation: (booking) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <img src="https://cleaniqservices.com/preview.jpg" alt="CleanIQ Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 28px; letter-spacing: -1px;">Booking Confirmed!</h1>
        <p style="color: #94a3b8; margin-top: 10px; font-weight: 500;">Thank you for choosing Cleaniq Services</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0; color: #0F172A;">Hi ${booking.customer.firstName},</h2>
        <p>Your cleaning appointment is officially confirmed. Here are your booking details:</p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 20px; margin: 24px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Booking Reference</p>
          <p style="margin: 0 0 20px 0; font-size: 20px; font-weight: 900; color: #0F172A;">${booking.bookingId}</p>
          
          <div style="display: grid; gap: 12px;">
            <div style="padding: 12px; background: white; border-radius: 12px; border: 1px solid #edf2f7;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: bold;">SERVICE</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #0F172A;">${booking.service}</p>
            </div>
            <div style="padding: 12px; background: white; border-radius: 12px; border: 1px solid #edf2f7;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: bold;">DATE & TIME</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #0F172A;">${new Date(booking.schedule.date).toDateString()} @ ${booking.schedule.timeSlot} ${booking.schedule.preferredTime ? '(' + booking.schedule.preferredTime + ')' : ''}</p>
            </div>
            <div style="padding: 12px; background: white; border-radius: 12px; border: 1px solid #edf2f7;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: bold;">LOCATION</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #0F172A;">${booking.details.address}</p>
            </div>
          </div>
        </div>

        <h3 style="font-size: 16px; color: #0F172A; margin-bottom: 12px;">Work Summary</h3>
        <ul style="padding-left: 20px; margin: 0; font-size: 14px; color: #475569;">
          <li><strong>Frequency:</strong> ${booking.details.frequency}</li>
          <li><strong>Duration:</strong> ${booking.details.duration} Hours</li>
          ${booking.details.extras.map(extra => `<li style="margin-top: 4px;">${extra}</li>`).join('')}
        </ul>

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: bold;">TOTAL PAID</p>
            <p style="margin: 0; font-size: 24px; font-weight: 900; color: #0F172A;">${booking.payment.currency === 'GBP' ? '£' : '₦'}${booking.payment.amount}</p>
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
        <img src="https://cleaniqservices.com/preview.jpg" alt="CleanIQ Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
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
        <img src="https://cleaniqservices.com/preview.jpg" alt="CleanIQ Logo" style="width: 100px; height: auto; margin-bottom: 10px; border-radius: 8px;" />
        <h1 style="color: #6EE7B7; margin: 0; font-size: 24px;">New Worker Application 👷‍♂️</h1>
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
        <img src="https://cleaniqservices.com/preview.jpg" alt="CleanIQ Logo" style="width: 100px; height: auto; margin-bottom: 10px; border-radius: 8px;" />
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
            <p style="margin: 0; font-size: 16px; font-weight: 800; color: #0F172A;">${booking.payment.currency === 'GBP' ? '£' : '₦'}${booking.payment.amount}</p>
          </div>
        </div>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Customer Info</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${booking.customer.email}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> ${booking.customer.phone}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Address:</strong> ${booking.details.address}</p>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Service Details</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Service:</strong> ${booking.service}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(booking.schedule.date).toDateString()}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${booking.schedule.timeSlot} (${booking.schedule.preferredTime || 'No preference'})</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Frequency:</strong> ${booking.details.frequency}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Duration:</strong> ${booking.details.duration} Hours</p>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Requirements & Extras</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          ${booking.details.extras.map(e => `<li style="margin-bottom: 5px;">${e}</li>`).join('')}
        </ul>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7;">
          <a href="https://cleaniqservices.com/admin/bookings" style="display: inline-block; background-color: #0F172A; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px;">Manage in Dashboard</a>
        </div>
      </div>
    </div>
  `
};

module.exports = { sendEmail, templates };
