// Google Analytics 4 ecommerce through Google Tag Manager (GTM-WT7TPVFR), as in
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm
// GTM needs a "GA4 Event" tag for the custom event "purchase" with "Send Ecommerce data" on.

const sentKey = (id) => `ga4_purchase_${id}`;

/**
 * One purchase per booking — never sent twice for the same transaction (page reloads, back button).
 * @param {{ transactionId: string, value: number, tax?: number, currency?: string,
 *           service: string, hours?: number|null, frequency?: string }} p
 */
export function trackPurchase(p) {
  if (typeof window === "undefined" || !p?.transactionId || !(Number(p.value) > 0)) return false;
  try {
    if (localStorage.getItem(sentKey(p.transactionId))) return false;
    localStorage.setItem(sentKey(p.transactionId), "1");
  } catch { /* storage blocked: still send once for this page view */ }

  const value = Math.round(Number(p.value) * 100) / 100;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // clear the previous ecommerce object
  window.dataLayer.push({
    event: "purchase",
    ecommerce: {
      transaction_id: String(p.transactionId),
      value,
      tax: Math.round(Number(p.tax || 0) * 100) / 100,
      currency: p.currency || "GBP",
      items: [{
        item_id: String(p.service || "cleaning").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        item_name: p.service || "Cleaning",
        item_brand: "Cleaniq Services",
        item_category: "Cleaning",
        item_variant: p.frequency && p.frequency !== "Once" ? p.frequency : "One-off",
        price: value,
        quantity: 1,
      }],
    },
  });
  return true;
}

// Return pages after paying through a Stripe link: ask the server what was bought (only once it's
// paid — Stripe tells the server a moment after the customer lands here, so try a few times).
export async function trackPurchaseForBooking(bookingId, { tries = 6, delayMs = 2500 } = {}) {
  if (!bookingId) return false;
  const api = import.meta.env.VITE_API_URL;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${api}/bookings/${encodeURIComponent(bookingId)}/purchase-summary`);
      if (res.ok) {
        const s = await res.json();
        if (s.paid) return trackPurchase(s);
      }
    } catch { /* try again */ }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}
