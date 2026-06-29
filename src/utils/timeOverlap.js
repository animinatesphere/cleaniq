// Converts "HH:MM" to minutes-since-midnight.
export const timeToMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// True if a job starting at `startTime` for `durationHours` would overlap
// any existing [start, end) range in `ranges`. A cleaner can only be in one
// place at a time, so any overlap - not just an exact time match - blocks
// the slot.
export const overlapsExistingRange = (startTime, durationHours, ranges) => {
  const start = timeToMinutes(startTime);
  if (start === null) return false;
  const end = start + (durationHours || 0) * 60;
  return ranges.some((r) => start < r.end && r.start < end);
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
