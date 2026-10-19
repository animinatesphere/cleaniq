// Hourly price for a service by how often it's booked. Regular frequencies have their own price set
// in admin (Services page). A frequency is only offered to customers for a service when its price is
// set (One-off is always offered); if a price is missing the normal (one-off) price is used.
const FREQUENCY_FIELD = {
  Weekly: "weeklyRate",
  Fortnightly: "fortnightlyRate",
  "Bi-weekly": "fortnightlyRate",
  Monthly: "monthlyRate",
  Quarterly: "quarterlyRate",
};
const REGULAR_FREQUENCIES = ["Weekly", "Fortnightly", "Monthly", "Quarterly"];

// Always offered for these services; a frequency without its own price uses the one-off price.
// Same rule in the website (Booking.jsx) and customer app (BookingScreen.js).
function defaultFrequencies(name = "") {
  const n = String(name).toLowerCase();
  if (n.includes("regular")) return ["Weekly", "Fortnightly", "Monthly"];
  if (n.includes("deep")) return ["Monthly", "Quarterly"];
  return [];
}

// Frequencies a customer can book for this service: One-off, the defaults above (Regular: weekly,
// fortnightly, monthly; Deep: monthly, every 3 months) and any other frequency admin has priced.
function offeredFrequencies(service) {
  const priced = REGULAR_FREQUENCIES.filter((f) => Number(service?.[FREQUENCY_FIELD[f]]) > 0);
  const defaults = defaultFrequencies(service?.name);
  return ["Once", ...REGULAR_FREQUENCIES.filter((f) => priced.includes(f) || defaults.includes(f))];
}

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

module.exports = { rateForFrequency, parseOptionalRate, offeredFrequencies, defaultFrequencies, FREQUENCY_FIELD, REGULAR_FREQUENCIES };
