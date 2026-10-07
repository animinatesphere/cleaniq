import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Target,
  Eye,
  Award,
  Leaf,
  Heart,
  CheckCircle2,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  Truck,
  Star,
  MapPin,
  MessageCircle,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import GoogleReviewsSection from "../component/GoogleReviewsSection";
import { SERVICE_PAGES, servicePagePath } from "../utils/servicePages";
import { AREAS } from "../utils/areas";
import { whatsappLink } from "../utils/contact";
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT, GOOGLE_REVIEWS_URL } from "../utils/googleReviews";
import sprayPhoto from "../assets/join-cleaner-spray.webp";

const photoFor = (slug) => SERVICE_PAGES.find((p) => p.slug === slug);

const TRUST = [
  { value: `${GOOGLE_RATING}★`, label: `Google rating from ${GOOGLE_REVIEW_COUNT} reviews` },
  { value: "48hr", label: "Re-clean guarantee" },
  { value: String(AREAS.length), label: "Areas across Greater Manchester" },
  { value: String(SERVICE_PAGES.length), label: "Cleaning services" },
];

const WHY_US = [
  {
    icon: <ShieldCheck size={26} />,
    title: "Vetted cleaners",
    desc: "Every cleaner has a face-to-face interview, background checks and a practical skills assessment before their first job.",
  },
  {
    icon: <Sparkles size={26} />,
    title: "48-hour re-clean guarantee",
    desc: "If any part of the clean isn't up to standard, tell us within 48 hours and we'll send a cleaner back to re-clean it for free.",
  },
  {
    icon: <Truck size={26} />,
    title: "Your choice of supplies",
    desc: "Use your own products, or our cleaners bring eco-friendly cleaning products and equipment for £10 per visit.",
  },
  {
    icon: <CalendarCheck size={26} />,
    title: "Easy to book",
    desc: "Book a cleaner online, message us on WhatsApp or call us. We confirm your booking and send the details by email.",
  },
];

const VALUES = [
  {
    title: "Professionalism",
    desc: "We carry out every task with precision, dedication, and respect for our clients and their spaces.",
    icon: <Award size={26} />,
  },
  {
    title: "Integrity",
    desc: "We honour our word, act transparently, and ensure accountability in all we do.",
    icon: <ShieldCheck size={26} />,
  },
  {
    title: "Sustainability",
    desc: "We champion eco-friendly products and responsible methods that protect both people and the planet.",
    icon: <Leaf size={26} />,
  },
  {
    title: "Excellence",
    desc: "We hold ourselves to the highest standards, striving to exceed expectations every time.",
    icon: <CheckCircle2 size={26} />,
  },
  {
    title: "Trust",
    desc: "We earn lasting relationships through reliability, consistency, and genuine care for our clients.",
    icon: <Heart size={26} />,
  },
];

const FAQS = [
  {
    q: "Where are Cleaniq Services' cleaners based?",
    a: "Our cleaners are based across Manchester and Greater Manchester, so there's usually a local cleaner near you — from Manchester City Centre, Salford and Trafford to Stockport, Bolton and Wigan.",
  },
  {
    q: "Do you have cleaners near me?",
    a: `We cover ${AREAS.map((a) => a.name).join(", ")}. If you're nearby but not listed, message us on WhatsApp and we'll check.`,
  },
  {
    q: "What cleaning services do you offer?",
    a: `${SERVICE_PAGES.map((p) => p.name).join(", ")}. Each service has its own page with prices and what's included.`,
  },
  {
    q: "Are your cleaners vetted?",
    a: "Yes. Every cleaner has a face-to-face interview, background checks and a practical skills assessment before cleaning for our customers.",
  },
  {
    q: "What if I'm not happy with the cleaning?",
    a: "We offer a 48-hour re-clean guarantee. Tell us within 48 hours and we'll send a cleaner back to put it right, free of charge.",
  },
  {
    q: "How do I book a cleaner?",
    a: "Book online in a few steps, message us on WhatsApp (+44 7846 726428), or call +44 7846 726428. We confirm every booking by email.",
  },
];

const faqJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6 },
};

function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="text-center mx-auto max-w-3xl mb-12 md:mb-16">
      <p className="text-[11px] font-black text-primary uppercase tracking-[0.35em] mb-4">{eyebrow}</p>
      <h2 className="text-3xl md:text-5xl font-extrabold text-primary-dark tracking-tighter leading-[1.1] mb-5">{title}</h2>
      {children && <p className="text-lg text-slate-500 font-medium leading-relaxed">{children}</p>}
    </div>
  );
}

