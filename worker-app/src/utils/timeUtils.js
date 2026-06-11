/**
 * Time Display Utilities
 * Converts schedule objects to human-readable arrival times
 */

/**
 * Format a 24h time string (e.g. "14:00") to 12h format (e.g. "2:00 PM")
 */
export const formatTime12h = (time24) => {
  if (!time24 || typeof time24 !== "string") return time24;
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

/**
 * Get the display time from a schedule object.
 * If timeSlot is "Flexible" and a preferredTime exists, show the actual preferred time.
 * Otherwise show the timeSlot (Morning/Afternoon/Evening).
 * Falls back to "Time TBC" if nothing is available.
 */
export const getDisplayTime = (schedule) => {
  if (!schedule) return "Time TBC";

  // If Flexible with a specific preferred time, show the actual time
  if (schedule.timeSlot === "Flexible" && schedule.preferredTime) {
    return formatTime12h(schedule.preferredTime);
  }

  // For standard time slots (Morning, Afternoon, Evening)
  if (schedule.timeSlot && schedule.timeSlot !== "Flexible") {
    return schedule.timeSlot;
  }

  // Fallback to preferredTime if timeSlot is missing
  if (schedule.preferredTime) {
    return formatTime12h(schedule.preferredTime);
  }

  return "Time TBC";
};
