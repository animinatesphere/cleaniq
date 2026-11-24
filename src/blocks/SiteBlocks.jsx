// Page blocks: the website's sections as building blocks for the visual page editor (/content-admin).
// Each block looks exactly like the section it came from; its text, buttons, links and images come
// from the page's content file (src/content/pages/*.json). Live data (Google rating, blog posts,
// areas, prices) still comes from the site's own systems.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, ShieldCheck, Home as HomeIcon, Briefcase, ArrowRight, Zap, Plus, Sparkles, Leaf, Clock, BadgeCheck } from "lucide-react";
import { useRegion } from "../context/RegionContext";
import { useGoogleReviews } from "../utils/googleReviews";
import { AREAS } from "../utils/areas";
// Each area's highlighted neighbourhoods only (see vite.config.js), not the location pages' full text.
import AREA_HIGHLIGHTS from "virtual:area-highlights";
import { SERVICE_PAGES, servicePagePath } from "../utils/servicePages";
import { blogPath } from "../utils/slugGenerator";
import { uploadUrl } from "../utils/uploads";
import GoogleReviewsSection from "../component/GoogleReviewsSection";
import BeforeAfter from "../component/BeforeAfter";
import BlockLink, { BlockButton, RichText } from "./BlockLink";
import { imageUrl } from "./blockUtils";

const ICONS = { home: HomeIcon, briefcase: Briefcase, zap: Zap, star: Star, shield: ShieldCheck, sparkles: Sparkles, leaf: Leaf, clock: Clock, badge: BadgeCheck };
const Icon = ({ name, size = 24 }) => {
  const C = ICONS[name] || Star;
  return <C size={size} />;
};
const list = (v) => (Array.isArray(v) ? v : []);
const BG = { white: "bg-white", light: "bg-slate-50/50", grey: "bg-slate-50", mint: "bg-secondary/10" };

// Small label + big heading used by most sections.
const Eyebrow = ({ children, className = "" }) =>
  children ? <h2 className={`text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4 ${className}`}>{children}</h2> : null;

