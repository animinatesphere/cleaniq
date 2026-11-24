/* eslint-disable react-refresh/only-export-components -- editor settings file, not hot-reloaded */
// The visual page editor's blocks: what each block is called, which fields it has, and what a new
// block starts with. The blocks themselves are the website's own sections (src/blocks).
import { ALL_BLOCKS } from "./allBlocks";
import ImageField from "./ImageField";
import { ICON_OPTIONS } from "../blocks/icons";
import { SERVICE_CARD_KEYS } from "../blocks/ServicesBlocks";
import { AREAS } from "../utils/areas";
import { SERVICE_PAGES } from "../utils/servicePages";
import { AreaContext } from "../blocks/areaContext";
import { ServiceShell, SERVICE_ICONS } from "../blocks/service/ServiceBlocks";
import { ServiceContext } from "../blocks/service/serviceContext";
import { serviceInfo, useLiveServices } from "../blocks/service/serviceData";

const text = (label, inline = false) => ({ type: "text", label, ...(inline ? { contentEditable: true } : {}) });
const area = (label, inline = false) => ({ type: "textarea", label, ...(inline ? { contentEditable: true } : {}) });
const choose = (label, options) => ({ type: "select", label, options: options.map(([value, l]) => ({ value, label: l })) });
const yesNo = (label) => ({ type: "radio", label, options: [{ value: "yes", label: "Show" }, { value: "no", label: "Hide" }] });
const image = (label = "Image") => ({ type: "custom", label, render: ImageField });
const linkHelp = "Link: a page (/booking), phone (tel:+447846726428), email (mailto:…), website (https://…) or WhatsApp (whatsapp:Your message)";

