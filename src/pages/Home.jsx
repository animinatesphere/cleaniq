// Homepage. Its sections are blocks listed in src/content/pages/home.json, built and edited with
// drag and drop in /content-admin. The blocks themselves live in src/blocks/SiteBlocks.jsx.
import { Helmet } from "react-helmet-async";
import PageBlocks from "../blocks/PageBlocks";
import homePage from "../content/pages/home.json";
import { usePageContent } from "../utils/siteContent";
import heroImage from "../assets/service-deep-1200.webp";

const Home = () => {
  const page = usePageContent("page:home", homePage) || { content: [] };
  const seo = page.root?.props || {};
  return (
    <div className="overflow-x-hidden bg-white">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href="https://www.cleaniqservices.com/" />
        <meta property="og:title" content={seo.shareTitle || seo.title} />
        <meta property="og:description" content={seo.shareDescription || seo.description} />
        <meta property="og:image" content="https://www.cleaniqservices.com/preview.jpg" />
        <link rel="preload" as="image" href={heroImage} fetchpriority="high" media="(min-width: 768px)" />
        <meta name="twitter:card" content="summary_large_image" />
        {/* Business details (address, hours, geo) live in one LocalBusiness block in index.html. */}
      </Helmet>
      <PageBlocks data={page} />
    </div>
  );
};

export default Home;
