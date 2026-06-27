import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  UserPlus,
  Clock,
  MapPin,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const Toast = ({ msg, type, onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}
  >
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
      <X size={15} />
    </button>
  </div>
);

// Monday-start week containing the given date.
const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isRealBooking = (b) =>
  b.status !== "Blackout" && b.customer?.firstName !== "ADMIN_BLOCK";

const Rota = () => {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState(null); // booking being assigned
  const [pickedWorker, setPickedWorker] = useState("");
  const [pickedHours, setPickedHours] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/workers`).then((r) => r.json()),
      fetch(`${API}/bookings`).then((r) => r.json()),
    ])
      .then(([w, b]) => {
        setWorkers(Array.isArray(w) ? w.filter((x) => x.status === "Active") : []);
        setBookings(Array.isArray(b) ? b : []);
      })
      .catch(() => setToast({ msg: "Failed to load rota data", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const dateKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const weekBookings = useMemo(() => {
    const startKey = dateKey(days[0]);
    const endKey = dateKey(days[6]);
    return bookings.filter((b) => {
      if (!b.schedule?.date || !isRealBooking(b)) return false;
      const k = dateKey(new Date(b.schedule.date));
      return k >= startKey && k <= endKey;
    });
  }, [bookings, days]);

  const unassigned = useMemo(
    () => weekBookings.filter((b) => !b.assignedWorker && !b.assignedWorkerName),
    [weekBookings],
  );

  const shiftsFor = (workerId, day) => {
    const k = dateKey(day);
    return weekBookings.filter((b) => {
      const assignedId =
        typeof b.assignedWorker === "object"
          ? b.assignedWorker?._id
          : b.assignedWorker;
      return assignedId === workerId && dateKey(new Date(b.schedule.date)) === k;
    });
  };

  const openAssign = (booking) => {
    setAssignTarget(booking);
    setPickedWorker("");
    setPickedHours(
      booking.payment?.billingType === "flat"
        ? ""
        : booking.details?.duration || "",
    );
  };

  const handleAssign = async () => {
    if (!pickedWorker) return;
    setAssigning(true);
    try {
      const res = await fetch(
        `${API}/workers/jobs/${assignTarget._id}/assign`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerId: pickedWorker,
            workerDuration: pickedHours || null,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to assign worker");
      setToast({ msg: "Shift assigned — worker notified", type: "success" });
      setAssignTarget(null);
      fetchData();
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setAssigning(false);
    }
  };

  const weekLabel = `${days[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarRange size={22} className="text-primary" /> Rota
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Assign workers to shifts and see who's working each day
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() - 7);
              setWeekStart(d);
            }}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-slate-700 whitespace-nowrap px-2">
            {weekLabel}
          </span>
          <button
            onClick={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() + 7);
              setWeekStart(d);
            }}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all"
          >
            This Week
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Rota grid */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                  <th className="px-4 py-3 sticky left-0 bg-slate-50/60">Worker</th>
                  {days.map((d) => (
                    <th key={dateKey(d)} className="px-3 py-3 text-center">
                      {d.toLocaleDateString("en-GB", { weekday: "short" })}
                      <br />
                      <span className="text-slate-300">
                        {d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center font-semibold text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : workers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center font-semibold text-slate-300">
                      No active staff
                    </td>
                  </tr>
                ) : (
                  workers.map((w) => (
                    <tr key={w._id}>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap sticky left-0 bg-white">
                        {w.firstName} {w.lastName}
                      </td>
                      {days.map((d) => {
                        const shifts = shiftsFor(w._id, d);
                        return (
                          <td key={dateKey(d)} className="px-2 py-2 align-top">
                            <div className="space-y-1.5 min-w-[100px]">
                              {shifts.map((s) => (
                                <div
                                  key={s._id}
                                  className="bg-emerald-50 border border-emerald-200 rounded-lg p-2"
                                  title={s.details?.address}
                                >
                                  <p className="text-[10px] font-bold text-emerald-700 truncate">
                                    {s.service}
                                  </p>
                                  <p className="text-[9px] text-emerald-600 font-semibold">
                                    {s.schedule?.timeSlot}
                                    {s.workerDuration
                                      ? ` · ${s.workerDuration}h`
                                      : ""}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unassigned this week */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Unassigned This Week
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            {unassigned.length} booking{unassigned.length !== 1 ? "s" : ""}{" "}
            need a worker
          </p>
          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {unassigned.length === 0 ? (
              <p className="text-xs text-slate-300 text-center py-8">
                Everything's covered 🎉
              </p>
            ) : (
              unassigned.map((b) => (
                <div
                  key={b._id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <p className="text-xs font-bold text-slate-800">
                    {b.service}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <Clock size={11} />{" "}
                    {new Date(b.schedule.date).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {b.schedule?.timeSlot}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={11} className="shrink-0" />{" "}
                    {b.details?.address}
                  </p>
                  <button
                    onClick={() => openAssign(b)}
                    className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark transition-all"
                  >
                    <UserPlus size={12} /> Assign Worker
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {assignTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md"
            onClick={() => setAssignTarget(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden border-4 border-white">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-primary-dark">
                Assign Worker
              </h3>
              <button
                onClick={() => setAssignTarget(null)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-sm font-bold text-slate-800">
                  {assignTarget.service}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(assignTarget.schedule.date).toLocaleDateString(
                    "en-GB",
                    { weekday: "long", day: "numeric", month: "long" },
                  )}{" "}
                  · {assignTarget.schedule?.timeSlot}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Select Worker
                </label>
                <select
                  value={pickedWorker}
                  onChange={(e) => setPickedWorker(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">-- Choose a worker --</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.firstName} {w.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Hours They'll Work
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={pickedHours}
                    onChange={(e) => setPickedHours(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full p-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    hours
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Defaults to the booking's duration — adjust if this worker
                  is only covering part of the shift.
                </p>
              </div>
              <button
                onClick={handleAssign}
                disabled={!pickedWorker || assigning}
                className="w-full py-3 rounded-xl bg-primary text-white hover:bg-primary-dark font-bold text-sm transition-all disabled:opacity-60"
              >
                {assigning ? "Assigning..." : "Assign & Notify Worker"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Rota;
