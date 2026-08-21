import { useState, useEffect, useCallback } from "react";
import {
  Eye, EyeOff, Search, Users, MapPin, Calendar,
  Clock, X, ChevronRight, CheckCircle2, Globe,
  Lock, Unlock, RefreshCw, User, Building2,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
  : "No date";

const fmtTime = (s) => {
  if (!s) return null;
  if (s.timeSlot) return s.timeSlot;
  if (s.preferredTime) return s.preferredTime;
  return null;
};

export default function JobVisibility() {
  const [bookings, setBookings]     = useState([]);
  const [workers,  setWorkers]      = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [search,   setSearch]       = useState("");
  const [selected, setSelected]     = useState(null);   // booking being edited
  const [saving,   setSaving]       = useState(false);
  const [wSearch,  setWSearch]      = useState("");
  // local copy of visibleToWorkers for the open panel
  const [draft,    setDraft]        = useState([]);     // array of worker _id strings

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, wRes] = await Promise.all([
        fetch(`${API}/workers/jobs?all=1`),           // get all regardless of visibility
        fetch(`${API}/workers`),
      ]);
      const [bData, wData] = await Promise.all([bRes.json(), wRes.json()]);
      if (Array.isArray(bData)) setBookings(bData);
      if (Array.isArray(wData)) setWorkers(wData);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openPanel = (booking) => {
    setSelected(booking);
    setDraft((booking.visibleToWorkers || []).map(id => id.toString()));
    setWSearch("");
  };

  const closePanel = () => { setSelected(null); setDraft([]); setWSearch(""); };

  const toggleWorker = (wId) => {
    setDraft(prev =>
      prev.includes(wId) ? prev.filter(id => id !== wId) : [...prev, wId]
    );
  };

  const setOpenToAll = () => setDraft([]);

  const saveVisibility = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/workers/jobs/${selected._id}/visibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleToWorkers: draft }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(prev => prev.map(b => b._id === updated._id ? updated : b));
        setSelected(updated);
        setDraft((updated.visibleToWorkers || []).map(id => id.toString()));
      }
    } catch {}
    finally { setSaving(false); }
  };

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.bookingId?.toLowerCase().includes(q) ||
      b.service?.toLowerCase().includes(q) ||
      `${b.customer?.firstName} ${b.customer?.lastName}`.toLowerCase().includes(q) ||
      b.details?.address?.toLowerCase().includes(q) ||
      b.property?.address?.toLowerCase().includes(q)
    );
  });

  const filteredWorkers = workers.filter(w => {
    if (!wSearch) return true;
    const q = wSearch.toLowerCase();
    return `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
           w.email?.toLowerCase().includes(q);
  });

  const isRestricted = (b) =>
    Array.isArray(b.visibleToWorkers) && b.visibleToWorkers.length > 0;

  const workerName = (id) => {
    const w = workers.find(w => w._id?.toString() === id?.toString());
    return w ? `${w.firstName} ${w.lastName}` : id;
  };

  // Count changes compared to saved state
  const hasChanges = selected && (
    JSON.stringify(draft.slice().sort()) !==
    JSON.stringify((selected.visibleToWorkers || []).map(id => id.toString()).sort())
  );

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye size={24} className="text-emerald-400" />
            Job Visibility Control
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Control which workers can see each available job in their feed.
            By default every worker sees all open jobs.
          </p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-semibold text-white/60 transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400">
          <Globe size={12} />
          Open to all workers
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400">
          <Lock size={12} />
          Restricted to specific workers
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* ── Job list ── */}
      {loading ? (
        <div className="text-center text-white/30 py-20">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-white/30 py-20">
          <Eye size={40} className="mx-auto mb-3 opacity-20" />
          <p>No available jobs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => {
            const restricted = isRestricted(b);
            const addr = b.details?.address || b.property?.address || "";
            const time  = fmtTime(b.schedule);
            return (
              <div
                key={b._id}
                onClick={() => openPanel(b)}
                className={`group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:border-white/25 hover:bg-white/[0.06]
                  ${restricted
                    ? "bg-amber-500/[0.04] border-amber-500/20"
                    : "bg-white/[0.03] border-white/[0.08]"
                  }`}
              >
                {/* Visibility indicator */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  restricted ? "bg-amber-500/15" : "bg-emerald-500/10"
                }`}>
                  {restricted
                    ? <Lock size={15} className="text-amber-400" />
                    : <Globe size={15} className="text-emerald-400" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-emerald-400 text-xs font-bold">{b.bookingId}</span>
                    {restricted && (
                      <span className="bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {b.visibleToWorkers.length} worker{b.visibleToWorkers.length !== 1 ? "s" : ""} only
                      </span>
                    )}
                    {!restricted && (
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        All workers
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm text-white/85 truncate">{b.service}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-white/40 text-xs flex-wrap">
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      {b.customer?.firstName} {b.customer?.lastName}
                    </span>
                    {addr && (
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <MapPin size={10} />{addr}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />{fmtDate(b.schedule?.date)}
                    </span>
                    {time && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />{time}
                      </span>
                    )}
                  </div>

                  {/* Restricted worker chips */}
                  {restricted && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {b.visibleToWorkers.slice(0, 5).map(wId => (
                        <span key={wId.toString()} className="bg-white/5 border border-white/10 text-white/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {workerName(wId)}
                        </span>
                      ))}
                      {b.visibleToWorkers.length > 5 && (
                        <span className="text-white/30 text-[10px] font-semibold px-1 py-0.5">
                          +{b.visibleToWorkers.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <ChevronRight size={15} className="text-white/20 group-hover:text-white/40 shrink-0 transition-colors" />
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          EDIT PANEL (right-side slide-over)
      ══════════════════════════════════════════════════ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={closePanel} />

          {/* Panel */}
          <div className="w-full max-w-md bg-[#071E16] border-l border-white/[0.08] flex flex-col h-full shadow-2xl">

            {/* Panel header */}
            <div className="flex items-start justify-between p-5 border-b border-white/[0.07] shrink-0">
              <div>
                <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest mb-0.5">
                  {selected.bookingId}
                </p>
                <h3 className="text-base font-black text-white">{selected.service}</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {selected.customer?.firstName} {selected.customer?.lastName} ·{" "}
                  {fmtDate(selected.schedule?.date)}
                </p>
              </div>
              <button
                onClick={closePanel}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 transition-all shrink-0 mt-0.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current mode + quick switch */}
            <div className="p-5 border-b border-white/[0.07] space-y-3 shrink-0">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wide">Visibility Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={setOpenToAll}
                  className={`flex items-center gap-2 justify-center py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    draft.length === 0
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/[0.04] border-white/10 text-white/40 hover:bg-white/[0.07]"
                  }`}
                >
                  <Globe size={14} />
                  All Workers
                </button>
                <button
                  onClick={() => { if (draft.length === 0 && workers.length > 0) setDraft([workers[0]._id.toString()]); }}
                  className={`flex items-center gap-2 justify-center py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    draft.length > 0
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-white/[0.04] border-white/10 text-white/40 hover:bg-white/[0.07]"
                  }`}
                >
                  <Lock size={14} />
                  Specific Only
                </button>
              </div>

              {draft.length === 0 && (
                <p className="text-xs text-emerald-400/60 font-semibold">
                  ✓ This job is visible to all workers in their feed
                </p>
              )}
              {draft.length > 0 && (
                <p className="text-xs text-amber-400/70 font-semibold">
                  Only the {draft.length} selected worker{draft.length !== 1 ? "s" : ""} will see this job
                </p>
              )}
            </div>

            {/* Worker list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 border-b border-white/[0.05] sticky top-0 bg-[#071E16] z-10">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    value={wSearch}
                    onChange={e => setWSearch(e.target.value)}
                    placeholder="Filter workers…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-emerald-500/40"
                  />
                </div>
              </div>

              <div className="p-3 space-y-1">
                {filteredWorkers.length === 0 && (
                  <p className="text-center text-white/25 text-sm py-6">No workers found</p>
                )}
                {filteredWorkers.map(w => {
                  const wId = w._id.toString();
                  const checked = draft.includes(wId);
                  return (
                    <button
                      key={wId}
                      onClick={() => toggleWorker(wId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${
                        checked
                          ? "bg-emerald-500/10 border-emerald-500/25"
                          : "bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/10"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        checked ? "bg-emerald-500/30 text-emerald-300" : "bg-white/10 text-white/50"
                      }`}>
                        {(w.firstName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight truncate ${checked ? "text-white" : "text-white/60"}`}>
                          {w.firstName} {w.lastName}
                        </p>
                        <p className="text-[10px] text-white/30 truncate">{w.email || w.phone}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? "border-emerald-500 bg-emerald-500" : "border-white/20"
                      }`}>
                        {checked && <CheckCircle2 size={12} color="#fff" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save footer */}
            <div className="p-4 border-t border-white/[0.07] shrink-0 space-y-2">
              {draft.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-400/70 font-semibold mb-1">
                  <Globe size={12} />
                  Open to all workers
                </div>
              )}
              {draft.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-400/70 font-semibold mb-1">
                  <Lock size={12} />
                  {draft.length} worker{draft.length !== 1 ? "s" : ""} selected
                </div>
              )}
              <button
                onClick={saveVisibility}
                disabled={saving || !hasChanges}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-black text-sm transition-all"
              >
                {saving ? "Saving…" : hasChanges ? "Save Visibility Settings" : "No Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
