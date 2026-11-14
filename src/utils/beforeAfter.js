import { SERVICE_PAGES } from "./servicePages";

// Real before & after photos from our jobs, found automatically in src/assets/before-after/
// (named <service>-<number>-before.jpg / -after.jpg — see the README there).
const FILES = import.meta.glob("../assets/before-after/*.{jpg,jpeg,png,webp}", { eager: true, import: "default" });

// Optional caption per pair, and "side" for pairs taken from different angles (shown side by side
// instead of with the slider, which needs both photos lined up). Real jobs only.
const DETAILS = {
  "oven-1": { caption: "Oven door glass and racks: grease and burnt-on stains removed", order: 1 },
  "deep-1": { caption: "Fridge-freezer: spills and mould around the door seal cleaned away", order: 2 },
  "airbnb-1": { caption: "Airbnb turnover: bathroom cleaned and ready for the next guests", side: true, order: 3 },
  "airbnb-2": { caption: "Airbnb turnover: twin room stripped and remade with fresh linen", side: true, order: 4 },
  "deep-2": { caption: "Fridge: shelves, drawers and back wall wiped clean", order: 5 },
  "airbnb-3": { caption: "Airbnb turnover: living room cleared and reset between guests", side: true, order: 6 },
};

const KEYS = ["end-of-tenancy", "post-construction", "deep", "airbnb", "office", "regular", "general", "oven", "carpet"];

const PAIRS = (() => {
  const found = {};
  for (const [path, src] of Object.entries(FILES)) {
    const m = path.split("/").pop().toLowerCase().match(/^(.+)-(\d+)-(before|after)\.(jpe?g|png|webp)$/);
    if (!m || !KEYS.includes(m[1])) continue;
    const id = `${m[1]}-${m[2]}`;
    found[id] = { ...(found[id] || { service: m[1], n: Number(m[2]) }), [m[3]]: src };
  }
  return Object.values(found)
    .filter((p) => p.before && p.after)
    .map((p) => {
      const page = SERVICE_PAGES.find((s) => s.slug.startsWith(`${p.service}-`));
      const extra = DETAILS[`${p.service}-${p.n}`] || {};
      return { ...p, ...extra, label: extra.caption || page?.name || p.service };
    })
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || KEYS.indexOf(a.service) - KEYS.indexOf(b.service) || a.n - b.n);
})();

/** Pairs for a service page slug (e.g. "oven-cleaning-manchester"), or all of them. */
export const beforeAfterFor = (slug) => (slug ? PAIRS.filter((p) => slug.startsWith(`${p.service}-`)) : PAIRS);
