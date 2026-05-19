import React, { useState, useEffect } from "react";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { useRegion } from "../context/RegionContext";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  CreditCard,
  Home as HomeIcon,
  Briefcase,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  MapPin,
  Clock,
  Info,
  ShieldCheck,
  Heart,
  Star,
  Search,
  Zap,
  Shield,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  Truck,
  Key,
  Car,
  Layout,
  Coffee,
  Waves,
  Refrigerator,
  Wind,
} from "lucide-react";
// Stripe will be loaded lazily to reduce initial JS bundle size
import { Helmet } from "react-helmet-async";
import StripeLazyLoader from "../component/StripeLazyLoader";

const serviceOptions = [
  {
    id: "Residential Cleaning",
    title: "Residential Cleaning",
    tag: "Reliable domestic cleaners",
    bullets: [
      "Dusting of all surfaces.",
      "Vacuuming & Mopping.",
      "Kitchen degreasing.",
      "Bathroom sanitization.",
      "Bed making & tidying.",
      "Trash removal.",
    ],
    icon: <Heart />,
  },
  {
    id: "Deep Clean",
    title: "Deep Clean",
    tag: "Deep cleaning",
    bullets: [
      "Inside cabinets & drawers.",
      "Baseboard scrubbing.",
      "Door frame cleaning.",
      "Wall spot cleaning.",
      "Appliance deep clean.",
      "End-of-tenancy guarantee.",
    ],
    icon: <Zap />,
  },
  {
    id: "Airbnb Cleaning",
    title: "Airbnb Cleaning",
    tag: "Short-let specialist",
    bullets: [
      "Linen & towel change.",
      "Guest amenity restock.",
      "Photo-verified check.",
      "Damage reporting.",
      "Inventory monitoring.",
      "5-star turnover prep.",
    ],
    icon: <Star />,
  },
  {
    id: "Office Cleaning",
    title: "Office Cleaning",
    tag: "Expert office cleaning",
    bullets: [
      "Workstation sanitization.",
      "Communal area cleaning.",
      "Restroom maintenance.",
      "Window cleaning.",
      "Carpet deep clean.",
      "Disinfection services.",
    ],
    icon: <Briefcase />,
  },
  {
    id: "End of Tenancy",
    title: "End of Tenancy",
    tag: "Moving out/in clean",
    bullets: [
      "Full property deep clean.",
      "Inside all appliances.",
      "Window & frame cleaning.",
      "Carpet steam cleaning.",
      "Deposit back guarantee.",
      "Move-in ready finish.",
    ],
    icon: <Truck />,
  },
];

