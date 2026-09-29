import React from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useRegion } from "../context/RegionContext";
import GoogleReviewsSection from "../component/GoogleReviewsSection";
import { SERVICE_PAGES, servicePagePath } from "../utils/servicePages";
import { AREAS } from "../utils/areas";
import sprayPhoto from "../assets/join-cleaner-spray.webp";

const photoFor = (slug) => SERVICE_PAGES.find((p) => p.slug === slug);

const HOW_WE_WORK = [
  {
    icon: <ShieldCheck size={28} />,
    title: "Vetted cleaners",
    desc: "Every cleaner has a face-to-face interview, background checks and a practical skills assessment before their first job.",
  },
  {
    icon: <Sparkles size={28} />,
    title: "48-hour re-clean guarantee",
    desc: "If any part of the clean isn't up to standard, tell us within 48 hours and we'll send someone back to re-clean it for free.",
  },
  {
    icon: <Truck size={28} />,
    title: "Your choice of supplies",
    desc: "Use your own products, or we'll bring eco-friendly cleaning products and equipment for £10 per visit.",
  },
  {
    icon: <CalendarCheck size={28} />,
    title: "Easy to book",
    desc: "Book online, message us on WhatsApp or call us. We confirm your booking and send the details by email.",
  },
];

const About = () => {
  // eslint-disable-next-line no-unused-vars
  const { region } = useRegion();

  return (
    <div className="pt-32 pb-20 bg-white min-h-screen overflow-x-hidde mt-12">
      <Helmet>
        <title>About Us | Cleaniq Services Manchester</title>
        <meta
          name="description"
          content="Cleaniq Services is an eco-friendly cleaning company in Manchester. Vetted cleaners, a 48-hour re-clean guarantee and 5.0★ on Google. Homes, offices, Airbnbs and end of tenancy."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/about" />
        <meta
          property="og:title"
          content={"About Us | Cleaniq Services Manchester"}
        />
      </Helmet>
      {/* Hero Section */}
      <section className="relative px-6 mb-24">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8"
          >
            About Us
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary-dark mb-8 md:mb-10 tracking-tighter leading-[1.1]"
          >
            A premium cleaning <br />
            <span className="text-primary italic text-5xl sm:text-6xl md:text-8xl">
              lifestyle.
            </span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed font-medium space-y-6"
          >
            <p>
              Cleaniq Services is a premium cleaning solutions company based in
              Manchester, United Kingdom, offering trusted, eco-friendly, and
              efficient cleaning services for homes, offices, and move-out
              spaces.
            </p>
            <p>
              Founded with a simple mission to make cleanliness a lifestyle,
              Cleaniq Services combines professionalism with environmental responsibility
              to deliver spotless results without compromise. Our commitment to
              excellence is matched by our use of sustainable products and
              methods designed to protect both people and the environment.
            </p>
            <p>
              Every client engagement is handled with precision, respect, and
              reliability. Be it a one-time deep clean, regular home care, or
              ongoing office maintenance, Cleaniq Services makes every space feel
              refreshed, organized, and truly cared for.
            </p>
          </motion.div>

          <div className="mt-14 md:mt-20 grid grid-cols-3 gap-3 md:gap-6 max-w-6xl mx-auto">
            {[
              { src: sprayPhoto, alt: "Cleaniq cleaner wiping down a table" },
              { src: photoFor("deep-cleaning-manchester").image(800), alt: photoFor("deep-cleaning-manchester").imageAlt },
              { src: photoFor("airbnb-cleaning-manchester").image(800), alt: photoFor("airbnb-cleaning-manchester").imageAlt },
            ].map((p, i) => (
              <img
                key={p.alt}
                src={p.src}
                alt={p.alt}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className={`w-full aspect-[4/5] object-cover rounded-3xl md:rounded-[40px] shadow-xl ${i === 1 ? "md:-translate-y-8" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-12 rounded-4xl md:rounded-[48px] shadow-xl border border-slate-100"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center mb-8">
              <Target size={32} />
            </div>
            <h2 className="text-2xl font-bold text-primary-dark mb-6 tracking-tight">
              Our Mission.
            </h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              Our mission is to provide exceptional, eco-conscious cleaning
              services that enhance the quality of living and working
              environments, grounded in professionalism, integrity, and trust.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-primary p-8 md:p-12 rounded-4xl md:rounded-[48px] shadow-xl text-white relative overflow-hidden"
          >
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mb-16 -mr-16" />
            <div className="w-16 h-16 rounded-2xl bg-white/10 text-secondary flex items-center justify-center mb-8">
              <Eye size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-6 tracking-tight">
              Our Vision.
            </h2>
            <p className="text-lg text-white/80 font-medium leading-relaxed">
              Our vision is to establish Cleaniq Services as Manchester’s most trusted
              and recognizable household name in eco-friendly cleaning, defined
              by innovation, reliability, and superior service.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What we clean */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">Services</h2>
            <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-5">
              What we clean.
            </h3>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              From regular home cleaning to end-of-tenancy, Airbnb turnovers and offices, across Manchester and
              Greater Manchester.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_PAGES.map((p) => (
              <Link
                key={p.slug}
                to={servicePagePath(p.slug)}
                className="group rounded-[32px] overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all"
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
                  <h4 className="text-xl font-black text-primary-dark mb-2 flex items-center justify-between gap-2">
                    {p.name}
                    <ArrowRight size={18} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{p.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">
              Values
            </h2>
            <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter">
              Our Core Values.
            </h3>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[
              {
                title: "Professionalism",
                desc: "We carry out every task with precision, dedication, and respect for our clients and their spaces.",
                icon: <Award />,
              },
              {
                title: "Integrity",
                desc: "We honour our word, act transparently, and ensure accountability in all we do.",
                icon: <ShieldCheck />,
              },
              {
                title: "Sustainability",
                desc: "We champion eco-friendly products and responsible methods that protect both people and the planet.",
                icon: <Leaf />,
              },
              {
                title: "Excellence",
                desc: "We hold ourselves to the highest standards, striving to exceed expectations every time.",
                icon: <CheckCircle2 />,
              },
              {
                title: "Trust",
                desc: "We earn lasting relationships through reliability, consistency, and genuine care for our clients.",
                icon: <Heart />,
              },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 md:p-8 rounded-3xl md:rounded-4xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group"
              >
                <div className="text-primary mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6">
                  {React.cloneElement(value.icon, { size: 32 })}
                </div>
                <h4 className="text-xl font-black text-primary-dark mb-4">
                  {value.title}.
                </h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {value.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">Our promise</h2>
            <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter">How we work.</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_WE_WORK.map((item) => (
              <div key={item.title} className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h4 className="text-lg font-black text-primary-dark mb-3">{item.title}</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantage & Standard */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 transform translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-2xl md:text-5xl font-extrabold mb-8 md:12 tracking-tighter">
              The Cleaniq Services Advantage?
            </h2>
            <div className="space-y-6">
              {[
                "Trained, vetted, and reliable cleaning professionals",
                "Flexible scheduling and customized service plans",
                "Eco-friendly, non-toxic cleaning products",
                "Excellent customer support and responsive service",
                "Proven commitment to quality and satisfaction",
              ].map((adv, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-primary" />
                  </div>
                  <span className="text-lg font-medium text-white/90">
                    {adv}.
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-6 md:p-12 rounded-4xl md:rounded-[60px] border border-white/20">
            <h2 className="text-2xl font-bold mb-8 tracking-tight">
              The Cleaniq Services Standard.
            </h2>
            <p className="text-xl text-white/80 leading-relaxed font-medium">
              We’ve redefined what clean means. At Cleaniq Services, every service
              upholds our standard of precision, care, and sustainability —
              ensuring your environment feels as good as it looks.
            </p>
          </div>
        </div>
      </section>

      {/* Where we clean */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">Areas</h2>
          <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-5">
            Where we clean.
          </h3>
          <p className="text-lg text-slate-500 font-medium mb-10">
            We clean homes and businesses across Manchester and Greater Manchester, including:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {AREAS.map((a) => (
              <Link
                key={a.slug}
                to={`/locations/${a.slug}`}
                className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-primary-dark hover:border-primary/30 hover:text-primary transition-all"
              >
                {a.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <GoogleReviewsSection />

      {/* Contact Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-slate-900 rounded-4xl md:rounded-[60px] p-6 sm:p-8 md:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-10 md:12 tracking-tighter">
                Get in Touch.
              </h2>
              <div className="space-y-8">
                {/* <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-secondary">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                      Office Location
                    </p>
                    <p className="text-lg font-bold">
                      20 Swan St, Manchester, M4 5JW
                    </p>
                  </div>
                </div> */}
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-secondary">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                      Call or WhatsApp
                    </p>
                    <a href="tel:+447752476368" className="text-lg font-bold hover:text-secondary transition-colors">
                      +44 7752 476368
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-secondary">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                      Email Us
                    </p>
                    <a href="mailto:info@cleaniqservices.com" className="text-lg font-bold hover:text-secondary transition-colors">
                      info@cleaniqservices.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
