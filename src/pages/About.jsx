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
  Clock,
  Star,
  MapPin,
  MessageCircle,
  Plus,
  Home,
  RefreshCw,
  BadgePercent,
  Gem,
  Lightbulb,
} from "lucide-react";
import { Link } from "react-router-dom";
import GoogleReviewsSection from "../component/GoogleReviewsSection";
import { SERVICE_PAGES, servicePagePath } from "../utils/servicePages";
import { AREAS } from "../utils/areas";
import { whatsappLink } from "../utils/contact";
import { useGoogleReviews } from "../utils/googleReviews";
import cleanerAtWork from "../assets/our-work/about-cleaner.jpg";
import realBedroom from "../assets/our-work/airbnb-1.jpg";
import realLivingRoom from "../assets/our-work/regular-2.jpg";
import realEotKitchen from "../assets/our-work/end-of-tenancy-1.jpg";
import realRegularLiving from "../assets/our-work/regular-4.jpg";
import realGeneralKitchen from "../assets/service-general-photo-1200.webp";
import realAirbnbRoom from "../assets/our-work/airbnb-4.jpg";
import realOven from "../assets/our-work/oven-2.jpg";
import realFridge from "../assets/our-work/deep-card.jpg";

// Real photos from our jobs for the service cards; services without one keep their stock photo.
const REAL_SERVICE_PHOTOS = {
  "end-of-tenancy-cleaning-manchester": realEotKitchen,
  "deep-cleaning-manchester": realFridge,
  "airbnb-cleaning-manchester": realAirbnbRoom,
  "regular-house-cleaning-manchester": realRegularLiving,
  "general-cleaning-manchester": realGeneralKitchen,
  "oven-cleaning-manchester": realOven,
};

// Short, About-page-only descriptions for each service link (the Services page and service pages
// use their own wording), written around who each service helps and why they can trust us with it.
const ABOUT_SERVICE_TEXT = {
  "end-of-tenancy-cleaning-manchester":
    "Moving out? Our end of tenancy cleaners leave the property ready for checkout, so you can hand the keys back with confidence.",
  "deep-cleaning-manchester":
    "For homes that need more than a tidy-up. We get into the corners, appliances and built-up grime that everyday cleaning misses.",
  "airbnb-cleaning-manchester":
    "Hosts trust us to turn their short-lets around between guests, with fresh linen, clean bathrooms and five-star first impressions.",
  "office-cleaning-manchester":
    "Insured, vetted office cleaners who work around your hours, so your team walks into a clean, healthy workplace every morning.",
  "post-construction-cleaning-manchester":
    "After the builders leave, we clear the fine dust, paint splashes and film, so your new space is ready to move into or hand over.",
  "regular-house-cleaning-manchester":
    "The same trusted cleaner, weekly, fortnightly or monthly. Come home to a clean house without giving up your evenings.",
  "general-cleaning-manchester":
    "A thorough, whole-home clean whenever you need one: before guests arrive, after a busy month, or just because.",
  "oven-cleaning-manchester":
    "The job nobody wants. We take out the racks, cut through baked-on grease and leave your oven looking and smelling fresh.",
  "carpet-cleaning-manchester":
    "Carpets, stairs and upholstery cleaned deep down, lifting the dirt and marks that your vacuum leaves behind.",
};

// Short About-page descriptions for each area link (each location page has its own, fuller text).
const ABOUT_AREA_TEXT = {
  "manchester-city-centre": "Apartments and offices from Deansgate and Spinningfields to Ancoats and the Northern Quarter.",
  salford: "From Salford Quays apartments to family homes across the city of Salford.",
  trafford: "Homes and rentals in Sale, Altrincham, Stretford and Urmston.",
  stockport: "Houses and flats across Stockport, Cheadle and Bramhall.",
  didsbury: "Family homes and flats in East and West Didsbury.",
  chorlton: "Terraced houses and apartments around Chorlton.",
  bolton: "Homes and rental properties across Bolton, Horwich and Farnworth.",
  bury: "Houses in Bury, Ramsbottom, Radcliffe and Prestwich.",
  oldham: "Homes across Oldham, Chadderton and Saddleworth.",
  rochdale: "Homes in Rochdale, Heywood and Middleton.",
  tameside: "Homes in Ashton-under-Lyne, Hyde, Stalybridge and Denton.",
  wigan: "Homes and rentals in Wigan, Leigh and Hindley.",
};

