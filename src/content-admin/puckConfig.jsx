// The visual page editor's blocks: what each block is called, which fields it has, and what a new
// block starts with. The blocks themselves are the website's own sections (src/blocks).
import { BLOCKS } from "../blocks/registry";
import ImageField from "./ImageField";

const text = (label, inline = false) => ({ type: "text", label, ...(inline ? { contentEditable: true } : {}) });
const area = (label, inline = false) => ({ type: "textarea", label, ...(inline ? { contentEditable: true } : {}) });
const choose = (label, options) => ({ type: "select", label, options: options.map(([value, l]) => ({ value, label: l })) });
const yesNo = (label) => ({ type: "radio", label, options: [{ value: "yes", label: "Show" }, { value: "no", label: "Hide" }] });
const image = (label = "Image") => ({ type: "custom", label, render: ImageField });
const linkHelp = "Link: a page (/booking), phone (tel:+447846726428), email (mailto:…) or website (https://…)";

const BUTTON_STYLES = [["primary", "Green button"], ["outline", "Outline button"], ["secondary", "Light button"], ["dark", "Rounded green button"], ["text", "Text link with arrow"]];
const buttonFields = {
  label: text("Button text"),
  link: text(linkHelp),
  style: choose("Style", BUTTON_STYLES),
  arrow: choose("Arrow", [["yes", "Show arrow"], ["no", "No arrow"]]),
};
const newButton = { label: "Book now", link: "/booking", style: "primary", arrow: "yes" };
const button = (label = "Button") => ({ type: "object", label, objectFields: buttonFields });
const buttons = (label = "Buttons") => ({
  type: "array", label, arrayFields: buttonFields, defaultItemProps: newButton, getItemSummary: (b) => b?.label || "Button",
});
const paragraphs = (label = "Paragraphs") => ({
  type: "array", label, arrayFields: { text: area("Paragraph") }, defaultItemProps: { text: "New paragraph" },
  getItemSummary: (p) => String(p?.text || p || "").slice(0, 40) || "Paragraph",
});
const background = choose("Background", [["white", "White"], ["light", "Very light grey"], ["grey", "Light grey"], ["mint", "Light green"]]);
const ICONS = [["home", "House"], ["briefcase", "Briefcase"], ["zap", "Lightning"], ["star", "Star"], ["shield", "Shield"], ["sparkles", "Sparkle"], ["leaf", "Leaf"], ["clock", "Clock"], ["badge", "Badge"]];

// Paragraph lists are stored as plain text lines; the editor works with { text } items.
const wrap = (arr) => (Array.isArray(arr) ? arr.map((p) => (typeof p === "string" ? { text: p } : p)) : arr);

