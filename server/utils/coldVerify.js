// Checks a contact's email address before we send to it (like Apollo's "verified" badge), without
// sending anything:
//  - invalid: badly formed, or the domain has no mail server (MX) and no address at all
//  - risky:   role address (info@, sales@…) or a throwaway email service
//  - valid:   the domain accepts email
// It can't tell whether a single mailbox exists (that needs a test send), so a few "valid" addresses
// may still bounce; bounces are then caught by utils/coldInbox.js.
const dns = require("dns").promises;

const ROLE = new Set(["admin", "administrator", "billing", "contact", "enquiries", "enquiry", "hello", "help", "hr", "info", "jobs", "mail", "marketing", "noreply", "no-reply", "office", "postmaster", "reception", "sales", "support", "team", "webmaster", "accounts", "careers", "abuse"]);
const DISPOSABLE = new Set(["mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com", "temp-mail.org", "yopmail.com", "trashmail.com", "getnada.com", "sharklasers.com", "dispostable.com", "maildrop.cc", "throwawaymail.com", "fakeinbox.com", "mintemail.com", "mohmal.com"]);
const FORMAT = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const cache = new Map(); // domain → { ok, reason, at }
const DAY = 24 * 3600 * 1000;

async function domainAcceptsMail(domain) {
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < DAY) return hit;
  let res;
  try {
    const mx = await dns.resolveMx(domain);
    const real = mx.filter((m) => m.exchange && m.exchange !== ".");
    res = real.length ? { ok: true, reason: "" } : { ok: false, reason: "The domain says it doesn't accept email (null MX)" };
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA" || err.code === "ESERVFAIL") {
      // No MX: mail can still go to the domain's own address, if it has one.
      try {
        await dns.resolve4(domain);
        res = { ok: true, reason: "" };
      } catch {
        res = { ok: false, reason: "The domain has no mail server" };
      }
    } else {
      res = { ok: null, reason: `Couldn't check the domain (${err.code || err.message})` };
    }
  }
  const out = { ...res, at: Date.now() };
  cache.set(domain, out);
  return out;
}

/** @returns {Promise<{ status: "valid"|"risky"|"invalid"|"unknown", reason: string, checkedAt: Date }>} */
async function verifyEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  const checkedAt = new Date();
  if (!FORMAT.test(e)) return { status: "invalid", reason: "Not a valid email address", checkedAt };
  const [local, domain] = e.split("@");
  if (DISPOSABLE.has(domain)) return { status: "risky", reason: "Throwaway email service", checkedAt };
  const d = await domainAcceptsMail(domain);
  if (d.ok === false) return { status: "invalid", reason: d.reason, checkedAt };
  if (d.ok === null) return { status: "unknown", reason: d.reason, checkedAt };
  if (ROLE.has(local.split("+")[0])) return { status: "risky", reason: "Shared/role address (e.g. info@) — often lower replies", checkedAt };
  return { status: "valid", reason: "", checkedAt };
}

module.exports = { verifyEmail };
