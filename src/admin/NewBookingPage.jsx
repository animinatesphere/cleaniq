import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Home as HomeIcon,
  Zap,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Briefcase,
  Star,
  Truck,
  User,
  Search,
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  Repeat,
  Sparkles,
  Layers,
  HardHat,
  Flame,
  PartyPopper,
  Shield,
  Building2,
  Wrench,
} from "lucide-react";
import { LEAD_SOURCES } from "./Bookings";
import { buildBookedRanges, overlapsExistingRange } from "../utils/timeOverlap";

/* ── Design tokens ──────────────────────────────────────────────────────── */
const Z = {
  bg: "#03110C",
  card: "#0B2D22",
  border: "#10B981",
  text: "#FFFFFF",
  muted: "#D1D5DB",
  subtle: "#1F4E3F",
  ring: "#10B981",
  primary: "#10B981",
  green: "#10B981",
  red: "#F87171",
  amber: "#FBBF24",
};

/* ── Mini primitives ─────────────────────────────────────────────────────── */
const Label = ({ children, required }) => (
  <p className="text-xs font-semibold text-white/70 mb-1.5">
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </p>
);

const FieldError = ({ msg }) =>
  msg ? (
    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
      <AlertCircle size={11} />
      {msg}
    </p>
  ) : null;

const Field = ({ label, required, error, children }) => (
  <div>
    {label && <Label required={required}>{label}</Label>}
    {children}
    <FieldError msg={error} />
  </div>
);

const inputCls = (error) =>
  `w-full h-9 px-3 text-sm border rounded-lg bg-white/8 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition ${
    error
      ? "border-rose-400/50 focus:border-rose-400"
      : "border-white/10 focus:border-[#10B981]/50"
  }`;

