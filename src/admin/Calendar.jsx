// Admin → Calendar. Calendar tab: month / week view of every booking with its cleaner (same design
// as the Nigeria admin), a simple day list on phones, tap a job to open it. Availability tab: the
// existing tools to block days / time slots and schedule recurring jobs (unchanged).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Lock, LockOpen } from "lucide-react";
import { AdminCalendar } from "./Bookings";

const API = import.meta.env.VITE_API_URL;
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (s, n) => {
  const d = new Date(`${s}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
};
const mondayOf = (s) => addDays(s, -((new Date(`${s}T12:00:00Z`).getUTCDay() + 6) % 7));
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
// The booking's day as YYYY-MM-DD in the browser's (UK) time — same as the existing calendar.
const dayOf = (b) => {
  const d = new Date(b.schedule?.date);
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const time12 = (t) => {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t || "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]}${h >= 12 ? "pm" : "am"}`;
};
const timeOf = (b) => time12(b.schedule?.preferredTime) || b.schedule?.timeSlot || "";
const sortKey = (b) => String(b.schedule?.preferredTime || "99:99");
const cleanerOf = (b) => (b.assignedWorker ? `${b.assignedWorker.firstName || ""} ${b.assignedWorker.lastName || ""}`.trim() : b.assignedWorkerName || "");
const isBlock = (b) => b.customer?.firstName === "ADMIN_BLOCK" || b.status === "Blackout";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TONE = {
  Pending: "border-amber-400 bg-amber-400/10",
  Confirmed: "border-sky-400 bg-sky-400/10",
  Assigned: "border-indigo-400 bg-indigo-400/10",
  "In Progress": "border-violet-400 bg-violet-400/10",
  Completed: "border-emerald-400 bg-emerald-400/10",
  "Completed - Unpaid": "border-orange-400 bg-orange-400/10",
  Cancelled: "border-rose-400 bg-rose-400/10 line-through opacity-60",
  Blackout: "border-white/30 bg-white/5",
};
const LEGEND = ["Pending", "Confirmed", "Assigned", "In Progress", "Completed"];

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-white/8 bg-[#0B2D22] p-5 ${className}`}>{children}</div>;
}
const btn = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/15";

export default function Calendar() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("calendar"); // calendar | availability
  const [view, setView] = useState("month");
  const [anchor, setAnchor] = useState(localToday());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const fetchBookings = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`${API}/bookings`);
      if (!res.ok) throw new Error(`Couldn't load bookings (${res.status})`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Couldn't load bookings");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => {
    if (!statusMessage.text) return undefined;
    const t = setTimeout(() => setStatusMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(t);
  }, [statusMessage]);

  const range = useMemo(() => {
    if (view === "week") {
      const from = mondayOf(anchor);
      return { from, to: addDays(from, 6), days: Array.from({ length: 7 }, (_, i) => addDays(from, i)) };
    }
    const first = `${anchor.slice(0, 7)}-01`;
    const from = mondayOf(first);
    const last = new Date(Date.UTC(Number(anchor.slice(0, 4)), Number(anchor.slice(5, 7)), 0));
    const to = addDays(mondayOf(ymd(last)), 6);
    const n = (new Date(`${to}T12:00:00Z`) - new Date(`${from}T12:00:00Z`)) / 86400000 + 1;
    return { from, to, days: Array.from({ length: n }, (_, i) => addDays(from, i)) };
  }, [view, anchor]);

  // Bookings by day (time order). Day/time blocks are listed separately so the day can show "Blocked".
  const { byDay, blockedDays } = useMemo(() => {
    const m = new Map();
    const blocked = new Set();
    for (const b of bookings) {
      const d = dayOf(b);
      if (!d || d < range.from || d > range.to) continue;
      if (isBlock(b)) {
        if (b.schedule?.timeSlot === "All Day") blocked.add(d);
        continue;
      }
      if (!showCancelled && b.status === "Cancelled") continue;
      m.set(d, [...(m.get(d) || []), b]);
    }
    for (const list of m.values()) list.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    return { byDay: m, blockedDays: blocked };
  }, [bookings, range, showCancelled]);

  const move = (dir) => {
    if (view === "week") setAnchor(addDays(anchor, dir * 7));
    else {
      const d = new Date(`${anchor.slice(0, 7)}-15T12:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + dir);
      setAnchor(ymd(d));
    }
  };
  const title = view === "week"
    ? `Week of ${new Date(`${range.from}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}`
    : new Date(`${anchor.slice(0, 7)}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const today = localToday();
  const open = (b) => navigate(`/admin/jobs/${b._id}`);
  // Block / unblock a whole day from the calendar (the same "All Day" block as the Availability tab).
  const [busyDay, setBusyDay] = useState("");
  const toggleDay = async (d) => {
    const blocked = blockedDays.has(d);
    const label = new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    if (!window.confirm(blocked ? `Unblock ${label}? Customers will be able to book it again.` : `Block ${label}? Customers won't be able to book this day.`)) return;
    setBusyDay(d);
    await toggleAvailability(new Date(`${d}T12:00:00`), blocked);
    setBusyDay("");
  };
  const inRange = [...byDay.values()].flat();

  // ── Availability tab: the existing block-a-day / block-a-slot / recurring tools ─────────
  const dStrOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const post = (payload) => fetch(`${API}/bookings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const toggleTimeSlot = async (date, time, existingBlock) => {
    const dStr = dStrOf(date);
    try {
      if (existingBlock) {
        await fetch(`${API}/bookings/${existingBlock._id}`, { method: "DELETE" });
        setStatusMessage({ type: "success", text: `Unblocked ${time} on ${dStr}` });
      } else {
        await post({
          bookingId: `TBLOCK-${Date.now()}`,
          customer: { firstName: "ADMIN_BLOCK", lastName: "SYSTEM", email: "admin@cleaniq.com", phone: "000" },
          service: "Time Block", status: "Blackout",
          schedule: { date: dStr, timeSlot: "Flexible", preferredTime: time },
          details: { duration: 0.5 }, payment: { amount: 0, status: "N/A" },
        });
        setStatusMessage({ type: "success", text: `Blocked ${time} on ${dStr}` });
      }
      fetchBookings();
    } catch (e) { console.error(e); }
  };
  const toggleAvailability = async (date, isCurrentlyBlocked) => {
    const dStr = dStrOf(date);
    try {
      if (isCurrentlyBlocked) {
        const block = bookings.find((b) => b.customer?.firstName === "ADMIN_BLOCK" && b.schedule?.timeSlot === "All Day" && dayOf(b) === dStr);
        if (block) {
          await fetch(`${API}/bookings/${block._id}`, { method: "DELETE" });
          setStatusMessage({ type: "success", text: `Unlocked ${dStr}` });
        }
      } else {
        await post({
          bookingId: `LOCK-${Math.floor(1000 + Math.random() * 9000)}`,
          customer: { firstName: "ADMIN_BLOCK", lastName: "SYSTEM", email: "admin@cleaniq.com", phone: "000" },
          service: "Availability Block", status: "Blackout",
          schedule: { date: dStr, timeSlot: "All Day" }, payment: { amount: 0, status: "N/A" },
        });
        setStatusMessage({ type: "success", text: `Blocked ${dStr}` });
      }
      fetchBookings();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="relative space-y-6 pb-20">
      {statusMessage.text && (
        <div className="fixed top-6 right-6 z-[100] rounded-2xl border border-white/10 bg-[#0B2D22] px-6 py-4 text-sm font-semibold text-white shadow-2xl">{statusMessage.text}</div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            <CalendarDays size={24} className="text-emerald-400" /> Calendar
          </h1>
          <p className="mt-1 text-sm text-white/60">{tab === "calendar" ? title : "Block days or time slots, and schedule recurring jobs"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-white/8 p-1">
            {[["calendar", "Calendar"], ["availability", "Availability"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`relative rounded-lg px-3 py-1.5 text-sm font-bold ${tab === k ? "text-[#061a13]" : "text-white/70"}`}>
                {tab === k && <motion.span layoutId="cal-tab" className="absolute inset-0 rounded-lg bg-emerald-400" />}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>
          {tab === "calendar" && (
            <>
              <div className="flex rounded-xl bg-white/8 p-1">
                {["month", "week"].map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`relative rounded-lg px-3 py-1.5 text-sm font-bold capitalize ${view === v ? "text-[#061a13]" : "text-white/70"}`}>
                    {view === v && <motion.span layoutId="cal-view" className="absolute inset-0 rounded-lg bg-emerald-400" />}
                    <span className="relative">{v}</span>
                  </button>
                ))}
              </div>
              <button className={btn} onClick={() => move(-1)} aria-label="Previous"><ChevronLeft size={16} /></button>
              <button className={btn} onClick={() => setAnchor(today)}>Today</button>
              <button className={btn} onClick={() => move(1)} aria-label="Next"><ChevronRight size={16} /></button>
            </>
          )}
        </div>
      </div>

      {tab === "availability" ? (
        <AdminCalendar bookings={bookings} onToggleDate={toggleAvailability} onToggleTimeSlot={toggleTimeSlot} onBookingsCreated={fetchBookings} />
      ) : error ? (
        <Card className="border-rose-400/30">
          <p className="font-bold text-rose-300">{error}</p>
          <button className={`${btn} mt-3`} onClick={() => { setLoading(true); fetchBookings(); }}>Try again</button>
        </Card>
      ) : loading ? (
        <div className="grid place-items-center py-24 text-white/50"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          {/* Summary + legend */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/60"><span className="font-bold text-white">{inRange.filter((b) => b.status !== "Cancelled").length}</span> jobs {view === "week" ? "this week" : "this month"}{blockedDays.size ? ` · ${blockedDays.size} blocked day${blockedDays.size === 1 ? "" : "s"}` : ""}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
              {LEGEND.map((s) => <span key={s} className="flex items-center gap-1.5"><span className={`h-3 w-1 rounded-full border-l-2 ${TONE[s].split(" ")[0]}`} />{s}</span>)}
              <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" className="accent-emerald-400" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Show cancelled</label>
            </div>
          </div>

          {view === "month" ? (
            <>
              <div className="hidden grid-cols-7 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 md:grid">
                {DAYS.map((d) => <div key={d} className="bg-[#0B2D22] px-2 py-2 text-center text-xs font-bold text-white/50 uppercase">{d}</div>)}
                {range.days.map((d) => {
                  const items = byDay.get(d) || [];
                  const inMonth = d.slice(0, 7) === anchor.slice(0, 7);
                  const blocked = blockedDays.has(d);
                  return (
                    <div key={d} className={`min-h-28 p-1.5 ${blocked ? "bg-[repeating-linear-gradient(135deg,#0B2D22,#0B2D22_8px,#0f3a2c_8px,#0f3a2c_16px)]" : "bg-[#0B2D22]"} ${inMonth ? "" : "opacity-40"}`}>
                      <div className="mb-1 flex items-center justify-between">
                        <p className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${d === today ? "bg-emerald-400 text-[#061a13]" : "text-white/60"}`}>{Number(d.slice(8))}</p>
                        <button onClick={() => toggleDay(d)} disabled={busyDay === d || d < today} title={blocked ? "Unblock this day" : "Block this day"}
                          className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-colors disabled:cursor-default ${blocked ? "bg-rose-400/15 text-rose-300 hover:bg-rose-400/25" : "text-white/25 hover:bg-white/10 hover:text-white/70"} ${d < today && !blocked ? "invisible" : ""}`}>
                          {busyDay === d ? <Loader2 size={10} className="animate-spin" /> : blocked ? <Lock size={10} /> : <LockOpen size={10} />}
                          {blocked ? "Blocked" : "Block"}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {items.slice(0, 3).map((b) => (
                          <button key={b._id} onClick={() => open(b)} title={`${b.service} · ${b.customer?.firstName || ""} ${b.customer?.lastName || ""}`}
                            className={`block w-full truncate rounded-md border-l-2 px-1.5 py-1 text-left text-[11px] text-white ${TONE[b.status] || "border-white/30 bg-white/5"}`}>
                            {timeOf(b)} {b.customer?.firstName} · {cleanerOf(b) || "—"}
                          </button>
                        ))}
                        {items.length > 3 && (
                          <button onClick={() => { setAnchor(d); setView("week"); }} className="text-[11px] font-bold text-emerald-300">+{items.length - 3} more</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Phones: a simple list of the days that have jobs */}
              <AgendaList days={range.days.filter((d) => d.slice(0, 7) === anchor.slice(0, 7))} byDay={byDay} blockedDays={blockedDays} today={today} onOpen={open} onToggleDay={toggleDay} busyDay={busyDay} className="md:hidden" />
            </>
          ) : (
            <AgendaList days={range.days} byDay={byDay} blockedDays={blockedDays} today={today} showEmpty onOpen={open} onToggleDay={toggleDay} busyDay={busyDay} />
          )}
        </>
      )}
    </div>
  );
}

function AgendaList({ days, byDay, blockedDays, today, onOpen, onToggleDay, busyDay, showEmpty, className = "" }) {
  const shown = days.filter((d) => showEmpty || byDay.get(d)?.length || blockedDays.has(d));
  if (!shown.length) return <Card className={className}><p className="text-sm text-white/50">No bookings in this period.</p></Card>;
  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence initial={false}>
        {shown.map((d) => (
          <motion.div key={d} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
              <p className={`flex items-center gap-2 text-sm font-extrabold ${d === today ? "text-emerald-300" : "text-white"}`}>
                {new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })}
                {d === today && " · Today"}
                {blockedDays.has(d) && <span className="flex items-center gap-1 rounded-full bg-rose-400/15 px-2 py-0.5 text-[11px] font-bold text-rose-300"><Lock size={10} /> Blocked</span>}
              </p>
              {onToggleDay && d >= today && (
                <button onClick={() => onToggleDay(d)} disabled={busyDay === d}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white">
                  {busyDay === d ? <Loader2 size={12} className="animate-spin" /> : blockedDays.has(d) ? <LockOpen size={12} /> : <Lock size={12} />}
                  {blockedDays.has(d) ? "Unblock" : "Block day"}
                </button>
              )}
              </div>
              {(byDay.get(d) || []).length ? (
                <ul className="mt-2 space-y-1.5">
                  {byDay.get(d).map((b) => (
                    <li key={b._id}>
                      <button onClick={() => onOpen(b)} className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-l-2 px-3 py-2 text-left text-sm ${TONE[b.status] || "border-white/30 bg-white/5"}`}>
                        <span className="font-bold text-white">{timeOf(b)}</span>
                        <span className="text-white/85">{b.customer?.firstName} {b.customer?.lastName} · {b.service}{b.details?.duration ? ` (${b.details.duration}h)` : ""}</span>
                        <span className="text-white/50">{b.details?.postcode || ""}{b.details?.postcode ? " · " : ""}{cleanerOf(b) || "No cleaner"} · {b.status}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-white/40">Nothing booked</p>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
