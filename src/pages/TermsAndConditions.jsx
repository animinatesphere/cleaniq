import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Truck,
  Lock,
  Phone,
  Mail,
  ChevronDown,
} from "lucide-react";

const LAST_UPDATED = "31 May 2026";

const sections = [
  {
    id: "acceptance",
    icon: <ShieldCheck size={20} />,
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using the Cleaniq Services website (cleaniqservices.com) and booking any of our cleaning services, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions.",
      "If you do not agree with any part of these terms, you must not use our website or services. These terms apply to all visitors, customers, and users of the site.",
      "Cleaniq Services reserves the right to update or modify these Terms and Conditions at any time without prior notice. Your continued use of our services following any changes constitutes your acceptance of the revised terms.",
    ],
  },
  {
    id: "services",
    icon: <Truck size={20} />,
    title: "2. Our Services",
    content: [
      "Cleaniq Services provides professional cleaning services including, but not limited to: Residential Cleaning, Deep Cleaning, End of Tenancy Cleaning, Airbnb & Short-Let Turnover Cleaning, Office & Commercial Cleaning, and Post-Construction Cleaning.",
      "All services are provided within the Greater Manchester area and surrounding regions of the United Kingdom.",
      "We reserve the right to refuse service to any individual or property at our sole discretion, including situations where our staff's safety may be at risk.",
      "Service availability is subject to cleaner availability and confirmed upon booking. We will make every reasonable effort to honour confirmed bookings but cannot guarantee specific staff assignments.",
    ],
  },
  {
    id: "booking",
    icon: <FileText size={20} />,
    title: "3. Booking & Scheduling",
    content: [
      "A booking is only confirmed once you receive a written confirmation email from Cleaniq Services following successful payment processing.",
      "You must provide accurate information when booking, including a valid address, contact details, and a clear description of the property to be cleaned. Providing false or misleading information may result in cancellation of your booking without refund.",
      "You must ensure safe and unobstructed access to the property at the scheduled time. If our cleaners cannot access the property, a cancellation fee may apply.",
      "Cleaniq Services reserves the right to reschedule a booking in the event of unforeseen circumstances such as staff illness, extreme weather, or emergencies. We will provide as much notice as possible in such cases.",
    ],
  },
  {
    id: "payment",
    icon: <CreditCard size={20} />,
    title: "4. Payments",
    content: [
      "All prices are displayed in GBP (£) for UK customers  inclusive of applicable taxes where stated.",
      "Full payment is required at the time of booking. We accept payment via Stripe-powered credit and debit card transactions. We do not store your card details , all payments are securely processed by Stripe.",
      "Prices are subject to change. The price quoted at the time of booking will be honoured for that booking.",
      "Additional charges may apply where the scope of work exceeds what was originally agreed (e.g., a property in significantly worse condition than described). We will notify you and obtain consent before carrying out additional work.",
    ],
  },
  {
    id: "cancellation",
    icon: <RefreshCw size={20} />,
    title: "5. Cancellations & Refunds",
    content: [
      "You may cancel a booking at any time via your customer dashboard. Upon cancellation, a full refund will be issued to your original payment method via Stripe.",
      "Refunds typically take 5–10 business days to appear in your account, depending on your card issuer.",
      "Cleaniq Services reserves the right to cancel a booking and issue a full refund if we are unable to fulfil the service for any reason, including but not limited to staff unavailability or access issues.",
      "Once a cleaning service has been completed and marked as 'Completed', no refunds will be issued except where a valid complaint is raised within 24 hours of service completion.",
      "If you wish to reschedule a booking, you may cancel the existing booking via your dashboard and rebook at your convenience.",
      "24 hours notice prior to the cleaning time is free No cancellation fee.",
      "8 hours notice prior to the cleaning time should attract a charge.",
      "The 2 hours notice prior to the schedule time should attract flull payment forfeiture/80% cancellation fee of the payment made.",
    ],
  },
  {
    id: "liability",
    icon: <AlertTriangle size={20} />,
    title: "6. Liability & Damage",
    content: [
      "Cleaniq Services carries public liability insurance. In the unlikely event that our staff cause damage to your property during a cleaning visit, you must report the damage to us within 24 hours of the service being completed.",
      "We will not be held liable for damage that existed prior to our visit, damage caused by faulty or pre-damaged fixtures, or items left unsecured and not declared prior to the clean.",
      "Our total liability to you in connection with any booking shall not exceed the total price paid for that specific booking.",
      "Cleaniq Services shall not be liable for any indirect, consequential, or special damages arising out of or in connection with the provision of our services.",
      "You are responsible for securing or removing any fragile, valuable, or irreplaceable items prior to our cleaners arriving.",
    ],
  },
  {
    id: "privacy",
    icon: <Lock size={20} />,
    title: "7. Privacy & Data",
    content: [
      "By using our website and services, you consent to our collection and use of your personal data as described in our Privacy Policy.",
      "We collect your name, email address, phone number, and property address solely for the purpose of providing and improving our cleaning services.",
      "We do not sell, rent, or share your personal data with third parties for marketing purposes without your explicit consent.",
      "We use industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure and we cannot guarantee absolute security.",
      "You have the right to request access to, correction of, or deletion of your personal data at any time by contacting us at info@cleaniqservices.com.",
    ],
  },
  {
    id: "conduct",
    icon: <ShieldCheck size={20} />,
    title: "8. Customer Conduct",
    content: [
      "You agree to treat Cleaniq Services staff with respect and professionalism at all times. Any form of harassment, abuse, or threatening behaviour towards our staff will result in immediate termination of the service and a permanent ban from using our platform.",
      "You must ensure the property is safe for our cleaners to work in, including disclosing any known hazards such as mould, pests, or structural issues.",
      "You must not request that our cleaners perform tasks outside the scope of the booked service without prior agreement and additional payment.",
      "Pets must be secured and away from areas being cleaned during the service visit unless previously agreed.",
    ],
  },
  {
    id: "governing",
    icon: <FileText size={20} />,
    title: "9. Governing Law",
    content: [
      "These Terms and Conditions shall be governed by and construed in accordance with the laws of England and Wales.",
      "Any disputes arising from these terms or the use of our services shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
      "If any provision of these Terms and Conditions is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.",
    ],
  },
];

