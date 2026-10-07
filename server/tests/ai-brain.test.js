const test = require("node:test");
const assert = require("node:assert/strict");
const { buildInstructions } = require("../utils/aiBrain");
const { toE164UK } = require("../utils/phone");

const settings = {
  businessName: "Cleaniq Services",
  serviceArea: "Manchester and Greater Manchester, UK",
  instructions: "Be warm and professional.",
  transferNumber: "+447700900123",
};
const services = [
  { name: "Deep Clean", rate: 24.9, type: "hourly", category: "Base", description: "Thorough deep clean" },
  { name: "Single Oven Cleaning", rate: 15, type: "flat", category: "Extras" },
  { name: "Bedroom", rate: 12, type: "per_room", category: "Rooms" },
];
const knowledge = [{ title: "Opening hours", category: "Hours", content: "Mon–Sat 8am–6pm." }];
const now = new Date("2026-09-26T10:00:00Z");

test("includes live prices in pounds; rooms are not listed as a charge", () => {
  const p = buildInstructions({ channel: "whatsapp", settings, knowledge, services, now });
  assert.match(p, /Deep Clean: £24\.90 per hour \(Thorough deep clean\)/);
  assert.match(p, /Single Oven Cleaning: £15\.00 fixed price/);
  assert.doesNotMatch(p, /Bedroom: £/);
  assert.match(p, /Rooms \(bedrooms, bathrooms, etc\.\) are not charged separately/);
});

test("forbids made-up hour estimates on every channel", () => {
  for (const channel of ["whatsapp", "voice"]) {
    const p = buildInstructions({ channel, settings, knowledge, services, now });
    assert.match(p, /Never state typical, average or estimated hours/);
  }
});

