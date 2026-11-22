// Extra SEO sections for service pages, in the same layout as the Airbnb page.
// Text lives in src/utils/serviceSeoContent.js; ServiceDetail.jsx places each part:
//   SeoTop (after the hero) · SeoMiddle (after "Why choose") · SeoLower (after the areas)
//   SeoQuote (before the FAQs) · SeoClosing (after the FAQ list)
import { Link } from "react-router-dom";
import { Check, Calendar, Phone, Star, BadgeCheck, Clock, ShieldCheck, Sparkles, MapPin, ArrowRight } from "lucide-react";

const LINK_CLS = "text-teal-700 font-semibold hover:underline";
const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

// Text with [label](/path) or [label](tel:…) links.
function Rich({ text, linkClass = LINK_CLS }) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    out.push(text.slice(last, m.index));
    const [, label, href] = m;
    out.push(
      href.startsWith("/") ? (
        <Link key={m.index} to={href} className={linkClass}>{label}</Link>
      ) : (
        <a key={m.index} href={href} className={linkClass}>{label}</a>
      ),
    );
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

const Label = ({ children }) => <p className="text-xs font-bold tracking-widest uppercase text-teal-600 mb-3">{children}</p>;
const Divider = () => <div className="border-t border-slate-200 my-8 md:my-10" />;
const H2 = ({ children, className = "" }) => <h2 className={`text-xl sm:text-2xl font-bold text-slate-900 ${className}`}>{children}</h2>;
const Para = ({ text }) => <p className="text-slate-600 leading-relaxed"><Rich text={text} /></p>;
const Tick = () => (
  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
    <Check size={13} className="stroke-[3]" />
  </span>
);

function Buttons({ bookingLink, onDark = false }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Link
        to={bookingLink}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm transition-colors ${onDark ? "bg-white text-teal-800 hover:bg-teal-50" : "bg-[#00B5A4] text-white hover:bg-teal-600"}`}
      >
        <Calendar size={16} /> Book now
      </Link>
      <a
        href="tel:+447846726428"
        className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border-2 font-bold text-sm transition-colors ${onDark ? "border-white/70 text-white hover:bg-white/10" : "border-[#00B5A4] text-teal-700 hover:bg-teal-50"}`}
      >
        <Phone size={16} /> Call now
      </a>
    </div>
  );
}

