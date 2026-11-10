// Serves /blog and /blog/:slug with real HTML (title, description, canonical, article text,
// BlogPosting schema) so search engines, AI crawlers and social previews can read blog posts
// without running JavaScript. The browser still starts the React app as normal.
// If anything fails, the plain app shell is returned, so the page behaves exactly as before.
import { SITE, getPosts, getShell, fillShell, postPath, postUrl, imageUrl, contentHtml, esc } from "./_lib/blog.js";

const BLOG_TITLE = "Cleaning Tips & Guides | Cleaniq Services Blog";
const BLOG_DESC =
  "Practical cleaning advice for Manchester homes, rentals, Airbnbs and offices from Cleaniq Services: end of tenancy, deep cleaning, kitchens, mould and more.";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");

function articleBody(p) {
  const img = imageUrl(p.image);
  return `<main>
  <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a></nav>
  <article>
    <h1>${esc(p.title)}</h1>
    <p>${esc(p.description)}</p>
    <p>By ${esc(p.author || "Cleaniq Services")} · <time datetime="${esc(p.publishAt || p.createdAt)}">${esc(fmtDate(p.publishAt || p.createdAt))}</time></p>
    ${img ? `<img src="${esc(img)}" alt="${esc(p.title)}" width="1200" height="630">` : ""}
    ${contentHtml(p.content)}
  </article>
  <p><a href="/blog">More cleaning guides</a> · <a href="/services">Our cleaning services</a> · <a href="/get-a-quote">Get a free quote</a></p>
</main>`;
}

function indexBody(posts) {
  return `<main>
  <h1>Cleaning Tips &amp; Industry Insights</h1>
  <p>${esc(BLOG_DESC)}</p>
  <ul>
    ${posts
      .map((p) => `<li><h2><a href="${esc(postPath(p))}">${esc(p.title)}</a></h2><p>${esc(p.description)}</p><p><time datetime="${esc(p.publishAt || p.createdAt)}">${esc(fmtDate(p.publishAt || p.createdAt))}</time></p></li>`)
      .join("\n    ")}
  </ul>
</main>`;
}

function send(res, status, html, cache = "public, max-age=0, s-maxage=600, stale-while-revalidate=86400") {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  res.end(html);
}

export default async function handler(req, res) {
  let shell;
  try {
    shell = await getShell(req);
  } catch (err) {
    console.error("[blog-page] shell", err);
    return send(res, 500, "Temporarily unavailable", "no-store");
  }

  try {
    const posts = await getPosts();
    const slug = String(req.query.slug || "").replace(/^\/+|\/+$/g, "");

    if (!slug) {
      const html = fillShell(shell, {
        title: BLOG_TITLE,
        description: BLOG_DESC,
        url: `${SITE}/blog`,
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": `${SITE}/blog#blog`,
            name: "Cleaniq Services Blog",
            url: `${SITE}/blog`,
            publisher: { "@id": `${SITE}#localbusiness` },
            blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: postUrl(p), datePublished: p.publishAt || p.createdAt })),
          },
        ],
        body: indexBody(posts),
      });
      return send(res, 200, html);
    }

    const id = slug.split("-")[0];
    const post = posts.find((p) => String(p._id) === id);
    if (!post) {
      const html = fillShell(shell, { title: "Article not found | Cleaniq Services", description: BLOG_DESC, url: `${SITE}/blog`, noindex: true, body: "" });
      return send(res, 404, html, "public, max-age=0, s-maxage=60");
    }

    // One address per post: send ID-only or outdated slugs to the current one.
    const canonicalPath = postPath(post);
    if (`/blog/${slug}` !== canonicalPath) {
      res.statusCode = 301;
      res.setHeader("Location", canonicalPath);
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600");
      return res.end();
    }

    const url = postUrl(post);
    const image = imageUrl(post.image);
    const html = fillShell(shell, {
      title: `${post.title} | Cleaniq Blog`,
      description: post.description,
      url,
      image,
      type: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              "@id": `${url}#article`,
              headline: post.title,
              description: post.description,
              ...(image ? { image } : {}),
              datePublished: post.publishAt || post.createdAt,
              dateModified: post.updatedAt || post.publishAt || post.createdAt,
              mainEntityOfPage: url,
              author:
                post.author && post.author !== "Cleaniq Services Team"
                  ? { "@type": "Person", name: post.author }
                  : { "@type": "Organization", name: "Cleaniq Services", url: SITE },
              publisher: { "@id": `${SITE}#localbusiness` },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
                { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
                { "@type": "ListItem", position: 3, name: post.title, item: url },
              ],
            },
          ],
        },
      ],
      body: articleBody(post),
    });
    return send(res, 200, html);
  } catch (err) {
    console.error("[blog-page]", err);
    return send(res, 200, shell, "public, max-age=0, s-maxage=60");
  }
}
