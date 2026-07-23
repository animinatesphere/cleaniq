import React, { useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Loader2,
  Search,
  Send,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Mail,
  Hash,
  Zap,
  LinkIcon,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com";

/* ── Toast ─────────────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-sm ${
        type === "success"
          ? "border-emerald-400/30 bg-[#071D16] text-emerald-200"
          : "border-rose-400/30 bg-[#1a0810] text-rose-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle size={16} className="text-rose-400 shrink-0" />
      )}
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
};

/* ── Step indicator ─────────────────────────────────────────────────── */
const StepBadge = ({ n, label, active, done }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
        done
          ? "bg-emerald-500 text-white"
          : active
          ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300"
          : "bg-white/[0.05] border border-white/10 text-white/25"
      }`}
    >
      {done ? <CheckCircle2 size={13} /> : n}
    </div>
    <span
      className={`text-xs font-bold transition-colors ${
        done ? "text-emerald-400" : active ? "text-white" : "text-white/25"
      }`}
    >
      {label}
    </span>
  </div>
);

/* ── Info row inside booking card ───────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-start gap-3">
    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={13} className="text-white/40" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35 mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-semibold text-white leading-snug ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </p>
    </div>
  </div>
);

/* ── Main page ──────────────────────────────────────────────────────── */
const GenerateLinksPage = () => {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [linkResult, setLinkResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [hours, setHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [flatAmount, setFlatAmount] = useState("");
  const [billingMode, setBillingMode] = useState("hourly"); // "hourly" | "flat"
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const step = !booking ? 1 : !linkResult ? 2 : 3;

  /* ── Lookup ─────────────────────────────────────────────────────── */
  const lookupBooking = async () => {
    if (!bookingId.trim()) {
      setToast({ type: "error", message: "Enter a booking reference" });
      return;
    }
    setLoadingBooking(true);
    setBooking(null);
    setLinkResult(null);
    setHours("");
    setHourlyRate("");
    setFlatAmount("");
    setBillingMode("hourly");
    setNote("");
    try {
      const res = await fetch(
        `${API}/bookings/by-ref/${encodeURIComponent(bookingId.trim())}`,
      );
      const data = await res.json();
      if (!res.ok || !data?._id)
        throw new Error(data?.message || "Booking not found");
      setBooking(data);
      setToast({ type: "success", message: "Booking found" });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to find booking" });
    } finally {
      setLoadingBooking(false);
    }
  };

  /* ── Generate link ──────────────────────────────────────────────── */
  const createLink = async () => {
    if (!booking?._id) return;

    let sendHours, sendRate;
    if (billingMode === "flat") {
      if (!flatAmount || Number(flatAmount) <= 0) {
        setToast({ type: "error", message: "Enter a valid flat rate amount" });
        return;
      }
      // Send as 1 hour at flatAmount rate so backend total = flatAmount
      sendHours = 1;
      sendRate  = Number(flatAmount);
    } else {
      if (!hours || Number(hours) <= 0) {
        setToast({ type: "error", message: "Enter valid additional hours" });
        return;
      }
      if (!hourlyRate || Number(hourlyRate) <= 0) {
        setToast({ type: "error", message: "Enter a valid hourly rate" });
        return;
      }
      sendHours = Number(hours);
      sendRate  = Number(hourlyRate);
    }

    setLoadingLink(true);
    setLinkResult(null);
    try {
      const res = await fetch(`${API}/payments/additional-hours-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId:       booking._id,
          additionalHours: sendHours,
          hourlyRate:      sendRate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create link");
      setLinkResult({ ...data, note, billingMode, flatAmount: billingMode === "flat" ? Number(flatAmount) : null });
      setToast({ type: "success", message: "Payment link generated" });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to create payment link" });
    } finally {
      setLoadingLink(false);
    }
  };

  /* ── Send email ─────────────────────────────────────────────────── */
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
          customerName: `${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim(),
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
      setToast({ type: "error", message: err.message || "Unable to send email" });
    } finally {
      setLoadingLink(false);
    }
  };

  /* ── Copy link ──────────────────────────────────────────────────── */
  const copyLink = async () => {
    if (!linkResult?.checkoutUrl) return;
    await navigator.clipboard.writeText(linkResult.checkoutUrl);
    setCopied(true);
    setToast({ type: "success", message: "Link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Derived values ─────────────────────────────────────────────── */
  const liveTotal = useMemo(() => {
    if (billingMode === "flat") {
      const f = Number(flatAmount);
      return f > 0 ? f.toFixed(2) : null;
    }
    const h = Number(hours);
    const r = Number(hourlyRate);
    if (h > 0 && r > 0) return (h * r).toFixed(2);
    return null;
  }, [billingMode, flatAmount, hours, hourlyRate]);

  const currentHours = booking?.details?.duration ?? null;

  const scheduleDate = booking?.schedule?.date
    ? new Date(booking.schedule.date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400/70 mb-1.5">
          Admin Tools
        </p>
        <h1 className="text-xl font-black text-white">Generate Payment Link</h1>
        <p className="text-sm text-white/40 mt-1">
          Charge a customer for extra hours on an existing booking.
        </p>
      </div>

      {/* ── Step indicator ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <StepBadge n={1} label="Find booking" active={step === 1} done={step > 1} />
        <div className={`flex-1 max-w-[40px] h-px transition-colors ${step > 1 ? "bg-emerald-500/40" : "bg-white/[0.08]"}`} />
        <StepBadge n={2} label="Configure link" active={step === 2} done={step > 2} />
        <div className={`flex-1 max-w-[40px] h-px transition-colors ${step > 2 ? "bg-emerald-500/40" : "bg-white/[0.08]"}`} />
        <StepBadge n={3} label="Send to customer" active={step === 3} done={false} />
      </div>

      {/* ── Stage 1: Search bar ──────────────────────────────────────── */}
      <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35 mb-3">
          Booking reference
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
            <input
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupBooking()}
              placeholder="e.g. BK-R123456"
              className="w-full pl-10 pr-4 py-3 bg-[#071D16] border border-white/[0.08] rounded-xl text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
          </div>
          <button
            onClick={lookupBooking}
            disabled={loadingBooking}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 shrink-0"
          >
            {loadingBooking ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Search size={15} />
            )}
            Find
          </button>
        </div>
      </div>

      {/* ── Stage 2: Booking found + Link config ────────────────────── */}
      {booking && (
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">

          {/* Booking summary card */}
          <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35 mb-1">
                  Booking details
                </p>
                <p className="text-lg font-black text-white font-mono">
                  {booking.bookingId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    booking.status === "Completed"
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                      : booking.status === "Cancelled"
                      ? "bg-rose-500/10 border-rose-500/25 text-rose-300"
                      : "bg-amber-500/10 border-amber-500/25 text-amber-300"
                  }`}
                >
                  {booking.status}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <InfoRow
                icon={User}
                label="Customer"
                value={`${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim()}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={booking.customer?.email}
              />
              <InfoRow
                icon={Hash}
                label="Service"
                value={booking.service}
              />
              <InfoRow
                icon={Clock}
                label="Current hours"
                value={currentHours != null ? `${currentHours}h` : "—"}
              />
              {scheduleDate && (
                <InfoRow
                  icon={Calendar}
                  label="Scheduled date"
                  value={scheduleDate}
                />
              )}
              <InfoRow
                icon={CreditCard}
                label="Amount paid"
                value={
                  booking.payment?.amount != null
                    ? `£${Number(booking.payment.amount).toFixed(2)}`
                    : "—"
                }
              />
            </div>
          </div>

          {/* Link configuration card */}
          <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
              Link configuration
            </p>

            {/* Billing mode toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/[0.08] bg-[#071D16] p-1 gap-1">
              <button
                onClick={() => setBillingMode("hourly")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  billingMode === "hourly"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                Hourly
              </button>
              <button
                onClick={() => setBillingMode("flat")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  billingMode === "flat"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                Flat Rate
              </button>
            </div>

            {/* Hourly mode inputs */}
            {billingMode === "hourly" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2">
                    Additional hours
                  </label>
                  <input
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g. 2"
                    className="w-full px-4 py-3 bg-[#071D16] border border-white/[0.08] rounded-xl text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2">
                    Hourly rate (£)
                  </label>
                  <input
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    type="number"
                    min="1"
                    placeholder="e.g. 35"
                    className="w-full px-4 py-3 bg-[#071D16] border border-white/[0.08] rounded-xl text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/60 transition-colors"
                  />
                </div>
              </>
            )}

            {/* Flat rate mode inputs */}
            {billingMode === "flat" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2">
                    Additional hours
                  </label>
                  <input
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g. 2"
                    className="w-full px-4 py-3 bg-[#071D16] border border-white/[0.08] rounded-xl text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-2">
                    Flat rate amount (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold pointer-events-none">£</span>
                    <input
                      value={flatAmount}
                      onChange={(e) => setFlatAmount(e.target.value)}
                      type="number"
                      min="1"
                      placeholder="e.g. 80"
                      className="w-full pl-8 pr-4 py-3 bg-[#071D16] border border-white/[0.08] rounded-xl text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/60 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 mt-1.5">Fixed total charge for the extra hours — overrides the hourly rate calculation.</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-white/50 mb-2">
                Note <span className="text-white/25 font-medium normal-case">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="e.g. Extra bedroom cleaned"
                className="w-full px-4 py-3 bg-[#071D16] border border-white/[0.08] rounded-xl text-sm font-medium text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/60 transition-colors resize-none"
              />
            </div>

            {/* Live price preview */}
            {liveTotal && (
              <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-xs font-bold text-emerald-400/80">
                  {billingMode === "flat" ? "Flat charge" : "Total charge"}
                </span>
                <span className="text-lg font-black text-emerald-300 tabular-nums">
                  £{liveTotal}
                </span>
              </div>
            )}

            <button
              onClick={createLink}
              disabled={loadingLink || (billingMode === "hourly" ? (!hours || !hourlyRate) : (!hours || !flatAmount))}
              className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingLink ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <LinkIcon size={15} />
              )}
              Generate payment link
            </button>
          </div>
        </div>
      )}

      {/* ── Stage 3: Result ──────────────────────────────────────────── */}
      {linkResult && (
        <div className="bg-[#0B2D22] border border-emerald-500/20 rounded-2xl overflow-hidden">
          {/* Top strip */}
          <div className="bg-emerald-500/10 border-b border-emerald-500/15 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Zap size={15} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400/70">
                  Payment link ready
                </p>
                <p className="text-sm font-black text-white">
                  £{Number(linkResult.additionalAmount || 0).toFixed(2)}{" "}
                  <span className="text-white/40 font-semibold text-xs">
                    · {linkResult.billingMode === "flat" ? "flat rate" : `${hours}h extra`}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={copyLink}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  copied
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                    : "border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {copied ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Copied!" : "Copy link"}
              </button>
              <a
                href={linkResult.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white transition-all"
              >
                <ExternalLink size={14} />
                Open
              </a>
              <button
                onClick={sendEmail}
                disabled={loadingLink}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {loadingLink ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Send email
              </button>
            </div>
          </div>

          {/* URL display */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25 mb-2">
              Checkout URL
            </p>
            <div className="flex items-center gap-3 px-4 py-3 bg-[#071D16] rounded-xl border border-white/[0.06]">
              <LinkIcon size={13} className="text-white/20 shrink-0" />
              <p className="text-xs font-mono text-emerald-300/80 break-all flex-1 leading-relaxed">
                {linkResult.checkoutUrl}
              </p>
            </div>
            {linkResult.note && (
              <p className="mt-3 text-xs text-white/35">
                Note: <span className="text-white/55">{linkResult.note}</span>
              </p>
            )}
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
