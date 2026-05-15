import React, { useState, useEffect } from 'react';
import LoadingOverlay from '../component/LoadingOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegion } from '../context/RegionContext';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Calendar, User, 
  CreditCard, Home as HomeIcon, Briefcase, 
  Trash2, Plus, Minus, CheckCircle2, MapPin, 
  Clock, Info, ShieldCheck, Heart, Star,
  Search, Sparkles, Zap, Shield, HelpCircle,
  ArrowRight, Truck, Key, Car, Layout, Coffee,
  Waves, Refrigerator, Wind
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePayment from '../component/StripePayment';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const serviceOptions = [
  { 
    id: 'Residential Cleaning', 
    title: 'Residential Cleaning', 
    tag: 'Reliable domestic cleaners',
    bullets: [
      "Dusting of all surfaces.",
      "Vacuuming & Mopping.",
      "Kitchen degreasing.",
      "Bathroom sanitization.",
      "Bed making & tidying.",
      "Trash removal.",
    ],
    icon: <Heart />
  },
  { 
    id: 'Deep Clean', 
    title: 'Deep Clean', 
    tag: 'Deep cleaning',
    bullets: [
      "Inside cabinets & drawers.",
      "Baseboard scrubbing.",
      "Door frame cleaning.",
      "Wall spot cleaning.",
      "Appliance deep clean.",
      "End-of-tenancy guarantee.",
    ],
    icon: <Zap />
  },
  { 
    id: 'Airbnb Cleaning', 
    title: 'Airbnb Cleaning', 
    tag: 'Short-let specialist',
    bullets: [
      "Linen & towel change.",
      "Guest amenity restock.",
      "Photo-verified check.",
      "Damage reporting.",
      "Inventory monitoring.",
      "5-star turnover prep.",
    ],
    icon: <Star />
  },
  { 
    id: 'Office Cleaning', 
    title: 'Office Cleaning', 
    tag: 'Expert office cleaning',
    bullets: [
      "Workstation sanitization.",
      "Communal area cleaning.",
      "Restroom maintenance.",
      "Window cleaning.",
      "Carpet deep clean.",
      "Disinfection services.",
    ],
    icon: <Briefcase />
  },
];

