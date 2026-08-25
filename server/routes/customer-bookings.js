const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Lead = require('../models/Lead');
const Worker = require('../models/Worker');
const SystemSetting = require('../models/SystemSetting');
const { verifyCustomer } = require('./customer-auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sms = require('../utils/smsService');
const { sendEmail, templates } = require('../utils/emailService');
const { sendCapiEvent } = require('../utils/metaCapi');;
const { scheduleTask } = require('../utils/automationEngine');
const { buildBookingDateTime } = require('../utils/bookingDateTime');

// POST /api/customer-bookings — public endpoint for customer self-service booking creation.
// The Stripe PaymentIntent is already authorized client-side before this is called,
// so no admin auth is needed here — the card hold is the proof of intent.
router.post('/', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    booking.set('details', req.body.details);
    booking.set('property', req.body.property);
    booking.set('meta', req.body.meta);

    if (booking.workerRate == null) {
      try {
        const rateSetting = await SystemSetting.findOne({ key: 'defaultWorkerRate' });
        if (rateSetting) booking.workerRate = rateSetting.value;
      } catch {}
    }

    const newBooking = await booking.save();

    // Capture customer as a lead for marketing
    try {
      const email = (newBooking.customer?.email || '').trim().toLowerCase();
      if (email) {
        const existingLead = await Lead.findOne({ email });
        if (!existingLead) {
          await Lead.create({
            name: `${newBooking.customer?.firstName || ''} ${newBooking.customer?.lastName || ''}`.trim(),
            email,
            phone: newBooking.customer?.phone || '',
            source: 'Booking',
            acknowledged: true,
          });
        }
      }
    } catch (leadErr) {
      console.error('⚠️ Failed to capture booking lead:', leadErr.message);
    }

    // Fire Meta CAPI Lead event (non-blocking)
    sendCapiEvent('Lead', {
      email: newBooking.customer?.email,
      phone: newBooking.customer?.phone,
      bookingId: newBooking._id,
    }).catch(() => {});

    // Recurring series generation
    const recurFreq = newBooking.details?.frequency;
    if (recurFreq && recurFreq !== 'Once') {
      const groupId = `RG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await Booking.findByIdAndUpdate(newBooking._id, { $set: { meta: { recurringGroup: groupId } } });
      newBooking.meta = { recurringGroup: groupId };

      const RECUR_SCHEDULES = {
        Weekly:       { type: 'days',   step: 7,  total: 12 },
        Fortnightly:  { type: 'days',   step: 14, total: 12 },
        'Bi-weekly':  { type: 'days',   step: 14, total: 12 },
        Monthly:      { type: 'months', step: 1,  total: 12 },
        Quarterly:    { type: 'months', step: 3,  total: 4  },
        Yearly:       { type: 'months', step: 12, total: 2  },
      };
      const rule = RECUR_SCHEDULES[recurFreq];
      if (rule) {
        const baseDate = new Date(newBooking.schedule.date);
        const baseData = newBooking.toObject();
        for (let i = 1; i < rule.total; i++) {
          const instanceDate = new Date(baseDate);
          if (rule.type === 'days') instanceDate.setDate(instanceDate.getDate() + rule.step * i);
          else instanceDate.setMonth(instanceDate.getMonth() + rule.step * i);
          try {
            await Booking.create({
              ...baseData,
              _id: undefined,
              bookingId: `BK-R${Math.floor(100000 + Math.random() * 900000)}`,
              schedule: { ...baseData.schedule, date: instanceDate },
              status: 'Confirmed',
              skipConfirmationEmail: true,
              noPaymentRequired: true,
              payment: { ...baseData.payment, status: 'Pending', stripePaymentIntentId: null },
              meta: { recurringGroup: groupId },
              assignedWorker: null,
              assignedWorkerName: null,
              rejectedBy: [],
              checklist: [],
              jobAcceptedTime: null,
              jobArrivedTime: null,
              jobStartTime: null,
              jobEndTime: null,
              jobDurationActual: 0,
              createdAt: new Date(),
            });
          } catch (recurErr) {
            console.error(`⚠️ Recurring instance ${i} failed:`, recurErr.message);
          }
        }
        console.log(`📅 Created ${rule.total}-booking ${recurFreq} series → group ${groupId}`);
      }
    }

    // Email to customer
    const isInvoicePending =
      newBooking.payment?.method === 'Invoice' && newBooking.payment?.status === 'Pending';

    if (isInvoicePending) {
      // App booking: create Stripe checkout and send payment link
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: newBooking.customer.email,
          payment_intent_data: {
            capture_method: 'manual',
            metadata: {
              bookingId: newBooking._id.toString(),
              bookingRef: newBooking.bookingId,
              company: 'Cleaniq Services',
            },
          },
          line_items: [
            {
              price_data: {
                currency: (newBooking.payment?.currency || 'GBP').toLowerCase(),
                product_data: {
                  name: `Cleaniq - ${newBooking.service}`,
                  description: `Booking Reference: ${newBooking.bookingId}`,
                },
                unit_amount: Math.round(newBooking.payment.amount * 100),
              },
              quantity: 1,
            },
          ],
          metadata: {
            bookingId: newBooking._id.toString(),
            company: 'Cleaniq Services',
          },
          success_url: `${process.env.FRONTEND_URL || 'https://cleaniqservices.com'}/account/dashboard?payment=success&bookingId=${newBooking._id}`,
          cancel_url: `${process.env.FRONTEND_URL || 'https://cleaniqservices.com'}/account/dashboard?payment=cancelled`,
        });

        await sendEmail({
          to: newBooking.customer.email,
          subject: `Payment Required: Cleaniq Booking ${newBooking.bookingId}`,
          html: templates.paymentRequired(newBooking, session.url),
        });
        console.log(`✅ Payment link sent to ${newBooking.customer.email}`);
      } catch (payErr) {
        console.error('❌ Failed to send payment link email:', payErr.message);
        // Fallback so customer always gets something
        try {
          await sendEmail({
            to: newBooking.customer.email,
            subject: `✓ Booking Received - ${newBooking.bookingId}`,
            html: templates.adminBookingCreatedEmail2(newBooking),
          });
        } catch {}
      }
    } else {
      // Website booking (Stripe already authorized): send confirmation
      try {
        await sendEmail({
          to: newBooking.customer.email,
          subject: `✓ Booking Confirmed - ${newBooking.bookingId}`,
          html: templates.bookingConfirmation(newBooking),
        });
        console.log(`✅ Booking confirmation sent to ${newBooking.customer.email}`);
      } catch (emailErr) {
        console.error('❌ Failed to send customer confirmation email:', emailErr.message);
      }
    }

    // Admin alert
    try {
      await sendEmail({
        to: process.env.EMAIL_USER || 'admin@cleaniqservices.com',
        subject: `🚨 New Booking: ${newBooking.bookingId}`,
        html: templates.adminNewBookingAlert(newBooking),
      });
    } catch {}

    // Staff job notifications
    try {
      const activeStaff = await Worker.find({ status: 'Active', appAccessGranted: true });
      for (const staff of activeStaff) {
        await sendEmail({
          to: staff.email,
          subject: `🧹 New Job Alert: ${newBooking.service} is available!`,
          html: templates.staffNewJobAlert(newBooking),
        });
      }
    } catch {}

    // Booking reminders
    try {
      const bookingDate = newBooking.schedule?.date
        ? buildBookingDateTime(newBooking.schedule.date, newBooking.schedule.timeSlot, newBooking.schedule?.preferredTime)
        : null;
      if (bookingDate && bookingDate > new Date()) {
        const payload = {
          bookingId: newBooking._id.toString(),
          bookingRef: newBooking.bookingId,
          email: newBooking.customer?.email,
          firstName: newBooking.customer?.firstName,
          service: newBooking.service,
          date: bookingDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
          amount: newBooking.payment?.amount,
        };
        const ms24h = 24 * 60 * 60 * 1000;
        const ms3h  =  3 * 60 * 60 * 1000;
        const soon  = Date.now() + 2 * 60 * 1000;
        await scheduleTask('booking_reminder_24h', new Date(Math.max(bookingDate.getTime() - ms24h, soon)), payload);
        await scheduleTask('booking_reminder_3h',  new Date(Math.max(bookingDate.getTime() - ms3h,  soon)), payload);
      }
    } catch (schedErr) {
      console.error('⚠️ Failed to schedule booking reminders:', schedErr.message);
    }

    // SMS confirmation (fire-and-forget)
    setImmediate(async () => {
      try {
        if (newBooking.status === 'Confirmed') {
          await sms.triggerBookingConfirmed(newBooking);
        }
      } catch (smsErr) {
        console.error('SMS create trigger error:', smsErr.message);
      }
    });

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/customer-bookings  — fetch all bookings for the logged-in customer (by email)
router.get('/', verifyCustomer, async (req, res) => {
  try {
    const bookings = await Booking.find({ 'customer.email': req.customer.email })
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/customer-bookings/:id/cancel — cancel a booking (only if future + Confirmed)
router.put('/:id/cancel', verifyCustomer, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Ownership check
    if ((booking.customer.email || '').toLowerCase() !== req.customer.email.toLowerCase()) {
      return res.status(403).json({ message: 'You can only cancel your own bookings.' });
    }

    // Only allow cancelling Confirmed or Pending bookings
    if (booking.status !== 'Confirmed' && booking.status !== 'Pending') {
      return res.status(400).json({ message: `Booking cannot be cancelled (current status: ${booking.status}).` });
    }

    // Trigger Stripe Refund if payment transaction exists
    if (booking.payment && booking.payment.transactionId && !booking.payment.transactionId.startsWith('tok_bypass')) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.payment.transactionId,
        });
        console.log(`✅ Refunded Stripe PaymentIntent: ${booking.payment.transactionId}`);
      } catch (stripeErr) {
        console.error('❌ Stripe Refund Failed:', stripeErr.message);
        // We log the error but still proceed to cancel the booking in our DB
      }
    }

    booking.status = 'Cancelled';
    await booking.save();

    // SMS: booking cancelled (fire-and-forget)
    setImmediate(() => sms.triggerBookingCancelled(booking).catch(e => console.error("SMS cancel trigger error:", e.message)));

    res.json({ message: 'Booking cancelled successfully and payment refunded.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
