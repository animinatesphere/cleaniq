import { useState } from "react";
import { Helmet } from "react-helmet-async";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { useRegion } from "../context/RegionContext";
import {
  Upload,
  CheckCircle2,
  User,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  AlertCircle,
  PoundSterling,
  CalendarClock,
  Smartphone,
  Plus,
  ArrowRight,
  MapPin,
  Heart,
  GraduationCap,
  Baby,
  Briefcase,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import sprayPhoto from "../assets/join-cleaner-spray.webp";
import roomPhoto from "../assets/room-cleaning.jpg";
import bathroomPhoto from "../assets/toilet-cleaning.jpg";
import officePhoto from "../assets/office-clean.jpg";
import ovenPhoto from "../assets/oven-cleaning.jpg";
import { SERVICE_PAGES } from "../utils/servicePages";
import { AREAS } from "../utils/areas";

// What cleaners are paid per hour (before tax). Change here if the rate changes.
const HOURLY_RATE = 15;
const WEEKS_PER_MONTH = 52 / 12;
const MIN_HOURS = 5;
const MAX_HOURS = 40;

// Unsplash photo (free to use under the Unsplash License).
const WINDOW_PHOTO =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&h=760&q=70";

const unsplash = (id, w, h) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
const GLOVES_PHOTO = unsplash("1585421514738-01798e348b17", 800, 600);

// "A day on the job" gallery.
const WORK_PHOTOS = [
  { src: roomPhoto, label: "Homes", alt: "Cleaner tidying and cleaning a bedroom" },
  { src: ovenPhoto, label: "Kitchens & ovens", alt: "Cleaner cleaning an oven" },
  { src: bathroomPhoto, label: "Bathrooms", alt: "Cleaner cleaning a bathroom" },
  { src: officePhoto, label: "Offices", alt: "Cleaner cleaning an office" },
  { src: unsplash("1502672260266-1c1ef2d93688", 600, 450), label: "Rentals & Airbnbs", alt: "A bright, tidy rental flat living room" },
  { src: unsplash("1631889993959-41b4e9c6e3c5", 600, 450), label: "End of tenancy", alt: "A spotless bathroom ready for new tenants" },
];

// Who the cleaner job suits.
const SUITS = [
  { icon: <GraduationCap size={22} />, title: "Students", desc: "Pick up cleaning shifts around lectures and exams." },
  { icon: <Baby size={22} />, title: "Parents", desc: "Take cleaner jobs near you that fit around the school run." },
  { icon: <Briefcase size={22} />, title: "Experienced cleaners", desc: "Put your cleaning skills to work with a steady flow of jobs." },
  { icon: <Clock size={22} />, title: "Extra income", desc: "Add a few hours of cleaning a week alongside another job." },
];

const money = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

const BENEFITS = [
  {
    icon: <PoundSterling size={24} />,
    title: `£${HOURLY_RATE} an hour`,
    desc: "Clear hourly pay for every job you complete, before tax.",
  },
  {
    icon: <CalendarClock size={24} />,
    title: "Choose your hours",
    desc: "Work the days and times that suit you, from a few hours a week to full time.",
  },
  {
    icon: <Smartphone size={24} />,
    title: "Everything in one app",
    desc: "See your jobs, schedule and earnings in the Cleaniq worker app.",
  },
];

const STEPS = [
  { title: "Apply online", desc: "Fill in your details and upload your CV. It takes about two minutes." },
  { title: "We review your CV", desc: "Our team gets back to you within 24–72 hours." },
  { title: "Interview and checks", desc: "A face-to-face interview, background checks and a practical skills assessment." },
  { title: "Set up your profile", desc: "We send you login details for the worker app so you can complete your profile." },
  { title: "Start cleaning", desc: "Pick up jobs across Manchester and track your earnings in the app." },
];

const LOOKING_FOR = [
  "Reliable and on time for every booking",
  "Careful, thorough and proud of your work",
  "Friendly and respectful in customers' homes and workplaces",
  "The right to work in the UK",
  "Happy to have an interview and background checks",
];

// Google for Jobs listing (https://developers.google.com/search/docs/appearance/structured-data/job-posting)
function jobPostingJsonLd() {
  const today = new Date();
  const validThrough = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: "Cleaner (Domestic & Commercial)",
    description:
      `<p>Cleaniq Services is hiring cleaners across Manchester and Greater Manchester. Clean homes, offices, Airbnbs and end-of-tenancy properties, choose the hours that suit you, and manage your jobs in the Cleaniq worker app.</p><p>Pay: £${HOURLY_RATE} per hour before tax.</p><p>To apply, send your details and CV. We review every application within 24–72 hours. Successful applicants have an interview, background checks and a practical skills assessment.</p>`,
    datePosted: today.toISOString().slice(0, 10),
    validThrough: validThrough.toISOString().slice(0, 10),
    directApply: true,
    hiringOrganization: {
      "@type": "Organization",
      name: "Cleaniq Services",
      sameAs: "https://www.cleaniqservices.com",
      logo: "https://www.cleaniqservices.com/preview.jpg",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Manchester",
        addressRegion: "Greater Manchester",
        addressCountry: "GB",
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "GBP",
      value: { "@type": "QuantitativeValue", value: HOURLY_RATE, unitText: "HOUR" },
    },
  });
}

