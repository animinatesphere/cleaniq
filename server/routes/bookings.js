const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const SystemSetting = require("../models/SystemSetting");
const Lead = require("../models/Lead");
const { sendEmail, templates } = require("../utils/emailService");
const { moveToTrash } = require("../utils/trash");
const { scheduleTask } = require("../utils/automationEngine");

// GET all bookings (Admin)
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate(
        "assignedWorker",
        "firstName lastName email phone region workerId",
      )
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single booking by its human-readable reference (e.g. BK-1234) —
// used by the Invoice Builder's "Load Booking" lookup.
router.get("/by-ref/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOne({
      bookingId: new RegExp(`^${req.params.bookingId}$`, "i"),
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE ALL bookings (Admin) - IMPORTANT: Must be above /:id
router.delete("/all/delete", async (req, res) => {
  try {
    console.log("☢️ CLEARING ALL BOOKINGS...");
    const all = await Booking.find({});
    for (const booking of all) {
      await moveToTrash(
        "Booking",
        booking,
        `${booking.bookingId} — ${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim(),
      );
    }
    await Booking.deleteMany({});
    res.json({ message: "All bookings cleared successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET availability for a specific date and service
// Returns booked time slots and hours for a given date
router.get("/availability/:date/:serviceType", async (req, res) => {
  try {
    const { date, serviceType } = req.params;

    // Parse the date (YYYY-MM-DD format)
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Get start and end of the selected day
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Find all confirmed/pending bookings for this date
    const bookingsOnDate = await Booking.find({
      "schedule.date": {
        $gte: dayStart,
        $lte: dayEnd,
      },
      status: { $in: ["Confirmed", "Pending", "Accepted", "In Progress"] },
    });

    // Extract booked time slots and hours
    const bookedSlots = [];
    const bookedHours = new Set();

    for (const booking of bookingsOnDate) {
      // If has time slot (flexible services)
      if (booking.schedule?.timeSlot) {
        bookedSlots.push(booking.schedule.timeSlot);
      }

      // If has duration (hourly services) - mark those hours as partial/booked
      if (booking.details?.duration) {
        // Store duration for reference
        bookedHours.add(booking.details.duration);
      }
    }

    res.json({
      date: date,
      bookedSlots: [...new Set(bookedSlots)], // Remove duplicates
      bookedHours: Array.from(bookedHours),
      totalBookingsOnDate: bookingsOnDate.length,
      availableHours: [2, 3, 4, 5, 6, 7].filter((h) => !bookedHours.has(h)),
    });
  } catch (err) {
    console.error("Availability check error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST a new booking
// POST a new booking
router.post("/", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    // If postcode is provided separately and not already in address, append it
    if (req.body.details?.postcode && req.body.details?.address) {
      const postcode = (req.body.details.postcode || '').trim();
      const address = (req.body.details.address || '').trim();
      if (postcode && !address.toLowerCase().includes(postcode.toLowerCase())) {
        req.body.details.address = `${address}, ${postcode}`;
      }
    }
    // Explicitly set Mixed fields to bypass potential strict schema stripping
    booking.set("details", req.body.details);
    booking.set("property", req.body.property);
    booking.set("meta", req.body.meta);

    // Apply global default workerRate if not provided
    if (booking.workerRate == null) {
      try {
        const rateSetting = await SystemSetting.findOne({
          key: "defaultWorkerRate",
        });
        if (rateSetting) {
          booking.workerRate = rateSetting.value;
        }
      } catch (settingsErr) {
        console.warn(
          "⚠️ Could not load default worker settings:",
          settingsErr.message,
        );
      }
    }

    const newBooking = await booking.save();

    // Capture the customer as a lead (name/email/phone) so they're
    // available for future email marketing campaigns.
    try {
      const email = (newBooking.customer?.email || "").trim().toLowerCase();
      if (email) {
        const existingLead = await Lead.findOne({ email });
        if (!existingLead) {
          await Lead.create({
            name: `${newBooking.customer?.firstName || ""} ${newBooking.customer?.lastName || ""}`.trim(),
            email,
            phone: newBooking.customer?.phone || "",
            source: "Booking",
            acknowledged: true,
          });
        }
      }
    } catch (leadErr) {
      console.error("⚠️ Failed to capture booking lead:", leadErr.message);
    }

    // ✅ Skip all emails for DEV MODE bookings (testing only)
    const isDevMode =
      newBooking.payment && newBooking.payment.method === "Dev Mode";

    // Check if payment was already completed via Stripe (not pending payment)
    const isPaymentCompleted =
      newBooking.payment &&
      (newBooking.payment.status === "Completed" ||
        newBooking.payment.status === "Confirmed" ||
        newBooking.payment.method === "Card");

    // Flat-rate bookings never get an automatic email at creation time —
    // the admin sends an invoice manually (via CRM actions) whenever it's
    // ready, for both flat-rate and hourly jobs. Admin/staff alerts below
    // still fire as normal.
    const isFlatRate = newBooking.payment?.billingType === "flat";

    if (!isDevMode) {
      // If payment is pending AND not yet paid via Stripe, send payment email with Stripe link
      if (isFlatRate) {
        console.log(
          `🔇 Flat-rate booking ${newBooking.bookingId} created — no automatic customer email sent. Send the invoice manually via CRM actions.`,
        );
      } else if (
        newBooking.payment &&
        newBooking.payment.status === "Pending" &&
        !isPaymentCompleted
      ) {
        try {
          // Generate Stripe Checkout Link with manual capture
          const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: newBooking.customer.email,
            payment_intent_data: {
              capture_method: "manual", // Authorize but don't capture - money held in pending
              metadata: {
                bookingId: newBooking._id.toString(),
                bookingRef: newBooking.bookingId,
                company: "Cleaniq Services",
              },
            },
            line_items: [
              {
                price_data: {
                  currency: (
                    newBooking.payment.currency || "GBP"
                  ).toLowerCase(),
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
              company: "Cleaniq Services",
            },
            success_url: `${process.env.FRONTEND_URL || "https://cleaniqservices.com"}/account/bookings?payment=success&bookingId=${newBooking._id}`,
            cancel_url: `${process.env.FRONTEND_URL || "https://cleaniqservices.com"}/account/bookings?payment=cancelled`,
          });

          // Send Payment Required Email to Customer
          await sendEmail({
            to: newBooking.customer.email,
            subject: `Payment Required: Cleaniq Booking ${newBooking.bookingId}`,
            html: templates.paymentRequired(newBooking, session.url),
          });

          console.log(
            `✅ Payment email sent to ${newBooking.customer.email} with checkout link`,
          );
        } catch (paymentEmailErr) {
          console.error(
            "❌ Failed to send payment email:",
            paymentEmailErr.message,
          );
        }
      } else if (!newBooking.skipConfirmationEmail) {
        // Send Success Confirmation Email (payment already completed or admin booking).
        // Bookings created via "Create Booking (No Payment)" use a separate
        // template with no Stripe link / bank transfer details, since the
        // admin has already taken payment outside the system.
        await sendEmail({
          to: newBooking.customer.email,
          subject: `✓ Booking Successful - ${newBooking.bookingId}`,
          html: newBooking.noPaymentRequired
            ? templates.adminBookingCreatedEmail2(newBooking)
            : templates.adminBookingCreatedEmail1(newBooking),
        });
        console.log(
          `✅ Email sent to ${newBooking.customer.email} - Booking confirmation`,
        );
      } else {
        console.log(
          `🔇 Confirmation email skipped for booking ${newBooking.bookingId} (admin opted out)`,
        );
      }

      // Send Alert Email to Admin
      await sendEmail({
        to: process.env.EMAIL_USER || "admin@cleaniqservices.com",
        subject: `🚨 New Booking: ${newBooking.bookingId}`,
        html: templates.adminNewBookingAlert(newBooking),
      });

      // Notify all active Staff members of a new available clean job in their feed
      try {
        const activeStaff = await Worker.find({
          status: "Active",
          appAccessGranted: true,
        });
        if (activeStaff && activeStaff.length > 0) {
          console.log(
            `📧 Notifying ${activeStaff.length} active staff members about booking ${newBooking.bookingId}...`,
          );
          for (const staff of activeStaff) {
            await sendEmail({
              to: staff.email,
              subject: `🧹 New Job Alert: ${newBooking.service} is available!`,
              html: templates.staffNewJobAlert(newBooking),
            });
          }
        }
      } catch (staffEmailErr) {
        console.error(
          "❌ Failed to email staff new job notification:",
          staffEmailErr,
        );
      }
    } else {
      // DEV MODE: Send dev mode success confirmation email to customer (without payment section)
      try {
        await sendEmail({
          to: newBooking.customer.email,
          subject: `✓ Booking Confirmed - ${newBooking.bookingId}`,
          html: templates.devModeBookingSuccess(newBooking),
        });
        console.log(
          `🧪 [DEV MODE] Booking ${newBooking.bookingId} created - Success email sent to customer`,
        );
      } catch (devEmailErr) {
        console.error(
          `❌ Failed to send dev mode confirmation email:`,
          devEmailErr.message,
        );
      }
    }

    // Schedule booking reminders for confirmed bookings (payment done or noPaymentRequired)
    try {
      const isConfirmed = newBooking.noPaymentRequired ||
        ["Confirmed", "Authorized"].includes(newBooking.status);
      const bookingDate = newBooking.schedule?.date ? new Date(newBooking.schedule.date) : null;
      if (isConfirmed && bookingDate && bookingDate > new Date()) {
        const payload = {
          bookingId: newBooking._id.toString(),
          bookingRef: newBooking.bookingId,
          email: newBooking.customer?.email,
          firstName: newBooking.customer?.firstName,
          service: newBooking.service,
          date: bookingDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
          amount: newBooking.payment?.amount,
        };
        const ms24h = 24 * 60 * 60 * 1000;
        const ms3h  = 3  * 60 * 60 * 1000;
        if (bookingDate - ms24h > new Date()) {
          await scheduleTask("booking_reminder_24h", new Date(bookingDate - ms24h), payload);
        }
        if (bookingDate - ms3h > new Date()) {
          await scheduleTask("booking_reminder_3h", new Date(bookingDate - ms3h), payload);
        }
      }
    } catch (schedErr) {
      console.error("⚠️ Failed to schedule booking reminders:", schedErr.message);
    }

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a booking (Admin)
router.put("/:id", async (req, res) => {
  try {
    const existingBooking = await Booking.findById(req.params.id);
    if (!existingBooking)
      return res.status(404).json({ message: "Booking not found" });

    const wasCompleted = existingBooking.status === "Completed";
    const isNowCompleted = req.body.status === "Completed";

    // If postcode is provided separately and not already in address, append it
    if (req.body.details?.postcode && req.body.details?.address) {
      const postcode = (req.body.details.postcode || '').trim();
      const address = (req.body.details.address || '').trim();
      if (postcode && !address.toLowerCase().includes(postcode.toLowerCase())) {
        req.body.details.address = `${address}, ${postcode}`;
      }
    }
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    // Send Invoice Email and update worker wallet if status just changed to Completed
    if (!wasCompleted && isNowCompleted) {
      console.log(
        `✅ Booking ${updatedBooking.bookingId} marked as completed. Sending invoice receipt...`,
      );

      // Update worker wallet with earned amount — isolated so a failure here
      // never prevents the invoice email from being sent below.
      try {
      if (updatedBooking.assignedWorker) {
        const Worker = require("../models/Worker");
        const workerEarnings =
          (updatedBooking.workerRate || 0) *
          (updatedBooking.details?.duration ||
            updatedBooking.workerDuration ||
            updatedBooking.duration ||
            0);

        if (workerEarnings > 0) {
          const worker = await Worker.findById(updatedBooking.assignedWorker);
          if (worker) {
            if (!worker.wallet) {
              worker.wallet = {
                totalEarned: 0,
                balance: 0,
                onHold: 0,
                withdrawn: 0,
              };
            }
            // Just ensure wallet exists - balance will be calculated on fetch
            worker.wallet.lastUpdated = new Date();
            await worker.save();
            console.log(
              `💰 Booking completed for worker ${updatedBooking.assignedWorkerName}: +£${workerEarnings.toFixed(2)}`,
            );

            // Auto-create scheduled payout if bank details exist
            if (
              worker.bankDetails?.accountName &&
              worker.bankDetails?.accountNumber
            ) {
              try {
                const Withdrawal = require("../models/Withdrawal");
                const Service = require("../models/Service");

                // Calculate earnings for THIS job (just completed)
                const service = await Service.findOne({
                  name: updatedBooking.service,
                });

                let jobEarnings = 0;

                if (service?.type === "hourly") {
                  // For hourly services: hourlyRate × duration
                  const duration =
                    updatedBooking.details?.duration ||
                    updatedBooking.workerDuration ||
                    updatedBooking.duration ||
                    0;
                  jobEarnings = (service?.workerHourlyRate || 0) * duration;
                } else {
                  // For flat-rate services: use workerPaymentRate
                  jobEarnings = service?.workerPaymentRate || 0;
                }

                // Fallback to old calculation if no service rate available
                if (jobEarnings === 0) {
                  jobEarnings =
                    (updatedBooking.workerRate || 0) *
                    (updatedBooking.details?.duration ||
                      updatedBooking.workerDuration ||
                      updatedBooking.duration ||
                      0);
                }

                // Skip if no earnings
                if (jobEarnings > 0) {
                  // Calculate payout date: 8 days from now
                  const expectedPayoutDate = new Date();
                  expectedPayoutDate.setDate(expectedPayoutDate.getDate() + 8);
                  // Set to start of day for consistency
                  expectedPayoutDate.setHours(0, 0, 0, 0);

                  const jobRecord = {
                    bookingId: updatedBooking.bookingId,
                    service: updatedBooking.service,
                    amount: jobEarnings,
                    completedDate: updatedBooking.updatedAt,
                  };

                  // CREATE NEW withdrawal for EACH job (no accumulation)
                  // Each job gets its own separate withdrawal record
                  const withdrawal = new Withdrawal({
                    workerId: updatedBooking.assignedWorker,
                    workerName: `${worker.firstName} ${worker.lastName}`,
                    workerEmail: worker.email,
                    workerPhone: worker.phone,
                    workerAddress: worker.address,
                    workerPostcode: worker.postcode,
                    amount: jobEarnings,
                    completedJobs: [jobRecord],
                    bankDetails: {
                      accountName: worker.bankDetails.accountName,
                      accountNumber: worker.bankDetails.accountNumber,
                      sortCode: worker.bankDetails.sortCode,
                      bankName: worker.bankDetails.bankName,
                    },
                    status: "upcoming",
                    payoutType: "fixed_8days",
                    expectedPayoutDate,
                  });

                  await withdrawal.save();

                  console.log(
                    `✅ Created withdrawal: £${jobEarnings.toFixed(
                      2,
                    )} for ${updatedBooking.service} on ${expectedPayoutDate.toDateString()}`,
                  );

                  // Update worker wallet - add to onHold
                  worker.wallet.onHold =
                    (worker.wallet.onHold || 0) + jobEarnings;
                  await worker.save();

                  console.log(
                    `✅ Payment scheduled: £${jobEarnings.toFixed(
                      2,
                    )} for ${worker.firstName} ${worker.lastName} - Will pay on ${expectedPayoutDate.toDateString()}`,
                  );

                  // Send notification email
                  try {
                    await sendEmail({
                      to: worker.email,
                      subject: "✅ Payment Scheduled - Cleaniq",
                      html: `
                        <h2>Payment Scheduled</h2>
                        <p>Hi ${worker.firstName},</p>
                        <p>Your completed cleaning work has been recorded and a payment of <strong>£${jobEarnings.toFixed(
                          2,
                        )}</strong> is scheduled.</p>
                        <p><strong>Service:</strong> ${updatedBooking.service}</p>
                        <p><strong>Payout Type:</strong> 8-Day Fixed Schedule</p>
                        <p><strong>Expected Payment Date:</strong> ${expectedPayoutDate.toLocaleDateString()}</p>
                        <p>You'll receive another email confirmation when payment has been processed.</p>
                      `,
                    });
                    console.log(
                      `✅ Payment scheduled email sent to: ${worker.email}`,
                    );
                  } catch (err) {
                    console.error(
                      "⚠️ Failed to send payout notification:",
                      err,
                    );
                  }
                }
              } catch (err) {
                console.error("⚠️ Error auto-creating payout:", err);
              }
            }
          }
        }
      }
      } catch (walletErr) {
        console.error("⚠️ Worker wallet update failed (invoice will still send):", walletErr.message);
      }

      // CAPTURE AUTHORIZED PAYMENT when booking is completed
      if (
        updatedBooking.payment?.stripePaymentIntentId &&
        updatedBooking.payment.status === "Authorized"
      ) {
        try {
          const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
          const capturedPayment = await stripe.paymentIntents.capture(
            updatedBooking.payment.stripePaymentIntentId,
          );

          // Update booking to mark payment as captured
          updatedBooking.payment.status = "Completed";
          updatedBooking.payment.capturedAt = new Date();
          await updatedBooking.save();

          console.log(
            `💳 ✅ Payment captured for booking ${updatedBooking.bookingId} - Status: ${capturedPayment.status}`,
          );

          // Send payment captured email to customer
          try {
            await sendEmail({
              to: updatedBooking.customer.email,
              subject: `✓ Payment Captured: Cleaniq Booking ${updatedBooking.bookingId}`,
              html: `
                <h2>Payment Captured</h2>
                <p>Hi ${updatedBooking.customer.firstName},</p>
                <p>Your cleaning service has been completed successfully!</p>
                <p><strong>Booking Reference:</strong> ${updatedBooking.bookingId}</p>
                <p><strong>Service:</strong> ${updatedBooking.service}</p>
                <p><strong>Amount Charged:</strong> ${updatedBooking.payment.currency === "GBP" ? "£" : "₦"}${updatedBooking.payment.amount}</p>
                <p>Your payment has been successfully processed. Thank you for choosing Cleaniq!</p>
              `,
            });
            console.log(
              `✅ Payment captured email sent to: ${updatedBooking.customer.email}`,
            );
          } catch (emailErr) {
            console.error("⚠️ Failed to send payment capture email:", emailErr);
          }
        } catch (captureErr) {
          console.error(
            `❌ Failed to capture payment for booking ${updatedBooking.bookingId}:`,
            captureErr.message,
          );
        }
      }

      try {
        await sendEmail({
          to: updatedBooking.customer.email,
          subject: `Your Cleaniq Invoice & Receipt: ${updatedBooking.bookingId}`,
          html: templates.invoiceReceipt(updatedBooking),
        });
        console.log(`📧 Invoice email sent to ${updatedBooking.customer.email} for booking ${updatedBooking.bookingId}`);
      } catch (invoiceErr) {
        console.error(`❌ Failed to send invoice email for ${updatedBooking.bookingId}:`, invoiceErr.message);
      }

      // Schedule post-service automation sequence
      try {
        const now = new Date();
        const payload = {
          bookingId: updatedBooking._id.toString(),
          bookingRef: updatedBooking.bookingId,
          email: updatedBooking.customer?.email,
          firstName: updatedBooking.customer?.firstName,
          service: updatedBooking.service,
        };
        await scheduleTask("review_request_2h",     new Date(now.getTime() + 2  * 60 * 60 * 1000), payload);
        await scheduleTask("referral_offer_48h",    new Date(now.getTime() + 48 * 60 * 60 * 1000), payload);
        await scheduleTask("rebooking_discount_3d", new Date(now.getTime() + 72 * 60 * 60 * 1000), payload);
        console.log(`⚙️ Post-service automations scheduled for booking ${updatedBooking.bookingId}`);
      } catch (schedErr) {
        console.error("⚠️ Failed to schedule post-service automations:", schedErr.message);
      }
    }

    res.json(updatedBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a single booking (Admin)
router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    await moveToTrash(
      "Booking",
      booking,
      `${booking.bookingId} — ${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim(),
    );
    await booking.deleteOne();
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bookings/:id/resend  - resend booking confirmation email (Admin)
router.post("/:id/resend", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const ok = await sendEmail({
      to: booking.customer.email,
      subject: `Your Cleaniq Booking Details — ${booking.bookingId}`,
      html: templates.bookingConfirmation(booking),
    });

    if (!ok) return res.status(500).json({ message: "Failed to send email" });
    res.json({ message: "Email resent successfully" });
  } catch (err) {
    console.error("Error resending booking email:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/:id/confirm-payment-sent — public link clicked from the
// bank-transfer email. Flips the booking to Confirmed and alerts admin to
// verify the transfer actually landed.
router.get("/:id/confirm-payment-sent", async (req, res) => {
  const outcomePage = (heading, message, color = "#059669", bg = "#d1fae5", icon = "✓") => `
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Cleaniq Services</title></head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 48px 16px;">
      <tr>
        <td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="width: 520px; max-width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="background-color: #0f172a; padding: 28px; text-align: center;">
                <img src="https://cleaniqservices.com/preview.jpg" alt="Cleaniq Services" style="height: 40px;" />
              </td>
            </tr>
            <tr>
              <td style="padding: 44px 40px; text-align: center;">
                <span style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: ${bg}; color: ${color}; font-size: 26px; font-weight: bold;">${icon}</span>
                <h1 style="margin: 20px 0 12px; font-size: 22px; color: #0f172a;">${heading}</h1>
                <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #475569;">${message}</p>
                <a href="https://cleaniqservices.com" style="display: inline-block; margin-top: 28px; padding: 12px 28px; background-color: #005B41; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold;">Return to Cleaniq Services</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .send(
          outcomePage(
            "Booking not found",
            "We couldn't find that booking. Please contact us directly and we'll help sort it out.",
            "#dc2626",
            "#fee2e2",
            "!",
          ),
        );
    }

    if (booking.status !== "Completed" && booking.status !== "Cancelled") {
      booking.status = "Confirmed";
      booking.meta = booking.meta || {};
      booking.meta.paymentSentReportedAt = new Date();
      await booking.save();

      try {
        await sendEmail({
          to: process.env.EMAIL_USER || "admin@cleaniqservices.com",
          subject: `💷 Customer reports payment sent — Booking ${booking.bookingId}`,
          html: `
            <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #059669; padding: 28px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px;">💷 Payment Reported</h1>
              </div>
              <div style="padding: 28px;">
                <p style="margin: 0 0 16px; font-size: 14px; color: #475569;"><strong>${booking.customer.firstName} ${booking.customer.lastName}</strong> says they've sent the bank transfer for booking <strong>${booking.bookingId}</strong>. Please verify it's landed before assigning a cleaner.</p>
                <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;"><strong>Amount:</strong> £${booking.payment?.amount || 0}</p>
                <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;"><strong>Customer Email:</strong> ${booking.customer.email}</p>
                <a href="https://cleaniqservices.com/admin/bookings" style="display: inline-block; margin-top: 16px; background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px;">View in Admin</a>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("⚠️ Failed to send payment-reported alert:", emailErr.message);
      }
    }

    res.send(
      outcomePage(
        "Thanks — We've Got It!",
        `We've marked your booking <strong>${booking.bookingId}</strong> as confirmed and our team will verify the transfer shortly.`,
      ),
    );
  } catch (err) {
    console.error("Error confirming payment sent:", err);
    res
      .status(500)
      .send(
        outcomePage(
          "Something went wrong",
          "Please contact us directly so we can confirm your booking.",
          "#dc2626",
          "#fee2e2",
          "!",
        ),
      );
  }
});

// GET /api/bookings/:id/invoice — public link from booking emails so the
// customer can view/download their receipt anytime, not just from the inbox.
router.get("/:id/invoice", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send("<h1>Booking not found</h1>");

    const { htmlToPdfBuffer } = require("../utils/pdf");
    const pdf = await htmlToPdfBuffer(
      templates.invoiceReceipt(booking),
      `Cleaniq Services - Invoice ${booking.bookingId}`,
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Cleaniq-Invoice-${booking.bookingId}.pdf"`,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (err) {
    console.error("Error generating invoice download:", err.message);
    res.status(500).send("<h1>Something went wrong</h1>");
  }
});

// ─── CRM: SEND BOOKING CONFIRMATION ──────────────────────────────────────────
router.post("/:id/send-confirmation", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const ok = await sendEmail({
      to: booking.customer.email,
      subject: `✓ Booking Confirmed — ${booking.bookingId} | Cleaniq Services`,
      html: templates.bookingConfirmation(booking),
    });

    if (!ok) return res.status(500).json({ message: "Failed to send email" });

    // Track that confirmation was sent
    booking.meta = booking.meta || {};
    booking.meta.confirmationSentAt = new Date();
    await booking.save();

    res.json({ success: true, message: "Booking confirmation sent successfully" });
  } catch (err) {
    console.error("CRM send-confirmation error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ─── CRM: SEND INVOICE ────────────────────────────────────────────────────────
router.post("/:id/send-invoice", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const ok = await sendEmail({
      to: booking.customer.email,
      subject: `🧾 Invoice — ${booking.bookingId} | Cleaniq Services`,
      html: templates.invoiceReceipt(booking),
    });

    if (!ok) return res.status(500).json({ message: "Failed to send invoice email" });

    booking.meta = booking.meta || {};
    booking.meta.invoiceSentAt = new Date();
    await booking.save();

    res.json({ success: true, message: "Invoice sent to customer successfully" });
  } catch (err) {
    console.error("CRM send-invoice error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ─── CRM: SEND REVIEW REQUEST ─────────────────────────────────────────────────
router.post("/:id/send-review-request", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const reviewUrl = `https://cleaniqservices.com/review?booking=${booking.bookingId}&customer=${encodeURIComponent(booking.customer.firstName + ' ' + booking.customer.lastName)}`;

    const ok = await sendEmail({
      to: booking.customer.email,
      subject: `⭐ How was your clean? Leave us a review — Cleaniq Services`,
      html: templates.reviewRequest(booking, reviewUrl),
    });

    if (!ok) return res.status(500).json({ message: "Failed to send review request" });

    booking.meta = booking.meta || {};
    booking.meta.reviewRequestSentAt = new Date();
    await booking.save();

    res.json({ success: true, message: "Review request sent to customer successfully" });
  } catch (err) {
    console.error("CRM send-review-request error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ─── CRM: CREATE PAYMENT LINK (Stripe Checkout) ───────────────────────────────
router.post("/:id/create-payment-link", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "");

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name,
          description: `Cleaniq Service — Booking ${booking.bookingId}`,
        },
        unit_amount: Math.round((item.amount || 0) * 100), // convert to pence
      },
      quantity: item.qty || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      // Authorize but don't capture — money is only deducted from the
      // customer once the admin marks the job as Completed (see the
      // capture-on-complete logic in the PUT /:id route below).
      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          bookingId: String(booking._id),
          bookingRef: booking.bookingId,
          company: "Cleaniq Services",
        },
      },
      success_url: `https://cleaniqservices.com/account/dashboard?payment=success&booking=${booking.bookingId}`,
      cancel_url: `https://cleaniqservices.com/account/dashboard?payment=cancelled`,
      customer_email: booking.customer.email,
      metadata: {
        bookingId: String(booking._id),
        bookingRef: booking.bookingId,
        type: "crm-payment-link",
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("CRM create-payment-link error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ─── CRM: SEND PAYMENT LINK VIA EMAIL ────────────────────────────────────────
router.post("/:id/send-payment-link", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const { url, items, totalAmount, note } = req.body;
    if (!url) return res.status(400).json({ message: "Payment URL is required" });

    const ok = await sendEmail({
      to: booking.customer.email,
      subject: `💳 Payment Request — £${Number(totalAmount).toFixed(2)} | Cleaniq Services`,
      html: templates.paymentLinkEmail(booking, items || [], totalAmount || 0, url, note || ""),
    });

    if (!ok) return res.status(500).json({ message: "Failed to send payment link email" });

    booking.meta = booking.meta || {};
    booking.meta.paymentLinkSentAt = new Date();
    booking.meta.lastPaymentLinkUrl = url;
    await booking.save();

    res.json({ success: true, message: "Payment link sent to customer successfully" });
  } catch (err) {
    console.error("CRM send-payment-link error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
