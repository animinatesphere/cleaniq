// Cold email deliverability: checks a sending domain's public DNS (MX, SPF, DKIM, DMARC) and works
// out each mailbox's warm-up limit and sending pace. Like Apollo's "Deliverability" checks, but the
// fixes are written for GoDaddy / Microsoft 365 / Google Workspace, which is what we buy mailboxes from.
const dns = require("dns").promises;

const txt = async (name) => {
  try {
    return (await dns.resolveTxt(name)).map((parts) => parts.join(""));
  } catch {
    return [];
  }
};
const cname = async (name) => {
  try {
    return await dns.resolveCname(name);
  } catch {
    return [];
  }
};
const mx = async (name) => {
  try {
    return (await dns.resolveMx(name)).map((r) => r.exchange.toLowerCase());
  } catch {
    return [];
  }
};

// Follows SPF include: chains (max 10 lookups, like real mail servers) and collects every include.
async function spfIncludes(domain, seen = new Set(), depth = 0) {
  if (depth > 10 || seen.has(domain)) return seen;
  seen.add(domain);
  const record = (await txt(domain)).find((t) => /^v=spf1/i.test(t));
  if (!record) return seen;
  for (const m of record.matchAll(/(?:include|redirect)[:=]([^\s]+)/gi)) await spfIncludes(m[1].toLowerCase(), seen, depth + 1);
  return seen;
}

// Which company hosts the mailbox, from the MX/autodiscover records (GoDaddy's Microsoft 365 uses
// Proofpoint "ppe-hosted" MX records in front of Outlook).
async function detectHost(domain, mxHosts, provider) {
  if (mxHosts.some((h) => h.includes("google.com") || h.includes("googlemail.com"))) return "google";
  if (mxHosts.some((h) => h.includes("outlook.com"))) return "microsoft";
  const auto = await cname(`autodiscover.${domain}`);
  if (auto.some((h) => h.includes("outlook.com"))) return "microsoft";
  if (mxHosts.some((h) => h.includes("secureserver.net"))) return "godaddy";
  return provider === "gmail" ? "google" : provider === "outlook" ? "microsoft" : "unknown";
}

