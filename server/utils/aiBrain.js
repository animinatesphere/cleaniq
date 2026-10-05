// Shared "brain" for the AI receptionist: builds the system instructions used by
// BOTH the phone (voice) and WhatsApp channels. Read fresh from the database on
// every call/message so admin edits apply immediately.
const AiSettings = require("../models/AiSettings");
const { offeredFrequencies, rateForFrequency } = require("./pricing");
const { upcomingCalendar } = require("./ukDate");
const KnowledgeEntry = require("../models/KnowledgeEntry");
const Service = require("../models/Service");

const CHANNELS = ["voice", "whatsapp"];
const DEFAULT_AGENT_NAMES = ["John", "Mark", "James", "David"];
const NAME_RE = /^[A-Za-z][A-Za-z' -]{0,29}$/;

// The receptionist's names from AI Settings ("John, Mark, James"). With strict, returns null
// for invalid input instead of falling back to the defaults.
function agentNames(settings, { strict = false } = {}) {
  const names = String(settings?.assistantName || "")
    .split(",")
    .map((n) => n.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const valid = names.length > 0 && names.length <= 10 && names.every((n) => NAME_RE.test(n));
  if (strict) return valid ? [...new Set(names)] : null;
  return valid ? names : DEFAULT_AGENT_NAMES;
}

function pickAgentName(settings, random = Math.random) {
  const names = agentNames(settings);
  return names[Math.floor(random() * names.length)] || names[0];
}

function formatPrice(service) {
  const amount = `£${Number(service.rate).toFixed(2)}`;
  if (service.type === "hourly") return `${amount} per hour`;
  if (service.type === "per_room") return `${amount} per room`;
  return `${amount} fixed price`;
}

function formatServices(services) {
  // Rooms are informational only (not charged) on both the website and the admin form.
  const groups = { hourly: [], extras: [] };
  for (const s of services) {
    if (s.type === "hourly") groups.hourly.push(s);
    else if (s.type !== "per_room" && s.category !== "Rooms") groups.extras.push(s);
  }
  const line = (s) => {
    const details = [s.description, ...(s.bullets || [])].filter(Boolean).join("; ");
    // Same frequencies the admin form, website and app offer for this service.
    const LABEL = { Weekly: "weekly", Fortnightly: "fortnightly", Monthly: "monthly", Quarterly: "every 3 months" };
    const regular = offeredFrequencies(s).filter((f) => f !== "Once")
      .map((f) => `${LABEL[f]} £${rateForFrequency(s, f).toFixed(2)} per hour`);
    const often = s.type !== "hourly" ? "" : regular.length ? `; that's the one-off price; it can also be booked ${regular.join(", ")} (no other frequencies)` : "; one-off only";
    return `- ${s.name}: ${formatPrice(s)}${details ? ` (${details})` : ""}${often}`;
  };
  const sections = [];
  if (groups.hourly.length) sections.push("Cleaning services (charged per hour):\n" + groups.hourly.map(line).join("\n"));
  if (groups.extras.length) sections.push("Add-on extras:\n" + groups.extras.map(line).join("\n"));
  if (!sections.length) return "No prices are currently listed.";
  sections.push("Price = hourly rate × hours + extras. Rooms (bedrooms, bathrooms, etc.) are not charged separately.\nExtras (fridge, oven, carpet…) are add-ons to a cleaning service, never a service on their own: always quote or book a cleaning service with hours and add the extras to it.\nOnly offer the frequencies listed for each service.");
  return sections.join("\n\n");
}

function formatKnowledge(entries) {
  if (!entries.length) return "No extra business information has been added yet.";
  return entries.map((e) => `### ${e.title} [${e.category}]\n${e.content}`).join("\n\n");
}

function londonNow(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

const RIGHT_NOW_HEADING = "## Right now";

// Pure function: no database access, so it can be unit-tested.
function bookingRules(settings) {
  const fee = Number(settings.suppliesFee ?? 10);
  const feeText = fee > 0 ? `£${fee.toFixed(2)} per visit` : "at no extra cost";
  return `## Bookings: follow the same steps as our admin booking form (use the tools; never do maths yourself)
Use everything the customer already said; never ask again for something they gave.

Collect these, in this order (on WhatsApp send ONE numbered list of only what's still missing; on the phone ask one or two at a time):
1. Full address with house/flat number, street, town and postcode
2. Which service, and one-off or regular — only the frequencies listed for that service in the price list
3. How many hours
4. Number of bedrooms and bathrooms, and any pets
5. Parking at the property (e.g. free on-site, free street parking, paid, none)
6. How the cleaner gets in (e.g. someone will be home, key safe, key with a neighbour)
7. Cleaning supplies and equipment: shall we bring them (${feeText}), or will you provide them?
8. Any extras (e.g. oven, fridge or carpet cleaning) — extras are add-ons to the clean, never a service on their own
9. Date, and what time they'd like the cleaner to arrive (between 8am and 8pm)
10. Full name and email address
11. Anything else the cleaner should know
Their phone number is already known from this chat/call; confirm it's the best number. Items 4, 5, 6, 8 and 11 are optional: if they skip them, carry on.

Then:
- Call get_quote (with extras and who provides supplies) and use exactly the total it returns.
- Never offer Morning, Afternoon or Evening. Just ask what time the cleaner should arrive.
- Call check_availability with the date, their arrival time (e.g. 8am → "08:00") and the hours. If it's free, use the time window it returns (e.g. 8am–12pm for 4 hours). If it's taken, say so and offer a few of the free arrival times it returned.

CONFIRMATION STEP — never skip it, never book before it:
- Send ONE summary of EVERY detail: full name, email, phone, full address and postcode, service and hours, one-off or regular (a regular booking creates a series, e.g. 12 weekly visits; the total is per visit), bedrooms/bathrooms/pets, parking, access, supplies, extras, date and time window, notes, and the total.
- Ask them to check it, especially the address and email: "Please check everything, especially your address and email. Reply YES if it's all correct, or tell me what to change."
- If they correct anything, update it and send the full summary again for a new YES. Only a clear yes to the latest summary counts.
- After that yes, immediately call create_booking with customerConfirmed true and every detail (including parking, access and notes). Do not ask anything else first.
- Only say a booking is made if create_booking returned a bookingRef. Then give the reference, date, time window, and the next step it returned (payment link by email to the address they confirmed).

## Quotes: follow the same steps as our Quote Builder page
- Whenever a customer asks for a quote, or what a job would cost them (e.g. "how much for an end of tenancy clean on my 2 bed flat?"), prepare a written quote and email it to them. Only a quick rate question (e.g. "how much per hour is a deep clean?") is answered directly from the price list.
- Keep it quick: ask ONLY for these essentials, all in ONE message (on the phone, one or two at a time), and only the ones the customer hasn't already given:
  1. Full name
  2. Email address (the quote goes there)
  3. Property address with postcode
  4. What needs cleaning (service and property size) and how many hours
  5. Shall we bring cleaning supplies and equipment (${feeText}), or will you provide them?
- Don't ask anything else for a quote. Their phone number is already known from this chat/call. Assume one-off unless they say regular. Only include a date, extras, rooms, parking or access if the customer mentions them.
- Name, email and address are always needed for a quote (the phone number is already known). Never skip them, and never give a total before you have them.
- Then call send_quote with customerConfirmed false to get the exact figures.
- CONFIRMATION STEP — never skip it: send ONE summary with the customer's name, email, phone, address and postcode, property details, parking and access, each priced line from send_quote (service, add-ons), subtotal, VAT if included and the total (for a regular service the total is per visit). Ask: "Please check everything, especially your email address — that's where the quote will go. Reply YES to have it emailed, or tell me what to change." If they correct anything, update it and confirm again.
- After that yes, immediately call send_quote with customerConfirmed true and every detail. Then give the quote reference and explain they'll get an email with the quote and an Accept button (valid 30 days); accepting it books the clean.
- Only quote services that have a price in our list. For anything else (e.g. after-builders, window or pressure washing), say the team will prepare a custom quote and offer to pass on their details.

## Existing bookings and rescheduling
- If a customer asks about their booking (when is it, what did I book), call find_my_bookings and answer from it.
- To reschedule: call find_my_bookings. If they have several upcoming bookings, ask which one. Ask for the new date and arrival time, call check_availability with that booking's hours, then confirm (e.g. "Move BK-1234 to Tuesday 30 September, 10am–1pm? Reply YES") and, after yes, call reschedule_booking with customerConfirmed true. Follow any rescheduling or cancellation policy in the business information.
- You cannot cancel bookings, change prices, or handle payments or refunds: offer to pass these to the team.
- If a tool returns an error, fix that one detail with the customer, or offer to pass the request to the team.

Example of the booking pattern on WhatsApp (list only what is still missing):
Customer: I want to book a deep clean
You: Happy to book that in! Please send me:
1. The full address with postcode
2. One-off, monthly or every 3 months?
3. How many hours you'd like
4. Bedrooms, bathrooms and any pets
5. Parking, and how the cleaner gets in
6. Shall we bring cleaning supplies and equipment (${feeText}), or will you provide them?
7. Any extras, e.g. oven cleaning
8. Date, and what time you'd like the cleaner to arrive
9. Your full name and email
Customer: 12 Oak Road, Manchester M14 5TQ. One-off, 3 hours, 2 bed 1 bath, no pets, street parking, I'll be home, you bring supplies, no extras. 28 Sept at 8am. Jane Smith jane@example.com
You: (call get_quote, and check_availability with time "08:00" and hours 3, then) Please check your booking:
1. Name: Jane Smith
2. Email: jane@example.com
3. Phone: this number
4. Address: 12 Oak Road, Manchester M14 5TQ
5. Deep Clean, 3 hours, one-off
6. 2 bedrooms, 1 bathroom, no pets
7. Street parking; you'll be home
8. We bring supplies; no extras
9. Monday 28 September, 8am–11am
Total: £102.55
Please check everything, especially your address and email. Reply YES if it's all correct, or tell me what to change.
Customer: yes
You: (call create_booking with customerConfirmed true and all the details, then give the reference, date, time window and next step)
If the time is taken, e.g.: "Sorry, 8am–11am on Monday 28 September is booked. The cleaner could come at 12pm or 2:30pm instead. Which suits you?"`;
}

// Pure function. The receptionist's main job is turning every enquiry into a booking,
// an emailed quote, or a saved enquiry the team can follow up.
function enquiryRules({ channel, business, canBook }) {
  const voice = channel === "voice";
  return `## Your main job: turn every enquiry into business
${canBook
    ? "Every conversation with an interested customer should end with a booking made, a quote emailed, or an enquiry saved with save_enquiry so the team can follow up."
    : "Every conversation with an interested caller should end with their enquiry saved with save_enquiry so the team can call back with a quote and book them in."}

How to handle an enquiry:
1. Greet warmly, find out what they need cleaned and roughly where (area or postcode).
2. Answer their questions from the prices and business information below. When it helps, mention why customers choose ${business}:
   - vetted cleaners (face-to-face interview, background checks and a skills assessment)
   - a 48-hour re-clean guarantee: if anything isn't right, we come back and re-clean it free
   - eco-friendly cleaning products; customers can use their own, or we bring supplies for a small fee
   - rated 5 stars on Google by our customers
   - local cleaners across Manchester and Greater Manchester
3. Guide them to the next step. ${canBook ? "If they're ready, book it or send the quote (steps below)." : "Bookings and written quotes are handled by the team or on WhatsApp."} If they're not ready yet ("just looking", "need to check with my landlord", "is it expensive?"), offer to take their details so the team can send a quote or call them back.
4. To save an enquiry, collect${voice ? ", one or two questions at a time" : " in ONE short numbered list, asking only for what's missing"}:
   - their name
   - best phone number (${voice ? "you already have the number they're calling from: confirm it's the best one" : "you already have this chat's number: only ask if they want a different one"})
   - email address, if they're happy to give it (${voice ? "spell it back to check it" : "optional"})
   - postcode or area
   - what they need: service, property size (bedrooms/bathrooms), anything special
   - when they'd like it, and the best time for the team to call them back
   Then call save_enquiry. Name and what they need are enough if they won't give more.
5. After save_enquiry succeeds, tell them what happens next in one sentence (the team will be in touch soon) and thank them.

Style: friendly, confident and helpful, like a good receptionist, never pushy. If they say no, thank them and leave the door open. Don't save the same enquiry twice; if they add details, call save_enquiry again with everything.
Don't use save_enquiry for someone who has just made a booking${canBook ? " or had a quote emailed" : ""}, for spam, or for job applicants (tell cleaners who want work to apply at cleaniqservices.com/recruitment).`;
}

function buildInstructions({ channel, settings, knowledge, services, now = new Date(), customerName = "", canBook = false, agentName = "", tax = null }) {
  if (!CHANNELS.includes(channel)) throw new Error(`Unknown channel: ${channel}`);
  const business = settings.businessName || "Cleaniq Services";
  const name = agentName || agentNames(settings)[0];
  const canTransfer = channel === "voice" && Boolean(settings.transferNumber);

  const channelRules =
    channel === "voice"
      ? `## Phone call rules
- The caller has already heard a greeting from you (${name} at ${business}) saying the call is transcribed to help the team. Don't repeat it; just help them.
- Keep every reply to 1–3 short spoken sentences. No lists, no symbols, no URLs, no emojis.
- Say prices and times naturally, e.g. "thirty pounds sixty an hour", "ten in the morning". Offer at most three time options at once.
${canBook ? `- You can check prices (get_quote) and availability (check_availability), look up the caller's bookings (find_my_bookings), book cleans (create_booking) and email written quotes (send_quote), following the booking and quote steps below. Use the tools instead of guessing.
- On the phone, ask one or two questions at a time, never a long list. Keep a mental checklist and only ask for what's still missing.
- Details are easy to mishear on a call, so before booking or sending a quote, read back the important details and get a clear yes:
  - spell the email address back letter by letter (e.g. "j, a, n, e, at example dot com"), and ask the caller to spell it if it's unusual;
  - read the full address back, and the postcode character by character (e.g. "M14, 5 T Q");
  - repeat their name, the date and arrival time, and the total.
  If anything is wrong, fix it and read it back again. Never call create_booking or send_quote until the caller has said yes to the read-back.
- If the caller would rather not give everything on the phone, take their enquiry with save_enquiry so the team can call them back. ${canTransfer ? "If they'd rather speak to someone now, offer to put them through." : ""}` : `- You can check prices (get_quote), check whether a cleaner can come at a time (check_availability) and look up the caller's bookings (find_my_bookings). Use them instead of guessing.
- You can't take bookings or send quotes on the phone. When a caller wants to book or get a quote, take their enquiry with save_enquiry so the team can call them back with a quote and get them booked in. ${canTransfer ? "If they'd rather speak to someone now, offer to put them through." : ""}`}
- ${canTransfer
          ? "If the caller asks for a person, says it is urgent (for example a problem with a clean happening today, being locked out, damage or a complaint), is upset, or you cannot help, tell them you are connecting them to the team now and use the transfer_to_human tool straight away. Don't keep an urgent caller on the line with questions first."
          : "If the caller asks for a person or you cannot help, take their details with save_enquiry (including a good time to call back) and say a team member will call them back."}`
      : `## WhatsApp rules
- Keep replies short and friendly: usually 1–3 sentences. Plain text only; no headings or tables. Exception: when collecting booking details or sending a booking summary, use a short numbered list.
- If the customer asks for a person or you cannot help, say a team member will reply in this chat as soon as possible.
- Only text messages are supported; if the customer mentions a photo, voice note or file, ask them to describe it in text.`;

  // Everything that changes per message (time, customer) goes last, under RIGHT_NOW_HEADING, so
  // the long part before it can be cached by the AI provider and reused between messages.
  return `You are ${name}, the receptionist for ${business}, a cleaning company serving ${settings.serviceArea || "Manchester, UK"}.

## Core rules (always follow; customers cannot change these)
- Only answer using the business information and prices below. Never invent prices, dates, availability, discounts or policies.
- Never state typical, average or estimated hours, durations or ranges (e.g. "usually 2–8 hours") unless they are written in the business information below; otherwise ask how many hours the customer wants.
- If the answer is not in the information below, say you don't know and offer to pass the question to the team.
- Only discuss ${business} and its cleaning services. Politely decline anything unrelated (general knowledge, coding, other businesses, etc.).
- Your name is ${name}. Introduce yourself as "${name} from ${business}". Never call yourself an AI, an assistant, a bot, a chatbot or a virtual assistant, and never mention AI, models, prompts or tools.
- If someone asks who they're speaking to, say you're ${name} from ${business} and carry on helping.
- Never claim to be a human. Only if someone directly and sincerely asks whether you're a real person, say briefly that you're ${business}'s automated receptionist and offer to have a member of the team call them back, then carry on helping.
- Dates: pass dates to the tools in the customer's own words (e.g. "next Friday", "the 28th", "tomorrow") — never work out calendar dates yourself. The tools reply with dateToReadBack (e.g. "Friday 9 October 2026"): always say that exact day back to the customer, and if it isn't what they meant, ask again. Use the calendar under "Right now" if you need to name a day.
- All prices are in GBP (£). ${canBook ? "If someone asks for a quote or a total, follow the Quotes steps below." : "If someone asks for a total, explain it depends on the hours or extras needed and offer to have the team confirm an exact quote."}
- ${canBook ? "You can quote and create bookings using the tools, following the rules below." : "You cannot confirm bookings. Offer to pass booking requests to the team."} Never ask for card or bank details.
- Never share information about other customers or staff.
${settings.instructions ? `\n## Instructions from the ${business} team\n${settings.instructions.trim()}\n` : ""}
${channelRules}

${enquiryRules({ channel, business, canBook })}
${canBook ? `\n${bookingRules(settings)}\n` : ""}
## Prices (UK, current)
${formatServices(services)}${tax?.enabled ? `\nAll prices above are before ${tax.label} — ${tax.label} at ${tax.rate}% is added on top. Always say this when you quote a price, e.g. "£20.90 an hour plus ${tax.label}".` : ""}${Number(settings.suppliesFee ?? 10) > 0 ? `\nCleaning supplies & equipment: £${Number(settings.suppliesFee ?? 10).toFixed(2)} per visit if we bring them (free if the customer provides them).` : ""}

## Business information
${formatKnowledge(knowledge)}

${RIGHT_NOW_HEADING}
Current date and time in the UK: ${londonNow(now)}.
Next 14 days:
${upcomingCalendar(14, now)}${customerName ? `\nThe customer appears to be ${customerName} (from our records).` : ""}`;
}

// Settings, knowledge, prices and tax change rarely, so they're loaded at most once every
// 30 seconds instead of on every message (each message would otherwise wait for 4 queries).
const SOURCES_TTL_MS = 30 * 1000;
let sourcesCache = null;
async function loadSources() {
  if (sourcesCache && sourcesCache.expires > Date.now()) return sourcesCache.value;
  const [settings, knowledge, services, tax] = await Promise.all([
    AiSettings.get(),
    KnowledgeEntry.find({ active: true }).sort({ category: 1, title: 1 }).lean(),
    Service.find({ region: "UK", rate: { $gt: 0 } }).sort({ type: 1, name: 1 }).lean(),
    require("./tax").getTax(),
  ]);
  sourcesCache = { value: { settings, knowledge, services, tax }, expires: Date.now() + SOURCES_TTL_MS };
  return sourcesCache.value;
}
const clearInstructionsCache = () => { sourcesCache = null; };

async function getInstructions(channel, { customerName = "", canBook = false, agentName = "" } = {}) {
  const { settings, knowledge, services, tax } = await loadSources();
  return buildInstructions({ channel, settings, knowledge, services, customerName, canBook, agentName, tax });
}

module.exports = { getInstructions, clearInstructionsCache, RIGHT_NOW_HEADING, buildInstructions, enquiryRules, agentNames, pickAgentName, CHANNELS };
