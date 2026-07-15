const express = require("express");
const router = express.Router();
const WorkerCustomerMessage = require("../models/WorkerCustomerMessage");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");
const { sendCustomerPush } = require("../utils/pushNotifications");

// Helper: verify worker owns the booking — accepts BK-xxxx ref or MongoDB _id
const verifyWorkerOwnsBooking = async (bookingId, workerId) => {
  const booking = await Booking.findOne({
    $or: [{ bookingId }, { _id: bookingId.match(/^[0-9a-f]{24}$/i) ? bookingId : null }],
  }).catch(() => Booking.findOne({ bookingId }));
  if (!booking) return null;
  if (booking.assignedWorker?.toString() !== workerId) return null;
  return booking;
};

// GET /api/worker-chat/:bookingId - fetch message thread for booking
router.get("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { workerId } = req.query;

    if (!workerId) {
      return res.status(400).json({ error: "Worker ID required" });
    }

    // Verify worker has access to this booking
    const booking = await verifyWorkerOwnsBooking(bookingId, workerId);
    if (!booking) {
      return res
        .status(403)
        .json({
          error: "Access denied. You are not assigned to this booking.",
        });
    }

    const messages = await WorkerCustomerMessage.find({ bookingId })
      .sort({ createdAt: 1 })
      .limit(500);

    // Mark customer messages as read when worker views
    await WorkerCustomerMessage.updateMany(
      { bookingId, senderType: "Customer", isRead: false },
      { isRead: true },
    );

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/worker-chat/:bookingId - worker sends message to customer
router.post("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { text, workerId, workerName } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    if (!workerId || !workerName) {
      return res.status(400).json({ error: "Worker ID and name required" });
    }

    // Verify worker is assigned to booking
    const booking = await verifyWorkerOwnsBooking(bookingId, workerId);
    if (!booking) {
      return res
        .status(403)
        .json({
          error: "Access denied. You are not assigned to this booking.",
        });
    }

    // Only allow messaging if booking is not completed and cancelled
    if (booking.status === "Cancelled" || booking.status === "Rejected") {
      return res.status(400).json({
        error: `Cannot message on a ${booking.status} booking`,
      });
    }

    const message = new WorkerCustomerMessage({
      bookingId,
      workerId,
      customerEmail: booking.customer?.email,
      customerId: booking.customer?._id,
      senderType: "Worker",
      senderName: workerName,
      text: text.trim(),
      isRead: false,
    });

    await message.save();

    // Notify customer via push
    try {
      const customer = await Customer.findOne({ email: (booking.customer?.email || "").toLowerCase() });
      if (customer?.expoPushToken) {
        await sendCustomerPush(customer.expoPushToken, {
          title: `Message from ${workerName.split(" ")[0]}`,
          body: text.trim().length > 60 ? text.trim().slice(0, 57) + "…" : text.trim(),
          data: { bookingId, type: "chat" },
        });
      }
    } catch {}

    console.log(`💬 Worker ${workerName} sent message to customer for booking ${bookingId}`);
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/worker-chat/conversations/:workerId - get all active conversations for worker
router.get("/conversations/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;

    // Get all bookings assigned to this worker
    const bookings = await Booking.find({ assignedWorker: workerId })
      .select("_id bookingId customer service status")
      .sort({ createdAt: -1 });

    // Get latest message for each booking
    const conversations = await Promise.all(
      bookings.map(async (booking) => {
        const latestMessage = await WorkerCustomerMessage.findOne({
          bookingId: booking.bookingId,
        })
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = await WorkerCustomerMessage.countDocuments({
          bookingId: booking.bookingId,
          senderType: "Customer",
          isRead: false,
        });

        return {
          bookingId: booking.bookingId,
          customerName: `${booking.customer?.firstName} ${booking.customer?.lastName}`,
          service: booking.service,
          status: booking.status,
          lastMessage: latestMessage?.text || "No messages yet",
          lastMessageTime: latestMessage?.createdAt,
          unreadCount,
        };
      }),
    );

    // Filter out conversations with no messages and sort by time
    const activeConversations = conversations
      .filter((c) => c.lastMessage !== "No messages yet")
      .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

    res.json(activeConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