// "Why you should trust us": the promises every customer gets.
const WHY_US = [
  {
    icon: <ShieldCheck size={26} />,
    title: "Vetted, DBS-checked cleaners",
    desc: "Every cleaner has a face-to-face interview, a DBS check, background checks and a practical skills assessment before they clean for a customer. If we wouldn't let them into our own homes, they don't join the team.",
  },
  {
    icon: <Home size={26} />,
    title: "We take care of your property",
    desc: "Your home, rental, Airbnb or office is treated with respect. Our fully insured cleaners work carefully around your belongings, follow your notes and tell you if they spot anything that needs your attention.",
  },
  {
    icon: <Clock size={26} />,
    title: "48-hour re-clean guarantee",
    desc: "Not happy with any part of your clean? Let us know within 48 hours and we'll put it right. No chasing, no arguments.",
  },
  {
    icon: <RefreshCw size={26} />,
    title: "Free re-clean",
    desc: "Re-cleans under our guarantee are completely free. We send a cleaner back to fix it, because the job isn't done until you're happy with it.",
  },
  {
    icon: <BadgePercent size={26} />,
    title: "Discount on your next clean",
    desc: "A few days after your clean, we email you an exclusive returning-customer offer: 10% off your next booking. It's our way of saying thanks for trusting us.",
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
    q: "Who are Cleaniq Services?",
    a: "We're a Manchester cleaning company based at 20 Swan St in Ancoats. Our vetted, DBS-checked and fully insured cleaners look after homes, rentals, Airbnbs and offices across Manchester and Greater Manchester.",
  },
  {
    q: "What makes Cleaniq Services different from other cleaning companies?",
    a: "Trust. Every cleaner is vetted, DBS-checked and fully insured, every clean follows a checklist, and every clean is backed by our free 48-hour re-clean guarantee. The photos on our website are from our own jobs, not stock images.",
  },
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
    a: "Yes. Every cleaner has a face-to-face interview, a DBS check, background checks and a practical skills assessment before cleaning for our customers.",
  },
  {
    q: "Are your cleaners DBS-checked and insured?",
    a: "Yes. Our cleaners are DBS-checked and fully insured, so you can trust them in your home, rental property or workplace.",
  },
  {
    q: "Do you offer a discount on my next clean?",
    a: "Yes. A few days after your clean, we email you a returning-customer offer of 10% off your next booking, valid for that week.",
  },
  {
    q: "What if I'm not happy with the cleaning?",
    a: "We offer a 48-hour re-clean guarantee. Tell us within 48 hours and we'll send a cleaner back to put it right, free of charge.",
  },
  {
    q: "Do I need to be home while the cleaner is there?",
    a: "No. Many customers leave a key or an entry code. Just add the access details when you book.",
  },
  {
    q: "Do your cleaners bring their own cleaning products?",
    a: "You choose. Use your own products, or our cleaners bring eco-friendly cleaning products and equipment for £10 per visit.",
  },
  {
    q: "Can I book a cleaner for my business?",
    a: "Yes. We clean offices, restaurants, gyms, communal areas and event spaces. Tell us about your premises on our commercial cleaning form and we'll send you a quote.",
  },
  {
    q: "Can I get a quote before I book?",
    a: "Yes. Use our free quote form, message us on WhatsApp or call +44 7846 726428, and we'll help you choose the right clean.",
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

// Tells Google this is our About page, about the business in the site-wide LocalBusiness data.
const aboutJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://www.cleaniqservices.com/about#webpage",
      url: "https://www.cleaniqservices.com/about",
      name: "About Cleaniq Services | Trusted Cleaners in Manchester",
      description: "Cleaniq Services is a Manchester cleaning company with vetted, DBS-checked and fully insured cleaners, backed by a free 48-hour re-clean guarantee.",
      about: { "@id": "https://www.cleaniqservices.com#localbusiness" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.cleaniqservices.com/" },
        { "@type": "ListItem", position: 2, name: "About", item: "https://www.cleaniqservices.com/about" },
      ],
    },
  ],
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
  const g = useGoogleReviews();
  const quoteLink = whatsappLink("Hi Cleaniq! I'd like to book a cleaner.");

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <Helmet>
        <title>About Cleaniq Services | Trusted Cleaners in Manchester</title>
        <meta
          name="description"
          content="Trusted cleaners in Manchester: vetted, DBS-checked and fully insured, with a free 48-hour re-clean guarantee. Homes, rentals, Airbnbs and offices."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/about" />
        <meta property="og:title" content="About Cleaniq Services | Trusted Cleaners in Manchester" />
        <script type="application/ld+json">{aboutJsonLd}</script>
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
            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-6 max-w-xl">
              Handing over the keys to your home or business to a cleaner is a big deal. We get it. That's why every
              Cleaniq Services cleaner is vetted, DBS-checked and fully insured, and why every clean comes with our free
              48-hour re-clean guarantee. Real people, genuine care and results you can see, for homes, rentals,
              Airbnbs, offices and businesses across Manchester and Greater Manchester.
            </p>
            <ul className="flex flex-wrap gap-2 mb-8">
              {["Vetted & DBS-checked", "Fully insured", "Free 48-hour re-clean"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-primary/15 text-primary-dark text-xs font-bold shadow-sm">
                  <CheckCircle2 size={14} className="text-primary" /> {t}
                </li>
              ))}
            </ul>

            <a
              href={g.url}
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
                {g.rating} on Google
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

          {/* Real photos from our jobs: our cleaner at work, plus rooms after a clean */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative grid grid-cols-2 gap-4 md:gap-5"
          >
            <figure className="relative row-span-2 rounded-[32px] overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src={cleanerAtWork}
                alt="Cleaniq Services cleaner in uniform cleaning an oven"
                className="w-full h-full object-cover"
                width="800"
                height="950"
              />
              <figcaption className="absolute bottom-3 left-3 right-3 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-sm text-xs font-bold text-primary-dark shadow-lg">
                Our team at work in Manchester
              </figcaption>
            </figure>
            <figure className="relative rounded-[32px] overflow-hidden shadow-xl">
              <img
                src={realBedroom}
                alt="Airbnb bedroom made up by Cleaniq Services"
                className="w-full aspect-square object-cover"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/55 text-white text-[10px] font-black uppercase tracking-widest">
                Airbnb turnover
              </figcaption>
            </figure>
            <figure className="relative rounded-[32px] overflow-hidden shadow-xl">
              <img
                src={realLivingRoom}
                alt="Living room after a clean by Cleaniq Services"
                className="w-full aspect-square object-cover"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/55 text-white text-[10px] font-black uppercase tracking-widest">
                Regular clean
              </figcaption>
            </figure>
            <span className="absolute -top-3 right-4 px-3 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
              Real photos from our jobs
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── Our story + mission/vision ───────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-20 items-start">
          <motion.div {...fadeUp}>
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.35em] mb-4">A Manchester cleaning company built on trust</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary-dark tracking-tighter leading-[1.1] mb-8">
              Making cleanliness a lifestyle.
            </h2>
            <div className="space-y-5 text-lg text-slate-600 font-medium leading-relaxed">
              <p>
                We started Cleaniq Services with one simple belief: you should be able to trust the people who clean
                your space. In cleaning, trust isn't a nice extra. It's everything. You're letting us into your home,
                your rental or your business, around the things that matter to you. So everything we do is about earning
                that trust, and then keeping it. We're a local team, based at 20 Swan St in Ancoats, and we clean right
                across Manchester and Greater Manchester.
              </p>
              <p>
                It starts with who we send. Our cleaners are vetted, DBS-checked and fully insured, and they bring
                precision cleaning and genuine care to every job. They notice the little things: the dust on the
                skirting boards behind the sofa, the limescale around the taps, the oven nobody else wants to touch. We
                don't rush and we don't cut corners. We look after your place the way we'd want our own looked after.
              </p>
              <p>
                Every customer is different, so every clean is too. Busy families book a{" "}
                <Link to="/service/regular-house-cleaning-manchester" className="font-bold text-primary hover:underline">regular house cleaner</Link>{" "}
                to get their evenings back. Tenants rely on our{" "}
                <Link to="/service/end-of-tenancy-cleaning-manchester" className="font-bold text-primary hover:underline">end of tenancy cleaning</Link>{" "}
                to hand the keys back with confidence. Airbnb hosts trust our{" "}
                <Link to="/service/airbnb-cleaning-manchester" className="font-bold text-primary hover:underline">turnover cleans</Link>{" "}
                to keep their reviews high, landlords book a{" "}
                <Link to="/service/deep-cleaning-manchester" className="font-bold text-primary hover:underline">deep clean</Link>{" "}
                between tenancies, and businesses count on our{" "}
                <Link to="/service/office-cleaning-manchester" className="font-bold text-primary hover:underline">office cleaning</Link>{" "}
                to make the right first impression.
              </p>
              <p>
                Whatever the job, you get the same standard: careful, thorough and backed by our free 48-hour re-clean
                guarantee. If we've missed something, just tell us and we'll come back and sort it. No fuss, no extra
                cost. That's how we're making cleanliness a lifestyle, one trusted clean at a time.
              </p>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div {...fadeUp} className="p-8 md:p-10 rounded-[36px] bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center mb-6">
                <Target size={28} />
              </div>
              <h3 className="text-2xl font-black text-primary-dark mb-3 tracking-tight">Our mission</h3>
              <p className="text-slate-600 font-medium leading-relaxed mb-5">
                To be the cleaning company Manchester trusts. We want every customer to hand us their keys without a second
                thought, and come home to a space that feels properly looked after.
              </p>
              <ul className="space-y-2.5">
                {[
                  { icon: <ShieldCheck size={18} />, t: "Trust", d: "Vetted, DBS-checked, insured cleaners you can rely on." },
                  { icon: <Gem size={18} />, t: "Quality", d: "Precision cleaning to a checklist, every single visit." },
                  { icon: <Heart size={18} />, t: "Care", d: "Respect for your home, your belongings and your time." },
                ].map((x) => (
                  <li key={x.t} className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">{x.icon}</span>
                    <span className="text-sm text-slate-600 font-medium leading-relaxed"><strong className="text-primary-dark">{x.t}:</strong> {x.d}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...fadeUp} className="p-8 md:p-10 rounded-[36px] bg-primary text-white relative overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-secondary flex items-center justify-center mb-6">
                <Eye size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 tracking-tight">Our vision</h3>
              <p className="text-white/80 font-medium leading-relaxed mb-5">
                To become Manchester's most trusted name in cleaning, with smarter, greener ways of working that our
                customers can rely on today, and the planet can rely on tomorrow.
              </p>
              <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-2.5 relative">
                {[
                  { icon: <Lightbulb size={16} />, t: "Innovation", d: "Online booking, an app and live prices." },
                  { icon: <Leaf size={16} />, t: "Eco-friendly products", d: "Safer for families, pets and the planet." },
                  { icon: <CheckCircle2 size={16} />, t: "Reliability", d: "On time, to the same standard, every visit." },
                  { icon: <RefreshCw size={16} />, t: "Sustainability", d: "Responsible methods that last." },
                  { icon: <ShieldCheck size={16} />, t: "Trust", d: "Earned on every clean, never assumed." },
                ].map((x) => (
                  <li key={x.t} className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-white/10 text-secondary flex items-center justify-center shrink-0">{x.icon}</span>
                    <span className="text-sm text-white/80 font-medium leading-snug"><strong className="text-white">{x.t}:</strong> {x.d}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 bg-slate-50/70">
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="What we clean" title="Cleaning services in Manchester, done with care.">
            Whatever you need cleaning, the same trusted team and the same standards come with it. Here's how we help
            homeowners, tenants, landlords, hosts and businesses across Manchester.
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
                      {...(REAL_SERVICE_PHOTOS[p.slug]
                        ? { src: REAL_SERVICE_PHOTOS[p.slug], alt: `${p.name} by Cleaniq Services: photo from one of our jobs` }
                        : {
                            src: p.image(600),
                            srcSet: `${p.image(400)} 400w, ${p.image(600)} 600w, ${p.image(900)} 900w`,
                            sizes: "(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw",
                            alt: p.imageAlt,
                          })}
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
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{ABOUT_SERVICE_TEXT[p.slug] || p.blurb}</p>
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
          <SectionHeading eyebrow="Why trust Cleaniq" title="Why you can trust our cleaners in Manchester.">
            Anyone can say they're trustworthy. We'd rather show you. Here's what every Cleaniq Services customer gets,
            every single time.
          </SectionHeading>
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-6">
            {WHY_US.map((item) => (
              <motion.div key={item.title} {...fadeUp} className={`p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-shadow lg:col-span-2 ${WHY_US.indexOf(item) === 3 ? "lg:col-start-2" : ""}`}>
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

      {/* ── Areas: a local team near you ─────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 bg-slate-50/70">
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="Local to you" title="A local cleaning team across Greater Manchester.">
            We're based in Ancoats, and our cleaners live and work across Manchester and the surrounding towns. Find
            your area to see the cleaners and services near you.
          </SectionHeading>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {AREAS.map((a) => (
              <Link
                key={a.slug}
                to={`/locations/${a.slug}`}
                className="group flex gap-4 p-5 md:p-6 rounded-[24px] bg-white border border-slate-100 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  <MapPin size={18} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-base font-black text-primary-dark group-hover:text-primary">
                    Cleaners in {a.name}
                    <ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                  </span>
                  {ABOUT_AREA_TEXT[a.slug] && (
                    <span className="block text-sm text-slate-500 font-medium leading-relaxed mt-1">{ABOUT_AREA_TEXT[a.slug]}</span>
                  )}
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
