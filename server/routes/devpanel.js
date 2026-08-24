/**
 * Dev Control Panel — backend API
 * Protected by DEV_PANEL_SECRET (set in .env).
 * Provides: system health, live SSE stream, error capture, account management.
 */
const router  = require("express").Router();
const mongoose = require("mongoose");
const jwt      = require("jsonwebtoken");
const bcrypt   = require("bcryptjs");
const Admin    = require("../models/Admin");
const Customer = require("../models/Customer");
const Worker   = require("../models/Worker");
const Booking  = require("../models/Booking");

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const DEV_SECRET = process.env.DEV_PANEL_SECRET || "cleaniq-dev-2025";

// ── In-memory stores ──────────────────────────────────────────────────────────
const errorBuffer   = [];
const requestBuffer = [];
const MAX_ERRORS    = 500;
const MAX_REQUESTS  = 1000;
const sseClients    = new Set();

// ── SSE broadcast ─────────────────────────────────────────────────────────────
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); }
    catch { sseClients.delete(client); }
  }
}

// ── Error push ────────────────────────────────────────────────────────────────
function pushError(entry) {
  const record = {
    ...entry,
    id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  errorBuffer.push(record);
  if (errorBuffer.length > MAX_ERRORS) errorBuffer.shift();
  broadcast("server_error", record);
  return record;
}

function captureRequest(entry) {
  const record = {
    ...entry,
    id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  requestBuffer.push(record);
  if (requestBuffer.length > MAX_REQUESTS) requestBuffer.shift();
  broadcast("request", record);
}

function captureExpressError(entry) {
  pushError({ type: "express_error", level: "error", ...entry });
}

// ── Console overrides ─────────────────────────────────────────────────────────
const _origError = console.error.bind(console);
console.error = (...args) => {
  _origError(...args);
  try {
    const msg = args.map((a) => (a instanceof Error ? a.stack || a.message : typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    pushError({ type: "console.error", message: msg, level: "error" });
  } catch {}
};

const _origWarn = console.warn.bind(console);
console.warn = (...args) => {
  _origWarn(...args);
  try {
    const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    pushError({ type: "console.warn", message: msg, level: "warn" });
  } catch {}
};

// ── Process-level errors ──────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  pushError({ type: "uncaughtException", message: err.message, stack: err.stack, level: "fatal" });
});
process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.stack || reason.message : String(reason);
  pushError({ type: "unhandledRejection", message: msg, level: "error" });
});

