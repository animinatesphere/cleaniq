// Weekly/fortnightly prices set in admin (Services), falling back to the normal one-off price.
//   node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { rateForFrequency, parseOptionalRate } = require("../utils/pricing");
const { calculateQuote } = require("../utils/aiTools");

const regular = { name: "Regular House Cleaning", type: "hourly", rate: 20.9, weeklyRate: 17.9, fortnightlyRate: 18.9 };
const deep = { name: "Deep Cleaning", type: "hourly", rate: 30.85, weeklyRate: null, fortnightlyRate: 0 };

test("one-off uses the normal price; weekly/fortnightly use theirs when set", () => {
  assert.equal(rateForFrequency(regular, "Once"), 20.9);
  assert.equal(rateForFrequency(regular, undefined), 20.9);
  assert.equal(rateForFrequency(regular, "Weekly"), 17.9);
  assert.equal(rateForFrequency(regular, "Fortnightly"), 18.9);
  assert.equal(rateForFrequency(regular, "Bi-weekly"), 18.9);
  assert.equal(rateForFrequency(regular, "Monthly"), 20.9);
  assert.equal(rateForFrequency(deep, "Weekly"), 30.85, "not set → normal price");
  assert.equal(rateForFrequency(deep, "Fortnightly"), 30.85, "0 → normal price");
});

test("admin input: empty clears, numbers are rounded, rubbish is rejected", () => {
  assert.equal(parseOptionalRate(undefined), undefined);
  assert.equal(parseOptionalRate(""), null);
  assert.equal(parseOptionalRate(null), null);
  assert.equal(parseOptionalRate("0"), null);
  assert.equal(parseOptionalRate("17.899"), 17.9);
  assert.throws(() => parseOptionalRate("abc"));
  assert.throws(() => parseOptionalRate(-5));
});

test("AI quotes use the weekly price for a weekly clean", () => {
  const q = calculateQuote([regular], { service: "Regular House Cleaning", hours: 2, frequency: "Weekly" });
  assert.equal(q.hourlyRate, 17.9);
  assert.equal(q.total, 35.8);
  assert.equal(calculateQuote([regular], { service: "Regular House Cleaning", hours: 2 }).total, 41.8);
});
