const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
if (!ADMIN_JWT_SECRET) {
  throw new Error(
    "Missing ADMIN_JWT_SECRET or JWT_SECRET environment variable",
  );
}

async function adminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization required" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid admin token" });
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Admin account not found" });
    }

    if (
      admin.passwordChangedAt &&
      decoded.iat &&
      decoded.iat * 1000 < admin.passwordChangedAt.getTime()
    ) {
      return res
        .status(401)
        .json({ message: "Token expired due to password change" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized admin access" });
  }
}

module.exports = adminAuth;
