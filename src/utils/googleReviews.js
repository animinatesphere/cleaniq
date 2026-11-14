import { useEffect, useState } from "react";

// Real reviews from Cleaniq Services' Google Business Profile, copied word for word.
// Only add reviews that exist on Google; keep the summary figures in sync with the profile.
export const GOOGLE_RATING = "5.0";
export const GOOGLE_REVIEW_COUNT = 19;
export const GOOGLE_REVIEWS_URL = "https://share.google/Em3ByHTQsa7wLVDAd";

export const GOOGLE_REVIEWS = [
  {
    name: "Precious W.",
    rating: 5,
    text: "I am very pleased with Cleaniq Services. The team was punctual, thorough, and professional throughout. Every corner was cleaned to a high standard and the results spoke for themselves. Great value and easy to work with. Will definitely be booking again soon.",
  },
  {
    name: "Aneela A.",
    rating: 5,
    text: "Excellent cleaning - on time and efficient. Managed to remove paint stain from the bathroom that previous cleaners have been unable to do. Would use again.",
  },
  {
    name: "Ud W.",
    rating: 5,
    text: "Good service I had today I must say. Kelvin was especially very thorough.He went beyond just cleaning to helping to arrange my new kitchen cabinets after having them fixed by my council.so kind.",
  },
];

// ── Live reviews ─────────────────────────────────────────────────────────────
// The server reads the latest reviews from Google every few hours (GET /api/reviews/google).
// Until they arrive, or if Google isn't set up / reachable, the reviews above are shown.

const FALLBACK = {
  rating: GOOGLE_RATING,
  count: GOOGLE_REVIEW_COUNT,
  url: GOOGLE_REVIEWS_URL,
  reviews: GOOGLE_REVIEWS,
  live: false,
};

let cached = null; // shared by every component on the page, so Google is asked once
let request = null;

function loadLive() {
  if (!request) {
    request = fetch(`${import.meta.env.VITE_API_URL}/reviews/google`)
      .then((r) => (r.status === 200 ? r.json() : null))
      .then((d) => {
        if (!d || !d.count) return FALLBACK;
        cached = {
          rating: Number(d.rating || GOOGLE_RATING).toFixed(1),
          count: d.count,
          url: d.url || GOOGLE_REVIEWS_URL,
          // Keep the hand-picked reviews if Google sent none with text.
          reviews: d.reviews?.length ? d.reviews : GOOGLE_REVIEWS,
          live: true,
        };
        return cached;
      })
      .catch(() => FALLBACK);
  }
  return request;
}

/** { rating: "5.0", count: 19, url, reviews: [{ name, rating, text, photo?, when?, url? }], live } */
export function useGoogleReviews() {
  const [data, setData] = useState(cached || FALLBACK);
  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    loadLive().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);
  return data;
}
