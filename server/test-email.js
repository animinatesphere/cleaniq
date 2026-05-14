const { Resend } = require('resend');
const { templates } = require('./utils/emailService');
require('dotenv').config({ path: '../.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testNewUI() {
  console.log('🚀 Testing New Premium Email UI...');
  
  const mockBooking = {
    bookingId: 'BK-TEST-9999',
    customer: { firstName: 'John', lastName: 'Doe', email: 'info@cleaniqservices.com', phone: '+234 800 000 0000' },
    service: 'Deep Residential Cleaning',
    details: { 
      address: '123 Luxury Estate, Victoria Island, Lagos', 
      frequency: 'One-time', 
      duration: '4', 
      extras: [
        'Inside Fridge (x1)',
        'Inside Oven (x1)',
        'DATA_ROOMS: 3 Bed, 2 Bath, 1 Kit',
        'DATA_PARKING: Free on-site',
        'DATA_ACCESS: Key under mat',
        'DATA_NOTES: Please pay extra attention to the master bedroom.'
      ] 
    },
    schedule: { date: new Date().toISOString(), timeSlot: 'Morning', preferredTime: '09:00 AM' },
    payment: { amount: '25000', currency: 'NGN' }
  };

  try {
    const { data, error } = await resend.emails.send({
      from: 'CleanIQ Services <info@cleaniqservices.com>',
      to: 'info@cleaniqservices.com',
      subject: 'New Premium UI Test',
      html: templates.bookingConfirmation(mockBooking)
    });

    if (error) console.error('❌ ERROR:', error);
    else console.log('✅ SUCCESS! Check your inbox for the new design. ID:', data.id);
  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err.message);
  }
}

testNewUI();
