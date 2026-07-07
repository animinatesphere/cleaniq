const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const { moveToTrash } = require("../utils/trash");
const { sendEmail } = require("../utils/emailService");

// Get all customers - registered users + guest customers from bookings
router.get("/", async (req, res) => {
  try {
    // Get all registered customers
    const registeredCustomers = await Customer.find({}, { passwordHash: 0 });

    // Get unique guest customers from bookings (those without registered accounts)
    const bookingCustomers = await Booking.aggregate([
      {
        $group: {
          _id: "$customer.email",
          firstName: { $first: "$customer.firstName" },
          lastName: { $first: "$customer.lastName" },
          phone: { $first: "$customer.phone" },
          totalBookings: { $sum: 1 },
          lastBooking: { $max: "$createdAt" },
          totalSpent: { $sum: "$payment.amount" },
          region: { $first: "$region" },
        },
      },
      {
        $project: {
          _id: 0,
          email: "$_id",
          firstName: 1,
          lastName: 1,
          phone: 1,
          totalBookings: 1,
          lastBooking: 1,
          totalSpent: 1,
          region: 1,
        },
      },
    ]);

    // Map registered customers and merge with booking data
    const customersMap = new Map();

    // First add registered customers
    registeredCustomers.forEach((customer) => {
      customersMap.set(customer.email, {
        _id: customer._id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone || "",
        totalBookings: 0,
        lastBooking: null,
        totalSpent: 0,
        region: "UK",
        isRegistered: true,
        createdAt: customer.createdAt,
        lastLoginAt:  customer.lastLoginAt  || null,
        lastLogoutAt: customer.lastLogoutAt || null,
        loginCount:   customer.loginCount   || 0,
      });
    });

    // Then merge/add booking data
    bookingCustomers.forEach((bookingCustomer) => {
      if (customersMap.has(bookingCustomer.email)) {
        // Update existing registered customer with booking stats
        const existing = customersMap.get(bookingCustomer.email);
        existing.totalBookings = bookingCustomer.totalBookings;
        existing.lastBooking = bookingCustomer.lastBooking;
        existing.totalSpent = bookingCustomer.totalSpent;
        existing.region = bookingCustomer.region || existing.region;
      } else {
        // Add guest customer (only has bookings, not registered)
        customersMap.set(bookingCustomer.email, {
          ...bookingCustomer,
          isRegistered: false,
        });
      }
    });

    // Convert to array and sort by lastBooking desc, then by createdAt desc
    const allCustomers = Array.from(customersMap.values()).sort((a, b) => {
      const aDate = a.lastBooking || a.createdAt || new Date(0);
      const bDate = b.lastBooking || b.createdAt || new Date(0);
      return new Date(bDate) - new Date(aDate);
    });

    res.json(allCustomers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customers/create  — admin creates a customer account and emails them
router.post("/create", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "firstName, lastName, email and password are required." });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const customer = new Customer({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || "",
      passwordHash,
    });
    await customer.save();

    // Email the customer their login credentials
    await sendEmail({
      to: email,
      subject: "Your Cleaniq Services Account Has Been Created",
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#fff;">
          <div style="background:#0F172A;padding:36px;text-align:center;">
            <h1 style="color:#6EE7B7;margin:0;font-size:22px;font-weight:800;">Cleaniq Services</h1>
            <p style="color:#94a3b8;margin-top:8px;font-size:14px;">Your account is ready</p>
          </div>
          <div style="padding:40px;color:#1e293b;line-height:1.7;">
            <h2 style="font-size:18px;margin-top:0;">Hi ${firstName},</h2>
            <p>An account has been created for you on Cleaniq Services. Here are your login details:</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">Email address</p>
              <p style="margin:0 0 20px 0;font-weight:700;font-size:16px;">${email.toLowerCase()}</p>
              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">Password</p>
              <p style="margin:0;font-weight:700;font-size:16px;letter-spacing:2px;">${password}</p>
            </div>
            <p style="font-size:13px;color:#64748b;">Please log in and change your password as soon as possible.</p>
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">© 2026 Cleaniq Services. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    });

    res.status(201).json({
      message: "Account created and credentials sent to customer.",
      customer: { _id: customer._id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update customer info across all their bookings
router.put("/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { firstName, lastName, phone } = req.body;

    const result = await Booking.updateMany(
      { "customer.email": email },
      {
        $set: {
          "customer.firstName": firstName,
          "customer.lastName": lastName,
          "customer.phone": phone,
        },
      },
    );

    res.json({
      message: "Customer info updated across all bookings",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET customer booking history
router.get("/:email/bookings", async (req, res) => {
  try {
    const { email } = req.params;
    const bookings = await Booking.find({ "customer.email": email }).sort({
      createdAt: -1,
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a customer and all their bookings
router.delete("/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Delete registered customer account if it exists
    const customer = await Customer.findOne({ email });
    if (customer) {
      await moveToTrash(
        "Customer",
        customer,
        `${customer.firstName} ${customer.lastName} — ${customer.email}`,
      );
      await customer.deleteOne();
    }

    // Delete all bookings associated with this email
    const bookingsToTrash = await Booking.find({ "customer.email": email });
    for (const booking of bookingsToTrash) {
      await moveToTrash(
        "Booking",
        booking,
        `${booking.bookingId} — ${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim(),
      );
    }
    const bookingResult = await Booking.deleteMany({ "customer.email": email });

    res.json({
      message: "Customer and associated bookings deleted successfully",
      deletedBookingsCount: bookingResult.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
