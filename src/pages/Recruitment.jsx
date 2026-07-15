import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import LoadingOverlay from "../component/LoadingOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { useRegion } from "../context/RegionContext";
import {
  Upload,
  CheckCircle2,
  User,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  Building,
  Award,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const Recruitment = () => {
  const { region } = useRegion();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cv: null,
  });

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      showNotification("Please enter your full name.");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      showNotification("Please enter a valid email address.");
      return;
    }
    if (!formData.phone.trim()) {
      showNotification("Please enter your phone number.");
      return;
    }
    if (!formData.cv) {
      showNotification("Please upload your CV.");
      return;
    }

    setIsSubmitting(true);

    const data = new FormData();
    data.append("cv", formData.cv);
    data.append("data", JSON.stringify({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      region: region.id,
      source: "Website",
    }));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recruitment`, {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        showNotification("Application failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showNotification("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-6 md:p-12 text-center rounded-4xl md:rounded-[48px] bg-slate-50 border border-slate-100 shadow-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20 rotate-3"
          >
            <CheckCircle2 size={40} />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-primary-dark mb-4 tracking-tighter">
            Application Sent!
          </h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            Thanks for your interest in joining Cleaniq Services. Our team will review your CV and be in touch shortly with next steps.
          </p>
          <Link to="/" className="btn-primary w-full py-5 text-lg shadow-xl shadow-primary/20">
            Return to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-white mt-12">
      <Helmet>
        <title>Join Cleaniq — Careers & Recruitment</title>
        <meta
          name="description"
          content="Apply to join Cleaniq Services. We're hiring vetted cleaning professionals in Manchester. Competitive pay and flexible schedules."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/recruitment" />
        <meta property="og:title" content="Join Cleaniq — Careers & Recruitment" />
      </Helmet>

      {isSubmitting && <LoadingOverlay message="Sending your application..." />}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            Join our elite team.
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-primary-dark mb-6 tracking-tighter leading-tight">
            Help us redefine <br />
            <span className="text-primary italic">professionalism.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium leading-relaxed">
            {region.id === "UK"
              ? "We're hiring dedicated pros in Manchester. Send us your CV and we'll be in touch."
              : "Join Nigeria's premier cleaning network. High pay, flexible hours, and professional growth."}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-50 rounded-[32px] md:rounded-[48px] p-6 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                <FileText size={24} />
              </div>
              <h3 className="text-2xl font-black text-primary-dark tracking-tight">
                Your Details.
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <User size={10} /> Full Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Mail size={10} /> Email Address
                </label>
                <input
                  required
                  type="email"
                  placeholder="john@example.com"
                  className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Phone size={10} /> Phone Number
              </label>
              <input
                required
                type="tel"
                placeholder={region.id === "UK" ? "+44 7..." : "+234 8..."}
                className="w-full p-5 rounded-3xl bg-white border border-slate-100 focus:border-primary outline-none transition-all shadow-sm font-bold"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* CV Upload */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Upload CV
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setFormData({ ...formData, cv: e.target.files[0] })}
                />
                <div
                  className={`p-8 md:p-10 border-2 border-dashed rounded-4xl flex flex-col items-center justify-center gap-4 transition-all ${
                    formData.cv
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-white group-hover:border-primary group-hover:bg-primary/5"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${
                      formData.cv
                        ? "bg-white text-primary"
                        : "bg-slate-50 text-slate-300 group-hover:bg-white group-hover:text-primary"
                    }`}
                  >
                    {formData.cv ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                  </div>
                  <div className="text-center">
                    <p className="font-black text-primary-dark">
                      {formData.cv ? formData.cv.name : "Tap to upload your CV"}
                    </p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                      PDF or Word Doc (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex gap-4">
              <ShieldCheck className="text-primary shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                We'll review your CV and contact you within <strong>24–72 hours</strong>. If successful, we'll send you login details and ask you to complete your profile before your first job.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-5 text-base shadow-2xl shadow-primary/20 disabled:opacity-70"
            >
              Submit Application
            </button>
          </form>
        </motion.div>

        {/* Benefits */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          {[
            { icon: <Building size={24} />, title: "Flexible Hours.", desc: "Choose when and where you want to work." },
            { icon: <Award size={24} />, title: "Premium Pay.", desc: "Industry-leading rates for top-tier professionals." },
            { icon: <ShieldCheck size={24} />, title: "Vetted Quality.", desc: "Join a network of the highest rated pros." },
          ].map((benefit, i) => (
            <div key={i} className="text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mx-auto mb-6">
                {benefit.icon}
              </div>
              <h4 className="text-xl font-black text-primary-dark mb-3 tracking-tight">{benefit.title}</h4>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
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
              className={`p-6 rounded-[32px] border-2 shadow-2xl flex items-center gap-4 bg-white ${
                notification.type === "error"
                  ? "border-rose-100 text-rose-600"
                  : "border-emerald-100 text-emerald-600"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  notification.type === "error" ? "bg-rose-50" : "bg-emerald-50"
                }`}
              >
                {notification.type === "error" ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{notification.type}</p>
                <p className="font-bold text-sm leading-tight">{notification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Recruitment;
