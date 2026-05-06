import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Leaf, Clock, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useRegion } from "../context/RegionContext";
import log from "../assets/Cleaniq services/1st Post.jpg";
import log1 from "../assets/Cleaniq services/2nd post.jpg";
import log2 from "../assets/Cleaniq services/3rd Post.jpg";
import log3 from "../assets/Cleaniq services/4th Post.jpg";
import log4 from "../assets/Cleaniq services/5th Post.jpg";
const Home = () => {
  const { region } = useRegion();

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

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 bg-slate-50 mt-7">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-l-[100px] hidden lg:block" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
              </span>
              Now Serving {region.name}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-primary-dark leading-tight mb-6">
              Excellence in <br />
              <span className="text-secondary">Eco-Friendly</span> Cleaning
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
              CLEANIQ combines professionalism with environmental responsibility
              to deliver spotless results without compromise. Premium solutions
              for homes and offices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/booking"
                className="btn-primary text-center flex items-center justify-center gap-2"
              >
                Book a Clean <ArrowRight size={18} />
              </Link>
              <Link
                to="/services"
                className="px-6 py-3 rounded-full border-2 border-primary/20 text-primary font-semibold text-center hover:bg-primary/5 transition-all"
              >
                View Services
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className=" rounded-3xl bg-primary/10 overflow-hidden relative group">
              {/* Visual placeholder - later can use generate_image */}
              <img src={log} alt="" />
              {/* <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent flex items-center justify-center">
                    <div className="text-primary font-black text-9xl opacity-10 select-none">CLEANIQ</div>
                </div> */}
              {/* Floating Stats */}
              {/* <div className="absolute bottom-10 left-10 glass p-6 rounded-2xl shadow-2xl animate-bounce-slow">
                    <div className="text-3xl font-bold text-primary">99%</div>
                    <div className="text-sm text-slate-600 font-medium">Customer Satisfaction</div>
                </div> */}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary-dark mb-4">
              Our Premium Services
            </h2>
            <p className="text-slate-600">
              Tailored cleaning solutions for every need, delivered with
              precision and care.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all border border-transparent hover:border-primary/10"
              >
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-6">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-primary-dark mb-4">
                  {service.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="section-padding bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] -mr-48 -mt-48" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
              The CLEANIQ <br />
              Advantage
            </h2>
            <ul className="space-y-6">
              {[
                "Trained, vetted, and reliable professionals",
                "Flexible scheduling and customized plans",
                "Eco-friendly, non-toxic cleaning products",
                "Excellent customer support and response",
                "Proven commitment to quality",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-lg">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} className="text-primary" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6 pt-12">
              <img
                src={log1}
                alt=""
                className="aspect-4/5 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10"
              />
              <img
                src={log2}
                alt=""
                className="aspect-4/5 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10"
              />
            </div>
            <div className="space-y-6">
              <img
                src={log3}
                alt=""
                className="aspect-4/5 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10"
              />
              <img
                src={log4}
                alt=""
                className="aspect-4/5 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10"
              />

              {/* <div className="aspect-[4/5] rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10" /> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
