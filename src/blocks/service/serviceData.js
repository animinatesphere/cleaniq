// Live prices and links for a service page (/service/<slug>), from the booking system's price list.
import { useEffect, useState } from "react";
import { priceNote } from "../../utils/serviceRules";
import { SERVICE_PAGES } from "../../utils/servicePages";
import { whatsappLink } from "../../utils/contact";

const slugify = (name) => String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** The booking-system service that belongs to a page (the main "Base" service, never an add-on). */
export const matchServiceForSlug = (slug, services) => {
  const matches = services.filter((s) => {
    const nameSlug = slugify(s.name);
    return slug.includes(nameSlug) || nameSlug.includes(slug.split("-")[0]);
  });
  return matches.find((s) => s.category === "Base") || matches[0] || null;
};

export const formatPrice = (s) => `£${Number(s.rate).toFixed(2)}${s.type === "hourly" ? " per hour" : ""}`;

/** Price list options whose names contain any of the keywords, cheapest first. */
export const priceListFor = (keywords, services) => {
  const words = (keywords || []).map((k) => String(typeof k === "string" ? k : k?.text || "").toLowerCase()).filter(Boolean);
  if (!words.length) return [];
  const seen = new Set();
  return services
    .filter((s) => Number(s.rate) > 0 && words.some((k) => s.name.toLowerCase().includes(k)))
    .filter((s) => {
      const key = slugify(s.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(a.rate) - Number(b.rate));
};

/** Words that pick each page's extra price list options (e.g. carpet: rooms, stairs, upholstery). */
export const PRICE_KEYWORDS = {
  "oven-cleaning-manchester": ["oven"],
  "carpet-cleaning-manchester": ["carpet", "stairs", "upholstery"],
};

const cheapestForPage = (slug, services, keywords = PRICE_KEYWORDS[slug]) => {
  const main = matchServiceForSlug(slug, services);
  const options = priceListFor(keywords, services.filter((s) => s !== main));
  return [main, ...options].filter((s) => s && s.rate != null).sort((a, b) => Number(a.rate) - Number(b.rate))[0];
};
const formatFromPrice = (s) => (s && s.rate != null ? `From £${Number(s.rate).toFixed(2)}${s.type === "hourly" ? "/hr" : ""}` : null);
export const fromPriceForPage = (slug, services, keywords) => formatFromPrice(cheapestForPage(slug, services, keywords));

/** Prices built into the page at build time (scripts/prerender.mjs), then refreshed live. */
export function useLiveServices() {
  const [services, setServices] = useState(() => (typeof window !== "undefined" && window.__SERVICES__) || globalThis.__SERVICES__ || []);
  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.VITE_API_URL}/services?region=UK&booking=1`)
      .then((res) => res.json())
      .then((data) => { if (active && Array.isArray(data)) setServices(data); })
      .catch((err) => console.error("Failed to fetch prices", err));
    return () => { active = false; };
  }, []);
  return services;
}

/** Everything a service page's blocks need: prices, booking/quote links, related pages. */
export function serviceInfo(slug, services, { priceKeywords, quoteMessage } = {}) {
  const keywords = priceKeywords?.length ? priceKeywords : PRICE_KEYWORDS[slug];
  const main = matchServiceForSlug(slug, services);
  const pageInfo = SERVICE_PAGES.find((p) => p.slug === slug);
  return {
    slug,
    services,
    pageInfo,
    price: fromPriceForPage(slug, services, keywords),
    priceNote: priceNote(cheapestForPage(slug, services, keywords)?.name),
    bookingLink: main?.name ? `/booking?service=${encodeURIComponent(main.name)}` : "/booking",
    quoteLink: whatsappLink(quoteMessage || `Hi Cleaniq! I'd like a quote for ${pageInfo ? pageInfo.name.toLowerCase() : "a clean"}.`),
    priceList: priceListFor(keywords, services.filter((s) => s !== main)),
    related: SERVICE_PAGES.filter((p) => p.slug !== slug),
  };
}
