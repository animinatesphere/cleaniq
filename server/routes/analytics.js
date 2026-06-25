const express = require("express");
const router = express.Router();
const { getOverview } = require("../utils/analytics");

// GET /api/analytics/overview?days=28 — website traffic summary from GA4
router.get("/overview", async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 28;
    const data = await getOverview(days);
    res.json(data);
  } catch (err) {
    console.error("GA4 analytics error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
