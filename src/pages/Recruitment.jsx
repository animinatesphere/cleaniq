import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegion } from '../context/RegionContext';
import { 
  Upload, CheckCircle2, User, Mail, Phone, 
  MapPin, Briefcase, FileText, ChevronRight, ChevronLeft,
  ShieldCheck
} from 'lucide-react';

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
    idDocument: null,
    backgroundCheck: null,
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
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass p-8 md:p-12 text-center shadow-2xl shadow-primary/10 rounded-[32px] md:rounded-[40px]"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-16 h-16 md:w-24 md:h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 md:8"
          >
            <CheckCircle2 size={window.innerWidth < 768 ? 32 : 48} />
          </motion.div>
          <h2 className="text-2xl md:text-4xl font-bold text-primary-dark mb-4">Application Received!</h2>
          <p className="text-slate-600 mb-8 md:10 leading-relaxed text-sm md:text-base font-medium">
            Thank you for applying to join the CLEANIQ team. Our hiring manager will review your profile and contact you within 3-5 business days.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary w-full py-4 text-base md:text-lg"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-slate-50 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 md:16"
        >
          <h1 className="text-3xl md:text-6xl font-black text-primary-dark mb-4 md:6 leading-tight tracking-tight">Join the <span className="text-secondary">CLEANIQ</span> Team</h1>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto px-4 font-medium">Apply today and start earning with {region.name}'s premium cleaning service network.</p>
        </motion.div>

        <div className="glass p-6 md:p-12 rounded-[32px] md:rounded-[40px] shadow-xl shadow-primary/5 border border-white/50">
          {/* Stepper Header */}
          <div className="flex gap-3 md:4 mb-10 md:12">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 space-y-2">
                <div className={`h-1.5 md:h-2 rounded-full transition-all duration-700 ${step >= s ? 'bg-secondary' : 'bg-slate-100'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${step >= s ? 'text-primary' : 'text-slate-300'}`}>
                  {s === 1 ? 'Personal' : s === 2 ? 'Experience' : 'Documents'}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 md:8"
                >
                  <h3 className="text-xl md:text-2xl font-bold text-primary-dark flex items-center gap-3">
                    <User size={20} className="text-secondary md:w-6 md:h-6" /> Basic Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 md:6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        className="w-full p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 focus:border-secondary outline-none transition-all shadow-sm text-sm md:text-base"
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
                        className="w-full p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 focus:border-secondary outline-none transition-all shadow-sm text-sm md:text-base"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 md:6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                       <input 
                        required
                        type="tel" 
                        placeholder={region.id === 'UK' ? "+44 7123 456789" : "+234 801 234 5678"}
                        className="w-full p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 focus:border-secondary outline-none transition-all shadow-sm text-sm md:text-base"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City / Region</label>
                       <input 
                        required
                        type="text" 
                        placeholder={region.id === 'UK' ? "London" : "Lagos"}
                        className="w-full p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 focus:border-secondary outline-none transition-all shadow-sm text-sm md:text-base"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                       />
                    </div>
                  </div>
                  <button type="button" onClick={nextStep} className="btn-primary w-full flex items-center justify-center gap-2 mt-8 md:12 py-4 text-base md:text-lg">
                    Continue Application <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 md:8"
                >
                  <h3 className="text-xl md:text-2xl font-bold text-primary-dark flex items-center gap-3">
                    <Briefcase size={20} className="text-secondary md:w-6 md:h-6" /> Experience & Skills
                  </h3>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cleaning Experience</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:3">
                      {['None', '1-2 Years', '3+ Years'].map(exp => (
                        <button
                          key={exp}
                          type="button"
                          onClick={() => setFormData({...formData, experience: exp})}
                          className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 text-xs md:text-sm font-bold transition-all ${
                            formData.experience === exp ? 'border-secondary bg-secondary/5 text-primary shadow-inner' : 'border-slate-100 bg-white text-slate-400'
                          }`}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 md:p-8 bg-slate-50 rounded-[24px] md:rounded-3xl border border-slate-100">
                    <div className="pr-4">
                      <h4 className="font-bold text-primary-dark text-sm md:text-lg">Access to Transport</h4>
                      <p className="text-[10px] md:text-xs text-slate-500 font-medium">Do you have a reliable way to get to client locations?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.hasTransport}
                        onChange={e => setFormData({...formData, hasTransport: e.target.checked})}
                      />
                      <div className="w-12 h-6 md:w-14 md:h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 md:after:h-6 after:w-5 md:after:w-6 after:transition-all peer-checked:bg-secondary transition-colors"></div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:4 mt-10 md:12">
                    <button type="button" onClick={prevStep} className="px-6 md:8 py-4 rounded-full border-2 border-slate-200 font-bold text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all text-sm md:text-base">
                       <ChevronLeft size={18} /> Back
                    </button>
                    <button type="button" onClick={nextStep} className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base md:text-lg">
                      Documents <ChevronRight size={18} />
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
                  className="space-y-6 md:8"
                >
                  <h3 className="text-xl md:text-2xl font-bold text-primary-dark flex items-center gap-3">
                    <FileText size={20} className="text-secondary md:w-6 md:h-6" /> Verification
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">
                    To maintain our premium safety standards, we require these documents for {region.id === 'UK' ? 'GDPR' : 'NDPR'} compliance and background vetting.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:6">
                    <div className="space-y-2 md:3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valid ID / Passport</label>
                      <div className="relative group">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="p-6 md:p-10 border-2 border-dashed border-slate-200 rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center gap-2 md:3 group-hover:border-secondary group-hover:bg-secondary/5 transition-all bg-white/50 shadow-sm">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-secondary transition-all shadow-inner">
                            <Upload size={20} className="md:w-6 md:h-6" />
                          </div>
                          <span className="text-[10px] md:text-xs font-bold text-slate-500 group-hover:text-primary">Tap to upload</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 md:3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Police Report</label>
                      <div className="relative group">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="p-6 md:p-10 border-2 border-dashed border-slate-200 rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center gap-2 md:3 group-hover:border-secondary group-hover:bg-secondary/5 transition-all bg-white/50 shadow-sm">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-secondary transition-all shadow-inner">
                            <Upload size={20} className="md:w-6 md:h-6" />
                          </div>
                          <span className="text-[10px] md:text-xs font-bold text-slate-500 group-hover:text-primary">Tap to upload</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 bg-primary/5 rounded-[24px] md:rounded-[32px] border border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <ShieldCheck size={window.innerWidth < 768 ? 48 : 64} className="text-primary" />
                    </div>
                     <p className="text-[10px] md:text-xs text-primary/70 leading-relaxed italic text-center relative z-10 font-medium">
                       "I certify that the information provided is accurate and authorize CLEANIQ Services to perform necessary background checks in accordance with local labor laws and data protection regulations."
                     </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:4 mt-10 md:12">
                    <button type="button" onClick={prevStep} className="px-6 md:8 py-4 rounded-full border-2 border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm md:text-base">
                       Back
                    </button>
                    <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base md:text-xl shadow-2xl shadow-primary/20">
                      Submit <CheckCircle2 size={20} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Recruitment;


