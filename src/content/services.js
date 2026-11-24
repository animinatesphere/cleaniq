// Service pages' content (src/content/services/<slug>.json). Each page loads only its own file.
const FILES = import.meta.glob("./services/*.json", { import: "default" });
const cache = {};

/** Slugs that have a service page. */
export const SERVICE_SLUGS = Object.keys(FILES).map((p) => p.replace("./services/", "").replace(".json", ""));

/** A promise of the page's content (the same promise each time, so React can wait for it). */
export function loadServiceContent(slug) {
  const load = FILES[`./services/${slug}.json`];
  if (!load) return null;
  return (cache[slug] ||= load());
}
