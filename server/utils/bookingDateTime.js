/**
 * Build the exact booking start datetime from schedule.date + schedule.timeSlot.
 * schedule.date is stored as midnight UTC; timeSlot is "HH:MM-HH:MM" (UK local time).
 * Without this, "3h before 11am BST" fires at 10pm the previous night instead of 8am.
 *
 * Admin bookings use named slots ("Morning", "Afternoon", "Evening", "Flexible").
 * Customer bookings use plain "HH:MM" stored in both timeSlot and preferredTime.
 */
const NAMED_SLOT_TIMES = { Morning: "09:00", Afternoon: "12:00", Evening: "16:00" };
const NAMED_SLOTS = new Set(["Morning", "Afternoon", "Evening", "Flexible"]);

function resolveTimeStr(timeSlot, preferredTime) {
  // If preferredTime is a valid HH:MM always prefer it — it's the exact time
  if (preferredTime && /^\d{1,2}:\d{2}$/.test((preferredTime || "").trim())) {
    return preferredTime.trim();
  }
  // timeSlot is a specific HH:MM or HH:MM-HH:MM (customer bookings)
  if (timeSlot && !NAMED_SLOTS.has(timeSlot)) {
    return (timeSlot.split(/[-–]/)[0] || "").trim();
  }
  // Named slot fallback times
  if (timeSlot && NAMED_SLOT_TIMES[timeSlot]) {
    return NAMED_SLOT_TIMES[timeSlot];
  }
  return null;
}

function buildBookingDateTime(scheduleDate, timeSlot, preferredTime) {
  const base = new Date(scheduleDate);
  const slot = resolveTimeStr(timeSlot, preferredTime);
  if (!slot) return base;

  const m = slot.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return base;

  const hours   = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);

  // Get the calendar date from the UTC timestamp
  const dateStr = base.toISOString().split("T")[0]; // "2026-08-07"
  const [y, mo, d] = dateStr.split("-").map(Number);

  // Determine the UK UTC offset on this date (+1 BST, +0 GMT)
  const noonUTC = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const ukNoonHour = parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hour12: false,
    }).format(noonUTC),
    10
  );
  const ukOffset = ukNoonHour - 12; // +1 in BST, 0 in GMT

  // Convert UK local time → UTC by subtracting the offset
  return new Date(Date.UTC(y, mo - 1, d, hours - ukOffset, minutes, 0, 0));
}

module.exports = { buildBookingDateTime };
