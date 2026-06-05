import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Eye,
  Hash,
  User,
  MapPin,
  Clock,
  Car,
  Truck,
  Info,
  Home as HomeIcon,
  Briefcase,
  Star,
  Zap,
  Mail,
  Phone,
  DollarSign,
  X,
  Trash2,
  Edit3,
  Save,
  Plus,
  Minus,
  Download,
  Calendar,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const AdminCalendar = ({ bookings, onToggleDate }) => {
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

  const getBookingsForDate = (date) => {
    if (!date) return [];
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return bookings.filter((b) => {
      if (!b.schedule?.date) return false;
      const bDate = new Date(b.schedule.date);
      const bStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}`;
      return bStr === dStr;
    });
  };

  return (
    <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm animate-in fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-2xl font-black text-primary-dark tracking-tighter">
            {currentMonth.toLocaleString("default", { month: "long" })}{" "}
            <span className="text-primary">{currentMonth.getFullYear()}</span>
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Click any date to Block/Unblock
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-[10px] font-black text-slate-300 uppercase text-center py-2"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {days.map((date, i) => {
          const dayBookings = getBookingsForDate(date);
          const isBlocked = dayBookings.some(
            (b) =>
              b.status === "Blackout" ||
              b.customer?.firstName === "ADMIN_BLOCK",
          );
          const hasBookings = dayBookings.some(
            (b) =>
              b.status !== "Blackout" &&
              b.customer?.firstName !== "ADMIN_BLOCK",
          );

          return (
            <div key={i} className="aspect-square">
              {date ? (
                <button
                  onClick={() => onToggleDate(date, isBlocked)}
                  className={`w-full h-full rounded-[24px] flex flex-col items-center justify-center transition-all relative border-2 group
                    ${isBlocked ? "bg-rose-50 border-rose-200 text-rose-500" : hasBookings ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-slate-50 border-transparent text-slate-400 hover:border-primary/30"}
                  `}
                >
                  <span className="text-sm font-black">{date.getDate()}</span>
                  {isBlocked && (
                    <span className="text-[7px] font-black uppercase absolute bottom-2">
                      Blocked
                    </span>
                  )}
                  {hasBookings && !isBlocked && (
                    <span className="text-[7px] font-black uppercase absolute bottom-2">
                      {dayBookings.length} Bookings
                    </span>
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

// Lightweight calendar for admin create booking (select date)
const CreateCalendar = ({ selectedDate, onDateSelect, bookedDates = [] }) => {
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

  const isBooked = (date) => {
    if (!date) return false;
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return bookedDates.includes(dStr);
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

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h3 className="font-black text-primary-dark tracking-tighter text-base md:text-lg">
          {currentMonth.toLocaleString("default", { month: "long" })}{" "}
          <span className="text-primary">{currentMonth.getFullYear()}</span>
        </h3>
        <div className="flex gap-1 md:gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 md:p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 md:p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
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
          const disabled = booked; // Admin can select past dates!
          return (
            <div key={i} className="aspect-square">
              {date ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onDateSelect(
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
                    )
                  }
                  className={`w-full h-full rounded-xl text-center flex items-center justify-center relative font-black text-sm transition-all ${isSelected(date) ? "bg-primary text-white shadow-lg" : booked ? "bg-rose-50 text-rose-300 cursor-not-allowed" : past ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary"}`}
                >
                  <span className="text-xs md:text-sm font-black">
                    {date.getDate()}
                  </span>
                  {booked && (
                    <span className="text-[6px] md:text-[7px] font-black uppercase text-rose-500 absolute top-0.5 md:top-1">
                      Taken
                    </span>
                  )}
                  {past && !booked && !isSelected(date) && (
                    <span className="text-[5px] md:text-[6px] font-black uppercase text-amber-500 absolute top-0.5 md:top-1">
                      Past
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

const Bookings = () => {
  const [view, setView] = useState("list"); // 'list' or 'availability'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    customer: { firstName: "", lastName: "", email: "", phone: "" },
    service: "",
    details: {
      address: "",
      frequency: "Once",
      duration: 2,
      extras: [],
      Bedroom: 0,
      Bathroom: 0,
    },
    schedule: { date: "", timeSlot: "", preferredTime: "" },
    payment: { amount: 0, currency: "GBP", status: "Pending" },
    status: "Pending",
  });
  const [createStep, setCreateStep] = useState(1);
  const [servicesList, setServicesList] = useState([]);
  const [dynamicRates, setDynamicRates] = useState({});
  const [createTotal, setCreateTotal] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(
        () => setStatusMessage({ type: "", text: "" }),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Fetch services and compute rates for admin create modal
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/services`);
        const data = await res.json();
        setServicesList(data || []);
        const ratesObj = {};
        data.forEach((s) => {
          ratesObj[(s.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")] =
            s.rate;
        });
        setDynamicRates(ratesObj);
      } catch (err) {
        console.error("Failed to load services for admin create:", err);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    // derive bookedDates from bookings
    const fullyBooked = [];
    const slotsMap = {};
    bookings.forEach((b) => {
      if (b.schedule?.date && b.schedule?.timeSlot) {
        const d = new Date(b.schedule.date);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        slotsMap[dStr] = slotsMap[dStr] || [];
        if (!slotsMap[dStr].includes(b.schedule.timeSlot))
          slotsMap[dStr].push(b.schedule.timeSlot);
      }
    });
    Object.keys(slotsMap).forEach((d) => {
      const s = slotsMap[d];
      if (
        s.includes("Morning (8am-12pm)") &&
        s.includes("Afternoon (12pm-4pm)") &&
        s.includes("Evening (4pm-8pm)")
      )
        fullyBooked.push(d);
    });
    setBookedDates(fullyBooked);
  }, [bookings]);

  const createServiceOptions = React.useMemo(() => {
    const bases = servicesList.filter((s) => s.category === "Base");
    const keys = ["residential", "commercial", "move", "airbnb", "tenancy"];
    const optionAssets = {
      residential: {
        tag: "Reliable domestic cleaners",
        bullets: [
          "Dusting",
          "Vacuuming",
          "Kitchen degreasing",
          "Bathroom sanitization",
        ],
        icon: <HomeIcon />,
        defaultId: "Residential Cleaning",
        defaultTitle: "Residential Cleaning",
      },
      commercial: {
        tag: "Expert office cleaning",
        bullets: ["Workstation sanitization", "Communal area cleaning"],
        icon: <Briefcase />,
        defaultId: "Office Cleaning",
        defaultTitle: "Office Cleaning",
      },
      move: {
        tag: "Deep cleaning",
        bullets: ["Inside cabinets", "Baseboard scrubbing"],
        icon: <Zap />,
        defaultId: "Deep Clean",
        defaultTitle: "Deep Clean",
      },
      airbnb: {
        tag: "Short-let specialist",
        bullets: ["Linen & towel change", "Guest amenity restock"],
        icon: <Star />,
        defaultId: "Airbnb Cleaning",
        defaultTitle: "Airbnb Cleaning",
      },
      tenancy: {
        tag: "Moving out/in clean",
        bullets: ["Full property deep clean", "Appliance deep clean"],
        icon: <Truck />,
        defaultId: "End of Tenancy",
        defaultTitle: "End of Tenancy",
      },
    };

    const getLayoutKey = (name) => {
      const clean = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (
        clean.includes("residential") ||
        clean.includes("domestic") ||
        clean.includes("home")
      )
        return "residential";
      if (clean.includes("office") || clean.includes("commercial"))
        return "commercial";
      if (clean.includes("deep") || clean.includes("move")) return "move";
      if (clean.includes("airbnb") || clean.includes("short")) return "airbnb";
      if (clean.includes("tenancy") || clean.includes("moveout"))
        return "tenancy";
      return "residential";
    };

    const mapped = bases.map((s) => {
      const key = getLayoutKey(s.name);
      const assets = optionAssets[key];
      return {
        id: s.name,
        title: s.name,
        tag: assets.tag,
        bullets: assets.bullets,
        icon: assets.icon,
        layoutId: key,
      };
    });
    keys.forEach((k) => {
      if (!mapped.some((m) => m.layoutId === k))
        mapped.push({
          id: optionAssets[k].defaultId,
          title: optionAssets[k].defaultTitle,
          tag: optionAssets[k].tag,
          bullets: optionAssets[k].bullets,
          icon: optionAssets[k].icon,
          layoutId: k,
        });
    });
    return mapped;
  }, [servicesList]);

  // Compute extra services (filter out base services)
  const extraServicesList = React.useMemo(() => {
    const baseServices = [
      ...createServiceOptions.map((o) => o.id),
      "Bedroom",
      "Bathroom",
      "Kitchen",
      "Living Room",
      "Cloakroom",
      "Utility Room",
      "Reception Room",
      "Conservatory",
    ];
    const cleanName = (str) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();
    return (servicesList || []).filter(
      (s) =>
        !baseServices.some((base) => cleanName(base) === cleanName(s.name)),
    );
  }, [servicesList, createServiceOptions]);

  // Pricing for admin create form
  useEffect(() => {
    const fd = createData.details || {};
    if (!createData.service) {
      setCreateTotal(0);
      return;
    }
    let total = 0;
    const baseRate =
      dynamicRates[
        (createData.service || "").toLowerCase().replace(/[^a-z0-9]/g, "")
      ] || 20;
    total += (parseFloat(baseRate) || 20) * (fd.duration || 1);

    // Handle extras as objects with name and qty properties
    if (Array.isArray(fd.extras)) {
      fd.extras.forEach((ex) => {
        const qty = ex.qty || 1;
        const name = ex.name || "";
        total +=
          (dynamicRates[(name || "").toLowerCase().replace(/[^a-z0-9]/g, "")] ||
            0) * qty;
      });
    }
    setCreateTotal(Math.round(total * 100) / 100);
  }, [createData, dynamicRates]);

  // Validation functions
  const validateField = (fieldPath, value) => {
    // Customer fields
    if (fieldPath === "customer.firstName") {
      if (!value || value.trim().length < 2)
        return "First name must be at least 2 characters";
      if (!/^[a-zA-Z\s'-]+$/.test(value))
        return "First name must contain letters only";
      return "";
    }
    if (fieldPath === "customer.lastName") {
      if (!value || value.trim().length < 2)
        return "Last name must be at least 2 characters";
      if (!/^[a-zA-Z\s'-]+$/.test(value))
        return "Last name must contain letters only";
      return "";
    }
    if (fieldPath === "customer.email") {
      if (!value) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Invalid email address";
      return "";
    }
    if (fieldPath === "customer.phone") {
      if (!value) return "Phone is required";
      if (value.replace(/\D/g, "").length < 10)
        return "Phone must have at least 10 digits";
      return "";
    }

    // Service field
    if (fieldPath === "service") {
      if (!value) return "Service type must be selected";
      return "";
    }

    // Details fields
    if (fieldPath === "details.address") {
      if (!value || value.trim().length < 5)
        return "Address must be at least 5 characters";
      if (value.trim().length > 200)
        return "Address must not exceed 200 characters";
      return "";
    }
    if (fieldPath === "details.frequency") {
      if (!["Once", "Weekly", "Bi-weekly", "Monthly"].includes(value))
        return "Valid frequency must be selected";
      return "";
    }
    if (fieldPath === "details.duration") {
      if (!value || Number(value) < 0.5)
        return "Duration must be at least 0.5 hours";
      if (Number(value) > 8) return "Duration must not exceed 8 hours";
      return "";
    }
    if (fieldPath === "details.Bedroom") {
      if (!value && value !== 0) return "Bedrooms is required";
      if (Number(value) < 0 || Number(value) > 10)
        return "Bedrooms must be 0-10";
      return "";
    }
    if (fieldPath === "details.Bathroom") {
      if (!value && value !== 0) return "Bathrooms is required";
      if (Number(value) < 0 || Number(value) > 10)
        return "Bathrooms must be 0-10";
      return "";
    }

    // Schedule fields
    if (fieldPath === "schedule.date") {
      if (!value) return "Date is required";
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) return "Date cannot be in the past";
      return "";
    }
    if (fieldPath === "schedule.timeSlot") {
      if (!value) return "Time slot is required";
      if (!["Morning", "Afternoon", "Evening"].includes(value))
        return "Valid time slot must be selected";
      return "";
    }

    // Payment fields
    if (fieldPath === "payment.amount") {
      if (!value || Number(value) <= 0) return "Amount must be greater than 0";
      return "";
    }
    if (fieldPath === "payment.currency") {
      if (!value) return "Currency must be selected";
      if (value !== "GBP") return "Only GBP (Pounds) is accepted";
      return "";
    }

    return "";
  };

  const validateStep = (step) => {
    const errors = {};
    let isValid = true;

    if (step === 1) {
      // Step 1: Location & Service
      const addressErr = validateField(
        "details.address",
        createData.details?.address,
      );
      const frequencyErr = validateField(
        "details.frequency",
        createData.details?.frequency,
      );
      const serviceErr = validateField("service", createData.service);
      if (addressErr) {
        errors["details.address"] = addressErr;
        isValid = false;
      }
      if (frequencyErr) {
        errors["details.frequency"] = frequencyErr;
        isValid = false;
      }
      if (serviceErr) {
        errors.service = serviceErr;
        isValid = false;
      }
    } else if (step === 2) {
      // Step 2: Home & Duration
      const durationErr = validateField(
        "details.duration",
        createData.details?.duration,
      );
      const bedroomsErr = validateField(
        "details.Bedroom",
        createData.details?.Bedroom,
      );
      const bathroomsErr = validateField(
        "details.Bathroom",
        createData.details?.Bathroom,
      );
      if (durationErr) {
        errors["details.duration"] = durationErr;
        isValid = false;
      }
      if (bedroomsErr) {
        errors["details.Bedroom"] = bedroomsErr;
        isValid = false;
      }
      if (bathroomsErr) {
        errors["details.Bathroom"] = bathroomsErr;
        isValid = false;
      }
    } else if (step === 3) {
      // Step 3: Extras (optional)
      return { isValid: true, errors: {} };
    } else if (step === 4) {
      // Step 4: Payment & Schedule
      const dateErr = validateField("schedule.date", createData.schedule?.date);
      const slotErr = validateField(
        "schedule.timeSlot",
        createData.schedule?.timeSlot,
      );
      const firstErr = validateField(
        "customer.firstName",
        createData.customer?.firstName,
      );
      const lastErr = validateField(
        "customer.lastName",
        createData.customer?.lastName,
      );
      const emailErr = validateField(
        "customer.email",
        createData.customer?.email,
      );
      const phoneErr = validateField(
        "customer.phone",
        createData.customer?.phone,
      );
      const amountErr = validateField("payment.amount", createTotal);
      const currencyErr = validateField(
        "payment.currency",
        createData.payment?.currency,
      );

      if (dateErr) {
        errors["schedule.date"] = dateErr;
        isValid = false;
      }
      if (slotErr) {
        errors["schedule.timeSlot"] = slotErr;
        isValid = false;
      }
      if (firstErr) {
        errors["customer.firstName"] = firstErr;
        isValid = false;
      }
      if (lastErr) {
        errors["customer.lastName"] = lastErr;
        isValid = false;
      }
      if (emailErr) {
        errors["customer.email"] = emailErr;
        isValid = false;
      }
      if (phoneErr) {
        errors["customer.phone"] = phoneErr;
        isValid = false;
      }
      if (amountErr) {
        errors["payment.amount"] = amountErr;
        isValid = false;
      }
      if (currencyErr) {
        errors["payment.currency"] = currencyErr;
        isValid = false;
      }
    }

    return { isValid, errors };
  };

  const handleNextStep = () => {
    const validation = validateStep(createStep);
    setFormErrors(validation.errors);

    if (validation.isValid) {
      setCreateStep(createStep + 1);
      setFieldTouched({});
    }
  };

  const handleFieldChange = (path, value) => {
    // Update createData
    const keys = path.split(".");
    setCreateData((prev) => {
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });

    // Mark field as touched
    setFieldTouched((prev) => ({ ...prev, [path]: true }));

    // Validate field
    const error = validateField(path, value);
    setFormErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[path] = error;
      } else {
        delete updated[path];
      }
      return updated;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.size === 0) return;

    try {
      const bookingIds = Array.from(selectedBookings);
      await Promise.all(
        bookingIds.map((id) =>
          fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}`, {
            method: "DELETE",
          }),
        ),
      );

      setSelectedBookings(new Set());
      setShowBulkDeleteModal(false);
      setStatusMessage({
        type: "success",
        text: `${bookingIds.length} booking(s) deleted successfully`,
      });
      fetchBookings();
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: "Failed to delete bookings",
      });
    }
  };

  const toggleBookingSelection = (bookingId) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(filteredBookings.map((b) => b._id)));
    }
  };

  const toggleAvailability = async (date, isCurrentlyBlocked) => {
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    if (isCurrentlyBlocked) {
      const block = bookings.find((b) => {
        if (b.customer?.firstName !== "ADMIN_BLOCK") return false;
        const bDate = new Date(b.schedule.date);
        return (
          `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(bDate.getDate()).padStart(2, "0")}` ===
          dStr
        );
      });
      if (block) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/bookings/${block._id}`, {
            method: "DELETE",
          });
          setStatusMessage({ type: "success", text: `Unlocked ${dStr}` });
          fetchBookings();
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      const payload = {
        bookingId: `LOCK-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: {
          firstName: "ADMIN_BLOCK",
          lastName: "SYSTEM",
          email: "admin@cleaniq.com",
          phone: "000",
        },
        service: "Availability Block",
        status: "Blackout",
        schedule: { date: dStr, timeSlot: "All Day" },
        payment: { amount: 0, status: "N/A" },
      };
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setStatusMessage({ type: "success", text: `Blocked ${dStr}` });
        fetchBookings();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDelete = async (id, bookingId) => {
    if (
      window.confirm(`Are you sure you want to delete booking ${bookingId}?`)
    ) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/bookings/${id}`,
          { method: "DELETE" },
        );
        if (response.ok) {
          fetchBookings();
          if (selectedBooking?._id === id) setSelectedBooking(null);
          setStatusMessage({
            type: "success",
            text: "Booking deleted successfully",
          });
        }
      } catch (error) {
        setStatusMessage({ type: "error", text: "Failed to delete booking" });
      }
    }
  };

  const handleUpdate = async (dataOverride = null) => {
    try {
      const payload =
        dataOverride && !dataOverride.nativeEvent ? dataOverride : editData;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/${selectedBooking._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error("Server rejected the update");
      fetchBookings();
      setIsEditing(false);
      setSelectedBooking(null);
      setStatusMessage({
        type: "success",
        text: "Booking synced successfully",
      });
    } catch (error) {
      setStatusMessage({ type: "error", text: `Failed: ${error.message}` });
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Booking ID",
      "Customer",
      "Email",
      "Phone",
      "Service",
      "Date",
      "Time Slot",
      "Price",
      "Currency",
      "Status",
      "Address",
    ];
    const rows = bookings
      .filter((b) => b.status !== "Blackout")
      .map((b) => [
        b.bookingId,
        `${b.customer?.firstName} ${b.customer?.lastName}`,
        b.customer?.email,
        b.customer?.phone,
        b.service,
        new Date(b.schedule?.date).toLocaleDateString(),
        b.schedule?.timeSlot,
        b.payment?.amount,
        b.payment?.currency,
        b.status,
        b.details?.address?.replace(/,/g, " "),
      ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `CleanIQ_Bookings_${new Date().toLocaleDateString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status !== "Blackout" &&
        (b.customer?.firstName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          b.customer?.lastName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [bookings, searchTerm]);

  const getStatusColor = (status) => {
    const colors = {
      Confirmed: "bg-emerald-50 text-emerald-600 border-emerald-100",
      Pending: "bg-amber-50 text-amber-600 border-amber-100",
      Completed: "bg-blue-50 text-blue-600 border-blue-100",
      Cancelled: "bg-rose-50 text-rose-600 border-rose-100",
    };
    return colors[status] || "bg-slate-50 text-slate-600 border-slate-100";
  };

  const getPropertyData = (b) => {
    if (!b) return {};
    const data = {};
    const roomNames = [
      "Bedroom",
      "Bathroom",
      "Cloakroom",
      "Kitchen",
      "Utility Room",
      "Reception Room",
      "Conservatory",
      "Living Room",
    ];

    // Check details object directly for room properties
    roomNames.forEach((room) => {
      if (b.details?.[room] && b.details[room] > 0) {
        data[room] = b.details[room];
      }
    });

    return data;
  };

  const getExtrasData = (b) => {
    if (!b) return {};
    const data = {};
    const roomNames = [
      "Bedroom",
      "Bathroom",
      "Cloakroom",
      "Kitchen",
      "Utility Room",
      "Reception Room",
      "Conservatory",
      "Living Room",
    ];

    const extras = b.details?.extras;
    if (Array.isArray(extras)) {
      extras.forEach((item) => {
        if (typeof item === "object" && item.name) {
          // New format: {name, qty, rate}
          const isRoom = roomNames.some((rn) =>
            item.name.toLowerCase().includes(rn.toLowerCase()),
          );
          if (!isRoom) {
            data[item.name] = item.qty || 1;
          }
        } else if (typeof item === "string") {
          // Old format: "Service (xN)"
          const isRoom = roomNames.some((rn) =>
            item.toLowerCase().includes(rn.toLowerCase()),
          );
          if (!isRoom) {
            const name = item.split(" (x")[0];
            const qtyMatch = item.match(/\(x(\d+)\)/);
            data[name] = qtyMatch ? parseInt(qtyMatch[1]) : 1;
          }
        }
      });
    }
    return data;
  };

  const getPetInfo = (b) => {
    if (!b) return null;
    if (Array.isArray(b.details?.extras)) {
      const petEntry = b.details.extras.find(
        (e) =>
          typeof e === "string" &&
          e.toLowerCase().startsWith("pet on premises:"),
      );
      if (petEntry) return petEntry.split(":")[1]?.trim() || null;
    }
    return null;
  };

  const getNotes = (b) => {
    if (!b) return "";
    const baseNotes =
      b.details?.notes ||
      b.notes ||
      b.meta?.notes ||
      b.specialInstructions ||
      "";
    if (baseNotes) return baseNotes;

    if (Array.isArray(b.details?.extras)) {
      const noteTag = b.details.extras.find(
        (e) =>
          typeof e === "string" &&
          (e.includes("Instructions:") ||
            e.includes("DATA_NOTES:") ||
            e.includes("📝 NOTE:")),
      );
      if (noteTag) return noteTag.split(":")[1].trim();
    }
    return "";
  };

  // Search every possible path the preferredTime could have been saved
  const getPreferredTime = (b) => {
    if (!b) return "";
    return (
      b.schedule?.preferredTime ||
      b.details?.preferredTime ||
      b.meta?.preferredTime ||
      b.preferredTime ||
      ""
    );
  };

  const getLogistics = (b) => {
    if (!b) return { parking: "Not specified", access: "Not specified" };
    let parking = b.details?.parking || b.parking || "Not specified";
    let access = b.details?.keyAccess || b.keyAccess || "Not specified";
    if (Array.isArray(b.details?.extras)) {
      const pTag = b.details.extras.find(
        (e) =>
          typeof e === "string" &&
          (e.includes("DATA_PARKING:") || e.includes("🚗 PARKING:")),
      );
      const aTag = b.details.extras.find(
        (e) =>
          typeof e === "string" &&
          (e.includes("DATA_ACCESS:") || e.includes("🔑 ACCESS:")),
      );
      if (pTag) parking = pTag.split(":")[1].trim();
      if (aTag) access = aTag.split(":")[1].trim();
    }
    return { parking, access };
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {statusMessage.text && (
        <div className="fixed top-10 right-10 z-100 px-8 py-5 rounded-[32px] border shadow-2xl bg-primary-dark text-white font-black text-sm uppercase tracking-widest animate-in slide-in-from-right">
          {statusMessage.text}
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-primary-dark tracking-tighter">
            Command Center
          </h1>
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => setView("list")}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${view === "list" ? "border-primary text-primary" : "border-transparent text-slate-400"}`}
            >
              Booking List
            </button>
            <button
              onClick={() => setView("availability")}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${view === "availability" ? "border-primary text-primary" : "border-transparent text-slate-400"}`}
            >
              Manage Availability
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          {view === "list" && (
            <button
              onClick={exportToCSV}
              className="p-4 px-8 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all font-black text-[10px] uppercase tracking-widest border border-slate-200 flex items-center gap-2"
            >
              <Download size={16} /> Export CSV
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-4 px-6 rounded-2xl bg-white text-primary border border-slate-200 hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            Create Booking
          </button>
          <button
            onClick={fetchBookings}
            className="p-4 px-8 rounded-2xl bg-primary text-white hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest border-none shadow-lg shadow-primary/20"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30 justify-between flex-wrap">
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 flex-1 min-w-60">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold w-full"
              />
            </div>
            {selectedBookings.size > 0 && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:shadow-lg text-white font-black transition-all flex items-center gap-2 text-sm"
              >
                <Trash2 size={18} />
                Delete ({selectedBookings.size})
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-4 py-5 w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedBookings.size === filteredBookings.length &&
                        filteredBookings.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-2 border-slate-300 cursor-pointer accent-primary"
                    />
                  </th>
                  <th className="px-8 py-5">Customer</th>
                  <th className="px-4 py-5">Service</th>
                  <th className="px-4 py-5">Date</th>
                  <th className="px-4 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-20 text-center font-black text-slate-400 uppercase tracking-widest"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-20 text-center font-black text-slate-300 uppercase tracking-widest"
                    >
                      No matching entries
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr
                      key={b._id}
                      className={`group hover:bg-slate-50/50 transition-colors ${
                        selectedBookings.has(b._id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-6 w-12">
                        <input
                          type="checkbox"
                          checked={selectedBookings.has(b._id)}
                          onChange={() => toggleBookingSelection(b._id)}
                          className="w-5 h-5 rounded border-2 border-slate-300 cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-primary-dark">
                          {b.customer?.firstName} {b.customer?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {b.bookingId}
                        </p>
                      </td>
                      <td className="px-4 py-6">
                        <p className="text-sm font-bold text-slate-700">
                          {b.service}
                        </p>
                        <p className="text-[10px] text-primary font-black uppercase tracking-tighter">
                          {getPropertyData(b)["Bedroom"] || 0} Bed •{" "}
                          {b.details?.duration || 0}h Clean
                        </p>
                      </td>
                      <td className="px-4 py-6 text-sm font-bold text-slate-700">
                        {new Date(b.schedule?.date).toLocaleDateString()}
                        <br />
                        <span className="text-[10px] text-primary uppercase">
                          {b.schedule?.timeSlot}
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        {b.assignedWorkerName ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            {b.assignedWorkerName}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-300 italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-6">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-tight ${getStatusColor(b.status)}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setEditData(b);
                              setIsEditing(false);
                              setShowRaw(false);
                            }}
                            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(b._id, b.bookingId)}
                            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AdminCalendar bookings={bookings} onToggleDate={toggleAvailability} />
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden border-4 border-white flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Hash size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-primary-dark tracking-tighter">
                    {isEditing ? "Edit Parameters" : "Entry Intelligence"}
                  </h3>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    {selectedBooking.bookingId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {isEditing ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editData.customer?.firstName || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            customer: {
                              ...editData.customer,
                              firstName: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editData.customer?.lastName || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            customer: {
                              ...editData.customer,
                              lastName: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={editData.customer?.phone || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            customer: {
                              ...editData.customer,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
                        Status
                      </label>
                      <select
                        value={editData.status}
                        onChange={(e) =>
                          setEditData({ ...editData, status: e.target.value })
                        }
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-black text-primary-dark uppercase tracking-widest">
                      Pricing & Logistics
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
                          Total Price ({editData.payment?.currency})
                        </label>
                        <div className="relative">
                          <DollarSign
                            size={14}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                          />
                          <input
                            type="number"
                            value={editData.payment?.amount || 0}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                payment: {
                                  ...editData.payment,
                                  amount: parseFloat(e.target.value),
                                },
                              })
                            }
                            className="w-full p-4 pl-10 rounded-2xl bg-white border border-slate-200 font-black text-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
                          Worker Rate (£/hr)
                        </label>
                        <input
                          type="number"
                          value={editData.workerRate || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              workerRate: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white border border-slate-200 font-black text-lg"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
                          Worker Expected Hours
                        </label>
                        <input
                          type="number"
                          value={editData.workerDuration || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              workerDuration: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white border border-slate-200 font-black text-lg"
                          placeholder="e.g. 2"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
                          Booking Date
                        </label>
                        <input
                          type="date"
                          value={
                            editData.schedule?.date
                              ? new Date(editData.schedule.date)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              schedule: {
                                ...editData.schedule,
                                date: e.target.value,
                              },
                            })
                          }
                          className="w-full p-4 rounded-2xl bg-white border border-slate-200 font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 pt-4">
                      <label className="text-[9px] font-black text-slate-400 ml-4 uppercase">
                        Special Instructions
                      </label>
                      <textarea
                        value={getNotes(editData)}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            details: {
                              ...editData.details,
                              notes: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 rounded-xl bg-white border border-slate-200 font-bold text-xs h-24 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                      <Mail size={20} className="text-primary mx-auto mb-2" />
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                        Email
                      </p>
                      <p className="text-xs font-bold text-primary-dark truncate">
                        {selectedBooking.customer?.email}
                      </p>
                    </div>
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                      <Phone size={20} className="text-primary mx-auto mb-2" />
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                        Contact
                      </p>
                      <p className="text-xs font-bold text-primary-dark">
                        {selectedBooking.customer?.phone}
                      </p>
                    </div>
                    <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 text-center">
                      <DollarSign
                        size={20}
                        className="text-primary mx-auto mb-2"
                      />
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                        Payment
                      </p>
                      <p className="text-xs font-black text-primary-dark">
                        {selectedBooking.payment?.currency === "GBP"
                          ? "£"
                          : "₦"}
                        {selectedBooking.payment?.amount}
                      </p>
                    </div>
                  </div>

                  {(selectedBooking.assignedWorker ||
                    selectedBooking.assignedWorkerName) && (
                    <div className="bg-emerald-50 rounded-[32px] p-6 border border-emerald-100 flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-emerald-100">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <User size={24} className="text-emerald-700" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                              Assigned Worker
                            </p>
                            <p className="text-sm font-black text-emerald-900">
                              {selectedBooking.assignedWorker?.firstName
                                ? `${selectedBooking.assignedWorker.firstName} ${selectedBooking.assignedWorker.lastName}`
                                : selectedBooking.assignedWorkerName}
                            </p>
                          </div>
                        </div>

                        {selectedBooking.assignedWorker && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Phone
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                {selectedBooking.assignedWorker.phone}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Email
                              </p>
                              <p
                                className="text-xs font-bold text-emerald-800 truncate"
                                title={selectedBooking.assignedWorker.email}
                              >
                                {selectedBooking.assignedWorker.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Worker ID
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                {selectedBooking.assignedWorker.workerId}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Region
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                {selectedBooking.assignedWorker.region}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Assigned Rate
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                £{selectedBooking.workerRate || 0}/hr
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                                Expected Hours
                              </p>
                              <p className="text-xs font-bold text-emerald-800">
                                {selectedBooking.workerDuration || 0} hrs
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Cleaner Progress Timeline */}
                      <div className="w-full md:w-80 bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-emerald-100/50 flex flex-col justify-between">
                        <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Live Cleaner Progress
                        </h5>

                        <div className="space-y-4 relative pl-3 border-l-2 border-slate-100">
                          {/* Step 1: Arrived */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                                selectedBooking.jobArrivedTime
                                  ? "bg-emerald-500 border-emerald-200"
                                  : "bg-white border-slate-300"
                              }`}
                            />
                            <p className="text-xs font-black text-primary-dark">
                              Arrived at Customer
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {selectedBooking.jobArrivedTime
                                ? `Completed at ${new Date(selectedBooking.jobArrivedTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : "Pending arrival..."}
                            </p>
                          </div>

                          {/* Step 2: Commenced */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                                selectedBooking.jobStartTime
                                  ? "bg-emerald-500 border-emerald-200"
                                  : "bg-white border-slate-300"
                              }`}
                            />
                            <p className="text-xs font-black text-primary-dark">
                              Cleaning Commenced
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {selectedBooking.jobStartTime
                                ? `Started at ${new Date(selectedBooking.jobStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : "Awaiting start..."}
                            </p>
                          </div>

                          {/* Step 3: Finished */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                                selectedBooking.jobEndTime
                                  ? "bg-emerald-500 border-emerald-200"
                                  : "bg-white border-slate-300"
                              }`}
                            />
                            <p className="text-xs font-black text-primary-dark">
                              Cleaning Finished
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {selectedBooking.jobEndTime
                                ? `Done: ${selectedBooking.jobDurationActual || 0} mins actual clean`
                                : "Awaiting completion..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mt-1 shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Full Address
                          </h4>
                          <p className="font-bold text-primary-dark leading-tight">
                            {selectedBooking.details?.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Duration & Arrival Timing
                          </h4>
                          <p className="font-bold text-primary-dark">
                            {selectedBooking.details?.duration || 0}h Clean (
                            {selectedBooking.service})
                          </p>
                          <p className="text-[11px] font-black text-slate-500 uppercase mt-1">
                            Slot:{" "}
                            {{
                              Morning: "Morning (8am – 12pm)",
                              Afternoon: "Afternoon (12pm – 4pm)",
                              Evening: "Evening (4pm – 8pm)",
                            }[selectedBooking.schedule?.timeSlot] ||
                              selectedBooking.schedule?.timeSlot ||
                              "Not set"}
                          </p>
                          <p className="text-[11px] font-black text-primary uppercase mt-1">
                            Requested Arrival:{" "}
                            {getPreferredTime(selectedBooking) ||
                              "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 mt-1">
                          <Info size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Customer Notes / Instructions
                          </h4>
                          <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                            "
                            {getNotes(selectedBooking) ||
                              "No instructions provided"}
                            "
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {/* Property Rooms Section */}
                      {Object.keys(getPropertyData(selectedBooking)).length >
                        0 && (
                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-[24px] border-2 border-indigo-200 space-y-4">
                          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <HomeIcon size={16} className="text-indigo-600" />
                            Property Rooms
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {Object.entries(
                              getPropertyData(selectedBooking),
                            ).map(([key, qty]) =>
                              qty > 0 ? (
                                <div
                                  key={key}
                                  className="bg-white rounded-lg border-2 border-indigo-200 p-3 text-center hover:shadow-md transition-shadow"
                                >
                                  <p className="text-[10px] font-black text-indigo-600">
                                    {qty}x
                                  </p>
                                  <p className="text-[9px] font-bold text-slate-700 mt-1 line-clamp-2">
                                    {key}
                                  </p>
                                </div>
                              ) : null,
                            )}
                          </div>
                        </div>
                      )}

                      {/* Extra Services Section */}
                      {Object.keys(getExtrasData(selectedBooking)).length >
                        0 && (
                        <div className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 rounded-[24px] border-2 border-rose-200 space-y-4">
                          <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={16} className="text-rose-600" /> Extra
                            Services
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(getExtrasData(selectedBooking)).map(
                              ([name, qty]) => (
                                <div
                                  key={name}
                                  className="bg-white rounded-lg border-2 border-rose-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900">
                                      {name}
                                    </p>
                                    <p className="text-xs text-slate-600 font-semibold">
                                      Qty: {qty}
                                    </p>
                                  </div>
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-rose-600 text-white rounded-full text-xs font-black">
                                    ✓
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pet Info */}
                      {getPetInfo(selectedBooking) && (
                        <div
                          className={`p-5 rounded-[24px] border-2 flex items-center gap-4 ${
                            getPetInfo(selectedBooking) === "Yes"
                              ? "bg-amber-50 border-amber-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <span className="text-2xl">
                            {getPetInfo(selectedBooking) === "Yes"
                              ? "🐶"
                              : "🚫"}
                          </span>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Pet on Premises
                            </p>
                            <p
                              className={`font-black text-sm ${getPetInfo(selectedBooking) === "Yes" ? "text-amber-600" : "text-slate-500"}`}
                            >
                              {getPetInfo(selectedBooking) === "Yes"
                                ? "Yes — pet-friendly cleaning required"
                                : "No pets"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-5 rounded-3xl bg-white border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => handleUpdate()}
                    className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <Save size={18} /> Sync Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (window.confirm("Cancel this booking?"))
                        handleUpdate({
                          ...selectedBooking,
                          status: "Cancelled",
                        });
                    }}
                    className="flex-1 py-5 rounded-3xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-5 rounded-3xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                  >
                    <Edit3 size={18} /> Modify Entry
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-7xl bg-white rounded-[32px] overflow-hidden shadow-2xl overflow-y-auto max-h-[92vh] border border-slate-100 animate-in fade-in zoom-in-95">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <Plus size={24} className="text-white" />
                  </div>
                  New Booking
                </h3>
                <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mt-2">
                  Step {createStep} of 4 • Create and assign a cleaning service
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-4 sm:px-6 lg:px-10 pt-6">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full font-black text-sm flex items-center justify-center transition-all ${
                        step <= createStep
                          ? "bg-primary text-white shadow-lg scale-110"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step < createStep ? <CheckCircle2 size={20} /> : step}
                    </div>
                    {step < 4 && (
                      <div
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          step < createStep ? "bg-primary" : "bg-slate-100"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 mb-6">
                {["Location", "Home & Hours", "Add-ons", "Payment"].map(
                  (t, idx) => (
                    <div
                      key={t}
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        createStep === idx + 1
                          ? "text-primary"
                          : idx + 1 < createStep
                            ? "text-slate-500"
                            : "text-slate-300"
                      }`}
                    >
                      {t}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 px-4 sm:px-6 lg:px-10 py-6">
              <div className="lg:col-span-8">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 sm:p-8 rounded-[28px] border border-slate-200/50">
                  {/* Step content */}
                  {createStep === 1 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-slate-200">
                        <h4 className="text-2xl font-black text-primary-dark flex items-center gap-3">
                          <MapPin size={24} className="text-primary" />
                          Cleaning Location
                        </h4>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-2 font-bold">
                          Where and what type of cleaning?
                        </p>
                      </div>

                      {/* Address and Postcode */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                            📍 Full Address{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            placeholder="Enter complete address"
                            className={`w-full p-4 rounded-2xl bg-white border-2 transition-all text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                              formErrors["details.address"]
                                ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                                : "border-slate-200 focus:ring-primary/30 focus:border-primary"
                            }`}
                            value={createData.details.address || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "details.address",
                                e.target.value,
                              )
                            }
                            onBlur={() =>
                              setFieldTouched((prev) => ({
                                ...prev,
                                "details.address": true,
                              }))
                            }
                          />
                          {(formErrors["details.address"] ||
                            fieldTouched["details.address"]) &&
                            formErrors["details.address"] && (
                              <p className="text-rose-500 text-[10px] font-bold mt-1">
                                {formErrors["details.address"]}
                              </p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">
                              📬 Postcode
                            </label>
                            <input
                              placeholder="e.g., M1 1AA"
                              className="w-full p-4 rounded-2xl bg-white border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium placeholder:text-slate-400"
                              value={createData.details.postcode || ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  "details.postcode",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                              🔄 Frequency{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={createData.details.frequency}
                              onChange={(e) =>
                                handleFieldChange(
                                  "details.frequency",
                                  e.target.value,
                                )
                              }
                              className={`w-full p-4 rounded-2xl bg-white border-2 transition-all text-sm font-medium focus:outline-none focus:ring-2 ${
                                formErrors["details.frequency"]
                                  ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                                  : "border-slate-200 focus:ring-primary/30 focus:border-primary"
                              }`}
                            >
                              <option>Once</option>
                              <option>Weekly</option>
                              <option>Bi-weekly</option>
                              <option>Monthly</option>
                            </select>
                            {(formErrors["details.frequency"] ||
                              fieldTouched["details.frequency"]) &&
                              formErrors["details.frequency"] && (
                                <p className="text-rose-500 text-[10px] font-bold mt-1">
                                  {formErrors["details.frequency"]}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Service Selection */}
                      <div className="pt-2">
                        <h5 className="font-black text-lg text-primary-dark mb-4 flex items-center gap-2">
                          🧹 Select Service Type{" "}
                          <span className="text-rose-500">*</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {createServiceOptions.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleFieldChange("service", s.id)}
                              className={`p-4 rounded-2xl border-2 transition-all text-left transform hover:scale-105 ${
                                createData.service === s.id
                                  ? "border-primary bg-gradient-to-br from-primary/10 to-blue-50 shadow-lg scale-105"
                                  : formErrors.service
                                    ? "border-rose-200 bg-white hover:shadow-md"
                                    : "border-slate-200 bg-white hover:shadow-md hover:border-primary/30"
                              }`}
                            >
                              <div className="font-extrabold text-base text-primary-dark">
                                {s.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-2 font-bold">
                                {s.tag}
                              </div>
                              {createData.service === s.id && (
                                <div className="text-primary text-sm font-black mt-2">
                                  ✓ Selected
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        {(formErrors.service || fieldTouched.service) &&
                          formErrors.service && (
                            <p className="text-rose-500 text-[10px] font-bold mt-2">
                              {formErrors.service}
                            </p>
                          )}
                      </div>
                    </div>
                  )}

                  {createStep === 2 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-slate-200">
                        <h4 className="text-2xl font-black text-primary-dark flex items-center gap-3">
                          <HomeIcon size={24} className="text-primary" />
                          Home Details & Duration
                        </h4>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-2 font-bold">
                          Specify property rooms and cleaning hours
                        </p>
                      </div>

                      {/* Duration and Pet */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white rounded-2xl border-2 border-slate-200">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-1">
                            ⏱️ Duration (Hours){" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={createData.details.duration}
                            onChange={(e) =>
                              handleFieldChange(
                                "details.duration",
                                parseFloat(e.target.value || 0.5),
                              )
                            }
                            onBlur={() =>
                              setFieldTouched((prev) => ({
                                ...prev,
                                "details.duration": true,
                              }))
                            }
                            className={`w-full p-3 rounded-xl bg-slate-50 border-2 transition-all text-lg font-bold focus:outline-none focus:ring-2 ${
                              formErrors["details.duration"]
                                ? "border-rose-400 text-rose-500 focus:ring-rose-200 focus:border-rose-500"
                                : "border-slate-200 text-primary focus:ring-primary/30 focus:border-primary"
                            }`}
                          />
                          {(formErrors["details.duration"] ||
                            fieldTouched["details.duration"]) &&
                            formErrors["details.duration"] && (
                              <p className="text-rose-500 text-[10px] font-bold mt-1">
                                {formErrors["details.duration"]}
                              </p>
                            )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 block">
                            🐾 Has Pet
                          </label>
                          <select
                            value={createData.details.hasPet || "No"}
                            onChange={(e) =>
                              handleFieldChange(
                                "details.hasPet",
                                e.target.value,
                              )
                            }
                            className="w-full p-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-bold"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>

                      {/* Property Rooms */}
                      <div
                        className={`p-4 bg-white rounded-2xl border-2 ${
                          formErrors["details.Bedroom"] ||
                          formErrors["details.Bathroom"]
                            ? "border-rose-400 bg-rose-50"
                            : "border-slate-200"
                        }`}
                      >
                        <h5 className="font-black text-base text-primary-dark mb-4 flex items-center gap-2">
                          🛏️ Property Rooms
                          <span className="text-rose-500">*</span>
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {[
                            "Bedroom",
                            "Bathroom",
                            "Kitchen",
                            "Living Room",
                            "Utility Room",
                            "Reception Room",
                            "Conservatory",
                            "Cloakroom",
                          ].map((r) => (
                            <div
                              key={r}
                              className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 flex flex-col items-center gap-2 hover:shadow-md transition-all"
                            >
                              <div className="font-bold text-sm text-primary-dark text-center line-clamp-2">
                                {r}
                              </div>
                              <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 border border-slate-200">
                                <button
                                  onClick={() => {
                                    const cur = createData.details[r] || 0;
                                    handleFieldChange(
                                      `details.${r}`,
                                      Math.max(0, cur - 1),
                                    );
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                                >
                                  <Minus size={16} />
                                </button>
                                <div className="w-6 text-center font-black text-primary text-sm">
                                  {createData.details[r] || 0}
                                </div>
                                <button
                                  onClick={() => {
                                    const cur = createData.details[r] || 0;
                                    handleFieldChange(`details.${r}`, cur + 1);
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {(formErrors["details.Bedroom"] ||
                          formErrors["details.Bathroom"]) && (
                          <div className="mt-4 p-3 bg-rose-100 border-l-4 border-rose-500 rounded">
                            {formErrors["details.Bedroom"] && (
                              <p className="text-rose-700 text-[10px] font-bold mb-1">
                                ⚠️ {formErrors["details.Bedroom"]}
                              </p>
                            )}
                            {formErrors["details.Bathroom"] && (
                              <p className="text-rose-700 text-[10px] font-bold">
                                ⚠️ {formErrors["details.Bathroom"]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {createStep === 3 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-slate-200">
                        <h4 className="text-2xl font-black text-primary-dark flex items-center gap-3">
                          <Zap size={24} className="text-primary" />
                          Extra Services
                        </h4>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-2 font-bold">
                          Add optional services to boost the booking value
                        </p>
                      </div>
                      {extraServicesList.length === 0 ? (
                        <div className="text-center py-12 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                          <Zap
                            size={40}
                            className="mx-auto text-slate-300 mb-3"
                          />
                          <p className="text-sm font-bold text-slate-500">
                            No extra services available
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {extraServicesList.map((extra) => {
                            const currentQty =
                              createData.details.extras?.find(
                                (e) => e.name === extra.name,
                              )?.qty || 0;
                            return (
                              <div
                                key={extra._id}
                                className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                                  currentQty > 0
                                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 shadow-md"
                                    : "bg-white border-slate-200 hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className="p-3 bg-white rounded-xl border-2 border-slate-200">
                                      <Zap
                                        size={20}
                                        className="text-amber-500"
                                      />
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-primary-dark">
                                        {extra.name}
                                      </p>
                                      <p className="text-xs font-bold text-slate-500 mt-1">
                                        £{extra.rate} per unit
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 bg-white rounded-xl p-2 border-2 border-slate-200">
                                    <button
                                      onClick={() => {
                                        setCreateData((prev) => {
                                          const extras = Array.isArray(
                                            prev.details.extras,
                                          )
                                            ? [...prev.details.extras]
                                            : [];
                                          const idx = extras.findIndex(
                                            (e) => e.name === extra.name,
                                          );
                                          if (idx !== -1) {
                                            if (extras[idx].qty > 1) {
                                              extras[idx].qty--;
                                            } else {
                                              extras.splice(idx, 1);
                                            }
                                          }
                                          return {
                                            ...prev,
                                            details: {
                                              ...prev.details,
                                              extras,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors font-bold"
                                    >
                                      −
                                    </button>
                                    <span className="text-lg font-black text-primary w-8 text-center">
                                      {currentQty}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setCreateData((prev) => {
                                          const extras = Array.isArray(
                                            prev.details.extras,
                                          )
                                            ? [...prev.details.extras]
                                            : [];
                                          const idx = extras.findIndex(
                                            (e) => e.name === extra.name,
                                          );
                                          if (idx !== -1) {
                                            extras[idx].qty++;
                                          } else {
                                            extras.push({
                                              name: extra.name,
                                              qty: 1,
                                            });
                                          }
                                          return {
                                            ...prev,
                                            details: {
                                              ...prev.details,
                                              extras,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 flex items-center justify-center transition-colors font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {createStep === 4 && (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-slate-200">
                        <h4 className="text-2xl font-black text-primary-dark flex items-center gap-3">
                          <DollarSign size={24} className="text-primary" />
                          Payment & Schedule
                        </h4>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-2 font-bold">
                          Set date, time, and customer details
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Calendar and Time */}
                        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-1">
                            📅 Select Date{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <CreateCalendar
                            selectedDate={createData.schedule.date}
                            onDateSelect={(d) =>
                              handleFieldChange("schedule.date", d)
                            }
                            bookedDates={bookedDates}
                          />
                          {(formErrors["schedule.date"] ||
                            fieldTouched["schedule.date"]) &&
                            formErrors["schedule.date"] && (
                              <p className="text-rose-500 text-[10px] font-bold mt-2">
                                {formErrors["schedule.date"]}
                              </p>
                            )}

                          <div className="mt-4 space-y-3">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                                🕐 Time Slot{" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <select
                                value={createData.schedule.timeSlot}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "schedule.timeSlot",
                                    e.target.value,
                                  )
                                }
                                onBlur={() =>
                                  setFieldTouched((prev) => ({
                                    ...prev,
                                    "schedule.timeSlot": true,
                                  }))
                                }
                                className={`w-full p-3 rounded-xl border-2 transition-all font-bold focus:outline-none focus:ring-2 ${
                                  formErrors["schedule.timeSlot"]
                                    ? "bg-white border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                                    : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 focus:ring-primary/30 focus:border-primary"
                                }`}
                              >
                                <option value="">Select a time slot</option>
                                {(() => {
                                  const slots = [
                                    { value: "Morning", label: "Morning (8am-12pm)", limit: 12 },
                                    { value: "Afternoon", label: "Afternoon (12pm-4pm)", limit: 16 },
                                    { value: "Evening", label: "Evening (4pm-8pm)", limit: 20 },
                                  ];
                                  
                                  const selectedDateStr = createData.schedule.date;
                                  let availableSlots = slots;
                                  
                                  if (selectedDateStr) {
                                    const selectedDate = new Date(selectedDateStr);
                                    const today = new Date();
                                    if (
                                      selectedDate.getDate() === today.getDate() &&
                                      selectedDate.getMonth() === today.getMonth() &&
                                      selectedDate.getFullYear() === today.getFullYear()
                                    ) {
                                      const currentHour = today.getHours();
                                      availableSlots = slots.filter(slot => currentHour < slot.limit);
                                      if (availableSlots.length === 0) {
                                        availableSlots = [slots[2]]; // Fallback to Evening
                                      }
                                    }
                                  }
                                  
                                  return availableSlots.map(slot => (
                                    <option key={slot.value} value={slot.value}>
                                      {slot.label}
                                    </option>
                                  ));
                                })()}
                              </select>
                              {(formErrors["schedule.timeSlot"] ||
                                fieldTouched["schedule.timeSlot"]) &&
                                formErrors["schedule.timeSlot"] && (
                                  <p className="text-rose-500 text-[10px] font-bold mt-1">
                                    {formErrors["schedule.timeSlot"]}
                                  </p>
                                )}
                            </div>

                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 block">
                                ⏰ Preferred Arrival Time
                              </label>
                              <input
                                placeholder="e.g. 10:00 AM"
                                value={createData.schedule.preferredTime || ""}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "schedule.preferredTime",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            👤 Customer Information
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <input
                                placeholder="First name"
                                value={createData.customer.firstName}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "customer.firstName",
                                    e.target.value,
                                  )
                                }
                                onBlur={() =>
                                  setFieldTouched((prev) => ({
                                    ...prev,
                                    "customer.firstName": true,
                                  }))
                                }
                                className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm focus:outline-none focus:ring-2 ${
                                  formErrors["customer.firstName"]
                                    ? "bg-white border-rose-400 focus:ring-rose-200 focus:border-rose-500 placeholder:text-rose-300"
                                    : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                                }`}
                              />
                              {formErrors["customer.firstName"] && (
                                <p className="text-rose-500 text-[9px] font-bold mt-1">
                                  {formErrors["customer.firstName"]}
                                </p>
                              )}
                            </div>
                            <div>
                              <input
                                placeholder="Last name"
                                value={createData.customer.lastName}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "customer.lastName",
                                    e.target.value,
                                  )
                                }
                                onBlur={() =>
                                  setFieldTouched((prev) => ({
                                    ...prev,
                                    "customer.lastName": true,
                                  }))
                                }
                                className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm focus:outline-none focus:ring-2 ${
                                  formErrors["customer.lastName"]
                                    ? "bg-white border-rose-400 focus:ring-rose-200 focus:border-rose-500 placeholder:text-rose-300"
                                    : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                                }`}
                              />
                              {formErrors["customer.lastName"] && (
                                <p className="text-rose-500 text-[9px] font-bold mt-1">
                                  {formErrors["customer.lastName"]}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <input
                              placeholder="Email"
                              value={createData.customer.email}
                              onChange={(e) =>
                                handleFieldChange(
                                  "customer.email",
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                setFieldTouched((prev) => ({
                                  ...prev,
                                  "customer.email": true,
                                }))
                              }
                              className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm focus:outline-none focus:ring-2 ${
                                formErrors["customer.email"]
                                  ? "bg-white border-rose-400 focus:ring-rose-200 focus:border-rose-500 placeholder:text-rose-300"
                                  : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                              }`}
                            />
                            {formErrors["customer.email"] && (
                              <p className="text-rose-500 text-[9px] font-bold mt-1">
                                {formErrors["customer.email"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <input
                              placeholder="Phone"
                              value={createData.customer.phone}
                              onChange={(e) =>
                                handleFieldChange(
                                  "customer.phone",
                                  e.target.value,
                                )
                              }
                              onBlur={() =>
                                setFieldTouched((prev) => ({
                                  ...prev,
                                  "customer.phone": true,
                                }))
                              }
                              className={`w-full p-3 rounded-xl border-2 transition-all font-medium text-sm focus:outline-none focus:ring-2 ${
                                formErrors["customer.phone"]
                                  ? "bg-white border-rose-400 focus:ring-rose-200 focus:border-rose-500 placeholder:text-rose-300"
                                  : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400"
                              }`}
                            />
                            {formErrors["customer.phone"] && (
                              <p className="text-rose-500 text-[9px] font-bold mt-1">
                                {formErrors["customer.phone"]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Final Summary */}
                      <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-emerald-600 uppercase font-black tracking-wider">
                              💰 Estimated Total
                            </p>
                            <p className="text-3xl font-black text-emerald-700 mt-1">
                              £{createTotal}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-emerald-600 uppercase font-black tracking-wider">
                              📊 Status
                            </p>
                            <p className="font-black text-emerald-700 text-lg mt-1">
                              {createData.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Summary */}
              <div className="lg:col-span-4">
                <div className="sticky top-6 bg-gradient-to-br from-primary via-blue-600 to-indigo-600 rounded-[28px] p-6 text-white shadow-xl border border-indigo-400/30 space-y-4">
                  <h5 className="font-black text-lg flex items-center gap-2">
                    📋 Booking Summary
                  </h5>

                  {/* Service Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      🧹 Service
                    </p>
                    <div className="font-black text-lg mt-2">
                      {createData.service || "Not selected"}
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      📍 Address
                    </p>
                    <div className="text-sm font-bold mt-2 line-clamp-2">
                      {createData.details.address || "Not provided"}
                    </div>
                  </div>

                  {/* Date & Time Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      📅 Date & Time
                    </p>
                    <div className="text-sm font-bold mt-2">
                      {createData.schedule.date || "Not selected"}
                      <br />
                      <span className="text-xs text-white/80">
                        {createData.schedule.timeSlot || "Select time"}
                      </span>
                    </div>
                  </div>

                  {/* Customer Card */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      👤 Customer
                    </p>
                    <div className="text-sm font-bold mt-2">
                      {createData.customer.firstName &&
                      createData.customer.lastName
                        ? `${createData.customer.firstName} ${createData.customer.lastName}`
                        : "Not provided"}
                    </div>
                  </div>

                  {/* Duration Card */}
                  {createData.details.duration && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        ⏱️ Duration
                      </p>
                      <div className="text-sm font-bold mt-2">
                        {createData.details.duration} hours
                      </div>
                    </div>
                  )}

                  {/* Price Divider */}
                  <div className="h-px bg-white/20"></div>

                  {/* Total Price Card */}
                  <div className="bg-white rounded-xl p-5 text-primary shadow-lg">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      💰 Estimated Total
                    </p>
                    <p className="text-3xl font-black text-primary mt-2">
                      £{createTotal}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 font-bold">
                      Ready to create this booking?
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-4 sm:px-6 lg:px-10 py-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-3 flex-1 sm:flex-initial">
                {createStep > 1 && (
                  <button
                    onClick={() => setCreateStep((s) => Math.max(1, s - 1))}
                    className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition-colors border-2 border-slate-200"
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div className="flex gap-3 flex-1 justify-end">
                {createStep < 4 && (
                  <button
                    onClick={handleNextStep}
                    disabled={Object.keys(formErrors).length > 0}
                    className={`px-8 py-3 rounded-xl transition-all transform font-black border-2 flex items-center gap-2 ${
                      Object.keys(formErrors).length > 0
                        ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg text-white hover:scale-105 border-primary"
                    }`}
                  >
                    Next →
                  </button>
                )}
                {createStep === 4 && (
                  <button
                    onClick={async () => {
                      // Validate all required fields before creating
                      const validation = validateStep(4);
                      setFormErrors(validation.errors);

                      if (!validation.isValid) {
                        setStatusMessage({
                          type: "error",
                          text: "Please fill all required fields correctly",
                        });
                        return;
                      }

                      try {
                        // Build extras with rate information
                        const extrasWithRates = (
                          createData.details.extras || []
                        ).map((extra) => {
                          const rate =
                            dynamicRates[
                              (extra.name || "")
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "")
                            ] || 0;
                          return {
                            ...extra,
                            rate,
                          };
                        });

                        const payload = {
                          ...createData,
                          bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
                          details: {
                            ...createData.details,
                            extras: extrasWithRates,
                          },
                          payment: {
                            amount: createTotal,
                            currency: createData.payment?.currency || "GBP",
                            status: "Pending",
                          },
                        };
                        const res = await fetch(
                          `${import.meta.env.VITE_API_URL}/bookings`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          },
                        );
                        if (!res.ok)
                          throw new Error("Failed to create booking");
                        const newBooking = await res.json();
                        setSuccessBooking(newBooking);
                        setShowSuccessModal(true);
                        setShowCreateModal(false);
                        setFormErrors({});
                        setFieldTouched({});
                        fetchBookings();
                      } catch (err) {
                        console.error(err);
                        setStatusMessage({
                          type: "error",
                          text: "Failed to create booking",
                        });
                      }
                    }}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-xl text-white font-black transition-all transform hover:scale-105 border-2 border-emerald-600 flex items-center gap-2"
                  >
                    <CheckCircle2 size={20} />
                    Create & Open Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Booking Created Successfully!
              </h2>
              <p className="text-sm text-slate-500">
                Payment link has been sent to customer email
              </p>
            </div>

            {/* Booking Details - 2 Column Layout */}
            <div className="space-y-6 mb-8">
              {/* Row 1: Reference & Customer */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Booking Reference */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    📋 Booking Reference
                  </p>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {successBooking.bookingId}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    👤 Customer
                  </p>
                  <p className="text-lg font-black text-slate-900 mb-1">
                    {successBooking.customer.firstName}{" "}
                    {successBooking.customer.lastName}
                  </p>
                  <p className="text-xs text-slate-600">
                    {successBooking.customer.email}
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    📱 {successBooking.customer.phone}
                  </p>
                </div>
              </div>

              {/* Row 2: Service & Schedule */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Service Type */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    🧹 Service Type
                  </p>
                  <p className="text-lg font-black text-slate-900 mb-1">
                    {successBooking.service}
                  </p>
                  <p className="text-xs text-slate-600">
                    Duration: {successBooking.details.duration} hours
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Frequency: {successBooking.details.frequency || "Once"}
                  </p>
                </div>

                {/* Schedule */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    📅 Schedule
                  </p>
                  <p className="text-lg font-black text-slate-900 mb-2">
                    {new Date(successBooking.schedule.date).toDateString()}
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    🕐 {successBooking.schedule.timeSlot}
                  </p>
                </div>
              </div>

              {/* Row 3: Location */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  📍 Location
                </p>
                <p className="text-lg font-black text-slate-900 mb-2">
                  {successBooking.details.address}
                </p>
                <p className="text-sm text-slate-700">
                  Postcode:{" "}
                  <span className="font-bold">
                    {successBooking.details.postcode}
                  </span>
                </p>
              </div>

              {/* Row 4: Property Rooms */}
              {(() => {
                const roomTypes = [
                  "Bedroom",
                  "Bathroom",
                  "Kitchen",
                  "Living Room",
                  "Utility Room",
                  "Reception Room",
                  "Conservatory",
                ];
                const rooms = roomTypes.filter(
                  (r) =>
                    successBooking.details[r] && successBooking.details[r] > 0,
                );
                return rooms.length > 0 ? (
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                      🏠 Property Rooms
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {rooms.map((room) => (
                        <div
                          key={room}
                          className="bg-white rounded-xl p-3 border border-indigo-200 flex flex-col items-center justify-center"
                        >
                          <p className="text-xs font-black text-indigo-600">
                            {successBooking.details[room]}x
                          </p>
                          <p className="text-xs font-bold text-slate-700 text-center mt-1">
                            {room}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Row 5: Extra Services */}
              {successBooking.details.extras &&
                successBooking.details.extras.length > 0 && (
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 border border-rose-200">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                      ⭐ Extra Services
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {successBooking.details.extras.map((extra, idx) => {
                        const displayText =
                          typeof extra === "string"
                            ? extra
                            : `${extra.name} (x${extra.qty})`;
                        const extraPrice =
                          typeof extra === "string" ? null : extra.rate;
                        return (
                          <div
                            key={idx}
                            className="bg-white rounded-xl p-4 border border-rose-200 flex items-start justify-between"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {displayText}
                              </p>
                              {extraPrice && (
                                <p className="text-xs text-slate-600 mt-1">
                                  £{extraPrice} each
                                </p>
                              )}
                            </div>
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-black">
                              ✓
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Row 6: Payment */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      💰 Total Amount
                    </p>
                    <p className="text-xs text-slate-600 mb-1">
                      Status:{" "}
                      <span className="font-bold text-amber-600">
                        Pending Payment
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-green-600">
                      {successBooking.payment.currency === "GBP" ? "£" : "₦"}
                      {successBooking.payment.amount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-blue-900 mb-2">
                ✓ Payment Link Sent
              </p>
              <p className="text-xs text-blue-800">
                A secure payment link has been sent to{" "}
                <span className="font-bold">
                  {successBooking.customer.email}
                </span>
                . Once the customer pays, the booking status will automatically
                update to Confirmed and the worker will be notified.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessBooking(null);
                  setCreateData({
                    customer: {
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                    },
                    service: "",
                    details: {
                      address: "",
                      frequency: "Once",
                      duration: 2,
                      extras: [],
                    },
                    schedule: { date: "", timeSlot: "", preferredTime: "" },
                    payment: { amount: 0, currency: "GBP", status: "Pending" },
                    status: "Pending",
                  });
                  setCreateStep(1);
                }}
                className="w-full py-3 px-6 rounded-2xl bg-primary text-white font-black hover:bg-primary/90 transition-all"
              >
                Close & Create New Booking
              </button> */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 px-6 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setShowBulkDeleteModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border-4 border-white p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-primary-dark tracking-tighter">
                  Delete {selectedBookings.size} Bookings?
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  This action cannot be undone. All selected bookings will be
                  permanently deleted.
                </p>
              </div>
              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                  Warning: {selectedBookings.size} bookings will be deleted
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 py-3 px-6 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-all border-2 border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black hover:shadow-lg transition-all border-2 border-rose-600"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