/* ── Calendar (re-implemented cleanly) ─────────────────────────────────── */
const BookingCalendar = ({ selectedDate, onDateSelect, bookedDates = [] }) => {
  const [month, setMonth] = useState(new Date());
  const y = month.getFullYear(),
    m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startDow = new Date(y, m, 1).getDay();
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(y, m, d));

  const pad = (n) => String(n).padStart(2, "0");
  const toKey = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSelected = (d) => d && selectedDate && toKey(d) === selectedDate;
  const isBooked = (d) => d && bookedDates.includes(toKey(d));
  const isToday = (d) => d && toKey(d) === toKey(today);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonth(new Date(y, m - 1))}
          className="p-1.5 rounded-md text-white/40 hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-white">
          {month.toLocaleString("default", { month: "long" })} {y}
        </p>
        <button
          onClick={() => setMonth(new Date(y, m + 1))}
          className="p-1.5 rounded-md text-white/40 hover:bg-white/10 transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="text-[10px] font-semibold text-white/40 text-center py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const booked = isBooked(d);
          const selected = isSelected(d);
          return (
            <button
              key={i}
              type="button"
              disabled={booked}
              onClick={() => onDateSelect(toKey(d))}
              className={`aspect-square rounded-lg text-xs font-semibold flex items-center justify-center transition-all relative
                ${
                  selected
                    ? "bg-[#10B981] text-white"
                    : booked
                      ? "bg-white/10 text-white/40 cursor-not-allowed"
                      : isToday(d)
                        ? "border border-[#10B981] text-white hover:bg-white/10"
                        : "text-white/80 hover:bg-white/10"
                }`}
            >
              {d.getDate()}
              {booked && (
                <span className="absolute top-0 right-0.5 text-[7px] text-red-400">
                  ✕
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Room counter ─────────────────────────────────────────────────────── */
const RoomCounter = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
    <span className="text-sm font-medium text-white/70">{label}</span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, (value || 0) - 1))}
        className="w-7 h-7 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all"
      >
        <Minus size={13} />
      </button>
      <span className="w-6 text-center font-bold text-white text-sm tabular-nums">
        {value || 0}
      </span>
      <button
        type="button"
        onClick={() => onChange((value || 0) + 1)}
        className="w-7 h-7 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all"
      >
        <Plus size={13} />
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════════ */
const NewBookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ── State ─────────────────────────────────────────────────────────── */
  const [step, setStep] = useState(1);
  const [servicesList, setServicesList] = useState([]);
  const [dynamicRates, setDynamicRates] = useState({});
  const [bookedDates, setBookedDates] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [createTotal, setCreateTotal] = useState(0);
  const [flatAmount, setFlatAmount] = useState("");
  const [noPaymentRequired, setNoPaymentRequired] = useState(
    () => !!location.state?.noPaymentRequired,
  );
  const [skipEmail, setSkipEmail] = useState(false);
  const [success, setSuccess] = useState(null);

  // Customer search/autocomplete
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [customerSearching, setCustomerSearching] = useState(false);

  const [data, setData] = useState({
    customer: { firstName: "", lastName: "", email: "", phone: "" },
    service: "",
    details: {
      address: "",
      postcode: "",
      frequency: "Once",
      duration: 2,
      extras: [],
      Bedroom: 0,
      Bathroom: 0,
      Kitchen: 0,
      "Living Room": 0,
      "Utility Room": 0,
      "Reception Room": 0,
      Conservatory: 0,
      Cloakroom: 0,
      hasPet: "No",
    },
    schedule: { date: "", timeSlot: "", preferredTime: "" },
    payment: {
      amount: 0,
      currency: "GBP",
      status: "Pending",
      billingType: "hourly",
    },
    status: "Pending",
    leadSource: "Organic",
    suppliesProvidedBy: "Cleaniq",
    notes: "",
  });

  /* ── Data fetches ───────────────────────────────────────────────────── */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/services`)
      .then((r) => r.json())
      .then((d) => {
        setServicesList(d || []);
        const rates = {};
        (d || []).forEach((s) => {
          rates[clean(s.name)] = s.rate;
        });
        setDynamicRates(rates);
      })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_URL}/bookings`)
      .then((r) => r.json())
      .then((d) => {
        setBookings(Array.isArray(d) ? d : []);
        const fullyBooked = [];
        const slots = {};
        (Array.isArray(d) ? d : []).forEach((b) => {
          if (b.schedule?.date) {
            const dd = new Date(b.schedule.date);
            const key = `${dd.getFullYear()}-${pad(dd.getMonth() + 1)}-${pad(dd.getDate())}`;
            slots[key] = slots[key] || [];
            if (b.schedule.timeSlot) slots[key].push(b.schedule.timeSlot);
          }
        });
        Object.entries(slots).forEach(([k, v]) => {
          if (["Morning", "Afternoon", "Evening"].every((s) => v.includes(s)))
            fullyBooked.push(k);
        });
        setBookedDates(fullyBooked);
      })
      .catch(() => {});
  }, []);

  /* ── Customer search ────────────────────────────────────────────────── */
  useEffect(() => {
    if (customerQuery.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setCustomerSearching(true);
      try {
        const r = await fetch(
          `${import.meta.env.VITE_API_URL}/customers?search=${encodeURIComponent(customerQuery)}&limit=8`,
        );
        const d = await r.json();
        setCustomerResults(
          Array.isArray(d) ? d : Array.isArray(d?.customers) ? d.customers : [],
        );
        setShowCustomerDrop(true);
      } catch {
        setCustomerResults([]);
      } finally {
        setCustomerSearching(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [customerQuery]);

  const pickCustomer = (c) => {
    setData((prev) => ({
      ...prev,
      customer: {
        firstName: c.firstName || "",
        lastName: c.lastName || "",
        email: c.email || "",
        phone: c.phone || c.phoneNumber || "",
      },
    }));
    setCustomerQuery(`${c.firstName || ""} ${c.lastName || ""}`.trim());
    setShowCustomerDrop(false);
    setCustomerResults([]);
  };

  /* ── Helpers ────────────────────────────────────────────────────────── */
  const pad = (n) => String(n).padStart(2, "0");
  const clean = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  /* ── Service options ────────────────────────────────────────────────── */
  const serviceOptions = useMemo(() => {
    const assets = {
      residential: {
        tag: "Regular domestic",
        icon: <HomeIcon size={18} />,
        defaultId: "Regular Domestic Cleaning",
      },
      oneoff: {
        tag: "One-off / seasonal",
        icon: <Sparkles size={18} />,
        defaultId: "One-Off House Clean",
      },
      deep: {
        tag: "Full deep clean",
        icon: <Zap size={18} />,
        defaultId: "Deep Cleaning",
      },
      airbnb: {
        tag: "Holiday let specialist",
        icon: <Star size={18} />,
        defaultId: "Airbnb & Holiday Let Cleaning",
      },
      tenancy: {
        tag: "Move-out clean",
        icon: <Truck size={18} />,
        defaultId: "End of Tenancy Cleaning",
      },
      movein: {
        tag: "Move-in clean",
        icon: <Building2 size={18} />,
        defaultId: "Move-In Cleaning",
      },
      commercial: {
        tag: "Office & workspace",
        icon: <Briefcase size={18} />,
        defaultId: "Office Cleaning",
      },
      carpet: {
        tag: "Carpet & fabric care",
        icon: <Layers size={18} />,
        defaultId: "Carpet & Upholstery Cleaning",
      },
      builders: {
        tag: "Post-construction",
        icon: <HardHat size={18} />,
        defaultId: "After Builders / Post-Construction Clean",
      },
      kitchen: {
        tag: "Oven & kitchen specialist",
        icon: <Flame size={18} />,
        defaultId: "Oven & Appliance Deep Clean",
      },
      event: {
        tag: "Post-party & events",
        icon: <PartyPopper size={18} />,
        defaultId: "Post-Party & Event Clean",
      },
      disinfect: {
        tag: "Sanitisation & bio clean",
        icon: <Shield size={18} />,
        defaultId: "Disinfection & Sanitisation",
      },
      pressure: {
        tag: "Outdoor & driveway",
        icon: <Wrench size={18} />,
        defaultId: "Pressure Washing (Driveways & Patios)",
      },
    };
    const getKey = (name) => {
      const n = clean(name);
      if (
        n.includes("carpet") ||
        n.includes("upholstery") ||
        n.includes("sofa") ||
        n.includes("mattress") ||
        n.includes("fabric")
      )
        return "carpet";
      if (
        n.includes("builder") ||
        n.includes("construction") ||
        n.includes("postconstruction")
      )
        return "builders";
      if (
        n.includes("kitchen") ||
        n.includes("oven") ||
        n.includes("appliance")
      )
        return "kitchen";
      if (
        n.includes("party") ||
        n.includes("event") ||
        n.includes("postevent") ||
        n.includes("postparty")
      )
        return "event";
      if (
        n.includes("disinfect") ||
        n.includes("sanitisat") ||
        n.includes("biohazard")
      )
        return "disinfect";
      if (
        n.includes("pressure") ||
        n.includes("driveway") ||
        n.includes("patio") ||
        n.includes("outdoor")
      )
        return "pressure";
      if (
        n.includes("airbnb") ||
        n.includes("shortlet") ||
        n.includes("holiday") ||
        n.includes("guestchangeover")
      )
        return "airbnb";
      if (
        n.includes("tenancy") ||
        n.includes("moveout") ||
        n.includes("endoftenancy")
      )
        return "tenancy";
      if (n.includes("movein")) return "movein";
      if (
        n.includes("office") ||
        n.includes("commercial") ||
        n.includes("retail") ||
        n.includes("warehouse") ||
        n.includes("gym") ||
        n.includes("school") ||
        n.includes("medical") ||
        n.includes("restaurant") ||
        n.includes("coworking")
      )
        return "commercial";
      if (n.includes("deep") && !n.includes("kitchen")) return "deep";
      if (
        n.includes("oneoff") ||
        n.includes("seasonal") ||
        n.includes("spring")
      )
        return "oneoff";
      return "residential";
    };
    const bases = servicesList.filter((s) => s.category === "Base");
    const mapped = bases.map((s) => {
      const k = getKey(s.name);
      return { id: s.name, title: s.name, ...assets[k], key: k };
    });
    Object.entries(assets).forEach(([k, a]) => {
      if (!mapped.some((m) => m.key === k))
        mapped.push({ id: a.defaultId, title: a.defaultId, ...a, key: k });
    });
    return mapped;
  }, [servicesList]);

  const extrasList = useMemo(() => {
    const baseIds = serviceOptions.map((o) => clean(o.id));
    const roomNames = [
      "bedroom",
      "bathroom",
      "kitchen",
      "livingroom",
      "utilityroom",
      "receptionroom",
      "conservatory",
      "cloakroom",
    ];
    return servicesList.filter(
      (s) =>
        !baseIds.includes(clean(s.name)) && !roomNames.includes(clean(s.name)),
    );
  }, [servicesList, serviceOptions]);

  /* ── Pricing ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (data.payment?.billingType === "flat") {
      setCreateTotal(Math.round((parseFloat(flatAmount) || 0) * 100) / 100);
      return;
    }
    if (!data.service) {
      setCreateTotal(0);
      return;
    }
    let total = 0;
    const baseRate = dynamicRates[clean(data.service)] || 20;
    total += baseRate * (data.details.duration || 1);
    (data.details.extras || []).forEach((ex) => {
      total += (dynamicRates[clean(ex.name || "")] || 0) * (ex.qty || 1);
    });
    setCreateTotal(Math.round(total * 100) / 100);
  }, [data, dynamicRates, flatAmount]);

  /* ── Field change ───────────────────────────────────────────────────── */
  const set = (path, value) => {
    const keys = path.split(".");
    setData((prev) => {
      const next = { ...prev };
      let cur = next;
      keys.slice(0, -1).forEach((k) => {
        cur[k] = { ...cur[k] };
        cur = cur[k];
      });
      cur[keys[keys.length - 1]] = value;
      return next;
    });
    setTouched((p) => ({ ...p, [path]: true }));
    const err = validate(path, value);
    setFormErrors((p) => {
      const n = { ...p };
      err ? (n[path] = err) : delete n[path];
      return n;
    });
  };

  /* ── Validation ─────────────────────────────────────────────────────── */
  const validate = (f, v) => {
    if (f === "customer.firstName")
      return !v || v.trim().length < 2
        ? "At least 2 characters"
        : !/^[a-zA-Z\s'-]+$/.test(v)
          ? "Letters only"
          : "";
    if (f === "customer.lastName")
      return !v || v.trim().length < 2
        ? "At least 2 characters"
        : !/^[a-zA-Z\s'-]+$/.test(v)
          ? "Letters only"
          : "";
    if (f === "customer.email")
      return !v
        ? "Required"
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
          ? "Invalid email"
          : "";
    if (f === "customer.phone")
      return !v
        ? "Required"
        : v.replace(/\D/g, "").length < 10
          ? "Min 10 digits"
          : "";
    if (f === "service") return !v ? "Select a service" : "";
    if (f === "details.address")
      return !v || v.trim().length < 5 ? "At least 5 characters" : "";
    if (f === "details.frequency")
      return ![
        "Once",
        "Weekly",
        "Fortnightly",
        "Monthly",
        "Quarterly",
        "Yearly",
      ].includes(v)
        ? "Select one"
        : "";
    if (f === "details.duration")
      return !v || Number(v) < 1
        ? "Min 1 hour"
        : Number(v) > 50
          ? "Max 50 hours"
          : "";
    if (f === "schedule.date") return !v ? "Required" : "";
    if (f === "schedule.timeSlot") return !v ? "Required" : "";
    return "";
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      ["details.address", "details.frequency", "service"].forEach((f) => {
        const v =
          f === "service"
            ? data.service
            : f.split(".").reduce((o, k) => o?.[k], data);
        const e = validate(f, v);
        if (e) errs[f] = e;
      });
      if (data.payment?.billingType !== "flat") {
        const e = validate("details.duration", data.details.duration);
        if (e) errs["details.duration"] = e;
      }
    }
    if (s === 2) {
      // rooms optional — no strict validation
    }
    if (s === 4) {
      [
        "schedule.date",
        "schedule.timeSlot",
        "customer.firstName",
        "customer.lastName",
        "customer.email",
        "customer.phone",
      ].forEach((f) => {
        const v = f.split(".").reduce((o, k) => o?.[k], data);
        const e = validate(f, v);
        if (e) errs[f] = e;
      });
    }
    return { isValid: Object.keys(errs).length === 0, errors: errs };
  };

  const nextStep = () => {
    const v = validateStep(step);
    setFormErrors(v.errors);
    if (v.isValid) {
      setStep((s) => s + 1);
      setTouched({});
    }
  };

  /* ── Submit ─────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    const v = validateStep(4);
    setFormErrors(v.errors);
    if (!v.isValid) return;
    setSubmitting(true);
    try {
      const extrasWithRates = (data.details.extras || []).map((ex) => ({
        ...ex,
        rate: dynamicRates[clean(ex.name || "")] || 0,
      }));
      const payload = {
        ...data,
        bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        details: { ...data.details, extras: extrasWithRates },
        payment: {
          amount: createTotal,
          currency: data.payment?.currency || "GBP",
          status: "Pending",
          billingType: data.payment?.billingType || "hourly",
        },
        status: noPaymentRequired ? "Confirmed" : data.status,
        noPaymentRequired,
        skipConfirmationEmail: noPaymentRequired && skipEmail,
        createdByAdmin: localStorage.getItem("adminUser") || null,
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      const booking = await res.json();
      setSuccess(booking);
    } catch {
      setFormErrors((p) => ({
        ...p,
        _submit: "Failed to create booking. Please try again.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Steps config ───────────────────────────────────────────────────── */
  const steps = [
    { n: 1, label: "Location", icon: <MapPin size={15} /> },
    { n: 2, label: "Property", icon: <HomeIcon size={15} /> },
    { n: 3, label: "Add-ons", icon: <Zap size={15} /> },
    { n: 4, label: "Schedule", icon: <Calendar size={15} /> },
  ];

  /* ── Time slots logic ───────────────────────────────────────────────── */
  const bookedSlotsByDate = useMemo(() => {
    const m = {};
    bookings.forEach((b) => {
      if (!b.schedule?.date) return;
      if (b.status === "Cancelled") return;
      const d = new Date(b.schedule.date);
      const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      m[k] = m[k] || [];
      if (b.schedule?.timeSlot && b.schedule.timeSlot !== "Flexible") {
        if (!m[k].includes(b.schedule.timeSlot)) m[k].push(b.schedule.timeSlot);
      }
      if (b.schedule?.timeSlot === "Flexible" && b.schedule?.preferredTime) {
        if (!m[k].includes(b.schedule.preferredTime))
          m[k].push(b.schedule.preferredTime);
      }
    });
    return m;
  }, [bookings]);

  /* ── JSX ────────────────────────────────────────────────────────────── */
  if (success)
    return (
      <div className="min-h-screen bg-[#03110C] flex items-center justify-center p-6">
        <div className="bg-[#0B2D22] border border-white/10 rounded-2xl shadow-xl p-8 w-full max-w-lg text-center">
          <div className="w-14 h-14 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Booking Created</h2>
          <p className="text-sm text-white/60 mb-2">
            {success.bookingId} —{" "}
            {noPaymentRequired && skipEmail
              ? "No email sent"
              : noPaymentRequired
                ? "Confirmation emailed (no payment link)"
                : "Payment link emailed to customer"}
          </p>
          {success.meta?.recurringGroup && (
            <p className="text-xs text-[#10B981] font-semibold mb-4 flex items-center justify-center gap-1">
              <Repeat size={12} /> Recurring series created — view all in
              Recurring Bookings
            </p>
          )}

          <div className="text-left space-y-2 mb-8">
            {[
              { label: "Ref", value: success.bookingId },
              {
                label: "Customer",
                value: `${success.customer?.firstName} ${success.customer?.lastName}`,
              },
              { label: "Email", value: success.customer?.email },
              { label: "Service", value: success.service },
              { label: "Date", value: success.schedule?.date },
              { label: "Time", value: success.schedule?.timeSlot },
              { label: "Total", value: `£${success.payment?.amount}` },
            ].map((r) => (
              <div
                key={r.label}
                className="flex justify-between py-2 border-b border-white/10 text-sm"
              >
                <span className="text-white/60">{r.label}</span>
                <span className="font-semibold text-white">
                  {r.value || "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/bookings")}
              className="flex-1 h-10 border border-white/10 rounded-lg text-sm font-semibold text-white/70 hover:bg-white/10 transition-all"
            >
              Back to Bookings
            </button>
            <button
              onClick={() => {
                setSuccess(null);
                setStep(1);
                setData({
                  customer: {
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                  },
                  service: "",
                  details: {
                    address: "",
                    postcode: "",
                    frequency: "Once",
                    duration: 2,
                    extras: [],
                    Bedroom: 0,
                    Bathroom: 0,
                    Kitchen: 0,
                    "Living Room": 0,
                    "Utility Room": 0,
                    "Reception Room": 0,
                    Conservatory: 0,
                    Cloakroom: 0,
                    hasPet: "No",
                  },
                  schedule: { date: "", timeSlot: "", preferredTime: "" },
                  payment: {
                    amount: 0,
                    currency: "GBP",
                    status: "Pending",
                    billingType: "hourly",
                  },
                  status: "Pending",
                  leadSource: "Organic",
                  suppliesProvidedBy: "Cleaniq",
                  notes: "",
                });
                setFlatAmount("");
                setNoPaymentRequired(false);
                setSkipEmail(false);
                setFormErrors({});
              }}
              className="flex-1 h-10 bg-[#10B981] rounded-lg text-sm font-semibold text-white hover:bg-[#059669] transition-all"
            >
              New Booking
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#03110C]">
      {/* Top bar */}
      <div className="bg-[#0B2D22] border-b border-white/10 px-4 sm:px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
        <button
          onClick={() => navigate("/admin/bookings")}
          className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-all"
        >
          <ArrowLeft size={16} /> Bookings
        </button>
        <span className="text-white/15">|</span>
        <h1 className="text-sm font-semibold text-white">New Booking</h1>

        {/* Step progress — desktop */}
        <div className="hidden md:flex items-center gap-1 ml-auto">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${step === s.n ? "bg-[#10B981] text-white" : step > s.n ? "bg-white/10 text-white/80" : "text-white/40"}`}
              >
                {step > s.n ? <CheckCircle2 size={13} /> : s.icon}
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-6 h-px ${step > s.n ? "bg-white/30" : "bg-white/15"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step progress — mobile */}
        <div className="flex md:hidden items-center gap-1 ml-auto text-xs font-semibold text-white/60">
          Step {step} of {steps.length} — {steps[step - 1].label}
        </div>
      </div>

      {/* Non-pay mode banner */}
      {noPaymentRequired && (
        <div className="bg-[#10B981]/10 border-b border-[#10B981]/30 px-4 sm:px-6 py-2.5 flex items-center gap-3">
          <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/20 border border-[#10B981]/30 px-2 py-0.5 rounded-full">
            Already Paid
          </span>
          <p className="text-xs text-[#10B981] flex-1">
            This booking is marked as already paid — no Stripe link will be
            sent.
            {skipEmail
              ? " No confirmation email will be sent."
              : " A confirmation email will still be sent unless you opt out on Step 1."}
          </p>
          <button
            type="button"
            onClick={() => setNoPaymentRequired(false)}
            className="text-[11px] text-[#10B981] hover:text-[#059669] underline flex-shrink-0"
          >
            Remove
          </button>
        </div>
      )}

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Main form area ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Billing type toggle (always visible at top) */}
            {step === 1 && (
              <div className="bg-[#0B2D22] border border-white/10 rounded-xl p-4 mb-4">
                <Label>Billing type</Label>
                <div className="flex gap-2 mt-1">
                  {[
                    { v: "hourly", l: "Hourly rate", s: "Priced by duration" },
                    { v: "flat", l: "Flat rate", s: "One fixed price" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => set("payment.billingType", o.v)}
                      className={`flex-1 flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-all ${
                        (data.payment?.billingType || "hourly") === o.v
                          ? "border-[#10B981] bg-[#10B981] text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      <span className="text-sm font-semibold">{o.l}</span>
                      <span
                        className={`text-[11px] ${(data.payment?.billingType || "hourly") === o.v ? "text-white/80" : "text-white/40"}`}
                      >
                        {o.s}
                      </span>
                    </button>
                  ))}
                </div>

                {data.payment?.billingType === "flat" ? (
                  <div className="mt-3">
                    <Label required>Fixed price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm font-medium">
                        £
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={flatAmount}
                        onChange={(e) => setFlatAmount(e.target.value)}
                        className="w-full h-9 pl-7 pr-3 text-sm border border-white/10 rounded-lg bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/50 transition"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Label required>Duration (hours)</Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => set("details.duration", h)}
                          className={`w-9 h-9 rounded-lg text-sm font-semibold border transition-all ${
                            data.details.duration === h
                              ? "bg-[#10B981] text-white border-[#10B981]"
                              : "bg-white/5 text-white/70 border-white/10 hover:border-white/20"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                      <input
                        type="number"
                        min="1"
                        max="50"
                        placeholder="More"
                        value={
                          data.details.duration > 8 ? data.details.duration : ""
                        }
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v))
                            set(
                              "details.duration",
                              Math.min(50, Math.max(1, v)),
                            );
                        }}
                        className="w-20 h-9 px-2 text-sm border border-white/10 rounded-lg bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/50 transition"
                      />
                    </div>
                    <FieldError msg={formErrors["details.duration"]} />
                  </div>
                )}

                {/* Non-pay toggle */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noPaymentRequired}
                      onChange={(e) => setNoPaymentRequired(e.target.checked)}
                      className="rounded border-white/20 accent-[#10B981] w-4 h-4"
                    />
                    <span className="text-sm font-medium text-white/70">
                      Already paid (cash / bank transfer)
                    </span>
                  </label>
                  {noPaymentRequired && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none ml-6">
                      <input
                        type="checkbox"
                        checked={skipEmail}
                        onChange={(e) => setSkipEmail(e.target.checked)}
                        className="rounded border-white/20 accent-[#10B981] w-4 h-4"
                      />
                      <span className="text-sm text-white/60">
                        Don't send a confirmation email
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* STEP 1 — Location & Service */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="bg-[#0B2D22] border border-white/10 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin size={15} className="text-white/50" /> Location
                  </h2>
                  <div className="space-y-3">
                    <Field
                      label="Full address"
                      required
                      error={formErrors["details.address"]}
                    >
                      <input
                        placeholder="e.g. 12 Baker Street, London"
                        value={data.details.address}
                        onChange={(e) => set("details.address", e.target.value)}
                        className={inputCls(formErrors["details.address"])}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Postcode">
                        <input
                          placeholder="e.g. SW1A 1AA"
                          value={data.details.postcode || ""}
                          onChange={(e) =>
                            set("details.postcode", e.target.value)
                          }
                          className={inputCls(false)}
                        />
                      </Field>
                      <Field
                        label="Frequency"
                        required
                        error={formErrors["details.frequency"]}
                      >
                        <select
                          value={data.details.frequency}
                          onChange={(e) =>
                            set("details.frequency", e.target.value)
                          }
                          className={inputCls(formErrors["details.frequency"])}
                        >
                          <option>Once</option>
                          <option>Weekly</option>
                          <option>Fortnightly</option>
                          <option>Monthly</option>
                          <option>Quarterly</option>
                          <option>Yearly</option>
                        </select>
                        {data.details.frequency !== "Once" && (
                          <p className="text-[11px] text-[#10B981] mt-1 flex items-center gap-1">
                            <Repeat size={10} />{" "}
                            {
                              {
                                Weekly: "12 weekly",
                                Fortnightly: "12 fortnightly",
                                Monthly: "12 monthly",
                                Quarterly: "4 quarterly",
                                Yearly: "2 yearly",
                              }[data.details.frequency]
                            }{" "}
                            bookings will be auto-created as a series
                          </p>
                        )}
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Lead source">
                        <select
                          value={data.leadSource || "Organic"}
                          onChange={(e) => set("leadSource", e.target.value)}
                          className={inputCls(false)}
                        >
                          {LEAD_SOURCES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Supplies provided by">
                        <select
                          value={data.suppliesProvidedBy || "Cleaniq"}
                          onChange={(e) =>
                            set("suppliesProvidedBy", e.target.value)
                          }
                          className={inputCls(false)}
                        >
                          <option value="Cleaniq">Cleaniq</option>
                          <option value="Customer">Customer</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B2D22] border border-white/10 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap size={15} className="text-white/50" /> Service type{" "}
                    <span className="text-rose-400 text-xs font-normal">*</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {serviceOptions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => set("service", s.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          data.service === s.id
                            ? "border-[#10B981] bg-[#10B981] text-white"
                            : formErrors.service
                              ? "border-rose-400/30 bg-rose-500/10 hover:border-red-300"
                              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 ${data.service === s.id ? "text-white" : "text-white/40"}`}
                        >
                          {s.icon}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold leading-tight ${data.service === s.id ? "text-white" : "text-white"}`}
                          >
                            {s.title}
                          </p>
                          <p
                            className={`text-[11px] mt-0.5 ${data.service === s.id ? "text-white/30" : "text-white/40"}`}
                          >
                            {s.tag}
                          </p>
                        </div>
                        {data.service === s.id && (
                          <CheckCircle2
                            size={15}
                            className="ml-auto text-white flex-shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <FieldError msg={formErrors.service} />
                </div>
              </div>
            )}

            {/* STEP 2 — Property rooms */}
            {step === 2 && (
              <div className="bg-[#0B2D22] border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <HomeIcon size={15} className="text-white/50" /> Property
                  details
                </h2>
                <p className="text-xs text-white/40 mb-5">
                  Count the rooms in the property (0 if not applicable)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
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
                    <RoomCounter
                      key={r}
                      label={r}
                      value={data.details[r] || 0}
                      onChange={(v) => set(`details.${r}`, v)}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                  <span className="text-sm font-medium text-white/70">
                    Pet on premises?
                  </span>
                  <select
                    value={data.details.hasPet || "No"}
                    onChange={(e) => set("details.hasPet", e.target.value)}
                    className="h-8 px-2 text-sm border border-white/10 rounded-md bg-white/5 focus:outline-none cursor-pointer"
                  >
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3 — Add-ons */}
            {step === 3 && (
              <div className="bg-[#0B2D22] border border-white/10 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <Zap size={15} className="text-white/50" /> Extra services
                </h2>
                <p className="text-xs text-white/40 mb-5">
                  Optional add-ons — each adds to the total price
                </p>

                {extrasList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-white/40 border border-dashed border-white/10 rounded-lg">
                    <Zap size={24} strokeWidth={1.5} className="mb-2" />
                    <p className="text-sm font-medium">No add-ons configured</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extrasList.map((ex) => {
                      const curr =
                        data.details.extras?.find((e) => e.name === ex.name)
                          ?.qty || 0;
                      const toggle = (delta) => {
                        setData((prev) => {
                          const extras = Array.isArray(prev.details.extras)
                            ? [...prev.details.extras]
                            : [];
                          const idx = extras.findIndex(
                            (e) => e.name === ex.name,
                          );
                          const newQty =
                            (idx !== -1 ? extras[idx].qty : 0) + delta;
                          if (newQty <= 0) {
                            if (idx !== -1) extras.splice(idx, 1);
                          } else if (idx !== -1) {
                            extras[idx] = { ...extras[idx], qty: newQty };
                          } else {
                            extras.push({ name: ex.name, qty: 1 });
                          }
                          return {
                            ...prev,
                            details: { ...prev.details, extras },
                          };
                        });
                      };
                      return (
                        <div
                          key={ex._id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            curr > 0
                              ? "border-[#10B981] bg-[#10B981]/20"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${curr > 0 ? "bg-[#10B981]" : "bg-white/10"}`}
                            >
                              <Zap
                                size={13}
                                className={
                                  curr > 0 ? "text-white" : "text-white/40"
                                }
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {ex.name}
                              </p>
                              <p className="text-xs text-white/40">
                                £{ex.rate} per unit
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-[#0B2D22] border border-white/10 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => toggle(-1)}
                              disabled={curr === 0}
                              className="w-7 h-7 rounded-md hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all disabled:opacity-40"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-5 text-center font-bold text-white text-sm tabular-nums">
                              {curr}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggle(1)}
                              className="w-7 h-7 rounded-md hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4 — Schedule & Customer */}
            {step === 4 && (
              <div className="space-y-4">
                {/* Date & time */}
                <div className="bg-[#0B2D22] border border-white/10 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar size={15} className="text-white/50" /> Date & Time{" "}
                    <span className="text-rose-400 text-xs font-normal">*</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <BookingCalendar
                        selectedDate={data.schedule.date}
                        onDateSelect={(d) => set("schedule.date", d)}
                        bookedDates={bookedDates}
                      />
                      <FieldError msg={formErrors["schedule.date"]} />
                    </div>
                    <div className="space-y-4">
                      {/* Traditional Slots */}
                      <div>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
                          Traditional Slots
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {(() => {
                            const slots = [
                              {
                                value: "Morning",
                                label: "Morning",
                                sub: "8am–12pm",
                                limit: 12,
                              },
                              {
                                value: "Afternoon",
                                label: "Afternoon",
                                sub: "12pm–4pm",
                                limit: 16,
                              },
                              {
                                value: "Evening",
                                label: "Evening",
                                sub: "4pm–8pm",
                                limit: 20,
                              },
                            ];
                            const selectedDateStr = data.schedule.date;
                            let visible = slots;
                            if (selectedDateStr) {
                              const sel = new Date(
                                selectedDateStr + "T12:00:00",
                              );
                              const now = new Date();
                              if (
                                sel.getDate() === now.getDate() &&
                                sel.getMonth() === now.getMonth() &&
                                sel.getFullYear() === now.getFullYear()
                              ) {
                                const effHour =
                                  now.getMinutes() >= 30
                                    ? now.getHours() + 1
                                    : now.getHours();
                                visible = slots.filter(
                                  (s) => effHour < s.limit,
                                );
                              }
                            }
                            return visible.map((slot) => {
                              const isBooked =
                                selectedDateStr &&
                                bookedSlotsByDate[selectedDateStr]?.some((s) =>
                                  s.includes(slot.value),
                                );
                              const isSelected =
                                data.schedule.timeSlot === slot.value;
                              return (
                                <button
                                  key={slot.value}
                                  type="button"
                                  disabled={isBooked}
                                  onClick={() => {
                                    set("schedule.timeSlot", slot.value);
                                    set("schedule.preferredTime", "");
                                  }}
                                  className={`py-3 px-2 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${
                                    isSelected
                                      ? "border-[#10B981] bg-[#10B981] text-white shadow-md"
                                      : isBooked
                                        ? "border-rose-400/30 bg-rose-500/10 text-rose-400 cursor-not-allowed opacity-60"
                                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                                  }`}
                                >
                                  {slot.label}
                                  <span
                                    className={`block text-[9px] mt-0.5 font-medium ${isSelected ? "text-white/30" : isBooked ? "text-rose-400" : "text-white/40"}`}
                                  >
                                    {isBooked ? "Booked" : slot.sub}
                                  </span>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Flexible time — ALWAYS visible, clicking a time sets timeSlot="Flexible" */}
                      <div className="border-2 border-white/10 rounded-xl p-4 space-y-4 bg-[#0B2D22]">
                        <div>
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} className="text-white/50" /> Choose
                            Your Flexible Time
                          </p>
                          <p className="text-[9px] text-white/40 mt-0.5">
                            Available: 8:00 AM – 8:00 PM
                          </p>
                        </div>

                        {/* Quick time buttons */}
                        <div className="grid grid-cols-4 gap-2">
                          {(() => {
                            const allTimes = [
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
                            const selectedDateStr = data.schedule.date;
                            const now = new Date();
                            const cutoff =
                              now.getHours() * 60 + now.getMinutes() + 30;
                            const isToday = (() => {
                              if (!selectedDateStr) return false;
                              const sel = new Date(
                                selectedDateStr + "T12:00:00",
                              );
                              return (
                                sel.getDate() === now.getDate() &&
                                sel.getMonth() === now.getMonth() &&
                                sel.getFullYear() === now.getFullYear()
                              );
                            })();
                            const bookingsOnDate = bookings.filter((b) => {
                              if (!b.schedule?.date) return false;
                              const d = new Date(b.schedule.date);
                              const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                              return k === selectedDateStr;
                            });
                            const bookedRanges =
                              buildBookedRanges(bookingsOnDate);
                            const times = isToday
                              ? allTimes.filter((t) => {
                                  const [h, m] = t.split(":").map(Number);
                                  return h * 60 + m > cutoff;
                                })
                              : allTimes;
                            return times.map((time) => {
                              const isBooked = overlapsExistingRange(
                                time,
                                data.details.duration || 1,
                                bookedRanges,
                              );
                              const isSelected =
                                data.schedule.timeSlot === "Flexible" &&
                                data.schedule.preferredTime === time;
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  disabled={isBooked}
                                  onClick={() => {
                                    set("schedule.timeSlot", "Flexible");
                                    set("schedule.preferredTime", time);
                                  }}
                                  className={`py-3 px-2 rounded-xl border-2 text-[10px] font-bold transition-all hover:scale-105 ${
                                    isSelected
                                      ? "border-[#10B981] bg-[#10B981] text-white shadow-lg scale-110"
                                      : isBooked
                                        ? "border-rose-400/30 bg-rose-500/10 text-rose-400 cursor-not-allowed opacity-50"
                                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                                  }`}
                                >
                                  {time}
                                </button>
                              );
                            });
                          })()}
                        </div>

                        {/* Custom time input */}
                        <div className="border-t-2 border-white/10 pt-3 space-y-2">
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            ⏰ Custom Time
                          </p>
                          <div className="flex gap-3 items-center">
                            <input
                              type="time"
                              min="08:00"
                              max="20:00"
                              value={
                                data.schedule.preferredTime &&
                                data.schedule.timeSlot === "Flexible"
                                  ? data.schedule.preferredTime.includes(":")
                                    ? data.schedule.preferredTime
                                    : "12:30"
                                  : ""
                              }
                              onChange={(e) => {
                                if (e.target.value) {
                                  set("schedule.timeSlot", "Flexible");
                                  set("schedule.preferredTime", e.target.value);
                                } else {
                                  set("schedule.preferredTime", "12:30");
                                  set("schedule.timeSlot", "Flexible");
                                }
                              }}
                              onBlur={(e) => {
                                if (!data.schedule.preferredTime) {
                                  set("schedule.preferredTime", "12:30");
                                  set("schedule.timeSlot", "Flexible");
                                }
                              }}
                              className="flex-1 p-3 rounded-xl bg-white/5 border-2 border-white/10 focus:border-[#10B981]/50 focus:bg-white/10 outline-none font-bold text-sm text-white/70 transition-all"
                            />
                            <span className="text-[10px] font-bold text-white/50 whitespace-nowrap">
                              {data.schedule.preferredTime &&
                              data.schedule.timeSlot === "Flexible"
                                ? "✓ Selected"
                                : "Click to set"}
                            </span>
                          </div>
                          <p className="text-[9px] text-white/40">
                            💡 If left empty, defaults to 12:30 PM
                          </p>
                        </div>
                      </div>

                      <FieldError msg={formErrors["schedule.timeSlot"]} />

                      {/* Preferred time hint for non-flexible slots */}
                      {data.schedule.timeSlot &&
                        data.schedule.timeSlot !== "Flexible" && (
                          <div>
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2 block">
                              ⏰ Preferred Arrival Time (Optional)
                            </label>
                            <input
                              placeholder="e.g. 10:00 AM"
                              value={data.schedule.preferredTime || ""}
                              onChange={(e) =>
                                set("schedule.preferredTime", e.target.value)
                              }
                              className="w-full p-3 rounded-xl bg-white/5 border-2 border-white/10 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]/50 transition-all font-medium placeholder:text-white/40 text-sm"
                            />
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Customer info */}
                <div className="bg-[#0B2D22] border border-white/10 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <User size={15} className="text-white/50" /> Customer
                    information
                  </h2>

                  {/* Search existing customers */}
                  <div className="mb-4 relative">
                    <Label>Search existing client</Label>
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                      />
                      <input
                        type="text"
                        placeholder="Type a name or email to find existing client…"
                        value={customerQuery}
                        onChange={(e) => {
                          setCustomerQuery(e.target.value);
                          setShowCustomerDrop(true);
                        }}
                        onFocus={() =>
                          customerResults.length > 0 &&
                          setShowCustomerDrop(true)
                        }
                        onBlur={() =>
                          setTimeout(() => setShowCustomerDrop(false), 200)
                        }
                        className="w-full h-9 pl-9 pr-3 text-sm border border-white/10 rounded-lg bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/50 transition"
                      />
                      {customerSearching && (
                        <RefreshCw
                          size={13}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin"
                        />
                      )}
                    </div>
                    {showCustomerDrop && customerResults.length > 0 && (
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-[#0B2D22] border border-white/10 rounded-xl shadow-lg overflow-hidden">
                        {customerResults.map((c, i) => (
                          <button
                            key={c._id || i}
                            type="button"
                            onMouseDown={() => pickCustomer(c)}
                            className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm border-b border-white/10 last:border-0 flex items-center gap-3"
                          >
                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 flex-shrink-0">
                              {(c.firstName?.[0] || "?").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">
                                {c.firstName} {c.lastName}
                              </p>
                              <p className="text-xs text-white/40 truncate">
                                {c.email}
                                {c.phone ? ` · ${c.phone}` : ""}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showCustomerDrop &&
                      customerQuery.length >= 2 &&
                      customerResults.length === 0 &&
                      !customerSearching && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-[#0B2D22] border border-white/10 rounded-xl shadow-lg px-4 py-3 text-xs text-white/40">
                          No existing client found — fill in details below
                        </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="First name"
                      required
                      error={formErrors["customer.firstName"]}
                    >
                      <input
                        placeholder="Jane"
                        value={data.customer.firstName}
                        onChange={(e) =>
                          set("customer.firstName", e.target.value)
                        }
                        className={inputCls(formErrors["customer.firstName"])}
                      />
                    </Field>
                    <Field
                      label="Last name"
                      required
                      error={formErrors["customer.lastName"]}
                    >
                      <input
                        placeholder="Smith"
                        value={data.customer.lastName}
                        onChange={(e) =>
                          set("customer.lastName", e.target.value)
                        }
                        className={inputCls(formErrors["customer.lastName"])}
                      />
                    </Field>
                    <Field
                      label="Email address"
                      required
                      error={formErrors["customer.email"]}
                    >
                      <input
                        type="email"
                        placeholder="jane@example.com"
                        value={data.customer.email}
                        onChange={(e) => set("customer.email", e.target.value)}
                        className={inputCls(formErrors["customer.email"])}
                      />
                    </Field>
                    <Field
                      label="Phone number"
                      required
                      error={formErrors["customer.phone"]}
                    >
                      <input
                        type="tel"
                        placeholder="+44 7700 000000"
                        value={data.customer.phone}
                        onChange={(e) => set("customer.phone", e.target.value)}
                        className={inputCls(formErrors["customer.phone"])}
                      />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field label="Notes (optional)">
                      <textarea
                        placeholder="Access instructions, special requirements…"
                        value={data.notes || ""}
                        onChange={(e) => set("notes", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/50 transition resize-none"
                      />
                    </Field>
                  </div>
                </div>

                {formErrors._submit && (
                  <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-400/30 rounded-lg text-sm text-rose-400">
                    <AlertCircle size={14} />
                    {formErrors._submit}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div>
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-1.5 h-9 px-4 border border-white/10 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 transition-all"
                  >
                    <ChevronLeft size={15} /> Back
                  </button>
                )}
              </div>
              <div>
                {step < 4 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-1.5 h-9 px-5 bg-[#10B981] rounded-lg text-sm font-semibold text-white hover:bg-[#059669] transition-all"
                  >
                    Continue <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-1.5 h-9 px-5 bg-[#10B981] rounded-lg text-sm font-semibold text-white hover:bg-[#059669] transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Create Booking
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Sticky summary sidebar ──────────────────────────────────── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-[73px] bg-[#0B2D22] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                  Booking summary
                </p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: "Service", value: data.service || "—" },
                  { label: "Address", value: data.details.address || "—" },
                  { label: "Postcode", value: data.details.postcode || "—" },
                  { label: "Date", value: data.schedule.date || "—" },
                  { label: "Time", value: data.schedule.timeSlot || "—" },
                  {
                    label: "Customer",
                    value: data.customer.firstName
                      ? `${data.customer.firstName} ${data.customer.lastName}`.trim()
                      : "—",
                  },
                  {
                    label: "Billing",
                    value:
                      (data.payment?.billingType || "hourly") === "flat"
                        ? "Flat rate"
                        : `${data.details.duration}h hourly`,
                  },
                  { label: "Source", value: data.leadSource || "Organic" },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="text-white/40 flex-shrink-0 text-xs">
                      {r.label}
                    </span>
                    <span className="font-medium text-white text-right text-xs break-words max-w-[160px]">
                      {r.value}
                    </span>
                  </div>
                ))}

                {/* Extras */}
                {(data.details.extras || []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1.5">
                      Add-ons
                    </p>
                    {data.details.extras.map((e) => (
                      <div
                        key={e.name}
                        className="flex justify-between text-xs mb-1"
                      >
                        <span className="text-white/60">
                          {e.name} ×{e.qty}
                        </span>
                        <span className="font-medium text-white">
                          £
                          {(
                            (dynamicRates[clean(e.name || "")] || 0) * e.qty
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div
                className={`px-4 py-4 border-t border-white/10 ${noPaymentRequired ? "bg-[#10B981]/10" : "bg-[#10B981]"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-wide ${noPaymentRequired ? "text-[#10B981]" : "text-white/40"}`}
                    >
                      Estimated total
                    </p>
                    <p
                      className={`text-2xl font-bold tabular-nums mt-0.5 ${noPaymentRequired ? "text-[#10B981]" : "text-white"}`}
                    >
                      £{createTotal.toFixed(2)}
                    </p>
                  </div>
                  {noPaymentRequired && (
                    <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/20 border border-[#10B981]/30 px-2 py-1 rounded-full">
                      Paid
                    </span>
                  )}
                </div>
                {!noPaymentRequired && (
                  <p className="text-[11px] text-white/40 mt-1">
                    Payment link sent by email on creation
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBookingPage;
