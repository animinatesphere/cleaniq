const express = require("express");
const router = express.Router();
const Trash = require("../models/Trash");

const MODELS = {
  Booking: () => require("../models/Booking"),
  Lead: () => require("../models/Lead"),
  Customer: () => require("../models/Customer"),
  Worker: () => require("../models/Worker"),
  Quote: () => require("../models/Quote"),
  BlogPost: () => require("../models/BlogPost"),
  Service: () => require("../models/Service"),
  Expense: () => require("../models/Expense"),
};

// GET /api/trash — list everything currently in the bin
router.get("/", async (req, res) => {
  try {
    const items = await Trash.find().sort({ deletedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trash/:id/restore — re-create the original document and remove it from the bin
router.post("/:id/restore", async (req, res) => {
  try {
    const trashItem = await Trash.findById(req.params.id);
    if (!trashItem)
      return res.status(404).json({ message: "Trash item not found" });

    const Model = MODELS[trashItem.entityType]?.();
    if (!Model)
      return res
        .status(400)
        .json({ message: `Unknown entity type: ${trashItem.entityType}` });

    const existing = await Model.findById(trashItem.originalId);
    if (existing) {
      return res.status(409).json({
        message:
          "A record with this ID already exists — it may have already been restored.",
      });
    }

    await Model.create(trashItem.data);
    await trashItem.deleteOne();

    res.json({ message: `${trashItem.entityType} restored successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/trash/:id — permanently remove a single item from the bin
router.delete("/:id", async (req, res) => {
  try {
    const trashItem = await Trash.findByIdAndDelete(req.params.id);
    if (!trashItem)
      return res.status(404).json({ message: "Trash item not found" });
    res.json({ message: "Permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/trash — empty the entire bin permanently
router.delete("/", async (req, res) => {
  try {
    const result = await Trash.deleteMany({});
    res.json({ message: "Bin emptied", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
