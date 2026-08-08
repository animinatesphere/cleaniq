function parseLocalTimeString(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;

  const firstPart = normalized.split(/[\-–—]/)[0].trim();
  const m = firstPart.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
  if (!m) return null;

  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3] ? m[3].toUpperCase() : null;

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  if (ampm) {
    if (ampm === "AM") {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }
  }

  if (hours < 0 || hours > 23) return null;
  return { hours, minutes };
}

function getBookingStartTime(timeSlot, preferredTime) {
  const slot = (timeSlot || "").trim();

  const explicitTime = parseLocalTimeString(slot);
  if (explicitTime) return explicitTime;

  if (/morning/i.test(slot)) return { hours: 8, minutes: 0 };
  if (/afternoon/i.test(slot)) return { hours: 12, minutes: 0 };
  if (/evening/i.test(slot)) return { hours: 16, minutes: 0 };
  if (/noon|midday/i.test(slot)) return { hours: 12, minutes: 0 };
  if (/flexible/i.test(slot) && preferredTime) {
    const flexible = parseLocalTimeString(preferredTime);
    if (flexible) return flexible;
  }

  if (preferredTime) {
    const flexible = parseLocalTimeString(preferredTime);
    if (flexible) return flexible;
  }

  return null;
}

function buildBookingDateTime(scheduleDate, timeSlot, preferredTime) {
  const base = new Date(scheduleDate);
  if (!timeSlot) return base;

  const startTime = getBookingStartTime(timeSlot, preferredTime);
  if (!startTime) return base;

  const { hours, minutes } = startTime;
  const dateStr = base.toISOString().split("T")[0];
  const [y, mo, d] = dateStr.split("-").map(Number);

  const noonUTC = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const ukNoonHour = parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hour12: false,
    }).format(noonUTC),
    10,
  );
  const ukOffset = ukNoonHour - 12;

  return new Date(Date.UTC(y, mo - 1, d, hours - ukOffset, minutes, 0, 0));
}

module.exports = { buildBookingDateTime };
