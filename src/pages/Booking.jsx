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
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(formData.address)}&limit=5`);
        const data = await response.json();
        const formatted = data.features.map(f => {
          const { name, street, housenumber, city, postcode, country } = f.properties;
          const main = [housenumber, street, name].filter(Boolean).join(" ");
          const details = [city, postcode, country].filter(Boolean).join(", ");
          return main ? `${main}, ${details}` : details;
        });
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

  const handleBooking = async () => {
    const bookingPayload = {
      bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      },
      service: formData.serviceType,
      details: {
        address: formData.address,
        frequency: formData.frequency,
        duration: formData.duration,
        extras: formData.extras,
        hasPets: formData.hasPets,
      },
      schedule: {
        date: formData.date,
        timeSlot: formData.timeSlot,
      },
      payment: {
        amount: totalPrice,
        currency: region.id === 'UK' ? 'GBP' : 'NGN',
        method: region.id === 'UK' ? 'Stripe' : 'Paystack',
      },
      region: region.id,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert('Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Network error. Please check your connection.');
    }
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

  const serviceOptions = [
    { 
      id: 'Classic Regular', 
      title: 'Residential Cleaning', 
      tag: 'Reliable domestic cleaners',
      price: region.id === 'UK' ? '£17.90/h' : `${region.symbol}15,000`, 
      bullets: [
        'Reliable, weekly or bi-weekly cleaning for your home',
        'The same vetted cleaner each time',
        'Dusting, vacuuming, mopping & sanitization',
        'No long-term commitment'
      ],
      icon: <Heart />
    },
    { 
      id: 'Deep Clean', 
      title: 'Deep Clean', 
      tag: 'Deep cleaning',
      price: region.id === 'UK' ? '£24.90/h' : `${region.symbol}25,000`, 
      bullets: [
        'Specialized deep cleaning for a total refresh',
        'Inside cabinets, baseboards & door frames',
        'Appliance deep clean included',
        'Perfect for move-in/move-out needs'
      ],
      icon: <Zap />
    },
    { 
      id: 'Holiday Rental', 
      title: 'Airbnb Cleaning', 
      tag: 'Short-let specialist',
      price: region.id === 'UK' ? '£21.90/h' : `${region.symbol}20,000`, 
      bullets: [
       "Turnover Specialist",
        "5-Star Prep",
        "Guest Ready Check",
        "Inventory Monitoring",
        "Consumable Supplies",
         "Please provide a washing machine,dryer and detergent if on-site linen and towel washing is  required ",
      ],
      icon: <Star />
    },
    { 
      id: 'Office Cleaning', 
      title: 'Office Cleaning', 
      tag: 'Expert office cleaning',
      price: 'Custom Quotes', 
      bullets: [
        'Professional janitorial services for workspaces',
        'Workstation sanitization & restroom care',
        'Communal area cleaning & maintenance',
        'Flexible scheduling for businesses'
      ],
      icon: <Briefcase />
    },
  ];

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
                      {serviceOptions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setFormData({...formData, serviceType: s.id});
                            nextStep();
                          }}
                          className={`group text-left rounded-[40px] border-2 transition-all duration-500 relative overflow-hidden ${
                            formData.serviceType === s.id 
                            ? 'border-primary bg-primary text-white shadow-2xl shadow-primary/20 scale-[1.02]' 
                            : 'border-slate-100 bg-white hover:border-primary/20 hover:shadow-xl'
                          }`}
                        >
                          <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                                  formData.serviceType === s.id ? 'bg-white/10 text-white' : 'bg-primary/5 text-primary'
                                }`}>
                                  {React.cloneElement(s.icon, { size: 32 })}
                                </div>
                                <div>
                                  <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                                    formData.serviceType === s.id ? 'text-white/60' : 'text-secondary'
                                  }`}>
                                    {s.tag}
                                  </div>
                                  <h3 className="text-xl md:text-2xl font-black tracking-tight">{s.title}.</h3>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-2xl font-black block ${
                                  formData.serviceType === s.id ? 'text-white' : 'text-primary'
                                }`}>{s.price}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                  formData.serviceType === s.id ? 'text-white/40' : 'text-slate-400'
                                }`}>Starting Price</span>
                              </div>
                            </div>

                            <div className={`pt-6 border-t ${formData.serviceType === s.id ? 'border-white/10' : 'border-slate-100'} space-y-3`}>
                              {s.bullets.map((b, i) => (
                                <div key={i} className={`flex items-start gap-3 text-sm font-medium ${
                                  formData.serviceType === s.id ? 'text-white/80' : 'text-slate-500'
                                }`}>
                                  <CheckCircle2 size={16} className={formData.serviceType === s.id ? 'text-secondary shrink-0 mt-0.5' : 'text-primary shrink-0 mt-0.5'} />
                                  {b}
                                </div>
                              ))}
                            </div>
                          </div>
                        </button>
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
                        { id: 'Fortnightly', title: 'Every 2 weeks', badge: 'Save 5%' },
                        { id: 'Once', title: 'Just once' },
                      ].map((freq) => (
                        <button
                          key={freq.id}
                          onClick={() => {
                            setFormData({...formData, frequency: freq.id});
                            nextStep();
                          }}
                          className={`p-8 rounded-[32px] border-2 text-left transition-all flex justify-between items-center ${
                            formData.frequency === freq.id 
                            ? 'border-primary bg-primary/5 text-primary ring-4 ring-primary/5' 
                            : 'border-slate-100 hover:border-primary/20'
                          }`}
                        >
                          <span className="text-xl font-bold">{freq.title}</span>
                          {freq.badge && (
                            <span className="bg-secondary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                              {freq.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">How many hours?</h1>
                    <div className="flex items-center justify-center gap-12 py-10 bg-white rounded-[40px] shadow-xl border border-slate-50">
                      <button 
                        onClick={() => setFormData({...formData, duration: Math.max(2, formData.duration - 0.5)})}
                        className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg active:scale-90"
                      >
                        <Minus size={24} />
                      </button>
                      <div className="text-center">
                        <span className="text-7xl font-black text-primary-dark tracking-tighter">{formData.duration}</span>
                        <span className="text-xl font-bold text-slate-400 ml-2 uppercase tracking-widest">Hrs</span>
                      </div>
                      <button 
                        onClick={() => setFormData({...formData, duration: Math.min(8, formData.duration + 0.5)})}
                        className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg active:scale-90"
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                    <button onClick={nextStep} className="btn-primary w-full py-6 text-lg mt-8">Continue</button>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">Any extras?</h1>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        'Ironing', 'Cleaning Products', 'Inside Fridge', 'Inside Oven'
                      ].map((extra) => (
                        <button
                          key={extra}
                          onClick={() => toggleExtra(extra)}
                          className={`p-6 rounded-[32px] border-2 text-center transition-all flex flex-col items-center gap-4 ${
                            formData.extras.includes(extra) 
                            ? 'border-primary bg-primary/5 text-primary ring-4 ring-primary/5' 
                            : 'border-slate-100 hover:border-primary/20 bg-white'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                            <Plus size={20} className={formData.extras.includes(extra) ? 'rotate-45 transition-transform' : ''} />
                          </div>
                          <span className="font-bold text-sm">{extra}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={nextStep} className="btn-primary w-full py-6 text-lg mt-8">Continue</button>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-6 text-center">
                    <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
                      <Heart size={48} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">Any pets?</h1>
                    <div className="flex gap-4">
                      {[
                        { label: 'Yes', value: true },
                        { label: 'No', value: false }
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => {
                            setFormData({...formData, hasPets: opt.value});
                            nextStep();
                          }}
                          className={`flex-1 p-8 rounded-[32px] border-2 text-xl font-bold transition-all ${
                            formData.hasPets === opt.value 
                            ? 'border-primary bg-primary text-white' 
                            : 'border-slate-100 hover:border-primary/20 bg-white text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 7 && (
                  <div className="max-w-2xl mx-auto space-y-10 py-4">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                        Scheduling
                      </div>
                      <h1 className="text-3xl md:text-5xl font-black text-primary-dark tracking-tight mb-4">When should we come?</h1>
                      <p className="text-slate-500 font-medium">Select a date and time that works best for you.</p>
                    </div>

                    <div className="space-y-8">
                      {/* Date Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Date</label>
                          <span className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest">Next 14 Days</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                          {Array.from({ length: 14 }).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() + i + 1);
                            const isSelected = formData.date === d.toISOString().split('T')[0];
                            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                            const dayNum = d.getDate();
                            const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                            
                            return (
                              <button
                                key={i}
                                onClick={() => setFormData({...formData, date: d.toISOString().split('T')[0]})}
                                className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all duration-300 ${
                                  isSelected 
                                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                  : 'border-slate-100 bg-white hover:border-primary/20 text-slate-600'
                                }`}
                              >
                                <span className={`text-[10px] font-black uppercase mb-1 ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>{dayName}</span>
                                <span className="text-lg font-black tracking-tighter leading-none mb-1">{dayNum}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/40' : 'text-slate-300'}`}>{monthName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Time Selection */}
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 px-2">Preferred Time Slot</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { id: 'Morning', label: 'Morning', time: '8:00 AM - 12:00 PM', icon: <Sparkles /> },
                            { id: 'Afternoon', label: 'Afternoon', time: '12:00 PM - 4:00 PM', icon: <Zap /> },
                            { id: 'Evening', label: 'Evening', time: '4:00 PM - 8:00 PM', icon: <Clock /> },
                          ].map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setFormData({...formData, timeSlot: slot.id})}
                              className={`flex flex-col items-center p-6 rounded-[32px] border-2 transition-all duration-300 group ${
                                formData.timeSlot === slot.id 
                                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' 
                                : 'border-slate-100 bg-white hover:border-primary/20'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                                formData.timeSlot === slot.id ? 'bg-white/10 text-white' : 'bg-primary/5 text-primary'
                              }`}>
                                {React.cloneElement(slot.icon, { size: 20 })}
                              </div>
                              <span className="font-black text-sm mb-1">{slot.label}</span>
                              <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                formData.timeSlot === slot.id ? 'text-white/50' : 'text-slate-400'
                              }`}>{slot.time}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={nextStep} 
                      disabled={!formData.date || !formData.timeSlot}
                      className={`btn-primary w-full py-6 text-lg mt-8 shadow-2xl transition-all ${
                        (!formData.date || !formData.timeSlot) ? 'opacity-50 cursor-not-allowed grayscale' : 'shadow-primary/30 hover:scale-[1.02]'
                      }`}
                    >
                      Continue to Final Step
                    </button>
                  </div>
                )}

                {step === 8 && (
                  <div className="space-y-8">
                    <h1 className="text-3xl md:text-4xl font-black text-primary-dark tracking-tight">Your Details.</h1>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">First Name</label>
                        <input 
                          type="text" 
                          placeholder="John"
                          className="w-full p-5 rounded-[24px] border-2 border-slate-100 focus:border-primary focus:outline-none font-bold"
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Last Name</label>
                        <input 
                          type="text" 
                          placeholder="Doe"
                          className="w-full p-5 rounded-[24px] border-2 border-slate-100 focus:border-primary focus:outline-none font-bold"
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                        <input 
                          type="email" 
                          placeholder="john@example.com"
                          className="w-full p-5 rounded-[24px] border-2 border-slate-100 focus:border-primary focus:outline-none font-bold"
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                        <input 
                          type="tel" 
                          placeholder="+44"
                          className="w-full p-5 rounded-[24px] border-2 border-slate-100 focus:border-primary focus:outline-none font-bold"
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleBooking}
                      className="btn-primary w-full py-6 text-xl shadow-2xl shadow-primary/30 mt-4 group"
                    >
                      Confirm & Pay {region.symbol}{totalPrice}
                      <Zap size={20} className="fill-current group-hover:scale-125 transition-transform" />
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Secure Payment Powered by Stripe & Paystack
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="mt-12 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-black text-xs uppercase tracking-widest group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Go Back
              </button>
            )}
          </div>

          {/* Booking Summary Sidebar */}
          <div className={`lg:sticky lg:top-32 transition-all duration-700 ${step === 1 ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
            <div className="bg-white rounded-[48px] p-8 md:p-10 shadow-2xl border-4 border-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <h2 className="text-2xl font-black text-primary-dark mb-8 tracking-tight">Your Basket.</h2>
              
              <div className="space-y-6 mb-10">
                {formData.address && (
                  <div className="flex justify-between items-start group">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                        <p className="font-bold text-slate-700 text-sm line-clamp-1">{formData.address}</p>
                      </div>
                    </div>
                  </div>
                )}

                {step > 2 && (
                  <>
                    <div className="flex justify-between items-start group">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</p>
                          <p className="font-bold text-slate-700">{formData.serviceType}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-start group">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                          <p className="font-bold text-slate-700">{formData.duration} Hours</p>
                        </div>
                      </div>
                    </div>

                    {formData.extras.length > 0 && (
                      <div className="flex justify-between items-start group">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                            <Plus size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extras</p>
                            <p className="font-bold text-slate-700 text-sm leading-tight">
                              {formData.extras.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {step > 2 ? (
                <div className="pt-8 border-t border-slate-100 flex justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Price</p>
                    <p className="text-4xl font-black text-primary-dark tracking-tighter">
                      {region.symbol}{totalPrice}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Zap size={28} className="fill-current" />
                  </div>
                </div>
              ) : (
                <div className="pt-8 border-t border-slate-50 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Select service to see price</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 px-6 space-y-4">
              <div className="flex items-center gap-4 text-slate-400">
                <ShieldCheck size={20} className="text-secondary" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">Vetted & Insured Pros Only</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <Heart size={20} className="text-secondary" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">100% Satisfaction Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