const BUTTON_STYLES = [
  ["primary", "Green button"], ["outline", "Outline button"], ["secondary", "Blue button"], ["dark", "Rounded green button"],
  ["soft", "Square outline button"], ["light", "White outline (for dark backgrounds)"], ["text", "Text link"],
];
const buttonFields = {
  label: text("Button text"),
  link: text(linkHelp),
  style: choose("Style", BUTTON_STYLES),
  icon: choose("Icon before the text", [["", "None"], ["whatsapp", "WhatsApp / chat"], ["phone", "Phone"], ["mail", "Email"]]),
  arrow: choose("Arrow", [["yes", "Show arrow"], ["no", "No arrow"]]),
};
const newButton = { label: "Book now", link: "/booking", style: "primary", icon: "", arrow: "yes" };
const button = (label = "Button") => ({ type: "object", label, objectFields: buttonFields });
const buttons = (label = "Buttons") => ({
  type: "array", label, arrayFields: buttonFields, defaultItemProps: newButton, getItemSummary: (b) => b?.label || "Button",
});
const paragraphs = (label = "Paragraphs") => ({
  type: "array", label, arrayFields: { text: area("Paragraph") }, defaultItemProps: { text: "New paragraph" },
  getItemSummary: (p) => String(p?.text || p || "").slice(0, 40) || "Paragraph",
});
const background = choose("Background", [["white", "White"], ["light", "Very light grey"], ["grey", "Light grey"], ["mint", "Light green"], ["green", "Very light green"]]);
const icon = (label = "Icon") => choose(label, ICON_OPTIONS);
const lines = (label, item = "Line") => ({
  type: "array", label, arrayFields: { text: text(item) }, defaultItemProps: { text: "" },
  getItemSummary: (p) => String(p?.text || p || "").slice(0, 40) || item,
});
const cardList = (label, fields, defaults, summary = "title") => ({
  type: "array", label, arrayFields: fields, defaultItemProps: defaults, getItemSummary: (c) => c?.[summary] || "Item",
});
const iconCards = (label = "Cards") => cardList(label, { icon: icon(), title: text("Title"), text: area("Text") }, { icon: "check", title: "New card", text: "" });
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

  /* ── About page ── */
  PhotoHero: {
    label: "Page top with photo collage",
    fields: {
      badge: text("Small badge", true), heading: text("Heading", true), highlight: text("Highlighted word(s)", true), text: area("Intro text", true),
      chips: lines("Ticks under the text", "Tick"), showRating: yesNo("Google rating"), buttons: buttons(),
      mainImage: image("Big photo"), mainAlt: text("Big photo description"), mainCaption: text("Big photo caption"),
      image2: image("Photo 2"), alt2: text("Photo 2 description"), caption2: text("Photo 2 label"),
      image3: image("Photo 3"), alt3: text("Photo 3 description"), caption3: text("Photo 3 label"),
      cornerLabel: text("Label above the photos"),
    },
    defaultProps: { badge: "About us", heading: "Your heading", highlight: "Manchester.", text: "", chips: [], showRating: "yes", buttons: [newButton], mainImage: "our-work/about-cleaner.jpg", mainAlt: "", mainCaption: "", image2: "our-work/airbnb-1.jpg", alt2: "", caption2: "", image3: "our-work/regular-2.jpg", alt3: "", caption3: "", cornerLabel: "" },
  },
  Story: {
    label: "Our story + mission + vision",
    fields: {
      label: text("Small label", true), heading: text("Heading", true), paragraphs: paragraphs("Story paragraphs"),
      missionTitle: text("Mission title"), missionText: area("Mission text"),
      missionPoints: cardList("Mission points", { icon: icon(), title: text("Word"), text: text("Text") }, { icon: "check", title: "Word", text: "" }),
      visionTitle: text("Vision title"), visionText: area("Vision text"),
      visionPoints: cardList("Vision points", { icon: icon(), title: text("Word"), text: text("Text") }, { icon: "check", title: "Word", text: "" }),
    },
    defaultProps: { label: "", heading: "Our story.", paragraphs: [{ text: "" }], missionTitle: "Our mission", missionText: "", missionPoints: [], visionTitle: "Our vision", visionText: "", visionPoints: [] },
  },
  LinkCards: {
    label: "Photo cards with links",
    fields: {
      label: text("Small label", true), heading: text("Heading", true), text: area("Intro text", true), background,
      cards: cardList("Cards", { title: text("Title"), text: area("Text"), link: text(linkHelp), image: image(), imageAlt: text("Image description") }, { title: "New card", text: "", link: "/services", image: "our-work/regular-1.jpg", imageAlt: "" }),
    },
    defaultProps: { label: "", heading: "Our services.", text: "", background: "light", cards: [] },
  },
  IconCards: {
    label: "Icon cards",
    fields: { label: text("Small label", true), heading: text("Heading", true), text: area("Intro text", true), cards: iconCards(), background },
    defaultProps: { label: "", heading: "Why choose us.", text: "", cards: [{ icon: "shield", title: "New card", text: "" }], background: "white" },
  },
  Values: {
    label: "Green band with cards",
    fields: { label: text("Small label", true), heading: text("Heading", true), cards: iconCards() },
    defaultProps: { label: "Values", heading: "What we stand for.", cards: [{ icon: "heart", title: "Trust", text: "" }] },
  },
  AreaLinks: {
    label: "Links to every area page",
    fields: {
      label: text("Small label", true), heading: text("Heading", true), text: area("Intro text", true), linkPrefix: text("Words before each area name"), background,
      areaTexts: cardList("Text under each area", { slug: choose("Area", AREAS.map((a) => [a.slug, a.name])), text: area("Text") }, { slug: AREAS[0].slug, text: "" }, "slug"),
    },
    defaultProps: { label: "Local to you", heading: "Cleaners near you.", text: "", linkPrefix: "Cleaners in", areaTexts: [], background: "light" },
  },
  FaqList: {
    label: "FAQs (simple)",
    fields: {
      label: text("Small label", true), heading: text("Heading", true), background,
      spaceAbove: choose("Space above", [["yes", "Normal"], ["no", "None (follows a section with space below)"]]),
      faqs: { type: "array", label: "Questions", arrayFields: { q: text("Question"), a: area("Answer") }, defaultItemProps: { q: "New question?", a: "Answer." }, getItemSummary: (f) => f?.q || "Question" },
    },
    defaultProps: { label: "FAQ", heading: "Questions.", faqs: [{ q: "New question?", a: "Answer." }], background: "white", spaceAbove: "yes" },
  },
  ContactBanner: {
    label: "Dark banner with phone & email",
    fields: { heading: text("Heading", true), text: area("Text", true), buttons: buttons(), phone: text("Phone number"), email: text("Email") },
    defaultProps: { heading: "Looking for cleaners near you?", text: "", buttons: [newButton], phone: "+44 7846 726428", email: "info@cleaniqservices.com" },
  },

  /* ── Services page ── */
  PageHeading: {
    label: "Page heading (centred)",
    fields: { heading: text("Heading", true), highlight: text("Highlighted word(s)", true), headingEnd: text("Heading end", true), text: area("Intro text", true), note: text("Note in a pill (leave empty to hide)") },
    defaultProps: { heading: "Your heading", highlight: "", headingEnd: "", text: "", note: "" },
  },
  ServiceList: {
    label: "Service list (live prices)",
    fields: {
      bookLabel: text("Book button text"),
      cards: cardList(
        "Each service card (name, price and points come from Admin → Services)",
        { key: choose("Service", SERVICE_CARD_KEYS), tag: text("Small label"), icon: icon(), image: image(), imageAlt: text("Image description"), text: area("Description if Admin has none"), features: lines("Points if Admin has none", "Point") },
        { key: "residential", tag: "", icon: "home", image: "our-work/regular-1.jpg", imageAlt: "", text: "", features: [] },
        "key",
      ),
      commercialTitle: text("Commercial card: title"), commercialTag: text("Commercial card: small label"), commercialText: area("Commercial card: text"),
      commercialTypes: lines("Commercial card: points", "Point"), commercialPrice: text("Commercial card: price text"),
      commercialButton: text("Commercial card: button text"), commercialLink: text("Commercial card: " + linkHelp),
      commercialIcon: icon("Commercial card: icon"), commercialImage: image("Commercial card: image"), commercialImageAlt: text("Commercial card: image description"),
    },
    defaultProps: { bookLabel: "Book Service", cards: [], commercialTitle: "Commercial Cleaning", commercialTag: "", commercialText: "", commercialTypes: [], commercialPrice: "Custom quote", commercialButton: "Get a Quote", commercialLink: "/commercial-cleaning", commercialIcon: "briefcase", commercialImage: "service-office-photo-1200.webp", commercialImageAlt: "" },
  },
  CommitmentBanner: {
    label: "Green banner with icons",
    fields: {
      badge: text("Small badge"), heading: text("Heading", true), highlight: text("Highlighted line", true), text: area("Text", true),
      items: cardList("Icons", { icon: icon(), label: text("Label") }, { icon: "leaf", label: "New" }, "label"),
    },
    defaultProps: { badge: "Our Commitment", heading: "Your heading", highlight: "", text: "", items: [] },
  },

  /* ── Forms ── */
  ContactForm: {
    label: "Contact form",
    fields: {
      mode: choose("Form type", [["contact", "General enquiry"], ["commercial", "Commercial cleaning quote"]]),
      badge: text("Small badge", true), heading: text("Heading", true), text: area("Intro text", true),
      contactItems: cardList("Contact details", { icon: icon(), label: text("Label"), value: text("Text"), link: text(linkHelp) }, { icon: "phone", label: "Phone", value: "", link: "" }, "label"),
      hoursTitle: text("Opening hours title"),
      hours: cardList("Opening hours (leave empty to hide)", { day: text("Day(s)"), hours: text("Hours") }, { day: "Monday", hours: "" }, "day"),
      formTitle: text("Form title"), formText: text("Text under the form title"), buttonLabel: text("Send button text"),
      successTitle: text("Message when sent: title"), successText: text("Message when sent: text"), errorTitle: text("Message if it fails: title"),
    },
    defaultProps: { mode: "contact", badge: "Get in Touch", heading: "Contact Our Team", text: "", contactItems: [], hoursTitle: "Office Hours", hours: [], formTitle: "Send a Message", formText: "", buttonLabel: "Send Message", successTitle: "Message sent successfully!", successText: "", errorTitle: "Failed to send message" },
  },
  QuoteForm: {
    label: "Quote form (4 steps)",
    fields: {
      badge: text("Small badge", true), heading: text("Heading", true), highlight: text("Highlighted word(s)", true), text: area("Intro text", true),
      trustPoints: cardList("Trust points", { icon: icon(), text: text("Text") }, { icon: "check", text: "" }, "text"),
      successTitle: text("When the quote is emailed: title"), successSteps: lines("When the quote is emailed: next steps", "Step"),
      successTitlePending: text("When we quote by hand: title"), successStepsPending: lines("When we quote by hand: next steps", "Step"),
      helpTitle: text("Help box title"), helpText: text("Help box text"), whatsappMessage: text("WhatsApp message"),
    },
    defaultProps: { badge: "Free · No obligation", heading: "Get your free", highlight: "cleaning quote", text: "", trustPoints: [], successTitle: "Your quote is in your inbox!", successSteps: [], successTitlePending: "Thank you — request received!", successStepsPending: [], helpTitle: "Prefer to talk?", helpText: "", whatsappMessage: "Hi Cleaniq! I'd like a cleaning quote." },
  },
  ApplyForm: {
    label: "Job application form",
    fields: {
      heading: text("Heading", true), text: text("Intro text", true), formTitle: text("Form title"), note: area("Note above the button (**bold**)"), buttonLabel: text("Send button text"),
      successTitle: text("When sent: title"), successText: area("When sent: text"), successButton: text("When sent: button text"),
    },
    defaultProps: { heading: "Apply in two minutes", text: "", formTitle: "Your Details.", note: "", buttonLabel: "Submit Application", successTitle: "Application Sent!", successText: "", successButton: "Return to Home" },
  },

  /* ── Join our team page ── */
  JobsHero: {
    label: "Jobs page top (pay calculator)",
    fields: {
      badge: text("Small badge", true), heading: text("Heading", true), text: area("Intro text", true),
      image1: image("Photo 1"), alt1: text("Photo 1 description"), image2: image("Photo 2"), alt2: text("Photo 2 description"),
      hourlyRate: { type: "number", label: "Pay per hour (£)", min: 1, max: 100 }, applyLabel: text("Apply button text"),
      calculatorNote: area("Small print under the calculator ({rate} = pay per hour)"),
    },
    defaultProps: { badge: "Now hiring", heading: "Your heading", text: "", image1: "our-work/about-cleaner.jpg", alt1: "", image2: "our-work/regular-5.jpg", alt2: "", hourlyRate: 15, applyLabel: "Apply now", calculatorNote: "" },
  },
  BenefitCards: {
    label: "Grey cards with icons",
    fields: { heading: text("Heading", true), cards: iconCards(), background },
    defaultProps: { heading: "Why choose us?", cards: [{ icon: "check", title: "New card", text: "" }], background: "white" },
  },
  NumberedSteps: {
    label: "Numbered steps",
    fields: { heading: text("Heading", true), background, steps: cardList("Steps", { title: text("Title"), text: area("Text") }, { title: "New step", text: "" }) },
    defaultProps: { heading: "How it works", background: "light", steps: [{ title: "Step one", text: "" }] },
  },
  PhotoGrid: {
    label: "Photo grid",
    fields: {
      heading: text("Heading", true), text: area("Intro text", true), background,
      photos: cardList("Photos", { image: image("Photo"), label: text("Label"), alt: text("Image description") }, { image: "our-work/regular-1.jpg", label: "", alt: "" }, "label"),
    },
    defaultProps: { heading: "Our work", text: "", background: "white", photos: [] },
  },
  ImageCards: {
    label: "Photo + small cards",
    fields: { image: image(), imageAlt: text("Image description"), imageSide: choose("Photo side", [["left", "Left"], ["right", "Right"]]), heading: text("Heading", true), text: area("Text", true), cards: iconCards(), background },
    defaultProps: { image: "our-work/oven-1.jpg", imageAlt: "", imageSide: "left", heading: "Your heading", text: "", cards: [], background: "green" },
  },
  JobsInfo: {
    label: "Jobs: the work, who we look for, areas",
    fields: {
      heading: text("Heading", true), paragraphs: paragraphs(), workTitle: text("Title above the service cards"), showServices: yesNo("Service cards"),
      lookingTitle: text("Green box title"), lookingFor: lines("Green box points", "Point"),
      areasTitle: text("Areas box title"), areasText: text("Areas box text"), areaPrefix: text("Words before each area name"),
    },
    defaultProps: { heading: "Jobs near you", paragraphs: [{ text: "" }], workTitle: "The work you'll do", showServices: "yes", lookingTitle: "What we look for", lookingFor: [], areasTitle: "Jobs near you", areasText: "", areaPrefix: "Cleaning jobs in" },
  },

  /* ── Area (location) pages: {area} = the area's name ── */
  AreaHero: {
    label: "Area page top",
    fields: {
      badge: text("Small badge"), heading: text("Heading"), highlight: text("Highlighted word(s)"), tagline: text("Tagline"), text: area("Intro text"),
      buttons: buttons(), whyTitle: text("Box title"), whyPoints: cardList("Box points ({rating} = Google rating)", { icon: icon(), text: text("Text") }, { icon: "check", text: "" }, "text"),
    },
    defaultProps: { badge: "Local Manchester Cleaners", heading: "Professional Cleaners in", highlight: "{area}", tagline: "", text: "", buttons: [newButton], whyTitle: "Why Choose Us?", whyPoints: [] },
  },
  AreaAbout: {
    label: "Area: photos, about text + booking card",
    fields: {
      image1: image("Big photo"), alt1: text("Big photo description"), image2: image("Photo 2"), alt2: text("Photo 2 description"), image3: image("Photo 3"), alt3: text("Photo 3 description"),
      heading: text("Heading"), paragraphs: paragraphs(),
      image4: image("Small photo 1"), alt4: text("Small photo 1 description"), image5: image("Small photo 2"), alt5: text("Small photo 2 description"),
      servicesTitle: text("Services title"), services: lines("Services", "Service"),
      cardTitle: text("Green card title"), cardText: text("Green card text"), cardButton: button("Green card button"), helpLabel: text("Phone box label"), phone: text("Phone number"),
    },
    defaultProps: { image1: "our-work/deep-card.jpg", alt1: "", image2: "our-work/regular-2.jpg", alt2: "", image3: "service-office-photo-600.webp", alt3: "", heading: "About Our {area} Cleaning Services", paragraphs: [{ text: "" }], image4: "", alt4: "", image5: "", alt5: "", servicesTitle: "Services Available in {area}:", services: [], cardTitle: "Ready for a clean home?", cardText: "", cardButton: { label: "Book Clean Now", link: "/booking", style: "secondary", icon: "", arrow: "yes" }, helpLabel: "Need Help?", phone: "+44 7846 726428" },
  },
  AreaServices: {
    label: "Area: every service with photos",
    fields: { heading: text("Heading"), text: area("Intro text"), linkText: text("Card text ({service} and {area})") },
    defaultProps: { heading: "Cleaning services in {area}", text: "", linkText: "{service} in {area}" },
  },
  AreaGuide: {
    label: "Area: popular services + good to know",
    fields: {
      popularTitle: text("Popular services title"), popularText: text("Popular services text"),
      popular: cardList("Popular services", { slug: choose("Service", SERVICE_PAGES.map((p) => [p.slug, p.name])), why: area("Why it suits this area") }, { slug: SERVICE_PAGES[0].slug, why: "" }, "slug"),
      goodTitle: text("Green box title"), goodToKnow: lines("Good to know", "Point"),
      highlights: lines("Neighbourhoods shown on the homepage", "Neighbourhood"),
    },
    defaultProps: { popularTitle: "Popular cleaning services in {area}", popularText: "", popular: [], goodTitle: "Good to know in {area}", goodToKnow: [], highlights: [] },
  },
  AreaHomes: {
    label: "Area: homes here, tips + postcodes",
    fields: { heading: text("Heading"), text: area("Text"), tipsTitle: text("Tips title"), tips: lines("Tips", "Tip"), postcodesLabel: text("Postcodes label"), postcodes: lines("Postcodes", "Postcode") },
    defaultProps: { heading: "Homes in {area} and what they need", text: "", tipsTitle: "Tips for booking a cleaner in {area}", tips: [], postcodesLabel: "Postcodes we cover in {area}:", postcodes: [] },
  },
  AreaBeforeAfter: {
    label: "Area: before & after photos",
    fields: { title: text("Heading"), limit: { type: "number", label: "How many", min: 1, max: 12 } },
    defaultProps: { title: "Before & after from our recent jobs", limit: 3 },
  },
  AreaNearby: {
    label: "Area: nearby neighbourhoods",
    fields: { heading: text("Heading"), text: text("Text"), prefix: text("Words before each place"), places: lines("Neighbourhoods", "Place") },
    defaultProps: { heading: "Cleaners near you in {area}", text: "", prefix: "Cleaners in", places: [] },
  },
  AreaFaq: {
    label: "Area: FAQs",
    fields: {
      label: text("Small label"), heading: text("Heading"),
      faqs: { type: "array", label: "Questions", arrayFields: { q: text("Question"), a: area("Answer") }, defaultItemProps: { q: "New question?", a: "Answer." }, getItemSummary: (f) => f?.q || "Question" },
    },
    defaultProps: { label: "FAQs", heading: "Frequently Asked Questions — Cleaners in {area}", faqs: [] },
  },
  /* ── Service pages: building pieces (each keeps its exact look) + live sections ── */
  SvcBox: {
    inline: true,
    label: "Box (holds other blocks)",
    fields: { href: text("Link (only if this box is a link/button): " + linkHelp + " · {book} = book this service"), children: { type: "slot" } },
    defaultProps: { tag: "section", cls: "space-y-5", children: [] },
  },
  SvcText: {
    label: "Text",
    fields: { text: area("Text ([link](/page), **bold**)", true), href: text("Link (only for a link/button)") },
    defaultProps: { tag: "p", cls: "text-slate-600 leading-relaxed", text: "New paragraph." },
    inline: true,
  },
  SvcIcon: {
    label: "Icon",
    fields: { name: choose("Icon", Object.keys(SERVICE_ICONS).map((k) => [k, k.replace(/-/g, " ")])) },
    defaultProps: { name: "check", cls: "text-teal-500", size: 16 },
    inline: true,
  },
  SvcImg: {
    label: "Photo",
    fields: { image: image("Photo"), alt: text("Photo description") },
    defaultProps: { image: "our-work/regular-1.jpg", alt: "", cls: "w-full rounded-xl object-cover", lazy: "yes" },
    inline: true,
  },
  SvcSection: {
    inline: true,
    label: "Service section (label, heading, text)",
    fields: { children: { type: "slot" } },
    defaultProps: {
      tag: "section", cls: "space-y-5",
      children: [
        { type: "SvcText", props: { tag: "p", cls: "text-xs font-bold tracking-widest uppercase text-teal-600 mb-3", text: "Small label" } },
        { type: "SvcText", props: { tag: "h2", cls: "text-xl sm:text-2xl font-bold text-slate-900", text: "Section heading" } },
        { type: "SvcText", props: { tag: "p", cls: "text-slate-600 leading-relaxed", text: "Write your text here." } },
      ],
    },
  },
  SvcDivider: { inline: true,
    label: "Divider line", fields: {}, defaultProps: { tag: "div", cls: "border-t border-slate-200 my-8 md:my-10", children: [] } },
  SvcReviews: { label: "Google reviews (live)", fields: { label: text("Small label"), heading: text("Heading"), linkText: text("Link text") }, defaultProps: { label: "Customer reviews", heading: "What Our Customers Say", linkText: "Read all reviews on Google" } },
  SvcRelated: { label: "Related services (live prices)", fields: { label: text("Small label"), heading: text("Heading") }, defaultProps: { label: "More from Cleaniq Services", heading: "Related cleaning services" } },
  SvcPriceList: { label: "Price list (live)", fields: { label: text("Small label"), heading: text("Heading"), text: text("Text") }, defaultProps: { label: "Prices", heading: "Prices", text: "Fixed prices, updated automatically from our booking system." } },
  SvcBeforeAfter: { label: "Before & after photos (this service)", fields: { title: text("Heading"), limit: { type: "number", label: "How many", min: 1, max: 12 } }, defaultProps: { title: "Before & after", limit: 4 } },
  SvcOurWork: { label: "Photos from our jobs (this service)", fields: { title: text("Heading") }, defaultProps: { title: "Photos from our recent jobs" } },
  SvcFaqs: {
    label: "FAQs (click to open)",
    fields: {
      numbered: choose("Numbers", [["yes", "1. 2. 3."], ["no", "No numbers"]]),
      items: { type: "array", label: "Questions", arrayFields: { q: text("Question"), a: area("Answer") }, defaultItemProps: { q: "New question?", a: "Answer." }, getItemSummary: (f) => f?.q || "Question" },
    },
    defaultProps: { numbered: "yes", items: [] },
  },
  SvcRoomCard: {
    label: "Room checklist card",
    fields: { label: text("Small label"), room: text("Room"), image: image("Photo"), alt: text("Photo description"), buttonLabel: text("Button text"), buttonLink: text("Button link ({book} = book this service)"), shown: { type: "number", label: "Tasks shown before \"View full checklist\"", min: 1, max: 30 }, tasks: lines("Tasks", "Task") },
    defaultProps: { label: "", room: "Room", image: "", alt: "", buttonLabel: "Book now", buttonLink: "{book}", shown: 5, tasks: [] },
  },

  OtherAreas: {
    label: "Area: links to other areas",
    fields: { heading: text("Heading"), prefix: text("Words before each area") },
    defaultProps: { heading: "Cleaners in nearby areas", prefix: "Cleaners in" },
  },
};

