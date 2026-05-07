import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegion } from '../context/RegionContext';
import { 
  Upload, CheckCircle2, User, Mail, Phone, 
  MapPin, Briefcase, FileText, ChevronRight, ChevronLeft,
  ShieldCheck, Building, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Recruitment = () => {
  const { region } = useRegion();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    experience: 'None',
    hasTransport: false,
    cv: null,
    dbsNumber: '',
    idDocument: null,
  });

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => s + 1);
  };
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => s - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-8 md:p-12 text-center rounded-[48px] bg-slate-50 border border-slate-100 shadow-xl"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20 rotate-3"
          >
            <CheckCircle2 size={40} />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-primary-dark mb-4 tracking-tighter">Application Sent!</h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            Thanks for your interest in joining CleanIQ Services. Our recruitment team will review your {region.id === 'UK' ? 'DBS' : 'CV'} and get back to you shortly.
          </p>
          <Link 
            to="/"
            className="btn-primary w-full py-5 text-lg shadow-xl shadow-primary/20"
          >
            Return to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            Join our elite team
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-primary-dark mb-6 tracking-tighter leading-tight">
            Help us redefine <br />
            <span className="text-primary italic">professionalism.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium leading-relaxed">
            {region.id === 'UK' 
              ? "We're hiring dedicated pros in Manchester with valid DBS checks."
              : "Join Nigeria's premier cleaning network. High pay, flexible hours, and professional growth."}
          </p>
        </motion.div>

        {/* Multi-step Form */}
        <div className="bg-slate-50 rounded-[60px] p-8 md:p-16 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
          
          {/* Stepper Progress */}
          <div className="flex gap-4 mb-16 relative z-10">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1">
                <div className={`h-2 rounded-full transition-all duration-700 ${step >= s ? 'bg-primary' : 'bg-slate-200'}`} />
                <p className={`text-[10px] font-black uppercase tracking-widest mt-4 ${step >= s ? 'text-primary' : 'text-slate-400'}`}>
                  Step 0{s}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative z-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                      <User size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-primary-dark tracking-tight">Personal Details</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input 
                        required
                        type="email" 
                        placeholder="john@example.com"
                        className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        placeholder={region.id === 'UK' ? "+44 7..." : "+234 8..."}
                        className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current City</label>
                      <input 
                        required
                        type="text" 
                        placeholder={region.id === 'UK' ? "Manchester" : "Lagos"}
                        className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                  </div>

                  <button type="button" onClick={nextStep} className="btn-primary w-full py-5 text-lg group">
                    Continue Application
                    <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                      <Briefcase size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-primary-dark tracking-tight">Professional Experience</h3>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Years of experience</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {['Entry Level', '2-4 Years', '5+ Years'].map(exp => (
                        <button
                          key={exp}
                          type="button"
                          onClick={() => setFormData({...formData, experience: exp})}
                          className={`p-6 rounded-[32px] border-2 text-sm font-black transition-all ${
                            formData.experience === exp 
                            ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' 
                            : 'border-white bg-white text-slate-400 hover:border-primary/20'
                          }`}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 rounded-[40px] bg-white border border-slate-100 flex items-center justify-between gap-6">
                    <div>
                      <h4 className="text-xl font-black text-primary-dark mb-1">Access to transport?</h4>
                      <p className="text-sm text-slate-500 font-medium">Do you have a vehicle or reliable public transport?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.hasTransport}
                        onChange={e => setFormData({...formData, hasTransport: e.target.checked})}
                      />
                      <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary transition-colors"></div>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={prevStep} className="px-8 py-5 rounded-[32px] bg-white border border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-2">
                       <ChevronLeft size={20} /> Back
                    </button>
                    <button type="button" onClick={nextStep} className="btn-primary flex-1 py-5 text-lg flex items-center justify-center gap-2">
                      {region.id === 'UK' ? 'DBS Verification' : 'CV Upload'} <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-primary-dark tracking-tight">Identity & Verification</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Common Passport Section */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valid Passport (Both Regions)</label>
                      <div className="relative group">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="p-10 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center gap-4 bg-white group-hover:border-primary group-hover:bg-primary/5 transition-all">
                          <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-primary transition-all">
                            <Upload size={32} />
                          </div>
                          <div className="text-center">
                            <p className="font-black text-primary-dark">Upload Passport Photo Page</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Required for identity verification</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Regional Specific Section */}
                    {region.id === 'UK' ? (
                      <div className="space-y-6 pt-6 border-t border-slate-100">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DBS Certificate Number</label>
                          <input 
                            required
                            type="text" 
                            placeholder="Enter 12-digit number"
                            className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                            value={formData.dbsNumber}
                            onChange={e => setFormData({...formData, dbsNumber: e.target.value})}
                          />
                        </div>
                        <div className="relative group">
                          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          <div className="p-10 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center gap-4 bg-white group-hover:border-primary group-hover:bg-primary/5 transition-all">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-primary transition-all">
                              <Upload size={32} />
                            </div>
                            <div className="text-center">
                              <p className="font-black text-primary-dark">Upload DBS Certificate</p>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">PDF or JPEG (Max 5MB)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 pt-6 border-t border-slate-100">
                        <p className="text-slate-500 font-medium leading-relaxed">
                          Please upload your latest Curriculum Vitae (CV) highlighting your professional history and references.
                        </p>
                        <div className="relative group">
                          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          <div className="p-10 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center gap-4 bg-white group-hover:border-primary group-hover:bg-primary/5 transition-all">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-primary transition-all">
                              <Upload size={32} />
                            </div>
                            <div className="text-center">
                              <p className="font-black text-primary-dark">Tap to upload CV</p>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">PDF or Word Doc (Max 5MB)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 flex gap-6">
                    <ShieldCheck className="text-primary shrink-0" size={24} />
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      "I confirm that all information provided is accurate and authorize CleanIQ Services to conduct necessary background verification in accordance with {region.id === 'UK' ? 'GDPR' : 'NDPR'} regulations."
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={prevStep} className="px-8 py-5 rounded-[32px] bg-white border border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all">
                       Back
                    </button>
                    <button type="submit" className="btn-primary flex-1 py-5 text-lg shadow-2xl shadow-primary/20">
                      Submit Application
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          {[
            { icon: <Building size={24}/>, title: 'Flexible Hours', desc: 'Choose when and where you want to work.' },
            { icon: <Award size={24}/>, title: 'Premium Pay', desc: 'Industry-leading rates for top-tier professionals.' },
            { icon: <ShieldCheck size={24}/>, title: 'Vetted Quality', desc: 'Join a network of the highest rated pros.' }
          ].map((benefit, i) => (
            <div key={i} className="text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mx-auto mb-6">
                {benefit.icon}
              </div>
              <h4 className="text-xl font-black text-primary-dark mb-3 tracking-tight">{benefit.title}</h4>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recruitment;
