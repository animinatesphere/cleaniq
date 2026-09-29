// The service pages (src/pages/ServiceDetail.jsx) and which Services-page cards they belong to.
// Photos are from Unsplash (free to use under the Unsplash License).
const unsplash = (id) => (width) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

export const SERVICE_PAGES = [
  {
    slug: "end-of-tenancy-cleaning-manchester",
    image: unsplash("1586023492125-27b2c045efd7"),
    imageAlt: "A bright, freshly cleaned living room",
    name: "End of Tenancy Cleaning",
    blurb: "Move-out and move-in cleans to hand the property back spotless.",
    layoutKeys: ["tenancy"],
  },
  {
    slug: "deep-cleaning-manchester",
    image: unsplash("1581578731548-c64695cc6952"),
    imageAlt: "Cleaner in gloves wiping down a window",
    name: "Deep Cleaning",
    blurb: "A thorough top-to-bottom refresh for your home.",
    layoutKeys: ["move"],
  },
  {
    slug: "airbnb-cleaning-manchester",
    image: unsplash("1522708323590-d24dbb6b0267"),
    imageAlt: "A tidy, guest-ready apartment living room",
    name: "Airbnb Cleaning",
    blurb: "Guest-ready turnovers for short-let properties.",
    layoutKeys: ["airbnb"],
  },
  {
    slug: "office-cleaning-manchester",
    image: unsplash("1603712725038-e9334ae8f39f"),
    imageAlt: "Cleaner mopping an office floor",
    name: "Office Cleaning",
    blurb: "Clean, healthy workspaces for your team.",
    layoutKeys: ["commercial"],
  },
  {
    slug: "post-construction-cleaning-manchester",
    image: unsplash("1504307651254-35680f356dfd"),
    imageAlt: "Building work in progress on a construction site",
    name: "Post-Construction Cleaning",
    blurb: "Dust and debris cleared after building work.",
    layoutKeys: ["construction"],
  },
  {
    slug: "general-cleaning-manchester",
    image: unsplash("1527515637462-cff94eecc1ac"),
    imageAlt: "Cordless vacuum cleaning a carpet",
    name: "Regular & General Cleaning",
    blurb: "Weekly, fortnightly or one-off home cleans.",
    layoutKeys: ["residential", "general"],
  },
];

export const servicePagePath = (slug) => `/pages/${slug}`;

// Services-page card key (e.g. "tenancy") → its service page path, or null if there isn't one.
export const pathForLayoutKey = (key) => {
  const page = SERVICE_PAGES.find((p) => p.layoutKeys.includes(key));
  return page ? servicePagePath(page.slug) : null;
};
