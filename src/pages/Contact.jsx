// Contact page and the Commercial cleaning quote page (/commercial-cleaning). Their sections are
// blocks in src/content/pages/contact.json and commercial-cleaning.json, edited with drag and drop in
// /content-admin. The form itself is in src/blocks/ContactBlocks.jsx.
import { Helmet } from "react-helmet-async";
import { useSearchParams, Navigate } from "react-router-dom";
import PageBlocks from "../blocks/PageBlocks";
import { CONTACT_BLOCKS } from "../blocks/ContactBlocks";
import contactPage from "../content/pages/contact.json";
import commercialPage from "../content/pages/commercial-cleaning.json";
import { usePageContent } from "../utils/siteContent";

// commercialOnly: the /commercial-cleaning page — the same form, fixed to commercial cleaning.
const Contact = ({ commercialOnly = false }) => {
  const [searchParams] = useSearchParams();
  const page = usePageContent(commercialOnly ? "page:commercial-cleaning" : "page:contact", commercialOnly ? commercialPage : contactPage) || { content: [] };
  const seo = page.root?.props || {};

  // Old link (/contact?type=commercial) → the commercial cleaning page.
  if (!commercialOnly && searchParams.get("type") === "commercial") return <Navigate to="/commercial-cleaning" replace />;

  return (
    <div className="pt-24 md:pt-32 pb-16 md:pb-24 bg-[#F8FAFC] min-h-screen">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={`https://www.cleaniqservices.com/${commercialOnly ? "commercial-cleaning" : "contact"}`} />
        <meta property="og:title" content={seo.shareTitle || seo.title} />
        {seo.shareDescription && <meta property="og:description" content={seo.shareDescription} />}
      </Helmet>
      <PageBlocks data={page} blocks={CONTACT_BLOCKS} />
    </div>
  );
};

export default Contact;
