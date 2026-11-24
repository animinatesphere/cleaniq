// Service pages (/service/<slug>). Each page is a list of blocks in src/content/services/<slug>.json,
// built and edited with drag and drop in /content-admin. The blocks and the page around them (top
// banner, booking sidebar) live in src/blocks/service/ServiceBlocks.jsx.
import { use, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { usePageContent } from "../utils/siteContent";
import { loadServiceContent } from "../content/services";
import { ServiceShell, MainColumn, renderServiceBlocks } from "../blocks/service/ServiceBlocks";
import { ServiceContext } from "../blocks/service/serviceContext";
import { serviceInfo, useLiveServices } from "../blocks/service/serviceData";

const SITE = "https://www.cleaniqservices.com";

// Every FAQ on the page, for Google.
const faqsIn = (items, out = []) => {
  (items || []).forEach((b) => {
    if (b.type === "SvcFaqs") out.push(...(b.props?.items || []));
    if (Array.isArray(b.props?.children)) faqsIn(b.props.children, out);
  });
  return out;
};

function ServicePage({ slug, file }) {
  const page = usePageContent(`service:${slug}`, file);
  const s = page.root?.props || {};
  const services = useLiveServices();
  const info = serviceInfo(slug, services, { priceKeywords: s.priceKeywords, quoteMessage: s.quoteMessage });
  const url = `${SITE}/service/${slug}`;
  const faqs = faqsIn([...(s.top || []), ...(page.content || [])]).filter((f) => f?.q);
  const areas = (s.schemaAreas || []).map((a) => (typeof a === "string" ? a : a?.text)).filter(Boolean);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  return (
    <ServiceContext.Provider value={info}>
      <Helmet>
        <title>{s.title}</title>
        <meta name="description" content={s.description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={s.shareTitle || s.title} />
        <meta property="og:description" content={s.shareDescription || s.description} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.heading,
            description: s.schemaDescription,
            areaServed: areas.length ? areas.map((a) => ({ "@type": "City", name: a })) : { "@type": "City", name: "Manchester" },
            url,
            provider: { "@id": `${SITE}#localbusiness` },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Services", item: `${SITE}/services` },
              { "@type": "ListItem", position: 3, name: s.heading, item: url },
            ],
          })}
        </script>
        {faqs.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: String(f.a) } })),
            })}
          </script>
        )}
      </Helmet>
      <ServiceShell settings={s} top={renderServiceBlocks(s.top)}>
        <MainColumn content={page.content} />
      </ServiceShell>
    </ServiceContext.Provider>
  );
}

function Loaded({ slug, promise }) {
  return <ServicePage slug={slug} file={use(promise)} />;
}

const ServiceDetail = () => {
  const { serviceSlug } = useParams();
  const promise = loadServiceContent(serviceSlug);
  if (!promise) {
    return (
      <div className="pt-40 pb-20 text-center space-y-4 px-6">
        <h1 className="text-2xl font-bold text-slate-900">Service Not Found</h1>
        <Link to="/" className="text-teal-600 font-semibold hover:underline">← Back to Home</Link>
      </div>
    );
  }
  return <Loaded key={serviceSlug} slug={serviceSlug} promise={promise} />;
};

export default ServiceDetail;
