import { useState, useEffect, useCallback } from "react";
import {
  UserCheck, Briefcase, Clock, MapPin, RefreshCw,
  CheckCircle2, AlertCircle, X, Search, ChevronRight,
  User, Star, Phone,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const STATUS_STYLE = {
  Confirmed: { cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-500" },
  Pending:   { cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",       dot: "bg-amber-500" },
  Assigned:  { cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",          dot: "bg-blue-500" },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "TBC";

function StatusChip({ status }) {
  const s = STATUS_STYLE[status] || { cls: "bg-white/10 text-white/50 border-white/10", dot: "bg-white/40" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export default function AssignJobs() {
  const [bookings, setBookings]     = useState([]);
  const [workers, setWorkers]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [assigning, setAssigning]   = useState(false);
  const [toast, setToast]           = useState(null);
  const [bookingSearch, setBookingSearch] = useState("");
  const [workerSearch, setWorkerSearch]   = useState("");
  const [workerRate, setWorkerRate]       = useState("");
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
      const all = Array.isArray(bData) ? bData : bData.bookings ?? [];
      setBookings(all.filter(b => !b.assignedWorker && !b.assignedWorkerName && ["Confirmed", "Pending"].includes(b.status)));
      setWorkers((Array.isArray(wData) ? wData : []).filter(w => w.status === "Active" || w.status === "Confirmed"));
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to assign"); }
      showToast(`${worker.firstName} ${worker.lastName} assigned to ${selected.bookingId}`);
      setSelected(null); setWorkerRate(""); setWorkerDuration("");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAssigning(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const q = bookingSearch.toLowerCase();
    return !q || b.bookingId?.toLowerCase().includes(q) || b.service?.toLowerCase().includes(q)
      || b.details?.address?.toLowerCase().includes(q) || b.customer?.name?.toLowerCase().includes(q)
      || b.details?.name?.toLowerCase().includes(q);
  });

  const filteredWorkers = workers.filter(w => {
    const q = workerSearch.toLowerCase();
    return !q || `${w.firstName} ${w.lastName}`.toLowerCase().includes(q)
      || w.region?.toLowerCase().includes(q) || w.skills?.some(s => s.toLowerCase().includes(q));
  });

  return (
    <div className="h-full flex flex-col gap-6 min-h-0">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold transition-all ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
          {toast.type === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Briefcase size={22} className="text-emerald-400" />
            Assign Jobs
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {bookings.length} unassigned booking{bookings.length !== 1 ? "s" : ""} · {workers.length} active worker{workers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0">

          {/* ── Left: Unassigned Bookings ── */}
          <div className="flex flex-col min-h-0 bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/7 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Unassigned Bookings</h2>
                  <p className="text-sm text-white/40 mt-0.5">{filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}</p>
                </div>
                {selected && (
                  <span className="text-xs font-bold px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                    1 selected
                  </span>
                )}
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)}
                  placeholder="Search by ID, service, address…"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-colors" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <CheckCircle2 size={32} className="text-white/20 mb-3" />
                  <p className="text-base font-semibold text-white/40">All jobs assigned</p>
                  <p className="text-sm text-white/25 mt-1">No unassigned bookings found</p>
                </div>
              ) : filteredBookings.map(b => (
                <button key={b._id} type="button"
                  onClick={() => { setSelected(selected?._id === b._id ? null : b); setWorkerRate(""); setWorkerDuration(""); }}
                  className={`w-full text-left p-5 rounded-xl border transition-all ${selected?._id === b._id ? "bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/5" : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/15"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="text-base font-bold text-white">
                          {b.service || "Cleaning Service"}
                        </p>
                        <StatusChip status={b.status} />
                      </div>
                      <p className="text-sm text-white/50 mt-1">
                        {b.bookingId} · {b.customer?.name || b.details?.name || "Customer"}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                        <span className="flex items-center gap-1.5 text-sm text-white/50">
                          <Clock size={13} className="text-white/30" />
                          {fmtDate(b.schedule?.date)}{b.schedule?.time ? ` at ${b.schedule.time}` : ""}
                        </span>
                        {b.details?.address && (
                          <span className="flex items-center gap-1.5 text-sm text-white/50">
                            <MapPin size={13} className="text-white/30" />
                            <span className="truncate max-w-[180px]">{b.details.address}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {selected?._id === b._id && (
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <ChevronRight size={16} className="text-emerald-400" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: Workers Panel ── */}
          <div className="flex flex-col min-h-0 bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">

            {/* Selected booking summary */}
            {selected ? (
              <div className="px-6 py-5 border-b border-white/7 bg-emerald-500/5 shrink-0">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest mb-1">Assigning to</p>
                    <h3 className="text-base font-bold text-white truncate">{selected.service} · {selected.bookingId}</h3>
                    <p className="text-sm text-white/50 mt-0.5">
                      {fmtDate(selected.schedule?.date)}{selected.schedule?.time ? ` at ${selected.schedule.time}` : ""}
                    </p>
                    {selected.details?.address && (
                      <p className="text-sm text-white/40 flex items-center gap-1.5 mt-1">
                        <MapPin size={12} /> {selected.details.address}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setSelected(null)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                {/* Rate + Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Rate (£/hr) <span className="text-white/20 normal-case font-normal">optional</span></label>
                    <input type="number" value={workerRate} onChange={e => setWorkerRate(e.target.value)} placeholder="e.g. 12"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Duration (hrs) <span className="text-white/20 normal-case font-normal">optional</span></label>
                    <input type="number" value={workerDuration} onChange={e => setWorkerDuration(e.target.value)} placeholder="e.g. 3"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5 border-b border-white/7 shrink-0">
                <h2 className="text-base font-bold text-white">Available Workers</h2>
                <p className="text-sm text-white/40 mt-0.5">{filteredWorkers.length} active worker{filteredWorkers.length !== 1 ? "s" : ""}</p>
              </div>
            )}

            {/* Worker search */}
            <div className="px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={workerSearch} onChange={e => setWorkerSearch(e.target.value)}
                  placeholder="Search by name, region or skill…"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-colors" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredWorkers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <User size={32} className="text-white/20 mb-3" />
                  <p className="text-base font-semibold text-white/40">No workers found</p>
                  <p className="text-sm text-white/25 mt-1">Try a different search term</p>
                </div>
              ) : filteredWorkers.map(w => (
                <div key={w._id}
                  className={`p-5 rounded-xl border transition-all ${selected ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-white/20" : "bg-white/[0.03] border-white/[0.07]"}`}>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="text-base font-black text-emerald-400">
                        {w.firstName?.[0]}{w.lastName?.[0]}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-bold text-white">{w.firstName} {w.lastName}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-full">{w.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {w.region && (
                          <span className="flex items-center gap-1 text-sm text-white/50">
                            <MapPin size={12} className="text-white/30" /> {w.region}
                          </span>
                        )}
                        {w.phone && (
                          <span className="flex items-center gap-1 text-sm text-white/50">
                            <Phone size={12} className="text-white/30" /> {w.phone}
                          </span>
                        )}
                      </div>
                      {w.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {w.skills.slice(0, 3).map(s => (
                            <span key={s} className="text-xs font-medium px-2 py-0.5 bg-white/5 text-white/50 border border-white/10 rounded-lg">{s}</span>
                          ))}
                          {w.skills.length > 3 && <span className="text-xs text-white/30">+{w.skills.length - 3}</span>}
                        </div>
                      )}
                    </div>
                    {/* Assign button */}
                    {selected && (
                      <button onClick={() => assign(w)} disabled={assigning}
                        className="shrink-0 flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all">
                        {assigning ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!selected && (
              <div className="px-6 py-4 border-t border-white/[0.07] text-sm text-white/30 text-center shrink-0">
                ← Select a booking on the left to assign a worker
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
