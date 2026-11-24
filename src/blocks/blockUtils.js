import { whatsappLink } from "../utils/contact";

// Helpers shared by the page blocks (src/blocks) and the visual page editor (/content-admin).
// Images: a block stores either a site image path (e.g. "our-work/regular-2.jpg", from src/assets)
// or a full https:// address.
const FILES = import.meta.glob("../assets/**/*.{jpg,jpeg,png,webp,avif}", { eager: true, import: "default" });

const IMAGES = Object.fromEntries(Object.entries(FILES).map(([path, url]) => [path.replace("../assets/", ""), url]));

/** Site images that can be picked in the editor, nicest folders first. */
export const IMAGE_OPTIONS = Object.keys(IMAGES)
  .filter((k) => !/\.orig$|logo|avatar/i.test(k))
  .sort((a, b) => (a.startsWith("our-work/") === b.startsWith("our-work/") ? a.localeCompare(b) : a.startsWith("our-work/") ? -1 : 1));

/** The URL for a block's image value (site image path or web address). */
export const imageUrl = (value) => (value ? IMAGES[value] || (/^https?:\/\//.test(value) ? value : "") : "");

/** Turn a link typed in the editor into { internal, href } (site pages use client-side links). */
export const linkTarget = (href = "") => {
  const h = String(href).trim();
  // "whatsapp:Your message" opens WhatsApp to our number with that message.
  if (/^whatsapp:/i.test(h)) return { internal: false, href: `${whatsappLink(h.slice(9).trim() || "Hi Cleaniq!")}` };
  if (/^\/(?!\/)/.test(h)) return { internal: true, href: h };
  if (/^(tel:|mailto:|https?:\/\/|#)/.test(h)) return { internal: false, href: h };
  if (/^\+?\d[\d\s]{7,}$/.test(h)) return { internal: false, href: `tel:${h.replace(/\s/g, "")}` };
  return { internal: true, href: h ? `/${h.replace(/^\/+/, "")}` : "/" };
};
