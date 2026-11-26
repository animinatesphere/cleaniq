// Encrypts social media tokens before they're saved (AES-256-GCM). Key: SOCIAL_TOKEN_KEY, or
// derived from JWT_SECRET. Changing the key means reconnecting the accounts.
const crypto = require("crypto");

const key = () => crypto.createHash("sha256").update(process.env.SOCIAL_TOKEN_KEY || `${process.env.JWT_SECRET}:social-tokens`).digest();

function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(String(text), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

function decrypt(value) {
  if (!value) return "";
  const [iv, tag, data] = String(value).split(".").map((s) => Buffer.from(s, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}

module.exports = { encrypt, decrypt };
