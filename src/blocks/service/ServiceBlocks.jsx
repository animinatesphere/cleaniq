// Service page blocks (/service/<slug>). Each service page is a list of blocks in
// src/content/services/<slug>.json, built and edited with drag and drop in /content-admin.
//  - Building pieces: Box (a section, card, list or row that holds other blocks), Text, Icon, Image.
//    Each keeps the exact look it was given (its "cls"), so pages look as they always have.
//  - Live blocks: prices, reviews, related services, FAQs, checklists and photos come from the
//    booking system, Google and our photo folders.
//  - ServiceShell: the top banner, stats bar, booking sidebar and phone bar around the blocks.
import { createElement, useContext, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Calendar, Star, Check, ArrowRight, BadgeCheck, Clock, Sparkles, ChevronDown, Phone, MapPin,
  Home as HomeIcon, Heart, Leaf, Users, KeyRound, ThumbsUp, Mail, MessageCircle, CircleCheck,
} from "lucide-react";
import { useGoogleReviews } from "../../utils/googleReviews";
import { servicePagePath } from "../../utils/servicePages";
import { AREAS } from "../../utils/areas";
import { priceNote } from "../../utils/serviceRules";
import BeforeAfter from "../../component/BeforeAfter";
import OurWork from "../../component/OurWork";
import BlockLink from "../BlockLink";
import PageBlocks from "../PageBlocks";
import { imageUrl } from "../blockUtils";
import { ServiceContext } from "./serviceContext";
import { formatPrice, fromPriceForPage } from "./serviceData";

const list = (v) => (Array.isArray(v) ? v : []);
const str = (p) => (typeof p === "string" ? p : p?.text || "");
const VOID = new Set(["br", "hr", "img", "input"]);

// Icons the service blocks can show (lucide names, as in the page files).
export const SERVICE_ICONS = {
  check: Check, "map-pin": MapPin, phone: Phone, "arrow-right": ArrowRight, calendar: Calendar, sparkles: Sparkles,
  "badge-check": BadgeCheck, "shield-check": ShieldCheck, star: Star, clock: Clock, "chevron-down": ChevronDown,
  house: HomeIcon, heart: Heart, leaf: Leaf, users: Users, "key-round": KeyRound, "thumbs-up": ThumbsUp, mail: Mail,
  "message-circle": MessageCircle, "circle-check": CircleCheck,
};

/** Replaces {book} with the page's booking link and {rating} with the Google rating. */
function useTokens() {
  const ctx = useContext(ServiceContext);
  const g = useGoogleReviews();
  const text = (s) => (s != null && typeof s === "object" ? s : String(s ?? "").replaceAll("{rating}", g.rating));
  const link = (h) => (h === "{book}" ? ctx.bookingLink : h === "{quote}" ? ctx.quoteLink : h);
  return { text, link, ctx, g };
}

