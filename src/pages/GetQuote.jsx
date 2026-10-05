import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

// Keep these in step with QUOTE_OPTIONS in server/routes/contact.js.
const PROPERTY_TYPES = ["Studio", "Flat", "House", "Townhouse", "Bungalow"];
const CARPET_WITH = "With Carpet Cleaning (Save 60%) — £75";
const CARPET_WITHOUT = "Without Carpet Cleaning";
const OVEN_TYPES = ["Single oven", "Double oven", "Range cooker", "AGA"];
const FRIDGE_TYPES = ["Standard fridge", "Fridge freezer", "American-style fridge freezer", "Under-counter fridge"];

const EMPTY = {
  service: "", name: "", email: "", phone: "", postcode: "",
  bedrooms: "", bathrooms: "", livingRooms: "", property: "",
  date: "", notes: "", carpet: "",
  extras: { oven: false, ovenType: "", fridge: false, fridgeType: "", clearance: false },
  consent: false, website: "",
};

const field = "w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-primary text-slate-700 text-sm transition-colors";
const label = "text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest";
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

const GetQuote = () => {
  const [form, setForm] = useState(EMPTY);
  const [serviceNames, setServiceNames] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/services?region=UK`)
      .then((r) => r.json())
      .then((data) => setServiceNames([...new Set((Array.isArray(data) ? data : []).map((s) => s.name))].sort()))
      .catch(() => {});
  }, []);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setExtra = (name, value) => setForm((f) => ({ ...f, extras: { ...f.extras, [name]: value } }));
  const onChange = (e) => set(e.target.name, e.target.value);

  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.extras.oven && !form.extras.ovenType) { setErrorMsg("Please confirm the type of oven."); setStatus("error"); return; }
    if (form.extras.fridge && !form.extras.fridgeType) { setErrorMsg("Please confirm the type of fridge."); setStatus("error"); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`${API}/contact/quote-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm(EMPTY);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  const Extra = ({ name, title, typeName, types, typeLabel }) => (
    <div className={`rounded-2xl border p-4 transition-colors ${form.extras[name] ? "border-primary/40 bg-primary/5" : "border-slate-100 bg-slate-50"}`}>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.extras[name]}
          onChange={(e) => { setExtra(name, e.target.checked); if (!e.target.checked && typeName) setExtra(typeName, ""); }}
          className="w-5 h-5 accent-primary"
        />
        <span className="font-black text-slate-700 text-sm">{title}</span>
      </label>
      {typeName && form.extras[name] && (
        <div className="mt-3 space-y-1">
          <span className={label}>{typeLabel} *</span>
          <select value={form.extras[typeName]} onChange={(e) => setExtra(typeName, e.target.value)} className={`${field} bg-white`} required>
            <option value="">Select…</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="pt-24 md:pt-32 pb-16 md:pb-24 bg-[#F8FAFC] min-h-screen">
      <Helmet>
        <title>Get a Quote | Cleaniq Services Manchester</title>
        <meta
          name="description"
          content="Get a free cleaning quote from Cleaniq Services in Manchester. End of tenancy, deep cleaning, carpet cleaning and more — tell us about your property and we'll come back to you quickly."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/get-a-quote" />
        <meta property="og:title" content="Get a Quote | Cleaniq Services Manchester" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <FileText size={14} /> Free Quote
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-dark tracking-tighter mb-4">Get a Quote</h1>
          <p className="text-slate-500 font-bold text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Get started by selecting your requirements. We'll send your quote within a few hours.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-5 sm:p-8 md:p-10"
        >
          <AnimatePresence>
            {status === "success" && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4 mb-6">
                <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-emerald-700 text-sm">Quote request sent!</p>
                  <p className="text-emerald-600 text-xs font-bold mt-1">Thank you — our team will send your quote shortly. Check your inbox for a confirmation.</p>
                </div>
              </motion.div>
            )}
            {status === "error" && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start gap-4 mb-6">
                <AlertCircle size={24} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-rose-700 text-sm">Couldn't send your request</p>
                  <p className="text-rose-600 text-xs font-bold mt-1">{errorMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <span className={label}>Service *</span>
              <select name="service" value={form.service} onChange={onChange} className={field} required>
                <option value="">— Select a Service —</option>
                {serviceNames.map((n) => <option key={n} value={n}>{n}</option>)}
                <option value="Other Cleaning Services">Other Cleaning Services</option>
              </select>
            </div>

            {form.service && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className={label}>Full Name *</span>
                    <input name="name" value={form.name} onChange={onChange} placeholder="John Smith" className={field} required autoComplete="name" />
                  </div>
                  <div className="space-y-1">
                    <span className={label}>Email Address *</span>
                    <input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" className={field} required autoComplete="email" />
                  </div>
                  <div className="space-y-1">
                    <span className={label}>Phone Number</span>
                    <input type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="+44 7700 000000" className={field} autoComplete="tel" />
                  </div>
                  <div className="space-y-1">
                    <span className={label}>Post Code *</span>
                    <input name="postcode" value={form.postcode} onChange={onChange} placeholder="M1 1AA" className={`${field} uppercase`} required autoComplete="postal-code" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[["bedrooms", "Bedrooms", 8], ["bathrooms", "Bathrooms", 8], ["livingRooms", "Living / Reception", 6]].map(([name, text, max]) => (
                    <div key={name} className="space-y-1">
                      <span className={label}>{text}</span>
                      <select name={name} value={form[name]} onChange={onChange} className={field}>
                        <option value="">—</option>
                        {range(max).map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="space-y-1">
                    <span className={label}>Property Type</span>
                    <select name="property" value={form.property} onChange={onChange} className={field}>
                      <option value="">—</option>
                      {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className={label}>Preferred Date</span>
                  <input type="date" name="date" min={today} value={form.date} onChange={onChange} className={field} />
                </div>

                <div className="space-y-1">
                  <span className={label}>Additional Information</span>
                  <textarea name="notes" rows={4} value={form.notes} onChange={onChange}
                    placeholder="Anything we should know — condition of the property, parking, access, pets…"
                    className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 font-bold resize-none focus:outline-none focus:border-primary text-slate-700 text-sm transition-colors" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[CARPET_WITH, CARPET_WITHOUT].map((opt) => (
                    <label key={opt} className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-colors ${form.carpet === opt ? "border-primary/40 bg-primary/5" : "border-slate-100 bg-slate-50"}`}>
                      <input type="radio" name="carpet" value={opt} checked={form.carpet === opt} onChange={onChange} className="w-5 h-5 accent-primary" />
                      <span className="font-black text-slate-700 text-sm">{opt}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="font-black text-primary-dark text-sm">Save 20% on additional services:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                    {Extra({ name: "oven", title: "Oven Cleaning", typeName: "ovenType", types: OVEN_TYPES, typeLabel: "Type of oven" })}
                    {Extra({ name: "fridge", title: "Fridge Cleaning", typeName: "fridgeType", types: FRIDGE_TYPES, typeLabel: "Type of fridge" })}
                    {Extra({ name: "clearance", title: "Clearance" })}
                  </div>
                </div>

                {/* Hidden from people; only bots fill it in. */}
                <input type="text" name="website" value={form.website} onChange={onChange} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="w-5 h-5 mt-0.5 accent-primary shrink-0" required />
                  <span className="text-slate-500 text-xs font-bold leading-relaxed">
                    I consent to having this website store my submitted information so they can respond to my enquiry.
                  </span>
                </label>

                <button type="submit" disabled={status === "loading"}
                  className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.01] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-primary/20 text-sm">
                  {status === "loading" ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : <><Send size={18} /> Get My Quote</>}
                </button>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default GetQuote;
