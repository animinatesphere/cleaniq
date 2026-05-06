import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Star,
  Sparkles,
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

  return (
    <div className="pt-32 pb-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-primary-dark mb-6"
          >
            Premium Solutions for{" "}
            <span className="text-secondary">Spotless</span> Spaces
          </motion.h1>
          <p className="text-lg text-slate-600">
            From regular home care to complex commercial maintenance, our team
            delivers excellence with every swipe.
          </p>
        </div>

        {/* Detailed Services */}
        <div className="space-y-12">
          {serviceDetails.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col lg:flex-row gap-8 items-center p-12 rounded-[50px] glass overflow-hidden relative ${i % 2 !== 0 ? "lg:flex-row-reverse" : ""}`}
            >
              <div className="lg:w-1/2 space-y-8">
                <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-xl">
                  {service.icon}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-primary-dark mb-4">
                    {service.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-8">
                    Our {service.title.toLowerCase()} is designed for those who
                    value precision and reliability. We use only eco-friendly,
                    non-toxic products to ensure a safe environment for your
                    family or employees.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {service.features.map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-2 text-sm font-semibold text-primary-dark"
                      >
                        <CheckCircle2 size={16} className="text-secondary" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-6">
                    <Link to="/booking" className="btn-primary">
                      Book Now
                    </Link>
                    <span className="text-primary font-black text-xl">
                      {service.pricing}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`lg:w-1/2 aspect-video rounded-3xl  flex items-center justify-center relative overflow-hidden`}
              >
                <img src={service.image} alt="" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Eco-Friendly Commitment */}
        <section className="mt-32 p-12 md:p-20 bg-primary rounded-[60px] text-white relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] -mb-48 -mr-48" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-secondary font-bold text-sm mb-8">
              <ShieldCheck size={18} /> Our Commitment
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              100% Eco-Friendly <br />
              Cleaning Solutions
            </h2>
            <p className="text-lg text-white/70 mb-12 leading-relaxed">
              We believe that a clean space shouldn't come at the cost of the
              environment. That's why we use only biodegradable, non-toxic
              products that are safe for pets, children, and the planet.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Non-Toxic", icon: <Star size={24} /> },
                { label: "Pet Safe", icon: <Star size={24} /> },
                { label: "Eco-Cert", icon: <Star size={24} /> },
                { label: "Health First", icon: <Star size={24} /> },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="text-secondary">{item.icon}</div>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Services;
