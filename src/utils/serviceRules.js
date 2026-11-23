// Booking rules for specific services or extras, shared by the booking page and the service pages.
// Matched by name, since names come from the booking system (admin → Services).

// The per-carpet price (e.g. "Carpet Cleaning (1 Bed )", £40) needs at least two carpets.
const PER_CARPET = /carpet cleaning\s*\(\s*1\s*bed/i;

/** Smallest quantity that can be booked for this extra (0 = no minimum). */
export const minQuantity = (name = "") => (PER_CARPET.test(name) ? 2 : 0);

/** Short note shown next to the price, or "" if there's no rule. */
export const priceNote = (name = "") => (PER_CARPET.test(name) ? "per carpet · minimum 2 carpets" : "");