// Lists of plain text (paragraphs, ticks, points…): the page files keep plain text; the editor shows
// them as { text } items. Applies at any depth (e.g. each service card's points).
const STRING_LISTS = new Set(["paragraphs", "chips", "features", "commercialTypes", "successSteps", "successStepsPending", "lookingFor", "services", "goodToKnow", "highlights", "tips", "postcodes", "places", "tasks", "guarantees", "schemaAreas", "priceKeywords"]);
const convert = (value, toEditorForm) => {
  if (Array.isArray(value)) return value.map((v) => convert(v, toEditorForm));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      if (STRING_LISTS.has(k) && Array.isArray(v)) {
        return [k, toEditorForm ? wrap(v) : v.map((p) => (typeof p === "string" ? p : p?.text ?? ""))];
      }
      return [k, convert(v, toEditorForm)];
    }),
  );
};
export const fromEditor = (data) => ({ ...data, content: (data.content || []).map((item) => ({ ...item, props: convert(item.props || {}, false) })) });
export const toEditorData = (data) => ({ ...data, content: (data?.content || []).map((item) => ({ ...item, props: convert(item.props || {}, true) })) });

// The page's own background and spacing, as on the website.
const PAGE_WRAPPERS = {
  home: "bg-white min-h-screen overflow-x-hidden",
  about: "bg-white min-h-screen overflow-x-hidden",
  services: "pt-42 pb-20 bg-slate-50 min-h-screen overflow-x-hidden",
  contact: "pt-24 md:pt-32 pb-16 md:pb-24 bg-[#F8FAFC] min-h-screen",
  "commercial-cleaning": "pt-24 md:pt-32 pb-16 md:pb-24 bg-[#F8FAFC] min-h-screen",
  "get-a-quote": "min-h-screen bg-[#F3F6F4]",
  recruitment: "min-h-screen bg-white",
};

