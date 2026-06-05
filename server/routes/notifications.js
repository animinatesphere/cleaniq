const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// GET all notifications for a specific worker
router.get("/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const notifications = await Notification.find({ workerId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT mark a notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  } catch (err) {
    console.error("Error updating notification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT mark all notifications as read for a worker
router.put("/:workerId/read-all", async (req, res) => {
  try {
    const { workerId } = req.params;
    await Notification.updateMany({ workerId, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error updating notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
