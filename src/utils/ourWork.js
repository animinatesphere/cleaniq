// Photos from our real jobs (src/assets/our-work/<set>-<n>.jpg), shown as a gallery on the matching
// service pages. Captions name the room only: we don't say which town or customer a photo is from.
const FILES = import.meta.glob("../assets/our-work/*.{jpg,jpeg,png,webp}", { eager: true, import: "default" });

const CAPTIONS = {
  "end-of-tenancy-1.jpg": "Kitchen",
  "end-of-tenancy-2.jpg": "Bathroom",
  "end-of-tenancy-3.jpg": "Living room",
  "end-of-tenancy-4.jpg": "Kitchen",
  "end-of-tenancy-5.jpg": "Oven",
  "end-of-tenancy-6.jpg": "Sink",
  "regular-1.jpg": "Kitchen",
  "regular-2.jpg": "Living room",
  "regular-3.jpg": "Bathroom",
  "regular-4.jpg": "Living room",
  "regular-5.jpg": "Bedroom",
  "regular-6.jpg": "Kitchen",
  "airbnb-1.jpg": "Bedroom",
  "airbnb-2.jpg": "Bedroom",
  "airbnb-3.jpg": "Shower room",
  "airbnb-4.jpg": "Kitchen and dining room",
  "airbnb-5.jpg": "Living room",
  "airbnb-6.jpg": "Bathroom",
  "oven-1.jpg": "Our cleaner at work on an oven",
  "oven-2.jpg": "Oven",
  "oven-3.jpg": "Oven",
};

// Which photo set each service page shows.
const SET_FOR_PAGE = {
  "end-of-tenancy-cleaning-manchester": "end-of-tenancy",
  "regular-house-cleaning-manchester": "regular",
  "general-cleaning-manchester": "regular",
  "airbnb-cleaning-manchester": "airbnb",
  "oven-cleaning-manchester": "oven",
};

const ALL = Object.entries(FILES)
  .map(([path, src]) => {
    const file = path.split("/").pop();
    const m = file.match(/^(.+)-(\d+)\.(jpe?g|png|webp)$/i);
    return m ? { set: m[1], n: Number(m[2]), src, caption: CAPTIONS[file] || "" } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.set.localeCompare(b.set) || a.n - b.n);

/** Gallery photos for a service page slug (empty if that service has none yet). */
export const ourWorkFor = (slug) => {
  const set = SET_FOR_PAGE[slug];
  return set ? ALL.filter((p) => p.set === set) : [];
};
