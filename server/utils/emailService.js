const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.office365.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log(`📧 Attempting to send email to: ${to}...`);
    const info = await transporter.sendMail({
      from: `"CleanIQ Services" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('✅ Email sent successfully! MessageID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ EMAIL ERROR DETAILS:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return false;
  }
};

// Email Templates
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
        <p>Our professional cleaning team will arrive at your location on the scheduled date. If you need to make any changes, please contact us.</p>
        <a href="https://cleaniqservices.com" style="display: inline-block; background-color: #6EE7B7; color: #0F172A; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">Visit Our Website</a>
      </div>
      <div style="background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b;">
        <p>&copy; 2024 CleanIQ Services. All rights reserved.</p>
        <p>UK & Nigeria Premium Cleaning Services</p>
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
        <p>Our team is currently reviewing your profile and documents. If your experience matches our requirements, we will contact you for an interview.</p>
        <p>Thank you for your interest in joining our team!</p>
      </div>
    </div>
  `,

  hiredAlert: (applicantName) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; border-top: 8px solid #6EE7B7;">
      <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 24px; margin-top: 0; color: #0F172A;">Congratulations ${applicantName}! 🎉</h2>
        <p>We are thrilled to inform you that you have been <strong>HIRED</strong> to join the CleanIQ Services team.</p>
        <p>You have demonstrated the professionalism and dedication we look for in our service providers. We will be in touch shortly with your onboarding details and next steps.</p>
        <p>Welcome to the family!</p>
      </div>
    </div>
  `
};

module.exports = { sendEmail, templates };
