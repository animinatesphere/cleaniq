import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarRange, ChevronLeft, ChevronRight, RefreshCw, X,
  UserPlus, Clock, MapPin, Users, CheckCircle2, AlertTriangle,
  Hourglass, Plus, ChevronDown, ChevronUp, GripVertical,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const WORKER_COLORS = [
  { bg: "bg-blue-500/15",    stripe: "bg-blue-400",    text: "text-blue-300",    sub: "text-blue-400",    avatar: "bg-blue-500",   ring: "ring-blue-500/30"    },
  { bg: "bg-violet-500/15",  stripe: "bg-violet-400",  text: "text-violet-300",  sub: "text-violet-400",  avatar: "bg-violet-500", ring: "ring-violet-500/30"  },
  { bg: "bg-emerald-500/15", stripe: "bg-emerald-500", text: "text-emerald-300", sub: "text-emerald-400", avatar: "bg-emerald-600", ring: "ring-emerald-500/30" },
  { bg: "bg-amber-500/15",   stripe: "bg-amber-400",   text: "text-amber-300",   sub: "text-amber-400",   avatar: "bg-amber-500",  ring: "ring-amber-500/30"   },
  { bg: "bg-rose-500/15",    stripe: "bg-rose-400",    text: "text-rose-300",    sub: "text-rose-400",    avatar: "bg-rose-500",   ring: "ring-rose-500/30"    },
  { bg: "bg-cyan-500/15",    stripe: "bg-cyan-500",    text: "text-cyan-300",    sub: "text-cyan-400",    avatar: "bg-cyan-600",   ring: "ring-cyan-500/30"    },
  { bg: "bg-pink-500/15",    stripe: "bg-pink-400",    text: "text-pink-300",    sub: "text-pink-400",    avatar: "bg-pink-500",   ring: "ring-pink-500/30"    },
  { bg: "bg-indigo-500/15",  stripe: "bg-indigo-500",  text: "text-indigo-300",  sub: "text-indigo-400",  avatar: "bg-indigo-600", ring: "ring-indigo-500/30"  },
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

const isRealBooking = (b) => b.status !== "Blackout" && b.status !== "Cancelled" && b.customer?.firstName !== "ADMIN_BLOCK";
const initials = (f, l) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase() || "?";
const hoursOf  = (b) => Number(b.workerDuration || b.details?.duration || 0);

const urgencyTag = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(date); t.setHours(0, 0, 0, 0);
  const d = Math.round((t - today) / 86400000);
  if (d < 0)   return { label: "Overdue",  cls: "bg-rose-500/15 text-rose-400 border-rose-500/25"    };
  if (d === 0) return { label: "Today",    cls: "bg-rose-500/10 text-rose-400 border-rose-500/20"     };
  if (d === 1) return { label: "Tomorrow", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25"  };
  return         { label: "This week",     cls: "bg-white/5 text-white/40 border-white/10"            };
};

export default function Rota() {
  const [weekStart, setWeekStart]     = useState(startOfWeek(new Date()));
  const [workers,   setWorkers]       = useState([]);
  const [bookings,  setBookings]      = useState([]);
  const [loading,   setLoading]       = useState(true);
  const [showUnassigned, setShowUnassigned] = useState(true);

  const [assignTarget, setAssignTarget] = useState(null);
  const [pickedWorker, setPickedWorker] = useState("");
  const [pickedHours,  setPickedHours]  = useState("");

  const [cellAssign,    setCellAssign]    = useState(null);
  const [pickedBooking, setPickedBooking] = useState("");
  const [cellHours,     setCellHours]     = useState("");

  const [assigning, setAssigning] = useState(false);
  const [toast,     setToast]     = useState(null);

  const [draggedId,   setDraggedId]   = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);

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

  const handleDragAssign = async (bookingId, workerId) => {
    const workerName = workers.find(w => w._id === workerId)?.firstName || "worker";
    try {
      const res = await fetch(`${API}/workers/jobs/${bookingId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      if (!res.ok) throw new Error("Assignment failed");
      showToast(`Assigned to ${workerName} — worker notified`);
      fetchData();
    } catch {
      showToast("Failed to assign shift", "error");
    }
  };

  const onDragStart = (e, bookingId) => {
    e.dataTransfer.setData("bookingId", bookingId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(bookingId);
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setDragOverCell(null);
  };

  const onCellDragOver = (e, cellKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(cellKey);
  };

  const onCellDragLeave = () => setDragOverCell(null);

  const onCellDrop = (e, workerId) => {
    e.preventDefault();
    const bookingId = e.dataTransfer.getData("bookingId");
    setDraggedId(null);
    setDragOverCell(null);
    if (bookingId) handleDragAssign(bookingId, workerId);
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <CalendarRange size={22} className="text-emerald-400" /> Rota
          </h1>
          <p className="text-sm text-white/40 mt-0.5 font-medium">
            Assign workers to bookings and manage the weekly schedule
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#071D16] border border-white/10 rounded-xl overflow-hidden">
            <button onClick={prevWeek} className="px-3 py-2.5 hover:bg-[#0A2A1F] border-r border-white/10 text-white/40 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="px-5 text-sm font-bold text-white whitespace-nowrap select-none">
              {weekLabel}
            </span>
            <button onClick={nextWeek} className="px-3 py-2.5 hover:bg-[#0A2A1F] border-l border-white/10 text-white/40 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-4 py-2.5 rounded-xl bg-[#071D16] border border-white/10 text-xs font-bold text-white/60 hover:bg-[#0A2A1F] transition-colors"
          >
            Today
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users,         label: "Active Staff",    value: workers.length,           accent: "bg-blue-500/15 text-blue-400"      },
          { icon: CheckCircle2,  label: "Shifts Assigned", value: assignedThisWeek.length,  accent: "bg-emerald-500/15 text-emerald-400" },
          { icon: AlertTriangle, label: "Unassigned",      value: unassigned.length,        accent: unassigned.length > 0 ? "bg-rose-500/15 text-rose-400" : "bg-white/5 text-white/40" },
          { icon: Hourglass,     label: "Hours Scheduled", value: `${totalHoursThisWeek}h`, accent: "bg-violet-500/15 text-violet-400"   },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="bg-[#0B2D22] border border-white/7 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className="text-xl font-black text-white tabular-nums leading-none">{value}</p>
              <p className="text-[10px] font-semibold text-white/40 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={`bg-[#0B2D22] border rounded-2xl overflow-hidden transition-all ${draggedId ? "border-emerald-500/40 shadow-emerald-500/10 shadow-lg" : "border-white/10"}`}>
        {draggedId && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-2.5 flex items-center gap-2">
            <GripVertical size={14} className="text-emerald-400 animate-pulse" />
            <p className="text-xs font-bold text-emerald-400">Drop onto a worker row to assign this shift instantly</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 980 }}>

            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-[#071D16] border border-white/10 px-5 py-4 text-left" style={{ minWidth: 210 }}>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Staff Member</span>
                </th>
                {days.map(d => {
                  const isToday   = dateKey(d) === todayKey;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th
                      key={dateKey(d)}
                      className={`border border-white/10 px-4 py-4 text-center ${isToday ? "bg-emerald-500/10" : isWeekend ? "bg-[#071D16]" : "bg-[#0B2D22]"}`}
                    >
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${isToday ? "text-emerald-400" : "text-white/40"}`}>
                        {d.toLocaleDateString("en-GB", { weekday: "short" })}
                      </p>
                      <p className={`text-2xl font-black tabular-nums leading-tight mt-0.5 ${isToday ? "text-emerald-400" : isWeekend ? "text-white/40" : "text-white"}`}>
                        {d.getDate()}
                      </p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${isToday ? "text-emerald-400/60" : "text-white/25"}`}>
                        {d.toLocaleDateString("en-GB", { month: "short" })}
                      </p>
                      {isToday && <div className="w-5 h-0.5 bg-emerald-500 rounded-full mx-auto mt-1.5" />}
                    </th>
                  );
                })}
                <th className="sticky right-0 z-10 bg-[#071D16] border border-white/10 px-4 py-4 text-center" style={{ minWidth: 72 }}>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Hrs</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center border border-white/10">
                    <RefreshCw size={22} className="animate-spin inline text-white/25" />
                    <p className="text-sm text-white/25 font-semibold mt-3">Loading rota…</p>
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center border border-white/10">
                    <Users size={40} className="mx-auto mb-3 text-white/20" />
                    <p className="text-sm text-white/25 font-semibold">No active staff found</p>
                  </td>
                </tr>
              ) : (
                workers.map((w) => {
                  const color = workerColorMap[w._id] || WORKER_COLORS[0];
                  const weeklyHours = totalHoursForWorker(w._id);

                  return (
                    <tr key={w._id} className="group/row">

                      <td className="sticky left-0 z-10 bg-[#0B2D22] border border-white/10 px-5 py-4 align-middle" style={{ minWidth: 210 }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black text-white shrink-0 ${color.avatar} ring-2 ring-[#0B2D22]`}>
                            {initials(w.firstName, w.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white leading-tight">{w.firstName} {w.lastName}</p>
                            {w.role && <p className="text-[10px] text-white/40 font-medium mt-0.5">{w.role}</p>}
                            <p className={`text-[10px] font-bold mt-1 tabular-nums ${weeklyHours > 0 ? color.sub : "text-white/25"}`}>
                              {weeklyHours > 0 ? `${weeklyHours}h this week` : "No shifts yet"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {days.map(d => {
                        const shifts      = shiftsFor(w._id, d);
                        const isToday     = dateKey(d) === todayKey;
                        const isWeekend   = d.getDay() === 0 || d.getDay() === 6;
                        const cellKey     = `${w._id}_${dateKey(d)}`;
                        const isOver      = dragOverCell === cellKey;
                        const dayUnassigned = unassigned.filter(b => dateKey(new Date(b.schedule.date)) === dateKey(d));
                        const canAdd      = dayUnassigned.length > 0;

                        return (
                          <td
                            key={dateKey(d)}
                            onDragOver={e => onCellDragOver(e, cellKey)}
                            onDragLeave={onCellDragLeave}
                            onDrop={e => onCellDrop(e, w._id)}
                            className={`border border-white/10 px-3 py-3 align-top transition-colors ${
                              isOver
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : isToday   ? "bg-emerald-500/5"
                                : isWeekend ? "bg-[#071D16]/70"
                                : "bg-[#0B2D22]"
                            }`}
                            style={{ minWidth: 148 }}
                          >
                            <div className="flex flex-col gap-1.5 min-h-16">

                              {isOver && (
                                <div className="flex items-center justify-center h-10 rounded-xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 text-[10px] font-black text-emerald-400">
                                  Drop to assign
                                </div>
                              )}

                              {!isOver && shifts.map(s => (
                                <div
                                  key={s._id}
                                  className={`${color.bg} rounded-xl px-3 py-2 relative overflow-hidden border border-white/10 transition-all`}
                                  title={s.details?.address}
                                >
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${color.stripe}`} />
                                  <div className="pl-1.5">
                                    <p className={`text-[11px] font-bold leading-snug truncate ${color.text}`}>{s.service}</p>
                                    <p className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${color.sub}`}>
                                      <Clock size={9} />{s.schedule?.timeSlot || "—"}
                                    </p>
                                    {s.workerDuration && (
                                      <span className={`inline-block mt-1 text-[9px] font-black px-1.5 py-px rounded-full ${color.bg} border ${color.ring}`}>
                                        {s.workerDuration}h
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {!isOver && canAdd && (
                                <button
                                  onClick={() => openCellAssign(w, d)}
                                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-white/10 text-white/25 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5 opacity-0 group-hover/row:opacity-100 transition-all text-[10px] font-bold"
                                  title={`Assign a booking to ${w.firstName}`}
                                >
                                  <Plus size={12} /> Add shift
                                </button>
                              )}

                              {shifts.length === 0 && !canAdd && !isOver && (
                                <div className="flex-1 min-h-12" />
                              )}
                            </div>
                          </td>
                        );
                      })}

                      <td className="sticky right-0 z-10 bg-[#0B2D22] border border-white/10 px-3 py-4 text-center align-middle">
                        <span className={`text-sm font-black tabular-nums px-2.5 py-1.5 rounded-xl block text-center ${
                          weeklyHours > 0 ? `${color.bg} ${color.text}` : "bg-white/5 text-white/25"
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

        {!loading && workers.length > 0 && (
          <div className="px-6 py-3.5 border-t border-white/[0.06] bg-[#071D16] flex items-center justify-between gap-4">
            <p className="text-xs text-white/40 font-semibold tabular-nums">
              {workers.length} staff &nbsp;·&nbsp; {assignedThisWeek.length} shifts assigned &nbsp;·&nbsp; {totalHoursThisWeek}h total
            </p>
            {unassigned.length > 0 && (
              <button
                onClick={() => setShowUnassigned(v => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/15 border border-rose-500/25 px-3 py-1.5 rounded-xl hover:bg-rose-500/25 transition-colors"
              >
                <AlertTriangle size={12} />
                {unassigned.length} unassigned
                {showUnassigned ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        )}
      </div>

      {!loading && unassigned.length > 0 && showUnassigned && (
        <div className="bg-[#0B2D22] border border-white/10 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <AlertTriangle size={15} className="text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Unassigned Shifts</p>
                <p className="text-[11px] text-white/40">
                  {unassigned.length} booking{unassigned.length !== 1 ? "s" : ""} need a worker &nbsp;·&nbsp;
                  <span className="text-emerald-400 font-semibold">Drag cards onto the grid to assign</span>
                </p>
              </div>
            </div>
            <button onClick={() => setShowUnassigned(false)} className="p-1.5 rounded-xl text-white/40 hover:bg-white/10 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto px-6 py-5" style={{ scrollbarWidth: "thin" }}>
            {unassigned.map(b => {
              const tag     = urgencyTag(b.schedule.date);
              const isDragging = draggedId === b._id;

              return (
                <div
                  key={b._id}
                  draggable
                  onDragStart={e => onDragStart(e, b._id)}
                  onDragEnd={onDragEnd}
                  className={`shrink-0 w-64 border rounded-2xl p-4 transition-all select-none ${
                    isDragging
                      ? "opacity-40 border-emerald-500/40 bg-emerald-500/5 scale-95 shadow-lg"
                      : "border-white/10 bg-[#071D16] hover:border-white/20 hover:shadow-md cursor-grab active:cursor-grabbing"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GripVertical size={13} className="text-white/25 shrink-0 -ml-1" />
                      <p className="text-sm font-bold text-white leading-snug truncate">{b.service}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${tag.cls}`}>
                      {tag.label}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[12px] text-white/70 flex items-center gap-2 font-medium">
                      <Clock size={12} className="text-white/40 shrink-0" />
                      {new Date(b.schedule.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      {b.schedule?.timeSlot ? ` · ${b.schedule.timeSlot}` : ""}
                    </p>
                    {b.details?.address && (
                      <p className="text-[12px] text-white/40 flex items-center gap-2 truncate">
                        <MapPin size={12} className="text-white/40 shrink-0" />
                        {b.details.address}
                      </p>
                    )}
                    {b.details?.duration && (
                      <p className="text-[11px] text-white/40 flex items-center gap-2">
                        <Hourglass size={11} className="shrink-0" />
                        {b.details.duration}h duration
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openAssign(b)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 transition-colors"
                  >
                    <UserPlus size={13} /> Assign Worker
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0B2D22] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Assign Worker</h3>
              <button onClick={() => setAssignTarget(null)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/40 hover:bg-white/20 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-[#071D16] border border-white/10">
                <p className="text-sm font-bold text-white">{assignTarget.service}</p>
                <p className="text-[12px] text-white/40 mt-1.5 flex items-center gap-1.5">
                  <Clock size={11} className="shrink-0" />
                  {new Date(assignTarget.schedule.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  {assignTarget.schedule?.timeSlot ? ` · ${assignTarget.schedule.timeSlot}` : ""}
                </p>
                {assignTarget.details?.address && (
                  <p className="text-[12px] text-white/40 mt-0.5 flex items-center gap-1.5">
                    <MapPin size={11} className="shrink-0" /> {assignTarget.details.address}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-wider block mb-2">Select Worker</label>
                <select
                  value={pickedWorker}
                  onChange={e => setPickedWorker(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-white/10 bg-[#071D16] text-white font-medium text-sm focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">— Choose a worker —</option>
                  {workers.map(w => (
                    <option key={w._id} value={w._id}>{w.firstName} {w.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-wider block mb-2">Hours They'll Work</label>
                <div className="relative">
                  <input
                    type="number" min="0.5" step="0.5"
                    value={pickedHours}
                    onChange={e => setPickedHours(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full p-3.5 pr-16 rounded-xl border border-white/10 bg-[#071D16] text-white placeholder:text-white/20 font-bold text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40 uppercase tracking-wider">hrs</span>
                </div>
                <p className="text-[10px] text-white/40 mt-1.5">Defaults to booking duration — adjust if covering a partial shift.</p>
              </div>
              <button
                onClick={handleAssign}
                disabled={!pickedWorker || assigning}
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {assigning ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {assigning ? "Assigning…" : "Assign & Notify Worker"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cellAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0B2D22] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Assign Shift</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {cellAssign.worker.firstName} {cellAssign.worker.lastName} &nbsp;·&nbsp;
                  {cellAssign.day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              </div>
              <button onClick={() => setCellAssign(null)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/40 hover:bg-white/20 transition-colors mt-0.5">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-wider block mb-2">
                  Unassigned Booking ({cellAssign.options.length})
                </label>
                <select
                  value={pickedBooking}
                  onChange={e => {
                    setPickedBooking(e.target.value);
                    const b = cellAssign.options.find(x => x._id === e.target.value);
                    setCellHours(b?.details?.duration || "");
                  }}
                  className="w-full p-3.5 rounded-xl border border-white/10 bg-[#071D16] text-white font-medium text-sm focus:outline-none focus:border-emerald-500/50"
                >
                  {cellAssign.options.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.service}{b.schedule?.timeSlot ? ` · ${b.schedule.timeSlot}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-wider block mb-2">Hours They'll Work</label>
                <div className="relative">
                  <input
                    type="number" min="0.5" step="0.5"
                    value={cellHours}
                    onChange={e => setCellHours(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full p-3.5 pr-16 rounded-xl border border-white/10 bg-[#071D16] text-white placeholder:text-white/20 font-bold text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40 uppercase tracking-wider">hrs</span>
                </div>
              </div>
              <button
                onClick={handleCellAssign}
                disabled={!pickedBooking || assigning}
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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
