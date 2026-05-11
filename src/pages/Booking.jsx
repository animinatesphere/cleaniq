import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegion } from '../context/RegionContext';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Calendar, User, 
  CreditCard, Home as HomeIcon, Briefcase, 
  Trash2, Plus, Minus, CheckCircle2, MapPin, 
  Clock, Info, ShieldCheck, Heart, Star,
  Search, Sparkles, Zap
} from 'lucide-react';

const Booking = () => {
  const { region } = useRegion();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  
  const [formData, setFormData] = useState({
    address: '',
    postcode: '',
    serviceType: 'Classic One-off', 
    frequency: 'Once', 
    propertySize: '1 Bed Flat', 
    duration: 2, 
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

  // Pricing Logic (Updated with User Rates)
  useEffect(() => {
    let total = 0;

    if (region.id === 'UK') {
      const rates = {
        'Classic Regular': 17.90,
        'Classic One-off': 20.90,
        'Deep Clean': 24.90,
        'Holiday Rental': 21.90
      };
      total = (rates[formData.serviceType] || 20.90) * formData.duration;
    } else {
      const flatRates = {
        '1 Bed Flat': 15000,
        '2 Bed Flat': 22000,
        '3 Bed House': 35000,
        '4 Bed House': 45000,
        '5+ Bed House': 60000
      };
      total = flatRates[formData.propertySize] || 15000;
      if (formData.serviceType === 'Deep Clean') total *= 1.8;
      if (formData.serviceType === 'Holiday Rental') total *= 1.3;
    }

    formData.extras.forEach(extra => {
      const extraPrices = {
        'Ironing': region.id === 'UK' ? 5 : 5000,
        'Cleaning Products': region.id === 'UK' ? 3 : 3000,
        'Inside Fridge': region.id === 'UK' ? 12 : 7000,
        'Inside Oven': region.id === 'UK' ? 15 : 10000,
      };
      total += (extraPrices[extra] || 0);
    });

    if (formData.frequency === 'Weekly') total *= 0.9;
    if (formData.frequency === 'Fortnightly') total *= 0.95;

    setTotalPrice(Math.round(total * 100) / 100);
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

  const [[page, direction], setPage] = useState([step, 0]);

  useEffect(() => {
    setPage([step, step > page ? 1 : -1]);
  }, [step]);

  // Address Suggestions Logic (Photon API - High Performance Map Suggestions)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (formData.address.length < 3) {
        setAddressSuggestions([]);
        return;
      }
      try {
        // Querying for addresses globally but Photon is very fast for UK/Nigeria
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(formData.address)}&limit=5`);
        const data = await response.json();
        const formatted = data.features.map(f => {
          const { name, street, housenumber, city, postcode, country } = f.properties;
          // Format based on available properties
          const main = [housenumber, street, name].filter(Boolean).join(" ");
          const details = [city, postcode, country].filter(Boolean).join(", ");
          return main ? `${main}, ${details}` : details;
        });
        // Filter unique and limit
        setAddressSuggestions([...new Set(formatted)].slice(0, 5));
      } catch (err) {
        console.error("Suggestions fetch error:", err);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.address]);

  const selectAddress = (addr) => {
    setFormData({...formData, address: addr});
    setShowSuggestions(false);
    setTimeout(() => nextStep(), 300);
  };

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
          <div className="grid md:grid-cols-2 gap-4 mb-12 text-left">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Paid</p>
              <p className="font-bold text-primary-dark">{region.symbol}{totalPrice}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/" className="btn-primary flex-1 py-5">Back to Home</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-[#FCFCFD] pb-32">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        
        {/* Minimized Progress Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-2 mb-4">
            {steps.map((s) => (
              <div 
                key={s.id} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s.id === step ? 'w-8 bg-primary' : 
                  s.id < step ? 'w-3 bg-primary/40' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Step {step} of 8</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          
          <div className="lg:col-span-2 min-h-[500px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {step === 1 && (
                  <div className="max-w-xl mx-auto text-center space-y-8 py-10">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                      <MapPin size={40} />
                    </div>
                    <div>
                      <h1 className="text-4xl md:text-5xl font-black text-primary-dark tracking-tight mb-4">Find your professional.</h1>
                      <p className="text-slate-500 text-lg">Enter your address to see availability in your area.</p>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        <Search size={24} />
                      </div>
                      <input 
                        type="text"
                        placeholder="Type your address..."
                        className="w-full p-8 pl-16 rounded-[32px] border-none shadow-2xl shadow-slate-200 focus:ring-4 focus:ring-primary/10 focus:outline-none text-xl font-bold transition-all bg-white"
                        value={formData.address}
                        onChange={(e) => {
                          setFormData({...formData, address: e.target.value});
                          setShowSuggestions(e.target.value.length > 2);
                        }}
                      />
                      
                      {/* Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 text-left"
                          >
                            {addressSuggestions.map((addr, i) => (
                              <button 
                                key={i}
                                onClick={() => selectAddress(addr)}
                                className="w-full p-6 hover:bg-slate-50 flex items-center gap-4 text-slate-700 font-bold border-b border-slate-50 last:border-none transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                                  <MapPin size={16} className="text-primary" />
                                </div>
                                <span className="text-sm md:text-base line-clamp-1">{addr}</span>
                              </button>
                            ))}
                            {addressSuggestions.length === 0 && (
                              <div className="p-10 text-center text-slate-400 font-medium italic">
                                Search for your address...
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="text-secondary" size={20} />
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Service Selection</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-primary-dark tracking-tight">What type of cleaning?</h1>
                    
                    <div className="grid gap-6">
                      {[
                        { 
                          id: 'Classic Regular', 
                          title: 'Classic regular cleaning', 
                          price: '£17.90/h', 
                          oldPrice: '£20.90/h',
                          bullets: [
                            'No obligation, stop or pause at any time free of charge',
                            'The same cleaner each time, subject to your approval after your first session',
                            'Window cleaning included',
                            'Ironing available on request'
                          ],
                          icon: <Heart />
                        },
                        { 
                          id: 'Classic One-off', 
                          title: 'Classic one-off cleaning', 
                          price: '£20.90/h', 
                          bullets: [
                            'For only one session',
                            'Window cleaning included',
                            'Ironing available on request'
                          ],
                          icon: <HomeIcon />
                        },
                        { 
                          id: 'Deep Clean', 
                          title: 'Deep cleaning', 
                          price: '£24.90/h', 
                          bullets: [
                            'For a spring clean',
                            'Window cleaning included',
                            'Household cleaning products can be supplied on request'
                          ],
                          icon: <Trash2 />
                        },
                        { 
                          id: 'Holiday Rental', 
                          title: 'Holiday rental cleaning', 
                          price: '£21.90/h', 
                          bullets: [
                            'For Airbnb & holiday rentals',
                            'Get the place ready for your next guests',
                            'Window cleaning included',
                            'Please provide a washing machine, dryer, and detergent if on-site linen and towel washing is required'
                          ],
                          icon: <Zap />
                        }
                      ].map((type) => (
                        <div 
                          key={type.id}
                          onClick={() => setFormData({...formData, serviceType: type.id, frequency: type.id === 'Classic Regular' ? 'Weekly' : 'Once'})}
                          className={`p-1 rounded-[32px] transition-all duration-500 cursor-pointer ${
                            formData.serviceType === type.id 
                            ? 'bg-gradient-to-br from-primary to-primary-dark shadow-xl shadow-primary/20 scale-[1.02]' 
                            : 'bg-white border border-slate-200 hover:border-primary/30'
                          }`}
                        >
                          <div className="bg-inherit rounded-[31px] p-8">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.serviceType === type.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-primary'}`}>
                                  {type.icon}
                                </div>
                                <h3 className={`text-xl md:text-2xl font-black ${formData.serviceType === type.id ? 'text-white' : 'text-primary-dark'}`}>
                                  {type.title}
                                </h3>
                              </div>
                              <div className="text-right">
                                {type.oldPrice && <span className={`text-sm line-through block ${formData.serviceType === type.id ? 'text-white/50' : 'text-slate-400'}`}>{type.oldPrice}</span>}
                                <span className={`text-2xl font-black ${formData.serviceType === type.id ? 'text-white' : 'text-primary'}`}>{type.price}</span>
                              </div>
                            </div>

                            <AnimatePresence>
                              {formData.serviceType === type.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-6 border-t border-white/10 space-y-3">
                                    {type.bullets.map((b, i) => (
                                      <div key={i} className="flex items-start gap-3 text-sm font-medium text-white/80">
                                        <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                                        {b}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
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
                          className={`selection-card p-8 flex-row items-center justify-between ${formData.frequency === freq.id ? 'selection-card-active' : 'selection-card-inactive'}`}
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
                      <div className="flex items-center justify-center gap-8 bg-white p-12 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-100/50">
                        <button 
                          onClick={() => setFormData({...formData, duration: Math.max(2, formData.duration - 0.5)})}
                          className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                        >
                          <Minus size={32} />
                        </button>
                        <div className="text-center min-w-[120px]">
                          <span className="text-6xl md:text-8xl font-black text-primary-dark tracking-tighter">{formData.duration}</span>
                          <span className="text-2xl font-bold text-slate-300 ml-2">h</span>
                        </div>
                        <button 
                          onClick={() => setFormData({...formData, duration: Math.min(8, formData.duration + 0.5)})}
                          className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                        >
                          <Plus size={32} />
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {['1 Bed Flat', '2 Bed Flat', '3 Bed House', '4 Bed House', '5+ Bed House'].map(size => (
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
                          className={`selection-card p-6 flex-row items-center gap-4 ${formData.extras.includes(extra.id) ? 'selection-card-active' : 'selection-card-inactive'}`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.extras.includes(extra.id) ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                            {extra.icon}
                          </div>
                          <span className="font-bold">{extra.id}</span>
                          <div className="ml-auto">
                            {formData.extras.includes(extra.id) ? <CheckCircle2 size={24}/> : <Plus size={24} className="opacity-10"/>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-8 py-10">
                    <h1 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tight text-center">Any pets?</h1>
                    <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                      {[
                        { id: true, label: 'Yes' },
                        { id: false, label: 'No' }
                      ].map((opt) => (
                        <div 
                          key={String(opt.id)}
                          onClick={() => setFormData({...formData, hasPets: opt.id})}
                          className={`selection-card p-12 items-center justify-center text-center ${formData.hasPets === opt.id ? 'selection-card-active shadow-2xl' : 'selection-card-inactive'}`}
                        >
                          <span className="text-4xl font-black">{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-8">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">When should we come?</h1>
                    <CustomCalendar 
                      selectedDate={formData.date} 
                      onSelect={(date) => setFormData({...formData, date})} 
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {['08:00', '10:30', '13:00', '15:30', '18:00'].map(slot => (
                        <button
                          key={slot}
                          onClick={() => setFormData({...formData, timeSlot: slot})}
                          className={`p-5 rounded-2xl border-2 font-black transition-all ${
                            formData.timeSlot === slot 
                              ? 'border-primary bg-primary text-white' 
                              : 'border-slate-100 bg-white text-slate-500'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 8 && (
                  <div className="space-y-8">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">Personal Details</h1>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input placeholder="First Name" className="booking-input" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                        <input placeholder="Last Name" className="booking-input" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                      </div>
                      <input placeholder="Email Address" className="booking-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" />
                      <input placeholder="Phone Number" className="booking-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} type="tel" />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sticky Basket Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-2xl shadow-slate-200/50 sticky top-28">
              <h2 className="text-2xl font-black text-primary-dark mb-8 flex items-center gap-2">
                <div className="w-2 h-8 bg-primary rounded-full" /> My Clean.
              </h2>

              <div className="space-y-4 mb-10">
                <div className="flex justify-between items-center group">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Service</span>
                  <span className="font-black text-primary-dark">{formData.serviceType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{region.id === 'UK' ? 'Duration' : 'Size'}</span>
                  <span className="font-black text-primary-dark">{region.id === 'UK' ? `${formData.duration}h` : formData.propertySize}</span>
                </div>
                {formData.date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Schedule</span>
                    <span className="font-black text-primary-dark">{new Date(formData.date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-slate-100">
                <div className="flex justify-between items-end mb-8">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total cost</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-primary tracking-tighter">{region.symbol}{totalPrice}</span>
                  </div>
                </div>
                <button 
                  onClick={() => step === 8 ? setIsSubmitted(true) : nextStep()}
                  disabled={step === 1 && !formData.address}
                  className="w-full py-6 bg-primary text-white rounded-3xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                >
                  {step === 8 ? 'Confirm Booking' : 'Continue'}
                </button>
                {step > 1 && (
                  <button onClick={prevStep} className="w-full mt-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                    Go Back
                  </button>
                )}
              </div>
            </div>
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
  for (let i = 0; i < offset; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
  const isSelected = (date) => date && selectedDate && new Date(date).toDateString() === new Date(selectedDate).toDateString();
  const isToday = (date) => date && new Date(date).toDateString() === new Date().toDateString();
  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-100/50">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black text-primary-dark">{monthNames[month]} {year}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50"><ChevronLeft size={20} /></button>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-[10px] font-black text-slate-300 uppercase">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;
          const disabled = isPast(date);
          const active = isSelected(date);
          const today = isToday(date);
          return (
            <button key={idx} disabled={disabled} onClick={() => onSelect(date.toISOString().split('T')[0])}
              className={`aspect-square rounded-2xl flex items-center justify-center text-sm font-black transition-all ${active ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'hover:bg-primary/5'} ${disabled ? 'opacity-10 cursor-not-allowed' : 'cursor-pointer'} ${today && !active ? 'text-primary border-2 border-primary/10' : ''}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Booking;