const COMPONENTS = Object.fromEntries(
  Object.entries(components).map(([name, c]) => {
    const Block = ALL_BLOCKS[name];
    // Puck passes its own extras (id, puck, editMode); the block only gets its content.
    const render = (all) => {
      const props = { ...all };
      // Blocks drawn without a wrapper ("inline") need Puck's drag handle to be selectable.
      ["id", ...(c.inline ? [] : ["puck"]), "editMode"].forEach((k) => delete props[k]);
      return <Block {...props} />;
    };
    return [name, { ...c, render }];
  }),
);

/** The editor's settings for one page (e.g. "page:about"). */
// Service pages: the top banner, stats and booking sidebar are page settings; "Above the page body"
// and the main column hold blocks.
function ServiceRoot({ slug, props, children }) {
  const services = useLiveServices();
  const info = serviceInfo(slug, services, { priceKeywords: props.priceKeywords, quoteMessage: props.quoteMessage });
  const Top = props.top;
  return (
    <ServiceContext.Provider value={info}>
      <div className="text-slate-900">
        <ServiceShell settings={props} top={typeof Top === "function" ? <Top /> : null}>
          <div className="md:col-span-2 space-y-0">{children}</div>
        </ServiceShell>
      </div>
    </ServiceContext.Provider>
  );
}
const SERVICE_ROOT_FIELDS = {
  title: { type: "text", label: "Page title (Google & browser tab)" },
  description: { type: "textarea", label: "Google description (120–158 characters)" },
  shareTitle: { type: "text", label: "Title when shared on social media" },
  shareDescription: { type: "textarea", label: "Description when shared on social media" },
  schemaDescription: { type: "textarea", label: "Service description for Google (not shown on the page)" },
  badge: text("Top banner: small badge"), heading: text("Top banner: heading"), tagline: area("Top banner: tagline"),
  trustBold: text("Top banner: bold words after the rating"), trustText: text("Top banner: words after them"),
  ctaLabel: text("Booking card: title"), ctaNote: text("Booking card: small print"), ctaFoot: text("Booking card: bottom line"),
  bookLabel: text("Book button text"), quoteLabel: text("WhatsApp button text"), quoteMessage: text("WhatsApp message"),
  showPhone: yesNo("Phone buttons"), phone: text("Phone number"),
  stats: cardList("Stats bar ({rating} = Google rating)", { value: text("Big text"), label: text("Small text") }, { value: "", label: "" }, "value"),
  sideLabel: text("Sidebar: title"), sideNote: text("Sidebar: small print"),
  sidePoints: cardList("Sidebar: points", { icon: choose("Icon", Object.keys(SERVICE_ICONS).map((k) => [k, k.replace(/-/g, " ")])), text: text("Text") }, { icon: "check", text: "" }, "text"),
  sideFoot: text("Sidebar: bottom line"), guaranteesTitle: text("Guarantees box: title"), guarantees: lines("Guarantees", "Guarantee"),
  showAreas: yesNo("Sidebar: areas covered"), areasTitle: text("Sidebar: areas title"),
  mobileBook: text("Phone bar: book button"), mobileCall: text("Phone bar: call button"),
  priceKeywords: lines("Price list: words that pick this page's prices", "Word"),
  schemaAreas: lines("Areas listed for Google", "Area"),
  top: { type: "slot", label: "Above the page body" },
};
const SERVICE_PIECES = ["SvcSection", "SvcBox", "SvcText", "SvcIcon", "SvcImg", "SvcDivider", "SvcFaqs", "SvcRoomCard"];
const SERVICE_LIVE = ["SvcPriceList", "SvcReviews", "SvcRelated", "SvcBeforeAfter", "SvcOurWork"];

