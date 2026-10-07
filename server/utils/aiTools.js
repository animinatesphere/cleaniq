// Tools the AI receptionist can call. They follow the admin "New booking" form step by step
// (NewBookingPage.jsx), so the AI never does its own maths and bookings behave exactly like
// staff-created ones. Rescheduling uses the same code as the admin reschedule.
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const AiSettings = require("../models/AiSettings");
const { toE164UK } = require("./phone");
const { rateForFrequency, offeredFrequencies } = require("./pricing");
const { resolveUkDate } = require("./ukDate");

// Checks a postcode is real before it's used (UK postcodes end with a number and two letters,
// e.g. M5 4EE). Returns an error for the AI to fix with the customer, or the tidy postcode.
async function checkPostcode(text) {
  const { postcodeStatus } = require("./geo");
  const r = await postcodeStatus(text);
  if (r.status === "invalid") {
    return {
      error: r.postcode
        ? `${r.postcode} isn't a real UK postcode. Ask the customer to say it again slowly, letter by letter (UK postcodes end with a number and two letters, e.g. M5 4EE).`
        : "That isn't a complete UK postcode. Ask for the full postcode — it ends with a number and two letters, e.g. M5 4EE.",
    };
  }
  return { postcode: r.postcode, checked: r.status === "valid" };
}

// Same rule as the admin form, website and app: a service is only offered at its own frequencies
// (Regular: weekly/fortnightly, Deep: monthly/every 3 months, others one-off — or whatever admin priced).
const FREQ_LABEL = { Once: "one-off", Weekly: "weekly", Fortnightly: "fortnightly", Monthly: "monthly", Quarterly: "every 3 months" };
function frequencyProblem(base, frequency) {
  const f = frequency || "Once";
  const offered = offeredFrequencies(base);
  if (offered.includes(f)) return null;
  return `${base.name} isn't offered ${FREQ_LABEL[f] || String(f).toLowerCase()}. It can be booked: ${offered.map((x) => FREQ_LABEL[x] || x).join(", ")}.`;
}
// Quote Builder frequencies (lower case) → booking frequencies.
const QUOTE_TO_FREQ = { once: "Once", weekly: "Weekly", biweekly: "Fortnightly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" };
const Lead = require("../models/Lead");

const FREQUENCIES = ["Once", "Weekly", "Fortnightly", "Monthly", "Quarterly", "Yearly"];
// How many bookings the recurring series creates (same as the admin form's note).
const SERIES_SIZE = { Weekly: 12, Fortnightly: 12, Monthly: 12, Quarterly: 4, Yearly: 2 };
// Same specific start times as the admin form: 08:00–20:00 every 30 minutes.
const SPECIFIC_TIMES = Array.from({ length: 25 }, (_, i) => {
  const mins = 8 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});
// Every booking blocks its time except these (the admin form blocks on any booking at all).
const NON_BLOCKING_STATUSES = ["Cancelled", "Rejected"];
const RESCHEDULABLE_STATUSES = ["Pending", "Confirmed", "Authorized", "Accepted", "Assigned"];
const SUPPLIES_LINE = "Cleaning supplies & equipment";
const MAX_AI_BOOKINGS_PER_PHONE_PER_DAY = 2;

