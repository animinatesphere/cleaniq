import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegion } from '../context/RegionContext';
import { 
  ChevronRight, ChevronLeft, Calendar, User, 
  CreditCard, Home as HomeIcon, Briefcase, 
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
    livingRooms: 1,
    kitchens: 1,
    diningRooms: 0,
    hallways: 0,
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
                     (formData.bathrooms * (region.id === 'UK' ? 8 : 4000)) +
                     (formData.livingRooms * (region.id === 'UK' ? 12 : 6000)) +
                     (formData.kitchens * (region.id === 'UK' ? 15 : 8000)) +
                     (formData.diningRooms * (region.id === 'UK' ? 7 : 3500)) +
                     (formData.hallways * (region.id === 'UK' ? 5 : 2500));
    
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

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => s + 1);
  };
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => s - 1);
  };

  const steps = [
    { id: 1, title: 'Service', icon: <HomeIcon size={18} /> },
    { id: 2, title: 'Schedule', icon: <Calendar size={18} /> },
    { id: 3, title: 'Details', icon: <User size={18} /> },
    { id: 4, title: 'Payment', icon: <CreditCard size={18} /> },
  ];

  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="pt-28 min-h-screen bg-slate-50 pb-20 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Progress Stepper */}
        <div className="flex justify-between items-center mb-10 md:12 relative max-w-2xl mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <motion.div 
                initial={false}
                animate={{ 
                  backgroundColor: step >= s.id ? '#005B41' : '#FFFFFF',
                  color: step >= s.id ? '#FFFFFF' : '#94a3b8',
                  scale: step === s.id ? 1.1 : 1
                }}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  step >= s.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-slate-200'
                }`}
              >
                {step > s.id ? <CheckCircle2 size={18} className="md:w-6 md:h-6" /> : React.cloneElement(s.icon, { size: window.innerWidth < 768 ? 16 : 18 })}
              </motion.div>
              <span className={`text-[10px] md:text-xs font-bold mt-2 uppercase tracking-wider ${step >= s.id ? 'text-primary' : 'text-slate-400'} hidden sm:block`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-xl shadow-primary/5"
                >
                  <h2 className="text-xl md:text-3xl font-bold text-primary-dark mb-6 md:8">Choose Your Service</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 md:10">
                    {['Residential', 'Office', 'Move-out'].map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({...formData, serviceType: type})}
                        className={`p-5 md:p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 md:3 ${
                          formData.serviceType === type ? 'border-secondary bg-secondary/5 text-primary shadow-inner' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${formData.serviceType === type ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                          {type === 'Residential' ? <HomeIcon size={20}/> : type === 'Office' ? <Briefcase size={20}/> : <Trash2 size={20}/>}
                        </div>
                        <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">{type}</span>
                      </motion.button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:6">
                    <RoomCounter 
                      label="Bedrooms" 
                      sub="Sleep areas" 
                      value={formData.bedrooms} 
                      onChange={v => setFormData(p => ({...p, bedrooms: v}))} 
                    />
                    <RoomCounter 
                      label="Bathrooms" 
                      sub="Full or half" 
                      value={formData.bathrooms} 
                      onChange={v => setFormData(p => ({...p, bathrooms: v}))} 
                    />
                    <RoomCounter 
                      label="Living Rooms" 
                      sub="Lounge areas" 
                      value={formData.livingRooms} 
                      onChange={v => setFormData(p => ({...p, livingRooms: v}))} 
                    />
                    <RoomCounter 
                      label="Kitchens" 
                      sub="Cooking spaces" 
                      value={formData.kitchens} 
                      onChange={v => setFormData(p => ({...p, kitchens: v}))} 
                    />
                    <RoomCounter 
                      label="Dining Rooms" 
                      sub="Eating areas" 
                      value={formData.diningRooms} 
                      onChange={v => setFormData(p => ({...p, diningRooms: v}))} 
                      min={0}
                    />
                    <RoomCounter 
                      label="Hallways / Stairs" 
                      sub="Transition areas" 
                      value={formData.hallways} 
                      onChange={v => setFormData(p => ({...p, hallways: v}))} 
                      min={0}
                    />
                  </div>

                  <h3 className="font-bold text-primary-dark mt-8 md:10 mb-5 md:6 uppercase text-[10px] md:text-xs tracking-widest">Premium Extras</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:4">
                    {['Deep Clean', 'Inside Fridge', 'Inside Oven', 'Windows (Inside)'].map((extra, idx) => (
                      <motion.button
                        key={extra}
                        variants={fieldVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 + (idx * 0.05) }}
                        onClick={() => toggleExtra(extra)}
                        className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 transition-all flex items-center gap-3 md:4 ${
                          formData.extras.includes(extra) ? 'border-secondary bg-secondary/5 text-primary' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${formData.extras.includes(extra) ? 'bg-secondary text-primary' : 'bg-slate-50 text-slate-400'}`}>
                          <Plus size={16} />
                        </div>
                        <span className="text-xs md:text-sm font-bold">{extra}</span>
                      </motion.button>
                    ))}
                  </div>

                  <button onClick={nextStep} className="btn-primary w-full mt-10 md:12 py-4 flex items-center justify-center gap-2 text-base md:text-lg">
                    Continue to Schedule <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-xl shadow-primary/5"
                >
                  <h2 className="text-xl md:text-3xl font-bold text-primary-dark mb-6 md:8">Scheduling</h2>
                  
                  <div className="space-y-6 md:8">
                    <div>
                      <label className="block text-[10px] md:text-xs font-black text-slate-400 mb-3 md:4 uppercase tracking-widest">Cleaning Frequency</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:3">
                        {['One-time', 'Weekly', 'Bi-weekly'].map(freq => (
                          <button
                            key={freq}
                            onClick={() => setFormData({...formData, frequency: freq})}
                            className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 text-xs md:text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                              formData.frequency === freq ? 'border-secondary bg-secondary/5 text-primary' : 'border-slate-100 bg-white shadow-sm'
                            }`}
                          >
                            {freq}
                            {freq !== 'One-time' && <span className="text-[8px] md:text-[10px] bg-secondary/20 px-2 py-0.5 rounded-full text-primary">Save {freq === 'Weekly' ? '10%' : '5%'}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                       <label className="block text-[10px] md:text-xs font-black text-slate-400 mb-3 md:4 uppercase tracking-widest">Preferred Date</label>
                       <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input 
                          type="date" 
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="w-full p-3 md:p-4 pl-12 rounded-xl md:rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary transition-all bg-white shadow-sm font-semibold text-sm md:text-base" 
                         />
                       </div>
                    </div>

                    <div>
                       <label className="block text-[10px] md:text-xs font-black text-slate-400 mb-3 md:4 uppercase tracking-widest">Arrival Window</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:4">
                         {['Morning (8am - 12pm)', 'Afternoon (12pm - 4pm)'].map(time => (
                           <button
                             key={time}
                             onClick={() => setFormData({...formData, time})}
                             className={`p-4 md:p-5 rounded-xl md:rounded-2xl border-2 text-xs md:text-sm font-bold transition-all ${
                               formData.time === time ? 'border-secondary bg-secondary/5 text-primary' : 'border-slate-100 bg-white shadow-sm text-slate-500'
                             }`}
                           >
                             {time}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:4 mt-10 md:12">
                    <button onClick={prevStep} className="px-6 md:8 py-4 rounded-full border-2 border-slate-200 font-bold text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all text-sm md:text-base">
                       <ChevronLeft size={18} /> Back
                    </button>
                    <button onClick={nextStep} className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base md:text-lg">
                       Details <ChevronRight size={18} />
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
                  className="glass p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-xl shadow-primary/5"
                >
                  <h2 className="text-xl md:text-3xl font-bold text-primary-dark mb-6 md:8">Personal Information</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:4 mb-3 md:4">
                    <input 
                      placeholder="First Name"
                      className="p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary shadow-sm text-sm md:text-base"
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                    />
                    <input 
                      placeholder="Last Name"
                      className="p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary shadow-sm text-sm md:text-base"
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3 md:4">
                    <input 
                      placeholder="Email Address"
                      className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary shadow-sm text-sm md:text-base"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                    <input 
                      placeholder="Phone Number"
                      className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary shadow-sm text-sm md:text-base"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                    <input 
                      placeholder={region.id === 'UK' ? "Address (Street, City, Postcode)" : "Address (Street, City, State)"}
                      className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary shadow-sm text-sm md:text-base"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                    <textarea 
                      placeholder="Special Instructions / Entry Notes"
                      rows="3"
                      className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 focus:outline-none focus:border-secondary shadow-sm resize-none text-sm md:text-base"
                      value={formData.specialInstructions}
                      onChange={e => setFormData({...formData, specialInstructions: e.target.value})}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:4 mt-10 md:12">
                    <button onClick={prevStep} className="px-6 md:8 py-4 rounded-full border-2 border-slate-200 font-bold text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2 text-sm md:text-base">
                       <ChevronLeft size={18} /> Back
                    </button>
                    <button onClick={nextStep} className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base md:text-lg">
                      Payment <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass p-6 md:p-12 rounded-[32px] md:rounded-[40px] text-center shadow-2xl shadow-primary/10"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    className="w-16 h-16 md:w-24 md:h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 md:8"
                  >
                    <CreditCard className="text-primary" size={window.innerWidth < 768 ? 28 : 40} />
                  </motion.div>
                  <h2 className="text-xl md:text-3xl font-bold text-primary-dark mb-2 md:3">Complete Booking</h2>
                  <p className="text-slate-500 mb-8 md:10 text-sm md:text-lg font-medium">Securely complete your payment via {region.id === 'UK' ? 'Stripe' : 'Paystack'}</p>
                  
                  <div className="bg-slate-50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] mb-8 md:10 text-left border border-slate-100">
                    <div className="flex justify-between font-black text-primary-dark mb-3 md:4 items-end">
                      <span className="text-slate-400 text-[10px] md:text-sm uppercase tracking-widest">Total to Pay</span>
                      <span className="text-2xl md:text-4xl">{region.symbol}{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-200 mb-3 md:4" />
                    <p className="text-[10px] text-slate-400 text-center italic font-medium">
                      By clicking 'Confirm & Pay', you agree to our Terms of Service and Privacy Policy. All payments are encrypted and secure.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:4">
                    <button onClick={prevStep} className="px-6 md:8 py-4 rounded-full border-2 border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm md:text-base">
                       Back
                    </button>
                    <button className="btn-primary flex-1 py-4 text-base md:text-xl shadow-2xl shadow-primary/20">
                      Confirm & Pay Now
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Booking Summary Sidebar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass p-6 md:p-8 rounded-[32px] md:rounded-[40px] lg:sticky lg:top-24 shadow-xl shadow-primary/5 border border-white/50">
              <h3 className="font-black text-primary-dark mb-4 md:6 pb-3 md:4 border-b border-slate-100 uppercase text-[10px] md:text-xs tracking-[0.2em]">Summary</h3>
              
              <div className="space-y-4 md:6 mb-8 md:10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Service</span>
                  <span className="font-bold text-primary-dark bg-secondary/10 px-2 md:3 py-1 rounded-lg text-xs md:text-sm">{formData.serviceType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Rooms</span>
                  <div className="text-right">
                    <span className="font-bold text-primary-dark text-xs md:text-sm block">{formData.bedrooms} Bed, {formData.bathrooms} Bath</span>
                    <span className="text-[10px] text-slate-400 font-medium">{formData.livingRooms} Living, {formData.kitchens} Kitchen</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Frequency</span>
                  <span className="font-bold text-primary-dark text-xs md:text-sm">{formData.frequency}</span>
                </div>
                {formData.extras.length > 0 && (
                   <div>
                      <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Selected Extras</span>
                      <div className="flex flex-wrap gap-2">
                        {formData.extras.map(e => (
                          <span key={e} className="text-[8px] md:text-[10px] bg-primary/5 text-primary px-2 md:3 py-1 md:1.5 rounded-lg md:xl font-bold border border-primary/10">{e}</span>
                        ))}
                      </div>
                   </div>
                )}
                {formData.date && (
                   <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Date</span>
                    <span className="font-bold text-primary-dark text-xs md:text-sm">{new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 md:8 border-t-4 border-dotted border-slate-100 text-center">
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Total Estimate</span>
                <div className="text-2xl md:text-4xl font-black text-primary drop-shadow-sm">{region.symbol}{totalPrice.toLocaleString()}</div>
                <p className="text-[8px] md:text-[10px] text-slate-400 mt-3 md:4 leading-relaxed font-medium">Includes professional equipment, eco-supplies, and our 48-hour satisfaction guarantee.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

const RoomCounter = ({ label, sub, value, onChange, min = 1 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-between items-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm"
    >
      <div>
        <span className="block font-bold text-primary-dark text-sm md:text-base">{label}</span>
        <span className="text-[10px] md:text-xs text-slate-400 font-medium">{sub}</span>
      </div>
      <div className="flex items-center gap-3 md:4">
        <button 
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))} 
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-primary transition-colors disabled:opacity-30"
          disabled={value <= min}
        >
          <Minus size={14}/>
        </button>
        <span className="w-4 text-center font-black text-base md:text-lg text-primary-dark">{value}</span>
        <button 
          type="button"
          onClick={() => onChange(value + 1)} 
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-primary transition-colors"
        >
          <Plus size={14}/>
        </button>
      </div>
    </motion.div>
  );
};

export default Booking;
