const express = require("express");
const router = express.Router();
const { getOverview, getRealtime } = require("../utils/analytics");
const Customer = require("../models/Customer");
const Worker = require("../models/Worker");

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

// GET /api/analytics/realtime — visitors on the site right now
router.get("/realtime", async (req, res) => {
  try {
    const data = await getRealtime();
    res.json(data);
  } catch (err) {
    console.error("GA4 realtime error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/app-users — registered user stats from our own DB
router.get("/app-users", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [
      totalCustomers,
      totalCompanies,
      totalWorkers,
      activeCustomers,
      activeCompanies,
      activeWorkers,
      devicesCustomerApp,
      devicesWorkerApp,
      customerMonthly,
      workerMonthly,
    ] = await Promise.all([
      Customer.countDocuments({ role: "customer" }),
      Customer.countDocuments({ role: "company" }),
      Worker.countDocuments(),
      Customer.countDocuments({ role: "customer", lastLoginAt: { $gte: thirtyDaysAgo } }),
      Customer.countDocuments({ role: "company", lastLoginAt: { $gte: thirtyDaysAgo } }),
      Worker.countDocuments({ appAccessGranted: true }),
      Customer.countDocuments({ expoPushToken: { $nin: ["", null] } }),
      Worker.countDocuments({ expoPushToken: { $nin: ["", null] } }),
      Customer.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, role: "$role" }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Worker.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    res.json({
      totals: {
        customers: totalCustomers,
        companies: totalCompanies,
        workers: totalWorkers,
        activeCustomers,
        activeCompanies,
        activeWorkers,
        devicesCustomerApp,
        devicesWorkerApp,
      },
      customerMonthly,
      workerMonthly,
    });
  } catch (err) {
    console.error("App users analytics error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
