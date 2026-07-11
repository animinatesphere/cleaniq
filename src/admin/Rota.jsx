import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarRange, ChevronLeft, ChevronRight, RefreshCw, X,
  UserPlus, Clock, MapPin, Users, CheckCircle2, AlertTriangle,
  Hourglass, Plus, ChevronDown, ChevronUp,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const WORKER_COLORS = [
  { bg: "bg-blue-50",    stripe: "bg-blue-400",    text: "text-blue-900",    sub: "text-blue-500",    avatar: "bg-blue-500",    header: "bg-blue-50 border-blue-200"    },
  { bg: "bg-violet-50",  stripe: "bg-violet-400",  text: "text-violet-900",  sub: "text-violet-500",  avatar: "bg-violet-500",  header: "bg-violet-50 border-violet-200"  },
  { bg: "bg-emerald-50", stripe: "bg-emerald-500", text: "text-emerald-900", sub: "text-emerald-600", avatar: "bg-emerald-600", header: "bg-emerald-50 border-emerald-200" },
  { bg: "bg-amber-50",   stripe: "bg-amber-400",   text: "text-amber-900",   sub: "text-amber-600",   avatar: "bg-amber-500",   header: "bg-amber-50 border-amber-200"    },
  { bg: "bg-rose-50",    stripe: "bg-rose-400",    text: "text-rose-900",    sub: "text-rose-500",    avatar: "bg-rose-500",    header: "bg-rose-50 border-rose-200"      },
  { bg: "bg-cyan-50",    stripe: "bg-cyan-500",    text: "text-cyan-900",    sub: "text-cyan-600",    avatar: "bg-cyan-600",    header: "bg-cyan-50 border-cyan-200"      },
  { bg: "bg-pink-50",    stripe: "bg-pink-400",    text: "text-pink-900",    sub: "text-pink-500",    avatar: "bg-pink-500",    header: "bg-pink-50 border-pink-200"      },
  { bg: "bg-indigo-50",  stripe: "bg-indigo-500",  text: "text-indigo-900",  sub: "text-indigo-500",  avatar: "bg-indigo-600",  header: "bg-indigo-50 border-indigo-200"  },
];

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
    {msg}
    <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
  </div>
);

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isRealBooking = (b) => b.status !== "Blackout" && b.customer?.firstName !== "ADMIN_BLOCK";
const initials = (f, l) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase() || "?";
const hoursOf  = (b) => Number(b.workerDuration || b.details?.duration || 0);

const urgencyTag = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(date); t.setHours(0, 0, 0, 0);
  const d = Math.round((t - today) / 86400000);
  if (d < 0)   return { label: "Overdue",   cls: "bg-rose-100 text-rose-700 border-rose-200" };
  if (d === 0) return { label: "Today",     cls: "bg-rose-50 text-rose-600 border-rose-100" };
  if (d === 1) return { label: "Tomorrow",  cls: "bg-amber-50 text-amber-600 border-amber-100" };
  return         { label: "This week",      cls: "bg-slate-100 text-slate-500 border-slate-200" };
};

