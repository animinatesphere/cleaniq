const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(
  cors({
    origin: [
      "https://www.cleaniqservices.com",
      "https://cleaniqservices.com",
      "http://localhost:5173",
      "http://localhost:8081",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ added OPTIONS
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.options("*", cors());
// Enforce canonical host (www) in production to avoid www vs non-www split
app.use((req, res, next) => {
  try {
    const host = (req.headers.host || "").toLowerCase();
    if (
      process.env.NODE_ENV === "production" &&
      host.includes("cleaniqservices.com") &&
      !host.startsWith("www.")
    ) {
      return res.redirect(
        301,
        `https://www.cleaniqservices.com${req.originalUrl}`,
      );
    }
  } catch (e) {
    // noop
  }
  next();
});

// Middleware

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes (To be added)
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Cleaniq API is running" });
});

// Import Routes
const bookingRoutes = require("./routes/bookings");
const recruitmentRoutes = require("./routes/recruitment");
const serviceRoutes = require("./routes/services");
const customerRoutes = require("./routes/customers");
const authRoutes = require("./routes/auth");
const paymentRoutes = require("./routes/payments");
const reviewRoutes = require("./routes/reviews");
const marketingRoutes = require("./routes/marketing");
const workerRoutes = require("./routes/workers");
const messageRoutes = require("./routes/messages");
const customerAuthRoutes = require("./routes/customer-auth");
const customerBookingRoutes = require("./routes/customer-bookings");
const customerChatRoutes = require("./routes/customer-chat");
const contactRoutes = require("./routes/contact");
const blogRoutes = require("./routes/blog");
const propertiesRoutes = require("./routes/properties");
const settingsRoutes = require("./routes/settings");
const notificationsRoutes = require("./routes/notifications");
const commentRoutes = require("./routes/comments");
const workerChatRoutes = require("./routes/worker-chat");

app.use("/api/bookings", bookingRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Stripe webhook endpoint (raw body required)
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "");
const Booking = require("./models/Booking");
const { sendEmail, templates } = require("./utils/emailService");
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error(
        "❌ Stripe webhook signature verification failed:",
        err.message,
      );
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const bookingId = session.metadata && session.metadata.bookingId;
        console.log(
          "💳 Stripe checkout session completed - payment authorized for bookingId:",
          bookingId,
        );

        if (bookingId && session.payment_intent) {
          const booking = await Booking.findById(bookingId);
          if (booking) {
            // Store payment intent for later capture
            booking.payment = booking.payment || {};
            booking.payment.stripePaymentIntentId = session.payment_intent;
            booking.payment.status = "Authorized"; // Money is held, not yet captured
            booking.payment.authorizedAt = new Date();
            booking.status = "Confirmed"; // Booking is confirmed but cleaning not done yet
            await booking.save();

            // Send Authorization Email to Customer (payment held)
            await sendEmail({
              to: booking.customer.email,
              subject: `✓ Payment Authorized: Cleaniq Booking ${booking.bookingId}`,
              html: templates.adminBookingCreatedEmail1(booking), // Use success template
            });

            console.log(
              `✅ Payment authorized for booking ${bookingId}, awaiting completion to capture`,
            );
          } else {
            console.warn(
              "⚠️ Booking not found for checkout session:",
              bookingId,
            );
          }
        }
      } else if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        const bookingId = pi.metadata && pi.metadata.bookingId;
        const isAdditionalHours =
          pi.metadata && pi.metadata.type === "additional_hours";
        const additionalHoursAmount = isAdditionalHours
          ? parseInt(pi.metadata.additionalHours || 0)
          : 0;

        console.log(
          "🔔 Stripe payment intent succeeded for bookingId:",
          bookingId,
          isAdditionalHours
            ? `(Additional Hours: ${additionalHoursAmount})`
            : "",
        );

        if (bookingId) {
          const booking = await Booking.findById(bookingId);
          if (booking) {
            if (isAdditionalHours && additionalHoursAmount > 0) {
              // Handle additional hours payment
              const originalHours = booking.details?.duration || 0;
              const newTotalHours = originalHours + additionalHoursAmount;

              // Update booking with new total hours
              booking.details = booking.details || {};
              booking.details.duration = newTotalHours;
              booking.details.additionalHoursPurchased =
                (booking.details.additionalHoursPurchased || 0) +
                additionalHoursAmount;

              // Update payment amount to include additional hours
              const additionalAmount = pi.amount_received / 100; // Convert from cents to pounds
              booking.payment = booking.payment || {};
              booking.payment.amount =
                (booking.payment.amount || 0) + additionalAmount;
              booking.payment.status = "Completed";
              booking.payment.capturedAt = new Date();

              await booking.save();

              // Send Additional Hours Confirmation Email
              await sendEmail({
                to: booking.customer.email,
                subject: `✓ Additional Hours Added: Cleaniq Booking ${booking.bookingId}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                    <h2 style="color: #0A5C43;">✓ Additional Hours Successfully Added!</h2>
                    <p>Your booking has been updated with additional cleaning hours.</p>
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>Booking Reference:</strong> ${booking.bookingId}</p>
                      <p><strong>Additional Hours Purchased:</strong> ${additionalHoursAmount} hours</p>
                      <p><strong>Original Duration:</strong> ${originalHours} hours</p>
                      <p><strong>New Total Duration:</strong> ${newTotalHours} hours</p>
                      <p><strong>Amount Paid:</strong> £${additionalAmount.toFixed(2)}</p>
                    </div>
                    <p>Your cleaner will spend the additional time to provide thorough cleaning. Thank you for choosing Cleaniq!</p>
                    <a href="https://cleaniqservices.com/account/bookings" style="display: inline-block; padding: 12px 24px; background-color: #0A5C43; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Booking</a>
                  </div>
                `,
              });

              console.log(
                `✅ Additional hours paid: ${additionalHoursAmount}hrs added to booking ${bookingId}. New total: ${newTotalHours}hrs`,
              );
            } else {
              // Regular payment completed
              booking.payment = booking.payment || {};
              booking.payment.status = "Completed"; // Payment has been captured
              booking.payment.capturedAt = new Date();
              await booking.save();

              // Send Payment Capture Confirmation Email
              await sendEmail({
                to: booking.customer.email,
                subject: `✓ Payment Captured: Cleaniq Booking ${booking.bookingId}`,
                html: templates.paymentSuccessCustomer(booking),
              });

              console.log(`✅ Payment captured for booking ${bookingId}`);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error handling stripe webhook:", err);
    }

    res.json({ received: true });
  },
);
app.use("/api/reviews", reviewRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/customer-auth", customerAuthRoutes);
app.use("/api/customer-bookings", customerBookingRoutes);
app.use("/api/customer-chat", customerChatRoutes);
app.use("/api/worker-chat", workerChatRoutes);
app.use("/api/contact", contactRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
