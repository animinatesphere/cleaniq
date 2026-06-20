const express = require("express");
const router = express.Router();
const OrgPosition = require("../models/OrgPosition");

// GET /api/org-chart — full flat list (frontend builds the tree)
router.get("/", async (req, res) => {
  try {
    const positions = await OrgPosition.find().sort({ order: 1, createdAt: 1 });
    res.json(positions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/org-chart — add a position
router.post("/", async (req, res) => {
  try {
    const { name, title, department, parentId, order } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required." });
    const position = await OrgPosition.create({
      name: name || "Vacant",
      title,
      department: department || "",
      parentId: parentId || null,
      order: order || 0,
    });
    res.status(201).json(position);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/org-chart/:id — update a position
router.put("/:id", async (req, res) => {
  try {
    const position = await OrgPosition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!position) return res.status(404).json({ message: "Position not found" });
    res.json(position);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/org-chart/:id — remove a position; re-parent its children to
// whoever it reported to, so the rest of the chart doesn't get orphaned.
router.delete("/:id", async (req, res) => {
  try {
    const position = await OrgPosition.findById(req.params.id);
    if (!position) return res.status(404).json({ message: "Position not found" });

    await OrgPosition.updateMany(
      { parentId: position._id },
      { parentId: position.parentId || null },
    );
    await OrgPosition.findByIdAndDelete(req.params.id);
    res.json({ message: "Position deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
