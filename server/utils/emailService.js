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
      from: 'CleanIQ Services <onboarding@resend.dev>',
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
  bookingConfirmation: (customerName, bookingId, date, time, amount, currency) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <h1 style="color: #6EE7B7; margin: 0; font-size: 24px;">CleanIQ Services</h1>
        <p style="color: white; margin-top: 10px; font-weight: bold;">Booking Confirmed!</p>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0;">Hi ${customerName},</h2>
        <p>Thank you for choosing CleanIQ. Your cleaning appointment is officially confirmed.</p>
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0;">
          <p style="margin: 0; font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Booking Reference</p>
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0F172A;">${bookingId}</p>
          <div style="margin-top: 16px;">
            <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Time:</strong> ${time}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Amount Paid:</strong> ${currency === 'GBP' ? '£' : '₦'}${amount}</p>
          </div>
        </div>
        <p>Our professional cleaning team will arrive at your location on the scheduled date.</p>
        <a href="https://cleaniqservices.com" style="display: inline-block; background-color: #6EE7B7; color: #0F172A; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">Visit Our Website</a>
      </div>
    </div>
  `,
  
  applicantReceived: (applicantName, role) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden;">
      <div style="background-color: #0F172A; padding: 40px; text-align: center;">
        <h1 style="color: #6EE7B7; margin: 0; font-size: 24px;">CleanIQ Recruitment</h1>
      </div>
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; margin-top: 0;">Hello ${applicantName},</h2>
        <p>We've received your application for the <strong>${role}</strong> position at CleanIQ Services.</p>
      </div>
    </div>
  `,

  hiredAlert: (applicantName) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; border-top: 8px solid #6EE7B7;">
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 24px; margin-top: 0; color: #0F172A;">Congratulations ${applicantName}! 🎉</h2>
        <p>We are thrilled to inform you that you have been <strong>HIRED</strong> to join the CleanIQ Services team.</p>
      </div>
    </div>
  `
};

module.exports = { sendEmail, templates };
