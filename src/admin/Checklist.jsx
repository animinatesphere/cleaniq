import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ListChecks,
  CheckCircle2,
  Circle,
  RefreshCw,
  Calendar,
  User,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const DEFAULT_TASKS = [
  "Dusting all surfaces",
  "Vacuuming carpets & floors",
  "Mopping hard floors",
  "Kitchen wipe-down (counters, sink, hob)",
  "Bathroom clean (toilet, shower, sink)",
  "Bedrooms tidied",
  "Windows & mirrors",
  "Bins emptied",
];

const isRealBooking = (b) =>
  b.status !== "Blackout" && b.customer?.firstName !== "ADMIN_BLOCK";

const Checklist = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchBookings = () => {
    setLoading(true);
    fetch(`${API}/bookings`)
      .then((r) => r.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const upcoming = useMemo(() => {
    return bookings
      .filter(isRealBooking)
      .filter((b) => b.status !== "Cancelled")
      .filter((b) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          b.bookingId?.toLowerCase().includes(s) ||
          b.customer?.firstName?.toLowerCase().includes(s) ||
          b.customer?.lastName?.toLowerCase().includes(s) ||
          b.service?.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => new Date(a.schedule?.date) - new Date(b.schedule?.date));
  }, [bookings, search]);

  const tasksFor = (booking) =>
    booking.checklist && booking.checklist.length > 0
      ? booking.checklist
      : DEFAULT_TASKS.map((task) => ({ task, done: false }));

  const toggleTask = async (booking, idx) => {
    const tasks = tasksFor(booking).map((t, i) =>
      i === idx ? { ...t, done: !t.done } : t,
    );
    setSaving(true);
    try {
      const res = await fetch(`${API}/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: tasks }),
      });
      const updated = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b._id === booking._id ? updated : b)),
      );
    } catch {
      // ignore — leave state as-is on failure
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks size={22} className="text-primary" /> Cleaning
            Checklist
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track per-job cleaning tasks for quality assurance
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all font-semibold text-sm shadow-sm self-start"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by booking ID, customer, or service..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-400">
            Loading bookings...
          </p>
        ) : upcoming.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">
            No bookings found
          </p>
        ) : (
          upcoming.map((booking) => {
            const tasks = tasksFor(booking);
            const doneCount = tasks.filter((t) => t.done).length;
            const isOpen = openId === booking._id;
            return (
              <div key={booking._id}>
                <button
                  onClick={() => setOpenId(isOpen ? null : booking._id)}
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      {booking.bookingId}
                      <span className="text-slate-400 font-medium">
                        — {booking.service}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User size={11} /> {booking.customer?.firstName}{" "}
                        {booking.customer?.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />{" "}
                        {booking.schedule?.date
                          ? new Date(booking.schedule.date).toLocaleDateString(
                              "en-GB",
                            )
                          : "No date"}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                      doneCount === tasks.length
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {doneCount}/{tasks.length} done
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 -mt-1">
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                      {tasks.map((t, idx) => (
                        <button
                          key={idx}
                          disabled={saving}
                          onClick={() => toggleTask(booking, idx)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white transition-colors text-left disabled:opacity-60"
                        >
                          {t.done ? (
                            <CheckCircle2
                              size={18}
                              className="text-emerald-500 flex-shrink-0"
                            />
                          ) : (
                            <Circle
                              size={18}
                              className="text-slate-300 flex-shrink-0"
                            />
                          )}
                          <span
                            className={`text-sm font-medium ${t.done ? "text-slate-400 line-through" : "text-slate-700"}`}
                          >
                            {t.task}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Checklist;