// ── Maintenance mode ──────────────────────────────────────────────────────────
let _maintenanceMode = false;
const isMaintenanceMode = () => _maintenanceMode;

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireDev(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorised" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "devpanel") return res.status(403).json({ error: "Forbidden" });
    req.devUser = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC: auth login
// ══════════════════════════════════════════════════════════════════════════════
router.post("/auth", (req, res) => {
  const { secret } = req.body || {};
  if (!secret || secret !== DEV_SECRET) {
    return res.status(401).json({ error: "Invalid dev secret" });
  }
  const token = jwt.sign({ role: "devpanel" }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

// ══════════════════════════════════════════════════════════════════════════════
// PROTECTED routes
// ══════════════════════════════════════════════════════════════════════════════

// ── Health ───────────────────────────────────────────────────────────────────
router.get("/health", requireDev, async (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  let dbPingMs = null;
  try {
    const t = Date.now();
    await mongoose.connection.db.admin().ping();
    dbPingMs = Date.now() - t;
  } catch {}

  res.json({
    status: "ok",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    db: {
      state: dbStates[mongoose.connection.readyState] || "unknown",
      name: mongoose.connection.name || "",
      host: mongoose.connection.host || "",
      pingMs: dbPingMs,
    },
    activeClients: sseClients.size,
    buffered: { errors: errorBuffer.length, requests: requestBuffer.length },
    timestamp: new Date().toISOString(),
  });
});

// ── Overview stats ────────────────────────────────────────────────────────────
router.get("/stats", requireDev, async (req, res) => {
  try {
    const [admins, customers, workers, bookings] = await Promise.all([
      Admin.countDocuments(),
      Customer.countDocuments(),
      Worker.countDocuments(),
      Booking.countDocuments(),
    ]);
    const revenue = await Booking.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$payment.amount" } } },
    ]);
    const recentErrors  = errorBuffer.length;
    const fatalErrors   = errorBuffer.filter((e) => e.level === "fatal").length;
    res.json({
      admins, customers, workers, bookings,
      revenue: revenue[0]?.total || 0,
      recentErrors, fatalErrors,
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Backend request log ───────────────────────────────────────────────────────
router.get("/requests", requireDev, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "200", 10), MAX_REQUESTS);
  res.json({ requests: [...requestBuffer].reverse().slice(0, limit) });
});

// ── Error log ─────────────────────────────────────────────────────────────────
router.get("/errors", requireDev, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "200", 10), MAX_ERRORS);
  res.json({ errors: [...errorBuffer].reverse().slice(0, limit) });
});

router.delete("/errors", requireDev, (req, res) => {
  errorBuffer.length = 0;
  broadcast("errors_cleared", {});
  res.json({ ok: true });
});

// ── SSE stream ────────────────────────────────────────────────────────────────
router.get("/stream", requireDev, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  sseClients.add(res);
  res.write(`event: connected\ndata: {"clients":${sseClients.size}}\n\n`);

  const ping = setInterval(() => {
    try { res.write(`event: ping\ndata: {"t":"${new Date().toISOString()}"}\n\n`); }
    catch { clearInterval(ping); sseClients.delete(res); }
  }, 20000);

  req.on("close", () => { clearInterval(ping); sseClients.delete(res); });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ACCOUNTS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/admins", requireDev, async (req, res) => {
  try {
    const admins = await Admin.find({}, "-password").sort({ createdAt: -1 });
    res.json({ admins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/admins", requireDev, async (req, res) => {
  try {
    const { username, email, password, role, permissions } = req.body;
    const admin = new Admin({ username, email, password, role: role || "superadmin", permissions: permissions || [] });
    await admin.save();
    res.json({ ok: true, id: admin._id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/admins/:id/password", requireDev, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "Password too short" });
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    admin.password = newPassword;
    await admin.save();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/admins/:id/role", requireDev, async (req, res) => {
  try {
    const { role, permissions } = req.body;
    const admin = await Admin.findByIdAndUpdate(req.params.id, { role, permissions }, { new: true, select: "-password" });
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json({ admin });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/admins/:id", requireDev, async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/customers", requireDev, async (req, res) => {
  try {
    const page  = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const q     = req.query.q || "";
    const query = q
      ? { $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] }
      : {};
    const [customers, total] = await Promise.all([
      Customer.find(query, "name email phone createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Customer.countDocuments(query),
    ]);
    res.json({ customers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/customers/:id", requireDev, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// WORKERS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/workers", requireDev, async (req, res) => {
  try {
    const page  = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const q     = req.query.q || "";
    const query = q
      ? { $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] }
      : {};
    const [workers, total] = await Promise.all([
      Worker.find(query, "name email phone status rating createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Worker.countDocuments(query),
    ]);
    res.json({ workers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/workers/:id", requireDev, async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/bookings", requireDev, async (req, res) => {
  try {
    const page   = parseInt(req.query.page  || "1",  10);
    const limit  = Math.min(parseInt(req.query.limit || "30", 10), 100);
    const status = req.query.status || "";
    const q      = req.query.q     || "";
    const query  = {};
    if (status) query.status = status;
    if (q)      query.$or = [{ bookingId: { $regex: q, $options: "i" } }, { "customer.email": { $regex: q, $options: "i" } }, { "customer.name": { $regex: q, $options: "i" } }];
    const [bookings, total] = await Promise.all([
      Booking.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .select("bookingId status schedule payment service customer assignedWorker createdAt notes"),
      Booking.countDocuments(query),
    ]);
    res.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/bookings/:id/status", requireDev, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Not found" });
    booking.status = req.body.status;
    await booking.save();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/bookings/:id", requireDev, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// DATABASE INSPECTOR
// ══════════════════════════════════════════════════════════════════════════════
router.get("/database", requireDev, async (req, res) => {
  try {
    const db   = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    const counts = await Promise.all(
      cols.map(async (c) => ({ name: c.name, count: await db.collection(c.name).estimatedDocumentCount() }))
    );
    counts.sort((a, b) => b.count - a.count);
    let dbStats = null;
    try { dbStats = await db.stats(); } catch {}
    res.json({ collections: counts, stats: dbStats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// SERVER CONTROL
// ══════════════════════════════════════════════════════════════════════════════
router.get("/server/status", requireDev, (req, res) => {
  res.json({ maintenance: _maintenanceMode, uptime: process.uptime(), pid: process.pid });
});

router.put("/server/maintenance", requireDev, (req, res) => {
  _maintenanceMode = !!req.body.enabled;
  broadcast("maintenance", { enabled: _maintenanceMode });
  console.warn(`[DevPanel] Maintenance mode ${_maintenanceMode ? "ON" : "OFF"}`);
  res.json({ ok: true, enabled: _maintenanceMode });
});

// Restart — process.exit(0) so pm2 auto-restarts the process
router.post("/server/restart", requireDev, (req, res) => {
  res.json({ ok: true, message: "Restarting…" });
  setTimeout(() => process.exit(0), 300);
});

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMER DETAIL (bookings + profile)
// ══════════════════════════════════════════════════════════════════════════════
router.get("/customers/:id/detail", requireDev, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Not found" });
    const bookings = await Booking.find({
      $or: [
        { "customer.email": customer.email },
        { customerId: customer._id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .select("bookingId status schedule payment service details createdAt notes");
    res.json({ customer, bookings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// WORKER DETAIL (jobs + profile)
// ══════════════════════════════════════════════════════════════════════════════
router.get("/workers/:id/detail", requireDev, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: "Not found" });
    const bookings = await Booking.find({ assignedWorker: worker._id })
      .sort({ createdAt: -1 })
      .limit(25)
      .select("bookingId status schedule payment service details createdAt customer");
    res.json({ worker, bookings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Exports
// ══════════════════════════════════════════════════════════════════════════════
module.exports = router;
module.exports.captureRequest      = captureRequest;
module.exports.captureExpressError = captureExpressError;
module.exports.pushError           = pushError;
module.exports.isMaintenanceMode   = isMaintenanceMode;
