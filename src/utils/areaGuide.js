// Local guide for each area page. The text lives in src/content/locations/<area>.json ("guide"),
// edited in /content-admin or by hand. Used by the location pages and the homepage area links.
import { LOCATION_CONTENT } from "../content";

export const AREA_GUIDE = Object.fromEntries(
  Object.entries(LOCATION_CONTENT).filter(([, d]) => d.guide).map(([slug, d]) => [slug, d.guide]),
);
