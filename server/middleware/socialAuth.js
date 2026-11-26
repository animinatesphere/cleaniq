// Allows social media dashboard logins (/social) AND main admins. Social tokens carry scope
// "social", use their own signing key, and are rejected by every other part of the API.
const jwt = require("jsonwebtoken");
const SocialUser = require("../models/SocialUser");
const adminAuth = require("./adminAuth");

const SECRET = process.env.SOCIAL_JWT_SECRET || `${process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET}:social-users`;

async function socialAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please sign in" });
  let decoded = null;
  try {
    decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
  } catch {
    decoded = null;
  }
  if (decoded?.scope === "social" && decoded.id) {
    const user = await SocialUser.findById(decoded.id).select("-password").lean();
    if (!user || !user.active) return res.status(401).json({ message: "Your account isn't active" });
    if (user.passwordChangedAt && decoded.iat && decoded.iat * 1000 < new Date(user.passwordChangedAt).getTime()) {
      return res.status(401).json({ message: "Please sign in again" });
    }
    req.socialUser = user;
    req.actor = user.email;
    return next();
  }
  return adminAuth(req, res, (err) => {
    if (err) return next(err);
    req.actor = req.admin?.email || req.admin?.username || "admin";
    next();
  });
}

module.exports = socialAuth;
module.exports.SECRET = SECRET;
