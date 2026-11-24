// Location page blocks (/locations/<area>). Each area's page is a list of these blocks in
// src/content/locations/<area>.json, edited with drag and drop in /content-admin. "{area}" in any
// text is replaced with the area's name (e.g. "Cleaners in {area}" → "Cleaners in Salford").
import { useContext } from "react";
import { Link } from "react-router-dom";
import { MapPin, CheckCircle2, ArrowRight, Home as HomeIcon } from "lucide-react";
import { SERVICE_PAGES, servicePagePath } from "../utils/servicePages";
import { AREAS } from "../utils/areas";
import { useGoogleReviews } from "../utils/googleReviews";
import BeforeAfter from "../component/BeforeAfter";
import { BlockButton, RichText } from "./BlockLink";
import { imageUrl } from "./blockUtils";
import { PickedIcon } from "./icons";

import { AreaContext } from "./areaContext";

const list = (v) => (Array.isArray(v) ? v : []);
const str = (p) => (typeof p === "string" ? p : p?.text || "");

/** Replaces {area} (and {rating}) in the block's text. */
function useArea() {
  const area = useContext(AreaContext);
  const g = useGoogleReviews();
  // Text typed straight into the page in the editor arrives as an editable element: leave it as is.
  const t = (s) => (s != null && typeof s === "object" ? s : String(s ?? "").replaceAll("{area}", area.name).replaceAll("{rating}", g.rating));
  return { ...area, t };
}

// Every location block sits in the page's centred column, 48px apart.
const Box = ({ children, className = "" }) => <div className={`max-w-5xl mx-auto px-6 mb-12 ${className}`}>{children}</div>;

