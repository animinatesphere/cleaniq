import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Camera, Clock, CheckCircle2, MapPin, Timer,
  AlertCircle, User, ChevronRight, Briefcase, Image,
  TrendingUp, Activity, CalendarCheck, XCircle, LayoutGrid,
  List, SortAsc,
} from "lucide-react";

import StatDetailDrawer from "./StatDetailDrawer";

const API = import.meta.env.VITE_API_URL;

const STATUS_META = {
  Pending:              { dot: "bg-amber-400",   pill: "bg-amber-500/15 text-amber-400 border-amber-500/25",     stripe: "bg-amber-400"   },
  Confirmed:            { dot: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", stripe: "bg-emerald-400" },
  Assigned:             { dot: "bg-violet-400",  pill: "bg-violet-500/15 text-violet-400 border-violet-500/25",   stripe: "bg-violet-400"  },
  Arrived:              { dot: "bg-sky-400",     pill: "bg-sky-500/15 text-sky-400 border-sky-500/25",            stripe: "bg-sky-400"     },
  "In Progress":        { dot: "bg-blue-500",    pill: "bg-blue-500/15 text-blue-400 border-blue-500/25",         stripe: "bg-blue-500",   live: true },
  Completed:            { dot: "bg-white/30",    pill: "bg-white/5 text-white/40 border-white/10",                stripe: "bg-white/25"    },
  "Completed - Unpaid": { dot: "bg-violet-500",  pill: "bg-violet-500/15 text-violet-400 border-violet-500/25",   stripe: "bg-violet-500"  },
  Cancelled:            { dot: "bg-rose-400",    pill: "bg-rose-500/15 text-rose-400 border-rose-500/25",         stripe: "bg-rose-400"    },
};

const FILTERS = [
  { key: "All",                label: "All"         },
  { key: "Live",               label: "Live"        },
  { key: "In Progress",        label: "In Progress" },
  { key: "Assigned",           label: "Assigned"    },
  { key: "Confirmed",          label: "Confirmed"   },
  { key: "Completed",          label: "Completed"   },
  { key: "Completed - Unpaid", label: "Unpaid"      },
  { key: "Cancelled",          label: "Cancelled"   },
];

const SORT_OPTIONS = [
  { key: "date_desc", label: "Newest first"   },
  { key: "date_asc",  label: "Oldest first"   },
  { key: "status",    label: "By status"      },
  { key: "service",   label: "By service"     },
];

const LIVE_STATUSES = ["Assigned", "Arrived", "In Progress"];

const STAGES = [
  { key: "jobAcceptedTime", label: "Accepted" },
  { key: "jobArrivedTime",  label: "Arrived"  },
  { key: "jobStartTime",    label: "Started"  },
  { key: "jobEndTime",      label: "Done"     },
];

const fmtShort = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";

const JobCard = ({ booking, onClick }) => {
  const photos = booking.photos || [];
  const meta   = STATUS_META[booking.status] || STATUS_META["Pending"];
  const isLive = LIVE_STATUSES.includes(booking.status);
  const done   = STAGES.filter(s => !!booking[s.key]).length;
  const totalMins =
    booking.jobDurationActual ||
    (booking.jobStartTime && booking.jobEndTime
      ? Math.round((new Date(booking.jobEndTime) - new Date(booking.jobStartTime)) / 60000)
      : 0);

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#0B2D22] rounded-2xl border border-white/7 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${meta.stripe}`} />

      {isLive && (
        <div className="absolute top-0 left-1 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-primary to-transparent animate-pulse" />
      )}

      <div className="pl-5 pr-5 pt-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-black text-white tracking-tight tabular-nums">{booking.bookingId}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${meta.pill}`}>
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                {booking.status}
              </span>
              {booking.status === "Completed - Unpaid" && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/25">Invoice Sent</span>
              )}
              {booking.meta?.extraTimeRequest?.status === "pending" && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/25 animate-pulse">⏱ Extra Time</span>
              )}
            </div>
            <p className="text-[11px] text-white/40 font-semibold truncate">{booking.service}</p>
          </div>
          <ChevronRight size={15} className="text-white/25 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <User size={11} className="text-white/30" />
            </div>
            <span className="text-[11px] font-bold text-white/60 truncate">{booking.customer?.firstName} {booking.customer?.lastName}</span>
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
              <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertCircle size={10} className="text-amber-400" />
              </div>
              <span className="text-[11px] text-white/40 font-semibold">No worker assigned</span>
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-0.5 mb-1">
            {STAGES.map(s => (
              <div key={s.key} className={`flex-1 h-1.5 rounded-full transition-colors ${booking[s.key] ? "bg-primary" : "bg-white/10"}`} />
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Progress</span>
            <span className="text-[9px] font-black text-white/40">{done}/4 stages</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <span className={`text-[10px] font-bold ${photos.some(p => p.photoType === "before") ? "text-emerald-400" : "text-white/25"}`}>B</span>
              <span className={`text-[10px] font-bold ${photos.some(p => p.photoType === "after")  ? "text-emerald-400" : "text-white/25"}`}>A</span>
              {photos.some(p => p.photoType === "damage") && <span className="text-[10px] font-black text-rose-400">D</span>}
            </div>
            {totalMins > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                <Clock size={9} />{(totalMins / 60).toFixed(1)}h
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-white/40 tabular-nums">
            {fmtShort(booking.schedule?.date || booking.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

const JobRow = ({ booking, onClick }) => {
  const photos = booking.photos || [];
  const meta   = STATUS_META[booking.status] || STATUS_META["Pending"];
  const isLive = LIVE_STATUSES.includes(booking.status);
  const done   = STAGES.filter(s => !!booking[s.key]).length;

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.06] last:border-0 hover:bg-[#0A2A1F] cursor-pointer transition-colors"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot} ${isLive ? "animate-pulse" : ""}`} />

      <span className="text-[11px] font-black text-white w-24 shrink-0 tabular-nums">{booking.bookingId}</span>

      <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${meta.pill} shrink-0 w-36 justify-center`}>
        {booking.status}
      </span>

      <span className="text-xs font-semibold text-white/60 flex-1 truncate min-w-0">{booking.service}</span>

      <span className="hidden md:block text-xs text-white/40 font-medium w-36 truncate shrink-0">
        {booking.customer?.firstName} {booking.customer?.lastName}
      </span>

      <span className={`hidden lg:block text-xs font-semibold w-32 truncate shrink-0 ${booking.assignedWorkerName ? "text-primary" : "text-white/25"}`}>
        {booking.assignedWorkerName || "Unassigned"}
      </span>

      <div className="hidden sm:flex items-center gap-0.5 w-14 shrink-0">
        {STAGES.map(s => (
          <div key={s.key} className={`flex-1 h-1.5 rounded-full ${booking[s.key] ? "bg-primary" : "bg-white/10"}`} />
        ))}
      </div>

      <div className="hidden lg:flex items-center gap-0.5 w-10 shrink-0">
        <span className={`text-[10px] font-bold ${photos.some(p => p.photoType === "before") ? "text-emerald-400" : "text-white/25"}`}>B</span>
        <span className={`text-[10px] font-bold ${photos.some(p => p.photoType === "after")  ? "text-emerald-400" : "text-white/25"}`}>A</span>
        {photos.some(p => p.photoType === "damage") && <span className="text-[10px] font-black text-rose-400">D</span>}
      </div>

      {booking.meta?.extraTimeRequest?.status === "pending" && (
        <span className="text-[9px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/25 rounded-full px-1.5 py-0.5 animate-pulse shrink-0">⏱</span>
      )}

      <span className="text-[11px] text-white/40 font-bold shrink-0 w-16 text-right tabular-nums">
        {fmtShort(booking.schedule?.date || booking.createdAt)}
      </span>

      <ChevronRight size={13} className="text-white/25 group-hover:text-primary transition-colors shrink-0" />
    </div>
  );
};

const StatCard = ({ label, value, sub, icon: Icon, color, bg, onClick }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-white/7 bg-[#0B2D22] p-5${onClick ? " cursor-pointer" : ""}`} onClick={onClick}>
    <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${bg} opacity-40`} />
    <div className="relative">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${bg} mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className={`text-3xl font-black ${color} leading-none mb-1 tabular-nums`}>{value}</p>
      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</p>
      {sub && <p className="text-[10px] text-white/40 font-semibold mt-1">{sub}</p>}
    </div>
  </div>
);

const Jobs = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("All");
  const [view,     setView]     = useState("grid");
  const [sort,     setSort]     = useState("date_desc");
  const [drawer,   setDrawer]   = useState(null);

  useEffect(() => {
    fetch(`${API}/bookings`)
      .then(r => r.json())
      .then(data =>
        setBookings(Array.isArray(data) ? data.filter(b => b.status !== "Blackout" && b.status !== "Cancelled") : [])
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filterCounts = useMemo(() => {
    const c = { All: bookings.length, Live: 0 };
    bookings.forEach(b => {
      if (LIVE_STATUSES.includes(b.status)) c.Live = (c.Live || 0) + 1;
      c[b.status] = (c[b.status] || 0) + 1;
    });
    return c;
  }, [bookings]);

  const filtered = useMemo(() =>
    bookings
      .filter(b => {
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
      })
      .sort((a, b) => {
        if (sort === "date_desc") return new Date(b.createdAt) - new Date(a.createdAt);
        if (sort === "date_asc")  return new Date(a.createdAt) - new Date(b.createdAt);
        if (sort === "status")    return (a.status  || "").localeCompare(b.status  || "");
        if (sort === "service")   return (a.service || "").localeCompare(b.service || "");
        return 0;
      }),
  [bookings, search, filter, sort]);

  const liveJobs      = bookings.filter(b => LIVE_STATUSES.includes(b.status));
  const completedJobs = bookings.filter(b => b.status === "Completed" || b.status === "Completed - Unpaid");
  const photoJobs     = bookings.filter(b => (b.photos || []).length > 0);

  const stats = {
    total:      bookings.length,
    live:       liveJobs.length,
    completed:  completedJobs.length,
    withPhotos: photoJobs.length,
  };

  return (
    <div className="min-h-screen bg-[#061A13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity size={18} className="text-primary" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Job Tracker</h1>
            </div>
            <p className="text-sm text-white/40 font-medium ml-12">
              Monitor all cleaning jobs — timelines, photos, workers and real‑time progress.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#071D16] border border-white/10 rounded-xl p-1 self-start">
            <button
              onClick={() => setView("grid")}
              title="Grid view"
              className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-primary text-white shadow-sm" : "text-white/40 hover:text-white/60"}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              title="List view"
              className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-primary text-white shadow-sm" : "text-white/40 hover:text-white/60"}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Jobs"   value={stats.total}      icon={CalendarCheck}  color="text-primary"     bg="bg-primary/10"     onClick={() => setDrawer({ title: "All Jobs", subtitle: `${bookings.length} jobs`, items: bookings, accentColor: "emerald", renderItem: (b) => ( <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-white/85 truncate">{b.service}</p><p className="text-xs text-white/40 truncate">{b.customer?.firstName} {b.customer?.lastName}{b.assignedWorkerName ? ` · ${b.assignedWorkerName}` : ""}{b.schedule?.date ? ` · ${new Date(b.schedule.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}` : ""}</p></div><span className="text-[11px] font-semibold text-white/60 shrink-0">£{Number(b.payment?.amount||0).toFixed(0)}</span></div> ) })} />
          <StatCard label="Live Now"     value={stats.live}       sub={stats.live > 0 ? "Active in the field" : "None active"} icon={Activity} color="text-sky-400" bg="bg-sky-500/10"    onClick={() => setDrawer({ title: "Live Jobs", subtitle: `${liveJobs.length} active in field`, items: liveJobs, accentColor: "blue", renderItem: (b) => ( <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-white/85 truncate">{b.service}</p><p className="text-xs text-white/40 truncate">{b.customer?.firstName} {b.customer?.lastName}{b.assignedWorkerName ? ` · ${b.assignedWorkerName}` : ""}{b.schedule?.date ? ` · ${new Date(b.schedule.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}` : ""}</p></div><span className="text-[11px] font-semibold text-white/60 shrink-0">£{Number(b.payment?.amount||0).toFixed(0)}</span></div> ) })} />
          <StatCard label="Completed"    value={stats.completed}  icon={CheckCircle2}   color="text-emerald-400" bg="bg-emerald-500/10" onClick={() => setDrawer({ title: "Completed Jobs", subtitle: `${completedJobs.length} jobs`, items: completedJobs, accentColor: "emerald", renderItem: (b) => ( <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-white/85 truncate">{b.service}</p><p className="text-xs text-white/40 truncate">{b.customer?.firstName} {b.customer?.lastName}{b.assignedWorkerName ? ` · ${b.assignedWorkerName}` : ""}{b.schedule?.date ? ` · ${new Date(b.schedule.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}` : ""}</p></div><span className="text-[11px] font-semibold text-white/60 shrink-0">£{Number(b.payment?.amount||0).toFixed(0)}</span></div> ) })} />
          <StatCard label="With Photos"  value={stats.withPhotos} icon={Camera}         color="text-violet-400"  bg="bg-violet-500/10"  onClick={() => setDrawer({ title: "Jobs With Photos", subtitle: `${photoJobs.length} jobs`, items: photoJobs, accentColor: "violet", renderItem: (b) => ( <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-white/85 truncate">{b.service}</p><p className="text-xs text-white/40 truncate">{b.customer?.firstName} {b.customer?.lastName}{b.assignedWorkerName ? ` · ${b.assignedWorkerName}` : ""}{b.schedule?.date ? ` · ${new Date(b.schedule.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}` : ""}</p></div><span className="text-[11px] font-semibold text-white/60 shrink-0">£{Number(b.payment?.amount||0).toFixed(0)}</span></div> ) })} />
        </div>

        <div className="bg-[#0B2D22] rounded-2xl border border-white/7 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search booking ID, customer, worker, service..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#071D16] text-sm font-semibold text-white placeholder:font-normal placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="relative shrink-0">
              <SortAsc size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="pl-8 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#071D16] text-[11px] font-black text-white/60 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            {FILTERS.map(f => {
              const count = filterCounts[f.key] || 0;
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap shrink-0 ${
                    active ? "bg-primary text-white shadow-sm shadow-primary/20" : "bg-white/5 text-white/40 hover:bg-white/10"
                  }`}
                >
                  {f.key === "Live" && stats.live > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${active ? "bg-white" : "bg-sky-500"}`} />
                  )}
                  {f.label}
                  {count > 0 && !active && (
                    <span className="ml-0.5 bg-white/10 text-white/40 rounded-full px-1.5 py-px text-[9px] font-black tabular-nums">{count}</span>
                  )}
                </button>
              );
            })}
            {filter !== "All" && (
              <button
                onClick={() => setFilter("All")}
                className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-white/30 hover:text-white/60 transition-colors shrink-0"
              >
                <XCircle size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {!loading && (
          <p className="text-xs font-bold text-white/40 mb-4">
            {filtered.length === bookings.length
              ? `${bookings.length} jobs`
              : `${filtered.length} of ${bookings.length} jobs`}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-4 border-primary border-r-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-white/40">Loading jobs...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
              <TrendingUp size={24} className="text-white/25" />
            </div>
            <div className="text-center">
              <p className="font-black text-white/40">No jobs found</p>
              <p className="text-sm text-white/25 font-medium mt-1">
                {search ? `Nothing matching "${search}"` : "Try a different filter"}
              </p>
            </div>
          </div>
        ) : view === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(b => (
              <JobCard key={b._id} booking={b} onClick={() => navigate(`/admin/jobs/${b._id}`)} />
            ))}
          </div>
        ) : (
          <div className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden">
            <div className="hidden sm:flex items-center gap-4 px-5 py-3 border-b border-white/7 bg-[#071D16]">
              <div className="w-2 shrink-0" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest w-24 shrink-0">ID</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest w-36 shrink-0">Status</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex-1">Service</span>
              <span className="hidden md:block text-[10px] font-black text-white/40 uppercase tracking-widest w-36 shrink-0">Customer</span>
              <span className="hidden lg:block text-[10px] font-black text-white/40 uppercase tracking-widest w-32 shrink-0">Worker</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest w-14 shrink-0">Progress</span>
              <span className="hidden lg:block text-[10px] font-black text-white/40 uppercase tracking-widest w-10 shrink-0">Photos</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest w-16 text-right shrink-0">Date</span>
              <div className="w-4 shrink-0" />
            </div>
            {filtered.map(b => (
              <JobRow key={b._id} booking={b} onClick={() => navigate(`/admin/jobs/${b._id}`)} />
            ))}
          </div>
        )}
      </div>

      <StatDetailDrawer
        isOpen={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.title || ""}
        subtitle={drawer?.subtitle || ""}
        items={drawer?.items || []}
        renderItem={drawer?.renderItem}
        onViewAll={drawer?.onViewAll}
        accentColor={drawer?.accentColor || "emerald"}
      />
    </div>
  );
};

export default Jobs;
