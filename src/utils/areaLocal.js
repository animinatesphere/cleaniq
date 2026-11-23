// Postcodes, homes and tips for each area page. The text lives in src/content/locations/<area>.json
// ("local"), edited in /content-admin or by hand.
import { LOCATION_CONTENT } from "../content";

export const AREA_LOCAL = Object.fromEntries(
  Object.entries(LOCATION_CONTENT).filter(([, d]) => d.local).map(([slug, d]) => [slug, d.local]),
);
