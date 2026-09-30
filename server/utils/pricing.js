// Hourly price for a service by how often it's booked. Weekly and fortnightly cleans can have
// their own price set in admin (Services page); if not set, the normal (one-off) price is used.
const FREQUENCY_FIELD = { Weekly: "weeklyRate", Fortnightly: "fortnightlyRate", "Bi-weekly": "fortnightlyRate" };

function rateForFrequency(service, frequency) {
  if (!service) return 0;
  const field = FREQUENCY_FIELD[frequency];
  const special = field ? Number(service[field]) : 0;
  return special > 0 ? special : Number(service.rate || 0);
}

// Accepts a number, "" or null from the admin form: returns a positive number or null (= use normal price).
function parseOptionalRate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 10000) throw new Error("Weekly/fortnightly price must be a number");
  return n > 0 ? Math.round(n * 100) / 100 : null;
}

module.exports = { rateForFrequency, parseOptionalRate };