const About = () => {
  const quoteLink = whatsappLink("Hi Cleaniq! I'd like to book a cleaner.");
  const deep = photoFor("deep-cleaning-manchester");
  const airbnb = photoFor("airbnb-cleaning-manchester");

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <Helmet>
        <title>About Cleaniq | Trusted Cleaners in Manchester</title>
        <meta
          name="description"
          content="Cleaniq Services is a Manchester cleaning company with vetted local cleaners near you. House, office, end of tenancy, oven and carpet cleaning across Greater Manchester. 5.0★ on Google."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/about" />
        <meta property="og:title" content="About Cleaniq | Trusted Cleaners in Manchester" />
        <script type="application/ld+json">{faqJsonLd}</script>
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative pt-44 pb-16 md:pb-24 px-6 bg-gradient-to-b from-primary/[0.06] to-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-7 shadow-sm">
              <MapPin size={12} /> About Cleaniq Services
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary-dark tracking-tighter leading-[1.05] mb-7">
              Trusted cleaners in <span className="text-primary italic">Manchester.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-8 max-w-xl">
              Cleaniq Services is a Manchester cleaning company with vetted local cleaners near you — for homes,
              rentals, Airbnbs and offices across Greater Manchester.
            </p>

            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 mb-9 group"
            >
              <span className="flex text-secondary">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </span>
              <span className="text-sm font-bold text-primary-dark group-hover:underline">
                {GOOGLE_RATING} on Google · {GOOGLE_REVIEW_COUNT} reviews
              </span>
            </a>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/booking" className="btn-primary py-4 px-8 text-center flex items-center justify-center gap-2">
                Book a cleaner <ArrowRight size={18} />
              </Link>
              <a
                href={quoteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-4 px-8 rounded-2xl border-2 border-primary/20 text-primary font-bold hover:border-primary transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> WhatsApp us
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="grid grid-cols-2 gap-4 md:gap-5"
          >
            <img
              src={sprayPhoto}
              alt="Cleaniq cleaner wiping down a table"
              className="w-full h-full object-cover rounded-[32px] shadow-2xl shadow-primary/10 row-span-2"
              width="640"
              height="760"
            />
            <img
              src={deep.image(700)}
              alt={deep.imageAlt}
              className="w-full aspect-square object-cover rounded-[32px] shadow-xl"
              loading="lazy"
              decoding="async"
            />
            <img
              src={airbnb.image(700)}
              alt={airbnb.imageAlt}
              className="w-full aspect-square object-cover rounded-[32px] shadow-xl"
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────── */}
      <section className="px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {TRUST.map((t) => (
            <div key={t.label} className="p-6 md:p-7 rounded-[28px] bg-white border border-slate-100 shadow-lg shadow-primary/5 text-center">
              <p className="text-3xl md:text-4xl font-black text-primary tracking-tight">{t.value}</p>
              <p className="text-xs md:text-sm font-bold text-slate-500 mt-1.5">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Our story + mission/vision ───────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-20 items-start">
          <motion.div {...fadeUp}>
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.35em] mb-4">Our story</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary-dark tracking-tighter leading-[1.1] mb-8">
              Making cleanliness a lifestyle.
            </h2>
            <div className="space-y-5 text-lg text-slate-600 font-medium leading-relaxed">
              <p>
                Cleaniq Services is a premium cleaning company based in Manchester, United Kingdom, offering trusted,
                eco-friendly and efficient cleaning services for homes, offices and move-out spaces.
              </p>
              <p>
                We were founded with a simple mission: to make cleanliness a lifestyle. Our cleaners combine
                professionalism with environmental responsibility to deliver spotless results without compromise,
                using sustainable products and methods that protect both people and the environment.
              </p>
              <p>
                Whether you need a one-off deep clean, a regular house cleaner or ongoing office cleaning, every job is
                handled with precision, respect and reliability — so every space feels refreshed, organised and truly
                cared for.
              </p>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div {...fadeUp} className="p-8 md:p-10 rounded-[36px] bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center mb-6">
                <Target size={28} />
              </div>
              <h3 className="text-2xl font-black text-primary-dark mb-3 tracking-tight">Our mission</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                To provide exceptional, eco-conscious cleaning services that enhance the quality of living and working
                environments, grounded in professionalism, integrity, and trust.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="p-8 md:p-10 rounded-[36px] bg-primary text-white relative overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-secondary flex items-center justify-center mb-6">
                <Eye size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 tracking-tight">Our vision</h3>
              <p className="text-white/80 font-medium leading-relaxed">
                To establish Cleaniq Services as Manchester's most trusted and recognisable household name in
                eco-friendly cleaning, defined by innovation, reliability, and superior service.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 bg-slate-50/70">
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="What we clean" title="Cleaning services near you.">
            From regular house cleaning to end of tenancy, oven and carpet cleaning, our cleaners cover homes and
            businesses across Manchester.
          </SectionHeading>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_PAGES.map((p) => (
              <motion.div key={p.slug} {...fadeUp}>
                <Link
                  to={servicePagePath(p.slug)}
                  className="group block h-full rounded-[32px] overflow-hidden bg-white border border-slate-100 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={p.image(600)}
                      srcSet={`${p.image(400)} 400w, ${p.image(600)} 600w, ${p.image(900)} 900w`}
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                      alt={p.imageAlt}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black text-primary-dark mb-2 flex items-center justify-between gap-2">
                      {p.name}
                      <ArrowRight size={18} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{p.blurb}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose our cleaners ──────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="Our promise" title="Why choose our cleaners?">
            The Cleaniq standard: precision, care and sustainability on every clean.
          </SectionHeading>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((item) => (
              <motion.div key={item.title} {...fadeUp} className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-lg font-black text-primary-dark mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-[11px] font-black text-secondary uppercase tracking-[0.35em] mb-4">Values</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter leading-[1.1]">What our cleaners stand for.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {VALUES.map((v) => (
              <motion.div key={v.title} {...fadeUp} className="p-7 rounded-[28px] bg-white/[0.07] border border-white/10 backdrop-blur-sm">
                <div className="text-secondary mb-5">{v.icon}</div>
                <h3 className="text-lg font-black mb-2">{v.title}</h3>
                <p className="text-sm text-white/70 font-medium leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Areas: cleaners in <area> ────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeading eyebrow="Areas we cover" title="Cleaners near you across Greater Manchester.">
            Our local cleaners work across Manchester and the surrounding towns. Choose your area to see cleaning
            services near you.
          </SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {AREAS.map((a) => (
              <Link
                key={a.slug}
                to={`/locations/${a.slug}`}
                className="group flex items-center gap-3 p-4 md:p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-white hover:shadow-md transition-all"
              >
                <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </span>
                <span className="text-sm font-bold text-primary-dark leading-tight group-hover:text-primary">
                  Cleaners in {a.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────────────── */}
      <GoogleReviewsSection />

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <SectionHeading eyebrow="FAQ" title="About our cleaners." />
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group p-6 rounded-[28px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <summary className="list-none flex items-center justify-between gap-4 text-lg font-black text-primary-dark">
                  {faq.q}
                  <Plus className="text-primary group-open:rotate-45 transition-transform shrink-0" />
                </summary>
                <p className="mt-4 text-slate-500 font-medium leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA + contact ────────────────────────────────────────────── */}
      <section className="pb-24 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto rounded-[40px] md:rounded-[56px] bg-slate-900 text-white p-8 sm:p-12 md:p-16 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
          <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter leading-[1.1] mb-5">
                Looking for cleaners near you?
              </h2>
              <p className="text-lg text-white/70 font-medium leading-relaxed mb-8 max-w-xl">
                Book a vetted Cleaniq cleaner online in a few steps, or message us and we'll help you choose the right
                cleaning service.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/booking" className="btn-primary py-4 px-8 text-center flex items-center justify-center gap-2">
                  Book a clean <ArrowRight size={18} />
                </Link>
                <a
                  href={quoteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 px-8 rounded-2xl border-2 border-white/20 font-bold hover:border-white transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} /> WhatsApp us
                </a>
              </div>
            </div>
            <div className="space-y-5">
              <a href="tel:+447846726428" className="flex items-center gap-5 p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-secondary shrink-0">
                  <Phone size={22} />
                </span>
                <span>
                  <span className="block text-xs text-white/50 font-bold uppercase tracking-widest mb-1">Call us</span>
                  <span className="text-lg font-bold">+44 7846 726428</span>
                </span>
              </a>
              <a href="mailto:info@cleaniqservices.com" className="flex items-center gap-5 p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-secondary shrink-0">
                  <Mail size={22} />
                </span>
                <span>
                  <span className="block text-xs text-white/50 font-bold uppercase tracking-widest mb-1">Email us</span>
                  <span className="text-lg font-bold break-all">info@cleaniqservices.com</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
