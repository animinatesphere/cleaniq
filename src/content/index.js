// Page text, one JSON file per page:
//   src/content/services/<service-slug>.json
//   src/content/locations/<area-slug>.json
//   src/content/pages/<page>.json          (pages built from blocks: drag & drop in the editor)
// These files are the place to change page text. Content editors change them from /content-admin,
// which commits to GitHub (main), and Vercel rebuilds the site. Developers edit the same files.
//
// Import only what a page needs (each export below pulls in just its own files), so the homepage
// doesn't download every service and location page's text.
export { SERVICE_SLUGS, loadServiceContent } from "./services";
export { LOCATION_CONTENT } from "./locations";
export { PAGE_CONTENT } from "./pages";
