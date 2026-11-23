// Allows content editors (/content-admin logins) AND main admins to edit website content.
// Content editor tokens carry scope "content" and are rejected by the main admin API (adminAuth
// looks up the id in the Admin collection, where editors don't exist).
const jwt = require("jsonwebtoken");
const ContentEditor = require("../models/ContentEditor");
const adminAuth = require("./adminAuth");

// Content editor tokens use their own signing key (derived from the main one unless
// CONTENT_JWT_SECRET is set), so no other part of the API can ever accept them.
const BASE = process.env.CONTENT_JWT_SECRET || `${process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET}:content-editors`;
const SECRET = BASE;

async function contentAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please sign in" });
  let decoded = null;
  try {
    decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
  } catch {
    decoded = null;
  }
  if (decoded?.scope === "content" && decoded.id) {
    const editor = await ContentEditor.findById(decoded.id).select("-password").lean();
    if (!editor || !editor.active) return res.status(401).json({ message: "Your account isn't active" });
    if (editor.passwordChangedAt && decoded.iat && decoded.iat * 1000 < new Date(editor.passwordChangedAt).getTime()) {
      return res.status(401).json({ message: "Please sign in again" });
    }
    req.contentEditor = editor;
    req.admin = { email: editor.email, name: editor.name }; // for "saved by"
    return next();
  }
  // Not a content editor token: allow main admins.
  return adminAuth(req, res, next);
}

module.exports = contentAuth;
module.exports.SECRET = SECRET;
