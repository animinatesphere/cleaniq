// Build-time rendering of public pages (scripts/prerender.mjs), so search engines and AI crawlers
// get each page's real title, description, canonical and text without running JavaScript.
// The browser still starts the app from src/main.jsx exactly as before.
import { StrictMode } from "react";
import { prerenderToNodeStream } from "react-dom/static";
import { StaticRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { RegionProvider } from "./context/RegionContext";
import App from "./App.jsx";
import { AREAS } from "./utils/areas";
import { SERVICE_PAGES, servicePagePath } from "./utils/servicePages";

// Every public page that's rendered to static HTML at build time and listed in sitemap.xml
// (scripts/prerender.mjs). Built from the same data the site uses, so a new area or service page
// is included automatically. Blog pages are rendered on request by api/blog-page.js instead, and
// logged-in, booking-payment and admin pages stay browser-only.
export const PRERENDER_ROUTES = [
  "/",
  "/about",
  "/services",
  "/booking",
  "/get-a-quote",
  "/pages/contact",
  "/recruitment",
  ...SERVICE_PAGES.map((p) => servicePagePath(p.slug)),
  ...AREAS.map((a) => `/locations/${a.slug}`),
  "/privacy",
  "/terms",
];

const streamToString = async (stream) => {
  let html = "";
  for await (const chunk of stream) html += chunk.toString();
  return html;
};

/** @returns {Promise<{ html: string, head: string }>} */
export async function render(url) {
  const helmetContext = {};
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <RegionProvider>
            <App />
          </RegionProvider>
        </StaticRouter>
      </HelmetProvider>
    </StrictMode>,
    // Keep each page's content inline. By default React moves big sections inside <Suspense> into a
    // hidden block at the end of the HTML (swapped in by a script), so crawlers that don't run
    // JavaScript would see an empty <main>.
    { progressiveChunkSize: Number.POSITIVE_INFINITY },
  );
  const html = await streamToString(prelude);
  const h = helmetContext.helmet;
  const head = h ? [h.title, h.meta, h.link, h.script].map((x) => x?.toString() || "").join("\n") : "";
  return { html, head };
}
