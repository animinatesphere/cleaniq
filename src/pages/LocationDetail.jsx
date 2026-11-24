// Area pages (/locations/<area>). Each area's page is a list of blocks in
// src/content/locations/<area>.json, built and edited with drag and drop in /content-admin.
// The blocks live in src/blocks/LocationBlocks.jsx; "{area}" in their text becomes the area's name.
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { AREAS } from "../utils/areas";
import { usePageContent } from "../utils/siteContent";
import { LOCATION_CONTENT } from "../content/locations";
import PageBlocks from "../blocks/PageBlocks";
import { LOCATION_BLOCKS } from "../blocks/LocationBlocks";
import { AreaContext } from "../blocks/areaContext";

const SITE = "https://www.cleaniqservices.com";

const LocationDetail = () => {
  const { area } = useParams();
  const slug = area.toLowerCase();
  const page = usePageContent(`location:${slug}`, LOCATION_CONTENT[slug]);
  const name = AREAS.find((a) => a.slug === slug)?.name;

  if (!page || !name) {
    return (
      <div className="pt-40 pb-20 text-center space-y-4">
        <h1 className="text-2xl font-black text-primary-dark">Location Not Found</h1>
        <p className="text-slate-500">We currently do not have a dedicated page for this area, but we likely still serve it!</p>
        <Link to="/booking" className="text-primary font-bold">Check Availability & Book</Link>
      </div>
    );
  }

  const seo = page.root?.props || {};
  const fill = (s) => String(s || "").replaceAll("{area}", name);
  const nearby = (page.content || []).find((b) => b.type === "AreaNearby")?.props?.places || [];
  const url = `${SITE}/locations/${area}`;
  const title = fill(seo.title) || `Cleaners in ${name} | Cleaning Services | Cleaniq`;

  return (
    <div className="pt-36 pb-12 bg-slate-50 min-h-screen">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={fill(seo.description)} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={fill(seo.shareTitle) || title} />
        <meta property="og:description" content={fill(seo.shareDescription || seo.description)} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                // The business itself is described once (index.html, @id below); this page describes
                // the service in this area, so search engines don't see a second business.
                "@type": "Service",
                name: `Cleaning services in ${name}`,
                serviceType: "Cleaning service",
                url,
                provider: { "@id": `${SITE}#localbusiness` },
                areaServed: [name, ...nearby.map((n) => (typeof n === "string" ? n : n?.text))].filter(Boolean).map((n) => ({ "@type": "Place", name: n })),
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
                  { "@type": "ListItem", position: 2, name: `Cleaners in ${name}`, item: url },
                ],
              },
            ],
          })}
        </script>
      </Helmet>
      <AreaContext.Provider value={{ slug, name }}>
        <PageBlocks data={page} blocks={LOCATION_BLOCKS} />
      </AreaContext.Provider>
    </div>
  );
};

export default LocationDetail;
