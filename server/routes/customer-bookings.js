const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Lead = require('../models/Lead');
const Worker = require('../models/Worker');
const { workerRateFor } = require('../utils/workerRate');
const { verifyCustomer } = require('./customer-auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sms = require('../utils/smsService');
const { sendEmail, templates } = require('../utils/emailService');
const { sendCapiEvent } = require('../utils/metaCapi');;
const { scheduleTask } = require('../utils/automationEngine');
const { buildBookingDateTime } = require('../utils/bookingDateTime');
const subscriptions = require('../utils/subscriptions');

// POST /api/customer-bookings — public endpoint for customer self-service booking creation.
// The Stripe PaymentIntent is already authorized client-side before this is called,
// so no admin auth is needed here — the card hold is the proof of intent.
router.post('/', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    booking.set('details', req.body.details);
    booking.set('property', req.body.property);
    booking.set('meta', req.body.meta);

    if (booking.workerRate == null) booking.workerRate = await workerRateFor(booking.service);

    // Regular clean (Wecasa-style subscription): first visit paid now, card saved, later visits
    // charged 24 hours before each clean. The client can't mark it paid; Stripe is checked below.
    const wantsSubscription =
      req.body.subscribe === true && subscriptions.isSubscriptionFrequency(req.body.details?.frequency);
    const paidOnWebsite = wantsSubscription && Boolean(req.body.payment?.stripePaymentIntentId);
    if (paidOnWebsite) booking.payment.status = 'Processing';

    // One-off set-up fee on the first clean of a regular clean (admin → Regular Cleans). The
    // website adds it to the card payment it has just taken; for the app (pay by link) the
    // server adds it here, so older app versions are charged it too.
    if (wantsSubscription) {
      const fee = await subscriptions.getSetupFee();
      const feeAmount = subscriptions.setupFeeFor(fee, booking.details?.duration);
      if (feeAmount > 0) {
        const included = Math.abs(Number(req.body.subscription?.setupFee) - feeAmount) < 0.01;
        if (!paidOnWebsite && !included) {
          booking.payment.amount = Math.round((Number(booking.payment.amount || 0) + feeAmount) * 100) / 100;
        }
        if (!paidOnWebsite || included) {
          booking.meta = { ...(booking.meta || {}), setupFee: feeAmount, setupFeeLabel: fee.label };
          booking.markModified('meta');
        }
      }
    }

    const newBooking = await booking.save();
    let subscription = null;
    let checkoutUrl = '';

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
    if (wantsSubscription) {
      try {
        subscription = await subscriptions.createSubscription(newBooking, {
          visitPrice: req.body.subscription?.visitPrice,
          source: paidOnWebsite ? 'Website' : 'App',
          bookAhead: !paidOnWebsite,
        });
        if (paidOnWebsite) {
          await subscriptions.activateSubscription(subscription, req.body.payment.stripePaymentIntentId);
          newBooking.payment.status = 'Completed';
        }
      } catch (subErr) {
        console.error(`❌ Regular clean setup failed for ${newBooking.bookingId}:`, subErr.message);
        sendEmail({
          to: process.env.EMAIL_USER || 'admin@cleaniqservices.com',
          subject: `⚠️ Regular clean setup needs checking – ${newBooking.bookingId}`,
          html: `<p>Booking ${newBooking.bookingId} (${newBooking.customer?.email}) asked for a ${recurFreq} regular clean but setup failed: ${subErr.message}</p><p>Check the payment in Stripe before the next visit.</p>`,
        }).catch(() => {});
      }
    } else if (recurFreq && recurFreq !== 'Once') {
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
              // Unpaid visits stay Pending (not shown to cleaners) unless no payment is needed.
              status: baseData.noPaymentRequired ? 'Confirmed' : 'Pending',
              skipConfirmationEmail: true,
              noPaymentRequired: Boolean(baseData.noPaymentRequired),
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

    if (isInvoicePending && subscription) {
      // App regular clean: pay the first visit now (not a hold) and save the card for later visits
      try {
        checkoutUrl = await subscriptions.sendFirstPaymentLink(newBooking, subscription);
      } catch (payErr) {
        console.error('❌ Failed to create regular clean payment link:', payErr.message);
      }
    } else if (isInvoicePending) {
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
          success_url: `${process.env.FRONTEND_URL || 'https://cleaniqservices.com'}/payment/success?bookingId=${newBooking._id}`,
          cancel_url: `${process.env.FRONTEND_URL || 'https://cleaniqservices.com'}/`,
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
          time: bookingDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }),
          bookingDateTime: bookingDate.toISOString(),
          amount: newBooking.payment?.amount,
        };
        const ms24h    = 24 * 60 * 60 * 1000;
        const ms3h     =  3 * 60 * 60 * 1000;
        const MIN_LEAD = 15 * 60 * 1000;
        const now      = Date.now();
        const t24h     = bookingDate.getTime() - ms24h;
        const t3h      = bookingDate.getTime() - ms3h;
        if (t24h > now + MIN_LEAD) {
          await scheduleTask('booking_reminder_24h', new Date(t24h), payload);
        }
        if (t3h > now + MIN_LEAD) {
          await scheduleTask('booking_reminder_3h', new Date(t3h), payload);
        }
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

    const out = newBooking.toObject();
    if (subscription) {
      out.subscription = {
        subscriptionRef: subscription.subscriptionRef,
        status: subscription.status,
        frequency: subscription.frequency,
        pricePerVisit: subscription.pricePerVisit,
      };
    }
    if (checkoutUrl) out.checkoutUrl = checkoutUrl;
    res.status(201).json(out);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/customer-bookings  — fetch all bookings for the logged-in customer (by email)
router.get('/', verifyCustomer, async (req, res) => {
  try {
    // Shifts of a split job are internal; the customer sees the one main booking.
    const bookings = await Booking.find({ 'customer.email': req.customer.email, isShift: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer-bookings/:id/cancel-preview — what cancelling would refund (regular-clean visits
// are charged 24h ahead, so a late cancellation keeps a fee from the refund).
router.get('/:id/cancel-preview', verifyCustomer, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if ((booking.customer?.email || '').toLowerCase() !== req.customer.email.toLowerCase()) {
      return res.status(403).json({ message: 'You can only cancel your own bookings.' });
    }
    if (!booking.meta?.subscriptionId) return res.json({ regular: false });
    const q = require('../utils/subscriptions').visitCancellationQuote(booking);
    res.json({ regular: true, paid: q.paid, fee: q.fee, refund: q.refund, rule: q.rule });
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

    // Customers can cancel until the cleaner is on the way (Pending, Confirmed or Assigned)
    if (!['Confirmed', 'Pending', 'Assigned'].includes(booking.status)) {
      return res.status(400).json({ message: `Booking cannot be cancelled (current status: ${booking.status}).` });
    }

    // A visit of a regular clean: refunded under the late-notice rule (see utils/subscriptions.js).
    let visitResult = null;
    if (booking.meta?.subscriptionId) {
      visitResult = await require('../utils/subscriptions').cancelVisitByCustomer(booking);
    }

    // Trigger Stripe Refund if payment transaction exists
    if (!visitResult && booking.payment && booking.payment.transactionId && !booking.payment.transactionId.startsWith('tok_bypass')) {
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

    if (visitResult) booking.set(await Booking.findById(booking._id).lean()); // keep refund/payment updates
    booking.status = 'Cancelled';
    if (booking.payment) booking.payment.chargeOnArrival = false; // regular-clean visit: never charge it
    await booking.save();

    // SMS: booking cancelled (fire-and-forget)
    setImmediate(() => sms.triggerBookingCancelled(booking).catch(e => console.error("SMS cancel trigger error:", e.message)));

    // The cleaner who had this job is told straight away.
    if (booking.assignedWorker) {
      const msg = `${booking.service} on ${booking.schedule?.date ? new Date(booking.schedule.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'its date'} (${booking.bookingId}) was cancelled by the customer.`;
      require('../models/Notification').create({ workerId: booking.assignedWorker, title: 'Job cancelled', message: msg, type: 'job', bookingId: booking.bookingId }).catch(() => {});
      require('../utils/pushNotifications').sendPushToUser('worker', booking.assignedWorker, 'Job cancelled', msg, { type: 'job_cancelled', bookingId: booking.bookingId }).catch(() => {});
    }

    if (visitResult) {
      const money = (n) => `£${Number(n).toFixed(2)}`;
      const message = !visitResult.paid
        ? 'This clean has been cancelled. You have not been charged.'
        : visitResult.fee
          ? `This clean has been cancelled. ${money(visitResult.refund)} will be refunded to your card (${money(visitResult.fee)} kept for ${visitResult.rule}).`
          : `This clean has been cancelled and ${money(visitResult.refund)} will be refunded to your card.`;
      return res.json({ message, booking, refund: visitResult.refund, fee: visitResult.fee });
    }
    res.json({ message: 'Booking cancelled successfully and payment refunded.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-bookings/:id/rate — the customer rates their cleaner (1–5 stars) after the clean.
// They can change their rating later; the cleaner's average updates straight away.
router.post('/:id/rate', verifyCustomer, async (req, res) => {
  try {
    const stars = Math.round(Number(req.body.stars));
    if (!(stars >= 1 && stars <= 5)) return res.status(400).json({ message: 'Please choose 1 to 5 stars.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if ((booking.customer.email || '').toLowerCase() !== String(req.customer.email || '').toLowerCase()) {
      return res.status(403).json({ message: 'You can only rate your own bookings.' });
    }
    if (!['Completed', 'Completed - Unpaid'].includes(booking.status) || !booking.assignedWorker) {
      return res.status(400).json({ message: 'You can rate your cleaner once the clean is finished.' });
    }
    const first = !booking.cleanerRating?.stars;
    booking.cleanerRating = { stars, comment: String(req.body.comment || '').trim().slice(0, 500), ratedAt: new Date() };
    await booking.save();

    // Keep the cleaner's stored rating in step (admin pages and older app versions read it).
    const { workerStats } = require('../utils/workerStats');
    const stats = await workerStats(booking.assignedWorker);
    if (stats?.rating != null) await Worker.updateOne({ _id: booking.assignedWorker }, { rating: stats.rating });

    if (first) {
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          workerId: booking.assignedWorker,
          title: `${'★'.repeat(stars)} from ${booking.customer.firstName || 'your customer'}`,
          message: `${booking.service} on ${booking.schedule?.date ? new Date(booking.schedule.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'your recent clean'}${booking.cleanerRating.comment ? `: "${booking.cleanerRating.comment}"` : ''}`,
          type: 'success',
          bookingId: booking.bookingId,
        });
        const { sendPushToUser } = require('../utils/pushNotifications');
        sendPushToUser('worker', booking.assignedWorker, `${'★'.repeat(stars)} from ${booking.customer.firstName || 'your customer'}`,
          `${booking.service}${booking.cleanerRating.comment ? `: "${booking.cleanerRating.comment}"` : ''}`, { type: 'rating', bookingId: booking.bookingId }).catch(() => {});
      } catch {}
    }
    res.json({ cleanerRating: booking.cleanerRating, workerRating: stats?.rating ?? null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/customer-bookings/:id/reschedule — customer reschedules date/time
router.put('/:id/reschedule', verifyCustomer, async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    if (!date || !timeSlot) return res.status(400).json({ message: 'Date and time are required.' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if ((booking.customer.email || '').toLowerCase() !== req.customer.email.toLowerCase()) {
      return res.status(403).json({ message: 'You can only reschedule your own bookings.' });
    }

    if (!['Confirmed', 'Pending'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot reschedule a booking with status: ${booking.status}.` });
    }

    booking.schedule.date = new Date(date);
    booking.schedule.timeSlot = timeSlot;
    booking.schedule.preferredTime = timeSlot;
    await booking.save();
    await require('../utils/automationEngine').rescheduleBookingReminders(booking).catch((e) => console.error('Reminder reschedule error:', e.message));

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Notify admin
    setImmediate(() => sendEmail({
      to: process.env.EMAIL_USER || 'info@cleaniqservices.com',
      subject: `📅 Booking Rescheduled — ${booking.bookingId}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#0F6B4C">Booking Rescheduled</h2>
        <p>A customer has rescheduled their booking.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;color:#666">Booking ID</td><td style="padding:8px;font-weight:bold">${booking.bookingId}</td></tr>
          <tr><td style="padding:8px;color:#666">Customer</td><td style="padding:8px;font-weight:bold">${booking.customer?.firstName} ${booking.customer?.lastName}</td></tr>
          <tr><td style="padding:8px;color:#666">Service</td><td style="padding:8px;font-weight:bold">${booking.service}</td></tr>
          <tr><td style="padding:8px;color:#666">New Date</td><td style="padding:8px;font-weight:bold">${fmtDate(date)}</td></tr>
          <tr><td style="padding:8px;color:#666">New Time</td><td style="padding:8px;font-weight:bold">${timeSlot}</td></tr>
        </table>
      </div>`,
    }).catch(() => {}));

    // Confirm to customer
    setImmediate(() => sendEmail({
      to: booking.customer?.email,
      subject: `Your booking has been rescheduled — ${booking.bookingId}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#0F6B4C">Booking Rescheduled ✓</h2>
        <p>Hi ${booking.customer?.firstName}, your booking has been rescheduled.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;color:#666">Service</td><td style="padding:8px;font-weight:bold">${booking.service}</td></tr>
          <tr><td style="padding:8px;color:#666">New Date</td><td style="padding:8px;font-weight:bold">${fmtDate(date)}</td></tr>
          <tr><td style="padding:8px;color:#666">New Time</td><td style="padding:8px;font-weight:bold">${timeSlot}</td></tr>
        </table>
        <p style="color:#666;font-size:13px">If you have any questions, please contact us at info@cleaniqservices.com</p>
      </div>`,
    }).catch(() => {}));

    res.json({ message: 'Booking rescheduled successfully.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
