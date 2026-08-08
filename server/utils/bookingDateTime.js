/**
 * Build the exact booking start datetime from schedule.date + schedule.timeSlot.
 * schedule.date is stored as midnight UTC; timeSlot is "HH:MM-HH:MM" (UK local time).
 * Without this, "3h before 11am BST" fires at 10pm the previous night instead of 8am.
 */
function buildBookingDateTime(scheduleDate, timeSlot, preferredTime) {
  const base = new Date(scheduleDate);
  const slot = timeSlot || preferredTime;
  if (!slot) return base;

  const startStr = (slot.split(/[-–]/)[0] || "").trim(); // "11:00"
  const m = startStr.match(/^(\d{1,2}):(\d{2})$/);
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
