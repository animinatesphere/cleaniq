import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Target, Eye, Award, Leaf, Heart, CheckCircle2, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { useRegion } from '../context/RegionContext';

const About = () => {
  const { region } = useRegion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="pt-32 pb-20 bg-white min-h-screen overflow-x-hidden">
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
            className="text-4xl md:text-6xl lg:text-7xl font-black text-primary-dark mb-10 tracking-tighter leading-[1.1]"
          >
            A premium cleaning <br />
            <span className="text-primary italic text-6xl md:text-8xl">lifestyle.</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed font-medium space-y-6"
          >
            <p>
              Cleaniq Services is a premium cleaning solutions company based in Manchester, United 
              Kingdom, offering trusted, eco-friendly, and efficient cleaning services for homes, offices, 
              and move-out spaces.
            </p>
            <p>
              Founded with a simple mission to make cleanliness a lifestyle, Cleaniq combines 
              professionalism with environmental responsibility to deliver spotless results without 
              compromise. Our commitment to excellence is matched by our use of sustainable 
              products and methods designed to protect both people and the environment.
            </p>
            <p>
              Every client engagement is handled with precision, respect, and reliability. Be it a 
              one-time deep clean, regular home care, or ongoing office maintenance, Cleaniq makes 
              every space feel refreshed, organized, and truly cared for.
            </p>
          </motion.div>
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
            className="bg-white p-12 rounded-[48px] shadow-xl border border-slate-100"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center mb-8">
              <Target size={32} />
            </div>
            <h2 className="text-3xl font-black text-primary-dark mb-6 tracking-tight">Our Mission.</h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              Our mission is to provide exceptional, eco-conscious cleaning services that enhance the 
              quality of living and working environments, grounded in professionalism, integrity, and 
              trust.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-primary p-12 rounded-[48px] shadow-xl text-white relative overflow-hidden"
          >
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mb-16 -mr-16" />
            <div className="w-16 h-16 rounded-2xl bg-white/10 text-secondary flex items-center justify-center mb-8">
              <Eye size={32} />
            </div>
            <h2 className="text-3xl font-black mb-6 tracking-tight">Our Vision.</h2>
            <p className="text-lg text-white/80 font-medium leading-relaxed">
              Our vision is to establish CLEANIQ as Manchester’s most trusted and recognizable 
              household name in eco-friendly cleaning, defined by innovation, reliability, and 
              superior service.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Values</h2>
            <h3 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter">Our Core Values.</h3>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[
              { title: 'Professionalism', desc: 'We carry out every task with precision, dedication, and respect for our clients and their spaces.', icon: <Award /> },
              { title: 'Integrity', desc: 'We honour our word, act transparently, and ensure accountability in all we do.', icon: <ShieldCheck /> },
              { title: 'Sustainability', desc: 'We champion eco-friendly products and responsible methods that protect both people and the planet.', icon: <Leaf /> },
              { title: 'Excellence', desc: 'We hold ourselves to the highest standards, striving to exceed expectations every time.', icon: <CheckCircle2 /> },
              { title: 'Trust', desc: 'We earn lasting relationships through reliability, consistency, and genuine care for our clients.', icon: <Heart /> }
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group"
              >
                <div className="text-primary mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6">
                  {React.cloneElement(value.icon, { size: 32 })}
                </div>
                <h4 className="text-xl font-black text-primary-dark mb-4">{value.title}.</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantage & Standard */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 transform translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-black mb-12 tracking-tighter">The Cleaniq Advantage?</h2>
            <div className="space-y-6">
              {[
                'Trained, vetted, and reliable cleaning professionals',
                'Flexible scheduling and customized service plans',
                'Eco-friendly, non-toxic cleaning products',
                'Excellent customer support and responsive service',
                'Proven commitment to quality and satisfaction'
              ].map((adv, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-primary" />
                  </div>
                  <span className="text-lg font-medium text-white/90">{adv}.</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-12 rounded-[60px] border border-white/20">
            <h2 className="text-3xl font-black mb-8 tracking-tight">The Cleaniq Standard.</h2>
            <p className="text-xl text-white/80 leading-relaxed font-medium">
              We’ve redefined what clean means. At Cleaniq, every service upholds our standard of 
              precision, care, and sustainability — ensuring your environment feels as good as it looks.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[60px] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-black mb-12 tracking-tighter">Get in Touch.</h2>
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-secondary">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Office Location</p>
                    <p className="text-lg font-bold">Manchester, United Kingdom.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-secondary">
                    <Globe size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Website</p>
                    <p className="text-lg font-bold">www.cleaniqservices.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-secondary">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Email Us</p>
                    <p className="text-lg font-bold">info@cleaniqservices.com</p>
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
