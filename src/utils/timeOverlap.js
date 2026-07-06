// Converts "HH:MM" to minutes-since-midnight.
export const timeToMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// True if `startTime` falls inside any existing booked [start, end) window.
// The end already includes a 30-min rest buffer (see buildBookedRanges),
// so a slot landing in that buffer is also correctly blocked here.
export const overlapsExistingRange = (startTime, _durationHours, ranges) => {
  const start = timeToMinutes(startTime);
  if (start === null) return false;
  return ranges.some((r) => start >= r.start && start < r.end);
};

// Returns the actual start time in "HH:MM" format for any booking,
// regardless of whether it came from the web app (timeSlot="Flexible",
// preferredTime="HH:MM") or the customer app (timeSlot="HH:MM", no preferredTime).
const getBookingStartTime = (b) => {
  if (b.schedule?.preferredTime) return b.schedule.preferredTime;
  if (b.schedule?.time && b.schedule.time.includes(":")) return b.schedule.time;
  if (b.schedule?.timeSlot && b.schedule.timeSlot.includes(":")) return b.schedule.timeSlot;
  return null;
};

// Builds a list of { start, end } minute ranges (in minutes-since-midnight)
// for every timed booking on a given date. Handles both formats:
//   • Web/admin:       timeSlot="Flexible", preferredTime="HH:MM"
//   • Customer app:    timeSlot="HH:MM", time="HH:MM"
export const buildBookedRanges = (bookingsOnDate) =>
  bookingsOnDate
    .map((b) => {
      const timeStr = getBookingStartTime(b);
      if (!timeStr) return null;
      const start = timeToMinutes(timeStr);
      if (start === null) return null;
      const duration = b.details?.duration || b.workerDuration || 1;
      // +30 min rest buffer so the slot immediately after the job is also blocked.
      return { start, end: start + Number(duration) * 60 + 30 };
    })
    .filter(Boolean);
