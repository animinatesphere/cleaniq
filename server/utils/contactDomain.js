function extractDomainFromEmail(email) {
  if (!email || typeof email !== "string") return "";

  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === normalized.length - 1) return "";

  return normalized.slice(atIndex + 1);
}

function normalizeDomain(domain) {
  if (!domain || typeof domain !== "string") return "";

  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[\/?#]/)[0];
}

function resolveContactDomain(rawDomain, email) {
  const normalized = normalizeDomain(rawDomain);
  if (normalized) return normalized;
  return extractDomainFromEmail(email);
}

module.exports = {
  extractDomainFromEmail,
  normalizeDomain,
  resolveContactDomain,
};