const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const money = (n) => Math.round(n * 100) / 100;
// Existing bookings made with a part of the day block those hours.
const SLOT_WINDOWS = { Morning: [8 * 60, 12 * 60], Afternoon: [12 * 60, 16 * 60], Evening: [16 * 60, 20 * 60] };
const REST_MINUTES = 30; // gap the admin keeps after every job
// 480 → "8am", 750 → "12:30pm"
const formatClock = (mins) => {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${suffix}`;
};
// "08:00" + 4 hours → "8am–12pm"
const formatWindow = (start, hours) => {
  const s = timeToMinutes(start);
  if (s === null) return start;
  const h = Number(hours);
  return Number.isFinite(h) && h > 0 ? `${formatClock(s)}–${formatClock(s + Math.round(h * 60))}` : formatClock(s);
};
const timeToMinutes = (t) => {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

// ── Pricing (mirrors NewBookingPage.jsx: base hourly rate × hours + extras × qty) ──────────
async function loadUkServices() {
  return Service.find({ region: "UK", rate: { $gt: 0 } }).lean();
}

function calculateQuote(services, { service, hours, extras = [], suppliesProvidedBy, frequency }, suppliesFee = 10, tax = null) {
  const hourly = services.filter((s) => s.type === "hourly");
  const base = hourly.find((s) => clean(s.name) === clean(service));
  if (!base) {
    return { error: `Unknown service "${service}". Choose one of: ${hourly.map((s) => s.name).join(", ")}` };
  }
  const h = Number(hours);
  if (!Number.isFinite(h) || h < 1 || h > 50) return { error: "Hours must be between 1 and 50." };
  const freqError = frequencyProblem(base, frequency || "Once");
  if (freqError) return { error: freqError };

  const extraOptions = services.filter((s) => s.type !== "hourly" && s.type !== "per_room" && s.category !== "Rooms");
  const lines = [];
  for (const ex of extras || []) {
    const match = extraOptions.find((s) => clean(s.name) === clean(ex.name));
    if (!match) {
      return { error: `Unknown extra "${ex.name}". Available extras: ${extraOptions.map((s) => s.name).join(", ")}` };
    }
    const qty = Math.max(1, Math.round(Number(ex.qty) || 1));
    lines.push({ name: match.name, unitPrice: match.rate, qty, subtotal: money(match.rate * qty) });
  }
  if (suppliesProvidedBy === "Cleaniq" && suppliesFee > 0) {
    lines.push({ name: SUPPLIES_LINE, unitPrice: suppliesFee, qty: 1, subtotal: money(suppliesFee) });
  }
  // Weekly/fortnightly cleans use their own hourly price when admin has set one.
  const hourlyRate = rateForFrequency(base, frequency);
  const labour = money(hourlyRate * h);
  const net = money(labour + lines.reduce((sum, l) => sum + l.subtotal, 0));
  // Tax from admin Settings → Tax is added on top, exactly like the admin booking form.
  const taxAmount = tax?.enabled ? money(net * tax.rate / 100) : 0;
  const total = money(net + taxAmount);
  return {
    service: base.name, hourlyRate, hours: h, labour, extras: lines, currency: "GBP",
    ...(taxAmount ? { subtotal: net, tax: { label: tax.label, rate: tax.rate, amount: taxAmount } } : {}),
    total,
  };
}

// ── Availability (mirrors the admin form's slot + specific-time rules) ────────────────────
function londonNowParts(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: Number(parts.minute) };
}

// Same as src/utils/timeOverlap.js getBookingStartTime / buildBookedRanges.
function bookingStartTime(b) {
  if (b.schedule?.preferredTime && b.schedule.preferredTime.includes(":")) return b.schedule.preferredTime;
  if (b.schedule?.time && String(b.schedule.time).includes(":")) return b.schedule.time;
  if (b.schedule?.timeSlot && b.schedule.timeSlot.includes(":")) return b.schedule.timeSlot;
  return null;
}
function bookedRanges(bookings) {
  return bookings
    .map((b) => {
      const start = timeToMinutes(bookingStartTime(b));
      if (start === null) {
        const w = SLOT_WINDOWS[b.schedule?.timeSlot];
        return w ? { start: w[0], end: w[1] } : null;
      }
      const isAdminBlock = b.customer?.firstName === "ADMIN_BLOCK";
      const duration = b.details?.duration ?? b.workerDuration ?? (isAdminBlock ? 0.5 : 1);
      return { start, end: start + Number(duration) * 60 + (isAdminBlock ? 0 : 30) };
    })
    .filter(Boolean);
}

/**
 * Free arrival times on a date, in the admin form's 30-minute steps (08:00–20:00).
 * With `hours`, a start time is free only if the whole job plus the rest gap fits.
 * @param {string} date YYYY-MM-DD
 * @param {{time?: string, hours?: number, excludeBookingId?: any, now?: Date}} [opts]
 */
async function getAvailability(date, { time, hours, excludeBookingId, now = new Date() } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return { error: "Date must be in YYYY-MM-DD format." };
  const today = londonNowParts(now);
  if (date < today.date) return { error: "That date is in the past." };

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const bookings = await Booking.find({
    "schedule.date": { $gte: dayStart, $lt: dayEnd },
    status: { $nin: NON_BLOCKING_STATUSES },
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
  })
    .select("status schedule customer.firstName details.duration workerDuration")
    .lean();

  const weekday = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  if (bookings.some((b) => b.status === "Blackout" && b.schedule?.timeSlot === "All Day")) {
    return { date, weekday, fullyBooked: true, availableStartTimes: [], note: "This day is blocked off." };
  }

  let times = SPECIFIC_TIMES;
  if (date === today.date) {
    const cutoff = today.hour * 60 + today.minute + 30;
    times = times.filter((t) => timeToMinutes(t) > cutoff);
  }
  const ranges = bookedRanges(bookings);
  const h = Number(hours) > 0 ? Number(hours) : 0;
  const isFree = (t) => {
    const s = timeToMinutes(t);
    const e = s + h * 60 + REST_MINUTES;
    return !ranges.some((r) => (h ? s < r.end && e > r.start : s >= r.start && s < r.end));
  };
  const free = times.filter(isFree);

  const result = {
    date,
    weekday,
    availableStartTimes: free.map((t) => (h ? `${t} (${formatWindow(t, h)})` : t)),
    fullyBooked: free.length === 0,
  };
  if (time) {
    const t = normaliseTime(time);
    const valid = Boolean(t && times.includes(t));
    result.requestedTime = { time: t || time, free: valid && free.includes(t), ...(t && h ? { window: formatWindow(t, h) } : {}) };
    if (t && !SPECIFIC_TIMES.includes(t)) result.requestedTime.note = "Arrival times are 8am–8pm, on the hour or half hour.";
  }
  return result;
}

function normaliseTime(input) {
  const m = String(input || "").trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return "";
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// Turn the customer's arrival time into the admin form's schedule fields, checking the whole job fits.
async function resolveSchedule({ date, time, hours }, { excludeBookingId } = {}) {
  if (!time) return { error: "Ask what time they'd like the cleaner to arrive (8am–8pm)." };
  const t = normaliseTime(time);
  if (!t || !SPECIFIC_TIMES.includes(t)) return { error: "Arrival time must be between 8am and 8pm, on the hour or half hour." };
  const availability = await getAvailability(date, { time: t, hours, excludeBookingId });
  if (availability.error) return availability;
  if (!availability.requestedTime.free) {
    return {
      error: `${formatWindow(t, hours)} on ${date} is not available. Free arrival times that day: ${availability.availableStartTimes.join(", ") || "none"}.`,
    };
  }
  return { schedule: { date, timeSlot: "Flexible", preferredTime: t }, label: formatWindow(t, hours) };
}

// ── Booking (same payload as the admin form's handleSubmit) ─────────────────────────────
const NAME_RE = /^[A-Za-z][A-Za-z' -]+$/;
// UK postcode, e.g. M1 1AA, M14 5TQ, SW1A 1AA
const POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
const findPostcode = (text) => {
  const m = String(text || "").match(POSTCODE_RE);
  return m ? `${m[1]} ${m[2]}`.toUpperCase() : "";
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Callers WhatsApp what can't be taken on a call (e.g. their email) to this number.
const TEXT_NUMBER = "+44 7752 476368"; // only ever said on calls — not shown on the website or emails
const TEXT_NUMBER_SPOKEN = "oh seven seven five two, four seven six, three six eight";
const TEXT_EMAIL = "info@cleaniqservices.com";
const TEXT_EMAIL_SPOKEN = "info at cleaniq services dot com";
const ROOMS = { bedrooms: "Bedroom", bathrooms: "Bathroom", kitchens: "Kitchen", livingRooms: "Living Room" };

async function uniqueBookingId() {
  for (let i = 0; i < 20; i++) {
    const id = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await Booking.exists({ bookingId: id }))) return id;
  }
  return `BK-${Date.now().toString().slice(-6)}`;
}

// On phone calls only the area is taken (postcodes and full addresses are easily misheard); the
// team gets the full address afterwards by phone or text.
const AREA_ONLY_NOTE = "full address to be confirmed by the team";
const areaOnly = (ctx) => ctx?.channel === "voice";
const areaAddress = (text) => `${String(text || "").trim().replace(/[.,\s]+$/, "")} (${AREA_ONLY_NOTE})`;

async function createAiBooking(args, ctx) {
  const postcode = findPostcode(args.postcode) || findPostcode(args.address);
  const problems = [];
  if (!args.customerConfirmed) problems.push("the customer has not explicitly confirmed the summary and price yet");
  if (!NAME_RE.test(args.firstName || "") || args.firstName.trim().length < 2) problems.push("first name (letters only)");
  if (!NAME_RE.test(args.lastName || "") || args.lastName.trim().length < 2) problems.push("last name (letters only)");
  // Phone calls never take an email (too easily misheard): the caller WhatsApps it after.
  const phoneCall = ctx.channel === "voice";
  if (!phoneCall && !EMAIL_RE.test(args.email || "")) problems.push("a valid email address");
  if (phoneCall && args.frequency && args.frequency !== "Once") {
    return { error: "Regular cleans can't be booked on a call. Save it with save_enquiry (say it's a regular clean in details) and the team will set it up once the caller has sent their email." };
  }
  if (areaOnly(ctx)) {
    if (!args.address || args.address.trim().length < 2) problems.push("the area of Manchester they're in (e.g. Salford)");
  } else {
    if (!args.address || args.address.trim().length < 5) problems.push("the full address");
    if (!postcode) problems.push("a valid UK postcode");
  }
  if (!["Cleaniq", "Customer"].includes(args.suppliesProvidedBy)) problems.push("who provides the cleaning supplies and equipment (Cleaniq or the customer)");
  if (!args.time) problems.push("what time the cleaner should arrive");
  const frequency = FREQUENCIES.includes(args.frequency) ? args.frequency : "Once";
  if (problems.length) return { error: `Cannot book yet. Still needed: ${problems.join("; ")}.` };
  if (!areaOnly(ctx)) {
    const pcCheck = await checkPostcode(postcode);
    if (pcCheck.error) return pcCheck;
  }

  const recent = await Booking.countDocuments({
    "customer.phone": ctx.phone,
    leadSource: { $in: ["WhatsApp AI", "Phone AI"] },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (recent >= MAX_AI_BOOKINGS_PER_PHONE_PER_DAY) {
    return { error: "This customer already has recent bookings from this chat. Offer to pass the request to the team instead." };
  }

  const when = await resolveSchedule(args);
  if (when.error) return when;

  const settings = await AiSettings.get();
  const quote = calculateQuote(await loadUkServices(), args, settings.suppliesFee, await require("./tax").getTax());
  if (quote.error) return quote;

  const details = {
    address: areaOnly(ctx) ? areaAddress(args.address) : args.address.trim(),
    postcode,
    frequency,
    duration: quote.hours,
    extras: [
      ...quote.extras.map((e) => ({ name: e.name, qty: e.qty, rate: e.unitPrice })),
      // Same lines the website booking form saves, so admin and the cleaner see them the same way.
      ...(args.parking ? [`Parking: ${String(args.parking).trim()}`] : []),
      ...(args.access ? [`Entry: ${String(args.access).trim()}`] : []),
      `Pet on premises: ${args.hasPet ? "Yes" : "No"}`,
      ...(args.notes ? [`Instructions: ${String(args.notes).trim()}`] : []),
    ],
    Bedroom: 0, Bathroom: 0, Kitchen: 0, "Living Room": 0,
    "Utility Room": 0, "Reception Room": 0, Conservatory: 0, Cloakroom: 0,
    hasPet: args.hasPet ? "Yes" : "No",
  };
  for (const [arg, field] of Object.entries(ROOMS)) details[field] = Math.max(0, Math.round(Number(args[arg]) || 0));

  const payload = {
    bookingId: await uniqueBookingId(),
    customer: {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: phoneCall ? "" : args.email.trim().toLowerCase(),
      phone: ctx.phone,
    },
    service: quote.service,
    details,
    schedule: when.schedule,
    payment: {
      amount: quote.total, currency: "GBP", status: "Pending", billingType: "hourly",
      ...(quote.tax ? { taxRate: quote.tax.rate, taxAmount: quote.tax.amount, taxLabel: quote.tax.label } : {}),
    },
    status: "Pending",
    leadSource: ctx.channel === "voice" ? "Phone AI" : "WhatsApp AI",
    suppliesProvidedBy: args.suppliesProvidedBy,
    notes: args.notes || "",
    noPaymentRequired: false,
    skipConfirmationEmail: false,
    createdByAdmin: null,
    meta: {
      coupon: null, source: "ai-receptionist", conversationId: ctx.conversationId || null,
      // Phone booking: the caller WhatsApps their email; admin adds it, then presses Resend.
      ...(phoneCall ? { emailToCome: `Caller will WhatsApp their email to ${TEXT_NUMBER}` } : {}),
    },
  };

  const visits = SERIES_SIZE[frequency] || 1;
  if (ctx.dryRun) {
    return { dryRun: true, message: "TEST MODE: booking not saved.", bookingRef: payload.bookingId, total: quote.total, when: when.label, visits };
  }

  const { createBooking } = require("../routes/bookings");
  const booking = await createBooking(payload);
  console.log(`[ai-tools] booking ${booking.bookingId} created from WhatsApp ${ctx.phone} (£${quote.total}, ${visits} visit(s))`);
  return {
    bookingRef: booking.bookingId,
    status: "Pending",
    total: quote.total,
    when: `${args.date} ${when.label}`,
    visits,
    nextStep: phoneCall
      ? `The booking is scheduled. Say: "Your clean is scheduled for <day> at <time>, reference <bookingRef>. Could you WhatsApp your email address and booking reference to us on ${TEXT_NUMBER_SPOKEN}, or email them to ${TEXT_EMAIL_SPOKEN}? We'll email your confirmation and payment link. Your booking is confirmed once you've paid." Our team will call or text them shortly to take the full address.`
      : `A confirmation email with a secure payment link has been sent to ${payload.customer.email}. The booking is confirmed once payment is completed.${areaOnly(ctx) ? " Our team will call or text them shortly to take the full address." : ""}`,
  };
}

// ── The customer's own bookings (matched by this chat's phone number) ───────────────────
async function bookingsForPhone(phone, { upcomingOnly = true } = {}) {
  const target = toE164UK(phone);
  if (!target) return [];
  const last9 = target.slice(-9).split("").join("\\D*");
  const today = new Date(`${londonNowParts().date}T00:00:00.000Z`);
  const candidates = await Booking.find({
    "customer.phone": { $regex: `${last9}$` },
    status: { $nin: ["Cancelled", "Rejected", "Blackout"] },
    ...(upcomingOnly ? { "schedule.date": { $gte: today } } : {}),
  })
    .sort({ "schedule.date": 1 })
    .limit(20);
  return candidates.filter((b) => toE164UK(b.customer?.phone) === target);
}

const summariseBooking = (b) => ({
  bookingRef: b.bookingId,
  service: b.service,
  date: b.schedule?.date ? new Date(b.schedule.date).toISOString().slice(0, 10) : null,
  time: bookingStartTime(b) ? formatWindow(bookingStartTime(b), b.details?.duration) : b.schedule?.timeSlot,
  hours: b.details?.duration ?? null,
  status: b.status,
  paymentStatus: b.payment?.status,
  total: b.payment?.amount ?? null,
});

async function findMyBookings(ctx) {
  const bookings = await bookingsForPhone(ctx.phone);
  if (!bookings.length) return { bookings: [], note: "No upcoming bookings found for this phone number." };
  return { bookings: bookings.map(summariseBooking) };
}

async function rescheduleAiBooking(args, ctx) {
  if (!args.customerConfirmed) return { error: "Confirm the new date and time with the customer first, then call again with customerConfirmed true." };
  const mine = await bookingsForPhone(ctx.phone);
  const booking = mine.find((b) => clean(b.bookingId) === clean(args.bookingRef));
  if (!booking) {
    return { error: `No upcoming booking ${args.bookingRef || ""} found for this phone number. Use find_my_bookings, or offer to pass this to the team.` };
  }
  if (!RESCHEDULABLE_STATUSES.includes(booking.status)) {
    return { error: `This booking is ${booking.status} and can't be rescheduled here. Offer to pass it to the team.` };
  }
  const when = await resolveSchedule({ ...args, hours: booking.details?.duration }, { excludeBookingId: booking._id });
  if (when.error) return when;

  if (ctx.dryRun) return { dryRun: true, message: "TEST MODE: booking not changed.", bookingRef: booking.bookingId, newWhen: `${args.date} ${when.label}` };

  const { rescheduleBooking } = require("../routes/bookings");
  await rescheduleBooking(booking, when.schedule);
  console.log(`[ai-tools] booking ${booking.bookingId} rescheduled from WhatsApp ${ctx.phone} to ${args.date} ${when.label}`);
  return {
    bookingRef: booking.bookingId,
    newWhen: `${args.date} ${when.label}`,
    nextStep: `An email with the new date and time has been sent to ${booking.customer?.email || "the customer"}.`,
  };
}

