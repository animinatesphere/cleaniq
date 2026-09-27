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

test("supplies fee is added only when Cleaniq brings the supplies", () => {
  const withSupplies = calculateQuote(services, { service: "Deep Clean", hours: 3, suppliesProvidedBy: "Cleaniq" }, 10);
  assert.equal(withSupplies.total, 102.55);
  assert.deepEqual(withSupplies.extras.at(-1), { name: "Cleaning supplies & equipment", unitPrice: 10, qty: 1, subtotal: 10 });
  assert.equal(calculateQuote(services, { service: "Deep Clean", hours: 3, suppliesProvidedBy: "Customer" }, 10).total, 92.55);
  assert.equal(calculateQuote(services, { service: "Deep Clean", hours: 3, suppliesProvidedBy: "Cleaniq" }, 0).total, 92.55);
});

test("specific times are understood like the admin time picker", () => {
  const { normaliseTime } = require("../utils/aiTools");
  assert.equal(normaliseTime("10am"), "10:00");
  assert.equal(normaliseTime("2:30pm"), "14:30");
  assert.equal(normaliseTime("14:30"), "14:30");
  assert.equal(normaliseTime("12pm"), "12:00");
  assert.equal(normaliseTime("soon"), "");
});

test("arrival time + hours shown as a time window", () => {
  const { formatWindow } = require("../utils/aiTools");
  assert.equal(formatWindow("08:00", 4), "8am–12pm");
  assert.equal(formatWindow("09:30", 3), "9:30am–12:30pm");
  assert.equal(formatWindow("14:00", 2.5), "2pm–4:30pm");
  assert.equal(formatWindow("10:00"), "10am");
});

test("rooms can't be added as paid extras", () => {
  assert.match(calculateQuote(services, { service: "Deep Clean", hours: 2, extras: [{ name: "Bedroom" }] }).error, /Unknown extra/);
});

test("rejects unknown services and bad hours with a helpful message", () => {
  assert.match(calculateQuote(services, { service: "Window cleaning", hours: 2 }).error, /Choose one of: End of Tenancy, Deep Clean/);
  assert.match(calculateQuote(services, { service: "Deep Clean", hours: 0 }).error, /between 1 and 50/);
  assert.match(calculateQuote(services, { service: "Deep Clean", hours: 51 }).error, /between 1 and 50/);
});

test("recognises when the customer confirms a booking or reschedule", () => {
  const { confirmationTool } = require("../utils/aiTools");
  const summary = { role: "ai", text: "Here's your booking:\nDeep Clean, 3 hours\nTotal: £92.55\nReply YES to book it." };
  const move = { role: "ai", text: "Move BK-1234 to Tuesday 30 September, 10am–1pm? Reply YES" };
  assert.equal(confirmationTool([summary, { role: "customer", text: "Yes" }]), "create_booking");
  assert.equal(confirmationTool([summary, { role: "customer", text: "yes please book it" }]), "create_booking");
  assert.equal(confirmationTool([summary, { role: "customer", text: "ok go ahead" }]), "create_booking");
  assert.equal(confirmationTool([move, { role: "customer", text: "yes" }]), "reschedule_booking");
  assert.equal(confirmationTool([summary, { role: "customer", text: "no, change it to 4 hours" }]), null);
  assert.equal(confirmationTool([summary, { role: "customer", text: "yes but can you also add oven cleaning and move it to 10am on Friday instead please" }]), null);
  assert.equal(confirmationTool([{ role: "ai", text: "Would you like a quote?" }, { role: "customer", text: "yes" }]), null);
});
