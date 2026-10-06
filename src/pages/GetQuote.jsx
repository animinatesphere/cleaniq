import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound, Brush, HardHat, Briefcase, BedDouble, Repeat, Flame, Layers, SprayCan,
  House, Building, Building2, DoorOpen, Warehouse, Bath, Sofa, Refrigerator, Footprints,
  CalendarDays, User, Mail, Phone, MapPin, ShieldCheck, BadgeCheck, Clock, Star,
  Minus, Plus, Check, Send, Loader2, AlertCircle, CheckCircle2, Lock, MessageCircle, ArrowRight,
  ArrowLeft, CookingPot, WashingMachine, Sun, DoorClosed, PawPrint, SprayCan as Supplies, Zap,
} from "lucide-react";
import { PHONE_NUMBER, whatsappLink } from "../utils/contact";
import { getCreatorRef } from "../utils/creatorRef";

const API = import.meta.env.VITE_API_URL;

// Keep these in step with QUOTE_OPTIONS in server/routes/contact.js.
const CARPET_WITH = "With Carpet Cleaning (Save 60%)";
const CARPET_WITHOUT = "Without Carpet Cleaning";
const OVEN_TYPES = ["Single oven", "Double oven", "Range oven"];
const FRIDGE_TYPES = ["Single fridge", "Fridge freezer", "American fridge freezer"];
const HOUR_CHOICES = [2, 3, 4, 5, 6, 7, 8, 10];
const PROPERTY_TYPES = [
  { name: "Studio", icon: DoorOpen },
  { name: "Flat", icon: Building2 },
  { name: "House", icon: House },
  { name: "Townhouse", icon: Building },
  { name: "Bungalow", icon: Warehouse },
];
const FALLBACK_SERVICES = [
  "End of Tenancy Cleaning", "Deep Cleaning", "Regular House Cleaning", "Airbnb Cleaning",
  "Post Construction Cleaning", "Office Cleaning", "Carpet cleaning", "Oven cleaning", "General Cleaning",
];
// Most-asked-for first; anything else from the price list follows alphabetically.
const SERVICE_ORDER = ["end of tenancy", "deep", "regular", "airbnb", "construction", "office", "carpet", "oven", "general"];

const serviceIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes("tenancy")) return KeyRound;
  if (n.includes("deep")) return Brush;
  if (n.includes("construction") || n.includes("builder")) return HardHat;
  if (n.includes("office") || n.includes("commercial")) return Briefcase;
  if (n.includes("airbnb")) return BedDouble;
  if (n.includes("regular")) return Repeat;
  if (n.includes("oven")) return Flame;
  if (n.includes("carpet")) return Layers;
  return SprayCan;
};

// Arrival times, like the admin booking form: 8am–8pm on the hour and half hour.
const ARRIVAL_TIMES = Array.from({ length: 25 }, (_, i) => {
  const mins = 8 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${mins % 60 ? "30" : "00"}`;
});
const ampm = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
};

// The same four steps as Admin → New booking.
const STEPS = [
  { n: 1, label: "Location", icon: MapPin },
  { n: 2, label: "Property", icon: House },
  { n: 3, label: "Add-ons", icon: Zap },
  { n: 4, label: "Schedule", icon: CalendarDays },
];

const EMPTY = {
  service: "", name: "", email: "", phone: "", postcode: "", address: "", hours: "", carpets: null,
  supplies: "", time: "", hasPet: "",
  bedrooms: null, bathrooms: null, livingRooms: null, stairs: null, property: "",
  kitchens: null, utilityRooms: null, conservatories: null, cloakrooms: null,
  date: "", notes: "", carpet: "",
  extras: { oven: false, ovenType: "", fridge: false, fridgeType: "" },
  consent: false, website: "", ref: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const inputBase =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pr-4 text-base sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10";
const fieldLabel = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500";

// ── Small building blocks (outside the page so inputs keep focus while typing) ──

function Section({ n, title, hint, children }) {
  return (
    <section className="border-t border-slate-100 px-5 py-7 first:border-t-0 sm:px-8 sm:py-8">
      <div className="mb-5 flex items-start gap-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-white shadow-lg shadow-primary/25">
          {n}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-black leading-tight tracking-tight text-slate-900 sm:text-xl">{title}</h2>
          {hint && <p className="mt-1 text-sm font-medium text-slate-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Choice({ selected, onClick, children, className = "", tick = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative rounded-2xl border-2 text-left transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
        selected
          ? "border-primary bg-primary/[0.06] shadow-lg shadow-primary/10"
          : "border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50"
      } ${className}`}
    >
      {selected && tick && (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
          <Check size={12} strokeWidth={3.5} />
        </span>
      )}
      {children}
    </button>
  );
}

