const express = require("express");
const { tokensOf } = require("../utils/pushNotifications");
const router = express.Router();
const CustomerMessage = require("../models/CustomerMessage");
const WorkerCustomerMessage = require("../models/WorkerCustomerMessage");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const { verifyCustomer } = require("./customer-auth");
const adminAuth = require("../middleware/adminAuth");
const { sendCustomerPush } = require("../utils/pushNotifications");

// Helper: verify the customer owns the booking. A company account also owns the bookings made
// for its jobs, even when the booking is under the site contact's email.
const verifyOwnership = async (bookingId, customerEmail, customer = null) => {
  const booking = await Booking.findOne({ bookingId });
  if (!booking) return null;
  if ((booking.customer?.email || "").toLowerCase() === String(customerEmail || "").toLowerCase()) return booking;
  if (customer?.role === "company" && booking.meta?.jobId) {
    const Job = require("../models/Job");
    const job = await Job.findById(booking.meta.jobId).select("company.id").lean().catch(() => null);
    if (job && String(job.company?.id) === String(customer.id)) return booking;
  }
  return null;
};

// GET /api/customer-chat/:bookingId  — fetch thread for a booking
router.get("/:bookingId", verifyCustomer, async (req, res) => {
  try {
    const booking = await verifyOwnership(req.params.bookingId, req.customer.email, req.customer);
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

    const booking = await verifyOwnership(req.params.bookingId, req.customer.email, req.customer);
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
    const { pushToBookingCustomer } = require("../utils/pushNotifications");
    pushToBookingCustomer(booking, "Message from Cleaniq", text.trim().length > 80 ? text.trim().slice(0, 77) + "…" : text.trim(), { type: "support" }).catch(() => {});
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

// GET /api/customer-chat/admin/cleaner-threads — every cleaner↔customer conversation, newest first
// (admin reads them in Chat Support; read-only, nothing is marked as read)
router.get("/admin/cleaner-threads", adminAuth, async (req, res) => {
  try {
    const threads = await WorkerCustomerMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$bookingId",
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          lastSender: { $first: "$senderType" },
          workerId: { $first: "$workerId" },
          customerEmail: { $first: "$customerEmail" },
          count: { $sum: 1 },
        },
      },
      { $sort: { lastMessageTime: -1 } },
      { $limit: 300 },
    ]);
    const bookings = await Booking.find({ bookingId: { $in: threads.map((t) => t._id) } })
      .select("bookingId service schedule.date status customer assignedWorkerName")
      .lean();
    const workers = await Worker.find({ _id: { $in: threads.map((t) => t.workerId) } })
      .select("firstName lastName")
      .lean();
    const bookingBy = new Map(bookings.map((b) => [b.bookingId, b]));
    const workerBy = new Map(workers.map((w) => [String(w._id), w]));
    res.json(threads.map((t) => {
      const w = workerBy.get(String(t.workerId));
      return {
        ...t,
        booking: bookingBy.get(t._id) || null,
        workerName: w ? `${w.firstName || ""} ${w.lastName || ""}`.trim() : bookingBy.get(t._id)?.assignedWorkerName || "Cleaner",
      };
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer-chat/admin/cleaner-thread/:bookingId — the full cleaner↔customer conversation
router.get("/admin/cleaner-thread/:bookingId", adminAuth, async (req, res) => {
  try {
    const messages = await WorkerCustomerMessage.find({ bookingId: req.params.bookingId })
      .sort({ createdAt: 1 })
      .limit(1000)
      .lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== WORKER-CUSTOMER MESSAGING ENDPOINTS =====

// GET /api/customer-chat/my/conversations — the customer's chats with their cleaners (Messages tab):
// every booking that has messages or an assigned cleaner, newest activity first.
router.get("/my/conversations", verifyCustomer, async (req, res) => {
  try {
    const email = String(req.customer.email || "").trim();
    if (!email) return res.json([]);
    const emailRe = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    // A company also sees the bookings for its jobs (some are under the site contact's email).
    let companyJobIds = [];
    if (req.customer.role === "company" && req.customer.id) {
      const Job = require("../models/Job");
      companyJobIds = (await Job.find({ "company.id": req.customer.id }).select("_id").lean()).map((j) => j._id);
    }
    const bookings = await Booking.find({
      $or: [{ "customer.email": emailRe }, ...(companyJobIds.length ? [{ "meta.jobId": { $in: companyJobIds } }] : [])],
      assignedWorker: { $ne: null },
      isShift: { $ne: true },
      status: { $nin: ["Pending", "Awaiting Payment", "Rejected"] },
    })
      .select("bookingId service schedule.date status assignedWorker assignedWorkerName")
      .sort({ "schedule.date": -1 })
      .limit(100)
      .lean();
    if (!bookings.length) return res.json([]);

    const ids = bookings.map((b) => b.bookingId);
    const stats = await WorkerCustomerMessage.aggregate([
      { $match: { bookingId: { $in: ids } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$bookingId",
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          lastSender: { $first: "$senderType" },
          unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ["$senderType", "Worker"] }, { $eq: ["$isRead", false] }] }, 1, 0] } },
        },
      },
    ]);
    const statBy = new Map(stats.map((s) => [s._id, s]));
    const workers = await Worker.find({ _id: { $in: bookings.map((b) => b.assignedWorker) } })
      .select("firstName lastName")
      .lean();
    const workerBy = new Map(workers.map((w) => [String(w._id), w]));
    const active = ["Assigned", "Arrived", "In Progress", "Confirmed", "Authorized", "Accepted"];

    const list = bookings
      .map((b) => {
        const s = statBy.get(b.bookingId);
        const w = workerBy.get(String(b.assignedWorker));
        return {
          bookingId: b.bookingId,
          bookingMongoId: String(b._id),
          service: b.service,
          date: b.schedule?.date || null,
          status: b.status,
          workerName: (w ? `${w.firstName || ""} ${w.lastName || ""}`.trim() : "") || b.assignedWorkerName || "Your cleaner",
          lastMessage: s?.lastMessage || "",
          lastMessageTime: s?.lastMessageTime || null,
          lastSender: s?.lastSender || null,
          unreadCount: s?.unreadCount || 0,
          hasMessages: !!s,
        };
      })
      // Old bookings with no chat aren't worth listing.
      .filter((c) => c.hasMessages || active.includes(c.status));
    list.sort((a, b) => new Date(b.lastMessageTime || b.date || 0) - new Date(a.lastMessageTime || a.date || 0));
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customer-chat/worker-messages/:bookingId - customer views messages from worker
router.get("/worker-messages/:bookingId", verifyCustomer, async (req, res) => {
  try {
    const booking = await verifyOwnership(req.params.bookingId, req.customer.email, req.customer);
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

    const booking = await verifyOwnership(req.params.bookingId, req.customer.email, req.customer);
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

    // Notify worker via push
    try {
      if (booking.assignedWorker) {
        const worker = await Worker.findById(booking.assignedWorker);
        if (tokensOf(worker).length) {
          await sendCustomerPush(tokensOf(worker), {
            title: `Message from ${req.customer.firstName}`,
            body: text.trim().length > 60 ? text.trim().slice(0, 57) + "…" : text.trim(),
            data: {
              bookingId: req.params.bookingId,
              bookingMongoId: String(booking._id),
              type: "chat",
              senderName: `${req.customer.firstName || ""} ${req.customer.lastName || ""}`.trim(),
            },
          });
        }
      }
    } catch {}

    console.log(`💬 Customer replied to worker for booking ${req.params.bookingId}`);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