/** Intro banner and introduction, shown after the hero. */
export function SeoTop({ c, bookingLink }) {
  return (
    <section className="px-4 sm:px-6 lg:px-10 xl:px-16 pt-10 sm:pt-14 space-y-8">
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white p-6 sm:p-10 grid lg:grid-cols-5 gap-8 items-center">
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{c.banner.h2}</h2>
          <ul className="space-y-2.5">
            {c.banner.ticks.map((t) => (
              <li key={t} className="flex gap-3 items-center text-slate-700 font-medium"><Tick />{t}</li>
            ))}
          </ul>
          <div className="pt-2"><Buttons bookingLink={bookingLink} /></div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-[#0A1520] text-white p-5">
            <p className="text-sm text-slate-300 mb-2">Questions? Call us:</p>
            <a href="tel:+447846726428" className="flex items-center gap-2 text-2xl font-bold text-teal-400 hover:text-teal-300">
              <Phone size={20} /> 07846 726428
            </a>
            <p className="text-xs text-slate-400 mt-2">Mon–Fri 8am–6pm, Sat 9am–4pm</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500 mb-3">This is a service for:</p>
            <div className="flex flex-wrap gap-2">
              {c.banner.serviceFor.map((who) => (
                <span key={who} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-sm font-semibold">
                  <Check size={14} className="stroke-[3]" /> {who}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <p className="text-xs font-bold tracking-widest uppercase text-teal-600 mb-2">{c.intro.label}</p>
        <H2 className="mb-4">{c.intro.h2}</H2>
        <div className="space-y-4">
          {c.intro.paras.map((t) => <Para key={t} text={t} />)}
        </div>
      </div>
    </section>
  );
}

const BENEFIT_ICONS = [Clock, BadgeCheck, Star, ShieldCheck, Calendar, Sparkles];

/** How it works, benefits, types and the comparison: shown after "Why choose". */
export function SeoMiddle({ c }) {
  return (
    <>
      <Divider />
      <section>
        <Label>How It Works</Label>
        <H2 className="mb-4">{c.how.h2}</H2>
        <p className="text-slate-600 leading-relaxed mb-6">{c.how.intro}</p>
        <ol className="grid sm:grid-cols-2 gap-4">
          {c.how.steps.map((step, n) => (
            <li key={step.title} className="p-5 pt-6 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-full bg-[#00B5A4] text-white font-bold flex items-center justify-center shrink-0" aria-hidden="true">{n + 1}</span>
                <h3 className="font-bold text-slate-900">{step.title}</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <Divider />
      <section className="space-y-5">
        <Label>Benefits</Label>
        <H2>{c.benefits.h2}</H2>
        <p className="text-slate-600 leading-relaxed">{c.benefits.intro}</p>
        <ul className="grid sm:grid-cols-2 gap-4">
          {c.benefits.items.map((b, i) => {
            const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
            return (
              <li key={b.title} className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0"><Icon size={18} /></span>
                  <h3 className="font-bold text-slate-900">{b.title}</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{b.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <Divider />
      <section className="space-y-5">
        <Label>{c.types.label}</Label>
        <H2>{c.types.h2}</H2>
        <Para text={c.types.body} />
        <div className="flex flex-wrap gap-2">
          {c.types.chips.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-sm font-semibold">
              <Check size={14} className="stroke-[3]" /> {t}
            </span>
          ))}
        </div>
      </section>

      <Divider />
      <section className="space-y-5">
        <Label>{c.compare.label}</Label>
        <H2>{c.compare.h2}</H2>
        <p className="text-slate-600 leading-relaxed">{c.compare.intro}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {c.compare.cards.map((card) => (
            <div key={card.title} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed"><Rich text={card.body} /></p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const EXPERT_ICONS = [ShieldCheck, BadgeCheck, MapPin, Star];

/** Our cleaners, extra services, local areas and tips: shown after the areas list. */
export function SeoLower({ c, bookingLink }) {
  return (
    <>
      <Divider />
      <section className="space-y-5">
        <Label>{c.experts.label}</Label>
        <H2>{c.experts.h2}</H2>
        {c.experts.paras.map((t) => <Para key={t} text={t} />)}
        <ul className="grid sm:grid-cols-2 gap-3">
          {c.experts.points.map((pt, i) => {
            const Icon = EXPERT_ICONS[i % EXPERT_ICONS.length];
            return (
              <li key={pt} className="flex gap-3 items-center p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0"><Icon size={16} /></span>
                <span className="text-slate-700 text-sm font-medium leading-snug">{pt}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <Divider />
      <section className="space-y-5">
        <Label>Extra Services</Label>
        <H2>{c.combine.h2}</H2>
        <p className="text-slate-600 leading-relaxed">{c.combine.intro}</p>
        <ul className="grid sm:grid-cols-2 gap-3">
          {c.combine.links.map((x) => (
            <li key={x.to}>
              <Link to={x.to} className="block h-full p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 transition-colors">
                <span className="flex items-center gap-2 font-bold text-teal-700 mb-1">{x.name} <ArrowRight size={14} /></span>
                <span className="text-slate-600 text-sm leading-relaxed">{x.body}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Buttons bookingLink={bookingLink} />
      </section>

      <Divider />
      <section className="space-y-5">
        <Label>{c.local.label}</Label>
        <H2>{c.local.h2}</H2>
        {c.local.paras.map((t) => <Para key={t} text={t} />)}
      </section>

      <Divider />
      <section className="space-y-5">
        <Label>{c.tips.label}</Label>
        <H2>{c.tips.h2}</H2>
        <p className="text-slate-600 leading-relaxed">{c.tips.intro}</p>
        <ul className="space-y-3">
          {c.tips.tips.map((tip) => (
            <li key={tip} className="flex gap-3 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 text-sm font-medium leading-relaxed">
              <Tick />
              {tip}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/** "Get a quote" box, shown before the FAQs. */
export function SeoQuote({ c }) {
  return (
    <>
      <section className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white p-7 sm:p-9">
        <p className="text-xs font-bold tracking-widest uppercase text-teal-100 mb-2">Contact Us For a Free Quote</p>
        <h2 className="text-xl sm:text-2xl font-bold mb-3">{c.quote.h2}</h2>
        <p className="text-teal-50 leading-relaxed mb-6">{c.quote.body}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/get-a-quote" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white text-teal-800 font-bold text-sm hover:bg-teal-50 transition-colors">
            Get a free quote <ArrowRight size={16} />
          </Link>
          <a href="tel:+447846726428" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border-2 border-white/70 text-white font-bold text-sm hover:bg-white/10 transition-colors">
            <Phone size={16} /> 07846 726428
          </a>
        </div>
      </section>
      <Divider />
    </>
  );
}

/** Booking box, shown after the FAQ list. */
export function SeoClosing({ c, bookingLink }) {
  return (
    <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white">
      <h3 className="text-lg sm:text-xl font-bold mb-3">{c.closing.h2}</h3>
      <p className="text-teal-50 leading-relaxed mb-6">
        <Rich text={c.closing.body} linkClass="font-bold underline underline-offset-2 hover:text-white" />
      </p>
      <Buttons bookingLink={bookingLink} onDark />
    </div>
  );
}
