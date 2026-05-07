import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Star,
  Leaf,
  Heart,
  Home as HomeIcon,
  Briefcase,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import me1 from "../assets/image0.jpeg";
import me2 from "../assets/image1.jpeg";
import me3 from "../assets/Cleaniq services/4th Post.jpg";

const Services = () => {
  const serviceDetails = [
    {
      id: "residential",
      title: "Residential Cleaning",
      icon: <HomeIcon className="text-secondary" size={40} />,
      image: me1,
      features: [
        "Dusting of all surfaces",
        "Vacuuming & Mopping",
        "Kitchen degreasing",
        "Bathroom sanitization",
        "Bed making & tidying",
        "Trash removal",
      ],
      pricing: "From £20/hr",
    },
    {
      id: "commercial",
      title: "Office & Commercial",
      icon: <Briefcase className="text-secondary" size={40} />,
      image: me3,
      features: [
        "Workstation sanitization",
        "Communal area cleaning",
        "Restroom maintenance",
        "Window cleaning",
        "Carpet deep clean",
        "Disinfection services",
      ],
      pricing: "Custom Quotes",
    },
    {
      id: "move",
      title: "Move-In / Move-Out",
      icon: <Trash2 className="text-secondary" size={40} />,
      image: me2,
      features: [
        "Inside cabinets & drawers",
        "Baseboard scrubbing",
        "Door frame cleaning",
        "Wall spot cleaning",
        "Appliance deep clean",
        "End-of-tenancy guarantee",
      ],
      pricing: "Flat rates available",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="pt-32 pb-20 bg-slate-50 min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-6xl font-black text-primary-dark mb-4 md:6 leading-tight md:leading-[1.1]"
          >
            Professional Cleaning <span className="text-secondary">Solutions</span> for Your Space
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-xl text-slate-600 px-4"
          >
            From regular home care to complex commercial maintenance, our team
            delivers excellence with every visit.
          </motion.p>
        </div>

        {/* Detailed Services */}
        <div className="space-y-12 lg:space-y-24">
          {serviceDetails.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`flex flex-col lg:flex-row gap-8 lg:gap-16 items-center p-6 md:p-12 rounded-[40px] md:rounded-[60px] glass overflow-hidden relative shadow-xl shadow-primary/5 ${i % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}
            >
              <div className="lg:w-1/2 space-y-6 md:8">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-3xl bg-white flex items-center justify-center shadow-xl"
                >
                  {React.cloneElement(service.icon, { size: window.innerWidth < 768 ? 32 : 40 })}
                </motion.div>
                <div>
                  <h2 className="text-2xl md:text-4xl font-bold text-primary-dark mb-4 md:6 tracking-tight">
                    {service.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-6 md:8 text-sm md:text-base font-medium">
                    Our {service.title.toLowerCase()} provides the ultimate deep clean for those who
                    value precision and reliability. From end of tenancy cleaning to regular domestic maintenance, we use only eco-friendly,
                    non-toxic products to ensure a safe environment for your
                    family or employees.
                  </p>

                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:4 mb-8 md:10"
                  >
                    {service.features.map((f) => (
                      <motion.div
                        key={f}
                        variants={itemVariants}
                        className="flex items-center gap-2 md:3 text-xs md:text-sm font-bold text-primary-dark"
                      >
                        <CheckCircle2 size={16} className="text-secondary shrink-0" />
                        {f}
                      </motion.div>
                    ))}
                  </motion.div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:6">
                    <Link to="/booking" className="btn-primary w-full sm:w-auto text-center py-4">
                      Book Service
                    </Link>
                    <span className="text-primary font-black text-xl md:text-2xl text-center">
                      {service.pricing}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2 w-full aspect-video md:aspect-[4/3] rounded-[32px] md:rounded-[48px] relative overflow-hidden group shadow-2xl">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-700" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Eco-Friendly Commitment */}
        <section className="mt-20 md:32 p-8 md:p-20 bg-primary rounded-[40px] md:rounded-[80px] text-white relative overflow-hidden shadow-2xl shadow-primary/20">
          <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-secondary/20 rounded-full blur-[100px] md:blur-[120px] -mb-32 -mr-32 md:-mb-48 md:-mr-48" />
          <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-white/5 rounded-full blur-[80px] -mt-24 -ml-24 md:-mt-32 md:-ml-32" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 text-secondary font-black text-[10px] md:text-sm mb-6 md:8 border border-white/10 uppercase tracking-widest"
            >
              <ShieldCheck size={16} className="md:w-5 md:h-5" /> Our Commitment
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-6xl font-black mb-6 md:8 leading-tight tracking-tight"
            >
              100% Eco-Friendly <br className="hidden md:block" />
              <span className="text-secondary">Cleaning Solutions</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-sm md:text-xl text-white/70 mb-10 md:12 leading-relaxed font-medium px-4"
            >
              We believe that a clean space shouldn't come at the cost of the
              environment. That's why we use only biodegradable, non-toxic
              products that are safe for pets, children, and the planet.
            </motion.p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:8">
              {[
                { label: "Non-Toxic", icon: <Leaf size={28} /> },
                { label: "Pet Safe", icon: <Heart size={28} /> },
                { label: "Eco-Cert", icon: <ShieldCheck size={28} /> },
                { label: "Health First", icon: <CheckCircle2 size={28} /> },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-3 md:4 group"
                >
                  <div className="text-secondary transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                    {React.cloneElement(item.icon, { size: window.innerWidth < 768 ? 24 : 28 })}
                  </div>
                  <span className="font-bold text-[10px] md:text-sm uppercase tracking-[0.2em]">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Services;


