// The service pages (src/pages/ServiceDetail.jsx) and which Services-page cards they belong to.
// Photos are our own from real jobs, except office (a free public-domain photo) until we have our own.
// Our own photos from real jobs.
import regularPhoto from "../assets/our-work/regular-4.jpg";
import airbnbPhoto from "../assets/our-work/airbnb-5.jpg";
// Our own photo from a real job (original: src/images/IMG_6025.DNG, converted for the web).
import deepSmall from "../assets/service-deep-600.webp";
import deepLarge from "../assets/service-deep-1200.webp";
// Our own photos from real jobs (originals in src/images: IMG_6012, IMG_6028, IMG_6097).
import ovenPhotoSmall from "../assets/service-oven-photo-600.webp";
import ovenPhotoLarge from "../assets/service-oven-photo-1200.webp";
import generalPhotoSmall from "../assets/service-general-photo-600.webp";
import generalPhotoLarge from "../assets/service-general-photo-1200.webp";
import carpetPhotoSmall from "../assets/service-carpet-photo-600.webp";
import carpetPhotoLarge from "../assets/service-carpet-photo-1200.webp";
import eotPhotoSmall from "../assets/service-eot-photo-600.webp";
import eotPhotoLarge from "../assets/service-eot-photo-1200.webp";
// Office: a free public-domain photo (Wikimedia Commons, CC0). Post-construction: our own photo (src/images/IMG_6090).
import officePhotoSmall from "../assets/service-office-photo-600.webp";
import officePhotoLarge from "../assets/service-office-photo-1200.webp";
import postConstructionPhotoSmall from "../assets/service-postconstruction-photo-600.webp";
import postConstructionPhotoLarge from "../assets/service-postconstruction-photo-1200.webp";
const local = (small, large) => (width) => (width > 600 ? large : small);

export const SERVICE_PAGES = [
  {
    slug: "end-of-tenancy-cleaning-manchester",
    image: local(eotPhotoSmall, eotPhotoLarge),
    imageAlt: "Clean kitchen with spotless worktops, oven, washing machine and gleaming tiled floor after an end of tenancy clean by Cleaniq Services",
    name: "End of Tenancy Cleaning",
    blurb: "Move-out and move-in cleans to hand the property back spotless.",
    layoutKeys: ["tenancy"],
  },
  {
    slug: "deep-cleaning-manchester",
    image: local(deepSmall, deepLarge),
    imageAlt: "Bright city-centre apartment living room with sofas and big windows after a deep clean by Cleaniq Services",
    name: "Deep Cleaning",
    blurb: "A thorough top-to-bottom refresh for your home.",
    layoutKeys: ["move"],
  },
  {
    slug: "airbnb-cleaning-manchester",
    image: local(airbnbPhoto, airbnbPhoto),
    imageAlt: "Guest-ready living room with sofa and TV after an Airbnb turnover clean by Cleaniq Services",
    name: "Airbnb Cleaning",
    blurb: "Guest-ready turnovers for short-let properties.",
    layoutKeys: ["airbnb"],
  },
  {
    slug: "office-cleaning-manchester",
    image: local(officePhotoSmall, officePhotoLarge),
    imageAlt: "Tidy office desk with a computer, plant and chairs, ready for the working day",
    name: "Office Cleaning",
    blurb: "Clean, healthy workspaces for your team.",
    layoutKeys: ["commercial"],
  },
  {
    slug: "post-construction-cleaning-manchester",
    image: local(postConstructionPhotoSmall, postConstructionPhotoLarge),
    imageAlt: "Empty flat with clean wooden floors after a clean by Cleaniq Services, ready to hand over",
    name: "Post-Construction Cleaning",
    blurb: "Dust and debris cleared after building work.",
    layoutKeys: ["construction"],
  },
  {
    slug: "regular-house-cleaning-manchester",
    image: local(regularPhoto, regularPhoto),
    imageAlt: "Living room with big windows and city views after a regular house clean by Cleaniq Services",
    name: "Regular House Cleaning",
    blurb: "Weekly, fortnightly or monthly visits from local house cleaners.",
    layoutKeys: ["residential"],
  },
  {
    slug: "general-cleaning-manchester",
    image: local(generalPhotoSmall, generalPhotoLarge),
    imageAlt: "Cleaniq Services cleaner in uniform and yellow gloves cleaning a kitchen appliance",
    name: "General Cleaning",
    blurb: "A one-off whole-home clean whenever you need it.",
    layoutKeys: ["general"],
  },
  {
    slug: "oven-cleaning-manchester",
    image: local(ovenPhotoSmall, ovenPhotoLarge),
    imageAlt: "Oven with clean glass door and racks after an oven clean by Cleaniq Services",
    name: "Oven Cleaning",
    blurb: "Single, double and range ovens cleaned inside and out.",
    layoutKeys: ["oven"],
  },
  {
    slug: "carpet-cleaning-manchester",
    image: local(carpetPhotoSmall, carpetPhotoLarge),
    imageAlt: "Grey carpeted bedroom in a Manchester flat, ready for a professional carpet clean by Cleaniq Services",
    name: "Carpet Cleaning",
    blurb: "Deep carpet, rug and stair cleaning to lift dirt and stains.",
    layoutKeys: ["carpet"],
  },
];

export const servicePagePath = (slug) => `/service/${slug}`;

// Services-page card key (e.g. "tenancy") → its service page path, or null if there isn't one.
export const pathForLayoutKey = (key) => {
  const page = SERVICE_PAGES.find((p) => p.layoutKeys.includes(key));
  return page ? servicePagePath(page.slug) : null;
};
