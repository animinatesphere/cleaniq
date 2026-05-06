import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegion } from '../context/RegionContext';
import { 
  ChevronRight, ChevronLeft, Calendar, User, 
  CreditCard, Sparkles, Home as HomeIcon, Briefcase, 
  Trash2, Plus, Minus, CheckCircle2 
} from 'lucide-react';

const Booking = () => {
  const { region } = useRegion();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: 'Residential',
    frequency: 'One-time',
    bedrooms: 1,
    bathrooms: 1,
    extras: [],
    date: '',
    time: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    specialInstructions: '',
  });

  const [totalPrice, setTotalPrice] = useState(0);

  // Pricing Logic
  useEffect(() => {
    let base = region.basePrice;
    
    // Multipliers for service type
    if (formData.serviceType === 'Move-out') base *= 1.5;
    if (formData.serviceType === 'Office') base *= 1.2;

    // Room costs
    const roomCost = (formData.bedrooms * (region.id === 'UK' ? 10 : 5000)) + 
                     (formData.bathrooms * (region.id === 'UK' ? 8 : 4000));
    
    // Extra costs
    const extraCost = formData.extras.reduce((acc, curr) => {
        const extraPrices = {
            'Deep Clean': region.id === 'UK' ? 30 : 15000,
            'Inside Fridge': region.id === 'UK' ? 15 : 5000,
            'Inside Oven': region.id === 'UK' ? 20 : 7000,
            'Windows (Inside)': region.id === 'UK' ? 20 : 8000,
        };
        return acc + (extraPrices[curr] || 0);
    }, 0);

    let total = base + roomCost + extraCost;

    // Frequency Discount
    if (formData.frequency === 'Weekly') total *= 0.9;
    if (formData.frequency === 'Bi-weekly') total *= 0.95;

    setTotalPrice(Math.round(total));
  }, [formData, region]);

  const toggleExtra = (extra) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.includes(extra) 
        ? prev.extras.filter(e => e !== extra) 
        : [...prev.extras, extra]
    }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const steps = [
    { id: 1, title: 'Service', icon: <HomeIcon size={18} /> },
    { id: 2, title: 'Schedule', icon: <Calendar size={18} /> },
    { id: 3, title: 'Details', icon: <User size={18} /> },
    { id: 4, title: 'Payment', icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="pt-24 min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Progress Stepper */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                step >= s.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-white text-slate-400 border border-slate-200'
              }`}>
                {step > s.id ? <CheckCircle2 size={20} /> : s.icon}
              </div>
              <span className={`text-xs font-bold mt-2 ${step >= s.id ? 'text-primary' : 'text-slate-400'}`}>{s.title}</span>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass p-8 rounded-3xl"
                >
                  <h2 className="text-2xl font-bold text-primary-dark mb-6">Choose Your Service</h2>
                  
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {['Residential', 'Office', 'Move-out'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({...formData, serviceType: type})}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          formData.serviceType === type ? 'border-secondary bg-secondary/5 text-primary' : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">{type}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100">
                      <span className="font-semibold text-primary-dark">Bedrooms</span>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setFormData(p => ({...p, bedrooms: Math.max(1, p.bedrooms-1)}))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"><Minus size={16}/></button>
                        <span className="w-4 text-center font-bold">{formData.bedrooms}</span>
                        <button onClick={() => setFormData(p => ({...p, bedrooms: p.bedrooms+1}))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"><Plus size={16}/></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100">
                      <span className="font-semibold text-primary-dark">Bathrooms</span>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setFormData(p => ({...p, bathrooms: Math.max(1, p.bathrooms-1)}))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"><Minus size={16}/></button>
                        <span className="w-4 text-center font-bold">{formData.bathrooms}</span>
                        <button onClick={() => setFormData(p => ({...p, bathrooms: p.bathrooms+1}))} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"><Plus size={16}/></button>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-primary-dark mt-8 mb-4">Add Extras</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['Deep Clean', 'Inside Fridge', 'Inside Oven', 'Windows (Inside)'].map((extra) => (
                      <button
                        key={extra}
                        onClick={() => toggleExtra(extra)}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                          formData.extras.includes(extra) ? 'border-secondary bg-secondary/5 text-primary' : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                      >
                        <Sparkles size={16} className={formData.extras.includes(extra) ? 'text-secondary' : 'text-slate-400'} />
                        <span className="text-sm font-semibold">{extra}</span>
                      </button>
                    ))}
                  </div>

                  <button onClick={nextStep} className="btn-primary w-full mt-10 flex items-center justify-center gap-2">
                    Next: Scheduling <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass p-8 rounded-3xl"
                >
                  <h2 className="text-2xl font-bold text-primary-dark mb-6">Select Date & Time</h2>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Frequency</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['One-time', 'Weekly', 'Bi-weekly'].map(freq => (
                          <button
                            key={freq}
                            onClick={() => setFormData({...formData, frequency: freq})}
                            className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                              formData.frequency === freq ? 'border-secondary bg-secondary/5 text-primary' : 'border-slate-100 bg-white'
                            }`}
                          >
                            {freq}
                            {freq !== 'One-time' && <span className="block text-[10px] text-secondary">Save {freq === 'Weekly' ? '10%' : '5%'}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                       <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Preferred Date</label>
                       <input 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full p-4 rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary transition-all" 
                       />
                    </div>

                    <div>
                       <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Arrival Window</label>
                       <div className="grid grid-cols-2 gap-3">
                         {['Morning (8am - 12pm)', 'Afternoon (12pm - 4pm)'].map(time => (
                           <button
                             key={time}
                             onClick={() => setFormData({...formData, time})}
                             className={`p-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
                               formData.time === time ? 'border-secondary bg-secondary/5 text-primary' : 'border-slate-100 bg-white'
                             }`}
                           >
                             {time}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button onClick={prevStep} className="px-6 py-3 rounded-full border-2 border-slate-200 font-bold text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                       <ChevronLeft size={18} /> Back
                    </button>
                    <button onClick={nextStep} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      Next: Your Details <ChevronRight size={18} />
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
                  className="glass p-8 rounded-3xl"
                >
                  <h2 className="text-2xl font-bold text-primary-dark mb-6">Your Information</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input 
                      placeholder="First Name"
                      className="p-4 rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary"
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                    />
                    <input 
                      placeholder="Last Name"
                      className="p-4 rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary"
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <input 
                      placeholder="Email Address"
                      className="w-full p-4 rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                    <input 
                      placeholder="Phone Number"
                      className="w-full p-4 rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                    <input 
                      placeholder={region.id === 'UK' ? "Address (Street, City, Postcode)" : "Address (Street, City, State)"}
                      className="w-full p-4 rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                    <textarea 
                      placeholder="Special Instructions / Entry Notes"
                      rows="3"
                      className="w-full p-4 rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary"
                      value={formData.specialInstructions}
                      onChange={e => setFormData({...formData, specialInstructions: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button onClick={prevStep} className="px-6 py-3 rounded-full border-2 border-slate-200 font-bold text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                       <ChevronLeft size={18} /> Back
                    </button>
                    <button onClick={nextStep} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      Next: Payment <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass p-8 rounded-3xl text-center"
                >
                  <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="text-primary" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-primary-dark mb-2">Final Step: Payment</h2>
                  <p className="text-slate-500 mb-8">Securely complete your booking via {region.id === 'UK' ? 'Stripe' : 'Paystack'}</p>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl mb-8 text-left">
                    <div className="flex justify-between font-bold text-primary-dark mb-2">
                      <span>Total Due</span>
                      <span className="text-2xl">{region.symbol}{totalPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400">By clicking 'Confirm Booking', you agree to our Terms of Service and Privacy Policy.</p>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={prevStep} className="px-6 py-3 rounded-full border-2 border-slate-200 font-bold text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                       <ChevronLeft size={18} /> Back
                    </button>
                    <button className="btn-primary flex-1">
                      Confirm & Pay
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass p-6 rounded-3xl sticky top-24">
              <h3 className="font-bold text-primary-dark mb-4 pb-4 border-b border-slate-100 uppercase text-xs tracking-widest">Booking Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service</span>
                  <span className="font-bold text-primary-dark">{formData.serviceType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Space</span>
                  <span className="font-bold text-primary-dark">{formData.bedrooms} Bed, {formData.bathrooms} Bath</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Frequency</span>
                  <span className="font-bold text-primary-dark">{formData.frequency}</span>
                </div>
                {formData.extras.length > 0 && (
                   <div className="pt-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Extras</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.extras.map(e => (
                          <span key={e} className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-bold">{e}</span>
                        ))}
                      </div>
                   </div>
                )}
                {formData.date && (
                   <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date</span>
                    <span className="font-bold text-primary-dark">{formData.date}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t-2 border-dashed border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-primary-dark font-bold text-lg">Total</span>
                  <span className="text-3xl font-black text-primary">{region.symbol}{totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center italic">Includes all taxes and equipment</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Booking;