export function puckConfigFor(pageKey) {
  const [type, slug] = String(pageKey || "").split(":");
  if (type === "service") {
    return {
      root: { fields: SERVICE_ROOT_FIELDS, render: ({ children, ...props }) => <ServiceRoot slug={slug} props={props}>{children}</ServiceRoot> },
      categories: {
        service: { title: "Service page pieces", components: SERVICE_PIECES },
        serviceLive: { title: "Live from our systems", components: SERVICE_LIVE },
        basics: { title: "Text, buttons & images (full width)", components: ["TextSection", "Buttons", "Image", "Spacer", "Faq"] },
        other: { visible: false },
      },
      components: COMPONENTS,
    };
  }
  const isArea = type === "location";
  const wrapper = isArea ? "pt-36 pb-12 bg-slate-50 min-h-screen" : PAGE_WRAPPERS[slug] || PAGE_WRAPPERS.home;
  const areaName = AREAS.find((a) => a.slug === slug)?.name || "";
  return {
    root: {
      render: ({ children }) => (
        <AreaContext.Provider value={{ slug: isArea ? slug : "", name: areaName }}>
          <div className={`${wrapper} text-slate-900`}>{children}</div>
        </AreaContext.Provider>
      ),
      fields: {
        title: { type: "text", label: isArea ? "Page title (Google & browser tab; {area} = area name)" : "Page title (Google & browser tab)" },
        description: { type: "textarea", label: "Google description (120–158 characters)" },
        shareTitle: { type: "text", label: "Title when shared on social media" },
        shareDescription: { type: "textarea", label: "Description when shared on social media" },
      },
    },
    categories: {
      ...(isArea ? { area: { title: "Area page sections ({area} = area name)", components: ["AreaHero", "AreaAbout", "AreaServices", "AreaGuide", "AreaHomes", "AreaBeforeAfter", "AreaNearby", "AreaFaq", "OtherAreas"] } } : {}),
      tops: { title: "Page tops", components: ["Hero", "PhotoHero", "PageHeading", "JobsHero"] },
      sections: {
        title: "Page sections",
        components: ["ServiceCards", "ImageText", "Story", "LinkCards", "IconCards", "BenefitCards", "ImageCards", "Values", "Steps", "NumberedSteps", "LocalAreas", "AreaLinks", "Coverage", "PhotoGrid", "Slideshow", "JobsInfo", "CommitmentBanner", "DarkBanner", "CallToAction", "ContactBanner", "ColumnsText"],
      },
      basics: { title: "Text, buttons & images", components: ["TextSection", "Buttons", "Image", "Spacer", "Faq", "FaqList"] },
      forms: { title: "Forms", components: ["ContactForm", "QuoteForm", "ApplyForm"] },
      live: { title: "Live from our systems", components: ["ServiceList", "GoogleReviews", "BeforeAfter", "BlogPosts"] },
      // Blocks made for other kinds of page (e.g. area blocks on the About page) aren't offered.
      other: { visible: false },
    },
    components: COMPONENTS,
  };
}
