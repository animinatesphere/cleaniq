// Website "Get a Quote" form → instant quote, emailed straight away.
//
// Priced from the admin price list exactly like the Quote Builder and the AI receptionist:
// hourly rate × the hours the customer chose, plus add-ons. The savings the form promises are
// applied to those add-ons (60% off carpet cleaning, 20% off oven/fridge cleaning). The quote
// email has an Accept button; accepting turns it into a booking (routes/quotes.js).
//
// Returns { quoteRef, grandTotal } or { skipped: reason } when the team should price it instead
// (e.g. a service that isn't charged by the hour, or a price-list item that's missing).
const { loadUkServices, quoteTaxSettings, QUOTE_DEFAULTS, SUPPLIES_LINE } = require("./aiTools");
const { rateForFrequency } = require("./pricing");

const CARPET_DISCOUNT = 60;
const EXTRA_DISCOUNT = 20;
const MAX_PER_EMAIL_PER_DAY = 3;

// Form choice → price-list name (admin → Price List).
const OVEN_ITEMS = { "Single oven": "Single Oven Cleaning", "Double oven": "Double Oven Cleaning", "Range oven": "Range Oven Cleaning" };
const FRIDGE_ITEMS = { "Single fridge": "Single fridge", "Fridge freezer": "Fridge and freezer", "American fridge freezer": "American fridge freeze" };
const CARPET_ITEM = "Carpet Cleaning";
const STAIRS_ITEM = "Stairs/Landing";

// Customer-typed text goes into the quote emails (theirs and the team copy): no HTML tags.
const plain = (v) => String(v ?? "").replace(/[<>]/g, "").trim();
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const money = (n) => Math.round(n * 100) / 100;

function addOn(services, name, qty, discount = 0) {
  const match = services.find((s) => s.category === "Extras" && norm(s.name) === norm(name) && Number(s.rate) > 0);
  if (!match) return { missing: name };
  const unitPrice = money(Number(match.rate) * (1 - discount / 100));
  return { name: discount ? `${match.name} – ${discount}% off` : match.name, qty, unitPrice };
}

/** Builds the quote lines for a checked quote request (see readQuoteRequest in routes/contact.js). */
async function priceQuoteRequest(q) {
  const services = await loadUkServices();
  const base = services.find((s) => s.type === "hourly" && s.category !== "Extras" && norm(s.name) === norm(q.service));
  if (!base) return { skipped: `${q.service} isn't priced by the hour, so the team will quote it` };
  if (!(q.hours >= 1)) return { skipped: "No hours chosen" };

  const wanted = [];
  if (q.carpets > 0) wanted.push([CARPET_ITEM, q.carpets, CARPET_DISCOUNT]);
  if (q.ovenType) wanted.push([OVEN_ITEMS[q.ovenType], 1, EXTRA_DISCOUNT]);
  if (q.fridgeType) wanted.push([FRIDGE_ITEMS[q.fridgeType], 1, EXTRA_DISCOUNT]);
  if (q.stairs > 0) wanted.push([STAIRS_ITEM, q.stairs, 0]);
  const extras = [];
  for (const [name, qty, discount] of wanted) {
    const line = addOn(services, name, qty, discount);
    if (line.missing) return { skipped: `"${line.missing}" has no price in the price list` };
    extras.push(line);
  }

  // Supplies brought by Cleaniq: the same fee as the AI receptionist's quotes (admin → AI settings).
  if (q.supplies === "Cleaniq") {
    const fee = Number((await require("../models/AiSettings").get()).suppliesFee) || 0;
    if (fee > 0) extras.push({ name: SUPPLIES_LINE, qty: 1, unitPrice: fee });
  }

  const unitPrice = rateForFrequency(base, "Once");
  const item = {
    service: base.name,
    customService: "",
    description: "",
    billingType: "hourly",
    qty: q.hours,
    unitPrice,
    extras,
    subtotal: money(unitPrice * q.hours + extras.reduce((sum, e) => sum + e.unitPrice * e.qty, 0)),
  };
  return { items: [item] };
}

async function sendInstantQuote(request) {
  const q = { ...request };
  for (const k of ["name", "address", "postcode", "phone", "notes", "property"]) q[k] = plain(q[k]);
  const Quote = require("../models/Quote");
  const recent = await Quote.countDocuments({ email: q.email, createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) } });
  if (recent >= MAX_PER_EMAIL_PER_DAY) return { skipped: "Several quotes were already sent to this email today" };

  const priced = await priceQuoteRequest(q);
  if (priced.skipped) return priced;

  const subtotal = money(priced.items.reduce((sum, i) => sum + i.subtotal, 0));
  // Creator / influencer code: their customer discount (admin → Commission), shown on the quote.
  let creatorCode = "";
  let discount = 0;
  if (q.ref) {
    const r = await require("./creators").checkCode(q.ref, q.email);
    if (r.valid) {
      creatorCode = r.creator.creator.code;
      discount = Number(r.discountPercent) || 0;
    }
  }
  const discountAmount = money((subtotal * discount) / 100);
  const afterDiscount = money(subtotal - discountAmount);
  const { includeVat, vatRate } = await quoteTaxSettings();
  const vat = includeVat ? money(afterDiscount * (vatRate / 100)) : 0;
  const grandTotal = money(afterDiscount + vat);
  const address = [q.address, q.postcode].filter(Boolean).join(", ");

  const { sendQuote } = require("../routes/quotes");
  const quote = await sendQuote({
    companyName: q.name,
    contactName: "",
    email: q.email,
    phone: q.phone,
    address,
    frequency: "once",
    serviceDate: q.date || null,
    serviceTimeSlot: q.time || null, // preferred arrival time; confirmed on the accept page
    vatRate,
    validDays: QUOTE_DEFAULTS.validDays,
    includeVat,
    sendCopy: true,
    paymentTerms: QUOTE_DEFAULTS.paymentTerms,
    depositRequired: false,
    depositPercent: 0,
    discount,
    creatorCode,
    notes: [QUOTE_DEFAULTS.notes, q.notes ? `Customer notes: ${q.notes}` : ""].filter(Boolean).join("\n"),
    quoteRef: `CLQ-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    items: priced.items,
    property: {
      bedrooms: q.bedrooms || 0,
      bathrooms: q.bathrooms || 0,
      kitchens: q.kitchens || 0,
      receptionRooms: q.livingRooms || 0,
      utilityRooms: q.utilityRooms || 0,
      conservatories: q.conservatories || 0,
      cloakrooms: q.cloakrooms || 0,
    },
    suppliesProvidedBy: q.supplies || "",
    parking: "",
    keyAccess: "",
    hasPet: q.hasPet || "",
    specialInstructions: [q.property && `Property: ${q.property}`, q.notes].filter(Boolean).join(". "),
    subtotal,
    discountAmount,
    subtotalAfterDiscount: afterDiscount,
    vat,
    grandTotal,
    depositAmount: 0,
    balanceDue: grandTotal,
  });
  console.log(`[quote-form] instant quote ${quote.quoteRef} emailed to ${q.email} (£${grandTotal})`);
  return { quoteRef: quote.quoteRef, grandTotal };
}

module.exports = { priceQuoteRequest, sendInstantQuote, CARPET_DISCOUNT, EXTRA_DISCOUNT };