export default function Rota() {
  const [weekStart, setWeekStart]     = useState(startOfWeek(new Date()));
  const [workers,   setWorkers]       = useState([]);
  const [bookings,  setBookings]      = useState([]);
  const [loading,   setLoading]       = useState(true);
  const [showUnassigned, setShowUnassigned] = useState(true);

  // sidebar-style assign (from unassigned list)
  const [assignTarget, setAssignTarget] = useState(null);
  const [pickedWorker, setPickedWorker] = useState("");
  const [pickedHours,  setPickedHours]  = useState("");

  // quick cell-assign (from + button in grid)
  const [cellAssign,   setCellAssign]   = useState(null);
  const [pickedBooking,setPickedBooking]= useState("");
  const [cellHours,    setCellHours]    = useState("");

  const [assigning, setAssigning] = useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/workers`).then(r => r.json()),
      fetch(`${API}/bookings`).then(r => r.json()),
    ])
      .then(([w, b]) => {
        setWorkers(Array.isArray(w) ? w.filter(x => x.status === "Active") : []);
        setBookings(Array.isArray(b) ? b : []);
      })
      .catch(() => showToast("Failed to load rota data", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }), [weekStart]);

  const dateKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayKey = dateKey(new Date());

  const weekBookings = useMemo(() => {
    const s = dateKey(days[0]), e = dateKey(days[6]);
    return bookings.filter(b => {
      if (!b.schedule?.date || !isRealBooking(b)) return false;
      const k = dateKey(new Date(b.schedule.date));
      return k >= s && k <= e;
    });
  }, [bookings, days]);

  const unassigned = useMemo(() =>
    weekBookings
      .filter(b => !b.assignedWorker && !b.assignedWorkerName)
      .sort((a, b) => new Date(a.schedule.date) - new Date(b.schedule.date)),
    [weekBookings]);

  const assignedThisWeek = useMemo(() =>
    weekBookings.filter(b => b.assignedWorker || b.assignedWorkerName),
    [weekBookings]);

  const totalHoursThisWeek = useMemo(() =>
    assignedThisWeek.reduce((s, b) => s + hoursOf(b), 0),
    [assignedThisWeek]);

  const shiftsFor = (workerId, day) => {
    const k = dateKey(day);
    return weekBookings.filter(b => {
      const id = typeof b.assignedWorker === "object" ? b.assignedWorker?._id : b.assignedWorker;
      return id === workerId && dateKey(new Date(b.schedule.date)) === k;
    });
  };

  const totalHoursForWorker = (workerId) =>
    assignedThisWeek
      .filter(b => {
        const id = typeof b.assignedWorker === "object" ? b.assignedWorker?._id : b.assignedWorker;
        return id === workerId;
      })
      .reduce((s, b) => s + hoursOf(b), 0);

  const openAssign = (booking) => {
    setAssignTarget(booking);
    setPickedWorker("");
    setPickedHours(booking.details?.duration || "");
  };

  const openCellAssign = (worker, day) => {
    const opts = unassigned.filter(b => dateKey(new Date(b.schedule.date)) === dateKey(day));
    if (!opts.length) return;
    setCellAssign({ worker, day, options: opts });
    setPickedBooking(opts[0]._id);
    setCellHours(opts[0]?.details?.duration || "");
  };

  const handleAssign = async () => {
    if (!pickedWorker) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API}/workers/jobs/${assignTarget._id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: pickedWorker, workerDuration: pickedHours || null }),
      });
      if (!res.ok) throw new Error("Failed to assign worker");
      showToast("Shift assigned — worker notified");
      setAssignTarget(null);
      fetchData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAssigning(false);
    }
  };

  const handleCellAssign = async () => {
    const booking = cellAssign.options.find(b => b._id === pickedBooking);
    if (!booking) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API}/workers/jobs/${booking._id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: cellAssign.worker._id, workerDuration: cellHours || null }),
      });
      if (!res.ok) throw new Error("Failed to assign worker");
      showToast("Shift assigned — worker notified");
      setCellAssign(null);
      fetchData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAssigning(false);
    }
  };

  const workerColorMap = useMemo(() => {
    const map = {};
    workers.forEach((w, i) => { map[w._id] = WORKER_COLORS[i % WORKER_COLORS.length]; });
    return map;
  }, [workers]);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const weekLabel = `${days[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CalendarRange size={22} className="text-primary" /> Rota
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Assign workers to bookings and manage the weekly schedule
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={prevWeek} className="px-3 py-2.5 hover:bg-slate-50 border-r border-slate-200 text-slate-500 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="px-5 text-sm font-bold text-slate-700 whitespace-nowrap select-none">
              {weekLabel}
            </span>
            <button onClick={nextWeek} className="px-3 py-2.5 hover:bg-slate-50 border-l border-slate-200 text-slate-500 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
          >
            Today
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users,         label: "Active Staff",    value: workers.length,          accent: "bg-blue-50 text-blue-600" },
          { icon: CheckCircle2,  label: "Shifts Assigned", value: assignedThisWeek.length, accent: "bg-emerald-50 text-emerald-600" },
          { icon: AlertTriangle, label: "Unassigned",      value: unassigned.length,       accent: unassigned.length > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400" },
          { icon: Hourglass,     label: "Hours Scheduled", value: `${totalHoursThisWeek}h`,accent: "bg-violet-50 text-violet-600" },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Full-width spreadsheet grid ─────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 980 }}>

            {/* Header row */}
            <thead>
              <tr>
                {/* Staff column header */}
                <th
                  className="sticky left-0 z-20 bg-slate-50 border border-slate-200 px-5 py-4 text-left"
                  style={{ minWidth: 200 }}
                >
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Staff Member</span>
                </th>

                {/* Day headers */}
                {days.map(d => {
                  const isToday   = dateKey(d) === todayKey;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th
                      key={dateKey(d)}
                      className={`border border-slate-200 px-4 py-4 text-center ${
                        isToday ? "bg-primary/8" : isWeekend ? "bg-slate-50" : "bg-white"
                      }`}
                    >
                      <p className={`text-[11px] font-bold uppercase tracking-widest leading-none ${isToday ? "text-primary" : "text-slate-400"}`}>
                        {d.toLocaleDateString("en-GB", { weekday: "short" })}
                      </p>
                      <p className={`text-2xl font-black tabular-nums leading-tight mt-0.5 ${
                        isToday ? "text-primary" : isWeekend ? "text-slate-400" : "text-slate-800"
                      }`}>
                        {d.getDate()}
                      </p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${isToday ? "text-primary/60" : "text-slate-300"}`}>
                        {d.toLocaleDateString("en-GB", { month: "short" })}
                      </p>
                      {isToday && <div className="w-5 h-0.5 bg-primary rounded-full mx-auto mt-1.5" />}
                    </th>
                  );
                })}

                {/* Hrs column header */}
                <th className="sticky right-0 z-10 bg-slate-50 border border-slate-200 px-4 py-4 text-center" style={{ minWidth: 80 }}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Hrs</span>
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center border border-slate-200">
                    <RefreshCw size={22} className="animate-spin inline text-slate-300" />
                    <p className="text-sm text-slate-300 font-semibold mt-3">Loading rota…</p>
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center border border-slate-200">
                    <Users size={40} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-sm text-slate-300 font-semibold">No active staff found</p>
                  </td>
                </tr>
              ) : (
                workers.map((w) => {
                  const color = workerColorMap[w._id] || WORKER_COLORS[0];
                  const weeklyHours = totalHoursForWorker(w._id);

                  return (
                    <tr key={w._id} className="group/row">

                      {/* Worker name cell (sticky) */}
                      <td
                        className="sticky left-0 z-10 bg-white border border-slate-200 px-5 py-4 align-middle"
                        style={{ minWidth: 200 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black text-white shrink-0 ${color.avatar}`}>
                            {initials(w.firstName, w.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 leading-tight">
                              {w.firstName} {w.lastName}
                            </p>
                            {w.role && (
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{w.role}</p>
                            )}
                            <p className={`text-[10px] font-bold mt-1 ${weeklyHours > 0 ? color.sub : "text-slate-300"}`}>
                              {weeklyHours > 0 ? `${weeklyHours}h this week` : "No shifts yet"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Day shift cells */}
                      {days.map(d => {
                        const shifts = shiftsFor(w._id, d);
                        const isToday   = dateKey(d) === todayKey;
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        const dayUnassigned = unassigned.filter(b => dateKey(new Date(b.schedule.date)) === dateKey(d));
                        const canAdd = dayUnassigned.length > 0;

                        return (
                          <td
                            key={dateKey(d)}
                            className={`border border-slate-200 px-3 py-3 align-top ${
                              isToday ? "bg-primary/5" : isWeekend ? "bg-slate-50/70" : "bg-white"
                            }`}
                            style={{ minWidth: 148, minHeight: 88 }}
                          >
                            <div className="flex flex-col gap-1.5 min-h-16">
                              {/* Shift cards */}
                              {shifts.map(s => (
                                <div
                                  key={s._id}
                                  className={`${color.bg} rounded-xl px-3 py-2.5 border border-opacity-60 relative overflow-hidden`}
                                  title={s.details?.address}
                                >
                                  {/* Coloured left stripe */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${color.stripe}`} />
                                  <div className="pl-1">
                                    <p className={`text-[11px] font-bold leading-snug truncate ${color.text}`}>
                                      {s.service}
                                    </p>
                                    <p className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${color.sub}`}>
                                      <Clock size={9} />
                                      {s.schedule?.timeSlot || "—"}
                                    </p>
                                    {s.workerDuration && (
                                      <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${color.bg} border ${color.sub}`}>
                                        {s.workerDuration}h
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Add-shift button (shows on row hover when unassigned bookings exist) */}
                              {canAdd && (
                                <button
                                  onClick={() => openCellAssign(w, d)}
                                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-300 hover:border-primary/50 hover:text-primary hover:bg-primary/5 opacity-0 group-hover/row:opacity-100 transition-all text-[10px] font-bold"
                                  title={`Assign a booking to ${w.firstName}`}
                                >
                                  <Plus size={12} /> Add shift
                                </button>
                              )}

                              {/* Empty cell placeholder */}
                              {shifts.length === 0 && !canAdd && (
                                <div className="flex-1 min-h-12" />
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Weekly hours total (sticky right) */}
                      <td
                        className="sticky right-0 z-10 bg-white border border-slate-200 px-4 py-4 text-center align-middle"
                      >
                        <span className={`text-sm font-black tabular-nums px-2.5 py-1.5 rounded-xl block text-center ${
                          weeklyHours > 0 ? `${color.bg} ${color.text}` : "bg-slate-100 text-slate-400"
                        }`}>
                          {weeklyHours}h
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        {!loading && workers.length > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-semibold">
              {workers.length} staff &nbsp;·&nbsp; {assignedThisWeek.length} shifts assigned &nbsp;·&nbsp; {totalHoursThisWeek}h total
            </p>
            {unassigned.length > 0 && (
              <button
                onClick={() => setShowUnassigned(v => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors"
              >
                <AlertTriangle size={12} />
                {unassigned.length} unassigned
                {showUnassigned ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Unassigned panel (below grid) ───────────────────── */}
      {!loading && unassigned.length > 0 && showUnassigned && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle size={15} className="text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Unassigned Shifts</p>
                <p className="text-[11px] text-slate-400">{unassigned.length} booking{unassigned.length !== 1 ? "s" : ""} still need a worker</p>
              </div>
            </div>
            <button onClick={() => setShowUnassigned(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Horizontal scrolling cards */}
          <div className="flex gap-4 overflow-x-auto px-6 py-5" style={{ scrollbarWidth: "thin" }}>
            {unassigned.map(b => {
              const tag = urgencyTag(b.schedule.date);
              return (
                <div
                  key={b._id}
                  className="shrink-0 w-64 border border-slate-200 rounded-2xl p-4 bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{b.service}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${tag.cls}`}>
                      {tag.label}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[12px] text-slate-600 flex items-center gap-2 font-medium">
                      <Clock size={12} className="text-slate-400 shrink-0" />
                      {new Date(b.schedule.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      {b.schedule?.timeSlot ? ` · ${b.schedule.timeSlot}` : ""}
                    </p>
                    {b.details?.address && (
                      <p className="text-[12px] text-slate-500 flex items-center gap-2 truncate">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        {b.details.address}
                      </p>
                    )}
                    {b.details?.duration && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <Hourglass size={11} className="shrink-0" />
                        {b.details.duration}h duration
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openAssign(b)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm"
                  >
                    <UserPlus size={13} /> Assign Worker
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Assign Worker modal ─────────────────────────────── */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Assign Worker</h3>
              <button onClick={() => setAssignTarget(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-sm font-bold text-slate-800">{assignTarget.service}</p>
                <p className="text-[12px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <Clock size={11} className="shrink-0" />
                  {new Date(assignTarget.schedule.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  {assignTarget.schedule?.timeSlot ? ` · ${assignTarget.schedule.timeSlot}` : ""}
                </p>
                {assignTarget.details?.address && (
                  <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <MapPin size={11} className="shrink-0" /> {assignTarget.details.address}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Select Worker</label>
                <select
                  value={pickedWorker}
                  onChange={e => setPickedWorker(e.target.value)}
                  className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                >
                  <option value="">— Choose a worker —</option>
                  {workers.map(w => (
                    <option key={w._id} value={w._id}>{w.firstName} {w.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Hours They'll Work</label>
                <div className="relative">
                  <input
                    type="number" min="0.5" step="0.5"
                    value={pickedHours}
                    onChange={e => setPickedHours(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full p-3.5 pr-16 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">hrs</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Defaults to booking duration — adjust if covering a partial shift.</p>
              </div>
              <button
                onClick={handleAssign}
                disabled={!pickedWorker || assigning}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
              >
                {assigning ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {assigning ? "Assigning…" : "Assign & Notify Worker"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick cell-assign modal ─────────────────────────── */}
      {cellAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Shift</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {cellAssign.worker.firstName} {cellAssign.worker.lastName} &nbsp;·&nbsp;
                  {cellAssign.day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              </div>
              <button onClick={() => setCellAssign(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors mt-0.5">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Unassigned Booking ({cellAssign.options.length})
                </label>
                <select
                  value={pickedBooking}
                  onChange={e => {
                    setPickedBooking(e.target.value);
                    const b = cellAssign.options.find(x => x._id === e.target.value);
                    setCellHours(b?.details?.duration || "");
                  }}
                  className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                >
                  {cellAssign.options.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.service}{b.schedule?.timeSlot ? ` · ${b.schedule.timeSlot}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Hours They'll Work</label>
                <div className="relative">
                  <input
                    type="number" min="0.5" step="0.5"
                    value={cellHours}
                    onChange={e => setCellHours(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full p-3.5 pr-16 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">hrs</span>
                </div>
              </div>
              <button
                onClick={handleCellAssign}
                disabled={!pickedBooking || assigning}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
              >
                {assigning ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {assigning ? "Assigning…" : "Assign & Notify Worker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
