// Join our team (recruitment) page. Its sections are blocks in src/content/pages/recruitment.json,
// edited with drag and drop in /content-admin. The blocks live in src/blocks/RecruitBlocks.jsx.
import { Helmet } from "react-helmet-async";
import { useRegion } from "../context/RegionContext";
import PageBlocks from "../blocks/PageBlocks";
import { RECRUIT_BLOCKS } from "../blocks/RecruitBlocks";
import { ABOUT_BLOCKS } from "../blocks/AboutBlocks";
import recruitmentPage from "../content/pages/recruitment.json";
import { usePageContent } from "../utils/siteContent";

const BLOCKS = { ...RECRUIT_BLOCKS, FaqList: ABOUT_BLOCKS.FaqList };
// Outside the UK only the top, benefits, steps and form are shown.
const NON_UK = new Set(["JobsHero", "BenefitCards", "NumberedSteps", "ApplyForm"]);

// Google for Jobs listing (https://developers.google.com/search/docs/appearance/structured-data/job-posting)
function jobPostingJsonLd(rate) {
  const today = new Date();
  const validThrough = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: "Cleaner (Domestic & Commercial)",
    description: `<p>Cleaniq Services is hiring cleaners across Manchester and Greater Manchester. Clean homes, offices, Airbnbs and end-of-tenancy properties, choose the hours that suit you, and manage your jobs in the Cleaniq worker app.</p><p>Pay: £${rate} per hour before tax.</p><p>To apply, send your details and CV. We review every application within 24–72 hours. Successful applicants have an interview, background checks and a practical skills assessment.</p>`,
    datePosted: today.toISOString().slice(0, 10),
    validThrough: validThrough.toISOString().slice(0, 10),
    directApply: true,
    hiringOrganization: { "@type": "Organization", name: "Cleaniq Services", sameAs: "https://www.cleaniqservices.com", logo: "https://www.cleaniqservices.com/preview.jpg" },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Manchester", addressRegion: "Greater Manchester", addressCountry: "GB" } },
    baseSalary: { "@type": "MonetaryAmount", currency: "GBP", value: { "@type": "QuantitativeValue", value: rate, unitText: "HOUR" } },
  });
}

const Recruitment = () => {
  const { region } = useRegion();
  const isUK = region.id === "UK";
  const page = usePageContent("page:recruitment", recruitmentPage) || { content: [] };
  const seo = page.root?.props || {};
  // The pay rate set in the top block (with the earnings calculator).
  const rate = Number(page.content?.find((b) => b.type === "JobsHero")?.props?.hourlyRate) || 15;
  const shown = isUK ? page : { ...page, content: (page.content || []).filter((b) => NON_UK.has(b.type)) };
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href="https://www.cleaniqservices.com/recruitment" />
        <meta property="og:title" content={seo.shareTitle || seo.title} />
        {seo.shareDescription && <meta property="og:description" content={seo.shareDescription} />}
        {isUK && <script type="application/ld+json">{jobPostingJsonLd(rate)}</script>}
      </Helmet>
      <PageBlocks data={shown} blocks={BLOCKS} />
    </div>
  );
};

export default Recruitment;
