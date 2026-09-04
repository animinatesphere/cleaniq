import { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Briefcase,
  Clock,
  MapPin,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const STATUS_COLOR = {
  Confirmed: "bg-emerald-500/20 text-emerald-400",
  Pending: "bg-amber-500/20 text-amber-400",
  Assigned: "bg-blue-500/20 text-blue-400",
};

export default function AssignJobs() {
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selected, setSelected] = useState(null); // selected booking
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState(null);
  const [bookingSearch, setBookingSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const [workerRate, setWorkerRate] = useState("");
  const [workerDuration, setWorkerDuration] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, wRes] = await Promise.all([
        fetch(`${API}/bookings?limit=200`),
        fetch(`${API}/workers`),
      ]);
      const bData = await bRes.json();
      const wData = await wRes.json();

      const allBookings = Array.isArray(bData) ? bData : bData.bookings ?? [];
      const unassigned = allBookings.filter(
        (b) =>
          !b.assignedWorker &&
          !b.assignedWorkerName &&
          ["Confirmed", "Pending"].includes(b.status)
      );
      setBookings(unassigned);

      const activeWorkers = (Array.isArray(wData) ? wData : []).filter(
        (w) => w.status === "Active" || w.status === "Confirmed"
      );
      setWorkers(activeWorkers);
    } catch (err) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async (worker) => {
    if (!selected) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API}/workers/jobs/${selected._id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: worker._id,
          workerDuration: workerDuration ? Number(workerDuration) : undefined,
          workerRate: workerRate ? Number(workerRate) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to assign");
      }
      showToast(
        `${worker.firstName} ${worker.lastName} assigned to ${selected.bookingId}`,
        "success"
      );
      setSelected(null);
      setWorkerRate("");
      setWorkerDuration("");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAssigning(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const q = bookingSearch.toLowerCase();
    return (
      !q ||
      b.bookingId?.toLowerCase().includes(q) ||
      b.service?.toLowerCase().includes(q) ||
      b.details?.address?.toLowerCase().includes(q) ||
      b.customer?.name?.toLowerCase().includes(q) ||
      b.details?.name?.toLowerCase().includes(q)
    );
  });

  const filteredWorkers = workers.filter((w) => {
    const q = workerSearch.toLowerCase();
    return (
      !q ||
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
      w.region?.toLowerCase().includes(q) ||
      w.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "TBC";

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-rose-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white/90 flex items-center gap-2">
            <Briefcase size={20} className="text-emerald-400" />
            Assign Jobs
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {bookings.length} unassigned booking{bookings.length !== 1 ? "s" : ""} ·{" "}
            {workers.length} active worker{workers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/60 hover:bg-white/10 transition-all"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
          Loading…
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
          {/* Unassigned Bookings */}
          <div className="flex flex-col min-h-0 bg-white/[0.03] border border-white/[0.07] rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] shrink-0">
              <h2 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">
                Unassigned Bookings
              </h2>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search bookings…"
                  className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredBookings.length === 0 && (
                <div className="text-center text-white/25 text-xs py-10">
                  No unassigned bookings
                </div>
              )}
              {filteredBookings.map((b) => (
                <button
                  key={b._id}
                  onClick={() => {
                    setSelected(selected?._id === b._id ? null : b);
                    setWorkerRate("");
                    setWorkerDuration("");
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selected?._id === b._id
                      ? "bg-emerald-500/15 border-emerald-500/40"
                      : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white/85 truncate">
                        {b.service || "Cleaning Service"}
                      </p>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        {b.bookingId} ·{" "}
                        {b.customer?.name || b.details?.name || "Customer"}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-white/50">
                        <Clock size={10} />
                        {fmtDate(b.schedule?.date)}
                        {b.schedule?.time ? ` · ${b.schedule.time}` : ""}
                      </div>
                      {b.details?.address && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-white/40 truncate">
                          <MapPin size={10} />
                          {b.details.address}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] || "bg-white/10 text-white/50"}`}
                      >
                        {b.status}
                      </span>
                      {selected?._id === b._id && (
                        <ChevronRight size={14} className="text-emerald-400" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Workers Panel */}
          <div className="flex flex-col min-h-0 bg-white/[0.03] border border-white/[0.07] rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] shrink-0">
              {selected ? (
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                      Assign Worker
                    </h2>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-white/30 hover:text-white/60"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-emerald-400 mt-1">
                    {selected.service} · {selected.bookingId}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {fmtDate(selected.schedule?.date)}
                    {selected.schedule?.time ? ` at ${selected.schedule.time}` : ""}
                  </p>
                  {/* Optional rate/duration */}
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
                        Rate (£/hr)
                      </label>
                      <input
                        type="number"
                        value={workerRate}
                        onChange={(e) => setWorkerRate(e.target.value)}
                        placeholder="e.g. 12"
                        className="w-full mt-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
                        Duration (hrs)
                      </label>
                      <input
                        type="number"
                        value={workerDuration}
                        onChange={(e) => setWorkerDuration(e.target.value)}
                        placeholder="e.g. 3"
                        className="w-full mt-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <h2 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">
                  Available Workers
                </h2>
              )}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  placeholder="Search workers…"
                  className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 placeholder-white/25 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredWorkers.length === 0 && (
                <div className="text-center text-white/25 text-xs py-10">
                  No active workers found
                </div>
              )}
              {filteredWorkers.map((w) => (
                <div
                  key={w._id}
                  className="p-4 rounded-2xl border bg-white/[0.03] border-white/[0.07] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <UserCheck size={16} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white/85">
                        {w.firstName} {w.lastName}
                      </p>
                      <p className="text-[10px] text-white/40 truncate">
                        {w.region || "No region"} ·{" "}
                        {w.skills?.slice(0, 2).join(", ") || "General cleaning"}
                      </p>
                    </div>
                  </div>
                  {selected ? (
                    <button
                      onClick={() => assign(w)}
                      disabled={assigning}
                      className="shrink-0 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[10px] font-black rounded-xl transition-all flex items-center gap-1"
                    >
                      {assigning ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={10} />
                      )}
                      Assign
                    </button>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                      {w.status}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {!selected && (
              <div className="px-5 py-3 border-t border-white/[0.07] text-[10px] text-white/25 text-center shrink-0">
                Select a booking on the left to assign a worker
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
