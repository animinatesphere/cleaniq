// UK postcode → latitude/longitude using the free postcodes.io service (no API key), with a cache.
// Used to estimate distance and travel time between a cleaner's home and a job.
const axios = require("axios");

const CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const cache = new Map(); // "M145TQ" → { at, point: {lat,lng} | null }
let fetcher = async (url, body) => (body ? (await axios.post(url, body, { timeout: 8000 })).data : (await axios.get(url, { timeout: 8000 })).data);
function setGeoFetcherForTests(fn) {
  fetcher = fn;
  cache.clear();
}

const POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
const OUTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

const normalise = (p) => String(p || "").toUpperCase().replace(/\s+/g, "").trim();
// Full postcode found in free text (e.g. an address), formatted "M14 5TQ".
function findPostcode(text) {
  const m = String(text || "").match(POSTCODE_RE);
  return m ? `${m[1]} ${m[2]}`.toUpperCase() : "";
}
// Outward code / district, e.g. "M14 5TQ" → "M14", "BL0" → "BL0".
function districtOf(postcode) {
  const n = normalise(postcode);
  if (!n) return "";
  if (OUTCODE_RE.test(n)) return n;
  return n.length > 3 ? n.slice(0, -3) : n;
}

async function lookup(postcodes) {
  const wanted = [...new Set(postcodes.map(normalise).filter(Boolean))];
  const out = {};
  const missing = [];
  for (const p of wanted) {
    const hit = cache.get(p);
    if (hit && Date.now() - hit.at < CACHE_MS) out[p] = hit.point;
    else missing.push(p);
  }
  const full = missing.filter((p) => !OUTCODE_RE.test(p));
  const outcodes = missing.filter((p) => OUTCODE_RE.test(p));
  for (let i = 0; i < full.length; i += 100) {
    try {
      const data = await fetcher("https://api.postcodes.io/postcodes", { postcodes: full.slice(i, i + 100) });
      for (const r of data?.result || []) {
        const key = normalise(r.query);
        const point = r.result ? { lat: r.result.latitude, lng: r.result.longitude } : null;
        cache.set(key, { at: Date.now(), point });
        out[key] = point;
      }
    } catch (e) {
      console.error("[geo] postcode lookup failed:", e.message);
    }
  }
  for (const oc of outcodes) {
    try {
      const data = await fetcher(`https://api.postcodes.io/outcodes/${encodeURIComponent(oc)}`);
      const point = data?.result ? { lat: data.result.latitude, lng: data.result.longitude } : null;
      cache.set(oc, { at: Date.now(), point });
      out[oc] = point;
    } catch {
      cache.set(oc, { at: Date.now(), point: null });
      out[oc] = null;
    }
  }
  return out; // keyed by normalised postcode
}

async function pointFor(postcode) {
  const key = normalise(postcode);
  if (!key) return null;
  return (await lookup([key]))[key] || null;
}

function milesBetween(a, b) {
  if (!a || !b) return null;
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

// Rough door-to-door time in Greater Manchester: straight-line distance × 1.3 for roads, at a
// typical urban speed for each way of travelling. Shown to cleaners as "≈ 18 min".
const SPEED_MPH = { car: 18, bike: 9, transit: 11 };
function travelMinutes(miles, mode = "car") {
  if (miles == null) return null;
  return Math.max(5, Math.round(((miles * 1.3) / (SPEED_MPH[mode] || SPEED_MPH.car)) * 60));
}

// Is this a real UK postcode? "valid", "invalid" (wrong shape, or postcodes.io doesn't know it),
// or "unchecked" (postcodes.io couldn't be reached — don't block anyone over that).
async function postcodeStatus(text) {
  const pc = findPostcode(text);
  if (!pc) return { status: "invalid", postcode: "" };
  const key = normalise(pc);
  const out = await lookup([key]);
  if (!(key in out)) return { status: "unchecked", postcode: pc };
  return { status: out[key] ? "valid" : "invalid", postcode: pc };
}

module.exports = { findPostcode, districtOf, normalise, lookup, pointFor, milesBetween, travelMinutes, postcodeStatus, setGeoFetcherForTests };
