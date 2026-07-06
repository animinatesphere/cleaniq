// Converts "HH:MM" to minutes-since-midnight.
export const timeToMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// True if `startTime` falls inside any existing booked [start, end) window.
// We only block slots whose START TIME lands within a booked range — we don't
// extend by the new booking's duration, because other cleaners can handle
// concurrent jobs. Prevents selecting a time mid-way through an existing clean.
export const overlapsExistingRange = (startTime, _durationHours, ranges) => {
  const start = timeToMinutes(startTime);
  if (start === null) return false;
  return ranges.some((r) => start >= r.start && start < r.end);
};

// Builds a list of { start, end } minute ranges (in minutes-since-midnight)
// for every Flexible-time booking on a given date, using each booking's own
// duration so the full occupied window is blocked, not just its start time.
export const buildBookedRanges = (bookingsOnDate) =>
  bookingsOnDate
    .filter((b) => b.schedule?.timeSlot === "Flexible" && b.schedule?.preferredTime)
    .map((b) => {
      const start = timeToMinutes(b.schedule.preferredTime);
      const duration = b.details?.duration || b.workerDuration || 1;
      return { start, end: start + duration * 60 };
    })
    .filter((r) => r.start !== null);
