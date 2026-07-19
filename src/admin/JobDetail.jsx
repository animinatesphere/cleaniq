import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, User, Clock, Camera, FileText, MapPin,
  CheckCircle2, AlertTriangle, Briefcase, Phone, Mail,
  Calendar, Timer, Star, Image, ChevronRight, Radio, Navigation,
  PlusCircle, RefreshCw, X, Banknote, Home, Layers,
} from "lucide-react";
import DomesticPropertyReport from "./DomesticPropertyReport";

const API    = import.meta.env.VITE_API_URL;
const SERVER = API?.replace("/api", "");

const fmt = (date) =>
  date ? new Date(date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

const fmtDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null;

const fmtTime = (date) =>
  date ? new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null;

const diffMins = (a, b) => a && b ? Math.round((new Date(b) - new Date(a)) / 60000) : null;

const STATUS_STYLE = {
  Confirmed:            { pill: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  Pending:              { pill: "bg-amber-100 text-amber-800 border-amber-200",       dot: "bg-amber-400"   },
  Completed:            { pill: "bg-sky-100 text-sky-800 border-sky-200",             dot: "bg-sky-500"     },
  "Completed - Unpaid": { pill: "bg-purple-100 text-purple-800 border-purple-200",    dot: "bg-purple-500"  },
  Cancelled:            { pill: "bg-rose-100 text-rose-800 border-rose-200",          dot: "bg-rose-500"    },
  "In Progress":        { pill: "bg-blue-100 text-blue-800 border-blue-200",          dot: "bg-blue-500",   live: true },
  Assigned:             { pill: "bg-violet-100 text-violet-800 border-violet-200",    dot: "bg-violet-500"  },
  Arrived:              { pill: "bg-teal-100 text-teal-800 border-teal-200",          dot: "bg-teal-500"    },
};

// ── Section heading ───────────────────────────────────────────────────────────
const SectionHead = ({ label, icon: Icon, right }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={13} className="text-slate-400" />}
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    {right}
  </div>
);

// ── Timeline ──────────────────────────────────────────────────────────────────
const Timeline = ({ booking }) => {
  const steps = [
    { icon: Calendar,     label: "Booking Created",      time: fmt(booking.createdAt),       done: !!booking.createdAt,       dotColor: "bg-slate-400",   iconColor: "text-slate-500"   },
    { icon: CheckCircle2, label: "Accepted by Worker",   time: fmt(booking.jobAcceptedTime), done: !!booking.jobAcceptedTime, dotColor: "bg-emerald-500", iconColor: "text-emerald-600" },
    { icon: MapPin,       label: "Worker Arrived",        time: fmt(booking.jobArrivedTime),  done: !!booking.jobArrivedTime,  dotColor: "bg-sky-500",     iconColor: "text-sky-600"     },
    { icon: Timer,        label: "Job Started",           time: fmt(booking.jobStartTime),    done: !!booking.jobStartTime,    dotColor: "bg-amber-500",   iconColor: "text-amber-600"   },
    { icon: Star,         label: "Job Completed",         time: fmt(booking.jobEndTime),      done: !!booking.jobEndTime,      dotColor: "bg-primary",     iconColor: "text-primary"     },
  ];

  return (
    <div className="relative">
      {/* Vertical connector */}
      <div className="absolute left-[19px] top-10 bottom-6 w-px bg-slate-100" />

      <div className="space-y-0">
        {steps.map(({ icon: Icon, label, time, done, dotColor, iconColor }, i) => {
          const isNext = !done && steps.slice(0, i).every(s => s.done);
          return (
            <div key={label} className={`relative flex items-start gap-4 pb-7 last:pb-0 ${!done && !isNext ? "opacity-35" : ""}`}>
              {/* Step dot */}
              <div className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                done ? `${dotColor.replace("bg-", "bg-").replace("500", "100").replace("400", "100")} border-transparent` : isNext ? "bg-white border-slate-200" : "bg-white border-slate-100"
              }`}>
                <Icon size={16} className={done ? iconColor : isNext ? "text-slate-300" : "text-slate-200"} />
                {done && <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${dotColor} border-2 border-white`} />}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1.5 min-w-0">
                <p className={`text-xs font-black uppercase tracking-widest leading-none ${done ? "text-slate-700" : isNext ? "text-slate-500" : "text-slate-300"}`}>
                  {label}
                </p>
                {time ? (
                  <p className={`text-sm font-bold mt-1 ${done ? iconColor : "text-slate-400"}`}>{time}</p>
                ) : isNext ? (
                  <p className="text-xs text-slate-400 font-medium mt-1 animate-pulse">In progress…</p>
                ) : (
                  <p className="text-xs text-slate-300 font-medium mt-1">Pending</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Photo card ────────────────────────────────────────────────────────────────
const PhotoCard = ({ photo, label, badge }) => {
  const url = photo?.url?.startsWith("http") ? photo.url : `${SERVER}/${photo?.url}`;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group relative block rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all">
      <img src={url} alt={label} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { e.target.style.display = "none"; }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
        {badge && (
          <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
        )}
        {photo?.uploadedAt && (
          <span className="text-[9px] font-bold text-white/80 ml-auto">{fmtTime(photo.uploadedAt)}</span>
        )}
      </div>
    </a>
  );
};

// ── Extra time request card ───────────────────────────────────────────────────
const ExtraTimeRequestCard = ({ booking, onUpdated }) => {
  const req = booking.meta?.extraTimeRequest;
  const [dismissing, setDismissing] = useState(false);
  const [extending,  setExtending]  = useState(false);

  const bookedHrs  = parseFloat(booking?.details?.duration || booking?.workerDuration || 0);
  const currentAmt = parseFloat(booking?.payment?.amount   || 0);
  const hourlyRate = bookedHrs > 0 ? currentAmt / bookedHrs : null;
  const newHrs     = bookedHrs + (req?.extraHours || 0);
  const newTotal   = hourlyRate ? hourlyRate * newHrs : null;
  const evidencePhotos = (booking.photos || []).filter(p => p.photoType === "other");

  const handleExtend = async () => {
    setExtending(true);
    try {
      const body = {
        details: { ...booking.details, duration: newHrs },
        ...(newTotal != null ? { payment: { ...booking.payment, amount: parseFloat(newTotal.toFixed(2)) } } : {}),
        meta: { ...(booking.meta || {}), extraTimeRequest: { ...req, status: "approved" } },
      };
      const res = await fetch(`${API}/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      if (onUpdated) onUpdated();
    } catch (e) { alert(e.message); }
    finally { setExtending(false); }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      const res = await fetch(`${API}/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta: { ...(booking.meta || {}), extraTimeRequest: { ...req, status: "dismissed" } } }),
      });
      if (!res.ok) throw new Error("Failed");
      if (onUpdated) onUpdated();
    } catch (e) { alert(e.message); }
    finally { setDismissing(false); }
  };

  if (req?.status === "dismissed") return null;

  const approved = req?.status === "approved";

  return (
    <div className={`rounded-3xl border-2 overflow-hidden mb-4 ${approved ? "border-emerald-200" : "border-amber-300"}`}>
      {/* Header strip */}
      <div className={`px-6 py-4 flex items-center justify-between ${approved ? "bg-emerald-600" : "bg-amber-500"}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Timer size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-tight">Extra Time Request from Worker</p>
            <p className="text-[11px] text-white/80 font-medium mt-0.5">
              {req?.workerName || booking.assignedWorkerName}
              {req?.requestedAt ? ` · ${new Date(req.requestedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full border ${
          approved ? "bg-white/20 text-white border-white/30" : "bg-white/30 text-amber-900 border-amber-200 animate-pulse"
        }`}>
          {approved ? "Approved" : "Needs Action"}
        </span>
      </div>

      {/* Body */}
      <div className={`p-6 ${approved ? "bg-emerald-50" : "bg-amber-50"}`}>
        <div className="grid sm:grid-cols-2 gap-6 mb-5">
          {/* Reasons */}
          {req?.reasons?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Reasons Given</p>
              <ul className="space-y-2">
                {req.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${approved ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Time summary */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Time Breakdown</p>
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100">
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-slate-600 tabular-nums">{bookedHrs}h</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mt-0.5">Booked</p>
              </div>
              <div className="text-slate-300 text-lg font-bold">+</div>
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-amber-500 tabular-nums">{req?.extraHours}h</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mt-0.5">Extra</p>
              </div>
              <div className="text-slate-300 text-lg font-bold">=</div>
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-emerald-600 tabular-nums">{newHrs}h</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mt-0.5">Total</p>
              </div>
            </div>
            {newTotal != null && (
              <p className="text-xs text-slate-500 font-semibold mt-2 text-center">
                New total: <span className="font-black text-slate-800">£{newTotal.toFixed(2)}</span>
                <span className="text-slate-400 ml-1">(+£{(newTotal - currentAmt).toFixed(2)})</span>
              </p>
            )}
          </div>
        </div>

        {req?.notes && (
          <div className="mb-5 px-4 py-3 bg-white rounded-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Worker Notes</p>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">{req.notes}</p>
          </div>
        )}

        {evidencePhotos.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Evidence ({evidencePhotos.length})</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {evidencePhotos.map((p, i) => {
                const url = p.url?.startsWith("http") ? p.url : `${SERVER}/${p.url}`;
                return (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-xl overflow-hidden border border-amber-200">
                    <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {!approved && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-amber-200">
            <button
              onClick={handleExtend}
              disabled={extending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-sm"
            >
              {extending ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {extending ? "Updating…" : `Approve & extend to ${newHrs}h`}
            </button>
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {dismissing ? <RefreshCw size={13} className="animate-spin" /> : <X size={13} />}
              Dismiss
            </button>
            <p className="w-full text-[10px] text-slate-400 font-medium">
              "Approve" updates the booking duration and amount, then use the <span className="font-bold text-slate-600">Domestic Hub</span> below to send the formal report to the customer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Extend job panel ──────────────────────────────────────────────────────────
const ExtendJobPanel = ({ booking, onUpdated }) => {
  const [extraHrs, setExtraHrs] = useState(1);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState(null);

  const bookedHrs  = parseFloat(booking?.details?.duration || booking?.workerDuration || 0);
  const currentAmt = parseFloat(booking?.payment?.amount   || 0);
  const hourlyRate = bookedHrs > 0 ? currentAmt / bookedHrs : null;
  const newHrs     = bookedHrs + extraHrs;
  const newAmt     = hourlyRate ? hourlyRate * newHrs : null;

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(false);
    try {
      const body = {
        details: { ...booking.details, duration: newHrs },
        ...(newAmt != null ? { payment: { ...booking.payment, amount: parseFloat(newAmt.toFixed(2)) } } : {}),
      };
      const res = await fetch(`${API}/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Update failed");
      setSuccess(true);
      if (onUpdated) onUpdated();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (!bookedHrs) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
      <SectionHead label="Extend Job" icon={PlusCircle} />
      <p className="text-xs text-slate-500 font-medium mb-5">Update duration if the job needs more time than originally booked.</p>

      {/* Before / after */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-slate-50 p-4 text-center border border-slate-100">
          <p className="text-2xl font-black text-slate-600 tabular-nums">{bookedHrs}h</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Booked</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 text-center border border-emerald-100">
          <p className="text-2xl font-black text-emerald-700 tabular-nums">{newHrs}h</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">New Total</p>
        </div>
      </div>

      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Extra Hours</p>
      <div className="flex items-center gap-1.5 mb-5">
        {[0.5, 1, 1.5, 2, 3].map(h => (
          <button
            key={h}
            onClick={() => setExtraHrs(h)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${extraHrs === h ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            +{h}h
          </button>
        ))}
      </div>

      {newAmt != null && (
        <div className="flex justify-between items-center mb-5 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <span className="text-xs font-bold text-slate-500">New Total Cost</span>
          <span className="font-black text-emerald-700">
            £{newAmt.toFixed(2)}
            <span className="text-xs text-slate-400 font-medium ml-1.5">(+£{(newAmt - currentAmt).toFixed(2)})</span>
          </span>
        </div>
      )}

      {success && <p className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-1.5"><CheckCircle2 size={13} /> Booking updated successfully</p>}
      {error   && <p className="text-xs font-bold text-rose-600 mb-3">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-sm"
      >
        {saving ? <RefreshCw size={13} className="animate-spin" /> : <PlusCircle size={13} />}
        {saving ? "Saving…" : `Save — extend to ${newHrs}h`}
      </button>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const JobDetail = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [booking, setBooking]       = useState(null);
  const [worker,  setWorker]        = useState(null);
  const [loading, setLoading]       = useState(true);
  const [liveLocation, setLiveLocation] = useState(null);
  const locationPollRef = useRef(null);

  const pollLocation = async (mongoId) => {
    try {
      const res = await fetch(`${API}/workers/jobs/${mongoId}/worker-location`);
      if (res.ok) { const d = await res.json(); setLiveLocation(d.sharing ? d : null); }
      else setLiveLocation(null);
    } catch { setLiveLocation(null); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/bookings/${id}`);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setBooking(data);
        if (data.assignedWorker) {
          const wr = await fetch(`${API}/workers/${data.assignedWorker}`);
          if (wr.ok) setWorker(await wr.json());
        }
        if (["Assigned", "Arrived", "In Progress"].includes(data.status) && data._id) {
          pollLocation(data._id);
          locationPollRef.current = setInterval(() => pollLocation(data._id), 15000);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
    return () => { if (locationPollRef.current) clearInterval(locationPollRef.current); };
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-10 w-10 border-4 border-primary border-r-transparent rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <AlertTriangle size={40} className="text-rose-400" />
      <p className="text-xl font-black text-slate-700">Booking not found</p>
      <button onClick={() => navigate(-1)} className="btn-primary py-3 px-6">Go Back</button>
    </div>
  );

  const photos       = booking.photos || [];
  const beforePhotos = photos.filter(p => p.photoType === "before");
  const afterPhotos  = photos.filter(p => p.photoType === "after");
  const damagePhotos = photos.filter(p => p.photoType === "damage");

  const totalActualMins = booking.jobDurationActual || diffMins(booking.jobStartTime, booking.jobEndTime) || 0;
  const actualHrs       = (totalActualMins / 60).toFixed(1);
  const arrivedToStart  = diffMins(booking.jobArrivedTime, booking.jobStartTime);

  const extras = Array.isArray(booking.details?.extras)
    ? booking.details.extras.filter(e => e?.qty > 0)
    : Object.entries(booking.extras || {}).filter(([, v]) => v > 0).map(([name, qty]) => ({ name, qty }));

  const statusStyle = STATUS_STYLE[booking.status] || { pill: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
  const isLive      = ["Assigned", "Arrived", "In Progress"].includes(booking.status);

  const currency = "£";

  const initials = (f, l) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase() || "?";

  const detailFields = [
    { label: "Service",           value: booking.service,                icon: Layers },
    { label: "Date",              value: fmtDate(booking.schedule?.date), icon: Calendar },
    { label: "Time Slot",         value: booking.schedule?.timeSlot,      icon: Clock },
    { label: "Address",           value: booking.details?.address,        icon: MapPin },
    { label: "Postcode",          value: booking.details?.postcode,       icon: Home },
    { label: "Booked Duration",   value: booking.details?.duration ? `${booking.details.duration} hrs` : null, icon: Timer },
    { label: "Bedrooms",          value: booking.details?.bedrooms || booking.property?.bedrooms },
    { label: "Bathrooms",         value: booking.details?.bathrooms || booking.property?.bathrooms },
    { label: "Kitchens",          value: booking.details?.kitchens || booking.property?.kitchens },
    { label: "Reception Rooms",   value: booking.details?.receptionRooms || booking.property?.receptionRooms },
    { label: "Notes",             value: booking.details?.notes || booking.details?.specialInstructions },
    { label: "Supplies By",       value: booking.suppliesProvidedBy },
    { label: "Lead Source",       value: booking.leadSource },
  ].filter(f => f.value != null && f.value !== "");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Back nav ─────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Jobs
      </button>

      {/* ── Hero header ──────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse" />
        )}

        <div className="relative">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Booking ID</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">{booking.bookingId}</h1>
              <p className="text-slate-300 font-semibold mt-1 text-sm">{booking.service}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide border ${statusStyle.pill}`}>
                {isLive && <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} animate-pulse`} />}
                {booking.status}
              </span>
              {booking.assignedWorkerName && (
                <span className="text-[11px] font-bold text-slate-400">
                  <span className="text-slate-500">Worker:</span> <span className="text-slate-200">{booking.assignedWorkerName}</span>
                </span>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-slate-800">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Date</p>
              <p className="text-white font-black text-sm">
                {booking.schedule?.date
                  ? new Date(booking.schedule.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : new Date(booking.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Time</p>
              <p className="text-white font-black text-sm">{booking.schedule?.timeSlot || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Duration</p>
              <p className="text-white font-black text-sm tabular-nums">
                {booking.details?.duration ? `${booking.details.duration}h booked` : "—"}
                {totalActualMins > 0 && <span className="text-sky-400 ml-1">({actualHrs}h actual)</span>}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Amount</p>
              <p className={`font-black text-sm tabular-nums ${booking.payment?.amount ? "text-emerald-400" : "text-slate-500"}`}>
                {booking.payment?.amount ? `${currency}${booking.payment.amount}` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Extra time request banner ─────────────────────────────── */}
      {booking.meta?.extraTimeRequest && (
        <ExtraTimeRequestCard booking={booking} onUpdated={() => window.location.reload()} />
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Timeline */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <SectionHead label="Job Timeline" icon={Clock} />
            <Timeline booking={booking} />

            {/* Duration stats */}
            {totalActualMins > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 text-center">
                    <p className="text-2xl font-black text-primary tabular-nums">{actualHrs}h</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Actual Duration</p>
                  </div>
                  {booking.workerDuration && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                      <p className="text-2xl font-black text-slate-700 tabular-nums">{booking.workerDuration}h</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Expected</p>
                    </div>
                  )}
                  {arrivedToStart != null && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                      <p className="text-2xl font-black text-slate-700 tabular-nums">{arrivedToStart}m</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Arrival → Start</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live location */}
          {isLive && (
            <div className={`rounded-3xl border p-6 shadow-sm ${liveLocation ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"}`}>
              <SectionHead
                label="Live Worker Location"
                icon={Radio}
                right={liveLocation && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE · auto-refresh 15s
                  </span>
                )}
              />
              {liveLocation ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-3 border border-emerald-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitude</p>
                      <p className="text-sm font-black text-slate-800 tabular-nums">{liveLocation.lat?.toFixed(6)}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-emerald-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitude</p>
                      <p className="text-sm font-black text-slate-800 tabular-nums">{liveLocation.lng?.toFixed(6)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">Last updated: {liveLocation.lastUpdated ? new Date(liveLocation.lastUpdated).toLocaleTimeString("en-GB") : "—"}</p>
                  <a
                    href={`https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Navigation size={13} /> Open in Google Maps
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-1">
                    <MapPin size={22} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No live location yet</p>
                  <p className="text-xs text-slate-300 font-medium">Sharing starts when the worker presses "I've Arrived"</p>
                </div>
              )}
            </div>
          )}

          {/* Photos */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <SectionHead
              label="Job Photos"
              icon={Camera}
              right={photos.length > 0 && (
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">
                  {photos.length} total
                </span>
              )}
            />

            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Camera size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">No photos uploaded yet</p>
                <p className="text-xs text-slate-300 font-medium">Photos appear here once the worker starts uploading</p>
              </div>
            ) : (
              <div className="space-y-6">
                {beforePhotos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Before ({beforePhotos.length})</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {beforePhotos.map((p, i) => (
                        <PhotoCard key={i} photo={p} label={`Before ${i + 1}`} badge="bg-slate-800/70 text-white" />
                      ))}
                    </div>
                  </div>
                )}
                {afterPhotos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">After ({afterPhotos.length})</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {afterPhotos.map((p, i) => (
                        <PhotoCard key={i} photo={p} label={`After ${i + 1}`} badge="bg-emerald-800/70 text-white" />
                      ))}
                    </div>
                  </div>
                )}
                {damagePhotos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Damage Report ({damagePhotos.length})</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {damagePhotos.map((p, i) => (
                        <PhotoCard key={i} photo={p} label={`Damage ${i + 1}`} badge="bg-rose-800/70 text-white" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Worker report */}
          {booking.workerReport && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <SectionHead label="Worker Report" icon={FileText} />
              <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{booking.workerReport}</p>
            </div>
          )}

          {/* Domestic property report */}
          <DomesticPropertyReport booking={booking} />

          {/* Job details */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <SectionHead label="Job Details" icon={Layers} />

            <div className="grid sm:grid-cols-2 gap-3">
              {detailFields.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    {Icon && <Icon size={11} className="text-slate-400" />}
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-snug">{String(value)}</p>
                </div>
              ))}
            </div>

            {extras.length > 0 && (
              <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Extras</p>
                <div className="flex flex-wrap gap-2">
                  {extras.map((e, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                      {e.name} × {e.qty}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Customer */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <SectionHead label="Customer" icon={User} />
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                {initials(booking.customer?.firstName, booking.customer?.lastName)}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-sm leading-tight">{booking.customer?.firstName} {booking.customer?.lastName}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{booking.customer?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              {booking.customer?.phone && (
                <a href={`tel:${booking.customer.phone}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-primary/5 hover:text-primary transition-colors group w-full border border-slate-100">
                  <Phone size={14} className="text-slate-400 group-hover:text-primary shrink-0" />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-primary">{booking.customer.phone}</span>
                </a>
              )}
              {booking.customer?.email && (
                <a href={`mailto:${booking.customer.email}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-primary/5 hover:text-primary transition-colors group w-full border border-slate-100 min-w-0">
                  <Mail size={14} className="text-slate-400 group-hover:text-primary shrink-0" />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-primary truncate">{booking.customer.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Worker */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <SectionHead label="Assigned Worker" icon={Briefcase} />
            {booking.assignedWorkerName ? (
              <>
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                    {initials(...(booking.assignedWorkerName?.split(" ") || []))}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-sm leading-tight">{booking.assignedWorkerName}</p>
                    {worker && <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{worker.email}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  {worker?.phone && (
                    <a href={`tel:${worker.phone}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-primary/5 hover:text-primary transition-colors group w-full border border-slate-100">
                      <Phone size={14} className="text-slate-400 group-hover:text-primary shrink-0" />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-primary">{worker.phone}</span>
                    </a>
                  )}
                  {booking.workerRate && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Banknote size={14} className="text-slate-400 shrink-0" />
                      <span className="text-sm font-bold text-slate-700">£{booking.workerRate}/hr</span>
                    </div>
                  )}
                  {booking.jobAcceptedTime && (
                    <p className="text-[11px] text-slate-400 font-semibold px-1 flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="text-emerald-500" />
                      Accepted {fmt(booking.jobAcceptedTime)}
                    </p>
                  )}
                </div>
                {worker && (
                  <Link to="/admin/workers" className="mt-4 flex items-center gap-1.5 text-xs font-black text-primary hover:underline">
                    View worker profile <ChevronRight size={12} />
                  </Link>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <User size={22} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">Not yet assigned</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <SectionHead label="Payment" icon={Banknote} />

            {/* Big amount */}
            <div className="text-center py-4 mb-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-4xl font-black text-slate-900 tabular-nums">
                {booking.payment?.amount ? `${currency}${booking.payment.amount}` : "—"}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                  booking.payment?.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  booking.payment?.status === "Authorized" ? "bg-sky-50 text-sky-700 border-sky-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {booking.payment?.status || "Pending"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: "Method",  value: booking.payment?.method || "—" },
                { label: "Billing", value: booking.payment?.billingType ? (booking.payment.billingType.charAt(0).toUpperCase() + booking.payment.billingType.slice(1)) : "Hourly" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-400">{label}</span>
                  <span className="text-sm font-bold text-slate-700">{value}</span>
                </div>
              ))}
              {booking.noPaymentRequired && (
                <p className="text-xs text-slate-500 font-medium bg-slate-50 rounded-xl px-3 py-2 mt-2">
                  No payment required — paid outside system
                </p>
              )}
            </div>
          </div>

          {/* Extend job */}
          {booking.payment?.billingType !== "flat" && booking.details?.duration && !["Completed", "Cancelled"].includes(booking.status) && (
            <ExtendJobPanel booking={booking} onUpdated={() => window.location.reload()} />
          )}

          {/* Quick actions */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <SectionHead label="Quick Actions" />
            <div className="space-y-1.5">
              {[
                { to: "/admin/bookings", label: "All Bookings" },
                { to: "/admin/chat",     label: "Open Chat"    },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-primary/5 transition-colors group border border-slate-100"
                >
                  <span className="text-sm font-bold text-slate-700 group-hover:text-primary">{label}</span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