const components = {
  Hero: {
    label: "Hero (top of page)",
    fields: {
      badge: text("Small badge", true), heading: text("Heading", true), highlight: text("Highlighted word(s)", true), text: area("Intro text", true),
      buttons: buttons(), showAppButtons: yesNo("App Store / Android buttons"), showGoogleBadge: yesNo("Google rating badge"),
      image: image(), imageAlt: text("Image description (for Google & screen readers)"), statTitle: text("Badge on image: title"), statText: text("Badge on image: text"),
    },
    defaultProps: { badge: "NEW", heading: "Your heading", highlight: "Manchester", text: "Write a short introduction here.", buttons: [newButton], showAppButtons: "no", showGoogleBadge: "yes", image: "service-deep-1200.webp", imageAlt: "", statTitle: "", statText: "" },
  },
  ServiceCards: {
    label: "Service cards",
    fields: {
      label: text("Small label", true), heading: text("Heading", true), text: area("Intro text", true),
      cards: {
        type: "array", label: "Cards", getItemSummary: (c) => c?.title || "Card",
        arrayFields: { keyword: text("Small label"), title: text("Title"), desc: area("Text"), link: text(linkHelp), linkLabel: text("Link text"), icon: choose("Icon", ICONS), image: image(), imageAlt: text("Image description") },
        defaultItemProps: { keyword: "Service", title: "New service", desc: "Short description.", link: "/services", linkLabel: "View service", icon: "star", image: "our-work/regular-1.jpg", imageAlt: "" },
      },
      hubTitle: text("Title above the service links"), showHubLinks: yesNo("Links to every service page"),
    },
    defaultProps: { label: "Our Services", heading: "Cleaning services near you.", text: "", cards: [], hubTitle: "", showHubLinks: "no" },
  },
  ImageText: {
    label: "Image and text",
    fields: {
      label: text("Small label", true), heading: text("Heading", true), highlight: text("Highlighted word(s)", true), headingEnd: text("Heading end", true), text: area("Text", true),
      image: image(), imageAlt: text("Image description"), imageSide: choose("Image side", [["left", "Left"], ["right", "Right"]]),
      stats: { type: "array", label: "Stat boxes ({rating} = live Google rating)", arrayFields: { value: text("Big text"), label: text("Small text") }, defaultItemProps: { value: "48hr", label: "Re-clean guarantee" }, getItemSummary: (s) => s?.value || "Stat" },
      button: button(), background,
    },
    defaultProps: { label: "", heading: "Your heading", highlight: "", headingEnd: "", text: "Write your text here.", image: "our-work/about-cleaner.jpg", imageAlt: "", imageSide: "left", stats: [], button: { label: "", link: "/about", style: "text", arrow: "yes" }, background: "white" },
  },
  Steps: {
    label: "Steps",
    fields: {
      label: text("Small label", true), heading: text("Heading", true), background,
      steps: { type: "array", label: "Steps", arrayFields: { number: text("Number"), title: text("Title"), text: area("Text") }, defaultItemProps: { number: "", title: "New step", text: "" }, getItemSummary: (s) => s?.title || "Step" },
    },
    defaultProps: { label: "The Process", heading: "How it works.", background: "light", steps: [{ number: "01", title: "Book", text: "" }, { number: "02", title: "We clean", text: "" }, { number: "03", title: "Relax", text: "" }] },
  },
  LocalAreas: {
    label: "Local cleaners + area links",
    fields: { label: text("Small label", true), heading: text("Heading", true), paragraphs: paragraphs(), buttons: buttons(), areaCount: { type: "number", label: "How many areas to show", min: 2, max: 12 } },
    defaultProps: { label: "Local cleaners", heading: "Cleaners near you.", paragraphs: [{ text: "" }], buttons: [newButton], areaCount: 8 },
  },
  BeforeAfter: { label: "Before & after photos", fields: { title: text("Heading (leave empty for \"Before & after\")") }, defaultProps: { title: "" } },
  GoogleReviews: { label: "Google reviews (live)", fields: {}, defaultProps: {} },
  Faq: {
    label: "FAQs",
    fields: {
      label: text("Small label", true), heading: text("Heading", true),
      faqs: { type: "array", label: "Questions", arrayFields: { q: text("Question"), a: area("Answer") }, defaultItemProps: { q: "New question?", a: "Answer." }, getItemSummary: (f) => f?.q || "Question" },
    },
    defaultProps: { label: "FAQ", heading: "Frequently asked questions.", faqs: [{ q: "New question?", a: "Answer." }] },
  },
  Slideshow: {
    label: "Photo slideshow",
    fields: {
      label: text("Small label", true), heading: text("Heading", true),
      slides: { type: "array", label: "Photos", arrayFields: { image: image("Photo"), label: text("Label"), alt: text("Image description") }, defaultItemProps: { image: "our-work/regular-1.jpg", label: "Kitchen", alt: "" }, getItemSummary: (s) => s?.label || "Photo" },
    },
    defaultProps: { label: "Our Work", heading: "Spaces we've transformed.", slides: [] },
  },
  Coverage: {
    label: "Areas we cover (by service)",
    fields: { label: text("Small label", true), heading: text("Heading", true), text: area("Intro text", true), ctaText: text("Text above the button"), button: button() },
    defaultProps: { label: "Our Coverage", heading: "Cleaners near you.", text: "", ctaText: "", button: { label: "Check Availability", link: "/booking", style: "dark", arrow: "yes" } },
  },
  BlogPosts: {
    label: "Latest blog posts (live)",
    fields: { label: text("Small label", true), heading: text("Heading", true), text: area("Intro text", true), button: button() },
    defaultProps: { label: "From Our Blog", heading: "Cleaning tips.", text: "", button: { label: "View All Articles", link: "/blog", style: "dark", arrow: "yes" } },
  },
  DarkBanner: {
    label: "Dark banner",
    fields: { heading: text("Heading", true), text: area("Text", true), smallTitle: text("Small title"), smallText: text("Small text"), button: button() },
    defaultProps: { heading: "Your heading.", text: "", smallTitle: "", smallText: "", button: { label: "Apply Now", link: "/recruitment", style: "secondary", arrow: "yes" } },
  },
  CallToAction: {
    label: "Call to action",
    fields: { heading: text("Heading", true), text: area("Text", true), buttons: buttons(), background },
    defaultProps: { heading: "Looking for cleaners near you?", text: "", buttons: [{ ...newButton, arrow: "no" }], background: "mint" },
  },
  ColumnsText: {
    label: "Text in columns",
    fields: { columns: { type: "array", label: "Columns", arrayFields: { title: text("Title"), text: area("Text") }, defaultItemProps: { title: "Title", text: "Text" }, getItemSummary: (c) => c?.title || "Column" } },
    defaultProps: { columns: [{ title: "Title", text: "Text" }] },
  },
  TextSection: {
    label: "Heading and text",
    fields: { label: text("Small label", true), heading: text("Heading", true), paragraphs: paragraphs(), buttons: buttons(), align: choose("Alignment", [["left", "Left"], ["center", "Centre"]]), background },
    defaultProps: { label: "", heading: "New section", paragraphs: [{ text: "Write your text here." }], buttons: [], align: "left", background: "white" },
  },
  Buttons: {
    label: "Buttons",
    fields: { buttons: buttons(), align: choose("Alignment", [["left", "Left"], ["center", "Centre"], ["right", "Right"]]), background },
    defaultProps: { buttons: [newButton], align: "center", background: "white" },
  },
  Image: {
    label: "Image",
    fields: { image: image(), alt: text("Image description"), caption: text("Caption"), width: choose("Width", [["small", "Small"], ["medium", "Medium"], ["full", "Full width"]]), background },
    defaultProps: { image: "our-work/regular-2.jpg", alt: "", caption: "", width: "medium", background: "white" },
  },
  Spacer: { label: "Space", fields: { size: choose("Size", [["small", "Small"], ["medium", "Medium"], ["large", "Large"]]) }, defaultProps: { size: "medium" } },
};

