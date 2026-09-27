// Tools the AI receptionist can call. They follow the admin "New booking" form step by step
// (NewBookingPage.jsx), so the AI never does its own maths and bookings behave exactly like
// staff-created ones. Rescheduling uses the same code as the admin reschedule.
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const AiSettings = require("../models/AiSettings");
const { toE164UK } = require("./phone");

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

function calculateQuote(services, { service, hours, extras = [], suppliesProvidedBy }, suppliesFee = 10) {
  const hourly = services.filter((s) => s.type === "hourly");
  const base = hourly.find((s) => clean(s.name) === clean(service));
  if (!base) {
    return { error: `Unknown service "${service}". Choose one of: ${hourly.map((s) => s.name).join(", ")}` };
  }
  const h = Number(hours);
  if (!Number.isFinite(h) || h < 1 || h > 50) return { error: "Hours must be between 1 and 50." };

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
  const labour = money(base.rate * h);
  const total = money(labour + lines.reduce((sum, l) => sum + l.subtotal, 0));
  return { service: base.name, hourlyRate: base.rate, hours: h, labour, extras: lines, total, currency: "GBP" };
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
const ROOMS = { bedrooms: "Bedroom", bathrooms: "Bathroom", kitchens: "Kitchen", livingRooms: "Living Room" };

async function uniqueBookingId() {
  for (let i = 0; i < 20; i++) {
    const id = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await Booking.exists({ bookingId: id }))) return id;
  }
  return `BK-${Date.now().toString().slice(-6)}`;
}

async function createAiBooking(args, ctx) {
  const postcode = findPostcode(args.postcode) || findPostcode(args.address);
  const problems = [];
  if (!args.customerConfirmed) problems.push("the customer has not explicitly confirmed the summary and price yet");
  if (!NAME_RE.test(args.firstName || "") || args.firstName.trim().length < 2) problems.push("first name (letters only)");
  if (!NAME_RE.test(args.lastName || "") || args.lastName.trim().length < 2) problems.push("last name (letters only)");
  if (!EMAIL_RE.test(args.email || "")) problems.push("a valid email address");
  if (!args.address || args.address.trim().length < 5) problems.push("the full address");
  if (!postcode) problems.push("a valid UK postcode");
  if (!["Cleaniq", "Customer"].includes(args.suppliesProvidedBy)) problems.push("who provides the cleaning supplies and equipment (Cleaniq or the customer)");
  if (!args.time) problems.push("what time the cleaner should arrive");
  const frequency = FREQUENCIES.includes(args.frequency) ? args.frequency : "Once";
  if (problems.length) return { error: `Cannot book yet. Still needed: ${problems.join("; ")}.` };

  const recent = await Booking.countDocuments({
    "customer.phone": ctx.phone,
    leadSource: "WhatsApp AI",
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (recent >= MAX_AI_BOOKINGS_PER_PHONE_PER_DAY) {
    return { error: "This customer already has recent bookings from this chat. Offer to pass the request to the team instead." };
  }

  const when = await resolveSchedule(args);
  if (when.error) return when;

  const settings = await AiSettings.get();
  const quote = calculateQuote(await loadUkServices(), args, settings.suppliesFee);
  if (quote.error) return quote;

  const details = {
    address: args.address.trim(),
    postcode,
    frequency,
    duration: quote.hours,
    extras: quote.extras.map((e) => ({ name: e.name, qty: e.qty, rate: e.unitPrice })),
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
      email: args.email.trim().toLowerCase(),
      phone: ctx.phone,
    },
    service: quote.service,
    details,
    schedule: when.schedule,
    payment: { amount: quote.total, currency: "GBP", status: "Pending", billingType: "hourly" },
    status: "Pending",
    leadSource: "WhatsApp AI",
    suppliesProvidedBy: args.suppliesProvidedBy,
    notes: args.notes || "",
    noPaymentRequired: false,
    skipConfirmationEmail: false,
    createdByAdmin: null,
    meta: { coupon: null, source: "ai-receptionist", conversationId: ctx.conversationId || null },
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
    nextStep: `A confirmation email with a secure payment link has been sent to ${payload.customer.email}. The booking is confirmed once payment is completed.`,
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
  date: { type: "string", description: "YYYY-MM-DD (UK)" },
  time: { type: "string", description: "Arrival time as HH:MM, 08:00–20:00 on the hour or half hour (e.g. 8am → 08:00)." },
};

const declarations = [
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
        date: { type: "string", description: "YYYY-MM-DD (UK)" },
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
        address: { type: "string", description: "Full address including house/flat number and town" },
        postcode: { type: "string", description: "Optional if the address already includes the postcode" },
        frequency: { type: "string", enum: FREQUENCIES, description: "Once, or a regular series" },
        suppliesProvidedBy: { type: "string", enum: ["Cleaniq", "Customer"] },
        service: { type: "string" },
        hours: { type: "number" },
        bedrooms: { type: "integer" },
        bathrooms: { type: "integer" },
        kitchens: { type: "integer" },
        livingRooms: { type: "integer" },
        hasPet: { type: "boolean" },
        extras: extrasSchema,
        ...whenSchema,
        notes: { type: "string", description: "Access instructions or special requests" },
        customerConfirmed: { type: "boolean", description: "True only if the customer explicitly said yes to the summary and total." },
      },
      required: ["firstName", "lastName", "email", "address", "suppliesProvidedBy", "service", "hours", "date", "time", "customerConfirmed"],
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

/** Returns a runner bound to one conversation. ctx: { phone, conversationId, dryRun } */
function makeToolRunner(ctx) {
  return async function runTool(name, args = {}) {
    try {
      if (name === "get_quote") {
        const settings = await AiSettings.get();
        return calculateQuote(await loadUkServices(), args, settings.suppliesFee);
      }
      if (name === "check_availability") return await getAvailability(args.date, { time: args.time, hours: args.hours });
      if (name === "create_booking") return await createAiBooking(args, ctx);
      if (name === "find_my_bookings") return await findMyBookings(ctx);
      if (name === "reschedule_booking") return await rescheduleAiBooking(args, ctx);
      return { error: `Unknown tool ${name}` };
    } catch (err) {
      console.error(`[ai-tools] ${name} failed:`, err);
      return { error: "The booking system had a problem. Offer to pass the request to the team." };
    }
  };
}

module.exports = {
  declarations,
  makeToolRunner,
  calculateQuote,
  getAvailability,
  createAiBooking,
  findMyBookings,
  rescheduleAiBooking,
  normaliseTime,
  formatWindow,
  SPECIFIC_TIMES,
};
