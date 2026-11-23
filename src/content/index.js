// Page text, one JSON file per page:
//   src/content/services/<service-slug>.json
//   src/content/locations/<area-slug>.json
// These files are the place to change page text. Content editors change them from /content-admin,
// which commits to GitHub (main), and Vercel rebuilds the site. Developers edit the same files.
// They're bundled at build time, so they add no extra downloads for visitors.
const services = import.meta.glob("./services/*.json", { eager: true, import: "default" });
const locations = import.meta.glob("./locations/*.json", { eager: true, import: "default" });

const bySlug = (files) =>
  Object.fromEntries(Object.entries(files).map(([path, data]) => [path.split("/").pop().replace(/\.json$/, ""), data]));

export const SERVICE_CONTENT = bySlug(services);
export const LOCATION_CONTENT = bySlug(locations);
