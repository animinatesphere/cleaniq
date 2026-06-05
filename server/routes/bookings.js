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

// POST a new booking
// POST a new booking
router.post("/", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    // Explicitly set Mixed fields to bypass potential strict schema stripping
    booking.set("details", req.body.details);
    booking.set("property", req.body.property);
    booking.set("meta", req.body.meta);

    // Apply global default workerRate / workerDuration if not provided
    if (booking.workerRate == null || booking.workerDuration == null) {
      try {
        const [rateSetting, durSetting] = await Promise.all([
          SystemSetting.findOne({ key: "defaultWorkerRate" }),
          SystemSetting.findOne({ key: "defaultWorkerDuration" }),
        ]);
        if (booking.workerRate == null && rateSetting) {
          booking.workerRate = rateSetting.value;
        }
        if (booking.workerDuration == null && durSetting) {
          booking.workerDuration = durSetting.value;
        }
      } catch (settingsErr) {
        console.warn("⚠️ Could not load default worker settings:", settingsErr.message);
      }
    }

    const newBooking = await booking.save();

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

    // Send Invoice Email if status just changed to Completed
    if (!wasCompleted && isNowCompleted) {
      console.log(
        `✅ Booking ${updatedBooking.bookingId} marked as completed. Sending invoice receipt...`,
      );
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