// ── Written quotes (same payload and maths as the admin Quote Builder's handleSend) ──────────
const QUOTE_FREQUENCIES = ["once", "weekly", "biweekly", "monthly", "quarterly", "yearly"];
// Quote Builder defaults
const QUOTE_DEFAULTS = {
  vatRate: 20,
  validDays: 30,
  paymentTerms: "Net 30",
  notes: "This quote is valid for 30 days from the date of issue. All services are subject to our terms and conditions available at cleaniqservices.com/terms.",
};
const MAX_AI_QUOTES_PER_PHONE_PER_DAY = 3;

// Tax on emailed quotes. Once admin has set Settings → Tax, quotes follow it; before that, the
// AI's own setting (20%). Shared by AI quotes and the website's instant quotes.
async function quoteTaxSettings(settings) {
  const SystemSetting = require("../models/SystemSetting");
  const tax = (await SystemSetting.exists({ key: "tax" })) ? await require("./tax").getTax() : null;
  const s = settings || (await AiSettings.get());
  return { includeVat: tax ? tax.enabled : s.quoteIncludeVat !== false, vatRate: tax ? tax.rate : QUOTE_DEFAULTS.vatRate };
}

function buildQuoteItems(services, args, suppliesFee) {
  const hourly = services.filter((s) => s.type === "hourly");
  const extraOptions = services.filter((s) => s.type !== "hourly" && s.type !== "per_room" && s.category !== "Rooms");
  const items = [];
  for (const line of args.services || []) {
    const base = hourly.find((s) => clean(s.name) === clean(line.service));
    if (!base) {
      return { error: `We don't have a set price for "${line.service}". Quotable services: ${hourly.map((s) => s.name).join(", ")}. For anything else, offer to have the team prepare a custom quote.` };
    }
    const hours = Number(line.hours);
    if (!Number.isFinite(hours) || hours < 1 || hours > 50) return { error: `Hours for ${base.name} must be between 1 and 50.` };
    // Quote frequencies are lower-case ("weekly"); regular cleans use their own price if set.
    const freq = QUOTE_TO_FREQ[String(args.frequency || "once").toLowerCase()] || "Once";
    const freqError = frequencyProblem(base, freq);
    if (freqError) return { error: freqError };
    items.push({ service: base.name, customService: "", description: String(line.description || "").trim(), billingType: "hourly", qty: hours, unitPrice: rateForFrequency(base, freq) });
  }
  if (!items.some((i) => i.billingType === "hourly")) return { error: "Add at least one cleaning service with hours." };
  // Extras (fridge, oven…) and the supplies fee are add-ons on the main service, exactly like the
  // admin Quote Builder — never a service of their own.
  const addOns = [];
  for (const ex of args.extras || []) {
    const match = extraOptions.find((s) => clean(s.name) === clean(ex.name));
    if (!match) return { error: `Unknown extra "${ex.name}". Available extras: ${extraOptions.map((s) => s.name).join(", ")}` };
    addOns.push({ name: match.name, qty: Math.max(1, Math.round(Number(ex.qty) || 1)), unitPrice: match.rate });
  }
  if (args.suppliesProvidedBy === "Cleaniq" && suppliesFee > 0) {
    addOns.push({ name: SUPPLIES_LINE, qty: 1, unitPrice: suppliesFee });
  }
  items[0].extras = addOns;
  return {
    items: items.map((i) => ({
      ...i,
      extras: i.extras || [],
      subtotal: money(Number(i.unitPrice) * Number(i.qty) + (i.extras || []).reduce((sum, e) => sum + e.unitPrice * e.qty, 0)),
    })),
  };
}