const FAQS = [
  {
    q: "What kind of cleaning jobs are there?",
    a: "Regular and one-off home cleaning, deep cleans, end-of-tenancy cleans, Airbnb and short-let turnovers, office cleaning and post-construction cleaning.",
  },
  {
    q: "How much can I earn?",
    a: `You're paid £${HOURLY_RATE} an hour before tax. Use the calculator at the top of the page to estimate your weekly and monthly earnings. What you actually earn depends on the hours and jobs you take on.`,
  },
  {
    q: "Where are the jobs?",
    a: "Across Manchester and Greater Manchester, including Manchester City Centre, Salford, Trafford, Stockport, Bolton, Bury, Oldham, Rochdale, Tameside and Wigan.",
  },
  {
    q: "Are there cleaner jobs near me?",
    a: `Most likely. We have cleaning jobs across Greater Manchester, including ${AREAS.map((a) => a.name).join(", ")}, and we try to give you jobs near where you live.`,
  },
  {
    q: "Can I work part-time?",
    a: "Yes. You choose your hours, from a few hours a week to full time, so cleaning can fit around study, family or another job.",
  },
  {
    q: "What do I need to apply?",
    a: "Your name, email, phone number and CV. If your CV is shortlisted, you'll have an interview, background checks and a practical skills assessment before your first job.",
  },
  {
    q: "How long until I hear back?",
    a: "We review every application and contact you within 24–72 hours.",
  },
  {
    q: "How do I manage my jobs?",
    a: "Once you're approved, you get login details for the Cleaniq worker app, where you can see your jobs, your schedule and what you've earned.",
  },
];

