import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegion } from '../context/RegionContext';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Calendar, User, 
  CreditCard, Home as HomeIcon, Briefcase, 
  Trash2, Plus, Minus, CheckCircle2, MapPin, 
  Clock, Info, ShieldCheck, Heart,Star
} from 'lucide-react';

const Booking = () => {
  const { region } = useRegion();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isNavSticky, setIsNavSticky] = useState(false);
  
  const [formData, setFormData] = useState({
    address: '',
    postcode: '',
    serviceType: 'Classic One-off', // Classic Regular, Classic One-off, Deep Clean
    frequency: 'Once', // Weekly, Fortnightly, Monthly, Once
    propertySize: '1 Bed Flat', // New field for NG
    duration: 2, // hours (for UK)
    extras: [],
    hasPets: false,
    date: '',
    timeSlot: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialInstructions: '',
  });

  const [totalPrice, setTotalPrice] = useState(0);

  // Pricing Logic (Region-aware)
  useEffect(() => {
    let total = 0;

    if (region.id === 'UK') {
      // UK: Hourly Pricing
      let hourlyRate = 18;
      if (formData.serviceType === 'Deep Clean') hourlyRate += 12;
      if (formData.serviceType === 'Classic Regular') hourlyRate -= 2;
      if (formData.serviceType === 'Airbnb Cleaning') hourlyRate += 5;
      total = hourlyRate * formData.duration;
    } else {
      // Nigeria: Property-based Flat Rates
      const flatRates = {
        '1 Bed Flat': 15000,
        '2 Bed Flat': 22000,
        '3 Bed House': 35000,
        '4 Bed House': 45000,
        '5+ Bed House': 60000
      };
      total = flatRates[formData.propertySize] || 15000;
      
      if (formData.serviceType === 'Deep Clean') total *= 1.8;
      if (formData.serviceType === 'Airbnb Cleaning') total *= 1.3;
    }

    // Extra costs
    formData.extras.forEach(extra => {
      const extraPrices = {
        'Ironing': region.id === 'UK' ? 5 : 5000,
        'Cleaning Products': region.id === 'UK' ? 3 : 3000,
        'Inside Fridge': region.id === 'UK' ? 12 : 7000,
        'Inside Oven': region.id === 'UK' ? 15 : 10000,
      };
      total += (extraPrices[extra] || 0);
    });

    // Frequency Discount
    if (formData.frequency === 'Weekly') total *= 0.9;
    if (formData.frequency === 'Fortnightly') total *= 0.95;

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
    setStep(s => Math.min(s + 1, 8));
  };
  
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => Math.max(s - 1, 1));
  };

  const steps = [
    { id: 1, title: 'Location' },
    { id: 2, title: 'Service' },
    { id: 3, title: 'Frequency' },
    { id: 4, title: 'Duration' },
    { id: 5, title: 'Extras' },
    { id: 6, title: 'Pets' },
    { id: 7, title: 'Schedule' },
    { id: 8, title: 'Payment' },
  ];

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const [[page, direction], setPage] = useState([step, 0]);

  useEffect(() => {
    setPage([step, step > page ? 1 : -1]);
  }, [step]);

  if (isSubmitted) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-[60px] p-8 md:p-16 text-center shadow-2xl border-8 border-white"
        >
          <div className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-primary/30 rotate-12">
            <CheckCircle2 size={48} className="text-white -rotate-12" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-primary-dark mb-6 tracking-tighter">Booking Confirmed!</h1>
          <p className="text-lg text-slate-500 font-medium mb-12 leading-relaxed">
            Your professional cleaner is now being assigned. We've sent a confirmation email to <span className="text-primary font-bold">{formData.email}</span> with all the details.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-12 text-left">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service</p>
              <p className="font-bold text-primary-dark">{formData.serviceType}</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Scheduled For</p>
              <p className="font-bold text-primary-dark">{new Date(formData.date).toLocaleDateString()} @ {formData.timeSlot}</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Address</p>
              <p className="font-bold text-primary-dark truncate">{formData.address}</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Paid</p>
              <p className="font-bold text-primary-dark">{region.symbol}{totalPrice}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/" className="btn-primary flex-1 py-5">Back to Home</Link>
            <button onClick={() => window.print()} className="btn-secondary px-8 py-5 flex items-center justify-center gap-2">
              <Info size={20} /> Print Receipt
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-white pb-32">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        
        {/* Simple Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8 md:mb-12 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / 8) * 100}%` }}
            className="h-full bg-primary"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2 min-h-[500px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
              >
                {step === 1 && (
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">Where should we clean?</h1>
                    <p className="text-slate-500 text-lg">Enter your address to see availability in your area.</p>
                    
                    <div className="space-y-4">
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
                        <input 
                          type="text"
                          placeholder="Street address and number"
                          className="w-full p-5 pl-14 rounded-2xl border-2 border-slate-100 focus:border-primary focus:outline-none text-lg font-medium transition-all bg-slate-50/50"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text"
                          placeholder={region.id === 'UK' ? "Postcode" : "Postal Code"}
                          className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-primary focus:outline-none text-lg font-medium transition-all bg-slate-50/50"
                          value={formData.postcode}
                          onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex gap-4">
                      <ShieldCheck className="text-primary shrink-0" size={24} />
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Your address is used only to find professionals nearby. We never share your details without a confirmed booking.
                      </p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">What type of cleaning?</h1>
                    <div className="grid gap-4">
                      {[
                        { id: 'Classic Regular', title: 'Classic regular', desc: 'The same pro, every week or two.', icon: <Heart size={24}/> },
                        { id: 'Classic One-off', title: 'Classic one-off', desc: 'A thorough clean whenever you need.', icon: <HomeIcon size={24}/> },
                        { id: 'Deep Clean', title: 'Deep clean', desc: 'For moving or seasonal refreshment.', icon: <Trash2 size={24}/> },
                        { id: 'Airbnb Cleaning', title: 'Airbnb turnover', desc: 'Guest-ready cleaning between stays.', icon: <Star size={24}/> }
                      ].map((type) => (
                        <div 
                          key={type.id}
                          onClick={() => setFormData({...formData, serviceType: type.id, frequency: type.id === 'Classic Regular' ? 'Weekly' : 'Once'})}
                          className={`selection-card p-6 flex-row items-center gap-6 ${formData.serviceType === type.id ? 'selection-card-active' : 'selection-card-inactive'}`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${formData.serviceType === type.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {type.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold">{type.title}</h3>
                            <p className="text-sm opacity-70">{type.desc}</p>
                          </div>
                          {formData.serviceType === type.id && <CheckCircle2 className="text-primary" size={24} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">How often?</h1>
                    <div className="grid gap-4">
                      {[
                        { id: 'Weekly', title: 'Once a week', badge: 'Save 10%' },
                        { id: 'Fortnightly', title: 'Every two weeks', badge: 'Save 5%' },
                        { id: 'Monthly', title: 'Once a month', badge: null },
                        { id: 'Once', title: 'Just this once', badge: null }
                      ].map((freq) => (
                        <div 
                          key={freq.id}
                          onClick={() => setFormData({...formData, frequency: freq.id})}
                          className={`selection-card p-6 flex-row items-center justify-between ${formData.frequency === freq.id ? 'selection-card-active' : 'selection-card-inactive'}`}
                        >
                          <span className="text-xl font-bold">{freq.title}</span>
                          <div className="flex items-center gap-3">
                            {freq.badge && <span className="text-xs font-black bg-secondary text-primary px-3 py-1 rounded-full uppercase">{freq.badge}</span>}
                            {formData.frequency === freq.id && <CheckCircle2 className="text-primary" size={24} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">
                      {region.id === 'UK' ? 'How many hours?' : 'Property size?'}
                    </h1>
                    
                    {region.id === 'UK' ? (
                      <>
                        <div className="flex items-center justify-center gap-8 bg-slate-50 p-10 rounded-[40px] border-2 border-slate-100">
                          <button 
                            onClick={() => setFormData({...formData, duration: Math.max(2, formData.duration - 0.5)})}
                            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-primary hover:scale-110 active:scale-90 transition-all border border-slate-100"
                          >
                            <Minus size={32} />
                          </button>
                          <div className="text-center min-w-[120px]">
                            <span className="text-4xl md:text-6xl font-black text-primary-dark">{formData.duration}</span>
                            <span className="text-xl md:text-2xl font-bold text-slate-400 ml-2">h</span>
                          </div>
                          <button 
                            onClick={() => setFormData({...formData, duration: Math.min(8, formData.duration + 0.5)})}
                            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-primary hover:scale-110 active:scale-90 transition-all border border-slate-100"
                          >
                            <Plus size={32} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { h: 2, label: '1 Bed Flat' },
                            { h: 3, label: '2 Bed Home' },
                            { h: 4, label: '3 Bed Home' },
                            { h: 5, label: 'Large Villa' }
                          ].map(sug => (
                            <button 
                              key={sug.h}
                              onClick={() => setFormData({...formData, duration: sug.h})}
                              className={`p-4 rounded-2xl border-2 text-center transition-all ${formData.duration === sug.h ? 'border-primary bg-primary text-white' : 'border-slate-100 bg-white text-slate-500'}`}
                            >
                              <div className="text-lg font-black">{sug.h}h</div>
                              <div className="text-[10px] uppercase font-bold opacity-70">{sug.label}</div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="grid gap-4">
                        {[
                          '1 Bed Flat', 
                          '2 Bed Flat', 
                          '3 Bed House', 
                          '4 Bed House', 
                          '5+ Bed House'
                        ].map(size => (
                          <div 
                            key={size}
                            onClick={() => setFormData({...formData, propertySize: size})}
                            className={`selection-card p-6 flex-row items-center justify-between ${formData.propertySize === size ? 'selection-card-active' : 'selection-card-inactive'}`}
                          >
                            <span className="text-xl font-bold">{size}</span>
                            {formData.propertySize === size && <CheckCircle2 className="text-primary" size={24} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">Any extras?</h1>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { id: 'Ironing', icon: <Info size={20}/> },
                        { id: 'Cleaning Products', icon: <ShieldCheck size={20}/> },
                        { id: 'Inside Fridge', icon: <Plus size={20}/> },
                        { id: 'Inside Oven', icon: <Plus size={20}/> },
                      ].map((extra) => (
                        <div 
                          key={extra.id}
                          onClick={() => toggleExtra(extra.id)}
                          className={`selection-card p-5 flex-row items-center gap-4 ${formData.extras.includes(extra.id) ? 'selection-card-active' : 'selection-card-inactive'}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.extras.includes(extra.id) ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                            {extra.icon}
                          </div>
                          <span className="font-bold">{extra.id}</span>
                          <div className="ml-auto">
                            {formData.extras.includes(extra.id) ? <CheckCircle2 size={20}/> : <Plus size={20} className="opacity-30"/>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">Any pets?</h1>
                    <p className="text-slate-500 text-lg">We need to know for our cleaners who might have allergies.</p>
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { id: true, label: 'Yes', sub: 'I have pets' },
                        { id: false, label: 'No', sub: 'No pets here' }
                      ].map((opt) => (
                        <div 
                          key={String(opt.id)}
                          onClick={() => setFormData({...formData, hasPets: opt.id})}
                          className={`selection-card p-10 items-center justify-center text-center ${formData.hasPets === opt.id ? 'selection-card-active' : 'selection-card-inactive'}`}
                        >
                          <span className="text-3xl font-black mb-1">{opt.label}</span>
                          <span className="text-sm opacity-70 font-medium">{opt.sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">When should we come?</h1>
                        <p className="text-slate-500 text-lg mt-2">Select a date that works best for you.</p>
                      </div>
                      <div className="flex items-center gap-2 text-primary font-bold bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                        <Calendar size={20} />
                        <span>Next 30 Days</span>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <CustomCalendar 
                        selectedDate={formData.date} 
                        onSelect={(date) => setFormData({...formData, date})} 
                      />

                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Arrival window</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {['08:00', '10:30', '13:00', '15:30', '18:00'].map(slot => (
                            <button
                              key={slot}
                              onClick={() => setFormData({...formData, timeSlot: slot})}
                              className={`p-4 rounded-2xl border-2 font-black transition-all flex flex-col items-center gap-1 ${
                                formData.timeSlot === slot 
                                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                              }`}
                            >
                              <Clock size={16} className={formData.timeSlot === slot ? 'text-white' : 'text-slate-300'} />
                              <span className="text-sm">{slot}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-4">
                          Pro Tip: Morning slots usually have the best availability!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 8 && (
                  <div className="space-y-8">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">Almost done!</h1>
                    <p className="text-slate-500 text-lg">Please provide your contact details to finalize the booking.</p>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          placeholder="First Name" 
                          className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-primary focus:outline-none transition-all"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                        <input 
                          placeholder="Last Name" 
                          className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-primary focus:outline-none transition-all"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                      </div>
                      <input 
                        placeholder="Email Address" 
                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-primary focus:outline-none transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        type="email"
                      />
                      <input 
                        placeholder="Phone Number" 
                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-primary focus:outline-none transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        type="tel"
                      />
                      <textarea 
                        placeholder="Special instructions for the pro..." 
                        rows="3" 
                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-primary focus:outline-none transition-all resize-none"
                        value={formData.specialInstructions}
                        onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Basket Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[32px] p-6 md:p-8 border-2 border-slate-50 shadow-2xl shadow-slate-200/50 sticky top-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-xl font-black text-primary-dark uppercase tracking-tight">My Basket.</h2>
              </div>

              <div className="space-y-1 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="basket-item">
                  <span className="text-slate-500 font-medium">Service</span>
                  <span className="font-bold text-primary-dark">{formData.serviceType}</span>
                </div>
                <div className="basket-item">
                  <span className="text-slate-500 font-medium">
                    {region.id === 'UK' ? 'Duration' : 'Size'}
                  </span>
                  <span className="font-bold text-primary-dark">
                    {region.id === 'UK' ? `${formData.duration}h` : formData.propertySize}
                  </span>
                </div>
                <div className="basket-item">
                  <span className="text-slate-500 font-medium">Frequency</span>
                  <span className="font-bold text-primary-dark">{formData.frequency}</span>
                </div>
                {formData.extras.map(e => (
                  <div key={e} className="basket-item">
                    <span className="text-slate-500 font-medium text-xs">+ {e}</span>
                    <span className="font-bold text-primary-dark text-xs">Included</span>
                  </div>
                ))}
                {formData.date && (
                  <div className="basket-item">
                    <span className="text-slate-500 font-medium">Scheduled</span>
                    <span className="font-bold text-primary-dark">{new Date(formData.date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t-2 border-dashed border-slate-100">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total</span>
                  <div className="text-right">
                    <span className="text-3xl md:text-4xl font-black text-primary">{region.symbol}{totalPrice}</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">VAT Included</p>
                  </div>
                </div>
              </div>

              <div className="hidden md:block mt-8">
                <button 
                  onClick={() => step === 8 ? setIsSubmitted(true) : nextStep()}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {step === 8 ? 'Confirm Booking' : 'Next Step'} <ChevronRight size={20} />
                </button>
                {step > 1 && (
                  <button 
                    onClick={prevStep}
                    className="w-full py-4 mt-3 text-slate-400 font-bold hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Bottom Nav (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 md:hidden z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
             <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Estimated Total</span>
             <span className="text-xl font-black text-primary">{region.symbol}{totalPrice}</span>
          </div>
          <div className="flex gap-2">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="w-12 h-12 rounded-xl border-2 border-slate-100 flex items-center justify-center text-slate-400"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <button 
              onClick={() => step === 8 ? setIsSubmitted(true) : nextStep()}
              className="px-8 h-12 bg-primary text-white rounded-xl font-black text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {step === 8 ? 'Confirm' : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomCalendar = ({ selectedDate, onSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const days = [];
  const totalDays = daysInMonth(year, month);
  const offset = firstDayOfMonth(year, month);

  // Fill empty slots for previous month
  for (let i = 0; i < offset; i++) {
    days.push(null);
  }

  // Fill actual days
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const d = new Date(date);
    const s = new Date(selectedDate);
    return d.toDateString() === s.toDateString();
  };

  const isToday = (date) => {
    if (!date) return false;
    return new Date(date).toDateString() === new Date().toDateString();
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-50 p-6 shadow-xl shadow-slate-100/50">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-primary-dark">
          {monthNames[month]} <span className="text-slate-300 font-bold ml-1">{year}</span>
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(new Date(year, month - 1))}
            className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 text-center mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] font-black uppercase tracking-widest text-slate-300 py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;
          
          const disabled = isPast(date);
          const active = isSelected(date);
          const today = isToday(date);

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onSelect(date.toISOString().split('T')[0])}
              className={`
                aspect-square rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all relative
                ${active ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10' : ''}
                ${!active && !disabled ? 'hover:bg-primary/5 text-primary-dark font-bold' : ''}
                ${disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                ${today && !active ? 'border-2 border-primary/20' : ''}
              `}
            >
              <span className="text-sm md:text-lg">{date.getDate()}</span>
              {today && !active && <div className="w-1 h-1 bg-primary rounded-full absolute bottom-2" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Booking;
