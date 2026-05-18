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
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ RESEND ERROR DETAILS:', JSON.stringify(error, null, 2));
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
        <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Logo" style="width: 120px; height: auto; margin-bottom: 20px; border-radius: 12px;" />
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
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: bold;">SERVICE ADDRESS</p>
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
            <p style="margin: 0; font-size: 16px; font-weight: 800; color: #0F172A;">${booking.payment.currency === 'GBP' ? '£' : '₦'}${booking.payment.amount}</p>
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
        <p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${booking.schedule.timeSlot} (${booking.schedule.preferredTime || 'No preference'})</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Frequency:</strong> ${booking.details.frequency}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Duration:</strong> ${booking.details.duration} Hours</p>

        <h3 style="font-size: 14px; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #6EE7B7; padding-left: 10px;">Requirements & Property Details</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          ${booking.details.extras.map(e => `<li style="margin-bottom: 5px;">${e}</li>`).join('')}
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
          <p style="margin: 5px 0; font-size: 13px;"><strong>Booking Reference:</strong> ${booking.bookingId}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Service:</strong> ${booking.service}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Customer Name:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Customer Phone:</strong> ${booking.customer.phone}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Address:</strong> ${booking.details.address}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Scheduled Time:</strong> ${booking.schedule.timeSlot} (${booking.schedule.preferredTime || 'No preference'})</p>
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
        <h1 style="color: #6EE7B7; margin: 0; font-size: 24px;">New Job Alert! 🧹✨</h1>
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
          <p style="margin: 5px 0; font-size: 14px;"><strong>Location / Area:</strong> ${booking.details.address.split(',').slice(-2).join(', ').trim() || 'Local Region'}</p>
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
        <p>Staff member <strong>${staff.firstName} ${staff.lastName}</strong> (${staff.workerId || 'Staff'}) has sent you a new support chat message:</p>
        
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
        <p>You have received a new support chat message from the Cleaniq Admin team (<strong>${senderName || 'Admin Office'}</strong>):</p>
        
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
  `
};

module.exports = { sendEmail, templates };