/* ── Text with [links](/page), **bold**, {{classes|styled words}} and line breaks ── */
const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([\s\S]+?)\*\*|\{\{([^|}]*)\|([\s\S]+?)\}\}|\n/g;
function Rich({ text, linkCls, link }) {
  if (typeof text !== "string") return text ?? null;
  const out = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = m.index;
    if (m[1] != null) out.push(<BlockLink key={k} href={link(m[2])} className={linkCls ?? "text-teal-700 font-semibold hover:underline"}><Rich text={m[1]} link={link} /></BlockLink>);
    else if (m[3] != null) out.push(<strong key={k}><Rich text={m[3]} linkCls={linkCls} link={link} /></strong>);
    else if (m[4] != null) out.push(<span key={k} className={m[4]}><Rich text={m[5]} linkCls={linkCls} link={link} /></span>);
    else out.push(<br key={k} />);
    last = k + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** Child blocks of a Box: Puck's drop zone in the editor, the saved list on the website. */
function Slot({ value, as, ...rest }) {
  if (typeof value === "function") return createElement(value, { as, ...rest });
  const items = list(value);
  if (VOID.has(as)) return createElement(as, rest);
  return createElement(as, rest, items.length ? renderBlocks(items) : undefined);
}
function renderBlocks(items) {
  return items.map((item, i) => {
    const Block = SERVICE_BLOCKS[item.type];
    const { id, ...props } = item.props || {};
    if (Block) return <Block key={id || i} {...props} />;
    return <PageBlocks key={id || i} data={{ content: [item] }} />;
  });
}

/* ── Building pieces ─────────────────────────────────────────────── */
export function SvcBox({ tag, cls, href, hidden, anchor, children }) {
  const { link } = useTokens();
  const as = tag || "div";
  const extra = { className: cls || undefined, ...(anchor ? { id: anchor } : {}), ...(hidden === "yes" ? { hidden: true } : {}) };
  if (as === "a" && href && typeof children !== "function") {
    return <BlockLink href={link(href)} {...extra}>{renderBlocks(list(children))}</BlockLink>;
  }
  return <Slot value={children} as={as} {...extra} />;
}

export function SvcText({ tag, cls, text, href, linkCls, anchor, puck }) {
  const { text: t, link } = useTokens();
  const content = <Rich text={t(text)} linkCls={linkCls} link={link} />;
  const ref = puck?.dragRef;
  if (tag === "a") return <BlockLink href={link(href)} className={cls || undefined} {...(anchor ? { id: anchor } : {})}>{content}</BlockLink>;
  if (!tag) return ref ? <span ref={ref}>{content}</span> : content;
  return createElement(tag, { className: cls || undefined, ref, ...(anchor ? { id: anchor } : {}) }, content);
}

export function SvcIcon({ name, cls, size, puck }) {
  const C = SERVICE_ICONS[name] || Check;
  return <C size={Number(size) || 16} className={cls || undefined} ref={puck?.dragRef} />;
}

export function SvcImg({ image, alt, cls, width, height, lazy, puck }) {
  return (
    <img
      ref={puck?.dragRef}
      src={imageUrl(image)}
      alt={alt || ""}
      className={cls || undefined}
      {...(width ? { width } : {})}
      {...(height ? { height } : {})}
      {...(lazy !== "no" ? { loading: "lazy" } : {})}
    />
  );
}

/* ── Live blocks ─────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => <p className="text-xs font-bold tracking-widest uppercase text-teal-600 mb-3">{children}</p>;
const Stars = ({ count = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
  </div>
);

/** Google reviews (live). */
export function SvcReviews({ label, heading, linkText }) {
  const g = useGoogleReviews();
  return (
    <section>
      {label && <SectionLabel>{label}</SectionLabel>}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{heading}</h2>
      <p className="text-sm text-slate-500 mb-6">
        {g.rating}★ on Google ·{" "}
        <a href={g.url} target="_blank" rel="noopener noreferrer" className="text-teal-700 font-semibold hover:underline">{linkText || "Read all reviews on Google"}</a>
      </p>
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
        {g.reviews.slice(0, 3).map((t, i) => (
          <div key={i} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <Stars count={t.rating} />
            <p className="text-slate-700 text-sm leading-relaxed">"{t.text}"</p>
            <div className="pt-1 border-t border-slate-200">
              <p className="font-bold text-slate-900 text-xs">{t.name}</p>
              <p className="text-slate-400 text-xs">Google review</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Our other services, with live "from" prices. */
export function SvcRelated({ label, heading }) {
  const ctx = useContext(ServiceContext);
  return (
    <section>
      {label && <SectionLabel>{label}</SectionLabel>}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">{heading}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {list(ctx.related).map((p) => {
          const price = fromPriceForPage(p.slug, list(ctx.services));
          return (
            <Link key={p.slug} to={servicePagePath(p.slug)} className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-teal-400 hover:shadow-md transition-all">
              <div className="aspect-[3/2] overflow-hidden bg-slate-100">
                <img
                  src={p.image(600)}
                  srcSet={`${p.image(400)} 400w, ${p.image(600)} 600w, ${p.image(900)} 900w`}
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                  alt={p.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <p className="font-bold text-slate-900 text-sm flex items-center justify-between gap-2">
                  {p.name}
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-600 transition-colors shrink-0" />
                </p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{p.blurb}</p>
                {price && <p className="text-teal-700 text-sm font-bold mt-2">{price}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** The page's price list (live), shown only when the booking system has options for it. */
export function SvcPriceList({ label, heading, text }) {
  const ctx = useContext(ServiceContext);
  const items = list(ctx.priceList);
  if (!items.length) return null;
  return (
    <section>
      {label && <SectionLabel>{label}</SectionLabel>}
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{heading}</h2>
      {text && <p className="text-sm text-slate-500 mb-5">{text}</p>}
      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
        {items.map((p) => (
          <div key={p._id || p.name} className="flex items-center justify-between gap-4 px-5 py-3.5 bg-white">
            <span className="text-sm font-semibold text-slate-800">{p.name}</span>
            <span className="text-right">
              <span className="block text-sm font-bold text-teal-700 whitespace-nowrap">{formatPrice(p)}</span>
              {priceNote(p.name) && <span className="block text-[11px] font-semibold text-slate-500">{priceNote(p.name)}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Before & after photos for this service (shown when we have some). */
export function SvcBeforeAfter({ title, limit }) {
  const ctx = useContext(ServiceContext);
  return <BeforeAfter slug={ctx.slug} title={title} limit={Number(limit) || 4} />;
}

/** Photos from our recent jobs for this service (shown when we have some). */
export function SvcOurWork({ title }) {
  const ctx = useContext(ServiceContext);
  return <OurWork slug={ctx.slug} {...(title ? { title } : {})} />;
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 py-5 text-left group" aria-expanded={open}>
        <span className="font-semibold text-slate-800 text-sm sm:text-base leading-snug group-hover:text-teal-700 transition-colors">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-teal-600" : ""}`} />
      </button>
      {/* Always in the HTML (hidden until opened) so search engines and AI tools can read the answer. */}
      <div className="pb-5" hidden={!open}>
        <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/** Questions and answers (open on click; also tells Google about them). */
export function SvcFaqs({ items, numbered }) {
  const faqs = list(items).filter((f) => f?.q);
  return (
    <div className="mt-4">
      {faqs.map((faq, i) => <FAQItem key={i} q={numbered === "yes" ? `${i + 1}. ${faq.q}` : faq.q} a={faq.a} />)}
    </div>
  );
}

/** One room of a checklist: the first few tasks, "View full checklist" shows the rest. */
export function SvcRoomCard({ label, room, image, alt, buttonLabel, buttonLink, shown, tasks }) {
  const { link } = useTokens();
  const [open, setOpen] = useState(false);
  const all = list(tasks).map(str);
  const first = all.slice(0, Number(shown) || 5);
  const rest = all.slice(Number(shown) || 5);
  const item = (task, i) => (
    <li key={i} className="flex gap-2.5 items-start">
      <Check size={14} className="text-teal-500 shrink-0 mt-0.5 stroke-[2.5]" />
      <span className="text-slate-600 text-sm leading-snug">{task}</span>
    </li>
  );
  return (
    <article className="flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
      {image && <img src={imageUrl(image)} alt={alt || ""} loading="lazy" width="1000" height="750" className="w-full aspect-[16/9] object-cover" />}
      <div className="flex flex-col grow p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {label && <p className="text-[11px] font-bold tracking-widest uppercase text-teal-600">{label}</p>}
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{room}</h3>
          </div>
          {buttonLabel && (
            <BlockLink href={link(buttonLink || "{book}")} className="shrink-0 px-3.5 py-2 rounded-lg bg-[#00B5A4] text-white text-xs font-bold hover:bg-teal-600 transition-colors">{buttonLabel}</BlockLink>
          )}
        </div>
        <ul className="space-y-2.5">{first.map(item)}</ul>
        {rest.length > 0 && (
          <>
            <ul className="space-y-2.5 mt-2.5" hidden={!open}>{rest.map(item)}</ul>
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-4 self-start inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline">
              {open ? "Show less" : "View full checklist"}
              <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

/* ── The page around the blocks ──────────────────────────────────── */
// `top`: blocks between the stats bar and the page body; `children`: the main column's blocks.
export function ServiceShell({ settings: s = {}, top, children }) {
  const { text: t, ctx, g } = useTokens();
  const phoneHref = `tel:${String(s.phone || "+447846726428").replace(/[^\d+]/g, "")}`;
  const heroImage = ctx.pageInfo ? ctx.pageInfo.image(1600) : null;
  return (
    <>
      <div className="bg-white min-h-screen pb-28 md:pb-0" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* ══ HERO ══ */}
        <div
          className="bg-primary bg-cover bg-center text-white pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-10 xl:px-16"
          style={heroImage ? { backgroundImage: `linear-gradient(rgba(6, 24, 20, 0.86), rgba(6, 24, 20, 0.78)), url(${heroImage})` } : undefined}
        >
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-x-2 gap-y-1  mt-2 text-xs text-slate-400 mb-8 tracking-wide">
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1"><HomeIcon size={12} /> Home</Link>
            <span>/</span>
            <Link to="/services" className="hover:text-white transition-colors">Services</Link>
            <span>/</span>
            <span className="text-slate-300" aria-current="page">{t(s.heading)}</span>
          </nav>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 items-end">
            <div className="md:col-span-2 space-y-5">
              {s.badge && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-widest uppercase">
                  <MapPin size={11} /> {t(s.badge)}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">{t(s.heading)}</h1>
              <p className="text-slate-300 text-base sm:text-lg font-normal leading-relaxed max-w-2xl">{t(s.tagline)}</p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}</div>
                  <span className="text-sm text-slate-300">
                    {g.rating} · <span className="text-white font-semibold">on Google</span>
                  </span>
                </div>
                {s.trustBold && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span className="text-sm text-slate-300"><span className="text-white font-semibold">{t(s.trustBold)}</span> {t(s.trustText)}</span>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-xl p-6 shadow-2xl shadow-black/30">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t(s.ctaLabel)}</p>
                {ctx.price && <p className="text-2xl font-bold text-slate-900 mb-1">{ctx.price}</p>}
                {ctx.priceNote && <p className="text-xs font-semibold text-teal-700 mb-1">{ctx.priceNote}</p>}
                <p className="text-xs text-slate-400 mb-5">{t(s.ctaNote)}</p>
                <Link to={ctx.bookingLink} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors">
                  {t(s.bookLabel)} <ArrowRight size={16} />
                </Link>
                <a href={ctx.quoteLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-lg border border-[#00B5A4] text-[#00B5A4] font-bold text-sm hover:bg-teal-50 transition-colors">
                  {t(s.quoteLabel)}
                </a>
                {s.showPhone === "yes" && (
                  <a href={phoneHref} className="flex items-center justify-center gap-2 w-full py-3 mt-3 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:border-teal-400 hover:text-teal-700 transition-colors">
                    <Phone size={14} /> {s.phone}
                  </a>
                )}
                {s.ctaFoot && <p className="text-center text-[11px] text-slate-400 mt-3">{t(s.ctaFoot)}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ══ STAT BAR ══ */}
        <div className="bg-[#0A1520] text-white">
          <div className="px-4 sm:px-6 lg:px-10 xl:px-16 py-4 flex flex-wrap gap-6 sm:gap-10 items-center">
            {list(s.stats).map((x, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold text-teal-400">{t(x.value)}</span>
                <span className="text-xs text-slate-400">{t(x.label)}</span>
              </div>
            ))}
          </div>
        </div>

        {top}

        {/* ══ PAGE BODY ══ */}
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16 py-10 sm:py-14">
          <div className="grid md:grid-cols-3 gap-10 md:gap-14 items-start">
            {children}

            {/* ── RIGHT: STICKY SIDEBAR (desktop only) ── */}
            <div className="hidden md:block">
              <div className="sticky top-28 space-y-5">
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-[#0F1C2E] px-6 pt-6 pb-5">
                    <p className="text-teal-400 text-xs font-bold tracking-widest uppercase mb-1">{t(s.sideLabel)}</p>
                    {ctx.price && <p className="text-2xl font-bold text-white mb-1">{ctx.price}</p>}
                    {ctx.priceNote && <p className="text-xs font-semibold text-teal-300">{ctx.priceNote}</p>}
                    <p className="text-slate-400 text-xs mt-1">{t(s.sideNote)}</p>
                  </div>
                  <div className="p-6 bg-white space-y-3">
                    <div className="space-y-2.5">
                      {list(s.sidePoints).map((x, i) => {
                        const C = SERVICE_ICONS[x.icon] || ShieldCheck;
                        return (
                          <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                            <span className="text-teal-500"><C size={15} /></span>
                            {t(x.text)}
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-2">
                      <Link to={ctx.bookingLink} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors">
                        {t(s.bookLabel)} <ArrowRight size={15} />
                      </Link>
                      <a href={ctx.quoteLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-lg border border-[#00B5A4] text-[#00B5A4] font-bold text-sm hover:bg-teal-50 transition-colors">
                        {t(s.quoteLabel)}
                      </a>
                      {s.showPhone === "yes" && (
                        <a href={phoneHref} className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:border-teal-400 hover:text-teal-700 transition-colors">
                          <Phone size={14} /> {s.phone}
                        </a>
                      )}
                    </div>
                    {s.sideFoot && <p className="text-center text-[11px] text-slate-400 pt-1">{t(s.sideFoot)}</p>}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(s.guaranteesTitle)}</p>
                  {list(s.guarantees).map((item, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <Check size={13} className="text-teal-500 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span className="text-slate-600 text-sm">{t(str(item))}</span>
                    </div>
                  ))}
                </div>

                {s.showAreas === "yes" && (
                  <div className="border border-slate-200 rounded-xl p-5 bg-white">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t(s.areasTitle)}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <div className="border border-slate-200 rounded-xl p-5 bg-white">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t(s.areasTitle)}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {AREAS.map((area) => (
                            <Link key={area.slug} to={`/locations/${area.slug}`} className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded hover:text-teal-700">
                              {area.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {s.showPhone === "yes" && (
          <a href={phoneHref} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-[#00B5A4] text-[#00B5A4] font-bold text-sm">
            <Phone size={15} /> {t(s.mobileCall || "Call")}
          </a>
        )}
        <Link to="/booking" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#00B5A4] text-white font-bold text-sm">
          {t(s.mobileBook || "Book Now")} <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}

/** The main column: the page's blocks (Puck's drop zone in the editor). */
export function MainColumn({ content }) {
  if (typeof content === "function") return createElement(content, { className: "md:col-span-2 space-y-0" });
  return <div className="md:col-span-2 space-y-0">{renderBlocks(list(content))}</div>;
}
export const renderServiceBlocks = (items) => <Fragment>{renderBlocks(list(items))}</Fragment>;

// eslint-disable-next-line react-refresh/only-export-components
export const SERVICE_BLOCKS = {
  SvcBox,
  SvcText,
  SvcIcon,
  SvcImg,
  SvcReviews,
  SvcRelated,
  SvcPriceList,
  SvcBeforeAfter,
  SvcOurWork,
  SvcFaqs,
  SvcRoomCard,
};
