const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use(
  cors({
    origin: [
      "https://www.cleaniqservices.com",
      "https://cleaniqservices.com",
      "http://localhost:5173",
      "http://localhost:8081",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
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

app.use("/api/bookings", bookingRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/blog", blogRoutes);

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
      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        const bookingId = pi.metadata && pi.metadata.bookingId;
        console.log(
          "🔔 Stripe payment succeeded for metadata.bookingId=",
          bookingId,
        );
        if (bookingId) {
          const booking = await Booking.findById(bookingId);
          if (booking) {
            booking.status = "Completed";
            booking.payment = booking.payment || {};
            booking.payment.transactionId = pi.id;
            booking.payment.status = "Paid";
            await booking.save();

            // Send Payment Success Email to Customer
            await sendEmail({
              to: booking.customer.email,
              subject: `✓ Payment Confirmed: Cleaniq Booking ${booking.bookingId}`,
              html: templates.paymentSuccessCustomer(booking),
            });

            // Send Payment Success Email to Admin
            await sendEmail({
              to: process.env.EMAIL_USER || "admin@cleaniqservices.com",
              subject: `✓ Payment Received: ${booking.bookingId} - ${booking.customer.firstName} ${booking.customer.lastName}`,
              html: templates.paymentSuccessAdmin(booking),
            });

            console.log(
              `✅ Payment success emails sent for booking ${bookingId}`,
            );
          } else {
            console.warn(
              "⚠️ Booking not found for webhook bookingId:",
              bookingId,
            );
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
app.use("/api/contact", contactRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
