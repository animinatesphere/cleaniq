// Services page blocks. The service list itself is live (names, prices and bullet points come from
// the booking system, Admin → Services); the editor sets each card's photo, label, icon and the
// fallback text used when a service has none.
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Truck, ShieldCheck } from "lucide-react";
import { useRegion } from "../context/RegionContext";
import { pathForLayoutKey } from "../utils/servicePages";
import { imageUrl } from "./blockUtils";
import { PickedIcon } from "./icons";
import { RichText } from "./BlockLink";

const list = (v) => (Array.isArray(v) ? v : []);
const str = (p) => (typeof p === "string" ? p : p?.text || "");

/* ── Page heading ────────────────────────────────────────────────── */
export function PageHeadingBlock({ heading, highlight, headingEnd, text, note }) {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-16 md:20">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-5xl font-black text-primary-dark mb-4 md:6 leading-tight md:leading-[1.1]">
          {heading}{highlight ? <> <span className="text-secondary">{highlight}</span></> : null}{headingEnd ? <> {headingEnd}</> : null}
        </motion.h1>
        {text && (
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-base md:text-xl text-slate-600 px-4">
            <RichText text={text} />
          </motion.p>
        )}
        {note && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/10 text-primary font-bold text-xs md:text-sm">
            <Truck size={16} /> {note}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Live service list ───────────────────────────────────────────── */
// Which card a booking-system service belongs to, from its name.
const layoutKey = (name) => {
  const n = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (n.includes("residential") || n.includes("domestic") || n.includes("home") || n.includes("house")) return "residential";
  if (n.includes("office") || n.includes("commercial") || n.includes("workspace") || n.includes("business")) return "commercial";
  if (n.includes("deep") || n.includes("thorough")) return "move";
  if (n.includes("airbnb") || n.includes("short") || n.includes("holiday")) return "airbnb";
  if (n.includes("tenancy") || n.includes("moveout") || n.includes("movein") || n.includes("moving")) return "tenancy";
  if (n.includes("construction") || n.includes("renovation") || n.includes("builders")) return "construction";
  if (n.includes("carpet") || n.includes("rug")) return "carpet";
  if (n.includes("oven") || n.includes("cooker")) return "oven";
  if (n.includes("general") || n.includes("regular")) return "general";
  return "residential";
};
// eslint-disable-next-line react-refresh/only-export-components
export const SERVICE_CARD_KEYS = [
  ["residential", "House / domestic cleaning"],
  ["commercial", "Office cleaning"],
  ["move", "Deep cleaning"],
  ["airbnb", "Airbnb cleaning"],
  ["tenancy", "End of tenancy cleaning"],
  ["construction", "Post-construction cleaning"],
  ["carpet", "Carpet cleaning"],
  ["oven", "Oven cleaning"],
  ["general", "General / regular cleaning"],
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } };

export function ServiceListBlock({ cards, bookLabel, commercialTitle, commercialTag, commercialText, commercialTypes, commercialPrice, commercialButton, commercialLink, commercialImage, commercialImageAlt, commercialIcon }) {
  const { region } = useRegion();
  // UK services built into the page HTML at build time (scripts/prerender.mjs), refreshed live.
  const builtIn = region.id === "UK" ? (typeof window !== "undefined" && window.__SERVICES__) || globalThis.__SERVICES__ || null : null;
  const [dbServices, setDbServices] = React.useState(builtIn || []);
  // Until real services arrive we show empty placeholder cards, never made-up names or prices.
  const [loaded, setLoaded] = React.useState(!!builtIn?.length);
  const firstRegion = React.useRef(region.id);

  React.useEffect(() => {
    if (region.id !== firstRegion.current) {
      firstRegion.current = region.id;
      setDbServices([]);
      setLoaded(false);
    }
    let active = true;
    fetch(`${import.meta.env.VITE_API_URL}/services?region=${region.id}&booking=1&t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => { if (active && Array.isArray(data)) setDbServices(data); })
      .catch((error) => console.error("Error fetching services:", error))
      .finally(() => active && setLoaded(true));
    return () => { active = false; };
  }, [region.id]);

  const byKey = Object.fromEntries(list(cards).map((c) => [c.key, c]));
  const commercialLinkTo = commercialLink || "/commercial-cleaning";

  const services = (() => {
    const dbCommercial = dbServices.find((s) => s.category === "Base" && layoutKey(s.name) === "commercial");
    const mapped = dbServices
      .filter((s) => s.category === "Base")
      .map((s) => {
        const key = layoutKey(s.name);
        const card = byKey[key] || {};
        return {
          id: key,
          title: s.name,
          dbName: s.name,
          tag: card.tag,
          icon: card.icon,
          image: card.image,
          imageAlt: card.imageAlt,
          features: s.bullets?.length ? s.bullets : list(card.features).map(str),
          description: s.description || card.text,
          pricing: s.rate ? `From ${region.symbol}${s.rate}${region.id === "UK" ? (s.type === "hourly" ? "/hr" : "") : ""}` : "",
          rawRate: s.rate ? parseFloat(s.rate) : Infinity,
        };
      })
      .filter((m) => m.id !== "commercial");
    // Commercial cleaning is quote-only: its card is always shown and asks for a quote. No other card
    // is invented: only services that really exist in the booking system appear.
    mapped.push({
      id: "commercial",
      title: commercialTitle,
      tag: commercialTag,
      icon: commercialIcon || "briefcase",
      image: commercialImage,
      imageAlt: commercialImageAlt,
      features: list(commercialTypes).map(str),
      description: commercialText,
      pricing: commercialPrice,
      rawRate: dbCommercial?.rate ? parseFloat(dbCommercial.rate) : Infinity,
      quoteOnly: true,
    });
    return mapped.sort((a, b) => a.rawRate - b.rawRate);
  })();

  const cardPath = (s) => (s.quoteOnly ? commercialLinkTo : pathForLayoutKey(s.id));

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="space-y-12 lg:space-y-24">
        {!loaded &&
          [0, 1, 2].map((i) => (
            <div key={`placeholder-${i}`} aria-hidden="true" className={`flex flex-col lg:flex-row gap-8 lg:gap-16 items-center p-5 md:p-12 rounded-[32px] md:rounded-[60px] glass animate-pulse ${i % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}>
              <div className="lg:w-1/2 w-full aspect-video md:aspect-4/3 rounded-[32px] md:rounded-[48px] bg-slate-200/70" />
              <div className="lg:w-1/2 w-full space-y-4">
                <div className="h-4 w-1/3 rounded-full bg-slate-200/70" />
                <div className="h-10 w-2/3 rounded-2xl bg-slate-200/70" />
                <div className="h-4 w-full rounded-full bg-slate-200/70" />
                <div className="h-4 w-5/6 rounded-full bg-slate-200/70" />
                <div className="h-12 w-40 rounded-full bg-slate-200/70" />
              </div>
            </div>
          ))}
        {loaded &&
          services.map((service, i) => (
            <motion.div
              key={service.id + i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`flex flex-col lg:flex-row gap-8 lg:gap-16 items-center p-5 md:p-12 rounded-[32px] md:rounded-[60px] glass overflow-hidden relative shadow-xl shadow-primary/5 ${cardPath(service) ? "cursor-pointer hover:shadow-2xl transition-shadow" : ""} ${i % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}
            >
              {/* The whole card opens the service page; Book Service sits above this link. */}
              {cardPath(service) && (
                <Link
                  to={cardPath(service)}
                  aria-label={service.quoteOnly ? `${service.title}: get a quote` : `${service.title}: see prices, what's included and reviews`}
                  className="absolute inset-0 z-10 rounded-[32px] md:rounded-[60px]"
                />
              )}
              <div className="lg:w-1/2 w-full aspect-video md:aspect-4/3 rounded-[32px] md:rounded-[48px] relative overflow-hidden group shadow-2xl">
                <img src={imageUrl(service.image)} alt={service.imageAlt || service.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" width="1200" height="675" loading="lazy" />
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-700" />
              </div>
              <div className="lg:w-1/2 space-y-6 md:8">
                <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-3xl bg-white flex items-center justify-center shadow-xl">
                  <PickedIcon name={service.icon || "home"} size={40} className="text-secondary w-8 h-8 md:w-10 md:h-10" />
                </motion.div>
                <div>
                  <div className="text-[10px] md:text-xs font-black text-secondary uppercase tracking-[0.3em] mb-2 md:3">{service.tag}</div>
                  <h2 className="text-2xl md:text-4xl font-bold text-primary-dark mb-4 md:6 tracking-tight">{service.title}.</h2>
                  <p className="text-slate-600 leading-relaxed mb-6 md:8 text-sm md:text-base font-medium">{service.description}</p>
                  <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:4 mb-8 md:10">
                    {service.features.map((f, j) => (
                      <motion.div key={j} variants={itemVariants} className="flex items-center gap-2 md:3 text-xs md:text-sm font-bold text-primary-dark">
                        <CheckCircle2 size={16} className="text-secondary shrink-0" />
                        {f}
                      </motion.div>
                    ))}
                  </motion.div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:6">
                    <Link
                      to={service.quoteOnly ? commercialLinkTo : `/booking?service=${encodeURIComponent(service.dbName)}`}
                      className="btn-primary w-full sm:w-auto text-center py-4 relative z-20"
                    >
                      {service.quoteOnly ? commercialButton || "Get a Quote" : bookLabel || "Book Service"}
                    </Link>
                    <span className="text-primary font-black text-xl md:text-2xl text-center">{service.pricing}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}

/* ── Green commitment banner with icons ──────────────────────────── */
export function CommitmentBannerBlock({ badge, heading, highlight, text, items }) {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <section className="mt-20 md:32 p-8 md:p-20 bg-primary rounded-[40px] md:rounded-[80px] text-white relative overflow-hidden shadow-2xl shadow-primary/20">
        <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-secondary/20 rounded-full blur-[100px] md:blur-[120px] -mb-32 -mr-32 md:-mb-48 md:-mr-48" />
        <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-white/5 rounded-full blur-[80px] -mt-24 -ml-24 md:-mt-32 md:-ml-32" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {badge && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 text-secondary font-black text-[10px] md:text-sm mb-6 md:8 border border-white/10 uppercase tracking-widest">
              <ShieldCheck size={16} className="md:w-5 md:h-5" /> {badge}
            </motion.div>
          )}
          <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xl md:text-5xl font-extrabold mb-4 md:8 leading-tight tracking-tight">
            {heading} {highlight && <><br className="hidden md:block" /><span className="text-secondary">{highlight}</span></>}
          </motion.h2>
          {text && (
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-sm md:text-xl text-white/70 mb-10 md:12 leading-relaxed font-medium px-4">
              {text}
            </motion.p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:8">
            {list(items).map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center gap-3 md:4 group">
                <div className="text-secondary transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12"><PickedIcon name={item.icon} size={28} /></div>
                <span className="font-bold text-[10px] md:text-sm uppercase tracking-[0.2em]">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const SERVICES_BLOCKS = {
  PageHeading: PageHeadingBlock,
  ServiceList: ServiceListBlock,
  CommitmentBanner: CommitmentBannerBlock,
};
