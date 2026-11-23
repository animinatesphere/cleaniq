// Block name → component. Used by public pages to draw a page from its content file, and by the
// visual editor (/content-admin), which adds the edit fields. Public pages never load the editor.
import * as B from "./SiteBlocks";

export const BLOCKS = {
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
