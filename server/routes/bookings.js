const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
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

    const newBooking = await booking.save();

    // Send Confirmation Email to Customer
    await sendEmail({
      to: newBooking.customer.email,
      subject: "Your Cleaniq Booking is Confirmed!",
      html: templates.bookingConfirmation(newBooking),
    });

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
