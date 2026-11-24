// Contact form block (the Contact and Commercial cleaning pages). The form always works the same way
// (it sends to /api/contact); the editor changes the text, contact details and opening hours.
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Building2, Ruler } from "lucide-react";
import BlockLink, { RichText } from "./BlockLink";
import { PickedIcon } from "./icons";

const API = import.meta.env.VITE_API_URL;
const list = (v) => (Array.isArray(v) ? v : []);

// Commercial cleaning has no online booking: the customer picks the type and the size of the space
// on its own page (/commercial-cleaning) and
// the team sends a quote. Same list as server/routes/contact.js (COMMERCIAL_TYPES).
const COMMERCIAL = "Commercial Cleaning";
const COMMERCIAL_TYPES = [
  "Event Cleaning",
  "Restaurant Cleaning",
  "Contract Cleaning",
  "Communal Area Cleaning",
  "Commercial Cleaning",
  "Gym Cleaning",
];
const EMPTY = { name: "", email: "", phone: "", service: "", subject: "", message: "", commercialType: "", squareMetres: "" };

// commercialOnly: the /commercial-cleaning page — the same form, fixed to commercial cleaning.
export function ContactFormBlock({ mode, badge, heading, text, contactItems, hoursTitle, hours, formTitle, formText, successTitle, successText, errorTitle, buttonLabel }) {
  const commercialOnly = mode === "commercial";
  const navigate = useNavigate();
  const fromCommercial = commercialOnly;
  const [formData, setFormData] = useState({ ...EMPTY, service: fromCommercial ? COMMERCIAL : "" });
  const isCommercial = formData.service === COMMERCIAL;
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [serviceNames, setServiceNames] = useState([]);

  useEffect(() => {
    fetch(`${API}/services?region=UK`)
      .then((r) => r.json())
      .then((data) => {
        const names = [...new Set(data.map((s) => s.name))].filter((n) => n !== COMMERCIAL).sort();
        setServiceNames(names);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    // Commercial cleaning has its own page and address.
    if (e.target.name === "service" && e.target.value === COMMERCIAL) return navigate("/commercial-cleaning");
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCommercial && !formData.commercialType) {
      setErrorMsg("Please choose the type of commercial cleaning.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    // Type and size are only sent for a commercial enquiry.
    const { commercialType, squareMetres, ...rest } = formData;
    const body = isCommercial ? { ...rest, commercialType, squareMetres } : rest;

    try {
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({ ...EMPTY, service: fromCommercial ? COMMERCIAL : "" });
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            {fromCommercial ? <Building2 size={14} /> : <Mail size={14} />} {badge}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-dark tracking-tighter mb-4">
            {heading}
          </h1>
          <p className="text-slate-500 font-bold text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            <RichText text={text} />
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-6 md:gap-8 items-start">

          {/* Info Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 space-y-6"
          >
            {list(contactItems).map((item) => (
              <div key={item.label + item.value} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <PickedIcon name={item.icon} size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {item.label}
                  </p>
                  {item.link ? (
                    <BlockLink
                      href={item.link}
                      className="font-extrabold text-primary-dark hover:text-primary transition-colors text-sm whitespace-pre-line"
                    >
                      {item.value}
                    </BlockLink>
                  ) : (
                    <p className="font-extrabold text-primary-dark text-sm whitespace-pre-line">
                      {item.value}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Opening hours */}
            {list(hours).length > 0 && (
            <div className="bg-primary-dark rounded-[24px] p-6 text-white">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">{hoursTitle}</p>
              <div className="space-y-2">
                {list(hours).map((row, i) => (
                  <div key={i} className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400">{row.day}</span>
                    <span className="text-white">{row.hours}</span>
                  </div>
                ))}
              </div>
            </div>
            )}
          </motion.div>

          {/* Form Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="md:col-span-3 bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-100/50"
          >
            <h2 className="text-2xl font-black text-primary-dark mb-2 tracking-tight">
              {isCommercial ? "Your Details" : formTitle}
            </h2>
            <p className="text-slate-400 font-bold text-sm mb-8">
              {formText}
            </p>

            {/* Success State */}
            <AnimatePresence>
              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4 mb-6"
                >
                  <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-emerald-700 text-sm">{successTitle}</p>
                    <p className="text-emerald-600 text-xs font-bold mt-1">
                      {successText}
                    </p>
                  </div>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start gap-4 mb-6"
                >
                  <AlertCircle size={24} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-rose-700 text-sm">{errorTitle || "Failed to send message"}</p>
                    <p className="text-rose-600 text-xs font-bold mt-1">{errorMsg}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-primary text-slate-700 text-sm transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-primary text-slate-700 text-sm transition-colors"
                    required
                  />
                </div>
              </div>

              <div className={`grid grid-cols-1 gap-4 ${commercialOnly ? "" : "sm:grid-cols-2"}`}>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Phone (optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+44 7700 000000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-primary text-slate-700 text-sm transition-colors"
                  />
                </div>
                {!commercialOnly && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Service</label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-primary text-slate-700 text-sm transition-colors"
                  >
                    <option value="">Select a service…</option>
                    {serviceNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value={COMMERCIAL}>{COMMERCIAL}</option>
                    <option value="Other Cleaning Services">Other Cleaning Services</option>
                  </select>
                </div>
                )}
              </div>

              {isCommercial && (
                <div className="space-y-4 rounded-3xl border border-primary/15 bg-primary/5 p-5">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Type of commercial cleaning *</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Type of commercial cleaning">
                      {COMMERCIAL_TYPES.map((t) => {
                        const on = formData.commercialType === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setFormData((prev) => ({ ...prev, commercialType: t }))}
                            className={`p-3.5 rounded-2xl border text-left text-sm font-bold transition-colors ${on ? "bg-primary text-white border-primary" : "bg-white text-slate-700 border-slate-200 hover:border-primary"}`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="contact-sqm" className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center gap-1">
                      <Ruler size={12} /> Size of the space (square metres) *
                    </label>
                    <input
                      id="contact-sqm"
                      type="number"
                      name="squareMetres"
                      min="1"
                      max="100000"
                      step="1"
                      inputMode="numeric"
                      placeholder="e.g. 120"
                      value={formData.squareMetres}
                      onChange={handleChange}
                      className="w-full p-4 rounded-2xl bg-white border border-slate-200 font-bold focus:outline-none focus:border-primary text-slate-700 text-sm transition-colors"
                      required
                    />
                    <p className="text-xs text-slate-500 font-semibold ml-1">Not sure? Give your best guess (a small office is about 50 m², a restaurant 100–300 m²) and we'll confirm it with you.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Subject</label>
                <input
                  type="text"
                  name="subject"
                  placeholder={commercialOnly ? "e.g. Weekly restaurant clean" : "e.g. Quote for deep clean"}
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-primary text-slate-700 text-sm transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">{isCommercial ? "Anything else? (optional)" : "Message *"}</label>
                <textarea
                  name="message"
                  placeholder={isCommercial ? "Business name, address or postcode, size of the space, how often, preferred dates…" : "Tell us about your cleaning needs, property size, preferred dates..."}
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 font-bold resize-none focus:outline-none focus:border-primary text-slate-700 text-sm transition-colors"
                  required={!isCommercial}
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.01] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-primary/20 text-sm"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send size={18} /> {buttonLabel || (isCommercial ? "Request a Quote" : "Send Message")}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const CONTACT_BLOCKS = { ContactForm: ContactFormBlock };