function EarningsCalculator() {
  const [hours, setHours] = useState(25);
  const weekly = hours * HOURLY_RATE;
  const monthly = weekly * WEEKS_PER_MONTH;
  const fill = ((hours - MIN_HOURS) / (MAX_HOURS - MIN_HOURS)) * 100;

  return (
    <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-2xl shadow-primary/10 border border-slate-100">
      <div className="flex items-baseline justify-between mb-4">
        <label htmlFor="hours" className="text-sm font-black text-primary-dark">
          Your availability
        </label>
        <p className="text-sm font-bold text-primary-dark">
          <span className="text-2xl font-black text-primary">{hours}</span> hrs per week
        </p>
      </div>
      <input
        id="hours"
        type="range"
        min={MIN_HOURS}
        max={MAX_HOURS}
        step={1}
        value={hours}
        onChange={(e) => setHours(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer accent-primary"
        style={{ background: `linear-gradient(to right, var(--color-primary, #0A5C43) ${fill}%, #e2e8f0 ${fill}%)` }}
        aria-valuetext={`${hours} hours per week`}
      />
      <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1.5">
        <span>{MIN_HOURS} hrs</span>
        <span>{MAX_HOURS} hrs</span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 p-4 rounded-2xl border-2 border-primary/15 bg-primary/[0.03]" aria-live="polite">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pay</p>
          <p className="text-xl md:text-2xl font-black text-primary-dark">
            £{HOURLY_RATE}
            <span className="text-xs font-bold text-slate-400">/hr</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per week</p>
          <p className="text-xl md:text-2xl font-black text-primary-dark">{money(weekly)}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per month</p>
          <p className="text-xl md:text-2xl font-black text-primary">{money(monthly)}</p>
        </div>
      </div>

      <a
        href="#apply"
        className="mt-6 btn-primary w-full py-4 text-base flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
      >
        Apply now <ArrowRight size={18} />
      </a>
      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
        Estimate before tax, based on £{HOURLY_RATE}/hr and 52 weeks a year. Actual earnings depend on the hours and
        jobs you take on.
      </p>
    </div>
  );
}

const Recruitment = () => {
  const { region } = useRegion();
  const isUK = region.id === "UK";
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cv: null,
  });

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      showNotification("Please enter your full name.");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      showNotification("Please enter a valid email address.");
      return;
    }
    if (!formData.phone.trim()) {
      showNotification("Please enter your phone number.");
      return;
    }
    if (!formData.cv) {
      showNotification("Please upload your CV.");
      return;
    }

    setIsSubmitting(true);

    const data = new FormData();
    data.append("cv", formData.cv);
    data.append("data", JSON.stringify({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      region: region.id,
      source: "Website",
    }));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recruitment`, {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        showNotification("Application failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showNotification("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-6 md:p-12 text-center rounded-4xl md:rounded-[48px] bg-slate-50 border border-slate-100 shadow-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20 rotate-3"
          >
            <CheckCircle2 size={40} />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-primary-dark mb-4 tracking-tighter">
            Application Sent!
          </h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            Thanks for your interest in joining Cleaniq Services. Our team will review your CV and be in touch shortly with next steps.
          </p>
          <Link to="/" className="btn-primary w-full py-5 text-lg shadow-xl shadow-primary/20">
            Return to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Cleaning Jobs in Manchester | Cleaner Jobs Near You | Cleaniq</title>
        <meta
          name="description"
          content={`Looking for cleaner jobs near you? Join Cleaniq's cleaners in Manchester and Greater Manchester. £${HOURLY_RATE}/hr, choose your hours, manage jobs in our app. Apply in two minutes.`}
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/recruitment" />
        <meta property="og:title" content="Cleaning Jobs in Manchester | Cleaner Jobs Near You | Cleaniq" />
        {isUK && <script type="application/ld+json">{jobPostingJsonLd()}</script>}
      </Helmet>

      {isSubmitting && <LoadingOverlay message="Sending your application..." />}

      {/* Hero: photos + earnings calculator */}
      <section className="bg-primary/[0.06] pt-36 md:pt-44 pb-16 md:pb-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_440px] gap-10 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-sm">
              Now hiring{isUK ? " in Manchester" : ""}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-primary-dark mb-6 tracking-tighter leading-[1.05]">
              {isUK ? "Find cleaning jobs in Manchester." : "Join our cleaning team."}
            </h1>
            <p className="text-lg text-slate-600 max-w-xl font-medium leading-relaxed mb-10">
              {isUK
                ? "Looking for cleaner jobs near you? Join our team of cleaners, clean homes and offices across Greater Manchester, choose the hours that suit you, and manage everything from our app."
                : "Join Nigeria's premier cleaning network. High pay, flexible hours, and professional growth."}
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              <img
                src={sprayPhoto}
                alt="Cleaner spraying and wiping a surface"
                className="w-full aspect-[5/6] object-cover rounded-3xl border border-white shadow-lg"
                width="640"
                height="760"
              />
              <img
                src={WINDOW_PHOTO}
                alt="Cleaner in gloves wiping down a window"
                className="w-full aspect-[5/6] object-cover rounded-3xl border border-white shadow-lg mt-8"
                width="640"
                height="760"
                loading="lazy"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {isUK ? (
              <EarningsCalculator />
            ) : (
              <a href="#apply" className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-2">
                Apply now <ArrowRight size={18} />
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* Why join */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-primary-dark text-center tracking-tighter mb-14">
            Why clean with Cleaniq?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="p-8 rounded-[32px] bg-slate-50 border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  {b.icon}
                </div>
                <h3 className="text-xl font-black text-primary-dark mb-3 tracking-tight">{b.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 px-6 bg-slate-50/60">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-primary-dark text-center tracking-tighter mb-14">
            How it works
          </h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                <span className="w-10 h-10 rounded-full bg-primary text-white font-black flex items-center justify-center mb-5">
                  {i + 1}
                </span>
                <h3 className="text-lg font-black text-primary-dark mb-2 tracking-tight">{s.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* A day on the job: photos */}
      {isUK && (
        <section className="py-20 md:py-28 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter mb-5">
                A day as a Cleaniq cleaner
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                No two days are the same. Our cleaners work in homes, kitchens, bathrooms, offices and rental properties
                across Manchester.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {WORK_PHOTOS.map((ph) => (
                <figure key={ph.label} className="relative rounded-[28px] overflow-hidden aspect-[4/3] group">
                  <img
                    src={ph.src}
                    alt={ph.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <figcaption className="absolute left-3 bottom-3 md:left-4 md:bottom-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-xs md:text-sm font-black text-primary-dark">
                    {ph.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Who the job suits */}
      {isUK && (
        <section className="py-20 md:py-28 px-6 bg-primary/[0.04]">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <img
              src={GLOVES_PHOTO}
              alt="Cleaner's gloved hands making a heart shape"
              loading="lazy"
              decoding="async"
              className="w-full aspect-[4/3] object-cover rounded-[40px] shadow-xl"
            />
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter mb-5">
                Flexible cleaner jobs that fit your life
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                Whether you want a few hours of cleaning a week or a full-time cleaner job near you, you choose when you
                work. Here's who our cleaning jobs suit best:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {SUITS.map((x) => (
                  <div key={x.title} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      {x.icon}
                    </div>
                    <h3 className="font-black text-primary-dark mb-1">{x.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{x.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Jobs across Greater Manchester (SEO + what the work is) */}
      {isUK && (
        <section className="py-20 md:py-28 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter mb-6">
                Cleaning jobs near you across Greater Manchester
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-4">
                Cleaniq Services looks after homes, rental properties and workplaces across Manchester. As a Cleaniq
                cleaner you'll take on a mix of jobs close to where you live, from regular weekly cleans for families to
                end-of-tenancy cleans that help tenants get their deposit back.
              </p>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                You'll see every job's address, time and details in the Cleaniq worker app before you start, so you
                always know what's next.
              </p>
            </div>

            <h3 className="text-xl font-black text-primary-dark mb-6">The work you'll do</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
              {SERVICE_PAGES.map((p) => (
                <div key={p.slug} className="rounded-3xl overflow-hidden bg-slate-50 border border-slate-100">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={p.image(600)}
                      alt={p.imageAlt}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h4 className="text-lg font-black text-primary-dark mb-1">{p.name}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{p.blurb}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
              <div className="p-8 md:p-10 rounded-[32px] bg-primary text-white">
                <h3 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                  <Heart size={24} className="text-secondary" /> What we look for in our cleaners
                </h3>
                <ul className="space-y-4">
                  {LOOKING_FOR.map((item) => (
                    <li key={item} className="flex gap-3 font-medium text-white/90">
                      <CheckCircle2 size={20} className="text-secondary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 md:p-10 rounded-[32px] bg-slate-50 border border-slate-100">
                <h3 className="text-2xl font-black text-primary-dark tracking-tight mb-3">Cleaner jobs near you</h3>
                <p className="text-slate-500 font-medium mb-6">Jobs are spread across Manchester and Greater Manchester, including:</p>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((a) => (
                    <span key={a.slug} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-100 text-sm font-bold text-primary-dark">
                      <MapPin size={13} className="text-primary" /> Cleaning jobs in {a.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Application form */}
      <section id="apply" className="py-20 md:py-28 px-6 scroll-mt-28">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter mb-4">Apply in two minutes</h2>
            <p className="text-lg text-slate-500 font-medium">Send us your details and CV and we'll be in touch.</p>
          </div>

          <div className="bg-slate-50 rounded-[32px] md:rounded-[48px] p-6 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                  <FileText size={24} />
                </div>
                <h3 className="text-2xl font-black text-primary-dark tracking-tight">Your Details.</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <User size={10} /> Full Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Mail size={10} /> Email Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Phone size={10} /> Phone Number
                </label>
                <input
                  required
                  type="tel"
                  placeholder={isUK ? "+44 7..." : "+234 8..."}
                  className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* CV Upload */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload CV</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setFormData({ ...formData, cv: e.target.files[0] })}
                  />
                  <div
                    className={`p-8 md:p-10 border-2 border-dashed rounded-4xl flex flex-col items-center justify-center gap-4 transition-all ${
                      formData.cv
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white group-hover:border-primary group-hover:bg-primary/5"
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${
                        formData.cv
                          ? "bg-white text-primary"
                          : "bg-slate-50 text-slate-300 group-hover:bg-white group-hover:text-primary"
                      }`}
                    >
                      {formData.cv ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                    </div>
                    <div className="text-center">
                      <p className="font-black text-primary-dark">
                        {formData.cv ? formData.cv.name : "Tap to upload your CV"}
                      </p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        PDF or Word Doc (Max 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex gap-4">
                <ShieldCheck className="text-primary shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  We'll review your CV and contact you within <strong>24–72 hours</strong>. If successful, we'll send you login details and ask you to complete your profile before your first job.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-5 text-base shadow-2xl shadow-primary/20 disabled:opacity-70"
              >
                Submit Application
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {isUK && (
        <section className="pb-24 md:pb-32 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-primary-dark text-center tracking-tighter mb-12">
              Questions from cleaners
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer"
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
      )}

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md"
          >
            <div
              className={`p-6 rounded-[32px] border-2 shadow-2xl flex items-center gap-4 bg-white ${
                notification.type === "error" ? "border-rose-100 text-rose-600" : "border-emerald-100 text-emerald-600"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  notification.type === "error" ? "bg-rose-50" : "bg-emerald-50"
                }`}
              >
                {notification.type === "error" ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{notification.type}</p>
                <p className="font-bold text-sm leading-tight">{notification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Recruitment;
