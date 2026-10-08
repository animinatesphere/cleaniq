// After `vite build`: write a real HTML file for every page in the sitemap (dist/<path>/index.html)
// with that page's own <title>, description, canonical, Open Graph tags and rendered content.
// Vercel serves these files before the SPA rewrite, so crawlers get per-page HTML.
// Any page that fails to render keeps the normal SPA index.html — the build never fails here.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const SITE = "https://www.cleaniqservices.com";

// Tags the page sets itself (react-helmet-async) replace the template's homepage ones.
const TEMPLATE_TAGS = [
  /<title>[\s\S]*?<\/title>/i,
  /<meta\s+name="description"[\s\S]*?\/?>/i,
  /<link\s+rel="canonical"[\s\S]*?\/?>/i,
  /<meta\s+property="og:url"[\s\S]*?\/?>/i,
  /<meta\s+property="og:title"[\s\S]*?\/?>/i,
  /<meta\s+property="og:description"[\s\S]*?\/?>/i,
  /<meta\s+name="twitter:title"[\s\S]*?\/?>/i,
  /<meta\s+name="twitter:description"[\s\S]*?\/?>/i,
];

function routesFromSitemap() {
  const xml = fs.readFileSync(path.join(root, "public", "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1].trim()).pathname.replace(/\/+$/, "") || "/")
    .filter((p, i, a) => a.indexOf(p) === i);
}

const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

// React 19 emits a page's <title>/<meta>/<link> (from react-helmet-async) at the start of the
// rendered output; they belong in <head>.
const LEADING_HEAD_TAGS = /^(?:\s*(?:<title>[\s\S]*?<\/title>|<meta\b[^>]*\/?>|<link\b[^>]*\/?>|<script\b[^>]*>[\s\S]*?<\/script>))+/i;

function buildPage(template, route, rendered) {
  let html = rendered.html;
  let head = rendered.head || "";
  const lead = html.match(LEADING_HEAD_TAGS);
  if (lead) {
    head += lead[0];
    html = html.slice(lead[0].length);
  }
  let page = template;
  const has = (re) => re.test(head);
  // Only drop a template tag when the page provides its own.
  const own = {
    title: has(/<title/i), description: has(/name="description"/i), canonical: has(/rel="canonical"/i),
    ogUrl: has(/property="og:url"/i), ogTitle: has(/property="og:title"/i), ogDesc: has(/property="og:description"/i),
    twTitle: has(/name="twitter:title"/i), twDesc: has(/name="twitter:description"/i),
  };
  const flags = [own.title, own.description, own.canonical, own.ogUrl, own.ogTitle, own.ogDesc, own.twTitle, own.twDesc];
  TEMPLATE_TAGS.forEach((re, i) => { if (flags[i]) page = page.replace(re, ""); });

  const url = SITE + (route === "/" ? "/" : route);
  const extra = [];
  // Every page gets a canonical (and og:url) pointing to itself, never to the homepage.
  if (!own.canonical) { page = page.replace(TEMPLATE_TAGS[2], ""); extra.push(`<link rel="canonical" href="${attr(url)}" />`); }
  if (!own.ogUrl) { page = page.replace(TEMPLATE_TAGS[3], ""); extra.push(`<meta property="og:url" content="${attr(url)}" />`); }

  page = page.replace("</head>", `${head}\n${extra.join("\n")}\n</head>`);
  page = page.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  return page;
}

async function main() {
  const templatePath = path.join(dist, "index.html");
  const serverEntry = path.join(root, "dist-ssr", "entry-server.js");
  if (!fs.existsSync(templatePath) || !fs.existsSync(serverEntry)) {
    console.warn("[prerender] skipped: build output not found");
    return;
  }

  const template = fs.readFileSync(templatePath, "utf8");
  // Some admin-only libraries (e.g. html2pdf.js) reference `self` when loaded.
  globalThis.self ??= globalThis;
  // Pages render as a first-time visitor sees them: empty browser storage.
  const memoryStorage = () => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
  };
  globalThis.localStorage ??= memoryStorage();
  globalThis.sessionStorage ??= memoryStorage();
  const { render } = await import(pathToFileURL(serverEntry).href);
  const routes = routesFromSitemap();
  let ok = 0;
  for (const route of routes) {
    try {
      const result = await render(route);
      if (!result.html || result.html.length < 500) throw new Error("page rendered almost nothing");
      const out = route === "/" ? templatePath : path.join(dist, route, "index.html");
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, buildPage(template, route, result));
      ok++;
    } catch (err) {
      console.warn(`[prerender] ${route} kept as SPA: ${err.message.split("\n")[0]}`);
    }
  }
  console.log(`[prerender] ${ok}/${routes.length} pages written with their own HTML`);
}

main().catch((err) => {
  console.warn("[prerender] skipped:", err.message);
});