const CustomCalendar = ({ selectedDate, onDateSelect, bookedDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  const days = [];
  const totalDays = daysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
  );
  const startDay = startDayOfMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
  );
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++)
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const sel = new Date(selectedDate);
    return (
      date.getDate() === sel.getDate() &&
      date.getMonth() === sel.getMonth() &&
      date.getFullYear() === sel.getFullYear()
    );
  };
  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  const isBooked = (date) => {
    if (!date) return false;
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return bookedDates.includes(dStr);
  };

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h3 className="font-black text-primary-dark tracking-tighter text-base md:text-lg">
          {currentMonth.toLocaleString("default", { month: "long" })}{" "}
          <span className="text-primary">{currentMonth.getFullYear()}</span>
        </h3>
        <div className="flex gap-1 md:gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 md:p-2 rounded-lg md:xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 md:p-2 rounded-lg md:xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase text-center py-2"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map((date, i) => {
          const booked = isBooked(date);
          const past = isPast(date);
          const disabled = booked || past;
          return (
            <div key={i} className="aspect-square">
              {date ? (
                <button
                  disabled={disabled}
                  onClick={() =>
                    onDateSelect(
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
                    )
                  }
                  className={`w-full h-full rounded-xl text-center flex items-center justify-center relative font-black text-sm transition-all ${isSelected(date) ? "bg-primary text-white shadow-lg" : booked ? "bg-rose-50 text-rose-300 cursor-not-allowed" : past ? "bg-slate-50 text-slate-200 cursor-not-allowed" : "bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary"}`}
                >
                  <span className="text-xs md:text-sm font-black">
                    {date.getDate()}
                  </span>
                  {booked && (
                    <span className="text-[6px] md:text-[7px] font-black uppercase text-rose-500 absolute top-0.5 md:top-1">
                      Taken
                    </span>
                  )}
                  {isToday(date) && !isSelected(date) && (
                    <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full absolute bottom-1.5 md:bottom-2 bg-primary" />
                  )}
                </button>
              ) : (
                <div className="w-full h-full" />
              )}
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
  const preSelectedService = searchParams.get("service");

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [bookedSlotsByDate, setBookedSlotsByDate] = useState({});

  const [formData, setFormData] = useState({
    address: "",
    addressLine2: "",
    postcode: "",
    serviceType: preSelectedService || "",
    frequency: "Once",
    duration: 2,
    property: {},
    extras: {},
    parking: "Available on-site",
    keyAccess: "I will be home",
    date: "",
    timeSlot: "",
    preferredTime: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialInstructions: "",
    hasPet: null,
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicRates, setDynamicRates] = useState({});
  const [servicesList, setServicesList] = useState([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Dynamic Rates from VPS
  useEffect(() => {
    const fetchExistingBookings = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/bookings`,
        );
        const data = await response.json();

        // Group booking slots by date
        const slotsMap = {};
        data.forEach((b) => {
          if (b.schedule?.date && b.schedule?.timeSlot) {
            const d = new Date(b.schedule.date);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

            if (!slotsMap[dateStr]) {
              slotsMap[dateStr] = [];
            }
            if (!slotsMap[dateStr].includes(b.schedule.timeSlot)) {
              slotsMap[dateStr].push(b.schedule.timeSlot);
            }
          }
        });

        // A date is fully booked ONLY if all three standard slots are taken
        const fullyBookedDates = Object.keys(slotsMap).filter((dateStr) => {
          const slots = slotsMap[dateStr];
          return (
            slots.includes("Morning (8am-12pm)") &&
            slots.includes("Afternoon (12pm-4pm)") &&
            slots.includes("Evening (4pm-8pm)")
          );
        });

        console.log("Booked Slots Map Loaded:", slotsMap);
        console.log(
          "Fully Booked Dates (Disabled in Calendar):",
          fullyBookedDates,
        );

        setBookedSlotsByDate(slotsMap);
        setBookedDates(fullyBookedDates);
      } catch (err) {
        console.error("Error fetching booked dates:", err);
      }
    };

    const fetchRates = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/services?region=${region.id}&t=${Date.now()}`,
        );
        const data = await response.json();

        // Safety Fallbacks (UK)
        const fallbackExtrasUK = [
          { name: "American fridge freeze", rate: 15 },
          { name: "Carpet(s) Cleaning", rate: 30 },
          { name: "Double Oven Cleaning", rate: 20 },
          { name: "Fridge and freezer", rate: 18 },
          { name: "Range Oven Cleaning", rate: 25 },
          { name: "Single fridge", rate: 10 },
          { name: "Single Oven Cleaning", rate: 15 },
          { name: "Venetian Blinds", rate: 5 },
        ];

        // Safety Fallbacks (NG)
        const fallbackExtrasNG = [
          { name: "American fridge freeze", rate: 8000 },
          { name: "Carpet(s) Cleaning", rate: 15000 },
          { name: "Double Oven Cleaning", rate: 12000 },
          { name: "Fridge and freezer", rate: 10000 },
          { name: "Range Oven Cleaning", rate: 15000 },
          { name: "Single fridge", rate: 5000 },
          { name: "Single Oven Cleaning", rate: 8000 },
          { name: "Venetian Blinds", rate: 3000 },
        ];

        const fallbackRooms = [
          { name: "Bedroom", rate: 0 },
          { name: "Bathroom", rate: 0 },
          { name: "Cloakroom", rate: 0 },
          { name: "Kitchen", rate: 0 },
          { name: "Utility Room", rate: 0 },
          { name: "Reception Room", rate: 0 },
          { name: "Conservatory", rate: 0 },
        ];

        const fallbacks = [
          ...(region.id === "UK" ? fallbackExtrasUK : fallbackExtrasNG),
          ...fallbackRooms,
        ];

        // Merge DB data with fallbacks (DB entries always override fallbacks)
        const combined = [...data];
        const clean = (str) =>
          str
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .trim();

        fallbacks.forEach((fb) => {
          if (!data.some((db) => clean(db.name) === clean(fb.name))) {
            combined.push({ _id: `fallback-${fb.name}`, ...fb, type: "flat" });
          }
        });

        setServicesList(combined);
        const ratesObj = {};
        combined.forEach((service) => {
          ratesObj[service.name.trim()] = service.rate;
        });
        setDynamicRates(ratesObj);
      } catch (error) {
        console.error("Error fetching rates:", error);
      } finally {
        setLoadingRates(false);
      }
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
      "Residential Cleaning": "17.90/hr",
      "Deep Clean": "24.90/hr",
      "Airbnb Cleaning": "21.90/hr",
      "Office Cleaning": "19.90/hr",
      Bedroom: 15,
      Bathroom: 12,
      Cloakroom: 8,
      Kitchen: 15,
      "Utility Room": 10,
      "Reception Room": 12,
      Conservatory: 15,
      "American fridge freeze": 15,
      "Carpet(s) Cleaning": 30,
      "Double Oven Cleaning": 20,
      "Fridge and freezer": 18,
      "Range Oven Cleaning": 25,
      "Single fridge": 10,
      "Single Oven Cleaning": 15,
      "Venetian Blinds": 5,
    };
    const fallbackNG = {
      "Residential Cleaning": 15000,
      "Deep Clean": 25000,
      "Airbnb Cleaning": 20000,
      "Office Cleaning": 18000,
      Bedroom: 5000,
      Bathroom: 4000,
      Cloakroom: 2500,
      Kitchen: 6000,
      "Utility Room": 3000,
      "Reception Room": 5000,
      Conservatory: 7000,
      "American fridge freeze": 8000,
      "Carpet(s) Cleaning": 15000,
      "Double Oven Cleaning": 12000,
      "Fridge and freezer": 10000,
      "Range Oven Cleaning": 15000,
      "Single fridge": 5000,
      "Single Oven Cleaning": 8000,
      "Venetian Blinds": 3000,
    };

    const rates = region.id === "UK" ? fallbackUK : fallbackNG;

    // Base Service Rate (Multiplied by Duration for all regions - Price/Hr)
    const rawBaseRate =
      dynamicRates[formData.serviceType.trim()] ||
      rates[formData.serviceType.trim()] ||
      20;
    const baseRate = parseFloat(rawBaseRate) || 20;
    total += baseRate * formData.duration;

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

    if (formData.frequency === "Weekly") total *= 0.9;
    if (formData.frequency === "Fortnightly") total *= 0.95;

    setTotalPrice(Math.round(total * 100) / 100);
  }, [formData, region, dynamicRates]);

  const updateRoom = (name, delta) => {
    setFormData((prev) => {
      const current = prev.property[name] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, property: { ...prev.property, [name]: next } };
    });
  };

  const updateExtra = (name, delta) => {
    setFormData((prev) => {
      const current = prev.extras[name] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, extras: { ...prev.extras, [name]: next } };
    });
  };

  const nextStep = () => {
    // Validation
    if (step === 1) {
      if (!formData.address || !formData.postcode) {
        showNotification("Please provide your address and postcode.");
        return;
      }
      if (!formData.serviceType) {
        showNotification("Please select a service type.");
        return;
      }
    }
    if (step === 2) {
      const totalRooms = Object.values(formData.property).reduce(
        (a, b) => a + b,
        0,
      );
      if (totalRooms === 0) {
        showNotification("Please select at least one room or area.");
        return;
      }
    }
    if (step === 3) {
      if (!formData.parking || !formData.keyAccess) {
        showNotification("Please select parking and access options.");
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => {
      return Math.min(s + 1, 4);
    });
  };
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => Math.max(s - 1, 1));
  };

  const steps = [
    { id: 1, title: "Location" },
    { id: 2, title: "Home & Hours" },
    { id: 3, title: "Add-ons" },
    { id: 4, title: "Payment" },
  ];

  // Address Suggestions Logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (formData.address.length < 3) {
        setAddressSuggestions([]);
        return;
      }
      try {
        const ukBbox =
          "-7.57216793459,49.959999905,1.68153079591,58.6350001085";
        const ngBbox = "2.6917,4.2406,14.6800,13.8659";
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(formData.address)}&limit=8&lang=en&bbox=${region.id === "UK" ? ukBbox : ngBbox}`,
        );
        if (!response.ok) {
          setAddressSuggestions([]);
          return;
        }

        const data = await response.json();
        if (!data.features || data.features.length === 0) {
          setAddressSuggestions([]);
          return;
        }

        const formatted = data.features
          .map((f) => {
            const { name, street, housenumber, city, postcode, state } =
              f.properties;
            return [housenumber, street || name, city, postcode, state]
              .filter(Boolean)
              .join(", ");
          })
          .filter(Boolean);
        setAddressSuggestions([...new Set(formatted)]);
      } catch (err) {
        console.error("Suggestions fetch error:", err);
        setAddressSuggestions([]); // IMPORTANT: Clear old suggestions if it fails so it doesn't stay open
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 400); // Increased debounce to 400ms to reduce API load
    return () => clearTimeout(timeoutId);
  }, [formData.address, region.id]);

  const selectAddress = (addr) => {
    setFormData({ ...formData, address: addr });
    setShowSuggestions(false);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    if (!formData.serviceType) {
      console.error("Submission Blocked: Service type is missing.");
      showNotification(
        "Please select a service type before completing your booking.",
      );
      return;
    }

    const bookingPayload = {
      bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: {
        firstName: formData.firstName || "Customer",
        lastName: formData.lastName || "User",
        email: formData.email || "pending@cleaniq.com",
        phone: formData.phone || "000",
      },
      service: formData.serviceType,
      details: {
        address: `${formData.address}${formData.addressLine2 ? ", " + formData.addressLine2 : ""}${formData.postcode ? ", " + formData.postcode : ""}`,
        frequency: formData.frequency,
        duration: formData.duration,
        extras: [
          ...Object.entries(formData.extras)
            .filter(([_, q]) => q > 0)
            .map(([n, q]) => `${n} (x${q})`),
          ...Object.entries(formData.property)
            .filter(([_, q]) => q > 0)
            .map(([n, q]) => `${n} (x${q})`),
          `Parking: ${formData.parking}`,
          `Entry: ${formData.keyAccess}`,
          `Pet on premises: ${formData.hasPet || "Not specified"}`,
          `Instructions: ${formData.specialInstructions || "None"}`,
        ],
      },
      schedule: {
        date: formData.date,
        timeSlot: formData.timeSlot,
        preferredTime: formData.preferredTime,
      },
      payment: {
        amount: totalPrice,
        currency: region.id === "UK" ? "GBP" : "NGN",
        method: "Stripe",
        transactionId: paymentIntent.id,
      },
      region: region.id,
    };
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });
      if (response.ok) setIsSubmitted(true);
    } catch (error) {
      console.error("Error saving booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="pt-40 pb-20 min-h-screen bg-white flex items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 bg-primary rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20 rotate-12">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-dark mb-4 tracking-tighter">
            Confirmed!
          </h1>
          <p className="text-slate-500 font-bold mb-10">
            Check your email for confirmation.
          </p>
          <Link
            to="/"
            className="btn-primary inline-flex px-10 py-4 rounded-full text-sm"
          >
            Return Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 min-h-screen bg-[#F8FAFC] pb-32">
      <Helmet>
        <title>Book Cleaning — CLEANIQ Services</title>
        <meta
          name="description"
          content="Book professional cleaning services in Manchester. Quick online booking for residential, deep clean, Airbnb turnovers, and office cleaning."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/booking" />
        <meta
          property="og:title"
          content={"Book Cleaning — CLEANIQ Services"}
        />
      </Helmet>
      {isSubmitting && <LoadingOverlay message="Confirming..." />}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-6 md:mb-10 bg-white p-2 md:p-5 rounded-[20px] md:rounded-[24px] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar sticky top-32 z-40">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${step === s.id ? "bg-primary text-white shadow-md" : s.id < step ? "text-primary" : "text-slate-300"}`}
              >
                <div
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center font-black text-[8px] md:text-[9px] ${step === s.id ? "bg-white/20" : s.id < step ? "bg-primary/20" : "bg-slate-200"}`}
                >
                  {s.id < step ? <CheckCircle2 size={10} /> : s.id}
                </div>
                <span className="font-black text-[7px] md:text-[8px] uppercase tracking-widest hidden xs:block">
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight
                  size={10}
                  className="mx-1 md:mx-2 text-slate-200"
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[24px] md:rounded-[40px] p-5 md:p-10 border border-slate-100 relative min-h-[600px]"
              >
                <div className="flex-1 pb-20 md:pb-24">
                  {step === 1 && (
                    <div className="space-y-10 animate-in fade-in">
                      <div className="space-y-6">
                        <div>
                          <h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">
                            Where are we cleaning?
                          </h1>
                          <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                            Enter your address to get started
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="relative group">
                            <Search
                              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors"
                              size={20}
                            />
                            <input
                              className="w-full p-6 pl-14 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm transition-all"
                              placeholder="Search address..."
                              value={formData.address}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  address: e.target.value,
                                });
                                setShowSuggestions(true);
                              }}
                              onFocus={() => setShowSuggestions(true)}
                            />
                            <AnimatePresence>
                              {showSuggestions &&
                                addressSuggestions.length > 0 && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setShowSuggestions(false)}
                                    />
                                    <motion.div
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 max-h-64 overflow-y-auto"
                                    >
                                      {addressSuggestions.map((addr, i) => (
                                        <button
                                          key={i}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            selectAddress(addr);
                                          }}
                                          onClick={() => selectAddress(addr)}
                                          className="w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-b-0"
                                        >
                                          <p className="text-xs font-bold text-primary-dark">
                                            {addr}
                                          </p>
                                        </button>
                                      ))}
                                    </motion.div>
                                  </>
                                )}
                            </AnimatePresence>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <input
                              className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm transition-all"
                              placeholder="Address Line 2 (optional)"
                              value={formData.addressLine2}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  addressLine2: e.target.value,
                                })
                              }
                            />
                            <input
                              className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm transition-all"
                              placeholder="Postcode"
                              value={formData.postcode}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  postcode: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-10 border-t border-slate-100">
                        <h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight mb-8">
                          What type of cleaning?
                        </h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {serviceOptions.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setFormData({ ...formData, serviceType: s.id });
                              }}
                              className={`flex flex-col items-center p-6 rounded-[32px] border-4 transition-all duration-300 ${formData.serviceType === s.id ? "border-primary bg-primary/5 shadow-lg" : "border-slate-100 hover:border-primary/30"}`}
                            >
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${formData.serviceType === s.id ? "bg-primary text-white shadow-lg" : "bg-primary/5 text-primary"}`}
                              >
                                {s.icon}
                              </div>
                              <p
                                className={`font-black text-lg tracking-tighter ${formData.serviceType === s.id ? "text-primary" : "text-primary-dark"}`}
                              >
                                {s.title}
                              </p>
                              <div className="mt-1 mb-4">
                                <span className="text-base font-black text-primary-dark">
                                  {region.symbol}
                                  {String(
                                    dynamicRates[s.id.trim()] ||
                                      (region.id === "UK"
                                        ? s.id === "Deep Clean"
                                          ? "24.90"
                                          : s.id === "Airbnb Cleaning"
                                            ? "21.90"
                                            : s.id === "Office Cleaning"
                                              ? "19.90"
                                              : "17.90"
                                        : s.id === "Deep Clean"
                                          ? "25000"
                                          : s.id === "Airbnb Cleaning"
                                            ? "20000"
                                            : s.id === "Office Cleaning"
                                              ? "18000"
                                              : "15000"),
                                  )
                                    .replace("/hr", "")
                                    .replace("/hour", "")}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 ml-1">
                                  / hr
                                </span>
                              </div>

                              <div className="space-y-2 w-full text-left pt-4 border-t border-slate-100">
                                {s.bullets.map((bullet, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2"
                                  >
                                    <CheckCircle2
                                      size={12}
                                      className={
                                        formData.serviceType === s.id
                                          ? "text-primary"
                                          : "text-slate-300"
                                      }
                                    />
                                    <p className="text-[10px] font-bold text-slate-500">
                                      {bullet}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-10 animate-in fade-in">
                      <div className="grid md:grid-cols-2 gap-10">
                        <div>
                          <div>
                            <h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">
                              Tell us about your home
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                              Select rooms for a personalized quote
                            </p>
                          </div>
                          <div className="grid gap-3 mt-6">
                            {[
                              { name: "Bedroom", icon: <HomeIcon size={18} /> },
                              { name: "Bathroom", icon: <Waves size={18} /> },
                              { name: "Kitchen", icon: <Coffee size={18} /> },
                              {
                                name: "Living Room",
                                icon: <Layout size={18} />,
                              },
                            ].map((room) => (
                              <div
                                key={room.name}
                                className="flex items-center justify-between p-3 px-5 rounded-2xl bg-slate-50 border border-slate-100"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                                    {room.icon}
                                  </div>
                                  <span className="font-bold text-xs text-primary-dark">
                                    {room.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={() => updateRoom(room.name, -1)}
                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm hover:bg-slate-50"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="text-base font-black text-primary-dark w-4 text-center">
                                    {formData.property[room.name] || 0}
                                  </span>
                                  <button
                                    onClick={() => updateRoom(room.name, 1)}
                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm hover:bg-slate-50"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pet Question */}
                          <div className="mt-4 p-5 rounded-2xl bg-white border-2 border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                              🐾 Do you have a pet at home?
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {["Yes", "No"].map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() =>
                                    setFormData({ ...formData, hasPet: opt })
                                  }
                                  className={`py-4 rounded-2xl border-2 font-black text-sm transition-all ${
                                    formData.hasPet === opt
                                      ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                                      : "border-slate-100 bg-slate-50 text-slate-500 hover:border-primary/30"
                                  }`}
                                >
                                  {opt === "Yes"
                                    ? "🐶 Yes, I have a pet"
                                    : "🚫 No pets"}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex flex-col justify-center">
                          <div className="text-center mb-8">
                            <h2 className="text-xl font-extrabold text-primary-dark tracking-tight">
                              How long?
                            </h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              Select hours for the cleaning
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-8 mb-8">
                            <button
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  duration: Math.max(2, formData.duration - 1),
                                })
                              }
                              className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary hover:bg-slate-50"
                            >
                              <Minus size={20} />
                            </button>
                            <div className="text-center">
                              <span className="text-5xl font-black text-primary-dark">
                                {formData.duration}
                              </span>
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest">
                                hours
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  duration: Math.min(8, formData.duration + 1),
                                })
                              }
                              className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary hover:bg-slate-50"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["Once", "Weekly", "Fortnightly"].map((f) => (
                              <button
                                key={f}
                                onClick={() =>
                                  setFormData({ ...formData, frequency: f })
                                }
                                className={`py-4 rounded-2xl border-2 font-black text-xs transition-all ${formData.frequency === f ? "border-primary bg-primary text-white shadow-md" : "border-slate-100 bg-white text-slate-400 hover:border-primary/30"}`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-10 animate-in fade-in">
                      <div className="grid md:grid-cols-2 gap-10">
                        <div>
                          <div>
                            <h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">
                              Extras Services
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                              Add optional extras to your booking
                            </p>
                          </div>
                          <div className="grid gap-3 mt-6">
                            {servicesList
                              .filter((s) => {
                                const baseServices = [
                                  ...serviceOptions.map((o) => o.id),
                                  "Bedroom",
                                  "Bathroom",
                                  "Kitchen",
                                  "Living Room",
                                  "Cloakroom",
                                  "Utility Room",
                                  "Reception Room",
                                  "Conservatory",
                                ];
                                const clean = (str) =>
                                  str
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, "")
                                    .trim();
                                return !baseServices.some(
                                  (base) => clean(base) === clean(s.name),
                                );
                              })
                              .map((extra) => {
                                const iconMap = {
                                  "american fridge freeze": <Refrigerator />,
                                  "carpet(s) cleaning": <Star />,
                                  "double oven cleaning": <Zap />,
                                  "fridge and freezer": <Refrigerator />,
                                  "range oven cleaning": <Zap />,
                                  "single fridge": <Refrigerator />,
                                  "single oven cleaning": <Zap />,
                                  "venetian blinds": <Wind />,
                                };
                                const cleanName = extra.name
                                  .toLowerCase()
                                  .replace(/[^a-z0-9\s]/g, "")
                                  .trim();
                                return (
                                  <div
                                    key={extra._id}
                                    className="flex items-center justify-between p-3 px-5 rounded-2xl bg-slate-50 border border-slate-100"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                                        {iconMap[cleanName] || (
                                          <Star size={18} />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-primary-dark">
                                          {extra.name}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400">
                                          {region.symbol}
                                          {extra.rate}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <button
                                        onClick={() =>
                                          updateExtra(extra.name, -1)
                                        }
                                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm hover:bg-slate-50"
                                      >
                                        <Minus size={14} />
                                      </button>
                                      <span className="text-base font-black text-primary-dark w-4 text-center">
                                        {formData.extras[extra.name] || 0}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateExtra(extra.name, 1)
                                        }
                                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm hover:bg-slate-50"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div>
                            <h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">
                              Logistics
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                              Help us prepare for your visit
                            </p>
                          </div>
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Car size={14} className="text-primary" />{" "}
                                Parking Availability
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  "Available on-site",
                                  "Public Parking",
                                  "Paid Parking",
                                  "No Parking",
                                ].map((p) => (
                                  <button
                                    key={p}
                                    onClick={() =>
                                      setFormData({ ...formData, parking: p })
                                    }
                                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${formData.parking === p ? "border-primary bg-primary text-white shadow-md" : "border-slate-100 bg-white text-slate-400 hover:border-primary/30"}`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Key size={14} className="text-primary" /> Entry
                                Instructions
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  "I will be home",
                                  "Key under mat",
                                  "Concierge/Reception",
                                  "Lockbox/Code",
                                ].map((k) => (
                                  <button
                                    key={k}
                                    onClick={() =>
                                      setFormData({ ...formData, keyAccess: k })
                                    }
                                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${formData.keyAccess === k ? "border-primary bg-primary text-white shadow-md" : "border-slate-100 bg-white text-slate-400 hover:border-primary/30"}`}
                                  >
                                    {k}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} className="text-primary" />{" "}
                                Special Instructions
                              </p>
                              <textarea
                                className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-xs resize-none"
                                rows={3}
                                placeholder="Example: Gate code is 1234, focus on kitchen..."
                                value={formData.specialInstructions}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    specialInstructions: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-10 animate-in fade-in">
                      <div className="flex flex-col gap-10">
                        {/* Date & Time */}
                        <div className="space-y-6">
                          <div>
                            <h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">
                              Select Date & Time
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                              Choose your preferred booking date
                            </p>
                          </div>
                          <CustomCalendar
                            selectedDate={formData.date}
                            onDateSelect={(d) =>
                              setFormData({
                                ...formData,
                                date: d,
                                timeSlot: "",
                                preferredTime: "",
                              })
                            }
                            bookedDates={bookedDates}
                          />
                          {formData.date && (
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                "Morning (8am-12pm)",
                                "Afternoon (12pm-4pm)",
                                "Evening (4pm-8pm)",
                              ].map((slot) => {
                                const isSlotBooked =
                                  bookedSlotsByDate[formData.date]?.includes(
                                    slot,
                                  );
                                return (
                                  <button
                                    key={slot}
                                    disabled={isSlotBooked}
                                    onClick={() =>
                                      setFormData({
                                        ...formData,
                                        timeSlot: slot,
                                      })
                                    }
                                    className={`p-5 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${
                                      formData.timeSlot === slot
                                        ? "border-primary bg-primary text-white shadow-md"
                                        : isSlotBooked
                                          ? "border-rose-100 bg-rose-50 text-rose-300 cursor-not-allowed"
                                          : "border-slate-100 bg-white text-slate-400 hover:border-primary/30"
                                    }`}
                                  >
                                    {slot} {isSlotBooked && "(Booked)"}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {formData.timeSlot && (
                            <div className="animate-in slide-in-from-bottom-2 space-y-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} className="text-primary" /> Do
                                you have a specific start time?
                              </p>
                              <input
                                type="text"
                                placeholder="e.g. 9:30 AM"
                                className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm"
                                value={formData.preferredTime}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    preferredTime: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>

                        {/* Customer Details */}
                        <div className="space-y-6">
                          <div>
                            <h1 className="text-xl md:text-3xl font-extrabold text-primary-dark tracking-tight">
                              Your Details
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                              We'll use this to confirm your booking
                            </p>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <input
                              className="p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm"
                              placeholder="First Name"
                              value={formData.firstName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  firstName: e.target.value,
                                })
                              }
                            />
                            <input
                              className="p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm"
                              placeholder="Last Name"
                              value={formData.lastName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  lastName: e.target.value,
                                })
                              }
                            />
                            <input
                              className="p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm md:col-span-2"
                              placeholder="Email Address"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  email: e.target.value,
                                })
                              }
                            />
                            <input
                              className="p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 shadow-sm outline-none font-bold text-sm md:col-span-2"
                              placeholder="Phone Number"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* Payment */}
                        <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
                          <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-widest mb-4">
                            <ShieldCheck size={18} />
                            Securely processed by Stripe
                          </div>
                          <StripeLazyLoader
                            amount={totalPrice}
                            currency={region.id === "UK" ? "GBP" : "NGN"}
                            customerInfo={formData}
                            onPaymentSuccess={handlePaymentSuccess}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-white/80 backdrop-blur-sm border-t border-slate-50 flex justify-between items-center pointer-events-none rounded-b-[24px] md:rounded-b-[40px]">
                  {step > 1 ? (
                    <button
                      onClick={prevStep}
                      className="pointer-events-auto group flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black text-[9px] uppercase tracking-widest"
                    >
                      <ChevronLeft
                        size={18}
                        className="group-hover:-translate-x-1 transition-all"
                      />
                      <span className="hidden xs:inline">Go Back</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  {step < 4 && (
                    <button
                      onClick={nextStep}
                      className="pointer-events-auto group flex items-center gap-3 md:gap-4 bg-primary text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-primary/30 transition-all"
                    >
                      Next Step{" "}
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-all"
                      />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
            <div className="bg-white rounded-[40px] p-8 shadow-xl border-4 border-white relative overflow-hidden">
              <div className="space-y-6 mb-8 text-xs max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Location
                    </p>
                    <p className="font-bold text-primary-dark">
                      {formData.address || "Select address"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Zap size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                      Service Details
                    </p>
                    <div className="space-y-2">
                      {formData.duration > 0 && (
                        <div className="flex justify-between items-center text-[10px] bg-amber-50 p-2 rounded-lg border border-amber-100">
                          <span className="font-bold text-amber-600">
                            {formData.serviceType}
                          </span>
                          <span className="font-black text-amber-600">
                            {region.symbol}
                            {formData.serviceType &&
                              (() => {
                                const rawRate =
                                  dynamicRates[formData.serviceType.trim()] ||
                                  (region.id === "UK"
                                    ? formData.serviceType === "Deep Clean"
                                      ? 24.9
                                      : formData.serviceType ===
                                          "Airbnb Cleaning"
                                        ? 21.9
                                        : formData.serviceType ===
                                            "Office Cleaning"
                                          ? 19.9
                                          : 17.9
                                    : formData.serviceType === "Deep Clean"
                                      ? 25000
                                      : formData.serviceType ===
                                          "Airbnb Cleaning"
                                        ? 20000
                                        : formData.serviceType ===
                                            "Office Cleaning"
                                          ? 18000
                                          : 15000);
                                return (
                                  (parseFloat(rawRate) || 20) *
                                  formData.duration
                                );
                              })()}
                          </span>
                        </div>
                      )}
                      {Object.entries(formData.property).map(([name, qty]) =>
                        qty > 0 ? (
                          <div
                            key={name}
                            className="flex justify-between items-center text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100"
                          >
                            <span className="font-bold text-slate-600">
                              {name} x{qty}
                            </span>
                            <span className="font-black text-slate-600">
                              {region.symbol}
                              {(dynamicRates[name.trim()] || 0) * qty}
                            </span>
                          </div>
                        ) : null,
                      )}
                      {Object.entries(formData.extras).map(([name, qty]) =>
                        qty > 0 ? (
                          <div
                            key={name}
                            className="flex justify-between items-center text-[10px] bg-primary/5 p-2 rounded-lg border border-primary/20"
                          >
                            <span className="font-bold text-primary-dark">
                              {name} x{qty}
                            </span>
                            <span className="font-black text-primary">
                              {region.symbol}
                              {(dynamicRates[name.trim()] || 0) * qty}
                            </span>
                          </div>
                        ) : null,
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Estimated Total
                  </p>
                  <p className="text-2xl font-black text-primary-dark">
                    {region.symbol}
                    {totalPrice}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center">
                    <Shield size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">
                      Trusted Provider
                    </p>
                    <p className="font-bold text-primary-dark text-xs">
                      Verified & Insured
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-primary-dark rounded-[32px] p-6 text-white space-y-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <Shield size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    100% Satisfaction Guarantee
                  </p>
                </div>
                <p className="text-[9px] leading-relaxed">
                  We're committed to delivering exceptional service. If you're
                  not satisfied, we'll make it right.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md"
          >
            <div
              className={`p-6 rounded-[32px] border-2 shadow-2xl flex items-center gap-4 bg-white ${notification.type === "error" ? "border-rose-100 text-rose-600" : "border-emerald-100 text-emerald-600"}`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notification.type === "error" ? "bg-rose-50" : "bg-emerald-50"}`}
              >
                {notification.type === "error" ? (
                  <AlertCircle size={24} />
                ) : (
                  <CheckCircle2 size={24} />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                  {notification.type}
                </p>
                <p className="font-bold text-sm leading-tight">
                  {notification.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Booking;
