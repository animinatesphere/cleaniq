import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useRegion } from "../context/RegionContext";
import { Helmet } from "react-helmet-async";
import air1 from "../assets/josue-michel-FhsFUo-Wfc0-unsplash.jpg";
import air2 from "../assets/vitaly-gariev-2NcTLdFHpH8-unsplash.jpg";
import residentialImg from "../assets/residential.jpg";
import officeImg from "../assets/office.jpg";
import deepcleanImg from "../assets/anton-y-bjqTUUw2Q-unsplash.jpg";
import airbnbImg from "../assets/airbnb.jpg";
import bento1 from "../assets/bento1.jpg";
import bento2 from "../assets/bento2.jpg";
import bento3 from "../assets/bento3.jpg";
import bento4 from "../assets/bento4.jpg";
import strip1 from "../assets/strip1.jpg";
import strip2 from "../assets/strip2.jpg";
import strip3 from "../assets/strip3.jpg";
import strip4 from "../assets/strip4.jpg";
import strip5 from "../assets/strip5.jpg";
import grid1 from "../assets/grid1.jpg";
import grid2 from "../assets/grid2.jpg";
import grid3 from "../assets/grid3.jpg";
import {
  CheckCircle2,
  Star,
  ShieldCheck,
  Clock,
  Home as HomeIcon,
  Briefcase,
  ArrowRight,
  Users,
  Heart,
  Zap,
  Plus,
  ChevronDown,
} from "lucide-react";

