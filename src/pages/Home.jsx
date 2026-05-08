import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';
import { 
  CheckCircle2, Star, ShieldCheck, Clock, 
  Home as HomeIcon, Briefcase, 
  ArrowRight, Users, Heart, Zap, Plus,
  ChevronDown
} from 'lucide-react';

const Home = () => {
  const { region } = useRegion();
  const [activeFaq, setActiveFaq] = useState(null);

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
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
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
              {region.id === "UK" ? "TOP-RATED CLEANERS IN MANCHESTER" : "EXCEPTIONAL CLEANING IN LAGOS & ABUJA"}
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-primary-dark leading-[1.1] mb-8 tracking-tighter">
              {region.id === "UK" ? "Best Professional House Cleaning in" : "Top-Rated Home & Office Cleaning in"}
              <br />
              <span className="text-primary bg-clip-text">
                {region.id === "UK" ? "Manchester" : "Lagos & Abuja"}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-lg leading-relaxed font-medium">
              We provide the most reliable {region.id === "UK" ? "housekeeping and domestic services" : "professional maid and janitorial services"}. Whether you need a regular weekly clean or specialized Airbnb cleaning, our vetted pros handle the meticulous care of your space.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <Link to="/booking" className="btn-primary py-5 px-10 text-lg group">
                Book in 60 Seconds
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <div className="flex items-center gap-3 px-6 py-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <div>
                  <div className="flex text-secondary mb-0.5">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-[10px] font-black text-primary-dark uppercase tracking-widest">4.9/5 from 2k+ users</p>
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
                src="https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2000&auto=format&fit=crop" 
                alt="Professional cleaning service"
                className="w-full h-[400px] lg:h-[600px] object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[32px] shadow-2xl shadow-primary/10 z-20 border border-slate-50 hidden md:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black text-primary-dark tracking-tighter">100% Vetted</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Background checked</p>
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
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Our Services</h2>
            <h3 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter mb-6">
              Tailored cleaning for {region.id === "UK" ? "Manchester living" : "Nigerian homes & offices"}
            </h3>
            <p className="text-lg text-slate-500 font-medium">
              Whether it's a {region.id === "UK" ? "weekly domestic clean" : "regular maintenance"} or a deep seasonal refresh, we have the right pros for you.
              {region.id === "NG" && <span className="block mt-2 text-primary font-bold text-sm">Proudly paying above the Nigerian living wage.</span>}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                title: 'Residential Cleaning', 
                desc: 'Reliable, weekly or bi-weekly cleaning for your home.', 
                icon: <HomeIcon size={32}/>,
                keyword: 'Reliable domestic cleaners'
              },
              { 
                title: 'Office Cleaning', 
                desc: 'Professional janitorial services for your workspace.', 
                icon: <Briefcase size={32}/>,
                keyword: 'Expert office cleaning'
              },
              { 
                title: 'Deep Clean', 
                desc: 'Specialized deep cleaning services for a total refresh.', 
                icon: <Zap size={32}/>,
                keyword: 'Deep cleaning'
              },
              { 
                title: 'Airbnb Cleaning', 
                desc: 'Professional turnover services for your short-let rental.', 
                icon: <Star size={32}/>,
                keyword: 'Short-let specialist'
              }
            ].map((service, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="p-10 rounded-[40px] bg-white border-2 border-slate-50 shadow-xl shadow-slate-100/50 hover:border-primary/20 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-8">
                  {service.icon}
                </div>
                <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2">{service.keyword}</h4>
                <h5 className="text-2xl font-black text-primary-dark mb-4 tracking-tight">{service.title}</h5>
                <p className="text-slate-500 font-medium leading-relaxed mb-8">{service.desc}</p>
                <Link to="/booking" className="inline-flex items-center gap-2 font-black text-primary hover:gap-4 transition-all">
                  Book Now <ArrowRight size={18} />
                </Link>
              </motion.div>
            ))}
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
                  src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2000&auto=format&fit=crop" 
                  alt="Our Team"
                  className="w-full h-[500px] object-cover"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Our Mission</h2>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary-dark tracking-tighter mb-8">
                We believe a clean home is a <span className="text-primary italic">happy home.</span>
              </h3>
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                CleaniqServices was born from a simple idea: that everyone deserves a spotless sanctuary. We specialize in {region.id === 'UK' ? 'end of tenancy, deep cleans, and reliable domestic help' : 'post-construction cleaning, office janitorial, and thorough home maintenance'}. Our mission remains the same—to connect you with the most professional, background-checked cleaners in your community.
              </p>
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-3xl font-black text-primary mb-1">500+</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Pros</p>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-3xl font-black text-primary mb-1">98%</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Satisfaction Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 md:py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">The Process</h2>
          <h3 className="text-3xl md:text-5xl font-black text-primary-dark mb-20 tracking-tighter">Reliable domestic cleaning in 3 simple steps</h3>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="absolute top-1/4 left-0 w-full h-0.5 bg-slate-100 hidden md:block" />
            
            {[
              { step: '01', title: 'Book Online', desc: 'Choose your service and pick a time that suits you.' },
              { step: '02', title: 'Pro Arrives', desc: 'A background-checked professional arrives at your door.' },
              { step: '03', title: 'Sparkling Clean', desc: 'Relax and enjoy your perfectly cleaned living space.' }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-[30px] bg-white border-2 border-slate-50 shadow-xl flex items-center justify-center text-2xl font-black text-primary mb-8">
                  {step.step}
                </div>
                <h4 className="text-2xl font-black text-primary-dark mb-4">{step.title}</h4>
                <p className="text-slate-500 font-medium max-w-[250px] mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">FAQ</h2>
            <h3 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tighter">
              Common questions
            </h3>
          </div>
          
          <div className="space-y-4">
            {[
              { 
                q: "How do you vet your cleaners?", 
                a: "Every cleaner undergoes a rigorous multi-stage vetting process, including face-to-face interviews, background checks, and practical skills assessments." 
              },
              { 
                q: "What if I'm not satisfied with the clean?", 
                a: "We offer a 48-hour satisfaction guarantee. If any part of the clean isn't up to our high standards, we'll send someone back to re-clean for free." 
              },
              { 
                q: "Do I need to provide cleaning supplies?", 
                a: "It's up to you! In the UK, we can bring eco-friendly supplies for a small fee. In Nigeria, we typically use the supplies available in your home unless otherwise requested." 
              }
            ].map((faq, i) => (
              <details key={i} className="group p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer">
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

      {/* Join the Team Section */}
      <section className="py-24 bg-white border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[48px] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            <div className="max-w-2xl relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter">Become a Cleaniq Services Pro</h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed mb-8">
                {region.id === 'UK' 
                  ? "Are you a professional cleaner in Manchester? Join our platform today. We require all pros to have a valid DBS check for customer safety."
                  : "Join Nigeria's fastest growing cleaning agency. We're looking for dedicated professionals to join our elite team in Lagos and Abuja."}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-secondary">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="font-bold">
                    {region.id === 'UK' ? "Apply Now" : "Apply Now"}
                  </p>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Application Requirement</p>
                </div>
              </div>
            </div>
            <div className="relative z-10 w-full md:w-auto">
              <Link to="/recruitment" className="btn-secondary py-5 px-10 text-lg w-full md:w-auto flex items-center justify-center gap-3">
                {region.id === 'UK' ? "Apply Now" : "Apply Now"}
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary/10 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-primary-dark tracking-tighter mb-8">
            Ready to experience a cleaner home?
          </h2>
          <p className="text-xl text-slate-600 mb-12 font-medium">Join 2,000+ happy customers today.</p>
          <Link to="/booking" className="btn-primary py-6 px-12 text-xl shadow-2xl shadow-primary/30">
            Book  Now
          </Link>
        </div>
      </section>

      {/* SEO Footer */}
      <section className="py-16 bg-white text-slate-400 border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Professional Cleaning Services</h4>
            <p className="text-sm leading-relaxed">
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm md:text-base font-medium">
              Cleaniq Services is your premier choice for high-quality {region.id === "UK" ? "house cleaning and professional housekeeping" : "residential and commercial cleaning"} across {region.id === "UK" ? "Greater Manchester" : "Lagos & Abuja"}. We specialize in deep cleaning, move-in/move-out services, Airbnb management cleaning, and office janitorial solutions.
            </p>
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Local Impact</h4>
            <p className="text-sm leading-relaxed text-slate-300 italic">
              Serving our local communities with reliability and care since 2024.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
