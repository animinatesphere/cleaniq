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

// GET /api/analytics/meta-ads?days=N — Meta Ads campaign performance
router.get("/meta-ads", async (req, res) => {
  const { META_ACCESS_TOKEN, META_AD_ACCOUNT_ID } = process.env;
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
    return res.status(503).json({ message: "Meta Ads not configured. Add META_ACCESS_TOKEN and META_AD_ACCOUNT_ID to your server environment." });
  }

  const days = parseInt(req.query.days, 10) || 28;
  const preset = days <= 7 ? "last_7d" : days <= 14 ? "last_14d" : days <= 28 ? "last_28d" : "last_90d";

  const fields = [
    "campaign_name",
    "spend",
    "impressions",
    "clicks",
    "reach",
    "cpm",
    "cpc",
    "ctr",
    "actions",
    "cost_per_action_type",
  ].join(",");

  try {
    const accountId = META_AD_ACCOUNT_ID.startsWith("act_")
      ? META_AD_ACCOUNT_ID
      : `act_${META_AD_ACCOUNT_ID}`;

    const url =
      `https://graph.facebook.com/v19.0/${accountId}/insights` +
      `?fields=${fields}&date_preset=${preset}&level=campaign` +
      `&access_token=${META_ACCESS_TOKEN}`;

    const r = await fetch(url);
    const json = await r.json();

    if (json.error) {
      console.error("Meta Ads API error:", json.error.message);
      return res.status(400).json({ message: json.error.message });
    }

    const campaigns = (json.data || []).map((c) => {
      const findAction = (type) =>
        (c.actions || []).find((a) => a.action_type === type);
      const findCpa = (type) =>
        (c.cost_per_action_type || []).find((a) => a.action_type === type);

      const lead = findAction("lead");
      const purchase = findAction("purchase");
      const costPerLead = findCpa("lead");
      const costPerPurchase = findCpa("purchase");

      return {
        campaign: c.campaign_name || "Unknown",
        spend: parseFloat(c.spend || 0),
        impressions: parseInt(c.impressions || 0, 10),
        clicks: parseInt(c.clicks || 0, 10),
        reach: parseInt(c.reach || 0, 10),
        cpm: parseFloat(c.cpm || 0),
        cpc: parseFloat(c.cpc || 0),
        ctr: parseFloat(c.ctr || 0),
        leads: lead ? parseInt(lead.value, 10) : 0,
        purchases: purchase ? parseInt(purchase.value, 10) : 0,
        costPerLead: costPerLead ? parseFloat(costPerLead.value) : 0,
        costPerPurchase: costPerPurchase ? parseFloat(costPerPurchase.value) : 0,
      };
    });

    const totals = campaigns.reduce(
      (acc, c) => ({
        spend: acc.spend + c.spend,
        impressions: acc.impressions + c.impressions,
        clicks: acc.clicks + c.clicks,
        reach: acc.reach + c.reach,
        leads: acc.leads + c.leads,
        purchases: acc.purchases + c.purchases,
      }),
      { spend: 0, impressions: 0, clicks: 0, reach: 0, leads: 0, purchases: 0 }
    );

    totals.ctr =
      totals.impressions > 0
        ? (totals.clicks / totals.impressions) * 100
        : 0;
    totals.cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
    totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    totals.cpm =
      totals.impressions > 0
        ? (totals.spend / totals.impressions) * 1000
        : 0;

    res.json({ campaigns, totals, preset });
  } catch (err) {
    console.error("Meta Ads fetch error:", err.message);
    res.status(500).json({ message: "Failed to fetch Meta Ads data" });
  }
});

module.exports = router;
