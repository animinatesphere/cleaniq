// Normalise UK phone numbers to E.164 (+447700900123) so the same person
// matches across WhatsApp, Twilio and Customer records typed in any format.
function toE164UK(raw) {
  if (!raw) return "";
  let s = String(raw).trim().replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+")) return /^\+\d{8,15}$/.test(s) ? s : "";
  if (/^0\d{9,10}$/.test(s)) return "+44" + s.slice(1); // 07700 900123
  if (/^44\d{9,10}$/.test(s)) return "+" + s; // 447700900123 (WhatsApp sends this form)
  return "";
}

// Find a Customer whose phone matches, whatever format it was saved in.
async function findCustomerByPhone(phone) {
  const Customer = require("../models/Customer");
  const target = toE164UK(phone);
  if (!target) return null;
  const last9 = target.slice(-9);
  // Narrow with a cheap regex on the last digits, then compare normalised numbers.
  const candidates = await Customer.find({ phone: { $regex: last9.split("").join("\\D*") + "$" } })
    .select("firstName lastName email phone")
    .limit(10);
  return candidates.find((c) => toE164UK(c.phone) === target) || null;
}

module.exports = { toE164UK, findCustomerByPhone };
