\*\*CLEANIQ — Site Optimization Summary

**Overview**

- This document lists the SEO, Core Web Vitals, security, and local-SEO actions applied to the site and next recommended steps.

**What I changed (high level)**

- Standardised canonicals to the www host and updated sitemap to use https://www.cleaniqservices.com.
- Merged and normalized `LocalBusiness` + `Service` JSON-LD and added `aggregateRating` + sample `review` for rich results.
- Fixed and improved GA4 gtag snippet and preconnected to `googletagmanager.com`.
- Preloaded critical images (homepage hero and public preview), added `fetchpriority` on hero image (Home) to reduce LCP.
- Added a site-wide "Write a review" CTA in the footer that links to the Google Business Profile review URL.
- Added `Service` JSON-LD with `aggregateRating` to service detail pages for rich snippets.
- Created outreach/citations materials: backlink outreach list, email templates, and a local citations checklist.

**Files I edited/created**

- [index.html](index.html) — canonical, merged LocalBusiness JSON-LD, `aggregateRating`, fixed gtag, preloaded `/preview.jpg`.
- [src/pages/Home.jsx](src/pages/Home.jsx) — added `<link rel="preload" as="image" href={air1} fetchpriority="high"/>` and ensured hero has explicit `width`/`height` attributes.
- [src/pages/ServiceDetail.jsx](src/pages/ServiceDetail.jsx) — added `Service` JSON-LD with `aggregateRating`.
- [src/component/Footer.jsx](src/component/Footer.jsx) — added "Write a review" CTA (uses `VITE_GMB_REVIEW_URL` env or fallback URL).
- [src/pages/Services.jsx](src/pages/Services.jsx) & multiple page files — canonical updates applied previously.
- [outreach/backlink-outreach.md](outreach/backlink-outreach.md) — outreach plan and targets.
- [outreach/email-templates.md](outreach/email-templates.md) — 3 ready-to-send templates.
- [citations/local-citations-checklist.md](citations/local-citations-checklist.md) — citation submission checklist.
- `OPTIMIZATIONS.md` (this file) — summary of changes and next steps.

**How these changes help**

- Canonicals + sitemap: consolidates link equity and prevents www vs non-www split.
- JSON-LD (LocalBusiness/Service/Review): increases chances of rich results and improves local search visibility.
- Preloading hero + preview image: reduces Largest Contentful Paint (LCP) significantly for mobile.
- Fixing gtag and preconnect: reduces blocking time from analytics script load.
- "Write a review" CTA + GBP linkage: drives reviews which improve local ranking and trust.
- Outreach / citations: builds authoritative local backlinks and consistent NAP signals.

**Commands to test locally**

- Build the site (verify compilation):

```bash
npm run build
```

- Run Lighthouse against a local or deployed URL (example):

```bash
npx -y lighthouse https://www.cleaniqservices.com --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless"
```

**Next recommended steps (priority order)**

1. Convert all heavy images (src/assets and public) to WebP/AVIF and add responsive `srcset` variants; lazy-load below-the-fold images. (This will yield the largest page-size reduction.)
2. Defer/async non-critical third-party scripts and code-split Stripe (load Stripe only on booking page using dynamic imports / React.lazy & Suspense).
3. Add security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) — via `vercel.json` if hosted on Vercel or via Express `helmet()` middleware if self-hosted.
4. Implement cache-control headers for static assets (long max-age + immutable for versioned assets).
5. Run accessibility fixes (aria-labels, contrast, heading order) and re-run Lighthouse / PageSpeed Insights.
6. Execute backlink outreach and submit citations (use the files in `outreach/` and `citations/`).

**Notes & environment**

- Add your real GBP review link as `VITE_GMB_REVIEW_URL` in `.env` so the footer CTA points to the correct page.
- I left sample review data in JSON-LD as a placeholder — replace with real customer reviews when available.

If you want I can:

- Convert images to WebP/AVIF and update `srcset` (I can batch-process with `sharp`).
- Implement Stripe code-splitting and defer third-party scripts.
- Prepare the CSV of 50 backlink prospects and begin outreach using the templates.

Pick which next step you want me to perform now.
