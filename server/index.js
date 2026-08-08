const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const sms = require("./utils/smsService");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "https://www.cleaniqservices.com",
  "https://cleaniqservices.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:19006",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.disable("x-powered-by");
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith("cleaniqservices.com")
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  exposedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  next();
});

// Enforce canonical host (www) in production to avoid www vs non-www split
app.use((req, res, next) => {
  try {
    const host = (req.headers.host || "").toLowerCase();
    if (
      process.env.NODE_ENV === "production" &&
      host.includes("cleaniqservices.com") &&
      !host.startsWith("www.") &&
      !host.startsWith("api.")
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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq";
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    const { startAutomationEngine } = require("./utils/automationEngine");
    startAutomationEngine();
  })
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
const quotesRoutes = require("./routes/quotes");
const orgChartRoutes = require("./routes/orgchart");
const trashRoutes = require("./routes/trash");
const emailLogsRoutes = require("./routes/emailLogs");
const customInvoiceRoutes = require("./routes/customInvoice");
const analyticsRoutes = require("./routes/analytics");
const expensesRoutes = require("./routes/expenses");
const automationsRoutes = require("./routes/automations");
const tasksRoutes = require("./routes/tasks");
const complaintsRoutes = require("./routes/complaints");
const contractsRoutes = require("./routes/contracts");
const referralsRoutes = require("./routes/referrals");
const leadsRoutes = require("./routes/leads");
const smsRoutes = require("./routes/sms");
const jobsRoutes = require("./routes/jobs");
const guidesRoutes = require("./routes/guides");
const coldEmailRoutes = require("./routes/cold-email");

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
app.use("/api/quotes", quotesRoutes);
app.use("/api/automations", automationsRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/guides", guidesRoutes);
app.use("/api/cold-email", coldEmailRoutes);

// Stripe webhook endpoint (raw body required)
const { scheduleTask } = require("./utils/automationEngine");
const { buildBookingDateTime } = require("./utils/bookingDateTime");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "");
const Booking = require("./models/Booking");
const { sendEmail, templates } = require("./utils/emailService");
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const applyAdditionalHoursPayment = async (
  booking,
  { additionalHoursAmount, additionalAmount, paymentIntentId },
) => {
  if (!booking || !additionalHoursAmount || additionalHoursAmount <= 0) {
    return { applied: false };
  }

  if (
    paymentIntentId &&
    booking.payment?.lastAdditionalHoursPaymentIntentId === paymentIntentId
  ) {
    return { applied: false, skipped: true };
  }

  const originalHours = booking.details?.duration || 0;
  const newTotalHours = originalHours + additionalHoursAmount;

  booking.details = booking.details || {};
  booking.details.duration = newTotalHours;
  booking.details.additionalHoursPurchased =
    (booking.details.additionalHoursPurchased || 0) + additionalHoursAmount;

  booking.payment = booking.payment || {};
  booking.payment.amount =
    (booking.payment.amount || 0) + (additionalAmount || 0);
  booking.payment.status = "Completed";
  booking.payment.capturedAt = new Date();
  booking.payment.additionalHoursApplied =
    (booking.payment.additionalHoursApplied || 0) + additionalHoursAmount;
  booking.payment.lastAdditionalHoursPaymentIntentId = paymentIntentId;

  await booking.save();

  return {
    applied: true,
    originalHours,
    newTotalHours,
    additionalAmount: additionalAmount || 0,
  };
};

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
        const isAdditionalHours =
          session.metadata && session.metadata.type === "additional_hours";
        const additionalHoursAmount = isAdditionalHours
          ? parseInt(session.metadata.additionalHours || 0)
          : 0;
        console.log(
          "💳 Stripe checkout session completed - payment authorized for bookingId:",
          bookingId,
        );

        if (bookingId && session.payment_intent) {
          const booking = await Booking.findById(bookingId);
          if (booking) {
            if (isAdditionalHours && additionalHoursAmount > 0) {
              const additionalAmount = session.amount_total
                ? session.amount_total / 100
                : 0;
              const result = await applyAdditionalHoursPayment(booking, {
                additionalHoursAmount,
                additionalAmount,
                paymentIntentId: session.payment_intent,
              });

              if (result.applied) {
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
                        <p><strong>Original Duration:</strong> ${result.originalHours} hours</p>
                        <p><strong>New Total Duration:</strong> ${result.newTotalHours} hours</p>
                        <p><strong>Amount Paid:</strong> £${result.additionalAmount.toFixed(2)}</p>
                      </div>
                      <p>Your cleaner will spend the additional time to provide thorough cleaning. Thank you for choosing Cleaniq!</p>
                    </div>
                  `,
                });
                console.log(
                  `✅ Additional hours added immediately for booking ${bookingId}: ${additionalHoursAmount}hrs`,
                );
              } else if (!result.skipped) {
                console.log(
                  `⚠️ Additional hours payment was not applied for booking ${bookingId}`,
                );
              }
            } else {
              // Store payment intent for later capture
              booking.payment = booking.payment || {};
              booking.payment.stripePaymentIntentId = session.payment_intent;
              booking.payment.status = "Authorized"; // Money is held, not yet captured
              booking.payment.authorizedAt = new Date();
              booking.status = "Confirmed"; // Booking is confirmed but cleaning not done yet
              await booking.save();

              // SMS: booking confirmed (fire-and-forget)
              setImmediate(() =>
                sms
                  .triggerBookingConfirmed(booking)
                  .catch((e) =>
                    console.error("SMS Stripe trigger error:", e.message),
                  ),
              );

              // Send Authorization Email to Customer (payment held)
              await sendEmail({
                to: booking.customer.email,
                subject: `✓ Payment Authorized: Cleaniq Booking ${booking.bookingId}`,
                html: templates.adminBookingCreatedEmail1(booking), // Use success template
              });

              // Schedule booking reminders now that payment is confirmed
              try {
                const bookingDate = booking.schedule?.date
                  ? buildBookingDateTime(
                      booking.schedule.date,
                      booking.schedule.timeSlot,
                      booking.schedule?.preferredTime,
                    )
                  : null;
                if (bookingDate && bookingDate > new Date()) {
                  const payload = {
                    bookingId: booking._id.toString(),
                    bookingRef: booking.bookingId,
                    email: booking.customer?.email,
                    firstName: booking.customer?.firstName,
                    service: booking.service,
                    date: bookingDate.toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }),
                    amount: booking.payment?.amount,
                  };
                  const ms24h = 24 * 60 * 60 * 1000;
                  const ms3h = 3 * 60 * 60 * 1000;
                  const soon = Date.now() + 2 * 60 * 1000;
                  await scheduleTask(
                    "booking_reminder_24h",
                    new Date(Math.max(bookingDate.getTime() - ms24h, soon)),
                    payload,
                  );
                  await scheduleTask(
                    "booking_reminder_3h",
                    new Date(Math.max(bookingDate.getTime() - ms3h, soon)),
                    payload,
                  );
                }
              } catch (schedErr) {
                console.error(
                  "⚠️ Failed to schedule Stripe booking reminders:",
                  schedErr.message,
                );
              }

              console.log(
                `✅ Payment authorized for booking ${bookingId}, awaiting completion to capture`,
              );
            }
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
              const result = await applyAdditionalHoursPayment(booking, {
                additionalHoursAmount,
                additionalAmount: pi.amount_received / 100,
                paymentIntentId: pi.id,
              });

              if (result.applied) {
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
                        <p><strong>Original Duration:</strong> ${result.originalHours} hours</p>
                        <p><strong>New Total Duration:</strong> ${result.newTotalHours} hours</p>
                        <p><strong>Amount Paid:</strong> £${result.additionalAmount.toFixed(2)}</p>
                      </div>
                      <p>Your cleaner will spend the additional time to provide thorough cleaning. Thank you for choosing Cleaniq!</p>
                    </div>
                  `,
                });
              }
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
app.use("/api/org-chart", orgChartRoutes);
app.use("/api/trash", trashRoutes);
app.use("/api/email-logs", emailLogsRoutes);
app.use("/api/custom-invoice", customInvoiceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/contracts", contractsRoutes);
app.use("/api/referrals", referralsRoutes);
app.use("/api/leads", leadsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
