import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Camera, Clock, CheckCircle2, MapPin, Timer,
  AlertCircle, User, ChevronRight, Briefcase, Image,
  TrendingUp, Activity, CalendarCheck, XCircle
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const STATUS_META = {
  Pending:              { dot: "bg-amber-400",  ring: "ring-amber-100",  pill: "bg-amber-50 text-amber-700 border-amber-200" },
  Confirmed:            { dot: "bg-emerald-400", ring: "ring-emerald-100", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Assigned:             { dot: "bg-violet-400",  ring: "ring-violet-100",  pill: "bg-violet-50 text-violet-700 border-violet-200" },
  Arrived:              { dot: "bg-sky-400",     ring: "ring-sky-100",     pill: "bg-sky-50 text-sky-700 border-sky-200" },
  "In Progress":        { dot: "bg-blue-500",    ring: "ring-blue-100",    pill: "bg-blue-50 text-blue-700 border-blue-200",  live: true },
  Completed:            { dot: "bg-slate-400",   ring: "ring-slate-100",   pill: "bg-slate-100 text-slate-600 border-slate-200" },
  "Completed - Unpaid": { dot: "bg-purple-500",  ring: "ring-purple-100",  pill: "bg-purple-50 text-purple-700 border-purple-200" },
  Cancelled:            { dot: "bg-rose-400",    ring: "ring-rose-100",    pill: "bg-rose-50 text-rose-600 border-rose-200" },
};

const FILTERS = [
  { key: "All",                label: "All" },
  { key: "Live",               label: "Live" },
  { key: "In Progress",        label: "In Progress" },
  { key: "Assigned",           label: "Assigned" },
  { key: "Confirmed",          label: "Confirmed" },
  { key: "Completed",          label: "Completed" },
  { key: "Completed - Unpaid", label: "Unpaid" },
  { key: "Cancelled",          label: "Cancelled" },
];

const LIVE_STATUSES = ["Assigned", "Arrived", "In Progress"];

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

const JobCard = ({ booking, onClick }) => {
  const photos   = booking.photos || [];
  const meta     = STATUS_META[booking.status] || STATUS_META["Pending"];
  const isLive   = LIVE_STATUSES.includes(booking.status);
  const isUnpaid = booking.status === "Completed - Unpaid";

  const stages = [
    { key: "jobAcceptedTime", label: "Accepted", icon: CheckCircle2, active: "text-emerald-500" },
    { key: "jobArrivedTime",  label: "Arrived",  icon: MapPin,        active: "text-sky-500" },
    { key: "jobStartTime",    label: "Started",  icon: Timer,         active: "text-amber-500" },
    { key: "jobEndTime",      label: "Done",     icon: Clock,         active: "text-primary" },
  ];

  const totalMins =
    booking.jobDurationActual ||
    (booking.jobStartTime && booking.jobEndTime
      ? Math.round((new Date(booking.jobEndTime) - new Date(booking.jobStartTime)) / 60000)
      : 0);

  const stagesCompleted = stages.filter(s => !!booking[s.key]).length;

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Live pulse strip */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-primary to-blue-400 animate-[pulse_2s_ease-in-out_infinite]" />
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-black text-slate-800 tracking-tight">{booking.bookingId}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${meta.pill}`}>
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                {booking.status}
              </span>
              {isUnpaid && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-200">
                  Invoice Sent
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-semibold truncate leading-tight">{booking.service}</p>
          </div>
          <ChevronRight
            size={15}
            className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
          />
        </div>

        {/* People */}
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <User size={11} className="text-slate-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 truncate">
              {booking.customer?.firstName} {booking.customer?.lastName}
            </span>
          </div>
          {booking.assignedWorkerName ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase size={10} className="text-primary" />
              </div>
              <span className="text-[11px] font-bold text-primary truncate">{booking.assignedWorkerName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertCircle size={10} className="text-amber-400" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400">No worker assigned</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timeline</span>
            <span className="text-[9px] font-black text-slate-400">{stagesCompleted}/4 stages</span>
          </div>
          <div className="flex items-center gap-1">
            {stages.map(({ key, label, icon: Icon, active }) => (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-1 rounded-full transition-colors ${booking[key] ? "bg-primary" : "bg-slate-100"}`} />
                <Icon
                  size={10}
                  className={booking[key] ? active : "text-slate-200"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Image size={11} className="text-slate-300" />
              <span className={`text-[10px] font-bold ${photos.some(p => p.photoType === "before") ? "text-emerald-500" : "text-slate-200"}`}>B</span>
              <span className={`text-[10px] font-bold ${photos.some(p => p.photoType === "after") ? "text-emerald-500" : "text-slate-200"}`}>A</span>
              {photos.some(p => p.photoType === "damage") && (
                <span className="text-[10px] font-black text-rose-500">D</span>
              )}
            </div>
            {totalMins > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                <Clock size={9} />
                {(totalMins / 60).toFixed(1)}h
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {booking.schedule?.date
              ? fmt(booking.schedule.date)
              : fmt(booking.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon: Icon, color, bg }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm`}>
    <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full ${bg} opacity-60`} />
    <div className="relative">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${bg} mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className={`text-3xl font-black ${color} leading-none mb-1`}>{value}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 font-semibold mt-1">{sub}</p>}
    </div>
  </div>
);

const Jobs = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch(`${API}/bookings`)
      .then(r => r.json())
      .then(data =>
        setBookings(
          Array.isArray(data)
            ? data
                .filter(b => b.status !== "Blackout")
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            : []
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.bookingId?.toLowerCase().includes(q) ||
      b.customer?.firstName?.toLowerCase().includes(q) ||
      b.customer?.lastName?.toLowerCase().includes(q) ||
      b.assignedWorkerName?.toLowerCase().includes(q) ||
      b.service?.toLowerCase().includes(q) ||
      b.customer?.email?.toLowerCase().includes(q);

    const matchFilter =
      filter === "All"  ? true :
      filter === "Live" ? LIVE_STATUSES.includes(b.status) :
      b.status === filter;

    return matchSearch && matchFilter;
  });

  const stats = {
    total:      bookings.length,
    live:       bookings.filter(b => LIVE_STATUSES.includes(b.status)).length,
    completed:  bookings.filter(b => b.status === "Completed" || b.status === "Completed - Unpaid").length,
    withPhotos: bookings.filter(b => (b.photos || []).length > 0).length,
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity size={18} className="text-primary" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Job Tracker</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium ml-12">
            Monitor all cleaning jobs — timelines, photos, workers and real‑time progress.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Jobs"
            value={stats.total}
            icon={CalendarCheck}
            color="text-primary"
            bg="bg-primary/10"
          />
          <StatCard
            label="Live Now"
            value={stats.live}
            sub={stats.live > 0 ? "Active in the field" : "None active"}
            icon={Activity}
            color="text-sky-600"
            bg="bg-sky-50"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatCard
            label="With Photos"
            value={stats.withPhotos}
            icon={Camera}
            color="text-violet-600"
            bg="bg-violet-50"
          />
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search booking ID, customer, worker, service..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                  filter === f.key
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f.key === "Live" && stats.live > 0 && filter !== "Live" && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse inline-block" />
                    {f.label} <span className="text-sky-600">·{stats.live}</span>
                  </span>
                )}
                {!(f.key === "Live" && stats.live > 0 && filter !== "Live") && f.label}
              </button>
            ))}
            {filter !== "All" && (
              <button
                onClick={() => setFilter("All")}
                className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-xs font-bold text-slate-400 mb-4">
            {filtered.length === bookings.length
              ? `${bookings.length} jobs`
              : `${filtered.length} of ${bookings.length} jobs`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-4 border-primary border-r-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400">Loading jobs...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <TrendingUp size={24} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-black text-slate-400">No jobs found</p>
              <p className="text-sm text-slate-300 font-medium mt-1">
                {search ? `Nothing matching "${search}"` : "Try a different filter"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(b => (
              <JobCard
                key={b._id}
                booking={b}
                onClick={() => navigate(`/admin/jobs/${b._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
