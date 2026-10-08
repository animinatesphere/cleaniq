// After `vite build`, before pre-rendering: keep the plain app shell as dist/app.html.
// Vercel's catch-all rewrite serves it for pages that aren't pre-rendered (admin, account,
// booking steps…), so they never flash the homepage. Its canonical/og:url are removed: the page
// sets its own once the app runs, and a wrong canonical is worse than none.
import fs from "node:fs";

const html = fs.readFileSync("dist/index.html", "utf8")
  .replace(/<link\s+rel="canonical"[\s\S]*?\/?>\s*/i, "")
  .replace(/<meta\s+property="og:url"[\s\S]*?\/?>\s*/i, "");
fs.writeFileSync("dist/app.html", html);
console.log("[spa-shell] dist/app.html written");
