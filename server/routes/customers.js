const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const { moveToTrash } = require("../utils/trash");

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
