import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Leaf,
  Clock,
  Users,
  ArrowRight,
  ChevronDown,
  // Star,
  CheckCircle,
  Calendar,
  // Heart,
  Home as HomeIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useRegion } from "../context/RegionContext";

const Home = () => {
  const { region } = useRegion();
  const [activeFaq, setActiveFaq] = useState(null);

  const services = [
    {
      title: "Residential Cleaning",
      desc: "Regular and deep-cleaning services designed to refresh homes and create a serene environment.",
      icon: <Users className="text-secondary" size={32} />,
    },
    {
      title: "Office & Commercial",
      desc: "Professional cleaning for offices and business spaces, maintaining hygiene and productivity.",
      icon: <ShieldCheck className="text-secondary" size={32} />,
    },
    {
      title: "Move-In / Move-Out",
      desc: "Detailed cleaning for relocations and end-of-tenancy needs, ensuring spaces are move-in ready.",
      icon: <Clock className="text-secondary" size={32} />,
    },
    {
      title: "Eco-Friendly Solutions",
      desc: "Use of sustainable, non-toxic products that protect both clients and the environment.",
      icon: <Leaf className="text-secondary" size={32} />,
    },
  ];

  const processSteps = [
    {
      title: "View Pricing",
      desc: "Get instant, transparent rates based on your specific home and needs.",
      icon: <Calendar className="text-white" size={24} />,
    },
    {
      title: "Book a Date",
      desc: "Select a convenient time that fits your schedule. Our team shows up on time.",
      icon: <Clock className="text-white" size={24} />,
    },
    {
      title: "Experience the Clean",
      desc: "Relax as our trained professionals handle everything with precision and care.",
      icon: <HomeIcon className="text-white" size={24} />,
    },
  ];

  const testimonials = [
    {
      name: "Nina H.",
      text: "They pay close attention to dust and pet hair, and the results are noticeable. I'm breathing better and living better.",
      rating: 5,
    },
    {
      name: "Alan R.",
      text: "As someone with mobility issues, cleaning became nearly impossible. Home Troops gave me my independence back. They're always respectful and thorough.",
      rating: 5,
    },
    {
      name: "Tina W.",
      text: "I was hesitant about hiring cleaners, but CLEANIQ made me feel comfortable from the first booking. They never miss a detail.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: "What is your satisfaction guarantee?",
      a: "If you're not completely satisfied with your clean, just notify us within 48 hours and we'll make it right. Your happiness is our priority.",
    },
    {
      q: "Do you bring your own supplies?",
      a: "Yes! We provide all eco-friendly cleaning products and equipment. You don't need to lift a finger or provide anything unless you have specific product requests.",
    },
    {
      q: "Are your cleaners vetted?",
      a: "Absolutely. All our cleaning professionals are fully vetted, background-checked, and extensively trained to maintain our high standards of quality and trust.",
    },
    {
      q: "Are your pet friendly?",
      a: "We are 100% pet-friendly! Just let us know if you have furry friends so we can make any necessary adjustments to our visit.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-28 bg-slate-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-l-[150px] hidden lg:block" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10 py-12 md:py-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white shadow-xl shadow-primary/5 text-primary font-black text-[10px] md:text-sm mb-8 border border-primary/5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              EXCEPTIONAL CLEANING IN{" "}
              {region.id === "UK" ? "UNITED KINGDOM" : "NIGERIA"}
            </motion.div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-primary-dark leading-[1.1] md:leading-[0.9] mb-8 tracking-tighter">
            Professional Cleaning in Manchester
              <br />
              <span className="text-secondary drop-shadow-sm">
                Feels Like Home.
              </span>
            </h1>
            <p className="text-base md:text-xl text-slate-600 mb-10 max-w-lg leading-relaxed font-medium">
              We take care of the cleaning, so you can spend your time on what
              matters most. Simple, reliable, and thorough care for your living
              space.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <Link
                to="/booking"
                className="btn-primary px-10 py-5 text-lg shadow-2xl shadow-primary/30"
              >
                Book Your Clean <ArrowRight size={20} />
              </Link>
              <Link
                to="/services"
                className="px-8 py-5 rounded-full border-2 border-primary/10 text-primary font-bold text-center hover:bg-white hover:border-primary transition-all shadow-sm"
              >
                Explore Services
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="rounded-[40px] md:rounded-[60px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,59,42,0.25)] relative group aspect-[4/5] lg:aspect-auto">
              <img
                src="https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8TW9kZXJuJTIwQ2xlYW4lMjBJbnRlcmlvcnxlbnwwfHwwfHx8MA%3D%3D"
                alt="Modern Premium Interior"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/40 to-transparent" />

              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-6 left-6 md:bottom-10 md:left-10 glass p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-2xl hidden sm:block border-white/50"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                    <ShieldCheck size={20} className="md:w-7 md:h-7" />
                  </div>
                  <div>
                    <div className="text-lg md:text-xl font-black text-primary-dark line-height-1">
                      48h Guarantee
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Satisfaction Assured
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 md:20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-6xl font-black text-primary-dark mb-4 md:6 tracking-tight"
            >
              The CLEANIQ <span className="text-secondary">Process</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-slate-600 font-medium px-4"
            >
              Premium service doesn't have to be complicated. We've streamlined
              everything for your convenience.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-10 md:gap-12 relative"
          >
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="text-center group"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[22px] md:rounded-[28px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 mx-auto mb-6 md:8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  {step.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-primary-dark mb-3 md:4">
                  {step.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed max-w-[260px] mx-auto text-sm md:text-base">
                  {step.desc}
                </p>
                {i < 2 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(33.33%*i+20%)] w-[20%] h-px bg-slate-100" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:16 gap-6 md:8">
            <div className="max-w-2xl">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl font-black text-primary-dark mb-4 md:6"
              >
                Curated Solutions for <br />
                <span className="text-secondary">Every Environment</span>
              </motion.h2>
              <p className="text-base md:text-lg text-slate-600 font-medium">
                Our services are built on the foundations of precision, health,
                and absolute reliability.
              </p>
            </div>
            <Link
              to="/services"
              className="text-primary font-black flex items-center gap-2 group border-b-2 border-primary/10 pb-1 text-sm md:text-base"
            >
              View Full Menu{" "}
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-2"
              />
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {services.map((service, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -12 }}
                className="p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-white hover:shadow-[0_40px_80px_-15px_rgba(0,59,42,0.1)] transition-all duration-500 border border-transparent hover:border-primary/5 cursor-default"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 md:8 group-hover:bg-primary transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-primary-dark mb-3 md:4 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Advantage Section */}
      <section className="section-padding bg-primary text-white overflow-hidden relative">
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-secondary/10 rounded-full blur-[100px] md:blur-[150px]" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 md:20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-6xl font-black mb-8 md:10 leading-[1.2] md:leading-[1.1] tracking-tight">
              Why Discerning Clients <br />
              <span className="text-secondary">Choose CLEANIQ</span>
            </h2>
            <div className="space-y-6 md:8">
              {[
                {
                  title: "Vetted Professionals",
                  desc: "Rigorous background checks and extensive training.",
                },
                {
                  title: "Customized Strategy",
                  desc: "Tailored cleaning plans that adapt to your lifestyle.",
                },
                {
                  title: "Eco-Safe Standards",
                  desc: "Non-toxic, premium products safe for pets and planet.",
                },
                {
                  title: "Elite Support",
                  desc: "Dedicated account management and swift response times.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 md:6 group"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-secondary group-hover:text-primary transition-all duration-300">
                    <CheckCircle size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg md:text-xl font-bold mb-1">
                      {item.title}
                    </h4>
                    <p className="text-white/60 font-medium text-sm md:text-base">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 md:gap-8 relative">
            <div className="space-y-3 md:space-y-8 pt-8 md:pt-12">
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=600"
                alt="Elite Standards"
                className="aspect-[4/5] rounded-[32px] md:rounded-[40px] object-cover shadow-2xl border border-white/5 transition-transform duration-700 hover:scale-105"
              />
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600"
                alt="Precision Detail"
                className="aspect-[4/5] rounded-[32px] md:rounded-[40px] object-cover shadow-2xl border border-white/5 transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="space-y-3 md:space-y-8">
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                src="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=600"
                alt="Eco-Cert Supplies"
                className="aspect-[4/5] rounded-[32px] md:rounded-[40px] object-cover shadow-2xl border border-white/5 transition-transform duration-700 hover:scale-105"
              />
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600"
                alt="Wellness at Home"
                className="aspect-[4/5] rounded-[32px] md:rounded-[40px] object-cover shadow-2xl border border-white/5 transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-6xl font-black text-primary-dark mb-4 md:6"
            >
              Common <span className="text-secondary">Queries</span>
            </motion.h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[24px] md:rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-6 md:p-8 text-left flex justify-between items-center hover:bg-slate-50 transition-all group"
                >
                  <span className="font-bold text-primary-dark text-base md:text-xl group-hover:text-primary transition-colors pr-4">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${activeFaq === i ? "bg-primary text-white rotate-180" : "bg-slate-50 text-secondary"}`}
                  >
                    <ChevronDown size={18} className="md:w-5 md:h-5" />
                  </div>
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 md:px-8 pb-6 md:pb-8 text-slate-500 font-medium leading-relaxed text-sm md:text-lg"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-primary rounded-[40px] md:rounded-[80px] p-10 md:p-28 text-center text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,59,42,0.4)]"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
            <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-secondary/10 rounded-full blur-[100px] md:blur-[120px] -mr-32 -mt-32 md:-mr-48 md:-mt-48" />

            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-7xl font-black mb-8 md:10 leading-tight tracking-tight">
                Step into a <span className="text-secondary">Pristine</span>{" "}
                Life.
              </h2>
              <p className="text-lg md:text-2xl text-white/70 mb-10 md:14 leading-relaxed font-medium px-4">
                Experience Nigeria's most trusted premium cleaning service. No
                stress, no mess—just absolute perfection.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 md:6">
                <Link
                  to="/booking"
                  className="btn-secondary px-8 md:12 py-5 md:6 text-lg md:xl shadow-2xl shadow-secondary/20"
                >
                  Book Your First Clean <ArrowRight size={22} />
                </Link>
              </div>
              <p className="mt-10 md:12 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/30">
                Trusted by hundreds of families and local businesses
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
