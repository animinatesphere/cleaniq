const express = require("express");
const router = express.Router();
const CustomerMessage = require("../models/CustomerMessage");
const WorkerCustomerMessage = require("../models/WorkerCustomerMessage");
const Booking = require("../models/Booking");
const { verifyCustomer } = require("./customer-auth");

// Helper: verify customer owns the booking
const verifyOwnership = async (bookingId, customerEmail) => {
  const booking = await Booking.findOne({ bookingId });
  if (!booking) return null;
  if (
    (booking.customer.email || "").toLowerCase() !== customerEmail.toLowerCase()
  )
    return null;
  return booking;
};

// GET /api/customer-chat/:bookingId  — fetch thread for a booking
router.get("/:bookingId", verifyCustomer, async (req, res) => {
  try {
    const booking = await verifyOwnership(
      req.params.bookingId,
      req.customer.email,
    );
    if (!booking) return res.status(403).json({ message: "Access denied." });

    const messages = await CustomerMessage.find({
      bookingId: req.params.bookingId,
    })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-chat/:bookingId  — send message (Customer → Admin)
router.post("/:bookingId", verifyCustomer, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ message: "Message text is required." });

    const booking = await verifyOwnership(
      req.params.bookingId,
      req.customer.email,
    );
    if (!booking) return res.status(403).json({ message: "Access denied." });

    const msg = new CustomerMessage({
      bookingId: req.params.bookingId,
      customerId: req.customer.id,
      customerEmail: req.customer.email,
      senderType: "Customer",
      senderName: `${req.customer.firstName} ${req.customer.lastName}`,
      text: text.trim(),
    });
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-chat/:bookingId/admin-reply  — Admin replies (no customer JWT needed, uses admin auth header or no auth for simplicity)
router.post("/:bookingId/admin-reply", async (req, res) => {
  try {
    const { text, senderName } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ message: "Message text is required." });

    // Find any message in this thread to get customerEmail
    const existingMsg = await CustomerMessage.findOne({
      bookingId: req.params.bookingId,
    });
    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    const msg = new CustomerMessage({
      bookingId: req.params.bookingId,
      customerEmail: booking.customer.email,
      senderType: "Admin",
      senderName: senderName || "Cleaniq Team",
      text: text.trim(),
    });
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer-chat/admin/threads  — All customer threads (for admin panel)
router.get("/admin/threads", async (req, res) => {
  try {
    const threads = await CustomerMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$bookingId",
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          lastSender: { $first: "$senderType" },
          customerEmail: { $first: "$customerEmail" },
          unread: {
            $sum: {
              $cond: [{ $eq: ["$senderType", "Customer"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ]);

    // Enrich with booking info
    const enriched = await Promise.all(
      threads.map(async (t) => {
        const booking = await Booking.findOne({ bookingId: t._id })
          .select("service schedule.date status customer assignedWorkerName")
          .lean();
        return { ...t, booking };
      }),
    );

    res.json(enriched.filter((t) => t.booking));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer-chat/admin/thread/:bookingId  — specific thread for admin
router.get("/admin/thread/:bookingId", async (req, res) => {
  try {
    const messages = await CustomerMessage.find({
      bookingId: req.params.bookingId,
    })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== WORKER-CUSTOMER MESSAGING ENDPOINTS =====

// GET /api/customer-chat/worker-messages/:bookingId - customer views messages from worker
router.get("/worker-messages/:bookingId", verifyCustomer, async (req, res) => {
  try {
    const booking = await verifyOwnership(
      req.params.bookingId,
      req.customer.email,
    );
    if (!booking) return res.status(403).json({ message: "Access denied." });

    const messages = await WorkerCustomerMessage.find({
      bookingId: req.params.bookingId,
    })
      .sort({ createdAt: 1 })
      .limit(500);

    // Mark worker messages as read
    await WorkerCustomerMessage.updateMany(
      { bookingId: req.params.bookingId, senderType: "Worker", isRead: false },
      { isRead: true },
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customer-chat/worker-messages/:bookingId - customer replies to worker
router.post("/worker-messages/:bookingId", verifyCustomer, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ message: "Message text is required." });

    const booking = await verifyOwnership(
      req.params.bookingId,
      req.customer.email,
    );
    if (!booking) return res.status(403).json({ message: "Access denied." });

    const message = new WorkerCustomerMessage({
      bookingId: req.params.bookingId,
      workerId: booking.assignedWorker,
      customerEmail: req.customer.email,
      customerId: req.customer.id,
      senderType: "Customer",
      senderName: `${req.customer.firstName} ${req.customer.lastName}`,
      text: text.trim(),
      isRead: false,
    });

    await message.save();
    console.log(
      `💬 Customer replied to worker for booking ${req.params.bookingId}`,
    );
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
