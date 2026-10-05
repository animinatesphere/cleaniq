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
  const quote = { role: "ai", text: "Deep Clean: 3h × £30.85 = £92.55\nVAT: £18.51\nTotal: £111.06\nReply YES to have the quote emailed to you." };
  assert.equal(confirmationTool([quote, { role: "customer", text: "yes please" }]), "send_quote");
  assert.equal(confirmationTool([summary, { role: "customer", text: "no, change it to 4 hours" }]), null);
  assert.equal(confirmationTool([summary, { role: "customer", text: "yes but can you also add oven cleaning and move it to 10am on Friday instead please" }]), null);
  assert.equal(confirmationTool([{ role: "ai", text: "Would you like a quote?" }, { role: "customer", text: "yes" }]), null);
});

test("a yes after the new quote summary sends the quote; after a booking summary it books", () => {
  const { confirmationTool } = require("../utils/aiTools");
  const quoteSummary = { role: "ai", text: "1. Name: Jane Smith\n2. Email: jane@example.com\nTotal: £111.06\nPlease check everything, especially your email address — that's where the quote will go. Reply YES to have it emailed, or tell me what to change." };
  const bookingSummary = { role: "ai", text: "Please check your booking:\n1. Name: Jane Smith\n4. Address: 12 Oak Road, Manchester M14 5TQ\nTotal: £102.55\nPlease check everything, especially your address and email. Reply YES if it's all correct, or tell me what to change." };
  assert.equal(confirmationTool([quoteSummary, { role: "customer", text: "yes" }]), "send_quote");
  assert.equal(confirmationTool([bookingSummary, { role: "customer", text: "Yes please" }]), "create_booking");
});

test("the Calls/Conversations log records who, email, address and what was booked or quoted", () => {
  const { describeToolResult } = require("../utils/aiTools");
  const b = describeToolResult("create_booking",
    { firstName: "Jane", lastName: "Smith", email: "jane@example.com", address: "12 Oak Road, Manchester M14 5TQ", service: "Deep Clean", hours: 3, frequency: "Monthly" },
    { bookingRef: "BK-1234", total: 102.55, when: "2026-10-12 8am–11am" });
  assert.equal(b.detail, "Booking BK-1234 created · Jane Smith · jane@example.com · 12 Oak Road, Manchester M14 5TQ · Deep Clean, 3h, Monthly · 2026-10-12 8am–11am · £102.55");
  const q = describeToolResult("send_quote",
    { customerName: "Jane Smith", email: "jane@example.com", address: "12 Oak Road, Manchester M14 5TQ", services: [{ service: "End of Tenancy Cleaning", hours: 4 }] },
    { quoteRef: "CLQ-123456", grandTotal: 150 });
  assert.equal(q.detail, "Quote CLQ-123456 emailed · Jane Smith · jane@example.com · 12 Oak Road, Manchester M14 5TQ · End of Tenancy Cleaning 4h · £150.00");
});

test("a made-up booking reference is caught: the AI is asked again, then a safe reply", async () => {
  const { guardInventedRefs, trackRefs, refsIn } = require("../utils/aiTools");
  assert.deepEqual(refsIn("Your booking BK-1234567 is confirmed; quote CLQ-998877 too"), ["BK-1234567", "CLQ-998877"]);

  // Real: the tool returned it.
  const known = new Set();
  const run = trackRefs(async () => ({ bookingRef: "BK-4821" }), known);
  await run("create_booking", {});
  assert.deepEqual(await guardInventedRefs("Booked! Your reference is BK-4821.", known, async () => "x"), { reply: "Booked! Your reference is BK-4821." });

  // Made up, fixed on the retry (which calls the tool and gets a real reference).
  const notes = [];
  const fixed = await guardInventedRefs("Your booking is confirmed: BK-1234567.", known, async (note) => { notes.push(note); return "All booked — reference BK-4821."; });
  assert.equal(fixed.reply, "All booked — reference BK-4821.");
  assert.match(notes[0], /no tool created it — nothing has been booked or sent/);

  // Still made up: safe reply, flagged for the team.
  const stillBad = await guardInventedRefs("Confirmed: BK-1234567.", known, async () => "Confirmed: BK-7654321.");
  assert.equal(stillBad.flagged, true);
  assert.match(stillBad.reply, /A member of our team will confirm the details with you shortly/);
});

test("nothing is spoken with asterisks, bullets or arrows", () => {
  const { speakable } = require("../utils/voice");
  assert.equal(speakable("**Booking reference:** BK-1234\n- **Date:** Thursday"), "Booking reference: BK-1234\nDate: Thursday");
  assert.equal(speakable("6 hours → £135.00"), "6 hours  to  £135.00");
});
