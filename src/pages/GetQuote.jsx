// Get a Quote page. Its sections are blocks in src/content/pages/get-a-quote.json, edited with drag
// and drop in /content-admin. The quote form itself is in src/blocks/QuoteBlocks.jsx.
import { Helmet } from "react-helmet-async";
import PageBlocks from "../blocks/PageBlocks";
import { QUOTE_BLOCKS } from "../blocks/QuoteBlocks";
import quotePage from "../content/pages/get-a-quote.json";
import { usePageContent } from "../utils/siteContent";

const GetQuote = () => {
  const page = usePageContent("page:get-a-quote", quotePage) || { content: [] };
  const seo = page.root?.props || {};
  return (
    <div className="min-h-screen bg-[#F3F6F4]">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href="https://www.cleaniqservices.com/get-a-quote" />
        <meta property="og:title" content={seo.shareTitle || seo.title} />
        {seo.shareDescription && <meta property="og:description" content={seo.shareDescription} />}
      </Helmet>
      <PageBlocks data={page} blocks={QUOTE_BLOCKS} />
    </div>
  );
};

export default GetQuote;