/* ── Breadcrumb + top banner ─────────────────────────────────────── */
export function AreaHeroBlock({ badge, heading, highlight, tagline, text, buttons, whyTitle, whyPoints }) {
  const { name, t } = useArea();
  return (
    <Box className="space-y-12">
      <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1"><HomeIcon size={12} /> Home</Link>
        <span>/</span>
        <span className="text-primary-dark">Locations</span>
        <span>/</span>
        <span className="text-slate-500 truncate max-w-[200px]">{name}</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-[48px] p-8 md:p-16 shadow-xl shadow-slate-100/50 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
        <div className="space-y-6 relative z-10 md:w-2/3">
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
              <MapPin size={14} /> {t(badge)}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold text-primary-dark tracking-tight leading-tight">
            {t(heading)}{highlight ? <> <span className="text-primary">{t(highlight)}</span></> : null}
          </h1>
          {tagline && <p className="text-sm md:text-base font-extrabold text-slate-500 uppercase tracking-wider">{t(tagline)}</p>}
          {text && <p className="text-slate-600 font-medium leading-relaxed"><RichText text={t(text)} /></p>}
          {list(buttons).length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              {list(buttons).map((b, i) => <BlockButton key={i} button={{ ...b, label: t(b.label), link: t(b.link) }} size="py-4 px-7 text-sm" />)}
            </div>
          )}
        </div>
        {list(whyPoints).length > 0 && (
          <div className="md:w-1/3 w-full bg-slate-50 p-6 rounded-3xl border border-slate-100 relative z-10 text-center">
            {whyTitle && <h3 className="text-sm font-black text-primary-dark uppercase tracking-widest mb-4">{t(whyTitle)}</h3>}
            <div className="space-y-3 text-left">
              {list(whyPoints).map((w, i) => (
                <div key={i} className="flex items-center gap-3"><PickedIcon name={w.icon} size={16} className="text-emerald-500" /><span className="text-xs font-bold text-slate-600">{t(w.text)}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Box>
  );
}

/* ── Photos + about the area + services, with the booking card beside ─ */
export function AreaAboutBlock({ image1, alt1, image2, alt2, image3, alt3, heading, paragraphs, image4, alt4, image5, alt5, servicesTitle, services, cardTitle, cardText, cardButton, helpLabel, phone }) {
  const { t } = useArea();
  return (
    <Box>
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="col-span-2 h-64 md:h-80 rounded-[32px] overflow-hidden group">
              <img src={imageUrl(image1)} alt={t(alt1)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="h-48 md:h-64 rounded-[24px] overflow-hidden group">
              <img src={imageUrl(image2)} alt={t(alt2)} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="h-48 md:h-64 rounded-[24px] overflow-hidden group">
              <img src={imageUrl(image3)} alt={t(alt3)} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-[36px] p-8 md:p-10 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-primary-dark">{t(heading)}</h2>
            {list(paragraphs).map((p, i) => <p key={i} className="text-slate-600 font-medium leading-relaxed"><RichText text={t(str(p))} /></p>)}
            {(image4 || image5) && (
              <div className="grid grid-cols-2 gap-4 my-8">
                {[[image4, alt4], [image5, alt5]].map(([img, alt], i) => img && (
                  <div key={i} className="h-40 rounded-2xl overflow-hidden group">
                    <img src={imageUrl(img)} alt={t(alt)} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            )}
            {list(services).length > 0 && (
              <>
                <div className="h-px bg-slate-100 w-full my-8" />
                <h3 className="text-lg font-bold text-primary-dark mb-4">{t(servicesTitle)}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {list(services).map((svc, i) => (
                    <div key={i} className="flex gap-3 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <CheckCircle2 size={18} className="text-primary shrink-0" />
                      <span className="text-primary-dark font-bold text-sm">{t(str(svc))}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="space-y-6 md:sticky md:top-32">
          <div className="bg-primary text-white rounded-[36px] p-8 shadow-xl shadow-primary/20 text-center space-y-6 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-white/10 rounded-full" />
            <div className="space-y-2 relative z-10">
              <h3 className="text-xl font-black">{t(cardTitle)}</h3>
              {cardText && <p className="text-xs text-white/80 font-bold uppercase tracking-wider">{t(cardText)}</p>}
            </div>
            <BlockButton button={cardButton ? { ...cardButton, label: t(cardButton.label) } : null} size="w-full py-4 text-primary text-sm relative z-10" />
          </div>
          {phone && (
            <div className="bg-white p-6 rounded-[36px] border border-slate-200 shadow-sm text-center">
              {helpLabel && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t(helpLabel)}</p>}
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-lg font-black text-primary-dark hover:text-primary transition-colors block">{phone}</a>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
}

/* ── Every service, with photos, linking to its page ─────────────── */
export function AreaServicesBlock({ heading, text, linkText }) {
  const { t } = useArea();
  return (
    <Box>
      <section>
        <h2 className="text-2xl md:text-4xl font-black text-primary-dark tracking-tight mb-3">{t(heading)}</h2>
        {text && <p className="text-slate-500 font-medium mb-8">{t(text)}</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICE_PAGES.map((p) => (
            <Link key={p.slug} to={servicePagePath(p.slug)} className="group block rounded-[28px] overflow-hidden bg-white border border-slate-100 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300">
              <div className="aspect-[3/2] overflow-hidden">
                <img src={p.image(600)} alt={p.imageAlt} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5 flex items-center justify-between gap-3">
                <span className="text-primary-dark font-black text-sm">{t(String(linkText || "{service} in {area}").replaceAll("{service}", p.name))}</span>
                <ArrowRight size={16} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Box>
  );
}

/* ── Local guide: popular services here + good to know ───────────── */
export function AreaGuideBlock({ popularTitle, popularText, popular, goodTitle, goodToKnow }) {
  const { name, t } = useArea();
  return (
    <Box>
      <section className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[36px] p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-black text-primary-dark tracking-tight mb-2">{t(popularTitle)}</h2>
          {popularText && <p className="text-slate-500 font-medium mb-6">{t(popularText)}</p>}
          <ul className="space-y-3">
            {list(popular).map((pop, i) => {
              const svc = SERVICE_PAGES.find((p) => p.slug === pop.slug);
              if (!svc) return null;
              return (
                <li key={i}>
                  <Link to={servicePagePath(pop.slug)} className="group flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-white hover:shadow-md transition-all">
                    <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"><CheckCircle2 size={18} /></span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-black text-primary-dark group-hover:text-primary">
                        {svc.name} in {name}
                        <ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <span className="block text-sm text-slate-500 font-medium leading-relaxed mt-1">{t(pop.why)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="lg:col-span-2 bg-primary text-white rounded-[36px] p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
          <h2 className="text-2xl font-black tracking-tight mb-6 relative">{t(goodTitle)}</h2>
          <ul className="space-y-4 relative">
            {list(goodToKnow).map((x, i) => (
              <li key={i} className="flex gap-3 text-sm text-white/85 font-medium leading-relaxed">
                <MapPin size={16} className="text-secondary shrink-0 mt-0.5" />
                <span>{t(str(x))}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Box>
  );
}

/* ── Homes here and what they need + tips + postcodes ────────────── */
export function AreaHomesBlock({ heading, text, tipsTitle, tips, postcodesLabel, postcodes }) {
  const { t } = useArea();
  return (
    <Box>
      <section className="bg-white border border-slate-200 rounded-[36px] p-8 md:p-10 shadow-sm">
        <h2 className="text-2xl md:text-3xl font-black text-primary-dark tracking-tight mb-4">{t(heading)}</h2>
        {text && <p className="text-slate-600 font-medium leading-relaxed max-w-4xl"><RichText text={t(text)} /></p>}
        {list(tips).length > 0 && (
          <>
            <h3 className="text-lg font-bold text-primary-dark mt-8 mb-4">{t(tipsTitle)}</h3>
            <ul className="grid gap-3 md:grid-cols-3">
              {list(tips).map((tip, i) => (
                <li key={i} className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-600">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>{t(str(tip))}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {list(postcodes).length > 0 && (
          <p className="text-sm text-slate-500 font-semibold mt-6">
            {t(postcodesLabel)} <span className="text-primary-dark">{list(postcodes).map(str).join(", ")}</span>
          </p>
        )}
      </section>
    </Box>
  );
}

/* ── Before & after photos (in the page column) ──────────────────── */
export function AreaBeforeAfterBlock({ title, limit }) {
  const { t } = useArea();
  return (
    <Box>
      <BeforeAfter {...(title ? { title: t(title) } : {})} limit={Number(limit) || 3} />
    </Box>
  );
}

/* ── Nearby neighbourhoods ───────────────────────────────────────── */
export function AreaNearbyBlock({ heading, text, prefix, places }) {
  const { t } = useArea();
  if (!list(places).length) return null;
  return (
    <Box>
      <section>
        <h2 className="text-2xl md:text-4xl font-black text-primary-dark tracking-tight mb-3">{t(heading)}</h2>
        {text && <p className="text-slate-500 font-medium mb-8">{t(text)}</p>}
        <div className="flex flex-wrap gap-3">
          {list(places).map((n, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-bold text-primary-dark">
              <MapPin size={14} className="text-primary" /> {t(prefix ?? "Cleaners in")} {str(n)}
            </span>
          ))}
        </div>
      </section>
    </Box>
  );
}

/* ── FAQs in a white card (also tells Google about them) ─────────── */
export function AreaFaqBlock({ label, heading, faqs }) {
  const { t } = useArea();
  const items = list(faqs).filter((f) => f?.q);
  return (
    <Box>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: t(f.q), acceptedAnswer: { "@type": "Answer", text: t(f.a).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replaceAll("**", "") } })),
        })}
      </script>
      <div className="bg-white border border-slate-100 rounded-[40px] p-8 md:p-12 shadow-sm">
        <div className="mb-8">
          {label && <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4">{t(label)}</div>}
          <h2 className="text-2xl md:text-3xl font-black text-primary-dark tracking-tight">{t(heading)}</h2>
        </div>
        <div className="space-y-4">
          {items.map((faq, i) => (
            <details key={i} className="group border border-slate-100 rounded-2xl overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors list-none">
                <span>{t(faq.q)}</span>
                <span className="text-primary font-black text-lg group-open:rotate-45 transition-transform shrink-0 ml-4">+</span>
              </summary>
              <div className="px-5 pb-5 text-slate-500 text-sm font-medium leading-relaxed border-t border-slate-100 pt-4"><RichText text={t(faq.a)} /></div>
            </details>
          ))}
        </div>
      </div>
    </Box>
  );
}

/* ── Links to the other area pages ───────────────────────────────── */
export function OtherAreasBlock({ heading, prefix }) {
  const { slug, t } = useArea();
  return (
    <Box>
      <section>
        <h2 className="text-2xl md:text-3xl font-black text-primary-dark tracking-tight mb-6">{t(heading)}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {AREAS.filter((a) => a.slug !== slug).map((a) => (
            <Link key={a.slug} to={`/locations/${a.slug}`} className="flex items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all text-sm font-bold text-primary-dark">
              <MapPin size={14} className="text-primary shrink-0" /> {t(prefix ?? "Cleaners in")} {a.name}
            </Link>
          ))}
        </div>
      </section>
    </Box>
  );
}


// eslint-disable-next-line react-refresh/only-export-components
export const LOCATION_BLOCKS = {
  AreaHero: AreaHeroBlock,
  AreaAbout: AreaAboutBlock,
  AreaServices: AreaServicesBlock,
  AreaGuide: AreaGuideBlock,
  AreaHomes: AreaHomesBlock,
  AreaBeforeAfter: AreaBeforeAfterBlock,
  AreaNearby: AreaNearbyBlock,
  AreaFaq: AreaFaqBlock,
  OtherAreas: OtherAreasBlock,
};
