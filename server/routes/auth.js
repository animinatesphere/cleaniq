const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail, templates } = require("../utils/emailService");
const adminAuth = require("../middleware/adminAuth");
const {
  loginRateLimiter,
  resetLoginRateLimiter,
} = require("../middleware/loginRateLimiter");

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
if (!ADMIN_JWT_SECRET) {
  throw new Error(
    "Missing ADMIN_JWT_SECRET or JWT_SECRET environment variable",
  );
}

function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// Pages a "restricted" account can ever be granted. Dashboard (revenue) and
// Settings (which includes this very admin-management screen) are never
// grantable, regardless of what the creating superadmin requests.
const GRANTABLE_PERMISSIONS = [
  "bookings",
  "calendar",
  "rota",
  "quotes",
  "services",
  "leads",
  "checklist",
  "recurring",
  "email-history",
  "invoice-builder",
  "staff-pay",
  "payments",
  "withdrawals",
  "expenses",
  "workers",
  "applicants",
  "customers",
  "blog",
  "chat",
];

router.post("/login", loginRateLimiter, async (req, res) => {
  const username = (req.body.username || "").trim().toLowerCase();
  const { password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: "User not found" });

    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      return res.status(403).json({
        message:
          "Account locked due to too many failed login attempts. Please try again later.",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      if (admin.failedLoginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await admin.save();
      return res.status(400).json({ message: "Invalid credentials" });
    }

    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    admin.lastLoginAt = new Date();
    await admin.save();

    resetLoginRateLimiter(req);

    const token = jwt.sign({ id: admin._id }, ADMIN_JWT_SECRET, {
      expiresIn: "8h",
    });
    if (admin.email) {
      const location =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      const dateTime = new Date().toLocaleString("en-GB", {
        timeZone: "Europe/London",
      });
      sendEmail({
        to: admin.email,
        subject: "Admin login alert",
        html: templates.adminLoginAlert(admin, location, userAgent, dateTime),
      }).catch(() => {});
    }

    res.json({
      token,
      username: admin.username,
      role: admin.role || "superadmin",
      permissions: admin.role === "restricted" ? admin.permissions || [] : [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protect all admin-management routes after login
router.use(adminAuth);

/**
 * GET /api/auth/admins
 * List all admin/staff accounts (excludes password hashes)
 */
router.get("/admins", async (req, res) => {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  try {
    const admins = await Admin.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/auth/admins
 * Create a new admin/staff account with a given role (e.g. a restricted
 * "restricted" account scoped to only the pages it's granted)
 */
router.post("/admins", async (req, res) => {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const username = (req.body.username || "").trim().toLowerCase();
  const email = (req.body.email || "").trim().toLowerCase();
  const { password, role, permissions } = req.body;
  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 12 characters and include uppercase, lowercase, numbers, and symbols.",
      });
    }
    const existing = await Admin.findOne({ username });
    if (existing) {
      return res
        .status(400)
        .json({ message: "That username is already taken" });
    }
    const finalRole = role === "superadmin" ? "superadmin" : "restricted";
    const finalPermissions =
      finalRole === "restricted"
        ? (Array.isArray(permissions) ? permissions : []).filter((p) =>
            GRANTABLE_PERMISSIONS.includes(p),
          )
        : [];
    const admin = new Admin({
      username,
      email,
      password,
      role: finalRole,
      permissions: finalPermissions,
    });
    await admin.save();

    if (email) {
      await sendEmail({
        to: email,
        subject: "Your Cleaniq Business Portal account is ready",
        html: templates.adminAccountInvite({
          username,
          role: admin.role,
          tempPassword: password,
        }),
      });
    }

    res.status(201).json({
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/auth/admins/:id
 * Remove an admin/staff account
 */
router.delete("/admins/:id", async (req, res) => {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    if (admin.role === "superadmin") {
      const superadminCount = await Admin.countDocuments({
        role: "superadmin",
      });
      if (superadminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot delete the last superadmin account" });
      }
    }
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin account deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/change-password", async (req, res) => {
  const username = (req.body.username || "").trim().toLowerCase();
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current password and new password are required" });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      message:
        "New password must be at least 12 characters and include uppercase, lowercase, numbers, and symbols.",
    });
  }

  const targetUsername = username || req.admin.username;
  if (
    targetUsername !== req.admin.username &&
    req.admin.role !== "superadmin"
  ) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  try {
    const actingAdmin = await Admin.findById(req.admin._id);
    if (!actingAdmin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      actingAdmin.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    const admin = await Admin.findOne({ username: targetUsername });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.password = newPassword; // The pre-save hook will hash this
    await admin.save();

    if (admin.email) {
      const location =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      const dateTime = new Date().toLocaleString("en-GB", {
        timeZone: "Europe/London",
      });
      sendEmail({
        to: admin.email,
        subject: "Admin password changed",
        html: templates.adminPasswordChangedAlert(
          admin,
          location,
          userAgent,
          dateTime,
        ),
      }).catch(() => {});
    }

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
