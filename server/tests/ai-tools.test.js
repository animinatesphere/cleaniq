const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateQuote } = require("../utils/aiTools");

const services = [
  { name: "End of Tenancy", type: "hourly", rate: 30.6, category: "Base" },
  { name: "Deep Clean", type: "hourly", rate: 30.85, category: "Base" },
  { name: "Single Oven Cleaning", type: "flat", rate: 62.5, category: "Extras" },
  { name: "Carpet(s) Cleaning", type: "flat", rate: 75.8, category: "Extras" },
  { name: "Bedroom", type: "flat", rate: 20, category: "Rooms" },
];

test("quote = hourly rate × hours + extras (same as the admin form)", () => {
  const q = calculateQuote(services, {
    service: "end of tenancy",
    hours: 6,
    extras: [{ name: "Single Oven Cleaning" }, { name: "carpet(s) cleaning", qty: 2 }],
  });
  assert.equal(q.service, "End of Tenancy");
  assert.equal(q.labour, 183.6);
  assert.deepEqual(q.extras.map((e) => [e.name, e.qty, e.subtotal]), [["Single Oven Cleaning", 1, 62.5], ["Carpet(s) Cleaning", 2, 151.6]]);
  assert.equal(q.total, 397.7);
});

test("rooms can't be added as paid extras", () => {
  assert.match(calculateQuote(services, { service: "Deep Clean", hours: 2, extras: [{ name: "Bedroom" }] }).error, /Unknown extra/);
});

test("rejects unknown services and bad hours with a helpful message", () => {
  assert.match(calculateQuote(services, { service: "Window cleaning", hours: 2 }).error, /Choose one of: End of Tenancy, Deep Clean/);
  assert.match(calculateQuote(services, { service: "Deep Clean", hours: 0 }).error, /between 1 and 50/);
  assert.match(calculateQuote(services, { service: "Deep Clean", hours: 51 }).error, /between 1 and 50/);
});
