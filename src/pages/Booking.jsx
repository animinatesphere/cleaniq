import React, { useState, useEffect } from "react";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { useRegion } from "../context/RegionContext";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Home as HomeIcon,
  Briefcase,
  Plus,
  Minus,
  CheckCircle2,
  MapPin,
  Clock,
  Info,
  ShieldCheck,
  Heart,
  Star,
  Zap,
  Shield,
  AlertCircle,
  ArrowRight,
  Truck,
  Key,
  Lock,
  Car,
  Layout,
  Coffee,
  Waves,
  Refrigerator,
  Wind,
  Sparkles,
} from "lucide-react";
// Stripe will be loaded lazily to reduce initial JS bundle size
import { Helmet } from "react-helmet-async";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePayment from "../component/StripePayment";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { buildBookedRanges, overlapsExistingRange } from "../utils/timeOverlap";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
    <div className="bg-white text-black rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h3 className="font-black text-black tracking-tighter text-base md:text-lg">
          {currentMonth.toLocaleString("default", { month: "long" })}{" "}
          <span className="text-[#10B981]">{currentMonth.getFullYear()}</span>
        </h3>
        <div className="flex gap-1 md:gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 md:p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-[#10B981] transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 md:p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-[#10B981] transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase text-center py-2"
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
                  className={`w-full h-full rounded-xl text-center flex items-center justify-center relative font-black text-sm transition-all ${isSelected(date) ? "bg-[#10B981] text-white shadow-lg" : booked ? "bg-rose-50 text-rose-500 cursor-not-allowed" : past ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#10B981]"}`}
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
                    <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full absolute bottom-1.5 md:bottom-2 bg-[#10B981]" />
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

const cleanKey = (str) =>
  (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

// Matches the "Cleaning Supply" extra service in the database — its rate is
// added to the total when Cleaniq provides supplies, and skipped when the
// customer provides their own. Admin can change the price anytime from the
// Services list since it's just a normal Extras-category service.
const SUPPLIES_EXTRA_NAME = "Cleaning Supply";

const Booking = () => {
  const { region } = useRegion();
  const { customer, loading: authLoading } = useCustomerAuth();
  const [searchParams] = useSearchParams();
  const preSelectedService = searchParams.get("service");
  const returnedStep = parseInt(searchParams.get("step") || "1");
  const crmMode =
    searchParams.get("crm") === "1" ||
    searchParams.get("crm") === "true" ||
    searchParams.get("crm") === "yes";

  const [step, setStep] = useState(returnedStep);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [bookedDates, setBookedDates] = useState([]);
  const [flexibleRangesByDate, setFlexibleRangesByDate] = useState({});

  // Draft persistence removed — the form always starts fresh on page
  // load/refresh. Any old saved draft from a previous version is wiped.
  const [formData, setFormData] = useState(() => {
    localStorage.removeItem("ciq_booking_draft");
    return {
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
      leadSource: "",
      suppliesProvidedBy: "",
    };
  });

  useEffect(() => {
    if (!customer) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData((prev) => {
      const updates = {};
      if (!prev.firstName && customer.firstName)
        updates.firstName = customer.firstName;
      if (!prev.lastName && customer.lastName)
        updates.lastName = customer.lastName;
      if (!prev.email && customer.email) updates.email = customer.email;
      if (!prev.phone && customer.phone) updates.phone = customer.phone;
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
  }, [customer]);

  const [totalPrice, setTotalPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [dynamicRates, setDynamicRates] = useState({});
  const [servicesList, setServicesList] = useState([]);
  const [, setLoadingRates] = useState(true);

  const dynamicServiceOptions = React.useMemo(() => {
    const bases = servicesList.filter((s) => s.category === "Base");
    const keys = ["residential", "commercial", "move", "airbnb", "tenancy"];

    const optionAssets = {
      residential: {
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
        defaultId: "Residential Cleaning",
        defaultTitle: "Residential Cleaning",
      },
      commercial: {
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
        defaultId: "Office Cleaning",
        defaultTitle: "Office Cleaning",
      },
      move: {
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
        defaultId: "Deep Clean",
        defaultTitle: "Deep Clean",
      },
      airbnb: {
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
        defaultId: "Airbnb Cleaning",
        defaultTitle: "Airbnb Cleaning",
      },
      tenancy: {
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
        defaultId: "End of Tenancy",
        defaultTitle: "End of Tenancy",
      },
    };

    const getLayoutKey = (name) => {
      const cleanName = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (
        cleanName.includes("residential") ||
        cleanName.includes("domestic") ||
        cleanName.includes("home") ||
        cleanName.includes("house")
      )
        return "residential";
      if (
        cleanName.includes("office") ||
        cleanName.includes("commercial") ||
        cleanName.includes("workspace") ||
        cleanName.includes("business")
      )
        return "commercial";
      if (cleanName.includes("deep") || cleanName.includes("thorough"))
        return "move";
      if (
        cleanName.includes("airbnb") ||
        cleanName.includes("short") ||
        cleanName.includes("holiday")
      )
        return "airbnb";
      if (
        cleanName.includes("tenancy") ||
        cleanName.includes("moveout") ||
        cleanName.includes("movein") ||
        cleanName.includes("moving")
      )
        return "tenancy";
      return "residential";
    };

    const mapped = bases.map((s) => {
      const key = getLayoutKey(s.name);
      const assets = optionAssets[key];
      // Use live bullets from DB if saved, otherwise fallback to hardcoded defaults
      const liveBullets =
        Array.isArray(s.bullets) && s.bullets.length > 0
          ? s.bullets
          : assets.bullets;
      return {
        id: s.name,
        title: s.name,
        tag: assets.tag,
        bullets: liveBullets,
        icon: assets.icon,
        layoutId: key,
      };
    });

    keys.forEach((k) => {
      const assets = optionAssets[k];
      if (!mapped.some((m) => m.layoutId === k)) {
        mapped.push({
          id: assets.defaultId,
          title: assets.defaultTitle,
          tag: assets.tag,
          bullets: assets.bullets,
          icon: assets.icon,
          layoutId: k,
        });
      }
    });

    return mapped.sort(
      (a, b) => keys.indexOf(a.layoutId) - keys.indexOf(b.layoutId),
    );
  }, [servicesList]);
  const [notification, setNotification] = useState(null);
  const [guestCheckoutInModal, setGuestCheckoutInModal] = useState(false);
  const showAuthModal =
    step === 4 && !customer && !guestCheckoutInModal && !isSubmitted;

  useEffect(() => {
    if (step === 4) {
      // debug: log booking modal state
      console.log(
        "[Booking] step=",
        step,
        "customer=",
        !!customer,
        "guestCheckoutInModal=",
        guestCheckoutInModal,
        "isSubmitted=",
        isSubmitted,
      );
    }
  }, [step, customer, guestCheckoutInModal, isSubmitted]);

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

        // Group booking slots by date - includes both standard slots and flexible times
        const slotsMap = {};
        const bookingsByDate = {};
        data.forEach((b) => {
          if (b.schedule?.date) {
            const d = new Date(b.schedule.date);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

            if (!slotsMap[dateStr]) {
              slotsMap[dateStr] = [];
            }
            if (!bookingsByDate[dateStr]) {
              bookingsByDate[dateStr] = [];
            }
            bookingsByDate[dateStr].push(b);

            // Add standard time slot if present
            if (b.schedule?.timeSlot && b.schedule.timeSlot !== "Flexible") {
              if (!slotsMap[dateStr].includes(b.schedule.timeSlot)) {
                slotsMap[dateStr].push(b.schedule.timeSlot);
              }
            }

            // Add flexible time slot if present
            if (
              b.schedule?.timeSlot === "Flexible" &&
              b.schedule?.preferredTime
            ) {
              if (!slotsMap[dateStr].includes(b.schedule.preferredTime)) {
                slotsMap[dateStr].push(b.schedule.preferredTime);
              }
            }
          }
        });

        // Build the full occupied [start, end) window for each Flexible
        // booking on each date, using its own duration - not just its exact
        // start time - so overlapping start times within an already-booked
        // job's window get blocked too (a cleaner can't be in two places).
        const rangesMap = {};
        Object.keys(bookingsByDate).forEach((dateStr) => {
          rangesMap[dateStr] = buildBookedRanges(bookingsByDate[dateStr]);
        });
        setFlexibleRangesByDate(rangesMap);

        // A date is fully booked ONLY if all three standard slots are taken
        const fullyBookedDates = Object.keys(slotsMap).filter((dateStr) => {
          const slots = slotsMap[dateStr];
          return (
            slots.includes("Morning (8am-12pm)") &&
            slots.includes("Afternoon (12pm-4pm)") &&
            slots.includes("Evening (4pm-8pm)")
          );
        });

        console.log("[AVAILABILITY] Booked Slots Map Loaded:", slotsMap);
        console.log(
          "[AVAILABILITY] Fully Booked Dates (Disabled in Calendar):",
          fullyBookedDates,
        );

        setBookedDates(fullyBookedDates);
      } catch (err) {
        console.error("[AVAILABILITY] Error fetching booked dates:", err);
      }
    };

    const fetchRates = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/services?region=${region.id}&booking=1&t=${Date.now()}`,
        );
        const data = await response.json();

        setServicesList(data);
        const ratesObj = {};
        // Exact-match lookup first
        data.forEach((service) => {
          ratesObj[cleanKey(service.name)] = service.rate;
        });

        // Fuzzy alias: cover renamed services so booking prices don't fall back to £0
        const knownDisplayNames = [
          "Residential Cleaning",
          "Office Cleaning",
          "Deep Clean",
          "Airbnb Cleaning",
          "End of Tenancy",
        ];
        knownDisplayNames.forEach((displayName) => {
          const dk = cleanKey(displayName);
          if (ratesObj[dk] !== undefined) return;
          const match = data.find((s) => {
            const sk = cleanKey(s.name);
            return sk.includes(dk) || dk.includes(sk);
          });
          if (match) ratesObj[dk] = match.rate;
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

  // Keep the "Cleaning Supply" extra in sync with who's providing supplies —
  // charged when Cleaniq brings everything, skipped when the customer does.
  useEffect(() => {
    setFormData((prev) => {
      const shouldCharge = prev.suppliesProvidedBy === "Cleaniq";
      const current = prev.extras[SUPPLIES_EXTRA_NAME] || 0;
      if (shouldCharge === current > 0) return prev;
      const extras = { ...prev.extras };
      if (shouldCharge) extras[SUPPLIES_EXTRA_NAME] = 1;
      else delete extras[SUPPLIES_EXTRA_NAME];
      return { ...prev, extras };
    });
  }, [formData.suppliesProvidedBy]);

  // Pricing Logic - Comprehensive Engine
  useEffect(() => {
    if (!formData.serviceType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTotalPrice(0);
      return;
    }

    let total = 0;

    // Base Service Rate (Multiplied by Duration for all regions - Price/Hr)
    const rawBaseRate = dynamicRates[cleanKey(formData.serviceType)] || 20;
    const baseRate = parseFloat(rawBaseRate) || 20;
    total += baseRate * formData.duration;

    // Room Rates - Removed as per user request (rooms are informational only)
    /*
    const roomMap = { bedrooms: 'Bedroom', bathrooms: 'Bathroom', cloakrooms: 'Cloakroom', kitchens: 'Kitchen', utilityRooms: 'Utility Room', receptionRooms: 'Reception Room', conservatories: 'Conservatory' };
    Object.entries(formData.property).forEach(([key, qty]) => {
      const roomName = roomMap[key];
      total += (dynamicRates[cleanKey(roomName)] || rates[roomName.trim()] || 0) * qty;
    });
    */

    // Extra Rates
    Object.entries(formData.extras).forEach(([name, qty]) => {
      total += (dynamicRates[cleanKey(name)] || 0) * qty;
    });

    // if (formData.frequency === "Weekly") total *= 0.9;
    // if (formData.frequency === "Fortnightly") total *= 0.95;

    setTotalPrice(Math.round(total * 100) / 100);
  }, [formData, region, dynamicRates]);

  // auth modal is derived from step/customer/isSubmitted

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
      if (!formData.hasPet) {
        showNotification("Please let us know if you have a pet.");
        return;
      }
    }
    if (step === 3) {
      if (!formData.parking || !formData.keyAccess) {
        showNotification("Please select parking and access options.");
        return;
      }
      if (!formData.suppliesProvidedBy && !crmMode) {
        showNotification(
          "Please tell us who's providing the cleaning supplies & equipment.",
        );
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
            .filter((entry) => entry[1] > 0)
            .map(([n, q]) => `${n} (x${q})`),
          ...Object.entries(formData.property)
            .filter((entry) => entry[1] > 0)
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
      leadSource: formData.leadSource || "Organic",
      suppliesProvidedBy: formData.suppliesProvidedBy || "Cleaniq",
      payment: {
        amount: totalPrice,
        currency: "GBP",
        method: "Stripe",
        transactionId: paymentIntent.id,
        // Card was only authorized (capture_method: "manual"), not charged
        // yet — the actual capture happens when the job is marked
        // Completed, via the existing capture-on-complete logic.
        stripePaymentIntentId: paymentIntent.id,
        status: "Authorized",
        authorizedAt: new Date().toISOString(),
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
      if (response.ok) {
        localStorage.removeItem("ciq_booking_draft");
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Error saving booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dev mode submit - skip payment processing. Confirmed working, disabled.
  // Uncomment along with the matching button in the JSX below to re-enable
  // for future pricing diagnostics (it submits a real booking with
  // payment.method "Dev Mode" so it's obvious in the data).
  // const handleDevModeSubmit = async () => {
  //   if (!formData.serviceType) {
  //     console.error("Submission Blocked: Service type is missing.");
  //     showNotification(
  //       "Please select a service type before completing your booking.",
  //     );
  //     return;
  //   }
  //
  //   console.log("🧪 [DEV MODE] Rate breakdown:", {
  //     region: region.id,
  //     serviceType: formData.serviceType,
  //     baseRate: dynamicRates[cleanKey(formData.serviceType)],
  //     duration: formData.duration,
  //     extras: formData.extras,
  //     extraRates: Object.keys(formData.extras).map((name) => ({
  //       name,
  //       qty: formData.extras[name],
  //       rateFound: dynamicRates[cleanKey(name)],
  //     })),
  //     totalPrice,
  //   });
  //
  //   const bookingPayload = {
  //     bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
  //     customer: {
  //       firstName: formData.firstName || "Customer",
  //       lastName: formData.lastName || "User",
  //       email: formData.email || "pending@cleaniq.com",
  //       phone: formData.phone || "000",
  //     },
  //     service: formData.serviceType,
  //     details: {
  //       address: `${formData.address}${formData.addressLine2 ? ", " + formData.addressLine2 : ""}${formData.postcode ? ", " + formData.postcode : ""}`,
  //       frequency: formData.frequency,
  //       duration: formData.duration,
  //       extras: [
  //         ...Object.entries(formData.extras)
  //           .filter((entry) => entry[1] > 0)
  //           .map(([n, q]) => `${n} (x${q})`),
  //         ...Object.entries(formData.property)
  //           .filter((entry) => entry[1] > 0)
  //           .map(([n, q]) => `${n} (x${q})`),
  //         `Parking: ${formData.parking}`,
  //         `Entry: ${formData.keyAccess}`,
  //         `Pet on premises: ${formData.hasPet || "Not specified"}`,
  //         `Instructions: ${formData.specialInstructions || "None"}`,
  //       ],
  //     },
  //     schedule: {
  //       date: formData.date,
  //       timeSlot: formData.timeSlot,
  //       preferredTime: formData.preferredTime,
  //     },
  //     leadSource: formData.leadSource || "Organic",
  //     suppliesProvidedBy: formData.suppliesProvidedBy || "Cleaniq",
  //     payment: {
  //       amount: totalPrice,
  //       currency: "GBP",
  //       method: "Dev Mode",
  //       transactionId: "DEV-TEST-NO-PAYMENT",
  //     },
  //     region: region.id,
  //   };
  //   setIsSubmitting(true);
  //   try {
  //     const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(bookingPayload),
  //     });
  //     if (response.ok) {
  //       localStorage.removeItem("ciq_booking_draft");
  //       setIsSubmitted(true);
  //       console.log("✅ [DEV MODE] Booking submitted without payment!");
  //     }
  //   } catch (error) {
  //     console.error("Error saving booking:", error);
  //     showNotification("Error submitting booking. Please try again.");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  if (authLoading) {
    return <LoadingOverlay message="Loading account..." />;
  }

  if (isSubmitted) {
    return (
      <div
        className="pt-40 pb-20 min-h-screen bg-white flex items-center justify-center px-6 text-center"
        style={{ backgroundColor: "#ffffff" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 bg-[#10B981] rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#10B981]/20 rotate-12">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-4 tracking-tighter">
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
    <div
      className="pt-32 min-h-screen bg-white pb-32"
      style={{ backgroundColor: "#ffffff" }}
    >
      <Helmet>
        <title>Book Cleaning — Cleaniq Services</title>
        <meta
          name="description"
          content="Book professional cleaning services in Manchester. Quick online booking for residential, deep clean, Airbnb turnovers, and office cleaning."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/booking" />
        <meta
          property="og:title"
          content={"Book Cleaning — Cleaniq Services"}
        />
      </Helmet>

      {isSubmitting && <LoadingOverlay message="Confirming..." />}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-6 md:mb-10 bg-white p-2 md:p-5 rounded-[20px] md:rounded-3xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar sticky top-32 z-40">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${step === s.id ? "bg-[#10B981] text-white shadow-md" : s.id < step ? "text-[#10B981]" : "text-slate-400"}`}
              >
                <div
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center font-black text-[8px] md:text-[9px] ${step === s.id ? "bg-white/20" : s.id < step ? "bg-[#10B981]/20" : "bg-slate-100"}`}
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
                  className="mx-1 md:mx-2 text-slate-300"
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
                className="bg-white rounded-3xl md:rounded-[40px] p-5 md:p-10 border border-slate-200 relative min-h-150"
              >
                <div className="flex-1 pb-20 md:pb-24">
                  {step === 1 && (
                    <div className="space-y-10 animate-in fade-in">
                      <div className="space-y-6">
                        <div>
                          <h1 className="text-xl md:text-3xl font-extrabold text-black tracking-tight">
                            Where are we cleaning?
                          </h1>
                          <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                            Enter your address to get started
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="relative group">
                            <MapPin
                              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#10B981] transition-colors"
                              size={20}
                            />
                            <input
                              className="w-full p-6 pl-14 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#10B981] shadow-sm outline-none font-bold text-sm transition-all text-black"
                              placeholder="Enter full address"
                              value={formData.address}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  address: e.target.value,
                                });
                              }}
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <input
                              className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#10B981] shadow-sm outline-none font-bold text-sm transition-all text-black"
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
                              className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#10B981] shadow-sm outline-none font-bold text-sm transition-all text-black"
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

                      <div className="pt-10 border-t border-slate-200">
                        <h1 className="text-xl md:text-3xl font-extrabold text-black tracking-tight mb-8">
                          What type of cleaning?
                        </h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dynamicServiceOptions.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setFormData({ ...formData, serviceType: s.id });
                              }}
                              className={`flex flex-col items-center p-6 rounded-[32px] border transition-all duration-300 ${formData.serviceType === s.id ? "border-[#10B981] bg-[#10B981]/10 shadow-lg" : "border-slate-200 bg-slate-50 hover:border-[#10B981]/30"}`}
                            >
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${formData.serviceType === s.id ? "bg-[#10B981] text-white shadow-lg" : "bg-[#10B981]/10 text-[#10B981]"}`}
                              >
                                {s.icon}
                              </div>
                              <p
                                className={`font-black text-lg tracking-tighter ${formData.serviceType === s.id ? "text-[#10B981]" : "text-black"}`}
                              >
                                {s.title}
                              </p>
                              <div className="mt-1 mb-4">
                                <span className="text-base font-black text-black">
                                  {region.symbol}
                                  {String(
                                    dynamicRates[cleanKey(s.id)] ||
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

                              <div className="space-y-2 w-full text-left pt-4 border-t border-slate-200">
                                {s.bullets.map((bullet, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2"
                                  >
                                    <CheckCircle2
                                      size={12}
                                      className={
                                        formData.serviceType === s.id
                                          ? "text-[#10B981]"
                                          : "text-slate-400"
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
                            <h1 className="text-xl md:text-3xl font-extrabold text-black tracking-tight">
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
                                  <span className="font-bold text-xs text-black">
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
                          <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
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
                                      ? "border-[#10B981] bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-[#10B981]/30"
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

                        <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 flex flex-col justify-center">
                          <div className="text-center mb-8">
                            <h2 className="text-xl font-extrabold text-black tracking-tight">
                              How long?
                            </h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              Select duration for the cleaning
                            </p>
                          </div>
                          <div className="mb-8">
                            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1 mb-4">
                              {Array.from({ length: 50 }, (_, i) => i + 2).map(
                                (hours) => (
                                  <button
                                    key={hours}
                                    type="button"
                                    onClick={() =>
                                      setFormData({
                                        ...formData,
                                        duration: hours,
                                      })
                                    }
                                    className={`py-2.5 rounded-xl border font-black text-xs transition-all ${
                                      formData.duration === hours
                                        ? "border-[#10B981] bg-[#10B981] text-white shadow-md"
                                        : "border-slate-200 bg-white text-[#10B981] hover:border-[#10B981]/50"
                                    }`}
                                  >
                                    {hours}
                                  </button>
                                ),
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="50"
                                step="1"
                                placeholder="Or type a custom number"
                                value={formData.duration || ""}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setFormData({
                                    ...formData,
                                    duration: Number.isNaN(val)
                                      ? ""
                                      : Math.min(50, Math.max(2, val)),
                                  });
                                }}
                                className="w-full py-5 px-6 rounded-2xl border border-slate-200 bg-white font-black text-2xl text-[#10B981] text-center focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] transition-all"
                              />
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                hours
                              </span>
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3 text-center">
                              Choose any duration from 2 to 50 hours
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["Once", "Weekly", "Fortnightly"].map((f) => (
                              <button
                                key={f}
                                onClick={() =>
                                  setFormData({ ...formData, frequency: f })
                                }
                                className={`py-4 rounded-2xl border font-black text-xs transition-all ${formData.frequency === f ? "border-[#10B981] bg-[#10B981] text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-[#10B981]/30"}`}
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
                            <h1 className="text-xl md:text-3xl font-extrabold text-black tracking-tight">
                              Extras Services
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                              Add optional extras to your booking
                            </p>
                          </div>
                          <div className="grid gap-3 mt-6">
                            {(servicesList || [])
                              .filter((s) => {
                                const baseServices = [
                                  ...dynamicServiceOptions.map((o) => o.id),
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
                                // Cleaning Supply is controlled by the "Who
                                // provides supplies?" question below, not a
                                // manual toggle here.
                                if (
                                  clean(s.name) === clean(SUPPLIES_EXTRA_NAME)
                                )
                                  return false;
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
                                    className="flex items-center justify-between p-3 px-5 rounded-2xl bg-slate-50 border border-slate-200"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#10B981] shadow-sm">
                                        {iconMap[cleanName] || (
                                          <Star size={18} />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-black">
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
                                      <span className="text-base font-black text-black w-4 text-center">
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
                            <h1 className="text-xl md:text-3xl font-extrabold text-black tracking-tight">
                              Logistics
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                              Help us prepare for your visit
                            </p>
                          </div>
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Car size={14} className="text-[#10B981]" />{" "}
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
                                    className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${formData.parking === p ? "border-[#10B981] bg-[#10B981] text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-[#10B981]/30"}`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Key size={14} className="text-[#10B981]" />{" "}
                                Entry Instructions
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
                                    className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${formData.keyAccess === k ? "border-[#10B981] bg-[#10B981] text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-[#10B981]/30"}`}
                                  >
                                    {k}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} className="text-[#10B981]" />{" "}
                                Special Instructions
                              </p>
                              <textarea
                                className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#10B981] shadow-sm outline-none font-bold text-xs resize-none text-black"
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
                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles
                                  size={14}
                                  className="text-[#10B981]"
                                />{" "}
                                Who provides the cleaning supplies & equipment?{" "}
                                <span className="text-rose-500">*</span>
                              </p>
                              <select
                                className={`w-full p-5 rounded-2xl border shadow-sm outline-none font-bold text-xs transition-all ${
                                  formData.suppliesProvidedBy
                                    ? "bg-slate-50 border-slate-200 focus:border-[#10B981] text-black"
                                    : "bg-rose-50 border-rose-200 text-rose-500"
                                }`}
                                value={formData.suppliesProvidedBy || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    suppliesProvidedBy: e.target.value,
                                  })
                                }
                              >
                                <option value="" disabled>
                                  -- Please select an option --
                                </option>
                                <option value="Cleaniq">
                                  Cleaniq Services provides everything (+
                                  {region.symbol}
                                  {dynamicRates[
                                    cleanKey(SUPPLIES_EXTRA_NAME)
                                  ] || 10}
                                  )
                                </option>
                                <option value="Customer">
                                  I'll provide my own supplies & equipment
                                </option>
                              </select>
                              {!formData.suppliesProvidedBy && (
                                <p className="text-[10px] font-bold text-rose-500">
                                  This selection is required before you can
                                  continue.
                                </p>
                              )}
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
                            <h1 className="text-xl md:text-3xl font-extrabold text-black tracking-tight">
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
                            <div className="space-y-4">
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Clock
                                      size={16}
                                      className="text-[#10B981]"
                                    />
                                    Choose Your Flexible Time
                                  </p>
                                  <p className="text-[9px] text-slate-400 mb-4">
                                    Available: 8:00 AM - 8:00 PM
                                  </p>
                                </div>

                                {/* Quick Select Buttons */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                  {(() => {
                                    // Filter quick times if today is selected
                                    const isToday = (() => {
                                      if (!formData.date) return false;
                                      const sel = new Date(formData.date);
                                      const now = new Date();
                                      return (
                                        sel.getDate() === now.getDate() &&
                                        sel.getMonth() === now.getMonth() &&
                                        sel.getFullYear() === now.getFullYear()
                                      );
                                    })();

                                    const now = new Date();
                                    // 30-min buffer: current time + 30 mins
                                    const cutoffMinutes =
                                      now.getHours() * 60 +
                                      now.getMinutes() +
                                      30;

                                    const allQuickTimes = [
                                      "08:00",
                                      "08:30",
                                      "09:00",
                                      "09:30",
                                      "10:00",
                                      "10:30",
                                      "11:00",
                                      "11:30",
                                      "12:00",
                                      "12:30",
                                      "13:00",
                                      "13:30",
                                      "14:00",
                                      "14:30",
                                      "15:00",
                                      "15:30",
                                      "16:00",
                                      "16:30",
                                      "17:00",
                                      "17:30",
                                      "18:00",
                                      "18:30",
                                      "19:00",
                                      "19:30",
                                      "20:00",
                                    ];

                                    const quickTimes = isToday
                                      ? allQuickTimes.filter((time) => {
                                          const [h, m] = time
                                            .split(":")
                                            .map(Number);
                                          return h * 60 + m > cutoffMinutes;
                                        })
                                      : allQuickTimes;

                                    return quickTimes.map((time) => {
                                      const isBooked = overlapsExistingRange(
                                        time,
                                        formData.duration,
                                        flexibleRangesByDate[formData.date] ||
                                          [],
                                      );
                                      return (
                                        <button
                                          key={time}
                                          disabled={isBooked}
                                          onClick={() => {
                                            setFormData({
                                              ...formData,
                                              preferredTime: time,
                                              timeSlot: "Flexible",
                                            });
                                            console.log(
                                              `[DEV] Quick selected time: ${time}`,
                                            );
                                          }}
                                          className={`py-3 px-2 rounded-xl border-2 text-[10px] font-bold transition-all transform hover:scale-105 ${
                                            formData.preferredTime === time &&
                                            formData.timeSlot === "Flexible"
                                              ? "border-[#10B981] bg-[#10B981] text-white shadow-lg scale-110"
                                              : isBooked
                                                ? "border-rose-200 bg-rose-50 text-rose-500 cursor-not-allowed opacity-50"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-[#10B981]/50"
                                          }`}
                                        >
                                          {time}
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>

                                {/* Custom Time Input */}
                                <div className="border-t border-slate-200 pt-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      ⏰ Custom Time
                                    </p>
                                    {/* <button
                                      type="button"
                                      onClick={() => {
                                        const testDate = new Date();
                                        testDate.setDate(
                                          testDate.getDate() + 1,
                                        );
                                        const dateStr = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, "0")}-${String(testDate.getDate()).padStart(2, "0")}`;
                                        setFormData({
                                          ...formData,
                                          date: dateStr,
                                          timeSlot: "Flexible",
                                          preferredTime: "14:00",
                                          serviceType:
                                            formData.serviceType ||
                                            servicesList[0]?.name ||
                                            "",
                                          duration: 3,
                                          firstName: "Test",
                                          lastName: "User",
                                          email: "test@example.com",
                                          phone: "07700000000",
                                          address: "Test Address",
                                          postcode: "SW1A",
                                        });
                                        console.log(
                                          "[DEV TEST] Form populated with test data - NO PAYMENT REQUIRED",
                                        );
                                      }}
                                      className="text-[8px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition"
                                    >
                                      🧪 Dev Test Fill
                                    </button> */}
                                  </div>
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="time"
                                      value={
                                        formData.preferredTime &&
                                        formData.timeSlot === "Flexible"
                                          ? formData.preferredTime.includes(":")
                                            ? formData.preferredTime
                                            : "12:30"
                                          : ""
                                      }
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          setFormData({
                                            ...formData,
                                            preferredTime: e.target.value,
                                            timeSlot: "Flexible",
                                          });
                                          console.log(
                                            `[DEV] Custom time entered: ${e.target.value}`,
                                          );
                                        } else {
                                          console.log(
                                            "[DEV MODE] No time entered - using default: 12:30",
                                          );
                                          setFormData({
                                            ...formData,
                                            preferredTime: "12:30",
                                            timeSlot: "Flexible",
                                          });
                                        }
                                      }}
                                      onBlur={() => {
                                        // If empty on blur, set to 12:30
                                        if (!formData.preferredTime) {
                                          console.log(
                                            "[DEV] Blur event - setting default to 12:30",
                                          );
                                          setFormData({
                                            ...formData,
                                            preferredTime: "12:30",
                                            timeSlot: "Flexible",
                                          });
                                        }
                                      }}
                                      className="flex-1 p-4 rounded-xl bg-white border border-slate-200 focus:border-[#10B981] focus:bg-white shadow-sm outline-none font-bold text-sm text-black"
                                      min="08:00"
                                      max="20:00"
                                    />
                                    <span className="text-[9px] font-bold text-slate-400 text-center">
                                      {formData.preferredTime &&
                                      formData.timeSlot === "Flexible"
                                        ? "✓ Selected"
                                        : "Click to set"}
                                    </span>
                                  </div>
                                  <p className="text-[8px] text-slate-400">
                                    💡 If left empty, we'll default to 12:30 PM
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {formData.timeSlot &&
                            formData.timeSlot !== "Flexible" && (
                              <div className="animate-in slide-in-from-bottom-2 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Clock size={14} className="text-[#10B981]" />{" "}
                                  Alternative: Specify exact time?
                                </p>
                                <input
                                  type="text"
                                  placeholder="e.g. 9:30 AM (optional)"
                                  className="w-full p-4 rounded-xl bg-white border border-slate-200 focus:border-[#10B981] shadow-sm outline-none font-bold text-sm text-black"
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
                            <h1 className="text-xl md:text-3xl font-extrabold text-black tracking-tight">
                              Your Details
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">
                              We'll use this to confirm your booking
                            </p>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <input
                              className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#10B981] shadow-sm outline-none font-bold text-sm text-black placeholder-slate-400"
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
                              className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#10B981] shadow-sm outline-none font-bold text-sm text-black placeholder-slate-400"
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
                              className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#10B981] shadow-sm outline-none font-bold text-sm text-black placeholder-slate-400 md:col-span-2"
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
                              className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-[#10B981] shadow-sm outline-none font-bold text-sm text-black placeholder-slate-400 md:col-span-2"
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
                        {!formData.date ||
                        !formData.timeSlot ||
                        !formData.firstName ||
                        !formData.lastName ||
                        !formData.email ||
                        !formData.phone ? (
                          <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-200 text-center animate-in fade-in">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                              <ShieldCheck
                                className="text-slate-400"
                                size={32}
                              />
                            </div>
                            <h3 className="font-extrabold text-black tracking-tight mb-2 text-lg">
                              Complete Your Details
                            </h3>
                            <p className="text-xs font-bold text-slate-400">
                              Please fill out your Date, Time, and Personal
                              Details above to unlock secure payment.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-[#10B981]/10 p-6 rounded-[32px] border border-[#10B981]/20">
                            <div className="flex items-center gap-3 text-[10px] font-black text-[#10B981] uppercase tracking-widest mb-4">
                              <ShieldCheck size={18} />
                              Securely processed by Stripe
                            </div>
                            {!customer && !guestCheckoutInModal ? (
                              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                                <p className="font-extrabold text-black mb-2">
                                  Account required to pay
                                </p>
                                <p className="text-sm text-slate-500 mb-4">
                                  Please log in or create a free account to
                                  complete payment and secure your booking.
                                </p>
                                <div className="flex flex-col gap-3">
                                  <div className="flex gap-3 justify-center">
                                    <Link
                                      to="/account/login?returnTo=/booking"
                                      className="btn-primary py-3 px-6 font-black"
                                    >
                                      Log in
                                    </Link>
                                    <Link
                                      to="/account/signup?returnTo=/booking"
                                      className="py-3 px-6 bg-white rounded-2xl font-black text-[#10B981] border border-slate-200"
                                    >
                                      Sign up
                                    </Link>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setGuestCheckoutInModal(true)
                                    }
                                    className="mt-2 text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                                  >
                                    Continue as Guest
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <Elements stripe={stripePromise}>
                                  <StripePayment
                                    amount={totalPrice}
                                    currency="GBP"
                                    customerInfo={formData}
                                    onPaymentSuccess={handlePaymentSuccess}
                                    deferCapture
                                  />
                                </Elements>

                                {/* Dev Mode: Skip Payment Button - confirmed working,
                                    removed from view. Uncomment + wrap in
                                    `import.meta.env.DEV &&` to bring back for testing. */}
                                {/* <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                                      🧪 Dev Mode: Test Booking
                                    </p>
                                    <p className="text-[8px] text-blue-600 mt-1">
                                      Submit without payment for testing -
                                      check console for rate breakdown
                                    </p>
                                  </div>
                                  <button
                                    onClick={handleDevModeSubmit}
                                    disabled={isSubmitting}
                                    className="ml-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-black font-black text-[9px] px-4 py-2 rounded-xl whitespace-nowrap transition-all"
                                  >
                                    {isSubmitting
                                      ? "Submitting..."
                                      : "Skip Payment"}
                                  </button>
                                </div> */}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-white/90 backdrop-blur-sm border-t border-slate-200 flex justify-between items-center pointer-events-none rounded-b-[24px] md:rounded-b-[40px]">
                  {step > 1 ? (
                    <button
                      onClick={prevStep}
                      className="pointer-events-auto group flex items-center gap-2 text-slate-400 hover:text-[#10B981] transition-all font-black text-[9px] uppercase tracking-widest"
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
                      className="pointer-events-auto group flex items-center gap-3 md:gap-4 bg-[#10B981] text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-[#10B981]/30 transition-all"
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
            <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-200 relative overflow-hidden">
              <div className="space-y-6 mb-8 text-xs max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Location
                    </p>
                    <p className="font-bold text-black">
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
                                  dynamicRates[
                                    cleanKey(formData.serviceType)
                                  ] ||
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
                            className="flex justify-between items-center text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200"
                          >
                            <span className="font-bold text-slate-600">
                              {name} x{qty}
                            </span>
                            <span className="font-black text-slate-700">
                              {region.symbol}
                              {(dynamicRates[cleanKey(name)] || 0) * qty}
                            </span>
                          </div>
                        ) : null,
                      )}
                      {Object.entries(formData.extras).map(([name, qty]) =>
                        qty > 0 ? (
                          <div
                            key={name}
                            className="flex justify-between items-center text-[10px] bg-[#10B981]/10 p-2 rounded-lg border border-[#10B981]/20"
                          >
                            <span className="font-bold text-black">
                              {name} x{qty}
                            </span>
                            <span className="font-black text-[#10B981]">
                              {region.symbol}
                              {(dynamicRates[cleanKey(name)] || 0) * qty}
                            </span>
                          </div>
                        ) : null,
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Estimated Total
                  </p>
                  <p className="text-2xl font-black text-black">
                    {region.symbol}
                    {totalPrice}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center">
                    <Shield size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">
                      Trusted Provider
                    </p>
                    <p className="font-bold text-black text-xs">
                      Verified & Insured
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-[32px] p-6 text-black space-y-4 shadow-lg border border-slate-200">
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

      {/* Auth modal shown when user reaches payment but isn't logged in */}
      <AnimatePresence>
        {showAuthModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setStep(3)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-60 w-[95%] max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#10B981]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} className="text-[#10B981]" />
                </div>
                <h2 className="text-3xl font-black text-black mb-2">
                  Secure Checkout
                </h2>
                <p className="text-slate-500 text-sm">
                  Please log in, sign up, or continue as a guest
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setGuestCheckoutInModal(true)}
                  className="w-full py-4 px-6 bg-[#10B981] text-white rounded-2xl font-black text-lg hover:bg-[#059669] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Continue as Guest
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400 font-semibold">
                      OR
                    </span>
                  </div>
                </div>

                <Link
                  to="/account/login?returnTo=/booking&step=4"
                  className="block w-full py-4 px-6 bg-slate-50 text-[#10B981] rounded-2xl font-black text-lg hover:bg-slate-100 transition-all duration-200 text-center border border-slate-200"
                >
                  Log In
                </Link>

                <Link
                  to="/account/signup?returnTo=/booking&step=4"
                  className="block w-full py-4 px-6 bg-white text-[#10B981] rounded-2xl font-black text-lg hover:bg-slate-100 transition-all duration-200 border border-[#10B981]/30 text-center"
                >
                  Sign Up
                </Link>
              </div>

              <button
                onClick={() => setStep(3)}
                className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors w-full text-center"
              >
                ← Back
              </button>
            </motion.div>
          </>
        )}

        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md"
          >
            <div
              className={`p-6 rounded-[32px] border shadow-2xl flex items-center gap-4 bg-white ${notification.type === "error" ? "border-rose-200 text-rose-500" : "border-[#10B981]/25 text-[#10B981]"}`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notification.type === "error" ? "bg-rose-50" : "bg-[#10B981]/10"}`}
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
