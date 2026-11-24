// About page. Its sections are blocks listed in src/content/pages/about.json, built and edited with
// drag and drop in /content-admin. The About blocks live in src/blocks/AboutBlocks.jsx.
import { Helmet } from "react-helmet-async";
import PageBlocks from "../blocks/PageBlocks";
import { ABOUT_BLOCKS } from "../blocks/AboutBlocks";
import aboutPage from "../content/pages/about.json";
import { usePageContent } from "../utils/siteContent";

const URL = "https://www.cleaniqservices.com/about";

const About = () => {
  const page = usePageContent("page:about", aboutPage) || { content: [] };
  const seo = page.root?.props || {};
  // Tells Google this is our About page, about the business in the site-wide LocalBusiness data.
  const aboutJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${URL}#webpage`,
        url: URL,
        name: seo.title,
        description: seo.description,
        about: { "@id": "https://www.cleaniqservices.com#localbusiness" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.cleaniqservices.com/" },
          { "@type": "ListItem", position: 2, name: "About", item: URL },
        ],
      },
    ],
  });

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content={seo.shareTitle || seo.title} />
        {(seo.shareDescription || seo.description) && <meta property="og:description" content={seo.shareDescription || seo.description} />}
        <script type="application/ld+json">{aboutJsonLd}</script>
      </Helmet>
      <PageBlocks data={page} blocks={ABOUT_BLOCKS} />
    </div>
  );
};

export default About;
