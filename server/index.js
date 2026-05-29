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

app.use("/api/bookings", bookingRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/customer-auth", customerAuthRoutes);
app.use("/api/customer-bookings", customerBookingRoutes);
app.use("/api/customer-chat", customerChatRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
