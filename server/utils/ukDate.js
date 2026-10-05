// Turns what a customer says about a date into an exact date (UK time), so the AI doesn't have
// to work out calendar dates itself. Accepts:
//   2026-10-28 · today · tomorrow · day after tomorrow · friday · this friday · next friday
//   28th · the 28th · 28 oct · 28th of october · october 28 · 28/10 · 28/10/2026 · 28-10-26
//   in 3 days · in a week · next week (= 7 days from today)
// A date without a year that has already passed this year means next year.

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const NUMBER_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fourteen: 14 };

// Today's date in the UK as { y, m (1-12), d, dow (0=Sun) }.
function ukToday(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "numeric", day: "numeric", weekday: "long" })
      .formatToParts(now).map((p) => [p.type, p.value]),
  );
  return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day), dow: WEEKDAYS.indexOf(parts.weekday.toLowerCase()) };
}

// Calendar maths on plain dates (no time zones involved).
const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const addDays = (date, n) => new Date(date.getTime() + n * 86400000);
const iso = (date) => date.toISOString().slice(0, 10);
const valid = (y, m, d) => { const t = utc(y, m, d); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; };

// "Friday 9 October 2026" (no comma, the way it's read back to customers).
function label(date) {
  return date.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(",", "");
}

/**
 * @returns {{ iso: string, label: string } | { error: string }}
 *   iso: "2026-10-28", label: "Wednesday 28 October 2026"
 */
function resolveUkDate(input, now = new Date()) {
  const raw = String(input || "").trim().toLowerCase().replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
  if (!raw) return { error: "No date given." };
  const t = ukToday(now);
  const today = utc(t.y, t.m, t.d);
  const done = (date) => ({ iso: iso(date), label: label(date) });
  let m;

  // 2026-10-28
  if ((m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    return valid(y, mo, d) ? done(utc(y, mo, d)) : { error: `"${input}" isn't a real date.` };
  }
  if (/^(today|tonight)$/.test(raw)) return done(today);
  if (/^(tomorrow|tmrw|tmr)$/.test(raw)) return done(addDays(today, 1));
  if (/^(the )?day after tomorrow$/.test(raw)) return done(addDays(today, 2));

  // in 3 days / in a week / next week
  if ((m = raw.match(/^in (\w+) (day|days|week|weeks)$/))) {
    const n = Number(m[1]) || NUMBER_WORDS[m[1]];
    if (n) return done(addDays(today, m[2].startsWith("week") ? n * 7 : n));
  }
  if (raw === "next week") return done(addDays(today, 7));

  // friday / this friday / next friday / on friday
  if ((m = raw.match(/^(?:on )?(this |next |coming |this coming )?(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)[a-z]*$/))) {
    const target = WEEKDAYS.findIndex((w) => w.startsWith(m[2].slice(0, 3)));
    let diff = (target - t.dow + 7) % 7;
    if (diff === 0) diff = 7; // "friday" said on a Friday means next week's
    if (m[1] && m[1].trim() === "next" && diff < 7) {
      // UK speech: "next Friday" usually means the Friday of next week, unless it's within 2 days.
      if (diff <= 2) diff += 7;
    }
    return done(addDays(today, diff));
  }

  const monthIndex = (word) => MONTHS.findIndex((mo) => mo.startsWith(word.slice(0, 3)));
  const fromDayMonth = (d, mo, y) => {
    if (y !== undefined) {
      const yy = y < 100 ? 2000 + y : y;
      return valid(yy, mo, d) ? done(utc(yy, mo, d)) : { error: `"${input}" isn't a real date.` };
    }
    if (!valid(t.y, mo, d) && !valid(t.y + 1, mo, d)) return { error: `"${input}" isn't a real date.` };
    let date = valid(t.y, mo, d) ? utc(t.y, mo, d) : utc(t.y + 1, mo, d);
    if (date < today) date = utc(t.y + 1, mo, d);
    return done(date);
  };

  // 28/10, 28/10/2026, 28-10-26 (UK order: day first)
  if ((m = raw.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/))) {
    return fromDayMonth(+m[1], +m[2], m[3] !== undefined ? +m[3] : undefined);
  }
  // 28 oct, 28th october, 28th of october 2026, the 28th of oct
  if ((m = raw.match(/^(?:the )?(\d{1,2})(?:st|nd|rd|th)?(?: of)? ([a-z]+)(?: (\d{4}))?$/)) && monthIndex(m[2]) >= 0) {
    return fromDayMonth(+m[1], monthIndex(m[2]) + 1, m[3] !== undefined ? +m[3] : undefined);
  }
  // october 28, oct 28th 2026
  if ((m = raw.match(/^([a-z]+) (\d{1,2})(?:st|nd|rd|th)?(?: (\d{4}))?$/)) && monthIndex(m[1]) >= 0) {
    return fromDayMonth(+m[2], monthIndex(m[1]) + 1, m[3] !== undefined ? +m[3] : undefined);
  }
  // the 28th / 28th — this month, or next month if it has passed
  if ((m = raw.match(/^(?:the |on the )?(\d{1,2})(?:st|nd|rd|th)?$/))) {
    const d = +m[1];
    let [y, mo] = [t.y, t.m];
    if (d < t.d) { mo += 1; if (mo > 12) { mo = 1; y += 1; } }
    return valid(y, mo, d) ? done(utc(y, mo, d)) : { error: `There's no ${d}th in ${MONTHS[mo - 1]}.` };
  }
  return { error: `I couldn't work out the date from "${input}". Ask the customer for the day and month, e.g. "Wednesday 28 October".` };
}

// The next `days` days, for the AI's instructions ("Mon 5 Oct = 2026-10-05").
function upcomingCalendar(days = 14, now = new Date()) {
  const t = ukToday(now);
  const start = utc(t.y, t.m, t.d);
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(start, i);
    const name = d.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).replace(",", "");
    return `${i === 0 ? "Today " : i === 1 ? "Tomorrow " : ""}${name} = ${iso(d)}`;
  }).join("\n");
}

module.exports = { resolveUkDate, upcomingCalendar, ukToday };