const AccordionItem = ({ section }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-6 md:p-8 text-left group hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
            {section.icon}
          </div>
          <h2 className="font-extrabold text-primary-dark text-base md:text-lg tracking-tight">
            {section.title}
          </h2>
        </div>
        <ChevronDown
          size={20}
          className={`text-slate-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4 border-t border-slate-50">
          {section.content.map((para, i) => (
            <p
              key={i}
              className="text-slate-600 text-sm md:text-base leading-relaxed font-medium"
            >
              {para}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const TermsAndConditions = () => {
  return (
    <div className="pt-32 pb-24 bg-[#F8FAFC] min-h-screen">
      <Helmet>
        <title>Terms & Conditions — Cleaniq Services</title>
        <meta
          name="description"
          content="Read the Terms and Conditions for Cleaniq Services. Understand our booking, payment, cancellation, and liability policies before using our professional cleaning services."
        />
        <link rel="canonical" href="https://www.cleaniqservices.com/terms" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-12">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <FileText size={14} />
            Legal Agreement
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-primary-dark tracking-tighter mb-4">
            Terms & Conditions
          </h1>
          <p className="text-slate-500 font-bold text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Please read these terms carefully before using Cleaniq Services. By
            booking with us, you agree to be bound by the following conditions.
          </p>
          <p className="mt-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Last Updated: {LAST_UPDATED}
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-12"
        >
          {[
            {
              icon: <RefreshCw size={20} />,
              title: "Full Refunds",
              desc: "Cancel any time and receive a full refund to your card.",
            },
            {
              icon: <Lock size={20} />,
              title: "Secure Payments",
              desc: "All transactions are encrypted and processed by Stripe.",
            },
            {
              icon: <ShieldCheck size={20} />,
              title: "Fully Insured",
              desc: "We carry public liability insurance on every job.",
            },
            {
              icon: <ShieldCheck size={20} />,
              title: "DBS Checked",
              desc: "Our team members hold DBS checks to the level required for their role",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex gap-4 items-start"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {card.icon}
              </div>
              <div>
                <p className="font-black text-primary-dark text-sm">
                  {card.title}
                </p>
                <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Accordion Sections */}
        <div className="space-y-4 mb-14">
          {sections.map((section) => (
            <AccordionItem key={section.id} section={section} />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary-dark rounded-[32px] p-8 md:p-10 text-center"
        >
          <h3 className="text-2xl font-black text-white tracking-tight mb-3">
            Have a question about our terms?
          </h3>
          <p className="text-slate-400 font-bold text-sm mb-8 max-w-md mx-auto">
            Our team is happy to clarify anything. Reach out to us directly and
            we'll get back to you promptly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="mailto:info@cleaniqservices.com"
              className="flex items-center justify-center gap-2 bg-primary text-white font-black text-sm px-6 py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30"
            >
              <Mail size={16} /> info@cleaniqservices.com
            </a>
            <a
              href="tel:+447752476368"
              className="flex items-center justify-center gap-2 bg-white/10 text-white font-black text-sm px-6 py-4 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
            >
              <Phone size={16} /> +44 7752 476368
            </a>
          </div>
          <p className="mt-8 text-slate-500 text-xs font-bold">
            <Link to="/" className="text-primary hover:underline">
              ← Back to Home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