const CustomCalendar = ({ selectedDate, onDateSelect, bookedDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const days = [];
  const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const startDay = startDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  const isToday = (date) => { if (!date) return false; const today = new Date(); return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear(); };
  const isSelected = (date) => { if (!date || !selectedDate) return false; const sel = new Date(selectedDate); return date.getDate() === sel.getDate() && date.getMonth() === sel.getMonth() && date.getFullYear() === sel.getFullYear(); };
  const isPast = (date) => { if (!date) return false; const today = new Date(); today.setHours(0,0,0,0); return date < today; };
  const isBooked = (date) => { if (!date) return false; const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; return bookedDates.includes(dStr); };

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h3 className="font-black text-primary-dark tracking-tighter text-base md:text-lg">{currentMonth.toLocaleString('default', { month: 'long' })} <span className="text-primary">{currentMonth.getFullYear()}</span></h3>
        <div className="flex gap-1 md:gap-2">
          <button onClick={handlePrevMonth} className="p-1.5 md:p-2 rounded-lg md:xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"><ChevronLeft size={18} /></button>
          <button onClick={handleNextMonth} className="p-1.5 md:p-2 rounded-lg md:xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (<div key={d} className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase text-center py-2">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map((date, i) => {
          const booked = isBooked(date);
          const past = isPast(date);
          const disabled = booked || past;
          return (
            <div key={i} className="aspect-square">
              {date ? (
                <button disabled={disabled} onClick={() => onDateSelect(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)} className={`w-full h-full rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative group ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:scale-110 active:scale-95'} ${isSelected(date) ? 'bg-primary text-white shadow-lg shadow-primary/30 z-10' : 'bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary'}`}>
                  <span className="text-xs md:text-sm font-black">{date.getDate()}</span>
                  {booked && <span className="text-[6px] md:text-[7px] font-black uppercase text-rose-500 absolute top-0.5 md:top-1">Taken</span>}
                  {isToday(date) && !isSelected(date) && <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full absolute bottom-1.5 md:bottom-2 bg-primary" />}
                </button>
              ) : <div className="w-full h-full" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Booking = () => {
  const { region } = useRegion();
  const [searchParams] = useSearchParams();
  const preSelectedService = searchParams.get('service');

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  
  const [formData, setFormData] = useState({
    address: '',
    addressLine2: '',
    postcode: '',
    serviceType: preSelectedService || '', 
    frequency: 'Once', 
    duration: 2,
    property: {}, 
    extras: {}, 
    parking: 'Available on-site',
    keyAccess: 'I will be home',
    date: '',
    timeSlot: '',
    preferredTime: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialInstructions: '',
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicRates, setDynamicRates] = useState({});
  const [servicesList, setServicesList] = useState([]);
  const [loadingRates, setLoadingRates] = useState(true);

  // Fetch Dynamic Rates from VPS
  useEffect(() => {
    const fetchExistingBookings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`);
        const data = await response.json();
        // Convert dates to YYYY-MM-DD reliably, handling various string formats
        const dates = data
          .filter(b => b.schedule?.date)
          .map(b => {
            const d = new Date(b.schedule.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          });
        console.log('Booked Dates Loaded:', dates);
        setBookedDates([...new Set(dates)]); 
      } catch (err) { console.error('Error fetching booked dates:', err); }
    };

    const fetchRates = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/services?region=${region.id}&t=${Date.now()}`);
        const data = await response.json();
        setServicesList(data);
        const ratesObj = {};
        data.forEach(service => { ratesObj[service.name.trim()] = service.rate; });
        setDynamicRates(ratesObj);
      } catch (error) { console.error('Error fetching rates:', error); } finally { setLoadingRates(false); }
    };
    
    fetchExistingBookings();
    fetchRates();
  }, [region.id]);

  // Pricing Logic - Comprehensive Engine
  useEffect(() => {
    if (!formData.serviceType) {
      setTotalPrice(0);
      return;
    }

    let total = 0;
    const fallbackUK = { 
      'Residential Cleaning': 17.90, 'Deep Clean': 24.90, 'Airbnb Cleaning': 21.90, 'Office Cleaning': 19.90,
      'Bedroom': 15, 'Bathroom': 12, 'Cloakroom': 8, 'Kitchen': 15, 'Utility Room': 10, 'Reception Room': 12, 'Conservatory': 15,
      'American fridge freeze': 15, 'Carpet(s) Cleaning': 30, 'Double Oven Cleaning': 20, 'Fridge and freezer': 18, 'Range Oven Cleaning': 25, 'Single fridge': 10, 'Single Oven Cleaning': 15, 'Venetian Blinds': 5
    };
    const fallbackNG = { 
      'Residential Cleaning': 15000, 'Deep Clean': 25000, 'Airbnb Cleaning': 20000, 'Office Cleaning': 18000,
      'Bedroom': 5000, 'Bathroom': 4000, 'Cloakroom': 2500, 'Kitchen': 6000, 'Utility Room': 3000, 'Reception Room': 5000, 'Conservatory': 7000,
      'American fridge freeze': 8000, 'Carpet(s) Cleaning': 15000, 'Double Oven Cleaning': 12000, 'Fridge and freezer': 10000, 'Range Oven Cleaning': 15000, 'Single fridge': 5000, 'Single Oven Cleaning': 8000, 'Venetian Blinds': 3000
    };

    const rates = region.id === 'UK' ? fallbackUK : fallbackNG;

    // Base Service Rate (Multiplied by Duration if UK/Hourly)
    const baseRate = dynamicRates[formData.serviceType.trim()] || rates[formData.serviceType.trim()] || 20;
    if (region.id === 'UK') {
      total += baseRate * formData.duration;
    } else {
      total += baseRate; // Flat rate for NG
    }

    // Room Rates - Removed as per user request (rooms are informational only)
    /*
    const roomMap = { bedrooms: 'Bedroom', bathrooms: 'Bathroom', cloakrooms: 'Cloakroom', kitchens: 'Kitchen', utilityRooms: 'Utility Room', receptionRooms: 'Reception Room', conservatories: 'Conservatory' };
    Object.entries(formData.property).forEach(([key, qty]) => {
      const roomName = roomMap[key];
      total += (dynamicRates[roomName.trim()] || rates[roomName.trim()] || 0) * qty;
    });
    */

    // Extra Rates
    Object.entries(formData.extras).forEach(([name, qty]) => {
      total += (dynamicRates[name.trim()] || rates[name.trim()] || 0) * qty;
    });

    if (formData.frequency === 'Weekly') total *= 0.9;
    if (formData.frequency === 'Fortnightly') total *= 0.95;

    setTotalPrice(Math.round(total * 100) / 100);
  }, [formData, region, dynamicRates]);

  const updateRoom = (name, delta) => {
    setFormData(prev => {
      const current = prev.property[name] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, property: { ...prev.property, [name]: next } };
    });
  };

  const updateExtra = (name, delta) => {
    setFormData(prev => {
      const current = prev.extras[name] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, extras: { ...prev.extras, [name]: next } };
    });
  };

  const nextStep = () => { 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    setStep(s => {
      if (s === 1 && preSelectedService) return 3;
      return Math.min(s + 1, 8);
    }); 
  };
  const prevStep = () => { 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    setStep(s => {
      if (s === 3 && preSelectedService) return 1;
      return Math.max(s - 1, 1);
    }); 
  };

  const steps = [
    { id: 1, title: 'Address' },
    { id: 2, title: 'Service' },
    { id: 3, title: 'Your Home' },
    { id: 4, title: 'Hours' },
    { id: 5, title: 'Extras' },
    { id: 6, title: 'Logistics' },
    { id: 7, title: 'Schedule' },
    { id: 8, title: 'Payment' },
  ];

  // Address Suggestions Logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (formData.address.length < 3) { setAddressSuggestions([]); return; }
      try {
        const ukBbox = '-7.57216793459,49.959999905,1.68153079591,58.6350001085';
        const ngBbox = '2.6917,4.2406,14.6800,13.8659';
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(formData.address)}&limit=8&lang=en&bbox=${region.id === 'UK' ? ukBbox : ngBbox}`);
        const data = await response.json();
        if (!data.features) { setAddressSuggestions([]); return; }
        const formatted = data.features.map(f => {
          const { name, street, housenumber, city, postcode, state } = f.properties;
          return [housenumber, street || name, city, postcode, state].filter(Boolean).join(", ");
        }).filter(Boolean);
        setAddressSuggestions([...new Set(formatted)]);
      } catch (err) { console.error("Suggestions fetch error:", err); }
    };
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.address, region.id]);

  const selectAddress = (addr) => { setFormData({...formData, address: addr}); setShowSuggestions(false); };

  const handlePaymentSuccess = async (paymentIntent) => {
    if (!formData.serviceType) {
      console.error('Submission Blocked: Service type is missing.');
      alert('Please select a service type before completing your booking.');
      return;
    }

    const bookingPayload = {
      bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: { 
        firstName: formData.firstName || 'Customer', 
        lastName: formData.lastName || 'User', 
        email: formData.email || 'pending@cleaniq.com', 
        phone: formData.phone || '000' 
      },
      service: formData.serviceType,
      details: { 
        address: `${formData.address}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}${formData.postcode ? ', ' + formData.postcode : ''}`, 
        frequency: formData.frequency, 
        duration: formData.duration, 
        extras: [
          ...Object.entries(formData.extras).filter(([_, q]) => q > 0).map(([n, q]) => `${n} (x${q})`),
          ...Object.entries(formData.property).filter(([_, q]) => q > 0).map(([n, q]) => `${n} (x${q})`),
          `Parking: ${formData.parking}`,
          `Entry: ${formData.keyAccess}`,
          `Instructions: ${formData.specialInstructions || 'None'}`
        ]
      },
      schedule: { date: formData.date, timeSlot: formData.timeSlot, preferredTime: formData.preferredTime },
      payment: { amount: totalPrice, currency: region.id === 'UK' ? 'GBP' : 'NGN', method: 'Stripe', transactionId: paymentIntent.id },
      region: region.id
    };
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
      if (response.ok) setIsSubmitted(true);
    } catch (error) { console.error('Error saving booking:', error); } finally { setIsSubmitting(false); }
  };

  if (isSubmitted) {
    return (
      <div className="pt-40 pb-20 min-h-screen bg-white flex items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 bg-primary rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20 rotate-12"><CheckCircle2 size={40} className="text-white -rotate-12" /></div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-dark mb-4 tracking-tighter">Confirmed!</h1>
          <p className="text-slate-500 font-bold mb-10">Check your email for confirmation.</p>
          <Link to="/" className="btn-primary inline-flex px-10 py-4 rounded-full text-sm">Return Home</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 min-h-screen bg-[#F8FAFC] pb-32">
      {isSubmitting && <LoadingOverlay message="Confirming..." />}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-6 md:mb-10 bg-white p-2 md:p-5 rounded-[20px] md:rounded-[24px] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar sticky top-20 md:top-24 z-40">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${step === s.id ? 'bg-primary text-white shadow-md' : s.id < step ? 'text-primary' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center font-black text-[8px] md:text-[9px] ${step === s.id ? 'bg-white/20' : s.id < step ? 'bg-primary/10' : 'bg-slate-100'}`}>
                  {s.id < step ? <CheckCircle2 size={10}/> : s.id}
                </div>
                <span className="font-black text-[7px] md:text-[8px] uppercase tracking-widest hidden xs:block">{s.title}</span>
              </div>
              {idx < steps.length - 1 && <ChevronRight size={10} className="mx-1 md:mx-2 text-slate-200" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-[24px] md:rounded-[40px] p-5 md:p-10 shadow-lg border border-slate-100 min-h-[450px] md:min-h-[600px] flex flex-col relative overflow-hidden">
                <div className="flex-1 pb-20 md:pb-24">
                
                {step === 1 && (
                  <div className="space-y-6 md:space-y-8 animate-in fade-in">
                    <div><h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">Where are we cleaning?</h1><p className="text-slate-400 font-bold uppercase text-[8px] md:text-[9px] tracking-widest mt-1">Provide your property address</p></div>
                    <div className="space-y-4">
                      <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                        <input className="w-full p-6 pl-14 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm transition-all" placeholder="Address Line 1 (start typing to search...)" value={formData.address} onChange={(e) => { setFormData({...formData, address: e.target.value}); setShowSuggestions(true); }}/>
                        <AnimatePresence>{showSuggestions && addressSuggestions.length > 0 && (<motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden text-left">{addressSuggestions.map((addr, i) => (<button key={i} onClick={() => selectAddress(addr)} className="w-full p-4 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 text-xs font-bold text-slate-600"><MapPin size={14} className="text-primary"/>{addr}</button>))}</motion.div>)}</AnimatePresence>
                      </div>
                      <input className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm transition-all" placeholder="Address Line 2 (Apartment, Suite, Flat no. — optional)" value={formData.addressLine2} onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}/>
                      <input className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm transition-all" placeholder="Postcode / ZIP" value={formData.postcode} onChange={(e) => setFormData({...formData, postcode: e.target.value})}/>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-primary-dark tracking-tight">What type of cleaning?</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {serviceOptions.map((s) => (
                        <button key={s.id} onClick={() => { setFormData({...formData, serviceType: s.id}); nextStep(); }} className={`flex flex-col items-center p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-4 transition-all duration-500 group relative overflow-hidden ${formData.serviceType === s.id ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' : 'border-slate-50 bg-white hover:border-primary/20'}`}>
                          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-[32px] flex items-center justify-center mb-4 md:mb-6 transition-all duration-500 ${formData.serviceType === s.id ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-primary/5 text-primary group-hover:scale-110'}`}>{React.cloneElement(s.icon, { size: 28 })}</div>
                          <p className={`font-black text-xl md:text-2xl mb-1 tracking-tighter ${formData.serviceType === s.id ? 'text-primary' : 'text-primary-dark'}`}>{s.title}</p>
                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{s.tag}</p>
                          <div className="mb-4 md:mb-6"><span className="text-lg md:text-xl font-black text-primary-dark">{region.symbol}{dynamicRates[s.id.trim()] || (region.id === 'UK' ? (s.id === 'Deep Clean' ? 24.90 : 17.90) : (s.id === 'Deep Clean' ? 25000 : 15000))}</span>{region.id === 'UK' && <span className="text-[10px] font-bold text-slate-400 ml-1">/ hr</span>}</div>
                          <div className="space-y-3 w-full text-left">
                            {s.bullets.map((bullet, idx) => (<div key={idx} className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${formData.serviceType === s.id ? 'bg-primary/20 text-primary' : 'bg-slate-50 text-slate-300'}`}><CheckCircle2 size={12} /></div><p className="text-xs font-bold text-slate-500">{bullet}</p></div>))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 md:space-y-8 animate-in fade-in">
                    <div><h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">Tell us about your home</h1><p className="text-slate-400 font-bold uppercase text-[8px] md:text-[9px] tracking-widest mt-1">Select number of rooms</p></div>
                    <div className="grid gap-4">
                      {servicesList
                        .filter(s => ['Bedroom', 'Bathroom', 'Cloakroom', 'Kitchen', 'Utility Room', 'Reception Room', 'Conservatory'].includes(s.name))
                        .map(room => {
                          const roomIconMap = { 'Bedroom': <HomeIcon size={18}/>, 'Bathroom': <Waves size={18}/>, 'Cloakroom': <Info size={18}/>, 'Kitchen': <Coffee size={18}/>, 'Utility Room': <Truck size={18}/>, 'Reception Room': <Layout size={18}/>, 'Conservatory': <Wind size={18}/> };
                          return (
                            <div key={room._id} className="flex items-center justify-between p-3 md:p-4 px-4 md:px-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all">
                              <div className="flex items-center gap-3 md:gap-4"><div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">{roomIconMap[room.name] || <HomeIcon size={18}/>}</div><span className="font-bold text-xs md:text-sm text-primary-dark">{room.name}</span></div>
                              <div className="flex items-center gap-3 md:gap-6">
                                <button onClick={() => updateRoom(room.name, -1)} className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all"><Minus size={14}/></button>
                                <span className="text-base md:text-lg font-black text-primary-dark w-4 text-center">{formData.property[room.name] || 0}</span>
                                <button onClick={() => updateRoom(room.name, 1)} className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all"><Plus size={14}/></button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8 md:space-y-12 animate-in fade-in py-6 md:py-10">
                    <div className="text-center"><h1 className="text-xl md:text-4xl font-extrabold text-primary-dark tracking-tight mb-2 md:mb-4">How many hours?</h1><p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest">Select the duration of your clean</p></div>
                    <div className="max-w-md mx-auto">
                      <div className="bg-slate-50 p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-slate-100 flex items-center justify-between">
                        <button onClick={() => setFormData({...formData, duration: Math.max(2, formData.duration - 1)})} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary shadow-lg hover:bg-primary hover:text-white transition-all"><Minus size={20}/></button>
                        <div className="text-center"><span className="text-4xl md:text-6xl font-black text-primary-dark">{formData.duration}</span><p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1 md:mt-2">Hours (2h min)</p></div>
                        <button onClick={() => setFormData({...formData, duration: Math.min(8, formData.duration + 1)})} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary shadow-lg hover:bg-primary hover:text-white transition-all"><Plus size={20}/></button>
                      </div>
                      <div className="mt-6 md:mt-10 grid grid-cols-3 gap-2 md:gap-4">
                        {['Once', 'Weekly', 'Fortnightly'].map(f => (
                          <button key={f} onClick={() => setFormData({...formData, frequency: f})} className={`p-6 rounded-3xl border-2 font-black text-sm transition-all ${formData.frequency === f ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20' : 'border-slate-50 bg-slate-50'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6 md:space-y-8 animate-in fade-in">
                    <div><h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">Extra Services</h1><p className="text-slate-400 font-bold uppercase text-[8px] md:text-[9px] tracking-widest mt-1">Select additional options</p></div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {servicesList
                        .filter(s => {
                          const baseServices = [...serviceOptions.map(o => o.id), 'Bedroom', 'Bathroom', 'Cloakroom', 'Kitchen', 'Utility Room', 'Reception Room', 'Conservatory', '1 Bed Flat', '2 Bed Flat', '3 Bed House', '4 Bed House', '5+ Bed House'];
                          // Clean names for comparison (remove dots, special chars, etc)
                          const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
                          const isBase = baseServices.some(base => clean(base) === clean(s.name));
                          return !isBase;
                        })
                        .map(extra => {
                          const iconMap = { 
                            'american fridge freeze': <Refrigerator />, 
                            'carpet(s) cleaning': <Sparkles />, 
                            'double oven cleaning': <Zap />, 
                            'fridge and freezer': <Refrigerator />, 
                            'range oven cleaning': <Zap />, 
                            'single fridge': <Refrigerator />, 
                            'single oven cleaning': <Zap />, 
                            'venetian blinds': <Layout /> 
                          };
                          const icon = iconMap[extra.name.toLowerCase().trim()] || <Plus size={18}/>;
                          return (
                            <div key={extra._id} className={`p-4 px-6 rounded-2xl border-2 flex items-center justify-between transition-all ${formData.extras[extra.name] > 0 ? 'border-primary bg-primary/5' : 'border-slate-50 bg-slate-50'}`}>
                              <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.extras[extra.name] > 0 ? 'bg-primary text-white' : 'bg-white text-slate-400 shadow-sm'}`}>{icon}</div><span className="font-bold text-[11px] text-primary-dark max-w-[110px] leading-tight">{extra.name}</span></div>
                              <div className="flex items-center gap-3 bg-white rounded-xl p-1.5 border border-slate-100"><button onClick={() => updateExtra(extra.name, -1)} className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Minus size={12}/></button><span className="font-black text-xs w-4 text-center">{formData.extras[extra.name] || 0}</span><button onClick={() => updateExtra(extra.name, 1)} className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center"><Plus size={12}/></button></div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-6 md:space-y-8 animate-in fade-in">
                    <div><h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">Logistics</h1><p className="text-slate-400 font-bold uppercase text-[8px] md:text-[9px] tracking-widest mt-1">Help our team get access</p></div>
                    <div className="grid gap-6">
                      <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase tracking-widest">Parking Situation</label><div className="grid grid-cols-1 xs:grid-cols-2 gap-3">{['Available on-site', 'Street parking', 'Paid parking nearby', 'No parking'].map(p => (<button key={p} onClick={() => setFormData({...formData, parking: p})} className={`p-4 rounded-xl border-2 font-bold text-xs transition-all text-left ${formData.parking === p ? 'border-primary bg-primary text-white' : 'border-slate-50 bg-slate-50'}`}>{p}</button>))}</div></div>
                      <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase tracking-widest">Key / Entry Access</label><div className="grid grid-cols-1 xs:grid-cols-2 gap-3">{['I will be home', 'Key under mat', 'Lockbox / Key safe', 'Building concierge'].map(k => (<button key={k} onClick={() => setFormData({...formData, keyAccess: k})} className={`p-4 rounded-xl border-2 font-bold text-xs transition-all text-left ${formData.keyAccess === k ? 'border-primary bg-primary text-white' : 'border-slate-50 bg-slate-50'}`}>{k}</button>))}</div></div>
                      <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 ml-4 uppercase tracking-widest">Special Instructions (optional)</label><textarea className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none font-bold text-sm resize-none h-28" placeholder="e.g. Ring bell twice, dog on premises, focus on kitchen..." value={formData.specialInstructions} onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}/></div>
                    </div>
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-6 md:space-y-8 animate-in fade-in">
                    <div><h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">Scheduling.</h1><p className="text-slate-400 font-bold uppercase text-[8px] md:text-[9px] tracking-widest mt-1">Select your preferred date</p></div>
                    <CustomCalendar selectedDate={formData.date} onDateSelect={(date) => setFormData({...formData, date})} bookedDates={bookedDates} />
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      {['Morning', 'Afternoon', 'Evening'].map(slot => (<button key={slot} onClick={() => setFormData({...formData, timeSlot: slot})} className={`p-4 rounded-xl border-2 font-black text-xs transition-all ${formData.timeSlot === slot ? 'border-primary bg-primary text-white shadow-lg' : 'border-slate-50 bg-slate-50'}`}>{slot}</button>))}
                    </div>
                    {formData.timeSlot && (
                      <div className="bg-primary/5 p-6 rounded-[24px] border border-primary/10 text-center animate-in slide-in-from-bottom-2">
                        <label className="text-[9px] font-black text-primary uppercase tracking-widest block mb-3">Do you have a specific arrival time in mind?</label>
                        <input placeholder="e.g. 9:30 AM" className="w-full p-4 px-6 rounded-xl bg-white border border-primary/20 outline-none font-bold text-xs text-center" value={formData.preferredTime} onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}/>
                      </div>
                    )}
                  </div>
                )}

                {step === 8 && (
                  <div className="space-y-6 md:space-y-8 animate-in fade-in">
                    <h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">Your Details & Payment.</h1>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <input className="p-5 rounded-2xl bg-slate-50 border-none shadow-sm outline-none font-bold text-sm" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}/>
                      <input className="p-5 rounded-2xl bg-slate-50 border-none shadow-sm outline-none font-bold text-sm" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}/>
                      <input className="p-5 rounded-2xl bg-slate-50 border-none shadow-sm outline-none font-bold text-sm md:col-span-2" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}/>
                      <input className="p-5 rounded-2xl bg-slate-50 border-none shadow-sm outline-none font-bold text-sm md:col-span-2" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}/>
                    </div>
                    <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 mb-6"><p className="text-sm font-bold text-primary-dark mb-3">Booking: <span className="text-primary">{formData.serviceType}</span> on <span className="text-primary">{formData.date}</span> at <span className="text-primary">{formData.address}</span></p><div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-widest"><ShieldCheck size={18} />Securely processed by Stripe</div></div>
                    <Elements stripe={stripePromise}><StripePayment amount={totalPrice} currency={region.id === 'UK' ? 'GBP' : 'NGN'} customerInfo={formData} onPaymentSuccess={handlePaymentSuccess} /></Elements>
                    
                    {/* Developer Test Mode */}
                    {/* <div className="mt-8 pt-8 border-t border-slate-100">
                      <button 
                        onClick={() => handlePaymentSuccess({ id: `TEST-${Date.now()}` })}
                        className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 hover:text-slate-600 transition-all border-2 border-dashed border-slate-200"
                      >
                        Dev: Submit Without Paying (TEST MODE)
                      </button>
                    </div> */}
                  </div>
                )}

                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-white/80 backdrop-blur-sm border-t border-slate-50 flex justify-between items-center pointer-events-none">
                  {step > 1 ? (
                    <button onClick={prevStep} className="pointer-events-auto flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black text-[9px] uppercase tracking-widest group">
                      <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-all" />
                      <span className="hidden xs:inline">Go Back</span>
                    </button>
                  ) : <div/>}
                  {step < 8 && (
                    <button onClick={nextStep} className="pointer-events-auto flex items-center gap-3 md:gap-4 bg-primary text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-black text-[10px] md:text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all group">
                      Next Step <ArrowRight size={18} className="group-hover:translate-x-1 transition-all" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
            <div className="bg-white rounded-[40px] p-8 shadow-xl border-4 border-white relative overflow-hidden">
              <div className="space-y-6 mb-8 text-xs max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <div className="flex gap-3"><div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><MapPin size={14}/></div><div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Address</p><p className="font-bold text-slate-700 leading-tight">{formData.address || 'Address not set'}</p></div></div>
                <div className="flex gap-3"><div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><Zap size={14}/></div><div className="flex-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Service Breakdown</p><p className="font-bold text-slate-700 mb-2">{formData.serviceType || 'Selection required'}</p>
                  <div className="space-y-2">
                    {formData.duration > 0 && <div className="flex justify-between items-center text-[10px] bg-amber-50 p-2 rounded-lg border border-amber-100"><span className="font-bold text-amber-600">Hours</span><span className="font-black text-amber-700">{formData.duration}h</span></div>}
                    {Object.entries(formData.property).map(([name, qty]) => qty > 0 ? (<div key={name} className="flex justify-between items-center text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="font-bold text-slate-500">{name}</span><span className="font-black text-primary">x{qty}</span></div>) : null)}
                    {Object.entries(formData.extras).map(([name, qty]) => qty > 0 ? (<div key={name} className="flex justify-between items-center text-[10px] bg-primary/5 p-2 rounded-lg border border-primary/10"><span className="font-bold text-primary-dark">{name}</span><span className="font-black text-primary">x{qty}</span></div>) : null)}
                  </div>
                </div></div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center"><div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Estimated Total</p><p className="text-2xl md:text-3xl font-extrabold text-primary-dark tracking-tighter">{region.symbol}{totalPrice}</p></div><div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary"><ShieldCheck size={28} className="fill-current" /></div></div>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 flex items-center justify-between shadow-sm"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#4285F4]/10 rounded-lg flex items-center justify-center"><Star className="text-[#4285F4] fill-current" size={16} /></div><div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Excellent</p><p className="text-[11px] font-bold text-primary-dark">4.9/5 on Google</p></div></div><div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={8} className="text-amber-400 fill-current" />)}</div></div>
              <div className="bg-primary-dark rounded-[32px] p-6 text-white space-y-4 shadow-lg"><div className="flex items-center gap-3"><Shield size={16}/><p className="text-[10px] font-bold uppercase tracking-widest">Fully Insured</p></div><div className="flex items-center gap-3"><User size={16}/><p className="text-[10px] font-bold uppercase tracking-widest">Vetted Pros</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
