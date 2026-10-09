// Which offers a cleaner receives, Wecasa-style: each cleaner chooses the services they do, their
// working hours per weekday, their travel area (distance from home + extra/blocked postcode
// districts) and whether they accept homes with pets. Offers are also enriched with the travel
// estimate and the pay (first session / following sessions / monthly estimate).
const Worker = require("../models/Worker");
const { tokensOf } = require("./pushNotifications");
const Service = require("../models/Service");
const geo = require("./geo");
const { buildBookingDateTime } = require("./bookingDateTime");

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const TRAVEL_MODES = ["car", "bike", "transit"];
const DEFAULT_INTRO =
  "Hello, I'm {name}, your cleaner from Cleaniq. Our clean is booked for {date}. Do you have any questions or anything I should know?";

function defaultPreferences() {
  const workingHours = {};
  for (const d of DAYS) workingHours[d] = { on: true, start: "08:00", end: "20:00" };
  return {
    services: [], // empty = all services
    workingHours,
    travel: { mode: "car", radiusMiles: 10, homePostcode: "", home: null, addPostcodes: [], removePostcodes: [] },
    refusePets: false,
    autoIntro: { enabled: true, text: DEFAULT_INTRO },
  };
}

// The worker's saved preferences merged over the defaults (so older accounts get sensible ones).
function prefsOf(worker) {
  const d = defaultPreferences();
  const p = worker?.preferences || {};
  return {
    services: Array.isArray(p.services) ? p.services : d.services,
    workingHours: Object.fromEntries(DAYS.map((day) => [day, { ...d.workingHours[day], ...(p.workingHours?.[day] || {}) }])),
    travel: { ...d.travel, homePostcode: p.travel?.homePostcode || worker?.postcode || "", ...(p.travel || {}),
      homePostcode: (p.travel?.homePostcode || worker?.postcode || "").toUpperCase() },
    refusePets: Boolean(p.refusePets),
    autoIntro: { ...d.autoIntro, ...(p.autoIntro || {}) },
  };
}

