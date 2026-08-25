import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, CalendarDays, Mail, Home } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-20">
      <Helmet>
        <title>Payment Successful — Cleaniq Services</title>
      </Helmet>

      <div className="w-full max-w-lg text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 size={52} className="text-emerald-500" strokeWidth={1.8} />
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
          Payment Successful!
        </h1>
        <p className="text-slate-500 font-medium text-base mb-2">
          Thank you — your payment has been received.
        </p>
        {bookingId && (
          <p className="text-slate-400 text-sm font-bold mb-8">
            Booking reference: <span className="text-slate-600">{bookingId}</span>
          </p>
        )}

        {/* What happens next */}
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-100 border border-slate-100 text-left mb-8">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            What happens next
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                <Mail size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Confirmation email sent</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Check your inbox for your booking confirmation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarDays size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">We'll be in touch</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Our team will confirm your appointment details shortly.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <Home size={16} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
