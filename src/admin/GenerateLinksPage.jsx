import React, { useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Loader2,
  Search,
  Send,
  Sparkles,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl ${type === "success" ? "border-emerald-400/30 bg-[#0B2D22] text-emerald-200" : "border-rose-400/30 bg-[#2a1113] text-rose-200"}`}
    >
      {type === "success" ? (
        <CheckCircle2 size={18} />
      ) : (
        <AlertCircle size={18} />
      )}
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
};

const GenerateLinksPage = () => {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [linkResult, setLinkResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [hours, setHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [note, setNote] = useState("");

  const lookupBooking = async () => {
    if (!bookingId.trim()) {
      setToast({
        type: "error",
        message: "Enter a booking reference or booking ID",
      });
      return;
    }

    setLoadingBooking(true);
    setBooking(null);
    setLinkResult(null);

    try {
      const res = await fetch(
        `${API}/bookings/by-ref/${encodeURIComponent(bookingId.trim())}`,
      );
      const data = await res.json();
      if (!res.ok || !data?.booking)
        throw new Error(data?.message || "Booking not found");
      setBooking(data.booking);
      setToast({ type: "success", message: "Booking found" });
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Unable to find booking",
      });
    } finally {
      setLoadingBooking(false);
    }
  };

  const createLink = async () => {
    if (!booking?._id) return;
    if (!hours || Number(hours) <= 0) {
      setToast({ type: "error", message: "Enter valid additional hours" });
      return;
    }
    if (!hourlyRate || Number(hourlyRate) <= 0) {
      setToast({ type: "error", message: "Enter a valid hourly rate" });
      return;
    }

    setLoadingLink(true);
    setLinkResult(null);

    try {
      const res = await fetch(`${API}/payments/additional-hours-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          additionalHours: Number(hours),
          hourlyRate: Number(hourlyRate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create link");
      setLinkResult({
        ...data,
        bookingRef: booking.bookingId || booking.bookingId,
        note,
      });
      setToast({ type: "success", message: "Payment link generated" });
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Unable to create payment link",
      });
    } finally {
      setLoadingLink(false);
    }
  };

  const sendEmail = async () => {
    if (!booking?._id || !linkResult?.checkoutUrl) return;
    setLoadingLink(true);
    try {
      const res = await fetch(`${API}/payments/send-additional-hours-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          customerEmail: booking.customer?.email,
          customerName:
            `${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim(),
          checkoutUrl: linkResult.checkoutUrl,
          additionalHours: Number(hours),
          additionalAmount: Number(linkResult.additionalAmount),
          bookingRef: booking.bookingId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Email failed");
      setToast({ type: "success", message: "Email sent to customer" });
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Unable to send email",
      });
    } finally {
      setLoadingLink(false);
    }
  };

  const copyLink = async () => {
    if (!linkResult?.checkoutUrl) return;
    await navigator.clipboard.writeText(linkResult.checkoutUrl);
    setToast({ type: "success", message: "Link copied" });
  };

  const bookingSummary = useMemo(() => {
    if (!booking) return null;
    return {
      ref: booking.bookingId,
      customer:
        `${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim(),
      email: booking.customer?.email || "—",
      currentHours: booking.hours || booking.totalHours || "—",
      service: booking.service || booking.serviceType || "—",
      amount: linkResult?.additionalAmount
        ? `£${linkResult.additionalAmount.toFixed(2)}`
        : null,
    };
  }, [booking, linkResult]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/[0.08] bg-[#0B2D22] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
              Admin Link Generator
            </p>
            <h1 className="mt-2 text-2xl font-black text-white">
              Generate a secure payment link for extra hours
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Look up a booking, choose the extra hours, and send a payment link
              or email in seconds.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#05201A] px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Sparkles size={16} className="text-emerald-400" /> Works for any
              booking
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/[0.08] bg-[#0B2D22] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Search size={16} className="text-emerald-400" /> Find booking
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="Booking ID or reference"
              className="flex-1 rounded-2xl border border-white/[0.08] bg-[#05201A] px-4 py-3 text-sm font-medium text-white placeholder:text-white/35 focus:border-emerald-400 focus:outline-none"
            />
            <button
              onClick={lookupBooking}
              disabled={loadingBooking}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
            >
              {loadingBooking ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Find booking
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#05201A] p-4 text-sm text-slate-300">
            {booking ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Booking summary
                  </span>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    Found
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Reference
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {bookingSummary?.ref}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Customer
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {bookingSummary?.customer || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Email
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {bookingSummary?.email || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Current hours
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {bookingSummary?.currentHours ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">
                Search for a booking to start generating a payment link.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-[#0B2D22] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <CreditCard size={16} className="text-emerald-400" /> Link details
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Additional hours
              </label>
              <input
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                type="number"
                min="1"
                placeholder="e.g. 2"
                className="w-full rounded-2xl border border-white/[0.08] bg-[#05201A] px-4 py-3 text-sm font-medium text-white placeholder:text-white/35 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Hourly rate
              </label>
              <input
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                type="number"
                min="1"
                placeholder="e.g. 35"
                className="w-full rounded-2xl border border-white/[0.08] bg-[#05201A] px-4 py-3 text-sm font-medium text-white placeholder:text-white/35 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Note for customer
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
                placeholder="Optional note"
                className="w-full rounded-2xl border border-white/[0.08] bg-[#05201A] px-4 py-3 text-sm font-medium text-white placeholder:text-white/35 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <button
              onClick={createLink}
              disabled={loadingLink || !booking}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
            >
              {loadingLink ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CreditCard size={16} />
              )}
              Generate link
            </button>
          </div>
        </div>
      </div>

      {linkResult && (
        <div className="rounded-[28px] border border-white/[0.08] bg-[#0B2D22] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
                Generated payment link
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                {bookingSummary?.ref}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Amount:{" "}
                <span className="font-semibold text-white">
                  £{Number(linkResult.additionalAmount || 0).toFixed(2)}
                </span>{" "}
                for {hours} extra hours
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#05201A] px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.06]"
              >
                <Copy size={16} /> Copy link
              </button>
              <a
                href={linkResult.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
              >
                <ExternalLink size={16} /> Open link
              </a>
              <button
                onClick={sendEmail}
                disabled={loadingLink}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                {loadingLink ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Send email
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#05201A] p-4 text-sm text-slate-300">
            <div className="break-all font-mono text-sm text-emerald-300">
              {linkResult.checkoutUrl}
            </div>
            {note ? <p className="mt-3 text-slate-400">Note: {note}</p> : null}
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default GenerateLinksPage;