const Home = () => {
  const { region } = useRegion();
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    { src: strip1, label: "Living Room" },
    { src: strip2, label: "Kitchen" },
    { src: strip3, label: "Bathroom" },
    { src: strip4, label: "Office" },
    { src: strip5, label: "Bedroom" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="overflow-x-hidden bg-white">
      <Helmet>
        <title>
          Professional Cleaning Services in Manchester | Domestic, Office &
          Airbnb Cleaning
        </title>
        <meta
          name="description"
          content="Premium eco-friendly cleaning services in Manchester — end of tenancy, deep cleaning, Airbnb turnovers, office and post-construction cleaning. Book online in 60 seconds."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/" />
        <meta
          property="og:title"
          content={
            "Professional Cleaning Services in Manchester | Domestic, Office & Airbnb Cleaning"
          }
        />
        <meta
          property="og:description"
          content="Reliable, eco-conscious cleaning for homes and offices in Manchester. Background checked professionals and satisfaction guaranteed."
        />
        <meta
          property="og:image"
          content="https://www.cleaniqservices.com/preview.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How do you vet your cleaners?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Every cleaner undergoes a rigorous multi-stage vetting process, including face-to-face interviews, background checks, and practical skills assessments.",
              },
            },
            {
              "@type": "Question",
              name: "What if I'm not satisfied with the clean?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "We offer a 48-hour satisfaction guarantee. If any part of the clean isn't up to our high standards, we'll send someone back to re-clean for free.",
              },
            },
            {
              "@type": "Question",
              name: "Do I need to provide cleaning supplies?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Most clients prefer us to use their own supplies, but we're happy to provide eco-friendly cleaning products for a small additional fee.",
              },
            },
          ],
        })}
      </script>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-l-[150px] hidden lg:block" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white shadow-xl shadow-primary/5 text-primary font-black text-[10px] md:text-sm mb-8 border border-primary/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              {region.id === "UK"
                ? "TOP-RATED CLEANERS IN MANCHESTER"
                : "EXCEPTIONAL CLEANING IN LAGOS & ABUJA"}
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-primary-dark leading-[1.1] mb-8 tracking-tighter">
              {region.id === "UK"
                ? "Best Professional House Cleaning in"
                : "Top-Rated Home & Office Cleaning in"}
              <br />
              <span className="text-primary bg-clip-text">
                {region.id === "UK" ? "Manchester" : "Lagos & Abuja"}
              </span>
              .
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-lg leading-relaxed font-medium">
              We provide the most reliable{" "}
              {region.id === "UK"
                ? "housekeeping and domestic services"
                : "professional maid and janitorial services"}
              . Whether you need a regular weekly clean or specialized Airbnb
              cleaning, our vetted pros handle the meticulous care of your
              space.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <Link
                to="/booking"
                className="btn-primary py-5 px-10 text-lg group"
              >
                Book in 60 Seconds
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-2 transition-transform"
                />
              </Link>
              <div className="flex items-center gap-3 px-6 py-4">
                <div className="flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Happy customer"
                      className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex text-secondary mb-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-primary-dark uppercase tracking-widest">
                    4.9/5 from 2k+ users.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative lg:block"
          >
            <div className="relative z-10 rounded-[60px] overflow-hidden shadow-2xl border-8 border-white bg-slate-100">
              <img
                src={air1}
                alt="Professional cleaning service"
                className="w-full h-[400px] lg:h-[600px] object-cover"
                fetchpriority="high"
                width="1200"
                height="800"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[32px] shadow-2xl shadow-primary/10 z-20 border border-slate-50 hidden md:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black text-primary-dark tracking-tighter">
                    100% Vetted
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Background checked
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">
              Our Services
            </h2>
            <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter mb-6">
              Tailored cleaning for{" "}
              {region.id === "UK"
                ? "Manchester living"
                : "Nigerian homes & offices"}
            </h3>
            <p className="text-lg text-slate-500 font-medium">
              Whether it's a{" "}
              {region.id === "UK"
                ? "weekly domestic clean"
                : "regular maintenance"}{" "}
              or a deep seasonal refresh, we have the right pros for you.
              {region.id === "NG" && (
                <span className="block mt-2 text-primary font-bold text-sm">
                  Proudly paying above the Nigerian living wage.
                </span>
              )}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Residential Cleaning",
                desc: "Reliable, weekly or bi-weekly cleaning for your home.",
                icon: <HomeIcon size={32} />,
                keyword: "Reliable domestic cleaners",
                image: residentialImg, // 👈 add this
              },
              {
                title: "Office Cleaning",
                desc: "Professional janitorial services for your workspace.",
                icon: <Briefcase size={32} />,
                keyword: "Expert office cleaning",
                image: officeImg, // 👈 add this
              },
              {
                title: "Deep Clean",
                desc: "Specialized deep cleaning services for a total refresh.",
                icon: <Zap size={32} />,
                keyword: "Deep cleaning",
                image: deepcleanImg, // 👈 add this
              },
              {
                title: "Airbnb Cleaning",
                desc: "Professional turnover services for your short-let rental.",
                icon: <Star size={32} />,
                keyword: "Short-let specialist",
                image: airbnbImg, // 👈 add this
              },
            ].map((service, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="rounded-[40px] bg-white border-2 border-slate-100 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all overflow-hidden"
              >
                {/* Colored top bar with image */}
                <div className="h-56 bg-primary/5 overflow-hidden relative">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                    width="600"
                    height="224"
                  />
                  {/* Icon badge floating over image */}
                  <div className="absolute bottom-4 left-4 w-12 h-12 rounded-2xl bg-white shadow-lg text-primary flex items-center justify-center">
                    {service.icon}
                  </div>
                </div>

                {/* Content below */}
                <div className="p-8">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                    {service.keyword}
                  </h4>
                  <h5 className="text-2xl font-black text-primary-dark mb-3 tracking-tight">
                    {service.title}
                  </h5>
                  <p className="text-slate-500 font-medium leading-relaxed text-sm mb-6">
                    {service.desc}
                  </p>
                  <Link
                    to="/booking"
                    className="inline-flex items-center gap-2 font-black text-primary hover:gap-4 transition-all"
                  >
                    Book Now <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Specialized Local Cleaning Pages for SEO Link Building */}
          <div className="mt-20 border-t border-slate-100 pt-16">
            <h4 className="text-[10px] font-black text-center text-slate-400 uppercase tracking-[0.3em] mb-8">
              Our Specialized Manchester Cleaning Hubs
            </h4>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                {
                  name: "End of Tenancy Cleaning",
                  path: "/pages/end-of-tenancy-cleaning-manchester",
                },
                {
                  name: "Deep Cleaning Services",
                  path: "/pages/deep-cleaning-manchester",
                },
                {
                  name: "Airbnb Turnovers",
                  path: "/pages/airbnb-cleaning-manchester",
                },
                {
                  name: "Commercial Office Cleaning",
                  path: "/pages/office-cleaning-manchester",
                },
                {
                  name: "Post-Construction Cleaning",
                  path: "/pages/post-construction-cleaning-manchester",
                },
              ].map((link, i) => (
                <Link
                  key={i}
                  to={link.path}
                  className="px-6 py-3.5 bg-slate-50 border border-slate-100 hover:border-primary/20 rounded-2xl text-xs font-black text-primary-dark hover:text-primary transition-all shadow-sm hover:shadow"
                >
                  {link.name} &rarr;
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="relative z-10 rounded-[48px] overflow-hidden shadow-2xl">
                <img
                  src={air2}
                  alt="Our Team"
                  className="w-full h-[500px] object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">
                Our Mission
              </h2>
              <h3 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-primary-dark tracking-tighter mb-8">
                Exceptional,{" "}
                <span className="text-primary italic">eco-conscious</span>{" "}
                cleaning.
              </h3>
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                Our mission is to provide exceptional, eco-conscious cleaning
                services that enhance the quality of living and working
                environments, grounded in professionalism, integrity, and trust.
                Based in Manchester, we've redefined what clean means through
                precision and sustainability.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 mb-10">
                <div className="flex-1 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-3xl font-black text-primary mb-1">500+</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Active Pros
                  </p>
                </div>
                <div className="flex-1 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-3xl font-black text-primary mb-1">98%</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Satisfaction Rate
                  </p>
                </div>
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 font-black text-primary hover:gap-4 transition-all"
              >
                Learn More About Us <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 md:py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">
            The Process
          </h2>
          <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark mb-16 md:mb-20 tracking-tighter">
            Reliable domestic cleaning in 3 simple steps.
          </h3>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="absolute top-1/4 left-0 w-full h-0.5 bg-slate-100 hidden md:block" />

            {[
              {
                step: "01",
                title: "Book Online",
                desc: "Choose your service and pick a time that suits you.",
              },
              {
                step: "02",
                title: "Pro Arrives",
                desc: "A background-checked professional arrives at your door.",
              },
              {
                step: "03",
                title: "Sparkling Clean",
                desc: "Relax and enjoy your perfectly cleaned living space.",
              },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-[30px] bg-white border-2 border-slate-50 shadow-xl flex items-center justify-center text-2xl font-black text-primary mb-8">
                  {step.step}
                </div>
                <h4 className="text-2xl font-black text-primary-dark mb-4">
                  {step.title}
                </h4>
                <p className="text-slate-500 font-medium max-w-[250px] mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* bento page */}
      {/*    
   <section className="py-24 bg-white"> */}
      {/* <div className="max-w-7xl mx-auto px-6"> */}
      {/* <div className="text-center mb-16">
      <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">Gallery</h2>
      <h3 className="text-2xl md:text-5xl font-extrabold text-primary-dark tracking-tighter">
        Clean spaces, happy faces.
      </h3>
    </div> */}

      {/* <div className="grid grid-cols-2 md:grid-cols-3 grid-rows-2 gap-4 h-[600px]"> */}
      {/* Big left image */}
      {/* <div className="col-span-1 row-span-2 rounded-[32px] overflow-hidden">
        <img src={bento1} alt="clean home" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
      </div> */}
      {/* Top middle */}
      {/* <div className="rounded-[32px] overflow-hidden">
        <img src={bento2} alt="clean kitchen" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
      </div> */}
      {/* Top right */}
      {/* <div className="rounded-[32px] overflow-hidden">
        <img src={bento3} alt="clean bathroom" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
      </div> */}
      {/* Bottom middle + right spanning */}
      {/* <div className="col-span-2 rounded-[32px] overflow-hidden">
        <img src={bento4} alt="clean office" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
      </div> */}
      {/* </div> */}
      {/* </div> */}
      {/* </section> */}
      {/* bento page */}

      {/* dkdk */}

      {/* FAQ Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">
              FAQ
            </h2>
            <h3 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter">
              Common questions.
            </h3>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How do you vet your cleaners?",
                a: "Every cleaner undergoes a rigorous multi-stage vetting process, including face-to-face interviews, background checks, and practical skills assessments.",
              },
              {
                q: "What if I'm not satisfied with the clean?",
                a: "We offer a 48-hour satisfaction guarantee. If any part of the clean isn't up to our high standards, we'll send someone back to re-clean for free.",
              },
              {
                q: "Do I need to provide cleaning supplies?",
                a: "Most clients prefer us to use their own supplies, but we`re happy eco-friendly cleaning products for a small additional fee.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer"
              >
                <summary className="list-none flex items-center justify-between text-lg font-black text-primary-dark">
                  {faq.q}
                  <Plus className="text-primary group-open:rotate-45 transition-transform" />
                </summary>
                <p className="mt-4 text-slate-500 font-medium leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
      {/* srtip page */}

      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">
            Our Work
          </h2>
          <h3 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter">
            Spaces we've transformed.
          </h3>
        </div>

        {/* Slideshow */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-[40px] overflow-hidden h-[500px]">
            {/* All images stacked, only active one visible */}
            {slides.map((item, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  i === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                {/* Label */}
                <div className="absolute bottom-8 left-8">
                  <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-1">
                    Now showing
                  </p>
                  <p className="text-3xl font-black text-white">{item.label}</p>
                </div>
              </div>
            ))}

            {/* Dot indicators */}
            <div className="absolute bottom-8 right-8 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i === activeSlide ? "w-8 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Join the Team Section */}
      <section className="py-24 bg-white border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[48px] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            <div className="max-w-2xl relative z-10">
              <h2 className="text-2xl md:text-5xl font-extrabold mb-6 tracking-tighter">
                Become a Cleaniq Services Pro.
              </h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed mb-8">
                {region.id === "UK"
                  ? "Are you a professional cleaner in Manchester? Join our platform today. We require all pros to have a valid DBS check for customer safety."
                  : "Join Nigeria's fastest growing cleaning agency. We're looking for dedicated professionals to join our elite team in Lagos and Abuja."}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-secondary">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="font-bold">
                    {region.id === "UK" ? "Apply Now" : "Apply Now"}
                  </p>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">
                    Application Requirement
                  </p>
                </div>
              </div>
            </div>
            <div className="relative z-10 w-full md:w-auto">
              <Link
                to="/recruitment"
                className="btn-secondary py-5 px-10 text-lg w-full md:w-auto flex items-center justify-center gap-3"
              >
                {region.id === "UK" ? "Apply Now" : "Apply Now"}
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* <section className="py-24 bg-white">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-16">
      <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Before & After</h2>
      <h3 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter">
        The Cleaniq difference.
      </h3>
    </div>


  </div>
</section> */}
      {/* CTA Section */}
      <section className="py-24 bg-secondary/10 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-2xl md:text-5xl lg:text-6xl font-extrabold text-primary-dark tracking-tighter mb-8">
            Ready to experience a cleaner home?
          </h2>
          <p className="text-xl text-slate-600 mb-12 font-medium">
            Join 2,000+ happy customers today.
          </p>
          <Link
            to="/booking"
            className="btn-primary py-6 px-12 text-xl shadow-2xl shadow-primary/30"
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* SEO Footer */}
      <section className="py-16 bg-white text-slate-400 border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Professional Cleaning Services
            </h4>
            <p className="text-sm leading-relaxed">
              <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm md:text-base font-medium">
                Cleaniq Services is your premier choice for high-quality{" "}
                {region.id === "UK"
                  ? "house cleaning and professional housekeeping"
                  : "residential and commercial cleaning"}{" "}
                across{" "}
                {region.id === "UK" ? "Greater Manchester" : "Lagos & Abuja"}.
                We specialize in deep cleaning, move-in/move-out services,
                Airbnb management cleaning, and office janitorial solutions.
              </p>
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Local Impact
            </h4>
            <p className="text-sm leading-relaxed text-slate-300 italic">
              Serving our local communities with reliability and care since
              2024.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
