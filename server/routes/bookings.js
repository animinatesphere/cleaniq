const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const SystemSetting = require("../models/SystemSetting");
const { sendEmail, templates } = require("../utils/emailService");

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

// DELETE ALL bookings (Admin) - IMPORTANT: Must be above /:id
router.delete("/all/delete", async (req, res) => {
  try {
    console.log("☢️ CLEARING ALL BOOKINGS...");
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
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
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
        $lte: dayEnd
      },
      status: { $in: ["Confirmed", "Pending", "Accepted", "In Progress"] }
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
      availableHours: [2, 3, 4, 5, 6, 7].filter(h => !bookedHours.has(h))
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

    // ✅ Skip all emails for DEV MODE bookings (testing only)
    const isDevMode = newBooking.payment && newBooking.payment.method === "Dev Mode";

    if (!isDevMode) {
      // If booking is created by admin (payment status is "Pending"), send payment email with Stripe link
      if (newBooking.payment && newBooking.payment.status === "Pending") {
        try {
          // Generate Stripe Checkout Link
          const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: newBooking.customer.email,
            line_items: [
              {
                price_data: {
                  currency: (newBooking.payment.currency || "GBP").toLowerCase(),
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
      } else {
        // Send Confirmation Email to Customer (Enhanced booking details)
        await sendEmail({
          to: newBooking.customer.email,
          subject: `✓ Your Cleaniq Booking is Created - ${newBooking.bookingId}`,
          html: templates.adminBookingCreatedEmail1(newBooking),
        });
        console.log(
          `✅ Email sent to ${newBooking.customer.email} - Initial booking confirmation`,
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
      console.log(`🧪 [DEV MODE] Booking ${newBooking.bookingId} created - NO emails sent (test mode)`);
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

      // Update worker wallet with earned amount
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

      await sendEmail({
        to: updatedBooking.customer.email,
        subject: `Your Cleaniq Invoice & Receipt: ${updatedBooking.bookingId}`,
        html: templates.invoiceReceipt(updatedBooking),
      });
    }

    res.json(updatedBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a single booking (Admin)
router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
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

module.exports = router;