async function sendAiQuote(args, ctx) {
  const problems = [];
  if (!args.customerName || String(args.customerName).trim().length < 2) problems.push("their name (or company name)");
  if (!EMAIL_RE.test(args.email || "")) problems.push("a valid email address to send the quote to");
  // The chat/call number is used unless the customer gave a different one.
  const quotePhone = args.phone ? toE164UK(args.phone) || "" : toE164UK(ctx.phone) || null;
  if (quotePhone === "") problems.push("a valid phone number");
  if (quotePhone === null) problems.push("their phone number");
  if (areaOnly(ctx)) {
    if (!args.address || String(args.address).trim().length < 2) problems.push("the area of Manchester they're in (e.g. Salford)");
  } else if (!args.address || String(args.address).trim().length < 5) problems.push("the property address");
  if (!(args.services || []).length) problems.push("the service(s) and hours");
  if (!["Cleaniq", "Customer"].includes(args.suppliesProvidedBy)) problems.push("who provides the cleaning supplies and equipment");
  if (problems.length) return { error: `Cannot prepare the quote yet. Still needed: ${problems.join("; ")}.` };
  if (!areaOnly(ctx)) {
    const pcCheck = await checkPostcode(args.address);
    if (pcCheck.error) return pcCheck;
  }

  const settings = await AiSettings.get();
  const built = buildQuoteItems(await loadUkServices(), args, settings.suppliesFee);
  if (built.error) return built;

  let serviceDate = null;
  let serviceTimeSlot = null;
  let when = null;
  if (args.serviceDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.serviceDate)) return { error: "Preferred date must be YYYY-MM-DD." };
    serviceDate = args.serviceDate;
    if (args.time) {
      const hours = built.items.filter((i) => i.billingType === "hourly").reduce((sum, i) => sum + Number(i.qty), 0);
      const slot = await resolveSchedule({ date: args.serviceDate, time: args.time, hours });
      if (slot.error) return slot;
      serviceTimeSlot = slot.schedule.preferredTime; // "HH:MM": what accepted quotes turn into bookings
      when = `${args.serviceDate} ${slot.label}`;
    }
  }

  // Same maths as QuoteBuilder.jsx (no discount or deposit from the AI).
  const subtotal = money(built.items.reduce((sum, i) => sum + i.subtotal, 0));
  const { includeVat, vatRate } = await quoteTaxSettings(settings);
  const vat = includeVat ? money(subtotal * (vatRate / 100)) : 0;
  const grandTotal = money(subtotal + vat);
  const frequency = QUOTE_FREQUENCIES.includes(args.frequency) ? args.frequency : "once";
  const customerName = String(args.customerName).trim();
  const company = String(args.companyName || "").trim();

  const payload = {
    companyName: company || customerName,
    contactName: company ? customerName : "",
    email: String(args.email).trim().toLowerCase(),
    phone: quotePhone,
    address: areaOnly(ctx) ? areaAddress(args.address) : String(args.address).trim(),
    frequency,
    serviceDate,
    serviceTimeSlot,
    vatRate,
    validDays: QUOTE_DEFAULTS.validDays,
    includeVat,
    sendCopy: true,
    paymentTerms: QUOTE_DEFAULTS.paymentTerms,
    depositRequired: false,
    depositPercent: 0,
    discount: 0,
    notes: [QUOTE_DEFAULTS.notes, args.notes ? `Customer notes: ${String(args.notes).trim()}` : ""].filter(Boolean).join("\n"),
    quoteRef: `CLQ-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    items: built.items,
    // Property & access, the same fields as the admin Quote Builder.
    property: {
      bedrooms: Math.max(0, Math.round(Number(args.bedrooms) || 0)),
      bathrooms: Math.max(0, Math.round(Number(args.bathrooms) || 0)),
      kitchens: Math.max(0, Math.round(Number(args.kitchens) || 0)),
      receptionRooms: Math.max(0, Math.round(Number(args.livingRooms) || 0)),
    },
    suppliesProvidedBy: args.suppliesProvidedBy || "",
    parking: String(args.parking || "").trim(),
    keyAccess: String(args.access || "").trim(),
    hasPet: args.hasPet === true ? "Yes" : args.hasPet === false ? "No" : "",
    specialInstructions: String(args.notes || "").trim(),
    subtotal,
    discountAmount: 0,
    subtotalAfterDiscount: subtotal,
    vat,
    grandTotal,
    depositAmount: 0,
    balanceDue: grandTotal,
  };
  const figures = {
    lines: built.items.flatMap((i) => [
      `${i.service}: ${i.billingType === "hourly" ? `${i.qty}h × £${i.unitPrice.toFixed(2)}` : `${i.qty} × £${i.unitPrice.toFixed(2)}`} = £${money(i.unitPrice * i.qty).toFixed(2)}`,
      ...(i.extras || []).map((e) => `  + ${e.name}: ${e.qty} × £${Number(e.unitPrice).toFixed(2)} = £${money(e.unitPrice * e.qty).toFixed(2)}`),
    ]),
    subtotal,
    vat,
    grandTotal,
    vatIncluded: includeVat,
    frequency,
    perVisit: frequency !== "once",
    when,
  };

  if (!args.customerConfirmed) {
    return { preview: true, ...figures, nextStep: "Show the customer these figures and ask them to reply YES to have the quote emailed." };
  }
  const recent = await (require("../models/Quote")).countDocuments({ phone: { $in: [ctx.phone, quotePhone] }, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
  if (recent >= MAX_AI_QUOTES_PER_PHONE_PER_DAY) {
    return { error: "Several quotes were already sent from this chat today. Offer to have the team follow up instead." };
  }
  if (ctx.dryRun) return { dryRun: true, message: "TEST MODE: quote not emailed.", quoteRef: payload.quoteRef, ...figures };

  const { sendQuote } = require("../routes/quotes");
  const quote = await sendQuote(payload);
  console.log(`[ai-tools] quote ${quote.quoteRef} emailed to ${payload.email} from WhatsApp ${ctx.phone} (£${grandTotal})`);
  return {
    quoteRef: quote.quoteRef,
    ...figures,
    nextStep: `The quote has been emailed to ${payload.email}. It is valid for ${QUOTE_DEFAULTS.validDays} days and can be accepted with the button in the email.${areaOnly(ctx) ? " Our team will call or text them to take the full address." : ""}`,
  };
}

// ── Enquiries (leads) ────────────────────────────────────────────────────────────────────
const ENQUIRY_SOURCE = { voice: "AI Phone", whatsapp: "AI WhatsApp" };
const tidy = (v, max = 500) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function enquiryMessage(a) {
  return [
    a.service && `Service: ${a.service}`,
    a.details && `Details: ${a.details}`,
    a.postcode && `Area/postcode: ${a.postcode}`,
    a.preferredDate && `When: ${a.preferredDate}`,
    a.callbackTime && `Best time to call: ${a.callbackTime}`,
  ].filter(Boolean).join("\n");
}

// Saves the enquiry to Leads (one per phone number per day: later calls update it) and
// emails the team. ctx: { phone, channel, conversationId, dryRun }
async function saveEnquiry(args, ctx) {
  const a = {
    name: tidy(args.name, 80),
    email: tidy(args.email, 120).toLowerCase(),
    phone: toE164UK(tidy(args.phone, 30)) || ctx.phone || "",
    postcode: tidy(args.postcode, 80),
    service: tidy(args.service, 120),
    details: tidy(args.details, 800),
    preferredDate: tidy(args.preferredDate, 80),
    callbackTime: tidy(args.callbackTime, 80),
  };
  if (!a.name) return { error: "Ask for the customer's name first." };
  if (!a.service && !a.details) return { error: "Ask what they need cleaned first." };
  if (a.email && !EMAIL_RE.test(a.email)) return { error: "That email address doesn't look right. Check it with the customer." };
  if (!a.phone && !a.email) return { error: "Ask for a phone number or email so the team can reply." };

  const source = ENQUIRY_SOURCE[ctx.channel] || "AI Receptionist";
  const message = enquiryMessage(a);
  if (ctx.dryRun) return { saved: true, dryRun: true, nextStep: "TEST: enquiry not saved." };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = a.phone
    ? await Lead.findOne({ phone: a.phone, source, createdAt: { $gte: since } })
    : null;
  const fields = { name: a.name, phone: a.phone, message, serviceInterest: a.service, ...(a.email ? { email: a.email } : {}) };
  const lead = existing
    ? await Lead.findByIdAndUpdate(existing._id, { $set: fields }, { new: true })
    : await Lead.create({ ...fields, source, stage: "New" });

  setImmediate(async () => {
    try {
      const { sendEmail } = require("./emailService");
      const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const rows = [["Name", a.name], ["Phone", a.phone], ["Email", a.email], ["Service", a.service], ["Details", a.details],
        ["Area/postcode", a.postcode], ["When", a.preferredDate], ["Best time to call", a.callbackTime]]
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#64748b;font-weight:700">${k}</td><td style="padding:6px 12px">${esc(v)}</td></tr>`)
        .join("");
      await sendEmail({
        to: process.env.EMAIL_USER || "info@cleaniqservices.com",
        subject: `${existing ? "Updated" : "New"} enquiry (${source}): ${a.name}${a.service ? ` – ${a.service}` : ""}`,
        html: `<div style="font-family:sans-serif;max-width:560px"><h2 style="color:#0F6B4C">New enquiry from the ${source === "AI Phone" ? "phone line" : "WhatsApp chat"}</h2><table style="border-collapse:collapse">${rows}</table><p style="color:#64748b">It's in Admin → Leads. Call them back to quote and book.</p></div>`,
      });
    } catch (e) {
      console.error("[ai-tools] enquiry email failed:", e.message);
    }
  });
  console.log(`[ai-tools] enquiry ${existing ? "updated" : "saved"} for ${a.name} (${a.phone || a.email}) from ${source}`);
  return { saved: true, leadId: String(lead._id), nextStep: "The team has the enquiry and will be in touch soon." };
}

