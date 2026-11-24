// Block name → component. Used by public pages to draw a page from its content file, and by the
// visual editor (/content-admin), which adds the edit fields. Public pages never load the editor.
//  - The homepage's blocks load with the site (the homepage is the first page most people see).
//  - Other pages' blocks load only when a page uses them: each page passes its own set to
//    <PageBlocks blocks={…}> so they show straight away; a block dragged in from another page loads
//    on demand.
import { lazy } from "react";
import * as B from "./SiteBlocks";

export const HOME_BLOCKS = {
  Hero: B.HeroBlock,
  ServiceCards: B.ServiceCardsBlock,
  ImageText: B.ImageTextBlock,
  Steps: B.StepsBlock,
  LocalAreas: B.LocalAreasBlock,
  BeforeAfter: B.BeforeAfterBlock,
  GoogleReviews: B.GoogleReviewsBlock,
  Faq: B.FaqBlock,
  Slideshow: B.SlideshowBlock,
  Coverage: B.CoverageBlock,
  BlogPosts: B.BlogPostsBlock,
  DarkBanner: B.DarkBannerBlock,
  CallToAction: B.CallToActionBlock,
  ColumnsText: B.ColumnsTextBlock,
  TextSection: B.TextSectionBlock,
  Buttons: B.ButtonsBlock,
  Image: B.ImageBlock,
  Spacer: B.SpacerBlock,
};

// Which file each of the other blocks lives in, and the name of its block list there.
export const GROUPS = [
  [() => import("./AboutBlocks"), "ABOUT_BLOCKS", ["PhotoHero", "Story", "LinkCards", "IconCards", "Values", "AreaLinks", "FaqList", "ContactBanner"]],
  [() => import("./ServicesBlocks"), "SERVICES_BLOCKS", ["PageHeading", "ServiceList", "CommitmentBanner"]],
  [() => import("./ContactBlocks"), "CONTACT_BLOCKS", ["ContactForm"]],
  [() => import("./QuoteBlocks"), "QUOTE_BLOCKS", ["QuoteForm"]],
  [() => import("./RecruitBlocks"), "RECRUIT_BLOCKS", ["JobsHero", "BenefitCards", "NumberedSteps", "PhotoGrid", "ImageCards", "JobsInfo", "ApplyForm"]],
  [() => import("./LocationBlocks"), "LOCATION_BLOCKS", ["AreaHero", "AreaAbout", "AreaServices", "AreaGuide", "AreaHomes", "AreaBeforeAfter", "AreaNearby", "AreaFaq", "OtherAreas"]],
];

const LAZY_BLOCKS = Object.fromEntries(
  GROUPS.flatMap(([load, list, names]) =>
    names.map((name) => [name, lazy(() => load().then((m) => ({ default: m[list][name] })))]),
  ),
);

export const BLOCKS = { ...HOME_BLOCKS, ...LAZY_BLOCKS };
export const isLazyBlock = (name) => name in LAZY_BLOCKS;