/* ── Hero ─────────────────────────────────────────────────────────── */
export function HeroBlock({ badge, heading, highlight, text, buttons, showAppButtons, showGoogleBadge, image, imageAlt, statTitle, statText }) {
  const { region } = useRegion();
  const uk = region.id === "UK";
  return (
    <section className="relative min-h-screen flex items-center pt-28 md:pt-40 pb-12 md:pb-20 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-l-[150px] hidden lg:block" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
        {/* Shown straight away (no fade-in): the first thing visitors and Google see. */}
        <motion.div initial={false} animate={{ opacity: 1, x: 0 }}>
          {badge && (
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white shadow-xl shadow-primary/5 text-primary font-black text-[10px] md:text-sm mb-4 md:mb-8 border border-primary/5 mt-10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              {uk ? badge : "EXCEPTIONAL CLEANING IN MANCHESTER"}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary-dark leading-[1.1] mb-4 md:mb-8 tracking-tighter">
            {uk ? heading : "Top-Rated End of Tenancy Cleaning  in"}
            <br />
            <span className="text-primary bg-clip-text">{uk ? highlight : "Lagos & Abuja"}</span>.
          </h1>
          <p className="text-base md:text-xl text-slate-600 mb-6 md:mb-10 max-w-lg leading-relaxed font-medium">
            {uk
              ? text
              : "We provide reliable professional maid and janitorial services. Whether you need a regular weekly clean or specialised Airbnb cleaning, our vetted pros take care of your space."}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center">
            {list(buttons).map((b, i) => (
              <BlockButton key={i} button={b} size="py-5 px-10 text-[10px] sm:text-[12px] md:text-[14px] lg:text-[16px]" />
            ))}
            {showAppButtons !== "no" && (
              <div className="flex w-full items-center gap-2 sm:gap-3 sm:justify-center">
                <a href="https://apps.apple.com/app/Cleaniq Services-services/id6787302038" target="_blank" rel="noopener noreferrer" aria-label="Download Cleaniq Services on the App Store" className="group inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-white/15 bg-black px-3 py-2.5 sm:px-4 sm:py-2.5 lg:px-3 lg:py-2.5 lg:rounded-full text-white shadow-lg shadow-black/30 transition-all duration-200 hover:bg-zinc-900 hover:border-white/25 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                  <span className="flex min-w-0 flex-col items-start leading-none lg:hidden"><span className="text-[8px] font-medium uppercase tracking-widest text-white/70">Download on the</span><span className="mt-0.5 whitespace-nowrap text-sm font-semibold tracking-tight">App Store</span></span>
                  <span className="hidden lg:inline text-xs font-semibold">App Store</span>
                </a>
                <a href="https://expo.dev/artifacts/eas/yUF7N6zJ9lCSOwooWtkD7nZjaRD5jBnaihsb7UOgF1A.apk" target="_blank" rel="noopener noreferrer" aria-label="Download Cleaniq Services for Android" className="group inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-white/15 bg-black px-3 py-2.5 sm:px-4 sm:py-2.5 lg:px-3 lg:py-2.5 lg:rounded-full text-white shadow-lg shadow-black/30 transition-all duration-200 hover:bg-zinc-900 hover:border-white/25 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  <svg viewBox="0 0 512 512" aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"><path fill="#00A0FF" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z"/><path fill="#00E676" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z"/><path fill="#FFC900" d="M472.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z"/><path fill="#FF3A44" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                  <span className="flex min-w-0 flex-col items-start leading-none lg:hidden"><span className="text-[8px] font-medium uppercase tracking-widest text-white/70">Download for</span><span className="mt-0.5 whitespace-nowrap text-sm font-semibold tracking-tight">Android</span></span>
                  <span className="hidden lg:inline text-xs font-semibold">Android</span>
                </a>
              </div>
            )}
            {showGoogleBadge !== "no" && <GoogleBadge />}
          </div>
        </motion.div>
        <motion.div initial={false} animate={{ opacity: 1, scale: 1 }} className="hidden md:relative md:block">
          <div className="relative z-10 rounded-[40px] lg:rounded-[60px] overflow-hidden shadow-2xl border-4 lg:border-8 border-white bg-slate-100">
            {/* Hidden on phones, so phones get a 1-pixel placeholder instead of downloading the photo. */}
            <picture>
              <source media="(max-width: 767px)" srcSet="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" />
              <img src={imageUrl(image)} alt={imageAlt || ""} className="w-full h-[360px] lg:h-[600px] object-cover" fetchPriority="high" width="1200" height="800" />
            </picture>
          </div>
          {statTitle && (
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[32px] shadow-2xl shadow-primary/10 z-20 border border-slate-50 hidden md:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center"><ShieldCheck size={24} /></div>
                <div>
                  <p className="text-2xl font-black text-primary-dark tracking-tighter">{statTitle}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{statText}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function GoogleBadge() {
  const g = useGoogleReviews();
  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <a href={g.url || "https://maps.app.goo.gl/UHcabzmFuj11wuLo9"} target="_blank" rel="noopener noreferrer" aria-label="Read our Google reviews" className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center shrink-0">
        <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
      </a>
      <div>
        <div className="flex text-secondary mb-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill="currentColor" />)}</div>
        <p className="text-[10px] font-black text-primary-dark uppercase tracking-widest">{g.rating}★ on Google</p>
      </div>
    </div>
  );
}

/* ── Service cards ────────────────────────────────────────────────── */
export function ServiceCardsBlock({ label, heading, text, cards, hubTitle, showHubLinks }) {
  const { region } = useRegion();
  const uk = region.id === "UK";
  return (
    <section className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Eyebrow>{label}</Eyebrow>
          <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-6">{uk ? heading : "Tailored cleaning for Nigerian homes & offices."}</h3>
          <p className="text-lg text-slate-500 font-medium">
            {uk ? text : "Whether it's regular maintenance or a deep seasonal refresh, we have the right pros for you."}
            {!uk && <span className="block mt-2 text-primary font-bold text-sm">Proudly paying above the Nigerian living wage.</span>}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {list(cards).map((c, idx) => (
            <motion.div key={idx} whileHover={{ y: -10 }} className="relative cursor-pointer rounded-[40px] bg-white border-2 border-slate-100 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all overflow-hidden">
              <div className="h-56 bg-primary/5 overflow-hidden relative">
                <img src={imageUrl(c.image)} alt={c.imageAlt || c.title} className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700" loading="lazy" decoding="async" width="600" height="224" />
                <div className="absolute bottom-4 left-4 w-12 h-12 rounded-2xl bg-white shadow-lg text-primary flex items-center justify-center"><Icon name={c.icon} size={32} /></div>
              </div>
              <div className="p-8">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{c.keyword}</h4>
                <h5 className="text-2xl font-black text-primary-dark mb-3 tracking-tight">{c.title}</h5>
                <p className="text-slate-500 font-medium leading-relaxed text-sm mb-6">{c.desc}</p>
                <BlockLink href={c.link} className="inline-flex items-center gap-2 font-black text-primary hover:gap-4 transition-all after:absolute after:inset-0 after:content-['']">
                  {c.linkLabel || "View service"} <ArrowRight size={18} />
                </BlockLink>
              </div>
            </motion.div>
          ))}
        </div>
        {showHubLinks !== "no" && (
          <div className="mt-20 border-t border-slate-100 pt-16">
            <h4 className="text-[10px] font-black text-center text-slate-400 uppercase tracking-[0.3em] mb-8">{hubTitle}</h4>
            <div className="flex flex-wrap justify-center gap-4">
              {SERVICE_PAGES.map((p) => (
                <Link key={p.slug} to={servicePagePath(p.slug)} className="px-6 py-3.5 bg-slate-50 border border-slate-100 hover:border-primary/20 rounded-2xl text-xs font-black text-primary-dark hover:text-primary transition-all shadow-sm hover:shadow">
                  {p.name} &rarr;
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Image + text (e.g. "Our Mission") ────────────────────────────── */
export function ImageTextBlock({ label, heading, highlight, headingEnd, text, image, imageAlt, imageSide, stats, button, background }) {
  const g = useGoogleReviews();
  const imageFirst = imageSide !== "right";
  return (
    <section className={`py-24 md:py-32 ${BG[background] || "bg-white"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className={`relative ${imageFirst ? "order-2 lg:order-1" : "order-2"}`}>
            <div className="relative z-10 rounded-[48px] overflow-hidden shadow-2xl">
              <img src={imageUrl(image)} alt={imageAlt || ""} className="w-full h-[500px] object-cover" loading="lazy" decoding="async" />
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
          </div>
          <div className={imageFirst ? "order-1 lg:order-2" : "order-1"}>
            <Eyebrow>{label}</Eyebrow>
            <h3 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-primary-dark tracking-tighter mb-8">
              {heading}{highlight ? <> <span className="text-primary italic">{highlight}</span></> : null}{headingEnd ? <> {headingEnd}</> : null}
            </h3>
            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8"><RichText text={text} /></p>
            {list(stats).length > 0 && (
              <div className="flex flex-col sm:flex-row gap-6 mb-10">
                {list(stats).map((s, i) => (
                  <div key={i} className="flex-1 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-3xl font-black text-primary mb-1">{String(s.value || "").replace("{rating}", g.rating)}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            <BlockButton button={button} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Steps ("Book in 3 simple steps") ─────────────────────────────── */
export function StepsBlock({ label, heading, steps, background }) {
  return (
    <section className={`py-24 md:py-32 ${BG[background] || "bg-slate-50/50"}`}>
      <div className="max-w-7xl mx-auto px-6 text-center">
        <Eyebrow>{label}</Eyebrow>
        <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark mb-16 md:mb-20 tracking-tighter">{heading}</h3>
        <div className={`grid gap-12 relative ${list(steps).length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <div className="absolute top-1/4 left-0 w-full h-0.5 bg-slate-100 hidden md:block" />
          {list(steps).map((s, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-[30px] bg-white border-2 border-slate-50 shadow-xl flex items-center justify-center text-2xl font-black text-primary mb-8">{s.number || String(i + 1).padStart(2, "0")}</div>
              <h4 className="text-2xl font-black text-primary-dark mb-4">{s.title}</h4>
              <p className="text-slate-500 font-medium max-w-[250px] mx-auto">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Local cleaners text + area links ─────────────────────────────── */
export function LocalAreasBlock({ label, heading, paragraphs, buttons, areaCount }) {
  return (
    <section className="py-24 md:py-32 bg-slate-50/70">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <Eyebrow>{label}</Eyebrow>
          <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-8">{heading}</h3>
          <div className="space-y-5 text-lg text-slate-600 font-medium leading-relaxed">
            {list(paragraphs).map((p, i) => <p key={i}><RichText text={typeof p === "string" ? p : p?.text} /></p>)}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-10">{list(buttons).map((b, i) => <BlockButton key={i} button={b} />)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {AREAS.slice(0, Number(areaCount) || 8).map((a) => (
            <Link key={a.slug} to={`/locations/${a.slug}`} className="group flex items-start gap-3 p-4 md:p-5 rounded-2xl bg-white border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all">
              <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-primary-dark group-hover:text-primary">{a.name} cleaners</span>
                {AREA_HIGHLIGHTS[a.slug]?.length > 0 && <span className="block text-xs text-slate-500 font-medium mt-1 leading-snug">{AREA_HIGHLIGHTS[a.slug].join(" · ")}</span>}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Before & after photos / Google reviews (live) ────────────────── */
export function BeforeAfterBlock({ title }) {
  return (
    <div className="max-w-7xl mx-auto px-6 w-full">
      <BeforeAfter className="pt-24 md:pt-32" {...(title ? { title } : {})} />
    </div>
  );
}
export function GoogleReviewsBlock() {
  return <GoogleReviewsSection />;
}

/* ── FAQs (also tells Google about them) ──────────────────────────── */
export function FaqBlock({ label, heading, faqs }) {
  const items = list(faqs).filter((f) => f?.q);
  return (
    <section className="py-24 md:py-32 bg-white">
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: String(f.q), acceptedAnswer: { "@type": "Answer", text: String(f.a || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replaceAll("**", "") } })),
        })}
      </script>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">{label}</h2>
          <h3 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter">{heading}</h3>
        </div>
        <div className="space-y-4">
          {items.map((faq, i) => (
            <details key={i} className="group p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer">
              <summary className="list-none flex items-center justify-between text-lg font-black text-primary-dark">
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

/* ── Photo slideshow ──────────────────────────────────────────────── */
export function SlideshowBlock({ label, heading, slides }) {
  const items = list(slides);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (items.length < 2) return undefined;
    const t = setInterval(() => setActive((p) => (p + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">{label}</h2>
        <h3 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter">{heading}</h3>
      </div>
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-[40px] overflow-hidden h-[500px]">
          {items.map((s, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === active % Math.max(items.length, 1) ? "opacity-100" : "opacity-0"}`}>
              <img src={imageUrl(s.image)} alt={s.alt || s.label} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-1">Now showing</p>
                <p className="text-3xl font-black text-white">{s.label}</p>
              </div>
            </div>
          ))}
          <div className="absolute bottom-8 right-8 flex gap-2">
            {items.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`} className={`h-2 rounded-full transition-all duration-500 ${i === active % Math.max(items.length, 1) ? "w-8 bg-white" : "w-2 bg-white/40"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Coverage: service × area links ───────────────────────────────── */
const CATEGORIES = [
  { id: "OfficeCleaning", label: "Office Cleaning", name: "Office cleaning" },
  { id: "DeepCleaning", label: "Deep Cleaning", name: "Deep cleaning" },
  { id: "endOfTenancy", label: "End of Tenancy", name: "End of Tenancy Cleaning" },
  { id: "regular", label: "Regular Cleaning", name: "Regular cleaning" },
  { id: "airbnb", label: "Airbnb Cleaning", name: "Airbnb cleaning" },
];
export function CoverageBlock({ label, heading, text, ctaText, button }) {
  const [cat, setCat] = useState(CATEGORIES[0].id);
  const current = CATEGORIES.find((c) => c.id === cat);
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Eyebrow>{label}</Eyebrow>
          <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-6">{heading}</h3>
          <p className="text-lg text-slate-600 font-medium">{text}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`px-5 md:px-6 py-2.5 md:py-3 rounded-full font-black text-xs md:text-sm uppercase tracking-wide transition-all ${cat === c.id ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <motion.div key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {AREAS.map((a) => (
            <motion.div key={a.slug} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link to={`/locations/${a.slug}`} className="block p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-slate-200 hover:border-primary/30 hover:shadow-lg transition-all text-center group">
                <p className="text-sm font-black text-primary-dark group-hover:text-primary transition-colors">{current.name} in {a.name}</p>
                <p className="text-xs text-slate-500 font-bold mt-2 group-hover:text-slate-600 transition-colors">{AREA_HIGHLIGHTS[a.slug]?.length ? AREA_HIGHLIGHTS[a.slug].join(" · ") : a.name} →</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        <div className="text-center mt-16">
          {ctaText && <p className="text-slate-600 font-medium mb-6">{ctaText}</p>}
          <BlockButton button={button} />
        </div>
      </div>
    </section>
  );
}

/* ── Latest blog posts (live) ─────────────────────────────────────── */
const readTime = (post) => post.readTime || Math.max(5, Math.ceil(String(post.content || "").trim().split(/\s+/).length / 200));
export function BlogPostsBlock({ label, heading, text, button }) {
  // Latest posts built into the page HTML at build time (scripts/prerender.mjs), refreshed live.
  const builtIn = (typeof window !== "undefined" && window.__HOME_BLOG__) || globalThis.__HOME_BLOG__ || null;
  const [posts, setPosts] = useState(builtIn || []);
  const [loading, setLoading] = useState(!builtIn?.length);
  useEffect(() => {
    let active = true;
    const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    fetch(`${api}/blog?limit=3&page=1`)
      .then((r) => r.json())
      .then((d) => { if (active && (d.posts?.length || !builtIn?.length)) setPosts(d.posts || []); })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [builtIn?.length]);
  return (
    <section className="py-24 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Eyebrow>{label}</Eyebrow>
          <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-6">{heading}</h3>
          <p className="text-lg text-slate-600 font-medium">{text}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block h-8 w-8 border-4 border-primary border-r-transparent rounded-full animate-spin" />
              <p className="mt-4 text-slate-600 font-medium">Loading articles...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <motion.div key={post._id} whileHover={{ y: -8 }} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden relative">
                  {post.image ? (
                    <img src={uploadUrl(post.image)} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="text-5xl font-black text-primary opacity-20">{post.title.charAt(0)}</div>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500">
                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded-full">Cleaning Tips</span>
                    <span>{readTime(post)} min read</span>
                  </div>
                  <h4 className="text-xl font-black text-primary-dark mb-3 line-clamp-2">{post.title}</h4>
                  <p className="text-slate-600 text-sm mb-6 line-clamp-2">{post.description}</p>
                  <Link to={blogPath(post)} className="inline-flex items-center gap-2 font-black text-primary hover:gap-3 transition-all text-sm">Read Article <ArrowRight size={16} /></Link>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12"><p className="text-slate-600 font-medium">No articles available yet.</p></div>
          )}
        </div>
        <div className="text-center"><BlockButton button={button} /></div>
      </div>
    </section>
  );
}

/* ── Dark banner (e.g. "Become a Cleaniq Services Pro") ───────────── */
export function DarkBannerBlock({ heading, text, smallTitle, smallText, button }) {
  const { region } = useRegion();
  return (
    <section className="py-24 bg-white border-t border-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-900 rounded-[48px] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          <div className="max-w-2xl relative z-10">
            <h2 className="text-2xl md:text-5xl font-extrabold mb-6 tracking-tighter">{heading}</h2>
            <p className="text-xl text-slate-400 font-medium leading-relaxed mb-8">
              {region.id === "UK" ? text : "Join Nigeria's fastest growing cleaning agency. We're looking for dedicated professionals to join our elite team in Lagos and Abuja."}
            </p>
            {smallTitle && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-secondary"><ShieldCheck size={24} /></div>
                <div>
                  <p className="font-bold">{smallTitle}</p>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{smallText}</p>
                </div>
              </div>
            )}
          </div>
          <div className="relative z-10 w-full md:w-auto">
            <BlockButton button={button} size="py-5 px-10 text-lg w-full md:w-auto flex items-center justify-center gap-3" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Call to action ───────────────────────────────────────────────── */
export function CallToActionBlock({ heading, text, buttons, background }) {
  return (
    <section className={`py-24 relative overflow-hidden ${BG[background] || "bg-secondary/10"}`}>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-2xl md:text-5xl lg:text-6xl font-extrabold text-primary-dark tracking-tighter mb-8">{heading}</h2>
        {text && <p className="text-xl text-slate-600 mb-12 font-medium">{text}</p>}
        {/* Full-width buttons, stacked, as on the original page. */}
        <div className="space-y-4">{list(buttons).map((b, i) => <BlockButton key={i} button={b} size="py-6 px-12 text-xl shadow-2xl shadow-primary/30" />)}</div>
      </div>
    </section>
  );
}

/* ── Small print in columns (e.g. the SEO text at the bottom) ─────── */
export function ColumnsTextBlock({ columns }) {
  return (
    <section className="py-16 bg-white text-slate-400 border-t border-slate-50">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12">
        {list(columns).map((c, i) => (
          <div key={i}>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">{c.title}</h4>
            <p className="text-sm md:text-base leading-relaxed font-medium text-slate-400"><RichText text={c.text} /></p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── General blocks for adding new content anywhere ──────────────── */
export function TextSectionBlock({ label, heading, paragraphs, align, background, buttons }) {
  const center = align === "center";
  return (
    <section className={`py-20 md:py-24 ${BG[background] || "bg-white"}`}>
      <div className={`max-w-4xl mx-auto px-6 ${center ? "text-center" : ""}`}>
        <Eyebrow>{label}</Eyebrow>
        {heading && <h3 className="text-2xl md:text-4xl font-extrabold text-primary-dark tracking-tighter mb-6">{heading}</h3>}
        <div className="space-y-5 text-lg text-slate-600 font-medium leading-relaxed">
          {list(paragraphs).map((p, i) => <p key={i}><RichText text={typeof p === "string" ? p : p?.text} /></p>)}
        </div>
        {list(buttons).length > 0 && (
          <div className={`flex flex-col sm:flex-row gap-3 mt-8 ${center ? "justify-center" : ""}`}>{list(buttons).map((b, i) => <BlockButton key={i} button={b} />)}</div>
        )}
      </div>
    </section>
  );
}

export function ButtonsBlock({ buttons, align, background }) {
  const justify = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
  return (
    <section className={`py-8 ${BG[background] || "bg-white"}`}>
      <div className={`max-w-7xl mx-auto px-6 flex flex-col sm:flex-row flex-wrap gap-3 ${justify}`}>{list(buttons).map((b, i) => <BlockButton key={i} button={b} />)}</div>
    </section>
  );
}

export function ImageBlock({ image, alt, caption, width, background }) {
  const w = width === "small" ? "max-w-2xl" : width === "full" ? "max-w-7xl" : "max-w-5xl";
  return (
    <section className={`py-12 ${BG[background] || "bg-white"}`}>
      <figure className={`${w} mx-auto px-6`}>
        <img src={imageUrl(image)} alt={alt || ""} loading="lazy" decoding="async" className="w-full rounded-[32px] shadow-xl object-cover" />
        {caption && <figcaption className="mt-3 text-center text-sm text-slate-500 font-medium">{caption}</figcaption>}
      </figure>
    </section>
  );
}

export function SpacerBlock({ size }) {
  const h = { small: "h-8", medium: "h-16", large: "h-32" }[size] || "h-16";
  return <div className={h} aria-hidden="true" />;
}
