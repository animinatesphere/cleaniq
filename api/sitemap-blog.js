// /sitemap-blog.xml — every live blog post, built from the blog API so new posts are listed
// as soon as they're published (no rebuild needed). Listed in robots.txt next to sitemap.xml.
import { SITE, getPosts, postUrl, esc } from "./_lib/blog.js";

export default async function handler(req, res) {
  try {
    const posts = await getPosts();
    const newest = posts[0] ? new Date(posts[0].updatedAt || posts[0].publishAt || posts[0].createdAt).toISOString() : null;
    const urls = [
      `  <url>\n    <loc>${SITE}/blog</loc>${newest ? `\n    <lastmod>${newest}</lastmod>` : ""}\n  </url>`,
      ...posts.map((p) => {
        const mod = new Date(p.updatedAt || p.publishAt || p.createdAt).toISOString();
        return `  <url>\n    <loc>${esc(postUrl(p))}</loc>\n    <lastmod>${mod}</lastmod>\n  </url>`;
      }),
    ];
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
    res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  } catch (err) {
    console.error("[sitemap-blog]", err);
    res.statusCode = 503;
    res.setHeader("Retry-After", "3600");
    res.end("Blog sitemap temporarily unavailable");
  }
}
