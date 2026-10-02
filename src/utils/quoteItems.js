// Quote line items: a main service (flat or hourly) plus optional add-ons (extras such as a
// fridge or oven clean), the same way the booking page works. Shared by the quote builder,
// its preview/PDF and the saved-quote view.

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export const itemName = (item) =>
  (item.service === "__custom__" ? item.customService : item.service || item.customService) || "";

export const extrasOf = (item) => (item.extras || []).filter((e) => e && e.name && num(e.qty) > 0);

export const itemMainTotal = (item) => num(item.unitPrice) * num(item.qty, 1);

export const itemExtrasTotal = (item) =>
  extrasOf(item).reduce((s, e) => s + num(e.unitPrice) * num(e.qty), 0);

export const itemTotal = (item) => itemMainTotal(item) + itemExtrasTotal(item);

export const gbp = (n) => `£${num(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Add-on lines for the printable quote / PDF.
export const extrasHtml = (item) =>
  extrasOf(item)
    .map((e) => `<br/><span style="font-size:11px;color:#0f766e;">+ ${esc(e.name)} &times; ${num(e.qty)} &mdash; ${gbp(num(e.unitPrice) * num(e.qty))}</span>`)
    .join("");

// Property & access details, as "Label: value" pairs (empty ones left out).
export const PROPERTY_ROOMS = [
  ["bedrooms", "Bedrooms"],
  ["bathrooms", "Bathrooms"],
  ["kitchens", "Kitchens"],
  ["receptionRooms", "Reception rooms"],
  ["cloakrooms", "Cloakrooms"],
  ["utilityRooms", "Utility rooms"],
  ["conservatories", "Conservatories"],
];

export function propertyLines(q) {
  const p = q?.property || {};
  const rooms = PROPERTY_ROOMS.filter(([k]) => num(p[k]) > 0).map(([k, label]) => `${num(p[k])} ${label.toLowerCase()}`);
  return [
    rooms.length ? ["Property", rooms.join(", ")] : null,
    q?.suppliesProvidedBy ? ["Cleaning supplies", q.suppliesProvidedBy === "Customer" ? "Provided by the customer" : "Brought by Cleaniq"] : null,
    q?.parking ? ["Parking", q.parking] : null,
    q?.keyAccess ? ["Access", q.keyAccess] : null,
    q?.hasPet ? ["Pets", q.hasPet] : null,
    q?.specialInstructions ? ["Instructions", q.specialInstructions] : null,
  ].filter(Boolean);
}