function Stepper({ label, icon: Icon, value, max, onChange }) {
  const v = value ?? null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-col sm:items-stretch sm:p-4">
      <div className="flex min-w-0 items-center gap-2.5 sm:justify-center">
        <Icon size={18} className="shrink-0 text-primary" />
        <span className="truncate text-sm font-bold text-slate-700">{label}</span>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-1 sm:mt-3">
        <button
          type="button"
          onClick={() => onChange(v === null || v <= 0 ? null : v - 1)}
          disabled={v === null}
          aria-label={`Fewer ${label.toLowerCase()}`}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
        >
          <Minus size={16} strokeWidth={3} />
        </button>
        <span className="w-10 text-center text-lg font-black tabular-nums text-slate-900" aria-live="polite">
          {v === null ? "–" : v}
        </span>
        <button
          type="button"
          onClick={() => onChange(v === null ? 1 : Math.min(max, v + 1))}
          disabled={v !== null && v >= max}
          aria-label={`More ${label.toLowerCase()}`}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark disabled:opacity-40"
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

function IconInput({ icon: Icon, label, ...props }) {
  return (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      <span className="relative block">
        <Icon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input {...props} className={`${inputBase} pl-11 ${props.className || ""}`} />
      </span>
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-white/45">{label}</span>
      <span className={`text-right text-sm font-bold ${value ? "text-white" : "text-white/30"}`}>{value || "—"}</span>
    </div>
  );
}

// ── Page ──

const GetQuote = () => {
  const [form, setForm] = useState(() => ({ ...EMPTY, ref: getCreatorRef() }));
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [instantQuote, setInstantQuote] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/services?region=UK`)
      .then((r) => r.json())
      .then((data) => {
        // Only main services — not the room/extra lines from the price list.
        const names = [...new Set((Array.isArray(data) ? data : []).filter((s) => s.category === "Base").map((s) => s.name))];
        const rank = (n) => {
          const i = SERVICE_ORDER.findIndex((k) => n.toLowerCase().includes(k));
          return i === -1 ? SERVICE_ORDER.length : i;
        };
        if (names.length) setServices(names.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)));
      })
      .catch(() => {});
  }, []);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setExtra = (patch) => setForm((f) => ({ ...f, extras: { ...f.extras, ...patch } }));
  const onChange = (e) => set(e.target.name, e.target.value);
  // Bookings start from tomorrow (same as the accept page).
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();

  const fail = (msg) => {
    setErrorMsg(msg);
    setStatus("error");
    return false;
  };

  // What each step needs before moving on.
  const checkStep = (n) => {
    if (n === 1) {
      if (!form.service) return fail("Please choose a service.");
      if (!form.hours) return fail("Please choose how many hours you'd like.");
      if (form.address.trim().length < 5) return fail("Please enter the full address of the property.");
      if (!POSTCODE_RE.test(form.postcode.trim())) return fail("Please enter a valid UK postcode, e.g. M1 1AA.");
      if (!form.supplies) return fail("Please choose who provides the cleaning supplies.");
    }
    if (n === 3) {
      if (form.carpet === CARPET_WITH && !(form.carpets > 0)) return fail("Please tell us how many carpets to clean.");
      if (form.extras.oven && !form.extras.ovenType) return fail("Please confirm the type of oven.");
      if (form.extras.fridge && !form.extras.fridgeType) return fail("Please confirm the type of fridge.");
    }
    if (n === 4) {
      if (form.name.trim().length < 2) return fail("Please enter your full name.");
      if (!EMAIL_RE.test(form.email.trim())) return fail("Please enter a valid email address.");
      if (!form.consent) return fail("Please tick the box so we can store your details and reply.");
    }
    setErrorMsg("");
    if (status === "error") setStatus("idle");
    return true;
  };

  const goTo = (n) => {
    setStep(n);
    requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const next = () => { if (checkStep(step)) goTo(step + 1); };
  const back = () => { setErrorMsg(""); setStatus("idle"); goTo(step - 1); };
  // Chips: go back freely; forward only through steps that are complete.
  const jump = (n) => {
    if (n < step) { setErrorMsg(""); setStatus("idle"); return goTo(n); }
    for (let i = step; i < n; i++) if (!checkStep(i)) return;
    goTo(n);
  };

  const done = [
    !!form.service, !!form.hours, form.address.trim().length >= 5, POSTCODE_RE.test(form.postcode.trim()), !!form.supplies,
    form.name.trim().length > 1, EMAIL_RE.test(form.email.trim()), form.consent,
  ];
  const progress = Math.round((done.filter(Boolean).length / done.length) * 100);

  const extrasText = useMemo(() => {
    const e = form.extras;
    return [
      form.carpet === CARPET_WITH && form.carpets && `${form.carpets} carpet${form.carpets === 1 ? "" : "s"}`,
      e.oven && `Oven${e.ovenType ? ` (${e.ovenType.toLowerCase()})` : ""}`,
      e.fridge && `Fridge${e.fridgeType ? ` (${e.fridgeType.toLowerCase()})` : ""}`,
    ].filter(Boolean).join(", ");
  }, [form.extras, form.carpet, form.carpets]);

  const rooms = [
    form.bedrooms !== null && `${form.bedrooms} bed`,
    form.bathrooms !== null && `${form.bathrooms} bath`,
    form.kitchens !== null && `${form.kitchens} kitchen`,
    form.livingRooms !== null && `${form.livingRooms} living`,
    form.stairs !== null && `${form.stairs} stairs`,
  ].filter(Boolean).join(" · ");

  const prettyDate = form.date
    ? new Date(`${form.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 4) return next();
    for (const n of [1, 3, 4]) if (!checkStep(n)) { if (n !== 4) goTo(n); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`${API}/contact/quote-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setInstantQuote(Boolean(data.instantQuote));
        setSentTo(form.email.trim());
        setStatus("success");
        setForm({ ...EMPTY, ref: getCreatorRef() });
        setStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const data = await res.json().catch(() => ({}));
        fail(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      fail("Network error. Please check your connection and try again.");
    }
  };

  const extraCard = (key, title, Icon, typeKey, types, typeLabel) => {
    const on = form.extras[key];
    return (
      <div
        className={`rounded-2xl border-2 transition-all ${on ? "border-primary bg-primary/[0.06] shadow-lg shadow-primary/10" : "border-slate-200 bg-white hover:border-primary/40"}`}
      >
        <button
          type="button"
          aria-pressed={on}
          onClick={() => setExtra(on ? { [key]: false, ...(typeKey ? { [typeKey]: "" } : {}) } : { [key]: true })}
          className="flex w-full items-center gap-3 p-4 text-left focus:outline-none"
        >
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${on ? "bg-primary text-white" : "bg-slate-100 text-primary"}`}>
            <Icon size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-slate-900">{title}</span>
            <span className="block text-xs font-bold text-emerald-600">20% off with your clean</span>
          </span>
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${on ? "border-primary bg-primary text-white" : "border-slate-300"}`}>
            {on && <Check size={14} strokeWidth={3.5} />}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {typeKey && on && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-4 pb-4">
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-500">{typeLabel} *</p>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setExtra({ [typeKey]: t })}
                      className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                        form.extras[typeKey] === t ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-primary/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const errorBox = (
    <AnimatePresence>
      {status === "error" && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          role="alert" className="mx-5 mb-2 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 sm:mx-8">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-500" />
          <p className="text-sm font-bold text-rose-700">{errorMsg}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#F3F6F4]">
      <Helmet>
        <title>Get a Free Cleaning Quote | Cleaniq Services Manchester</title>
        <meta
          name="description"
          content="Get a free, no-obligation cleaning quote from Cleaniq Services in Manchester. End of tenancy, deep, Airbnb, office, carpet and oven cleaning — your quote is emailed straight away."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/get-a-quote" />
        <meta property="og:title" content="Get a Free Cleaning Quote | Cleaniq Services Manchester" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#04140F] via-[#073B2A] to-[#036847] pb-28 pt-40 sm:pb-32 sm:pt-36 md:pb-40 md:pt-44">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Free · No obligation
            </span>
            <h1 className="mt-5 text-[2rem] font-black leading-[1.05] tracking-tighter text-white sm:text-5xl md:text-6xl">
              Get your free <span className="text-emerald-300">cleaning quote</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-white/70 md:text-lg">
              Four quick steps. Your quote lands in your inbox straight away — accept it, pick a time, and you're booked.
            </p>
          </motion.div>
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3"
          >
            {[
              [ShieldCheck, "Fully insured"],
              [BadgeCheck, "Vetted cleaners"],
              [Clock, "Instant quote"],
              [Star, "5-star rated"],
            ].map(([Icon, text]) => (
              <li key={text} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3 text-xs font-bold text-white/85 backdrop-blur sm:text-sm">
                <Icon size={16} className="shrink-0 text-emerald-300" /> {text}
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 pb-16 sm:px-6 md:-mt-28 md:pb-24">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-2xl rounded-[28px] bg-white p-6 text-center shadow-2xl shadow-slate-900/10 sm:p-12"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={34} />
              </span>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {instantQuote ? "Your quote is in your inbox!" : "Thank you — request received!"}
              </h2>
              <p className="mt-3 text-base font-medium text-slate-500">
                {instantQuote ? "We've emailed your quote to " : "We've sent a confirmation to "}
                <span className="font-bold text-slate-700 break-all">{sentTo}</span>.
              </p>
              <ol className="mx-auto mt-8 max-w-md space-y-3 text-left">
                {(instantQuote
                  ? [
                      "Open the email and check your quote.",
                      "Click “Accept This Quote” and choose the date and time for your cleaner.",
                      "We email you a secure payment link — your clean is confirmed once it's paid.",
                    ]
                  : [
                      "Our team reviews your property details.",
                      "We email your personalised quote — usually within a few hours.",
                      "Happy with it? Accept it and pick your date and time.",
                    ]
                ).map((t, i) => (
                  <li key={t} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-black text-white">{i + 1}</span>
                    <span className="text-sm font-semibold text-slate-700">{t}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/" className="btn-primary px-8 py-4">Back to home</Link>
                <button type="button" onClick={() => setStatus("idle")} className="btn-outline px-8 py-4">Request another quote</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <form ref={cardRef} onSubmit={handleSubmit} noValidate className="scroll-mt-28 overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/10">
                {/* Step chips */}
                <div className="border-b border-slate-100 px-4 py-4 sm:px-8">
                  <p className="mb-3 text-center text-[11px] font-black uppercase tracking-widest text-slate-400 sm:text-left">
                    Step {step} of {STEPS.length} — {STEPS[step - 1].label}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {STEPS.map(({ n, label, icon: Icon }) => (
                      <button key={n} type="button" onClick={() => jump(n)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[11px] font-black transition sm:flex-row sm:gap-2 sm:text-xs ${
                          step === n ? "bg-primary text-white shadow-lg shadow-primary/25"
                            : step > n ? "bg-primary/10 text-primary"
                            : "bg-slate-50 text-slate-400"
                        }`}>
                        {step > n ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                    {step === 1 && (
                      <>
                        <Section n={1} title="What do you need?" hint="Choose the service you'd like a quote for.">
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                            {services.map((name) => {
                              const Icon = serviceIcon(name);
                              const on = form.service === name;
                              return (
                                <Choice key={name} selected={on} onClick={() => set("service", name)} className="flex min-h-[104px] flex-col justify-between p-3.5 sm:p-4">
                                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${on ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                                    <Icon size={20} />
                                  </span>
                                  <span className="mt-3 pr-5 text-[13px] font-black leading-snug text-slate-900 sm:text-sm">{name}</span>
                                </Choice>
                              );
                            })}
                          </div>
                        </Section>
                        <Section n={2} title="How many hours?" hint="How long you'd like your cleaner for. Prices are per hour.">
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                            {HOUR_CHOICES.map((h) => (
                              <Choice key={h} tick={false} selected={Number(form.hours) === h} onClick={() => set("hours", h)}
                                className="flex h-14 items-center justify-center">
                                <span className="text-base font-black text-slate-900">{h}h</span>
                              </Choice>
                            ))}
                          </div>
                        </Section>
                        <Section n={3} title="Where is the property?">
                          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                            <IconInput icon={House} label="Full address *" name="address" value={form.address} onChange={onChange} placeholder="House number, street, town" autoComplete="street-address" />
                            <IconInput icon={MapPin} label="Post code *" name="postcode" value={form.postcode} onChange={onChange} placeholder="M1 1AA" autoComplete="postal-code" className="uppercase" />
                          </div>
                          <p className={`${fieldLabel} mt-5`}>Cleaning supplies & equipment *</p>
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            {[["Cleaniq", "Cleaniq brings everything"], ["Customer", "I'll provide supplies"]].map(([v, text]) => (
                              <Choice key={v} selected={form.supplies === v} onClick={() => set("supplies", v)} className="flex items-center gap-3 p-4">
                                <Supplies size={20} className={form.supplies === v ? "text-primary" : "text-slate-400"} />
                                <span className="text-sm font-black text-slate-900">{text}</span>
                              </Choice>
                            ))}
                          </div>
                        </Section>
                      </>
                    )}

                    {step === 2 && (
                      <Section n={2} title="About your property" hint="Count the rooms — leave at – if there are none.">
                        <p className={fieldLabel}>Property type</p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
                          {PROPERTY_TYPES.map(({ name, icon: Icon }) => (
                            <Choice key={name} selected={form.property === name} onClick={() => set("property", form.property === name ? "" : name)}
                              className="flex flex-col items-center gap-2 px-2 py-4">
                              <Icon size={22} className={form.property === name ? "text-primary" : "text-slate-500"} />
                              <span className="text-xs font-black text-slate-800 sm:text-[13px]">{name}</span>
                            </Choice>
                          ))}
                        </div>
                        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                          <Stepper label="Bedrooms" icon={BedDouble} value={form.bedrooms} max={8} onChange={(v) => set("bedrooms", v)} />
                          <Stepper label="Bathrooms" icon={Bath} value={form.bathrooms} max={8} onChange={(v) => set("bathrooms", v)} />
                          <Stepper label="Kitchens" icon={CookingPot} value={form.kitchens} max={4} onChange={(v) => set("kitchens", v)} />
                          <Stepper label="Living / reception" icon={Sofa} value={form.livingRooms} max={6} onChange={(v) => set("livingRooms", v)} />
                          <Stepper label="Utility rooms" icon={WashingMachine} value={form.utilityRooms} max={4} onChange={(v) => set("utilityRooms", v)} />
                          <Stepper label="Conservatories" icon={Sun} value={form.conservatories} max={4} onChange={(v) => set("conservatories", v)} />
                          <Stepper label="Cloakrooms" icon={DoorClosed} value={form.cloakrooms} max={4} onChange={(v) => set("cloakrooms", v)} />
                          <Stepper label="Stairs / landings" icon={Footprints} value={form.stairs} max={6} onChange={(v) => set("stairs", v)} />
                        </div>
                        <p className={`${fieldLabel} mt-5`}>Pets at the property?</p>
                        <div className="grid grid-cols-2 gap-2.5 sm:max-w-sm">
                          {["No", "Yes"].map((v) => (
                            <Choice key={v} tick={false} selected={form.hasPet === v} onClick={() => set("hasPet", v)} className="flex items-center justify-center gap-2 py-3.5">
                              {v === "Yes" && <PawPrint size={16} className="text-primary" />}
                              <span className="text-sm font-black text-slate-900">{v}</span>
                            </Choice>
                          ))}
                        </div>
                      </Section>
                    )}

                    {step === 3 && (
                      <>
                        <Section n={1} title="Carpet cleaning" hint="Add it to your clean and save 60%.">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Choice selected={form.carpet === CARPET_WITH} onClick={() => set("carpet", form.carpet === CARPET_WITH ? "" : CARPET_WITH)} className="p-4 sm:p-5">
                              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">Save 60%</span>
                              <span className="mt-3 block text-base font-black text-slate-900">With carpet cleaning</span>
                            </Choice>
                            <Choice selected={form.carpet === CARPET_WITHOUT} onClick={() => set("carpet", form.carpet === CARPET_WITHOUT ? "" : CARPET_WITHOUT)} className="flex items-end p-4 sm:p-5">
                              <span className="text-base font-black text-slate-900">Without carpet cleaning</span>
                            </Choice>
                          </div>
                          {form.carpet === CARPET_WITH && (
                            <div className="mt-3 sm:max-w-sm">
                              <Stepper label="How many carpets?" icon={Layers} value={form.carpets} max={20} onChange={(v) => set("carpets", v)} />
                            </div>
                          )}
                        </Section>
                        <Section n={2} title="Save 20% on additional services" hint="Optional — tick anything you'd like included.">
                          <div className="grid gap-3">
                            {extraCard("oven", "Oven Cleaning", Flame, "ovenType", OVEN_TYPES, "Type of oven")}
                            {extraCard("fridge", "Fridge Cleaning", Refrigerator, "fridgeType", FRIDGE_TYPES, "Type of fridge")}
                          </div>
                        </Section>
                      </>
                    )}

                    {step === 4 && (
                      <>
                        <Section n={1} title="When would you like us?" hint="You'll confirm the exact date and time when you accept your quote.">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className={fieldLabel}>Preferred date</span>
                              <span className="relative block">
                                <CalendarDays size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="date" name="date" min={tomorrow} value={form.date} onChange={onChange}
                                  className={`${inputBase} min-h-[52px] appearance-none pl-11`} />
                              </span>
                            </label>
                            <label className="block">
                              <span className={fieldLabel}>Preferred arrival time</span>
                              <span className="relative block">
                                <Clock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select name="time" value={form.time} onChange={onChange} className={`${inputBase} min-h-[52px] appearance-none pl-11`}>
                                  <option value="">Any time</option>
                                  {ARRIVAL_TIMES.map((t) => <option key={t} value={t}>{ampm(t)}</option>)}
                                </select>
                              </span>
                            </label>
                          </div>
                        </Section>
                        <Section n={2} title="Where should we send your quote?">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <IconInput icon={User} label="Full name *" name="name" value={form.name} onChange={onChange} placeholder="John Smith" autoComplete="name" />
                            <IconInput icon={Mail} label="Email address *" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" autoComplete="email" inputMode="email" />
                            <IconInput icon={Phone} label="Phone number" type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="07700 900000" autoComplete="tel" inputMode="tel" />
                          </div>
                          <div className="mt-4 sm:max-w-xs">
                            <IconInput icon={BadgeCheck} label="Referral code" name="ref" value={form.ref}
                              onChange={(e) => set("ref", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="Optional" className="uppercase" />
                          </div>
                          <label className="mt-4 block">
                            <span className={fieldLabel}>Notes (optional)</span>
                            <textarea name="notes" rows={3} value={form.notes} onChange={onChange} maxLength={2000}
                              placeholder="Access instructions, parking, special requirements…"
                              className={`${inputBase} resize-none px-4`} />
                          </label>

                          {/* Hidden from people; only bots fill it in. */}
                          <input type="text" name="website" value={form.website} onChange={onChange} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

                          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4">
                            <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)}
                              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary" />
                            <span className="text-sm font-medium leading-relaxed text-slate-600">
                              I consent to having this website store my submitted information so they can respond to my enquiry.
                            </span>
                          </label>
                        </Section>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {errorBox}

                {/* Back / Next */}
                <div className="flex gap-3 border-t border-slate-100 px-5 py-5 sm:px-8">
                  {step > 1 && (
                    <button type="button" onClick={back}
                      className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 px-5 py-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 sm:px-7">
                      <ArrowLeft size={17} /> Back
                    </button>
                  )}
                  {step < STEPS.length ? (
                    <button type="button" onClick={next}
                      className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/25 transition hover:bg-primary-dark active:scale-[0.99]">
                      Next: {STEPS[step].label} <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  ) : (
                    <button type="submit" disabled={status === "loading"}
                      className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/25 transition hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70">
                      {status === "loading"
                        ? <><Loader2 size={18} className="animate-spin" /> Sending…</>
                        : <><Send size={18} /> Get my quote</>}
                    </button>
                  )}
                </div>
                {step === STEPS.length && (
                  <p className="-mt-2 flex items-center justify-center gap-1.5 px-5 pb-5 text-xs font-semibold text-slate-400">
                    <Lock size={12} /> Your details are only used for your quote and booking.
                  </p>
                )}
              </form>

              {/* Summary (desktop) */}
              <aside className="hidden space-y-4 lg:sticky lg:top-28 lg:block">
                <div className="rounded-[28px] bg-gradient-to-b from-[#0B2D22] to-[#061A13] p-6 text-white shadow-2xl shadow-slate-900/20">
                  <p className="text-[11px] font-black uppercase tracking-widest text-emerald-300">Your request</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight">{form.service || "Choose a service"}</h3>
                  <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
                    <SummaryRow label="Hours" value={form.hours ? `${form.hours} hours` : ""} />
                    <SummaryRow label="Postcode" value={form.postcode.toUpperCase()} />
                    <SummaryRow label="Supplies" value={form.supplies === "Cleaniq" ? "Cleaniq brings" : form.supplies === "Customer" ? "Your own" : ""} />
                    <SummaryRow label="Property" value={[form.property, rooms].filter(Boolean).join(" · ")} />
                    <SummaryRow label="Add-ons" value={extrasText} />
                    <SummaryRow label="When" value={[prettyDate, form.time && ampm(form.time)].filter(Boolean).join(", ")} />
                  </div>
                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-xs font-bold text-white/60">
                      <span>Ready to send</span><span>{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-900/5">
                  <p className="text-sm font-black text-slate-900">Prefer to talk?</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">Our team is happy to help.</p>
                  <div className="mt-4 space-y-2">
                    <a href={`tel:${PHONE_NUMBER.replace(/\s/g, "")}`}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700 transition hover:bg-primary/5 hover:text-primary">
                      <Phone size={17} className="text-primary" /> {PHONE_NUMBER}
                    </a>
                    <a href={whatsappLink("Hi Cleaniq! I'd like a cleaning quote.")} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700 transition hover:bg-primary/5 hover:text-primary">
                      <MessageCircle size={17} className="text-primary" /> Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help (phones and tablets) */}
        {status !== "success" && (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:hidden">
            <a href={`tel:${PHONE_NUMBER.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-lg shadow-slate-900/5">
              <Phone size={17} className="text-primary" /> Call us
            </a>
            <a href={whatsappLink("Hi Cleaniq! I'd like a cleaning quote.")} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-lg shadow-slate-900/5">
              <MessageCircle size={17} className="text-primary" /> WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default GetQuote;