// ── Declarations for the model ──────────────────────────────────────────────────────────
const extrasSchema = {
  type: "array",
  description: "Optional add-on extras, using names exactly as listed under 'Add-on extras'.",
  items: {
    type: "object",
    properties: { name: { type: "string" }, qty: { type: "integer", minimum: 1 } },
    required: ["name"],
  },
};
const whenSchema = {
  date: { type: "string", description: "The date exactly as the customer said it (e.g. \"next Friday\", \"28th October\", \"tomorrow\") or YYYY-MM-DD. Don't work dates out yourself." },
  time: { type: "string", description: "Arrival time as HH:MM, 08:00–20:00 on the hour or half hour (e.g. 8am → 08:00)." },
};

const declarations = [
  {
    name: "check_postcode",
    description: "Check a UK postcode is real as soon as the customer gives it, before asking anything else. If it isn't, ask them to say it again slowly, letter by letter.",
    parametersJsonSchema: {
      type: "object",
      properties: { postcode: { type: "string", description: "The postcode as heard, e.g. M5 4EE" } },
      required: ["postcode"],
    },
  },
  {
    name: "get_quote",
    description: "Calculate the exact price using live prices, including extras and the supplies fee. Always use this for any total; never add up prices yourself.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        service: { type: "string", description: "Cleaning service name exactly as listed under 'Cleaning services'." },
        hours: { type: "number", description: "Number of hours (1–50)." },
        extras: extrasSchema,
        suppliesProvidedBy: { type: "string", enum: ["Cleaniq", "Customer"], description: "Who brings the cleaning supplies and equipment." },
        frequency: { type: "string", enum: ["Once", "Weekly", "Fortnightly", "Monthly", "Quarterly"], description: "How often (Quarterly = every 3 months). Regular cleans can have their own hourly price." },
      },
      required: ["service", "hours"],
    },
  },
  {
    name: "check_availability",
    description: "Check whether the cleaner can arrive at a time on a date, and list free arrival times. Pass hours so the whole job is checked; the result includes the time window (e.g. 8am–12pm).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date as the customer said it (e.g. \"next Friday\", \"the 28th\") or YYYY-MM-DD" },
        time: { type: "string", description: "Arrival time to check, HH:MM" },
        hours: { type: "number", description: "Job length in hours" },
      },
      required: ["date"],
    },
  },
  {
    name: "create_booking",
    description: "Create the booking exactly like staff do in the admin form. Only call after showing the customer a summary with the total from get_quote and receiving an explicit yes.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        address: { type: "string", description: "WhatsApp: full address including house/flat number and town. Phone calls: just the area, e.g. Salford" },
        postcode: { type: "string", description: "Optional if the address already includes the postcode" },
        frequency: { type: "string", enum: FREQUENCIES, description: "Once, or a regular series — only the frequencies offered for the service (see the price list)" },
        suppliesProvidedBy: { type: "string", enum: ["Cleaniq", "Customer"] },
        service: { type: "string" },
        hours: { type: "number" },
        bedrooms: { type: "integer" },
        bathrooms: { type: "integer" },
        kitchens: { type: "integer" },
        livingRooms: { type: "integer" },
        hasPet: { type: "boolean" },
        parking: { type: "string", description: "e.g. Free parking on-site, Free street parking, Paid parking, No parking" },
        access: { type: "string", description: "How the cleaner gets in, e.g. Someone will be home, Key in a key safe" },
        extras: extrasSchema,
        ...whenSchema,
        notes: { type: "string", description: "Anything else the cleaner should know" },
        customerConfirmed: { type: "boolean", description: "True only if the customer explicitly said yes to the summary and total." },
      },
      required: ["firstName", "lastName", "email", "address", "suppliesProvidedBy", "service", "hours", "date", "time", "customerConfirmed"],
    },
  },
  {
    name: "send_quote",
    description:
      "Prepare and email a written quote exactly like staff do in the Quote Builder. Call with customerConfirmed false first to get the exact figures (including VAT) for the summary; call with customerConfirmed true only after the customer replied yes.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        customerName: { type: "string", description: "Customer's full name" },
        companyName: { type: "string", description: "Only if the quote is for a business" },
        phone: { type: "string", description: "Only if the customer wants a different number from this chat/call's" },
        email: { type: "string" },
        address: { type: "string", description: "WhatsApp: property address with postcode. Phone calls: just the area, e.g. Salford" },
        services: {
          type: "array",
          description: "One entry per cleaning service, names exactly as under 'Cleaning services'",
          items: {
            type: "object",
            properties: {
              service: { type: "string" },
              hours: { type: "number" },
              description: { type: "string", description: "What needs cleaning, in the customer's words (shown on the quote)" },
            },
            required: ["service", "hours"],
          },
        },
        extras: extrasSchema,
        suppliesProvidedBy: { type: "string", enum: ["Cleaniq", "Customer"] },
        frequency: { type: "string", enum: QUOTE_FREQUENCIES, description: "once, weekly, biweekly (fortnightly), monthly or quarterly (every 3 months) — only those offered for the service" },
        bedrooms: { type: "integer" },
        bathrooms: { type: "integer" },
        kitchens: { type: "integer" },
        livingRooms: { type: "integer", description: "Living / reception rooms" },
        hasPet: { type: "boolean" },
        parking: { type: "string", description: "e.g. Free parking on-site, Free street parking, Paid parking, No parking" },
        access: { type: "string", description: "How the cleaner gets in, e.g. Someone will be home, Key in a key safe" },
        serviceDate: { type: "string", description: "Optional preferred date, as the customer said it (e.g. \"next Friday\") or YYYY-MM-DD" },
        time: { type: "string", description: "Optional preferred arrival time, HH:MM" },
        notes: { type: "string" },
        customerConfirmed: { type: "boolean" },
      },
      required: ["customerName", "email", "address", "services", "suppliesProvidedBy", "customerConfirmed"],
    },
  },
  {
    name: "save_enquiry",
    description: "Save this customer's enquiry for the team to follow up (call back, quote, book). Use when someone is interested but isn't booking or getting a quote emailed now. Call again with all details if they add more.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Customer's name" },
        phone: { type: "string", description: "Best phone number, only if different from this chat/call's number" },
        email: { type: "string" },
        postcode: { type: "string", description: "Postcode or area" },
        service: { type: "string", description: "Service they're interested in, e.g. End of Tenancy Cleaning" },
        details: { type: "string", description: "Property size, what needs cleaning, questions, anything else useful" },
        preferredDate: { type: "string", description: "When they'd like the clean, in their words" },
        callbackTime: { type: "string", description: "Best time for the team to call back" },
      },
      required: ["name"],
    },
  },
  {
    name: "find_my_bookings",
    description: "List this customer's upcoming bookings (matched by the phone number of this chat). Use when they ask about, change or reschedule a booking.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "reschedule_booking",
    description: "Move one of this customer's bookings to a new date/time, exactly like staff do. Only call after the customer confirmed the new date and time.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        bookingRef: { type: "string", description: "e.g. BK-1234, from find_my_bookings" },
        ...whenSchema,
        customerConfirmed: { type: "boolean" },
      },
      required: ["bookingRef", "date", "time", "customerConfirmed"],
    },
  },
];