const FREE_DOMAINS = new Set(["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "live.co.uk", "yahoo.com", "yahoo.co.uk", "icloud.com"]);

const SPF_NEEDS = {
  google: { include: "_spf.google.com", record: "v=spf1 include:_spf.google.com ~all" },
  microsoft: { include: "spf.protection.outlook.com", record: "v=spf1 include:spf.protection.outlook.com ~all" },
  godaddy: { include: "secureserver.net", record: "v=spf1 include:secureserver.net ~all" },
};

/**
 * Checks one sending domain. Returns { domain, host, score, checks: [{ key, label, ok, level, detail, fix }] }.
 * level: "ok" | "warn" | "bad". Nothing is changed; DNS is only read.
 */
async function checkDomain(domain, provider) {
  domain = String(domain || "").toLowerCase().trim();
  if (FREE_DOMAINS.has(domain)) {
    return {
      domain, host: "free", score: 60, checkedAt: new Date(),
      checks: [{ key: "free", label: "Free email address", level: "warn", detail: `${domain} is a free address, so Google/Microsoft control its DNS. Free addresses are fine for testing but land in junk more often for cold email.`, fix: "Use a mailbox on your own domain (e.g. from GoDaddy) for campaigns." }],
    };
  }
  const [mxHosts, rootTxt, dmarcTxt] = await Promise.all([mx(domain), txt(domain), txt(`_dmarc.${domain}`)]);
  const host = await detectHost(domain, mxHosts, provider);
  const checks = [];

  // MX — the domain can receive replies.
  checks.push(
    mxHosts.length
      ? { key: "mx", label: "Can receive replies (MX)", level: "ok", detail: mxHosts.join(", ") }
      : { key: "mx", label: "Can receive replies (MX)", level: "bad", detail: "No MX records, so replies bounce and filters distrust the domain.", fix: "In GoDaddy → My Products → Email, finish setting up the mailbox. GoDaddy adds the MX records for you." },
  );

  // SPF — which servers may send for this domain.
  const spfRecords = rootTxt.filter((t) => /^v=spf1/i.test(t));
  const need = SPF_NEEDS[host];
  if (spfRecords.length === 0) {
    checks.push({ key: "spf", label: "SPF", level: "bad", detail: "No SPF record.", fix: `Add a TXT record at GoDaddy (DNS → Add → TXT, Name: @) with value: ${need?.record || "v=spf1 include:secureserver.net ~all"}` });
  } else if (spfRecords.length > 1) {
    checks.push({ key: "spf", label: "SPF", level: "bad", detail: `${spfRecords.length} SPF records found. Only one is allowed, so all of them fail.`, fix: "Merge them into a single TXT record that starts with v=spf1 and delete the others." });
  } else {
    const includes = await spfIncludes(domain);
    const covered = !need || [...includes].some((d) => d === need.include || d.endsWith(`.${need.include}`) || d === need.include.replace(/^_/, ""));
    checks.push(
      covered
        ? { key: "spf", label: "SPF", level: "ok", detail: spfRecords[0] }
        : { key: "spf", label: "SPF", level: "bad", detail: `SPF doesn't allow ${host === "microsoft" ? "Microsoft 365" : host} to send for this domain: ${spfRecords[0]}`, fix: `Edit the SPF TXT record at GoDaddy and add "include:${need.include}" before ~all.` },
    );
  }

  // DKIM — the provider signs each email with the domain's key.
  if (host === "microsoft") {
    const [s1, s2] = await Promise.all([cname(`selector1._domainkey.${domain}`), cname(`selector2._domainkey.${domain}`)]);
    checks.push(
      s1.length && s2.length
        ? { key: "dkim", label: "DKIM", level: "ok", detail: "Microsoft 365 DKIM keys (selector1 and selector2) are published." }
        : {
            key: "dkim",
            label: "DKIM",
            level: "bad",
            detail: "DKIM is not switched on for this domain. Microsoft signs the email with its own onmicrosoft.com name instead, so DMARC fails and Outlook/Gmail often send it to junk.",
            fix: "1) Sign in to security.microsoft.com with the GoDaddy Microsoft 365 admin login → Email & collaboration → Policies → Threat policies → Email authentication settings → DKIM. 2) Click this domain → it shows two CNAME records (selector1._domainkey and selector2._domainkey). 3) Add both as CNAME records in GoDaddy DNS. 4) Wait 30–60 minutes, go back and switch 'Sign messages with DKIM' on. GoDaddy support can do this for you if the admin login is locked.",
          },
    );
  } else if (host === "google") {
    const g = await txt(`google._domainkey.${domain}`);
    checks.push(
      g.some((t) => /p=/.test(t))
        ? { key: "dkim", label: "DKIM", level: "ok", detail: "Google Workspace DKIM key is published." }
        : { key: "dkim", label: "DKIM", level: "bad", detail: "DKIM is not set up.", fix: "Google Admin (admin.google.com) → Apps → Google Workspace → Gmail → Authenticate email → Generate new record (2048-bit) → add the TXT record google._domainkey in GoDaddy DNS → wait an hour → click Start authentication." },
    );
  } else {
    const found = (await Promise.all(["default", "selector1", "k1", "s1", "dkim"].map((s) => txt(`${s}._domainkey.${domain}`)))).some((r) => r.some((t) => /p=/.test(t)));
    checks.push(
      found
        ? { key: "dkim", label: "DKIM", level: "ok", detail: "A DKIM key is published." }
        : { key: "dkim", label: "DKIM", level: "warn", detail: "Couldn't find a DKIM key (the selector name depends on the email provider).", fix: "Ask the email provider (GoDaddy support) to switch on DKIM for this domain and give you the DNS record." },
    );
  }

  // DMARC — tells receivers what to do when SPF/DKIM fail; required by Gmail/Yahoo for senders.
  const dmarc = dmarcTxt.find((t) => /^v=DMARC1/i.test(t));
  if (!dmarc) {
    checks.push({ key: "dmarc", label: "DMARC", level: "bad", detail: "No DMARC record. Gmail and Yahoo now expect one from every sender.", fix: `Add a TXT record at GoDaddy, Name: _dmarc, Value: v=DMARC1; p=none; rua=mailto:dmarc@${domain}` });
  } else {
    checks.push({ key: "dmarc", label: "DMARC", level: "ok", detail: dmarc + (/p=none/i.test(dmarc) ? " (monitoring only, which is right for a new domain)" : "") });
  }

  const bad = checks.filter((c) => c.level === "bad").length;
  const warn = checks.filter((c) => c.level === "warn").length;
  return { domain, host, checks, score: Math.max(0, 100 - bad * 30 - warn * 10), checkedAt: new Date() };
}

// ── Warm-up and pacing ─────────────────────────────────────────────────────────
// A new mailbox that suddenly sends 40 emails looks like a spammer. Start small and grow every day,
// the way Apollo/Instantly ramp new inboxes: day 1 = 5, then +3 a day, up to the mailbox's limit.
const WARMUP_START = 5;
const WARMUP_STEP = 3;

function warmupDay(box, now = new Date()) {
  const start = new Date(box.warmupStartedAt || box.createdAt || now);
  return Math.max(1, Math.floor((now - start) / 86400000) + 1);
}

/** Emails this mailbox may send today, after warm-up. */
function effectiveDailyLimit(box, now = new Date()) {
  const limit = Number(box.dailyLimit) || 0;
  if (box.warmupEnabled === false) return limit;
  return Math.min(limit, WARMUP_START + (warmupDay(box, now) - 1) * WARMUP_STEP);
}

// Sending window: Monday–Friday, 8am–6pm UK time, like a person at work. Emails due outside it wait.
function ukParts(date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "numeric", hour12: false }).formatToParts(date);
  return { day: parts.find((p) => p.type === "weekday").value, hour: Number(parts.find((p) => p.type === "hour").value) % 24 };
}
function inSendingWindow(date = new Date()) {
  const { day, hour } = ukParts(date);
  return !["Sat", "Sun"].includes(day) && hour >= 8 && hour < 18;
}

// Gap after each email from the same mailbox: a random 4–9 minutes, so sends look human, not batched.
const MIN_GAP_MS = 4 * 60 * 1000;
const MAX_EXTRA_MS = 5 * 60 * 1000;
const nextSendAfter = (from = new Date()) => new Date(from.getTime() + MIN_GAP_MS + Math.floor(Math.random() * MAX_EXTRA_MS));

module.exports = { checkDomain, effectiveDailyLimit, warmupDay, inSendingWindow, nextSendAfter, WARMUP_START, WARMUP_STEP };
