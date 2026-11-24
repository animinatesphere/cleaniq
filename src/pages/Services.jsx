// Services page. Its sections are blocks listed in src/content/pages/services.json, built and edited
// with drag and drop in /content-admin. The service list is live from the booking system
// (src/blocks/ServicesBlocks.jsx).
import { Helmet } from "react-helmet-async";
import PageBlocks from "../blocks/PageBlocks";
import { SERVICES_BLOCKS } from "../blocks/ServicesBlocks";
import servicesPage from "../content/pages/services.json";
import { usePageContent } from "../utils/siteContent";

const SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "LocalBusiness", name: "Cleaniq Services", url: "https://www.cleaniqservices.com" },
    { "@type": "Service", name: "Residential Cleaning", description: "Reliable, weekly or bi-weekly cleaning for your home." },
    { "@type": "Service", name: "Office Cleaning", description: "Professional janitorial services for your workspace." },
    { "@type": "Service", name: "Deep Clean", description: "Specialized deep cleaning services for a total refresh." },
    { "@type": "Service", name: "Airbnb Cleaning", description: "Professional turnover services for your short-let rental." },
    { "@type": "Service", name: "End of Tenancy", description: "Comprehensive move-in/move-out cleaning with a deposit-back guarantee." },
  ],
});

const Services = () => {
  const page = usePageContent("page:services", servicesPage) || { content: [] };
  const seo = page.root?.props || {};
  return (
    <div className="pt-42 pb-20 bg-slate-50 min-h-screen overflow-x-hidden">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href="https://www.cleaniqservices.com/services" />
        <meta property="og:title" content={seo.shareTitle || seo.title} />
        <meta property="og:description" content={seo.shareDescription || seo.description} />
        <script type="application/ld+json">{SCHEMA}</script>
      </Helmet>
      <PageBlocks data={page} blocks={SERVICES_BLOCKS} />
    </div>
  );
};

export default Services;
