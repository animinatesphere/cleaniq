// Live Google reviews for the website, from the Google Places API (New).
//
// Needs GOOGLE_PLACES_API_KEY in the server .env. GOOGLE_PLACE_ID is optional: without it the
// business is looked up once by name/address (GOOGLE_PLACE_QUERY) and the ID is remembered.
//
// Google returns the rating, total review count and up to 5 reviews per request. Each refresh
// (every 6 hours) adds any new ones to a saved list, so the site keeps more than 5 over time.
// Google's terms allow keeping this content for up to 30 days, so reviews Google hasn't returned
// for 30 days are dropped, and the site always links to the full list on Google.
const SystemSetting = require("../models/SystemSetting");

const KEY = "googleReviews";
const REFRESH_MS = 6 * 60 * 60 * 1000;
const KEEP_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_STARS = 4; // the website shows 4★ and 5★ reviews; the rating and count are always the real totals
const DEFAULT_QUERY = "Cleaniq Services, 20 Swan Street, Manchester M4 5JW";

const apiKey = () => process.env.GOOGLE_PLACES_API_KEY || "";

async function placesFetch(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey(), ...(options?.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Places ${res.status}: ${body?.error?.message || res.statusText}`);
  return body;
}

async function findPlaceId() {
  const body = await placesFetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress" },
    body: JSON.stringify({ textQuery: process.env.GOOGLE_PLACE_QUERY || DEFAULT_QUERY, regionCode: "GB" }),
  });
  const place = body.places?.[0];
  if (!place) throw new Error("Google couldn't find the business. Set GOOGLE_PLACE_ID in the server .env.");
  console.log(`[google-reviews] using place "${place.displayName?.text}" (${place.formattedAddress}) id ${place.id}`);
  return place.id;
}

const loadSaved = async () => (await SystemSetting.findOne({ key: KEY }).lean())?.value || null;
const save = (value) => SystemSetting.updateOne({ key: KEY }, { $set: { value, updatedAt: new Date() } }, { upsert: true });

/** Fetches the latest from Google and merges it into the saved copy. */
async function refresh() {
  const saved = (await loadSaved()) || {};
  const placeId = process.env.GOOGLE_PLACE_ID || saved.placeId || (await findPlaceId());
  const body = await placesFetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en&regionCode=GB`, {
    method: "GET",
    headers: { "X-Goog-FieldMask": "id,rating,userRatingCount,reviews,googleMapsUri" },
  });

  const now = Date.now();
  const byId = new Map((saved.reviews || []).map((r) => [r.id, r]));
  for (const r of body.reviews || []) {
    byId.set(r.name, {
      id: r.name,
      name: r.authorAttribution?.displayName || "Google user",
      authorUrl: r.authorAttribution?.uri || "",
      photo: r.authorAttribution?.photoUri || "",
      rating: r.rating || 0,
      text: (r.originalText?.text || r.text?.text || "").trim(),
      publishTime: r.publishTime || null,
      when: r.relativePublishTimeDescription || "",
      url: r.googleMapsUri || "",
      seenAt: now,
    });
  }
  const reviews = [...byId.values()]
    .filter((r) => now - (r.seenAt || 0) < KEEP_MS)
    .sort((a, b) => new Date(b.publishTime || 0) - new Date(a.publishTime || 0));

  const value = {
    placeId,
    rating: body.rating ?? saved.rating ?? null,
    count: body.userRatingCount ?? saved.count ?? null,
    url: body.googleMapsUri || saved.url || "",
    reviews,
    fetchedAt: now,
  };
  await save(value);
  return value;
}

let refreshing = null;
const refreshOnce = () => {
  if (!refreshing) refreshing = refresh().catch((e) => { console.error("[google-reviews]", e.message); return null; }).finally(() => { refreshing = null; });
  return refreshing;
};

/**
 * What the website shows: { rating, count, url, reviews: [...] } or null when not set up yet.
 * Answers from the saved copy straight away and refreshes in the background when it's old.
 */
async function getReviews() {
  if (!apiKey()) return null;
  let data = await loadSaved();
  if (!data) data = await refreshOnce();
  else if (Date.now() - (data.fetchedAt || 0) > REFRESH_MS) refreshOnce();
  if (!data) return null;
  return {
    rating: data.rating,
    count: data.count,
    url: data.url,
    fetchedAt: data.fetchedAt,
    reviews: (data.reviews || []).filter((r) => r.rating >= MIN_STARS && r.text).slice(0, 12)
      .map(({ name, authorUrl, photo, rating, text, when, publishTime, url }) => ({ name, authorUrl, photo, rating, text, when, publishTime, url })),
  };
}

module.exports = { getReviews, refresh };