// When our last message asked the customer to reply YES and they did, the booking/reschedule
// tool must run now; small models sometimes answer in text instead of calling it.
const YES_RE = /^\s*(yes|yeah|yep|yup|ya|y|confirm(ed)?|go ahead|book it|please book|ok(ay)?|sure|correct|that'?s (right|correct|fine)|do it|perfect)\b/i;
function confirmationTool(history) {
  const last = history[history.length - 1];
  if (!last || last.role !== "customer" || !YES_RE.test(last.text || "") || (last.text || "").length > 80) return null;
  const previous = [...history.slice(0, -1)].reverse().find((m) => m.role !== "customer");
  if (!previous || !/reply yes/i.test(previous.text || "")) return null;
  if (/\bmove\b|reschedul/i.test(previous.text)) return "reschedule_booking";
  // A quote summary mentions the quote ("…that's where the quote will go. Reply YES to have it
  // emailed"); a booking summary doesn't.
  if (/reply yes to (have |get )?(the |your |a )?(written )?quote|reply yes to (send|email)[^.\n]*quote|\bquote\b/i.test(previous.text)) return "send_quote";
  return "create_booking";
}

// One-line summary of a tool call for the Conversations page.
function describeToolResult(name, args = {}, r = {}) {
  if (!r || r.error) return { name, ok: false, detail: `${name}: ${r?.error || "failed"}` };
  const money = (n) => (typeof n === "number" ? `£${n.toFixed(2)}` : "");
  switch (name) {
    case "check_postcode":
      return { name, ok: true, detail: `Postcode checked: ${r.postcode}` };
    case "get_quote":
      return { name, ok: true, detail: `Price check: ${r.service}, ${r.hours}h → ${money(r.total)}` };
    case "check_availability":
      return {
        name,
        ok: true,
        detail: r.requestedTime
          ? `Availability ${r.date} ${r.requestedTime.time}: ${r.requestedTime.free ? "free" : "taken"}`
          : `Availability ${r.date}: ${r.availableStartTimes?.length ?? 0} free start times`,
      };
    case "create_booking":
      return {
        name,
        ok: true,
        detail: [
          r.dryRun ? "TEST booking (not saved)" : `Booking ${r.bookingRef} created`,
          `${args.firstName || ""} ${args.lastName || ""}`.trim(),
          args.email,
          args.address,
          `${args.service || ""}${args.hours ? `, ${args.hours}h` : ""}${args.frequency && args.frequency !== "Once" ? `, ${args.frequency}` : ""}`,
          r.when,
          money(r.total),
        ].filter(Boolean).join(" · "),
      };
    case "send_quote":
      return {
        name,
        ok: true,
        detail: [
          r.preview ? "Quote preview" : r.dryRun ? "TEST quote (not sent)" : `Quote ${r.quoteRef} emailed`,
          args.customerName,
          args.email,
          args.address,
          (args.services || []).map((x) => `${x.service}${x.hours ? ` ${x.hours}h` : ""}`).join(", "),
          money(r.grandTotal),
        ].filter(Boolean).join(" · "),
      };
    case "find_my_bookings":
      return { name, ok: true, detail: `Looked up bookings: ${r.bookings?.length ?? 0} upcoming` };
    case "reschedule_booking":
      return { name, ok: true, detail: `${r.dryRun ? "TEST reschedule" : `Booking ${r.bookingRef} moved`} to ${r.newWhen}` };
    case "save_enquiry":
      return { name, ok: true, detail: r.dryRun ? "TEST enquiry (not saved)" : `Enquiry saved: ${args.name || ""}${args.service ? ` · ${args.service}` : ""}` };
    case "transfer_to_human":
      return { name, ok: true, detail: "Caller transferred to the team" };
    default:
      return { name, ok: true, detail: name };
  }
}

/** Returns a runner bound to one conversation. ctx: { phone, conversationId, dryRun, onTool } */
function makeToolRunner(ctx) {
  const run = async (name, args) => {
    try {
      if (name === "get_quote") {
        const settings = await AiSettings.get();
        return calculateQuote(await loadUkServices(), args, settings.suppliesFee, await require("./tax").getTax());
      }
      if (name === "check_postcode") {
        const r = await checkPostcode(args.postcode);
        return r.error ? r : { valid: true, postcode: r.postcode, readBack: r.postcode.split("").join(" ").replace(/ {3}/g, ", ") };
      }
      if (name === "check_availability") return await getAvailability(args.date, { time: args.time, hours: args.hours });
      if (name === "create_booking") return await createAiBooking(args, ctx);
      if (name === "find_my_bookings") return await findMyBookings(ctx);
      if (name === "reschedule_booking") return await rescheduleAiBooking(args, ctx);
      if (name === "send_quote") return await sendAiQuote(args, ctx);
      if (name === "save_enquiry") return await saveEnquiry(args, ctx);
      return { error: `Unknown tool ${name}` };
    } catch (err) {
      console.error(`[ai-tools] ${name} failed:`, err);
      return { error: "The booking system had a problem. Offer to pass the request to the team." };
    }
  };
  return async function runTool(name, rawArgs = {}) {
    // Dates: the customer's words ("next Friday", "the 28th") are turned into exact dates here,
    // so the AI never has to work out calendar dates itself.
    const args = { ...rawArgs };
    let dateRead = null;
    for (const field of ["date", "serviceDate"]) {
      if (!args[field]) continue;
      const r = resolveUkDate(args[field]);
      if (r.error) {
        const result = { error: `${r.error}` };
        if (ctx.onTool) ctx.onTool(describeToolResult(name, args, result));
        return result;
      }
      args[field] = r.iso;
      dateRead = r.label;
    }
    const result = await run(name, args);
    // Tell the AI the exact day it worked out, to read back to the customer.
    if (dateRead && result && !result.error && typeof result === "object") result.dateToReadBack = dateRead;
    if (ctx.onTool) ctx.onTool(describeToolResult(name, args, result));
    return result;
  };
}

// ── Never tell a customer something is booked or sent unless a tool really did it ───────
// A reply that mentions a booking/quote reference the tools never returned means the AI made
// it up (e.g. said "booked, BK-1234567" without calling create_booking).
const REF_RE = /\b(?:BK|CLQ|Q|SUB)-[A-Z0-9][A-Z0-9-]{2,}\b/gi;
const refsIn = (text) => (String(text || "").match(REF_RE) || []).map((r) => r.toUpperCase());
function refsFromResult(r) {
  const out = [];
  if (r?.bookingRef) out.push(r.bookingRef);
  if (r?.quoteRef) out.push(r.quoteRef);
  for (const b of r?.bookings || []) if (b.bookingRef) out.push(b.bookingRef);
  return out.map((x) => String(x).toUpperCase());
}
// Wraps a tool runner so every reference a tool returns is remembered in `known`.
function trackRefs(runTool, known) {
  return async (name, args) => {
    const result = await runTool(name, args);
    refsFromResult(result).forEach((ref) => known.add(ref));
    return result;
  };
}
const INVENTED_REF_NOTE =
  "IMPORTANT: your last reply gave a booking or quote reference, but no tool created it — nothing has been booked or sent. Never give a reference you didn't get from a tool. If the customer has said yes to the latest summary, call create_booking or send_quote now with customerConfirmed true; otherwise ask for what's still needed.";
const INVENTED_REF_FALLBACK =
  "Sorry, I couldn't finish that just now. A member of our team will confirm the details with you shortly.";

/**
 * Checks a reply for made-up references. retry(note) asks the AI again with an extra note.
 * @returns {Promise<{ reply: string, flagged?: boolean }>}
 */
async function guardInventedRefs(reply, known, retry) {
  const invented = refsIn(reply).find((r) => !known.has(r));
  if (!invented) return { reply };
  console.warn(`[ai] reply mentioned ${invented}, which no tool returned; asking the AI again`);
  let again = null;
  try { again = await retry(INVENTED_REF_NOTE); } catch {}
  if (again && !refsIn(again).some((r) => !known.has(r))) return { reply: again };
  console.warn("[ai] still no real reference after retrying; sending the safe reply and flagging for the team");
  return { reply: INVENTED_REF_FALLBACK, flagged: true };
}

module.exports = {
  TEXT_NUMBER, TEXT_NUMBER_SPOKEN, TEXT_EMAIL, TEXT_EMAIL_SPOKEN,
  refsIn,
  trackRefs,
  guardInventedRefs,
  declarations,
  makeToolRunner,
  calculateQuote,
  getAvailability,
  createAiBooking,
  findMyBookings,
  rescheduleAiBooking,
  normaliseTime,
  formatWindow,
  confirmationTool,
  sendAiQuote,
  quoteTaxSettings,
  loadUkServices,
  SUPPLIES_LINE,
  QUOTE_DEFAULTS,
  saveEnquiry,
  describeToolResult,
  SPECIFIC_TIMES,
};
