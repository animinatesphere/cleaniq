import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Mail, Phone, MapPin, Send, Check } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // Meta handled via Helmet in render

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: "", email: "", message: "" });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="pt-32 pb-20 bg-slate-50 min-h-screen">
      <Helmet>
        <title>Contact Us | CLEANIQ Services Manchester</title>
        <meta
          name="description"
          content="Contact CLEANIQ Services in Manchester for a free cleaning quote. We offer end of tenancy, deep cleaning, Airbnb, and office cleaning. Call +44 7752 476368 or email us today."
        />
        <link
          rel="canonical"
          href="https://cleaniqservices.com/pages/contact"
        />
      </Helmet>
      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* Info Column */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-primary-dark tracking-tight mb-4">
              Contact Our Team
            </h1>
            <p className="text-slate-600 font-medium leading-relaxed">
              Have questions about our professional cleaning services or want a
              free bespoke cleaning quote? Drop us a line below or reach out
              directly to our Manchester office.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Phone Support
                </p>
                <a
                  href="tel:+447752476368"
                  className="text-lg font-extrabold text-primary-dark hover:text-primary transition-colors"
                >
                  +44 7752 476368
                </a>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Email Address
                </p>
                <a
                  href="mailto:info@cleaniqservices.com"
                  className="text-lg font-extrabold text-primary-dark hover:text-primary transition-colors"
                >
                  info@cleaniqservices.com
                </a>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Head Office
                </p>
                <p className="text-base font-bold text-primary-dark leading-relaxed">
                  First Floor, Swan Buildings,
                  <br />
                  20 Swan St, Manchester M4 5JW
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-xl shadow-slate-100/50">
          <h2 className="text-2xl font-black text-primary-dark mb-6">
            Send a Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-primary text-slate-700"
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:border-primary text-slate-700"
              required
            />
            <textarea
              placeholder="How can we help you?"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 font-bold h-36 resize-none focus:outline-none focus:border-primary text-slate-700"
              required
            />

            <button
              type="submit"
              disabled={submitted}
              className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:bg-emerald-600"
            >
              {submitted ? (
                <>
                  <Check size={18} /> Sent Successfully!
                </>
              ) : (
                <>
                  <Send size={18} /> Send Inquiry
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
