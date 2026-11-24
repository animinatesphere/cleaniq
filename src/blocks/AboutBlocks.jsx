// About page blocks (also usable on any page in the visual editor). They look exactly like the
// About page's sections; all text, buttons, links and photos come from the page's content file.
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin, Star, ArrowRight, Plus, Phone, Mail } from "lucide-react";
import { useGoogleReviews } from "../utils/googleReviews";
import { AREAS } from "../utils/areas";
import BlockLink, { BlockButton, RichText } from "./BlockLink";
import { imageUrl } from "./blockUtils";
import { PickedIcon } from "./icons";

const list = (v) => (Array.isArray(v) ? v : []);
const para = (p) => (typeof p === "string" ? p : p?.text);
const BG = { white: "bg-white", light: "bg-slate-50/70", grey: "bg-slate-50", mint: "bg-secondary/10", green: "bg-primary/[0.04]" };

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6 },
};

export function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="text-center mx-auto max-w-3xl mb-12 md:mb-16">
      {eyebrow && <p className="text-[11px] font-black text-primary uppercase tracking-[0.35em] mb-4">{eyebrow}</p>}
      {title && <h2 className="text-3xl md:text-5xl font-extrabold text-primary-dark tracking-tighter leading-[1.1] mb-5">{title}</h2>}
      {text && <p className="text-lg text-slate-500 font-medium leading-relaxed"><RichText text={text} /></p>}
    </div>
  );
}

