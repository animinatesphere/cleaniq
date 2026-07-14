import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, Repeat, RefreshCw, Calendar, User, Ban,
  ChevronDown, ChevronUp, Plus, X, Check, AlertCircle,
  Clock, Hash, CreditCard, Building2, ArrowLeft, ArrowRight,
  Zap, MapPin, Phone, Mail, Layers, ChevronRight, CheckCircle2, BellOff, Bell,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const isRealBooking = (b) =>
  b.status !== "Blackout" && b.customer?.firstName !== "ADMIN_BLOCK";

// ── Frequency options ──────────────────────────────────────────────────────
const FREQ_OPTIONS = [
  { value: "specific_days", label: "Specific Days", sub: "Choose which days each week", icon: "🗓", color: "violet" },
  { value: "daily",         label: "Every Day",     sub: "7 sessions per week",          icon: "☀", color: "amber" },
  { value: "every2days",    label: "Every 2 Days",  sub: "~3–4 sessions per week",       icon: "📅", color: "sky" },
  { value: "every3days",    label: "Every 3 Days",  sub: "~2 sessions per week",         icon: "📆", color: "teal" },
  { value: "weekly",        label: "Weekly",        sub: "Once per week",                icon: "🔄", color: "primary" },
  { value: "fortnightly",   label: "Fortnightly",   sub: "Every 2 weeks",               icon: "📌", color: "indigo" },
  { value: "monthly",       label: "Monthly",       sub: "Once per month",               icon: "🗃", color: "rose" },
  { value: "quarterly",     label: "Quarterly",     sub: "Every 3 months",               icon: "📊", color: "orange" },
  { value: "yearly",        label: "Yearly",        sub: "Once per year",                icon: "🏆", color: "emerald" },
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NUM = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const freqLabel = (type, specificDays = []) => {
  if (type === "specific_days") return specificDays.join(", ") || "Specific days";
  return FREQ_OPTIONS.find((o) => o.value === type)?.label || type;
};

// ── Date generation ────────────────────────────────────────────────────────
const generateDates = (form) => {
  if (!form.startDate) return [];
  const start = new Date(form.startDate + "T00:00:00");
  const dates = [];

  if (form.frequencyType === "specific_days" && form.specificDays.length > 0) {
    const selectedNums = form.specificDays.map((d) => DAY_NUM[d]).sort((a, b) => a - b);
    let cur = new Date(start);
    cur.setDate(cur.getDate() - cur.getDay());
    const maxIter = Math.ceil(form.occurrences / form.specificDays.length) + 3;
    for (let w = 0; w < maxIter && dates.length < form.occurrences; w++) {
      for (const dayNum of selectedNums) {
        const d = new Date(cur);
        d.setDate(d.getDate() + dayNum);
        if (d >= start && dates.length < form.occurrences)
          dates.push(d.toISOString().slice(0, 10));
      }
      cur.setDate(cur.getDate() + 7);
    }
  } else {
    let cur = new Date(start);
    for (let i = 0; i < form.occurrences; i++) {
      dates.push(cur.toISOString().slice(0, 10));
      if (form.frequencyType === "daily")        cur.setDate(cur.getDate() + 1);
      else if (form.frequencyType === "every2days")  cur.setDate(cur.getDate() + 2);
      else if (form.frequencyType === "every3days")  cur.setDate(cur.getDate() + 3);
      else if (form.frequencyType === "weekly")      cur.setDate(cur.getDate() + 7);
      else if (form.frequencyType === "fortnightly") cur.setDate(cur.getDate() + 14);
      else if (form.frequencyType === "monthly")     cur.setMonth(cur.getMonth() + 1);
      else if (form.frequencyType === "quarterly")   cur.setMonth(cur.getMonth() + 3);
      else if (form.frequencyType === "yearly")      cur.setFullYear(cur.getFullYear() + 1);
    }
  }
  return dates;
};

// ── Shared primitives ──────────────────────────────────────────────────────
const inp = "w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300";
const Field = ({ label, error, hint, children }) => (
  <div>
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
    {children}
    {hint && !error && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    {error && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
  </div>
);

const BLANK_FORM = {
  bookingIdQuery: "",
  loadedFrom: null,
  customerQuery: "",
  customer: { firstName: "", lastName: "", email: "", phone: "" },
  service: "",
  address: "",
  postcode: "",
  duration: 3,
  notes: "",
  frequencyType: "weekly",
  specificDays: [],
  startDate: "",
  timeSlot: "09:00",
  occurrences: 12,
  noPayment: false,
  amount: "",
  suppressEmail: true,
};

const STEPS = [
  { id: 1, label: "Customer",  icon: User },
  { id: 2, label: "Service",   icon: Building2 },
  { id: 3, label: "Schedule",  icon: Calendar },
  { id: 4, label: "Confirm",   icon: CheckCircle2 },
];

// ══════════════════════════════════════════════════════════════════════════
//  CREATE PAGE  (shown instead of list when creating)
// ══════════════════════════════════════════════════════════════════════════
const CreatePage = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(BLANK_FORM);
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustDrop, setShowCustDrop] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const bodyRef = useRef(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setC = (k, v) => setForm((p) => ({ ...p, customer: { ...p.customer, [k]: v } }));

  // ── Scroll to top on step change
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  // ── Customer autocomplete
  useEffect(() => {
    if (form.customerQuery.trim().length < 2) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API}/customers?search=${encodeURIComponent(form.customerQuery)}&limit=6`);
        const d = await r.json();
        setCustomerResults(Array.isArray(d) ? d : (d?.customers || []));
        setShowCustDrop(true);
      } catch { setCustomerResults([]); }
    }, 280);
    return () => clearTimeout(t);
  }, [form.customerQuery]);

  const pickCustomer = (c) => {
    setForm((p) => ({
      ...p,
      customer: { firstName: c.firstName || "", lastName: c.lastName || "", email: c.email || "", phone: c.phone || c.phoneNumber || "" },
      customerQuery: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
    }));
    setCustomerResults([]);
    setShowCustDrop(false);
  };

  // ── Load from booking ID
  const loadFromBookingId = async () => {
    const q = form.bookingIdQuery.trim();
    if (!q) return;
    setLoadingBooking(true);
    setLoadError("");
    try {
      // Try fetching by bookingId field
      const r = await fetch(`${API}/bookings?bookingId=${encodeURIComponent(q)}&limit=1`);
      const data = await r.json();
      const list = Array.isArray(data) ? data : (data?.bookings || []);
      const b = list.find(
        (x) => x.bookingId?.toLowerCase() === q.toLowerCase() ||
               x._id?.toLowerCase() === q.toLowerCase()
      ) || list[0];

      if (!b) { setLoadError(`No booking found for "${q}"`); return; }

      setForm((p) => ({
        ...p,
        loadedFrom: b.bookingId || q,
        customerQuery: `${b.customer?.firstName || ""} ${b.customer?.lastName || ""}`.trim(),
        customer: {
          firstName: b.customer?.firstName || "",
          lastName:  b.customer?.lastName  || "",
          email:     b.customer?.email     || "",
          phone:     b.customer?.phone || b.customer?.phoneNumber || "",
        },
        service:  b.service  || "",
        address:  b.details?.address  || "",
        postcode: b.details?.postcode || "",
        duration: b.details?.duration || 3,
        notes:    b.details?.specialInstructions || "",
        timeSlot: b.schedule?.timeSlot || "09:00",
        amount:   b.payment?.amount ? String(b.payment.amount) : "",
        noPayment: !!b.noPaymentRequired,
        startDate: "",
      }));
    } catch {
      setLoadError("Failed to load booking. Check the ID and try again.");
    } finally {
      setLoadingBooking(false);
    }
  };

  // ── Day toggle
  const toggleDay = (d) =>
    set("specificDays", form.specificDays.includes(d)
      ? form.specificDays.filter((x) => x !== d)
      : [...form.specificDays, d]);

  // ── Preview dates
  const preview = useMemo(() => generateDates(form), [form]);

  // ── Validation per step
  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.customer.firstName) e.firstName = "Required";
      if (!form.customer.lastName)  e.lastName  = "Required";
      if (!form.customer.email)     e.email     = "Required";
    }
    if (s === 2) {
      if (!form.service) e.service = "Required";
      if (!form.address) e.address = "Required";
    }
    if (s === 3) {
      if (!form.startDate) e.startDate = "Required";
      if (form.frequencyType === "specific_days" && form.specificDays.length === 0)
        e.specificDays = "Select at least one day";
    }
    if (s === 4) {
      if (!form.noPayment && !form.amount) e.amount = "Enter amount or tick No Payment Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep((p) => p + 1); };
  const back = () => { setErrors({}); setStep((p) => p - 1); };

  // ── Submit
  const handleCreate = async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);
    try {
      const dates = generateDates(form);
      const groupId = `RG-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await Promise.all(
        dates.map((date, i) =>
          fetch(`${API}/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
              customer: form.customer,
              service: form.service,
              status: "Confirmed",
              details: {
                address: form.address,
                postcode: form.postcode,
                duration: Number(form.duration),
                frequency: freqLabel(form.frequencyType, form.specificDays),
                specialInstructions: form.notes,
              },
              schedule: { date, timeSlot: form.timeSlot },
              payment: {
                amount: form.noPayment ? 0 : parseFloat(form.amount) || 0,
                currency: "GBP",
                status: form.noPayment ? "No Charge" : "Pending",
              },
              noPaymentRequired: form.noPayment,
              suppressEmail: form.suppressEmail,
              meta: { recurringGroup: groupId, recurringIndex: i, recurringTotal: dates.length },
              createdByAdmin: true,
            }),
          })
        )
      );
      onCreated();
      onClose();
    } catch {
      setErrors((p) => ({ ...p, _submit: "Failed to create. Please try again." }));
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
    });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-slate-300 text-sm">/</span>
        <span className="text-slate-400 text-sm">Recurring Bookings</span>
        <span className="text-slate-300 text-sm">/</span>
        <span className="text-sm font-bold text-slate-700">Create New Series</span>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6" ref={bodyRef}>

        {/* ── Page title ── */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Repeat size={18} className="text-white" />
            </div>
            Create Recurring Series
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 ml-11.5">
            Set up automatic repeat bookings for a customer on any schedule
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      done   ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                      : active ? "bg-primary text-white shadow-md shadow-primary/30"
                               : "bg-slate-100 text-slate-400"
                    }`}>
                      {done ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />}
                    </div>
                    <p className={`text-[10px] font-bold mt-1.5 hidden sm:block ${active ? "text-primary" : done ? "text-emerald-600" : "text-slate-400"}`}>
                      {s.label}
                    </p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 transition-all ${step > s.id ? "bg-emerald-400" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ══════════════════ STEP 1 — CUSTOMER ══════════════════ */}
        {step === 1 && (
          <div className="space-y-4">

            {/* Load from booking ID */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={15} className="text-primary" />
                <p className="text-sm font-black text-primary">Quick Fill — Load from Booking ID</p>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Already have a booking? Enter its ID to auto-fill all customer and service details.
              </p>
              <div className="flex gap-2">
                <input
                  value={form.bookingIdQuery}
                  onChange={(e) => { set("bookingIdQuery", e.target.value); setLoadError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && loadFromBookingId()}
                  placeholder="e.g. BK-4821"
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-white bg-white text-sm font-mono font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
                />
                <button
                  onClick={loadFromBookingId}
                  disabled={loadingBooking || !form.bookingIdQuery.trim()}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm flex items-center gap-2"
                >
                  {loadingBooking ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                  Load
                </button>
              </div>
              {loadError && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><AlertCircle size={11} />{loadError}</p>}
              {form.loadedFrom && (
                <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-xs font-bold text-emerald-700">
                    Details loaded from booking <span className="font-mono">{form.loadedFrom}</span> — review and edit below
                  </p>
                </div>
              )}
            </div>

            {/* Customer details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <User size={14} className="text-slate-500" />
                </div>
                <p className="font-black text-slate-700 text-sm">Customer Details</p>
                <span className="text-[10px] text-slate-400 font-medium ml-auto">Or search below</span>
              </div>

              {/* Name search */}
              <div className="relative">
                <Field label="Search existing customer">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.customerQuery}
                      onChange={(e) => set("customerQuery", e.target.value)}
                      placeholder="Type name to search customers…"
                      className={`${inp} pl-10`}
                    />
                  </div>
                </Field>
                {showCustDrop && customerResults.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                    {customerResults.map((c) => (
                      <button key={c._id} onClick={() => pickCustomer(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary flex-shrink-0">
                          {c.firstName?.[0]}{c.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-slate-400 truncate">{c.email}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 ml-auto flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name *" error={errors.firstName}>
                  <input value={form.customer.firstName} onChange={(e) => setC("firstName", e.target.value)} placeholder="Jane" className={inp} />
                </Field>
                <Field label="Last Name *" error={errors.lastName}>
                  <input value={form.customer.lastName} onChange={(e) => setC("lastName", e.target.value)} placeholder="Smith" className={inp} />
                </Field>
              </div>
              <Field label="Email Address *" error={errors.email}>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.customer.email} onChange={(e) => setC("email", e.target.value)} placeholder="jane@example.com" className={`${inp} pl-10`} />
                </div>
              </Field>
              <Field label="Phone Number">
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" value={form.customer.phone} onChange={(e) => setC("phone", e.target.value)} placeholder="+44 7700 000000" className={`${inp} pl-10`} />
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* ══════════════════ STEP 2 — SERVICE ══════════════════ */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <Building2 size={14} className="text-slate-500" />
              </div>
              <p className="font-black text-slate-700 text-sm">Service & Location</p>
            </div>

            <Field label="Service Type *" error={errors.service}>
              <input value={form.service} onChange={(e) => set("service", e.target.value)}
                placeholder="e.g. Regular Domestic Cleaning" className={inp} />
            </Field>

            <Field label="Property Address *" error={errors.address}>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.address} onChange={(e) => set("address", e.target.value)}
                  placeholder="Full property address" className={`${inp} pl-10`} />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Postcode">
                <input value={form.postcode} onChange={(e) => set("postcode", e.target.value)}
                  placeholder="SW1A 1AA" className={inp} />
              </Field>
              <Field label="Duration (hours)" hint="How long each session takes">
                <input type="number" min="1" max="24" value={form.duration}
                  onChange={(e) => set("duration", e.target.value)} className={inp} />
              </Field>
            </div>

            <Field label="Special Instructions / Notes">
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                rows={3} placeholder="Access codes, parking info, pet notes…"
                className={`${inp} resize-none`} />
            </Field>
          </div>
        )}

        {/* ══════════════════ STEP 3 — SCHEDULE ══════════════════ */}
        {step === 3 && (
          <div className="space-y-4">

            {/* Frequency picker */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Repeat size={14} className="text-slate-500" />
                </div>
                <p className="font-black text-slate-700 text-sm">How often should this repeat?</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FREQ_OPTIONS.map((opt) => {
                  const isActive = form.frequencyType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => set("frequencyType", opt.value)}
                      className={`relative flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-lg mb-1.5 leading-none">{opt.icon}</span>
                      <p className={`text-sm font-black leading-tight ${isActive ? "text-primary" : "text-slate-700"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{opt.sub}</p>
                      {isActive && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Day picker */}
              {form.frequencyType === "specific_days" && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Which days each week? *</p>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS_OF_WEEK.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`w-12 h-12 rounded-xl font-black text-sm border-2 transition-all ${
                          form.specificDays.includes(d)
                            ? "bg-primary border-primary text-white shadow-md shadow-primary/25"
                            : "border-slate-200 text-slate-500 hover:border-primary/30 hover:text-primary"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {errors.specificDays && (
                    <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                      <AlertCircle size={11} />{errors.specificDays}
                    </p>
                  )}
                  {form.specificDays.length > 0 && (
                    <p className="text-xs text-emerald-600 font-bold mt-2">
                      {form.specificDays.join(", ")} — {form.specificDays.length}× per week
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Start date, time, sessions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Calendar size={14} className="text-slate-500" />
                </div>
                <p className="font-black text-slate-700 text-sm">Start Date & Time</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="First Session Date *" error={errors.startDate}>
                  <input type="date" value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className={inp} />
                </Field>
                <Field label="Time" hint="Same time each session">
                  <input type="time" value={form.timeSlot}
                    onChange={(e) => set("timeSlot", e.target.value)}
                    className={inp} />
                </Field>
              </div>

              <Field label="Total Number of Sessions" hint="How many bookings to create in total">
                <div className="flex items-center gap-3">
                  <button onClick={() => set("occurrences", Math.max(1, form.occurrences - 1))}
                    className="w-11 h-11 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-primary/40 hover:text-primary font-black text-xl transition-all flex-shrink-0">
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-black text-slate-900 tabular-nums">{form.occurrences}</span>
                    <p className="text-xs text-slate-400 mt-0.5">sessions</p>
                  </div>
                  <button onClick={() => set("occurrences", Math.min(104, form.occurrences + 1))}
                    className="w-11 h-11 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-primary/40 hover:text-primary font-black text-xl transition-all flex-shrink-0">
                    +
                  </button>
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* ══════════════════ STEP 4 — CONFIRM ══════════════════ */}
        {step === 4 && (
          <div className="space-y-4">

            {/* Email notification toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Mail size={14} className="text-slate-500" />
                </div>
                <p className="font-black text-slate-700 text-sm">Email Notifications</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => set("suppressEmail", true)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    form.suppressEmail ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    form.suppressEmail ? "border-amber-500 bg-amber-500" : "border-slate-300"
                  }`}>
                    {form.suppressEmail && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <BellOff size={14} className={form.suppressEmail ? "text-amber-600" : "text-slate-400"} />
                      <p className={`font-bold text-sm ${form.suppressEmail ? "text-amber-700" : "text-slate-700"}`}>
                        Don't send confirmation email
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Customer will NOT receive any email about this booking</p>
                  </div>
                </button>
                <button
                  onClick={() => set("suppressEmail", false)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    !form.suppressEmail ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    !form.suppressEmail ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  }`}>
                    {!form.suppressEmail && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className={!form.suppressEmail ? "text-emerald-600" : "text-slate-400"} />
                      <p className={`font-bold text-sm ${!form.suppressEmail ? "text-emerald-700" : "text-slate-700"}`}>
                        Send confirmation email
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Customer will receive a booking confirmation for each session</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <CreditCard size={14} className="text-slate-500" />
                </div>
                <p className="font-black text-slate-700 text-sm">Payment</p>
              </div>

              <button
                onClick={() => set("noPayment", !form.noPayment)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  form.noPayment ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  form.noPayment ? "bg-primary border-primary" : "border-slate-300"
                }`}>
                  {form.noPayment && <Check size={13} className="text-white" strokeWidth={3} />}
                </div>
                <div>
                  <p className={`font-bold text-sm ${form.noPayment ? "text-primary" : "text-slate-700"}`}>
                    No Payment Required
                  </p>
                  <p className="text-xs text-slate-400">Staff visits, complimentary cleans, or internal bookings</p>
                </div>
              </button>

              {!form.noPayment && (
                <Field label="Amount per Session (£) *" error={errors.amount}
                  hint={`Total series value: £${(parseFloat(form.amount || 0) * preview.length).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">£</span>
                    <input type="number" min="0" step="0.01" value={form.amount}
                      onChange={(e) => set("amount", e.target.value)}
                      placeholder="0.00" className={`${inp} pl-8`} />
                  </div>
                </Field>
              )}
            </div>

            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Layers size={14} className="text-slate-500" />
                </div>
                <p className="font-black text-slate-700 text-sm">Booking Summary</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Customer", value: `${form.customer.firstName} ${form.customer.lastName}` },
                  { label: "Email",    value: form.customer.email },
                  { label: "Service",  value: form.service },
                  { label: "Address",  value: `${form.address}${form.postcode ? `, ${form.postcode}` : ""}` },
                  { label: "Duration", value: `${form.duration} hour${form.duration !== 1 ? "s" : ""} per session` },
                  { label: "Frequency", value: freqLabel(form.frequencyType, form.specificDays) },
                  { label: "Time",     value: form.timeSlot },
                  { label: "Sessions", value: `${preview.length} bookings` },
                  { label: "Payment",  value: form.noPayment ? "No charge" : `£${parseFloat(form.amount || 0).toFixed(2)} per session` },
                  { label: "Email",    value: form.suppressEmail ? "No email sent to customer" : "Confirmation email will be sent" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-slate-400 font-medium flex-shrink-0 w-24">{label}</span>
                    <span className="font-bold text-slate-800 text-right">{value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sessions preview */}
            {preview.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Hash size={14} className="text-emerald-600" />
                    </div>
                    <p className="font-black text-slate-700 text-sm">All {preview.length} Sessions</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    Ready to create
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {preview.map((d, i) => (
                    <div key={d} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <span className="text-[10px] font-black text-slate-300 tabular-nums w-5 flex-shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{fmtDate(d)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors._submit && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
                <p className="text-sm text-rose-600 font-medium">{errors._submit}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Step navigation ── */}
        <div className="flex items-center justify-between gap-3 pt-2 pb-4">
          <button
            onClick={step === 1 ? onClose : back}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={14} />
            {step === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex items-center gap-1">
            {STEPS.map((s) => (
              <div key={s.id} className={`h-2 rounded-full transition-all ${
                step === s.id ? "w-6 bg-primary" : step > s.id ? "w-2 bg-emerald-400" : "w-2 bg-slate-200"
              }`} />
            ))}
          </div>

          {step < 4 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={submitting || preview.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-md shadow-emerald-200"
            >
              {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {submitting ? "Creating…" : `Create ${preview.length} Booking${preview.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
//  LIST PAGE
// ══════════════════════════════════════════════════════════════════════════
const Recurring = () => {
  const [view, setView] = useState("list"); // "list" | "create"
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openGroup, setOpenGroup] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    fetch(`${API}/bookings`)
      .then((r) => r.json())
      .then((d) => setBookings(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const series = useMemo(() => {
    const groups = {};
    bookings
      .filter(isRealBooking)
      .filter((b) => b.meta?.recurringGroup)
      .forEach((b) => {
        const key = b.meta.recurringGroup;
        if (!groups[key]) groups[key] = [];
        groups[key].push(b);
      });

    let list = Object.entries(groups).map(([groupId, items]) => {
      const sorted = [...items].sort((a, b) => new Date(a.schedule?.date) - new Date(b.schedule?.date));
      const now = new Date();
      const upcoming = sorted.filter((b) => new Date(b.schedule?.date) >= now && b.status !== "Cancelled");
      const totalRevenue = sorted.reduce((s, b) => s + Number(b.payment?.amount || 0), 0);
      return { groupId, first: sorted[0], frequency: sorted[0]?.details?.frequency || "Recurring",
        count: sorted.length, upcomingCount: upcoming.length,
        nextDate: upcoming[0]?.schedule?.date || null, totalRevenue, bookings: sorted,
        noPayment: sorted[0]?.noPaymentRequired };
    });

    if (search) {
      const s = search.toLowerCase();
      list = list.filter((g) =>
        g.first?.customer?.firstName?.toLowerCase().includes(s) ||
        g.first?.customer?.lastName?.toLowerCase().includes(s) ||
        g.first?.service?.toLowerCase().includes(s) ||
        g.groupId?.toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => new Date(a.nextDate || 0) - new Date(b.nextDate || 0));
  }, [bookings, search]);

  const cancelRemaining = async (group) => {
    const now = new Date();
    const future = group.bookings.filter((b) => new Date(b.schedule?.date) >= now && b.status !== "Cancelled");
    if (future.length === 0) return;
    if (!window.confirm(`Cancel the remaining ${future.length} upcoming booking(s) in this series?`)) return;
    setCancelling(group.groupId);
    try {
      await Promise.all(future.map((b) =>
        fetch(`${API}/bookings/${b._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Cancelled" }),
        })
      ));
      fetchBookings();
    } finally { setCancelling(null); }
  };

  if (view === "create") {
    return <CreatePage onClose={() => setView("list")} onCreated={() => { fetchBookings(); setView("list"); }} />;
  }

  return (
    <div className="space-y-6 pb-24">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Repeat size={18} className="text-primary" />
            </div>
            Recurring Bookings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage recurring series — daily, weekly, custom schedules &amp; more
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={fetchBookings}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-300 transition-all font-semibold text-sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setView("create")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all font-bold text-sm shadow-md shadow-primary/20">
            <Plus size={16} /> Create Series
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer or service…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-all" />
      </div>

      {/* Stats */}
      {!loading && series.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Series",    value: series.length },
            { label: "Upcoming Sessions", value: series.reduce((s, g) => s + g.upcomingCount, 0) },
            { label: "Total Revenue",    value: `£${series.reduce((s, g) => s + g.totalRevenue, 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}` },
            { label: "No-Pay Series",    value: series.filter((g) => g.noPayment).length },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Series list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-14 text-center text-sm text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw size={22} className="animate-spin text-primary/40" />
            Loading recurring series…
          </div>
        ) : series.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Repeat size={24} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-600 mb-1">No recurring series yet</p>
            <p className="text-sm text-slate-400 mb-5">Create a repeating schedule for a customer</p>
            <button onClick={() => setView("create")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
              <Plus size={15} /> Create First Series
            </button>
          </div>
        ) : (
          series.map((group) => {
            const isOpen = openGroup === group.groupId;
            return (
              <div key={group.groupId}>
                <button
                  onClick={() => setOpenGroup(isOpen ? null : group.groupId)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-primary">
                        {group.first?.customer?.firstName?.[0]}{group.first?.customer?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm">
                        {group.first?.customer?.firstName} {group.first?.customer?.lastName}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{group.first?.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {group.frequency}
                    </span>
                    {group.noPayment && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                        No pay
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
                      <Calendar size={10} />
                      {group.nextDate
                        ? new Date(group.nextDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                        : "No upcoming"}
                    </span>
                    {!group.noPayment && (
                      <span className="text-sm font-black text-slate-700 tabular-nums">
                        £{group.totalRevenue.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 font-semibold">
                        {group.count} total · {group.upcomingCount} upcoming
                      </p>
                      <button
                        disabled={cancelling === group.groupId || group.upcomingCount === 0}
                        onClick={() => cancelRemaining(group)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Ban size={11} />
                        {group.upcomingCount === 0
                          ? "None upcoming"
                          : `Cancel ${group.upcomingCount} upcoming`}
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                      {group.bookings.map((b, i) => (
                        <div key={b._id} className="flex items-center gap-2 px-4 py-2.5 text-xs">
                          <span className="text-[10px] font-black text-slate-300 tabular-nums w-5 flex-shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono font-bold text-slate-400 flex-shrink-0 text-[11px]">{b.bookingId}</span>
                          <span className="text-slate-600 flex items-center gap-1 flex-1 min-w-0 truncate">
                            <Calendar size={9} className="flex-shrink-0" />
                            {b.schedule?.date
                              ? new Date(b.schedule.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </span>
                          <span className="text-slate-400 flex items-center gap-1 flex-shrink-0">
                            <Clock size={9} /> {b.schedule?.timeSlot || "—"}
                          </span>
                          {!group.noPayment && (
                            <span className="font-bold text-slate-600 flex-shrink-0 tabular-nums">£{b.payment?.amount || 0}</span>
                          )}
                          <span className={`font-bold px-2 py-0.5 rounded-full flex-shrink-0 text-[10px] ${
                            b.status === "Cancelled"   ? "bg-rose-100 text-rose-600"
                            : b.status === "Completed" ? "bg-emerald-100 text-emerald-700"
                            : b.status === "In Progress" ? "bg-purple-100 text-purple-700"
                            : "bg-slate-200 text-slate-600"
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Recurring;
