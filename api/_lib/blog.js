/* global process */
// Shared helpers for the blog pages and blog sitemap served by Vercel functions.
// Blog posts are created in the admin dashboard and stored in the API, so they can't be
// pre-rendered at build time. These functions build their HTML on request instead.
import { generateBlogSlug } from "../../src/utils/slugGenerator.js";

export const SITE = "https://www.cleaniqservices.com";
export const API = (process.env.BLOG_API_URL || process.env.VITE_API_URL || "https://api.cleaniqservices.com/api").replace(/\/+$/, "");
const ASSET_BASE = API.replace(/\/api$/, "");

let cache = { at: 0, posts: null };
const TTL = 5 * 60 * 1000;

/** All live posts, newest first. Uses the list endpoint so page views aren't counted. */
export async function getPosts() {
  if (cache.posts && Date.now() - cache.at < TTL) return cache.posts;
  const res = await fetch(`${API}/blog?limit=200`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`blog API ${res.status}`);
  const data = await res.json();
  cache = { at: Date.now(), posts: Array.isArray(data.posts) ? data.posts : [] };
  return cache.posts;
}

export const postPath = (p) => `/blog/${generateBlogSlug(p._id, p.title)}`;
export const postUrl = (p) => SITE + postPath(p);

export function imageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.replace(/^\/api/, "");
  return `${ASSET_BASE}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Same rules as src/utils/blogContent.jsx: blank line = paragraph, "## " = subheading,
// "- " = bullet, [text](/path or https://…) = link. Everything else is escaped.
const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;
function safeHref(raw) {
  const href = String(raw || "").trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const u = new URL(href);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}
function inline(text) {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    out += esc(text.slice(last, m.index));
    const label = m[1] ?? m[3];
    const href = safeHref(m[2] ?? m[3]);
    out += href ? `<a href="${esc(href)}">${esc(label)}</a>` : esc(m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}
function block(lines) {
  if (lines[0].startsWith("## ")) return `<h2>${inline(lines[0].slice(3))}</h2>` + (lines.length > 1 ? block(lines.slice(1)) : "");
  if (lines.every((l) => /^[-•*]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-•*]\s+/, ""))}</li>`).join("")}</ul>`;
  return `<p>${lines.map(inline).join("<br>")}</p>`;
}
export function contentHtml(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => block(b.split("\n").map((l) => l.trim()).filter(Boolean)))
    .join("\n");
}

/** The app shell (dist/app.html), fetched from this deployment. */
export async function getShell(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const res = await fetch(`${proto}://${host}/app.html`);
  if (!res.ok) throw new Error(`app shell ${res.status}`);
  return res.text();
}

/**
 * Put a page's own head tags and readable body into the app shell. Tags are marked data-ssr so
 * src/main.jsx removes them before React renders the same tags itself.
 */
export function fillShell(shell, { title, description, url, image, type = "website", jsonLd = [], body, noindex = false }) {
  const tags = [
    `<title data-ssr>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" data-ssr />`,
    noindex ? `<meta name="robots" content="noindex" data-ssr />` : `<link rel="canonical" href="${esc(url)}" data-ssr />`,
    `<meta property="og:type" content="${esc(type)}" data-ssr />`,
    `<meta property="og:url" content="${esc(url)}" data-ssr />`,
    `<meta property="og:title" content="${esc(title)}" data-ssr />`,
    `<meta property="og:description" content="${esc(description)}" data-ssr />`,
    `<meta name="twitter:title" content="${esc(title)}" data-ssr />`,
    `<meta name="twitter:description" content="${esc(description)}" data-ssr />`,
    ...(image ? [`<meta property="og:image" content="${esc(image)}" data-ssr />`, `<meta name="twitter:image" content="${esc(image)}" data-ssr />`] : []),
    ...jsonLd.map((d) => `<script type="application/ld+json" data-ssr>${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`),
  ].join("\n    ");

  let html = shell
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/?>/i, "")
    .replace(/<link\s+rel="canonical"[\s\S]*?\/?>/i, "")
    .replace(/<meta\s+property="og:(type|url|title|description)"[\s\S]*?\/?>/gi, "")
    .replace(/<meta\s+name="twitter:(url|title|description)"[\s\S]*?\/?>/gi, "");
  if (noindex) html = html.replace(/<meta\s+name="robots"[\s\S]*?\/?>/i, "");
  if (image) html = html.replace(/<meta\s+property="og:image"\s[\s\S]*?\/?>/i, "").replace(/<meta\s+name="twitter:image"[\s\S]*?\/?>/i, "");
  html = html.replace("</head>", `    ${tags}\n  </head>`);
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}
