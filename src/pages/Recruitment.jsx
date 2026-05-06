import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegion } from '../context/RegionContext';
import { 
  Upload, CheckCircle2, User, Mail, Phone, 
  MapPin, Briefcase, FileText, ChevronRight, ChevronLeft 
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

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

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
          className="max-w-md w-full glass p-10 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-primary-dark mb-4">Application Received!</h2>
          <p className="text-slate-600 mb-8">
            Thank you for applying to join the CLEANIQ team. Our hiring manager will review your documents and contact you within 3-5 business days.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary w-full"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-dark mb-4">Join the CLEANIQ Team</h1>
          <p className="text-slate-600">Apply today and start earning with {region.name}'s premium cleaning service.</p>
        </div>

        <div className="glass p-8 md:p-12 rounded-[40px]">
          {/* Stepper Header */}
          <div className="flex gap-4 mb-10">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-secondary' : 'bg-slate-100'}`} />
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
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-primary-dark flex items-center gap-2">
                    <User size={20} className="text-secondary" /> Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                       <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-secondary/50 outline-none"
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                       <input 
                        required
                        type="email" 
                        placeholder="john@example.com"
                        className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-secondary/50 outline-none"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                       <input 
                        required
                        type="tel" 
                        placeholder={region.id === 'UK' ? "+44..." : "+234..."}
                        className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-secondary/50 outline-none"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                       <input 
                        required
                        type="text" 
                        placeholder={region.id === 'UK' ? "Manchester" : "Lagos"}
                        className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-secondary/50 outline-none"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                       />
                    </div>
                  </div>
                  <button type="button" onClick={nextStep} className="btn-primary w-full flex items-center justify-center gap-2 mt-8">
                    Next Step <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-primary-dark flex items-center gap-2">
                    <Briefcase size={20} className="text-secondary" /> Experience & Skills
                  </h3>
                  
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase">Cleaning Experience</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['None', '1-2 Years', '3+ Years'].map(exp => (
                        <button
                          key={exp}
                          type="button"
                          onClick={() => setFormData({...formData, experience: exp})}
                          className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                            formData.experience === exp ? 'border-secondary bg-secondary/5 text-primary' : 'border-slate-50 bg-slate-50 text-slate-400'
                          }`}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-primary-dark">Access to Transport</h4>
                      <p className="text-xs text-slate-500">Do you have a reliable way to get to clients?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.hasTransport}
                        onChange={e => setFormData({...formData, hasTransport: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button type="button" onClick={prevStep} className="px-8 py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-400 flex items-center gap-2">
                       <ChevronLeft size={18} /> Back
                    </button>
                    <button type="button" onClick={nextStep} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      Next Step <ChevronRight size={18} />
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
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-primary-dark flex items-center gap-2">
                    <FileText size={20} className="text-secondary" /> Document Upload
                  </h3>
                  <p className="text-sm text-slate-500">We require these documents for {region.id === 'UK' ? 'GDPR' : 'NDPR'} compliance and background vetting.</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Valid ID / Passport</label>
                      <div className="relative group">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:border-secondary group-hover:bg-secondary/5 transition-all">
                          <Upload className="text-slate-400 group-hover:text-secondary" />
                          <span className="text-xs font-bold text-slate-400 group-hover:text-primary">Click to Upload</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Background Check / Police Report</label>
                      <div className="relative group">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:border-secondary group-hover:bg-secondary/5 transition-all">
                          <Upload className="text-slate-400 group-hover:text-secondary" />
                          <span className="text-xs font-bold text-slate-400 group-hover:text-primary">Click to Upload</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                     <p className="text-[10px] text-primary/70 leading-relaxed italic text-center">
                       By submitting this application, I confirm that the information provided is accurate and I authorize CLEANIQ Services to perform a background check in accordance with local labor laws.
                     </p>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button type="button" onClick={prevStep} className="px-8 py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-400 flex items-center gap-2">
                       <ChevronLeft size={18} /> Back
                    </button>
                    <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2 shadow-xl shadow-primary/30">
                      Submit Application <CheckCircle2 size={18} />
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