/* ── Page top with photo collage (About) ─────────────────────────── */
export function PhotoHeroBlock({ badge, heading, highlight, text, chips, showRating, buttons, mainImage, mainAlt, mainCaption, image2, alt2, caption2, image3, alt3, caption3, cornerLabel }) {
  const g = useGoogleReviews();
  return (
    <section className="relative pt-44 pb-16 md:pb-24 px-6 bg-gradient-to-b from-primary/[0.06] to-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {badge && (
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-7 shadow-sm">
              <MapPin size={12} /> {badge}
            </p>
          )}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary-dark tracking-tighter leading-[1.05] mb-7">
            {heading}{highlight ? <> <span className="text-primary italic">{highlight}</span></> : null}
          </h1>
          {text && <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-6 max-w-xl"><RichText text={text} /></p>}
          {list(chips).length > 0 && (
            <ul className="flex flex-wrap gap-2 mb-8">
              {list(chips).map((c, i) => (
                <li key={i} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-primary/15 text-primary-dark text-xs font-bold shadow-sm">
                  <CheckCircle2 size={14} className="text-primary" /> {para(c)}
                </li>
              ))}
            </ul>
          )}
          {showRating !== "no" && (
            <a href={g.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 mb-9 group">
              <span className="flex text-secondary">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={18} fill="currentColor" />)}</span>
              <span className="text-sm font-bold text-primary-dark group-hover:underline">{g.rating} on Google</span>
            </a>
          )}
          {list(buttons).length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">{list(buttons).map((b, i) => <BlockButton key={i} button={b} size="py-4 px-8 text-center" />)}</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative grid grid-cols-2 gap-4 md:gap-5">
          <figure className="relative row-span-2 rounded-[32px] overflow-hidden shadow-2xl shadow-primary/10">
            <img src={imageUrl(mainImage)} alt={mainAlt || ""} className="w-full h-full object-cover" width="800" height="950" />
            {mainCaption && (
              <figcaption className="absolute bottom-3 left-3 right-3 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-sm text-xs font-bold text-primary-dark shadow-lg">{mainCaption}</figcaption>
            )}
          </figure>
          {[[image2, alt2, caption2], [image3, alt3, caption3]].map(([img, alt, cap], i) => (
            <figure key={i} className="relative rounded-[32px] overflow-hidden shadow-xl">
              <img src={imageUrl(img)} alt={alt || ""} className="w-full aspect-square object-cover" loading="lazy" decoding="async" />
              {cap && <figcaption className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/55 text-white text-[10px] font-black uppercase tracking-widest">{cap}</figcaption>}
            </figure>
          ))}
          {cornerLabel && (
            <span className="absolute -top-3 right-4 px-3 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg">{cornerLabel}</span>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Our story + mission + vision ────────────────────────────────── */
export function StoryBlock({ label, heading, paragraphs, missionTitle, missionText, missionPoints, visionTitle, visionText, visionPoints }) {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-20 items-start">
        <motion.div {...fadeUp}>
          {label && <p className="text-[11px] font-black text-primary uppercase tracking-[0.35em] mb-4">{label}</p>}
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary-dark tracking-tighter leading-[1.1] mb-8">{heading}</h2>
          <div className="space-y-5 text-lg text-slate-600 font-medium leading-relaxed">
            {list(paragraphs).map((p, i) => <p key={i}><RichText text={para(p)} /></p>)}
          </div>
        </motion.div>
        <div className="space-y-6">
          {missionTitle && (
            <motion.div {...fadeUp} className="p-8 md:p-10 rounded-[36px] bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center mb-6"><PickedIcon name="target" size={28} /></div>
              <h3 className="text-2xl font-black text-primary-dark mb-3 tracking-tight">{missionTitle}</h3>
              <p className="text-slate-600 font-medium leading-relaxed mb-5">{missionText}</p>
              <ul className="space-y-2.5">
                {list(missionPoints).map((x, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><PickedIcon name={x.icon} size={18} /></span>
                    <span className="text-sm text-slate-600 font-medium leading-relaxed"><strong className="text-primary-dark">{x.title}:</strong> {x.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
          {visionTitle && (
            <motion.div {...fadeUp} className="p-8 md:p-10 rounded-[36px] bg-primary text-white relative overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-secondary flex items-center justify-center mb-6"><PickedIcon name="eye" size={28} /></div>
              <h3 className="text-2xl font-black mb-3 tracking-tight">{visionTitle}</h3>
              <p className="text-white/80 font-medium leading-relaxed mb-5">{visionText}</p>
              <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-2.5 relative">
                {list(visionPoints).map((x, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-white/10 text-secondary flex items-center justify-center shrink-0"><PickedIcon name={x.icon} size={16} /></span>
                    <span className="text-sm text-white/80 font-medium leading-snug"><strong className="text-white">{x.title}:</strong> {x.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Photo cards that link to pages (e.g. our services) ──────────── */
export function LinkCardsBlock({ label, heading, text, cards, background }) {
  return (
    <section className={`py-24 md:py-32 px-6 ${BG[background] || "bg-slate-50/70"}`}>
      <div className="max-w-7xl mx-auto">
        <SectionHeading eyebrow={label} title={heading} text={text} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list(cards).map((c, i) => (
            <motion.div key={i} {...fadeUp}>
              <BlockLink href={c.link} className="group block h-full rounded-[32px] overflow-hidden bg-white border border-slate-100 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300">
                {c.image && (
                  <div className="aspect-[3/2] overflow-hidden">
                    <img src={imageUrl(c.image)} alt={c.imageAlt || c.title || ""} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-black text-primary-dark mb-2 flex items-center justify-between gap-2">
                    {c.title}
                    <ArrowRight size={18} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{c.text}</p>
                </div>
              </BlockLink>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Icon cards (e.g. "Why you can trust our cleaners") ──────────── */
export function IconCardsBlock({ label, heading, text, cards, background }) {
  const items = list(cards);
  // Five cards: three on the first row, two centred below (as on the About page).
  const five = items.length === 5;
  return (
    <section className={`py-24 md:py-32 px-6 ${BG[background] || "bg-white"}`}>
      <div className="max-w-7xl mx-auto">
        <SectionHeading eyebrow={label} title={heading} text={text} />
        <div className={`grid sm:grid-cols-2 gap-6 ${five ? "lg:grid-cols-6" : items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {items.map((c, i) => (
            <motion.div key={i} {...fadeUp} className={`p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-shadow ${five ? "lg:col-span-2" : ""} ${five && i === 3 ? "lg:col-start-2" : ""}`}>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6"><PickedIcon name={c.icon} size={26} /></div>
              <h3 className="text-lg font-black text-primary-dark mb-3">{c.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed"><RichText text={c.text} /></p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Green band with value cards ─────────────────────────────────── */
export function ValuesBlock({ label, heading, cards }) {
  const items = list(cards);
  return (
    <section className="py-24 md:py-32 px-6 bg-primary text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2" />
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {label && <p className="text-[11px] font-black text-secondary uppercase tracking-[0.35em] mb-4">{label}</p>}
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter leading-[1.1]">{heading}</h2>
        </div>
        <div className={`grid sm:grid-cols-2 gap-5 ${items.length >= 5 ? "lg:grid-cols-5" : items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {items.map((v, i) => (
            <motion.div key={i} {...fadeUp} className="p-7 rounded-[28px] bg-white/[0.07] border border-white/10 backdrop-blur-sm">
              <div className="text-secondary mb-5"><PickedIcon name={v.icon} size={26} /></div>
              <h3 className="text-lg font-black mb-2">{v.title}</h3>
              <p className="text-sm text-white/70 font-medium leading-relaxed">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Links to every area page, each with its own line of text ────── */
export function AreaLinksBlock({ label, heading, text, linkPrefix, areaTexts, background }) {
  const texts = Object.fromEntries(list(areaTexts).map((a) => [a.slug, a.text]));
  return (
    <section className={`py-24 md:py-32 px-6 ${BG[background] || "bg-slate-50/70"}`}>
      <div className="max-w-7xl mx-auto">
        <SectionHeading eyebrow={label} title={heading} text={text} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {AREAS.map((a) => (
            <Link key={a.slug} to={`/locations/${a.slug}`} className="group flex gap-4 p-5 md:p-6 rounded-[24px] bg-white border border-slate-100 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"><MapPin size={18} /></span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-base font-black text-primary-dark group-hover:text-primary">
                  {linkPrefix ?? "Cleaners in"} {a.name}
                  <ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                </span>
                {texts[a.slug] && <span className="block text-sm text-slate-500 font-medium leading-relaxed mt-1">{texts[a.slug]}</span>}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQs in the About page style (also tells Google about them) ─── */
export function FaqListBlock({ label, heading, faqs, background, spaceAbove }) {
  const items = list(faqs).filter((f) => f?.q);
  return (
    <section className={`${spaceAbove === "no" ? "pb-24 md:pb-32" : "py-24 md:py-32"} px-6 ${BG[background] || "bg-white"}`}>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: String(f.q), acceptedAnswer: { "@type": "Answer", text: String(f.a || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replaceAll("**", "") } })),
        })}
      </script>
      <div className="max-w-3xl mx-auto">
        <SectionHeading eyebrow={label} title={heading} />
        <div className="space-y-4">
          {items.map((faq, i) => (
            <details key={i} className="group p-6 rounded-[28px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <summary className="list-none flex items-center justify-between gap-4 text-lg font-black text-primary-dark">
                {faq.q}
                <Plus className="text-primary group-open:rotate-45 transition-transform shrink-0" />
              </summary>
              <p className="mt-4 text-slate-500 font-medium leading-relaxed"><RichText text={faq.a} /></p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Dark call-to-action with phone and email ────────────────────── */
export function ContactBannerBlock({ heading, text, buttons, phone, email }) {
  return (
    <section className="pb-24 md:pb-32 px-6">
      <div className="max-w-7xl mx-auto rounded-[40px] md:rounded-[56px] bg-slate-900 text-white p-8 sm:p-12 md:p-16 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
        <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter leading-[1.1] mb-5">{heading}</h2>
            {text && <p className="text-lg text-white/70 font-medium leading-relaxed mb-8 max-w-xl">{text}</p>}
            <div className="flex flex-col sm:flex-row gap-3">{list(buttons).map((b, i) => <BlockButton key={i} button={b} size="py-4 px-8 text-center" />)}</div>
          </div>
          <div className="space-y-5">
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-5 p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-secondary shrink-0"><Phone size={22} /></span>
                <span>
                  <span className="block text-xs text-white/50 font-bold uppercase tracking-widest mb-1">Call us</span>
                  <span className="text-lg font-bold">{phone}</span>
                </span>
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-5 p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-secondary shrink-0"><Mail size={22} /></span>
                <span>
                  <span className="block text-xs text-white/50 font-bold uppercase tracking-widest mb-1">Email us</span>
                  <span className="text-lg font-bold break-all">{email}</span>
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Block name → component, for pages and the editor (see registry.js).
// eslint-disable-next-line react-refresh/only-export-components
export const ABOUT_BLOCKS = {
  PhotoHero: PhotoHeroBlock,
  Story: StoryBlock,
  LinkCards: LinkCardsBlock,
  IconCards: IconCardsBlock,
  Values: ValuesBlock,
  AreaLinks: AreaLinksBlock,
  FaqList: FaqListBlock,
  ContactBanner: ContactBannerBlock,
};