const toMinutes = (hhmm) => {
  const m = String(hhmm || "").match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
function londonParts(date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(date)
    .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return { day: String(parts.weekday).toLowerCase(), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

const jobPostcode = (b) => b.details?.postcode || b.property?.postcode || geo.findPostcode(b.details?.address) || geo.findPostcode(b.property?.address);
const jobHours = (b) => Number(b.workerDuration || b.details?.duration || 0) || 0;
const hasPets = (b) => {
  const v = b.details?.hasPet ?? b.details?.pets ?? b.property?.hasPet;
  if (v === true || /^yes/i.test(String(v || ""))) return true;
  return (b.details?.extras || []).some((e) => /pet on premises:\s*yes/i.test(String(e?.name || e)));
};

// Service types by keyword, most specific first ("Carpet Deep Clean" is carpet, not deep cleaning).
const SERVICE_TYPES = [
  ["carpet", /carpet|rug/],
  ["upholstery", /upholster|sofa|mattress/],
  ["oven", /oven|hob|extractor/],
  ["fridge", /fridge|freezer/],
  ["window", /window/],
  ["tenancy", /tenancy|move[\s-]?(in|out)|vacate|check[\s-]?out clean/],
  ["construction", /construction|builder|renovation/],
  ["airbnb", /airbnb|short[\s-]?let|holiday let|turnover/],
  ["office", /office|commercial|workplace/],
  ["deep", /deep/],
  ["regular", /regular|domestic|house|home clean|general|standard/],
];
const typeOf = (name) => {
  const n = String(name || "").toLowerCase();
  const hit = SERVICE_TYPES.find(([, re]) => re.test(n));
  return hit ? hit[0] : null;
};
// A booking's service can list several quote items: "Carpet Deep Clean Bedrooms, Carpet Deep Clean Stairs".
const serviceParts = (service) => String(service || "").split(/\s*(?:,|\+|\n)\s*/).map((x) => x.trim()).filter(Boolean);

/** Does the job's service suit a cleaner who chose `selected` services? (empty = all services) */
function serviceMatches(selected, service) {
  if (!selected?.length) return true;
  const chosen = selected.map((s) => String(s).toLowerCase());
  const chosenTypes = new Set(chosen.map(typeOf).filter(Boolean));
  const parts = serviceParts(service);
  if (!parts.length) return true;
  let known = false;
  for (const part of parts) {
    const p = part.toLowerCase();
    if (chosen.includes(p) || chosen.some((c) => p.startsWith(c) || c.startsWith(p))) return true;
    const t = typeOf(p);
    if (t) {
      known = true;
      if (chosenTypes.has(t)) return true;
    }
  }
  // Nothing we recognise (a custom quote item): show it rather than hide it from everyone.
  return !known;
}

// Does this job suit this cleaner? jobPoint/homePoint are {lat,lng} (or null when unknown).
function checkMatch(prefs, booking, { jobPoint = null, homePoint = null } = {}) {
  const fails = [];
  if (!serviceMatches(prefs.services, booking.service)) fails.push("service");
  if (prefs.refusePets && hasPets(booking)) fails.push("pets");

  const startAt = booking.schedule?.date ? buildBookingDateTime(booking.schedule.date, booking.schedule.timeSlot, booking.schedule.preferredTime) : null;
  if (startAt) {
    const { day, minutes } = londonParts(startAt);
    const wh = prefs.workingHours[day];
    const timeKnown = Boolean(booking.schedule?.preferredTime || /\d:\d/.test(booking.schedule?.timeSlot || ""));
    if (!wh?.on) fails.push("day");
    else if (timeKnown) {
      const from = toMinutes(wh.start) ?? 0;
      const to = toMinutes(wh.end) ?? 24 * 60;
      if (minutes < from || minutes + jobHours(booking) * 60 > to) fails.push("hours");
    }
  }

  const district = geo.districtOf(jobPostcode(booking));
  const listed = (arr) => (arr || []).map((p) => geo.districtOf(p));
  const distanceMiles = geo.milesBetween(homePoint, jobPoint);
  if (district && listed(prefs.travel.removePostcodes).includes(district)) fails.push("area");
  else if (district && listed(prefs.travel.addPostcodes).includes(district)) { /* always in area */ }
  else if (distanceMiles != null && distanceMiles > Number(prefs.travel.radiusMiles || 0)) fails.push("distance");

  return { ok: fails.length === 0, fails, distanceMiles, travelMinutes: geo.travelMinutes(distanceMiles, prefs.travel.mode) };
}

// Visits per month by frequency, for the monthly estimate on regular offers.
const VISITS_PER_MONTH = { Weekly: 52 / 12, Fortnightly: 26 / 12, "Bi-weekly": 26 / 12, Monthly: 1, Quarterly: 1 / 3 };

// bonus: the cleaner's top-rated bonus (£/hr) to show on an offer; by default whatever is
// already on the booking (workerRate includes workerRateBonus).
async function payFor(booking, serviceCache = {}, { bonus } = {}) {
  const hours = jobHours(booking);
  const name = String(booking.service || "");
  if (!(name in serviceCache)) serviceCache[name] = await Service.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).lean();
  const svc = serviceCache[name];
  const frequency = booking.details?.frequency;
  const regular = Boolean(VISITS_PER_MONTH[frequency]);
  const onBooking = Number(booking.workerRateBonus) || 0;
  const extra = bonus != null ? Number(bonus) || 0 : onBooking;
  const baseRate = (Number(booking.workerRate) || 0) - onBooking || Number(svc?.workerHourlyRate) || 0;
  const rate = baseRate + extra;
  const following = regular ? (Number(svc?.workerFollowingRate) || Number(svc?.workerHourlyRate) || baseRate) + extra : null;
  // A later visit of a regular clean is already paid at the following-sessions rate.
  const isLaterVisit = Boolean(booking.payment?.chargeOnArrival);
  const firstRate = isLaterVisit ? following : rate;
  return {
    hours,
    firstRate,
    followingRate: following,
    bonus: extra,
    total: Math.round(firstRate * hours * 100) / 100,
    frequency: regular ? frequency : "Once",
    monthlyEstimate: regular ? Math.round(following * hours * VISITS_PER_MONTH[frequency] * 100) / 100 : null,
  };
}

// Feed / offer page: keep jobs that suit the cleaner and add distance, travel time and pay.
async function offersForWorker(worker, bookings) {
  const prefs = prefsOf(worker);
  const homePoint = prefs.travel.home || (prefs.travel.homePostcode ? await geo.pointFor(prefs.travel.homePostcode) : null);
  const points = await geo.lookup(bookings.map(jobPostcode).filter(Boolean));
  const serviceCache = {};
  const { bonus } = await require("./topRatedBonus").bonusFor(worker._id);
  const out = [];
  for (const b of bookings) {
    const jobPoint = points[geo.normalise(jobPostcode(b))] || null;
    const m = checkMatch(prefs, b, { jobPoint, homePoint });
    if (!m.ok) continue;
    const obj = b.toObject ? b.toObject() : b;
    out.push({ ...obj, offer: { distanceMiles: m.distanceMiles, travelMinutes: m.travelMinutes, travelMode: prefs.travel.mode, pay: await payFor(b, serviceCache, { bonus: b.assignedWorker ? undefined : bonus }) } });
  }
  return out;
}

// New-job alerts: only the cleaners the job suits.
async function workersForJob(booking, workers) {
  if (booking?.hiddenFromWorkers) return []; // switched off on the Job Visibility page
  const ids = workers.map((w) => w._id);
  const full = await Worker.find({ _id: { $in: ids } }).select("_id expoPushToken pushTokens preferences postcode").lean();
  const jobPoint = jobPostcode(booking) ? await geo.pointFor(jobPostcode(booking)) : null;
  const keep = [];
  for (const w of full) {
    const prefs = prefsOf(w);
    const homePoint = prefs.travel.home || (prefs.travel.homePostcode ? await geo.pointFor(prefs.travel.homePostcode) : null);
    if (checkMatch(prefs, booking, { jobPoint, homePoint }).ok) keep.push(w);
  }
  return keep;
}

function introText(template, { workerName, booking }) {
  const date = booking.schedule?.date
    ? `${new Date(booking.schedule.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${booking.schedule?.preferredTime ? ` at ${booking.schedule.preferredTime}` : ""}`
    : "your booked date";
  return String(template || DEFAULT_INTRO).replace(/\{name\}|\[name\]/gi, workerName).replace(/\{date\}|\[date\]/gi, date).slice(0, 500);
}

module.exports = {
  DAYS, TRAVEL_MODES, DEFAULT_INTRO, defaultPreferences, prefsOf, checkMatch, payFor, serviceMatches,
  offersForWorker, workersForJob, introText, jobPostcode,
};