// Paragraph lists: the page files keep plain text; the editor shows them as { text } items.
const PARAGRAPH_FIELDS = new Set(["paragraphs"]);
const toEditor = (props) => Object.fromEntries(Object.entries(props).map(([k, v]) => [k, PARAGRAPH_FIELDS.has(k) ? wrap(v) : v]));
export const fromEditor = (data) => ({
  ...data,
  content: (data.content || []).map((item) => ({
    ...item,
    props: Object.fromEntries(Object.entries(item.props || {}).map(([k, v]) => [k, PARAGRAPH_FIELDS.has(k) && Array.isArray(v) ? v.map((p) => (typeof p === "string" ? p : p?.text ?? "")) : v])),
  })),
});
export const toEditorData = (data) => ({ ...data, content: (data?.content || []).map((item) => ({ ...item, props: toEditor(item.props || {}) })) });

export const puckConfig = {
  root: {
    // The page as visitors see it: white background, site fonts.
    render: ({ children }) => <div className="bg-white min-h-screen overflow-x-hidden text-slate-900">{children}</div>,
    fields: {
      title: { type: "text", label: "Page title (Google & browser tab)" },
      description: { type: "textarea", label: "Google description (120–158 characters)" },
      shareTitle: { type: "text", label: "Title when shared on social media" },
      shareDescription: { type: "textarea", label: "Description when shared on social media" },
    },
  },
  categories: {
    sections: { title: "Page sections", components: ["Hero", "ServiceCards", "ImageText", "Steps", "LocalAreas", "Slideshow", "Coverage", "DarkBanner", "CallToAction", "ColumnsText"] },
    basics: { title: "Text, buttons & images", components: ["TextSection", "Buttons", "Image", "Spacer", "Faq"] },
    live: { title: "Live from our systems", components: ["GoogleReviews", "BeforeAfter", "BlogPosts"] },
  },
  components: Object.fromEntries(
    Object.entries(components).map(([name, c]) => {
      const Block = BLOCKS[name];
      // Puck passes its own extras (id, puck, editMode); the block only gets its content.
      const render = (all) => {
        const props = { ...all };
        ["id", "puck", "editMode"].forEach((k) => delete props[k]);
        return <Block {...props} />;
      };
      return [name, { ...c, render }];
    }),
  ),
};