test("booking rules only when the channel can book", () => {
  const withTools = buildInstructions({ channel: "whatsapp", settings, knowledge, services, now, canBook: true });
  assert.match(withTools, /call get_quote/);
  assert.match(withTools, /create_booking with customerConfirmed true/);
  assert.match(withTools, /on WhatsApp send ONE numbered list of only what's still missing/);
  // Read-back before anything is booked or sent, especially address and email.
  assert.match(withTools, /CONFIRMATION STEP — never skip it, never book before it/);
  assert.match(withTools, /especially your address and email/);
  assert.match(withTools, /How the cleaner gets in/);
  assert.match(withTools, /Cleaning supplies and equipment: shall we bring them \(£10\.00 per visit\)/);
  assert.match(withTools, /call find_my_bookings/);
  assert.match(withTools, /call reschedule_booking with customerConfirmed true/);
  assert.match(withTools, /Example of the booking pattern/);
  assert.match(withTools, /Never offer Morning, Afternoon or Evening/);
  assert.match(withTools, /Quotes: follow the same steps as our Quote Builder page/);
  assert.match(withTools, /Name, email and address are always needed for a quote \(the phone number is already known\)/);
  assert.match(withTools, /If someone asks for a quote or a total, follow the Quotes steps below/);
  assert.match(withTools, /call send_quote with customerConfirmed false/);
  assert.match(withTools, /Reply YES to have it emailed, or tell me what to change/);
  assert.match(withTools, /what time they'd like the cleaner to arrive/);
  assert.match(withTools, /Cleaning supplies & equipment: £10\.00 per visit if we bring them/);
  // the short-reply rule must not fight the booking list
  assert.match(withTools, /Exception: when collecting booking details or sending a booking summary, use a short numbered list/);
  const without = buildInstructions({ channel: "voice", settings, knowledge, services, now });
  assert.doesNotMatch(without, /create_booking/);
  assert.match(without, /You cannot confirm bookings/);
});

test("includes knowledge, staff instructions and UK time", () => {
  const p = buildInstructions({ channel: "whatsapp", settings, knowledge, services, now });
  assert.match(p, /### Opening hours \[Hours\]\nMon–Sat 8am–6pm\./);
  assert.match(p, /Be warm and professional\./);
  assert.match(p, /Saturday, 26 September 2026/);
  assert.match(p, /at 11:00/); // 10:00 UTC = 11:00 BST
});

test("voice prompt: named receptionist, transcription notice, honest if asked, saves enquiries, transfers", () => {
  const p = buildInstructions({ channel: "voice", settings, knowledge, services, now });
  assert.match(p, /^You are John, the receptionist for Cleaniq Services/);
  assert.match(p, /already heard a greeting from you \(John at Cleaniq Services\) saying calls are monitored/);
  assert.match(p, /Introduce yourself as "John from Cleaniq Services"\. Never call yourself an AI, an assistant, a bot/);
  assert.doesNotMatch(p, /virtual receptionist|AI assistant/);
  assert.match(p, /enquiry saved with save_enquiry so the team can call back/);
  assert.match(p, /one or two questions at a time/);
  assert.match(p, /check_availability/);
  assert.match(p, /transfer_to_human/);
  assert.match(p, /1–3 short spoken sentences/);
});

test("voice prompt falls back to a callback when no transfer number is set", () => {
  const p = buildInstructions({ channel: "voice", settings: { ...settings, transferNumber: "" }, knowledge, services, now });
  assert.doesNotMatch(p, /transfer_to_human/);
  assert.match(p, /call them back/);
});

test("handles an empty knowledge base and no prices", () => {
  const p = buildInstructions({ channel: "whatsapp", settings, knowledge: [], services: [], now });
  assert.match(p, /No extra business information has been added yet/);
  assert.match(p, /No prices are currently listed/);
});

test("rejects unknown channels", () => {
  assert.throws(() => buildInstructions({ channel: "sms", settings, knowledge, services }), /Unknown channel/);
});

test("normalises UK phone numbers to E.164", () => {
  assert.equal(toE164UK("07700 900123"), "+447700900123");
  assert.equal(toE164UK("447700900123"), "+447700900123");
  assert.equal(toE164UK("+44 7700 900-123"), "+447700900123");
  assert.equal(toE164UK("0044 7700 900123"), "+447700900123");
  assert.equal(toE164UK("0161 496 0000"), "+441614960000");
  assert.equal(toE164UK("hello"), "");
  assert.equal(toE164UK(""), "");
});

test("WhatsApp prompt uses the admin's receptionist name and ends enquiries in a booking, quote or saved enquiry", () => {
  const p = buildInstructions({ channel: "whatsapp", settings: { ...settings, assistantName: "Amy" }, knowledge, services, now, canBook: true });
  assert.match(p, /^You are Amy, the receptionist/);
  assert.match(p, /a booking made, a quote emailed, or an enquiry saved with save_enquiry/);
  assert.match(p, /48-hour re-clean guarantee/);
  assert.doesNotMatch(p, /John/);
});

test("receptionist names: parsed from AI Settings, one picked per call, invalid lists rejected", () => {
  const { agentNames, pickAgentName } = require("../utils/aiBrain");
  assert.deepEqual(agentNames({ assistantName: " John ,Mark,  James " }), ["John", "Mark", "James"]);
  assert.deepEqual(agentNames({}), ["John", "Mark", "James", "David"]);
  assert.equal(pickAgentName({ assistantName: "John, Mark" }, () => 0), "John");
  assert.equal(pickAgentName({ assistantName: "John, Mark" }, () => 0.99), "Mark");
  assert.equal(agentNames({ assistantName: "John, <script>" }, { strict: true }), null);
  assert.equal(agentNames({ assistantName: "" }, { strict: true }), null);
  assert.deepEqual(agentNames({ assistantName: "John, John, Mark" }, { strict: true }), ["John", "Mark"]);
  const p = buildInstructions({ channel: "voice", settings, knowledge, services, now, agentName: "Mark" });
  assert.match(p, /^You are Mark, the receptionist/);
});

test("price list says which services can be regular and at what price", () => {
  const svc = [
    { name: "Regular House Cleaning", type: "hourly", rate: 20.9, weeklyRate: 17.9, fortnightlyRate: 18.9 },
    { name: "Office Cleaning", type: "hourly", rate: 20.8 },
  ];
  const p = buildInstructions({ channel: "whatsapp", settings, knowledge, services: svc, now });
  assert.match(p, /Regular House Cleaning: £20\.90 per hour; that's the one-off price; it can also be booked weekly £17\.90 per hour, fortnightly £18\.90 per hour \(no other frequencies\)/);
  assert.match(p, /Office Cleaning: £20\.80 per hour; one-off only/);
});


test("phone calls can book and quote, with the address and email read back first", () => {
  const p = buildInstructions({ channel: "voice", settings, knowledge, services, now, canBook: true });
  assert.match(p, /book cleans \(create_booking\) and email written quotes \(send_quote\)/);
  assert.match(p, /spell the email address back letter by letter/);
  // Can't hear it after two tries: WhatsApp or text it to us.
  assert.match(p, /after asking twice, don't keep asking/);
  assert.match(p, /WhatsApp or text that to us on oh seven seven five two, four seven six, three six eight/);
  assert.match(p, /will WhatsApp\/text their email to \+44 7752 476368/);
  // On calls: just the area, never a postcode or full address (easily misheard).
  assert.match(p, /NEVER ask for a postcode or the full address/);
  assert.match(p, /which area they're in \(e\.g\. Salford/);
  assert.match(p, /our team will call or text them to take the full address/);
  assert.doesNotMatch(p, /call check_postcode on it straight away/);
  assert.match(p, /Never call create_booking or send_quote until the caller has said yes to the read-back/);
});


test("quotes ask the type of cleaning, hours, when, name, email, address and supplies — then confirm", () => {
  const p = buildInstructions({ channel: "whatsapp", settings, knowledge, services, now, canBook: true });
  assert.match(p, /1\. Type of cleaning .*\n  2\. How many hours\n  3\. When they'd like it: the date, and what time the cleaner should arrive\n  4\. Full name\n  5\. Email address/);
  assert.match(p, /Property address with postcode \(call check_postcode/);
  assert.match(p, /CONFIRMATION STEP — never skip it: send ONE summary with the type of cleaning, hours, date and arrival time, the customer's name, email/);
});
