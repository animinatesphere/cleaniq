import { useState, useEffect } from "react";
import {
  Search, CheckCircle2, XCircle, Briefcase,
  MapPin, Calendar, ChevronRight, User, X, Building2,
  Phone, Mail, Clock, Home as HomeIcon, Repeat,
  ShoppingBag, PawPrint, Hash, UserCheck, FileText,
  AlertCircle, Info, Zap, UserCog, ChevronDown,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const STATUS_META = {
  pending_review: { label: "Pending Review", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25"    },
  approved:       { label: "Approved",        cls: "bg-sky-500/15 text-sky-400 border-sky-500/25"          },
  assigned:       { label: "Worker Assigned", cls: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
  in_progress:    { label: "In Progress",     cls: "bg-blue-500/15 text-blue-400 border-blue-500/25"       },
  completed:      { label: "Completed",       cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"},
  cancelled:      { label: "Cancelled",       cls: "bg-white/5 text-white/40 border-white/10"              },
  rejected:       { label: "Rejected",        cls: "bg-rose-500/15 text-rose-400 border-rose-500/25"       },
};

const TABS = [
  { key: "all",           label: "All"      },
  { key: "pending_review",label: "Pending"  },
  { key: "approved",      label: "Approved" },
  { key: "assigned",      label: "Assigned" },
  { key: "in_progress",   label: "Active"   },
  { key: "completed",     label: "Done"     },
  { key: "rejected",      label: "Rejected" },
];

const ROOM_KEYS = [
  "Bedroom","Bathroom","Kitchen","Living Room",
  "Utility Room","Reception Room","Conservatory","Cloakroom",
];

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
  : null;

const fmtShortDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
  : null;

const fmtDateTime = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
  : null;

export default function CompanyJobs() {
  const [jobs,            setJobs]           = useState([]);
  const [loading,         setLoading]        = useState(true);
  const [tab,             setTab]            = useState("all");
  const [search,          setSearch]         = useState("");
  const [selected,        setSelected]       = useState(null);
  const [rejecting,       setRejecting]      = useState(false);
  const [rejectReason,    setRejectReason]   = useState("");
  const [acting,          setActing]         = useState(false);

  // Worker assignment
  const [workers,         setWorkers]        = useState([]);
  const [workerSearch,    setWorkerSearch]   = useState("");
  const [selectedWorker,  setSelectedWorker] = useState(null);
  const [assigning,       setAssigning]      = useState(false);
  const [assignSuccess,   setAssignSuccess]  = useState(false);
  const [workerDropOpen,  setWorkerDropOpen] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/jobs`);
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const fetchWorkers = async () => {
    try {
      const res  = await fetch(`${API}/workers`);
      const data = await res.json();
      if (Array.isArray(data)) setWorkers(data);
    } catch {}
  };

  useEffect(() => { fetchWorkers(); }, []);

  const filtered = jobs.filter(j => {
    if (tab !== "all" && j.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        j.jobId?.toLowerCase().includes(q) ||
        j.service?.toLowerCase().includes(q) ||
        j.company?.name?.toLowerCase().includes(q) ||
        j.property?.address?.toLowerCase().includes(q) ||
        j.contact?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const approve = async (id) => {
    setActing(true);
    try {
      const res = await fetch(`${API}/jobs/${id}/approve`, { method: "PUT" });
      if (res.ok) { await fetchJobs(); closeModal(); }
    } catch {}
    finally { setActing(false); }
  };

  const reject = async (id) => {
    if (!rejectReason.trim()) return;
    setActing(true);
    try {
      const res = await fetch(`${API}/jobs/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) { await fetchJobs(); closeModal(); }
    } catch {}
    finally { setActing(false); }
  };

  const closeModal = () => {
    setSelected(null);
    setRejecting(false);
    setRejectReason("");
    setSelectedWorker(null);
    setWorkerSearch("");
    setAssignSuccess(false);
    setWorkerDropOpen(false);
  };

  const assignWorker = async () => {
    if (!selectedWorker || !selected) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API}/jobs/${selected._id}/assign-worker`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId:   selectedWorker._id,
          workerName: `${selectedWorker.firstName || ""} ${selectedWorker.lastName || ""}`.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignSuccess(true);
        // update local selected and jobs list without a second fetch
        if (data.job) setSelected(data.job);
        setJobs(prev => prev.map(j => j._id === selected._id ? (data.job || j) : j));
      }
    } catch {}
    finally { setAssigning(false); }
  };

  const filteredWorkers = workers.filter(w => {
    if (!workerSearch) return true;
    const q = workerSearch.toLowerCase();
    return (
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
      w.email?.toLowerCase().includes(q) ||
      w.phone?.toLowerCase().includes(q)
    );
  });

  const counts = { pending_review: jobs.filter(j => j.status === "pending_review").length };

  const roomData = (job) => {
    const d = job?.details || {};
    const out = {};
    ROOM_KEYS.forEach(k => { if ((d[k] || 0) > 0) out[k] = d[k]; });
    return out;
  };

  const slotLabel = (slot) => ({
    Morning:   "Morning (8am – 12pm)",
    Afternoon: "Afternoon (12pm – 4pm)",
    Evening:   "Evening (4pm – 8pm)",
    Flexible:  "Flexible",
  }[slot] || slot || "Not set");

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 size={24} className="text-emerald-400" />
            Company Jobs
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Jobs posted by company accounts — review and approve before assigning workers
          </p>
        </div>
        {counts.pending_review > 0 && (
          <div className="bg-amber-500/15 border border-amber-500/25 text-amber-400 px-4 py-2 rounded-xl text-sm font-semibold">
            {counts.pending_review} pending review
          </div>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key ? "bg-emerald-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t.label}
              {t.key === "pending_review" && counts.pending_review > 0 && (
                <span className="ml-1.5 bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {counts.pending_review}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 w-56"
          />
        </div>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="text-center text-white/40 py-20">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-white/40 py-20">
          <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
          <p>No jobs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(job => {
            const m = STATUS_META[job.status] || STATUS_META.pending_review;
            return (
              <div
                key={job._id}
                onClick={() => setSelected(job)}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.08] hover:border-white/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-400 text-xs font-bold">{job.jobId}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>
                  </div>
                  <p className="font-semibold text-sm">{job.service}</p>
                  <div className="flex items-center gap-3 mt-1 text-white/40 text-xs flex-wrap">
                    {job.company?.name && (
                      <span className="flex items-center gap-1"><Building2 size={11} />{job.company.name}</span>
                    )}
                    {job.contact?.name && (
                      <span className="flex items-center gap-1"><User size={11} />{job.contact.name}</span>
                    )}
                    {job.property?.address && (
                      <span className="flex items-center gap-1 truncate"><MapPin size={11} />{job.property.address}</span>
                    )}
                    {job.schedule?.date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />{fmtShortDate(job.schedule.date)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/30 shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          DETAIL MODAL — styled to match booking detail quality
      ═══════════════════════════════════════════════════════════ */}
      {selected && (() => {
        const m   = STATUS_META[selected.status] || STATUS_META.pending_review;
        const rooms = roomData(selected);
        const hasContact = selected.contact?.name || selected.contact?.phone || selected.contact?.email;
        const hasPet     = selected.details?.hasPet && selected.details.hasPet !== "No";

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#071E16]/70 backdrop-blur-md" onClick={closeModal} />

            {/* Panel */}
            <div className="relative w-full max-w-4xl bg-[#071E16] rounded-[28px] shadow-2xl shadow-black/60 overflow-hidden border border-white/[0.08] flex flex-col max-h-[90vh]">

              {/* ── Header ─────────────────────────────────────────────── */}
              <div className="px-6 py-5 border-b border-white/[0.07] flex flex-wrap justify-between items-center gap-3 bg-[#0B2D22] shrink-0">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-11 h-11 bg-emerald-500/20 border border-emerald-500/25 rounded-2xl flex items-center justify-center shrink-0">
                    <Briefcase size={18} className="text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-white tracking-tight truncate">Job Details</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest tabular-nums">
                        {selected.jobId}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wide ${m.cls}`}>
                        {m.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-white/30 font-semibold hidden sm:block">
                    Submitted {fmtDateTime(selected.createdAt)}
                  </p>
                  <button
                    onClick={closeModal}
                    className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/40 hover:bg-rose-500/15 hover:text-rose-400 transition-all shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* ── Scrollable body ─────────────────────────────────────── */}
              <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 bg-[#071E16]">

                {/* Service badge */}
                <div>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-bold">
                    <Briefcase size={15} className="text-emerald-400" />
                    {selected.service}
                  </span>
                </div>

                {/* ── Top contact cards ─────────────────────────────────── */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Company */}
                  <div className="p-5 rounded-2xl bg-white/4 border border-white/[0.07] text-center">
                    <Building2 size={20} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Company</p>
                    <p className="text-xs font-bold text-white/85 truncate">{selected.company?.name || "—"}</p>
                    {selected.company?.email && (
                      <a href={`mailto:${selected.company.email}`} className="text-[10px] text-sky-400 hover:underline block truncate mt-0.5">
                        {selected.company.email}
                      </a>
                    )}
                  </div>

                  {/* Contact phone */}
                  <div className="p-5 rounded-2xl bg-white/4 border border-white/[0.07] text-center">
                    <Phone size={20} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Company Phone</p>
                    <p className="text-xs font-bold text-white/85">{selected.company?.phone || "—"}</p>
                  </div>

                  {/* Status */}
                  <div className="p-5 rounded-2xl bg-white/4 border border-white/[0.07] text-center">
                    <Hash size={20} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Status</p>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${m.cls}`}>{m.label}</span>
                  </div>
                </div>

                {/* ── Contact at Property ───────────────────────────────── */}
                {hasContact && (
                  <div className="bg-amber-500/10 rounded-2xl p-6 border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-amber-500/15">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        <UserCheck size={22} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-amber-400/70 uppercase tracking-widest">
                          Contact at Property
                        </p>
                        <p className="text-sm font-bold text-white/85">{selected.contact?.name || "—"}</p>
                        <p className="text-[10px] text-amber-400/60 font-semibold mt-0.5">
                          Cleaner will contact this person on arrival
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {selected.contact?.phone && (
                        <div>
                          <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wide">Phone</p>
                          <a href={`tel:${selected.contact.phone}`} className="text-xs font-bold text-white/75 hover:text-amber-400 transition-colors">
                            {selected.contact.phone}
                          </a>
                        </div>
                      )}
                      {selected.contact?.email && (
                        <div>
                          <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wide">Email</p>
                          <a href={`mailto:${selected.contact.email}`} className="text-xs font-bold text-sky-400 hover:underline truncate block">
                            {selected.contact.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Assigned Worker (already assigned) ────────────────── */}
                {selected.assignedWorkerName && (
                  <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/20 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <User size={20} className="text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-widest">Worker Assigned</p>
                      <p className="text-sm font-bold text-white/85">{selected.assignedWorkerName}</p>
                    </div>
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  </div>
                )}

                {/* ── Worker Assignment Panel (approved, not yet assigned) ── */}
                {selected.status === "approved" && !selected.assignedWorkerName && (
                  <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 overflow-hidden">
                    {/* Panel header */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-violet-500/15">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                        <UserCog size={17} className="text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-violet-300">Assign a Worker</p>
                        <p className="text-[10px] text-violet-400/60 font-semibold mt-0.5">
                          Choose which cleaner handles this job
                        </p>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      {assignSuccess ? (
                        <div className="flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/25 rounded-xl p-4">
                          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-emerald-300 font-bold text-sm">Worker assigned successfully!</p>
                            <p className="text-emerald-400/60 text-xs mt-0.5">
                              {selectedWorker ? `${selectedWorker.firstName} ${selectedWorker.lastName}` : ""} has been assigned and notified.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Worker picker dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setWorkerDropOpen(o => !o)}
                              className="w-full flex items-center justify-between gap-3 bg-white/5 border border-white/10 hover:border-violet-500/40 rounded-xl px-4 py-3 transition-all text-left"
                            >
                              {selectedWorker ? (
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-violet-500/25 flex items-center justify-center shrink-0 text-violet-300 font-black text-xs">
                                    {(selectedWorker.firstName || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-white/85 leading-tight truncate">
                                      {selectedWorker.firstName} {selectedWorker.lastName}
                                    </p>
                                    <p className="text-[10px] text-white/40 truncate">{selectedWorker.email}</p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-white/30 font-semibold">Select a worker…</span>
                              )}
                              <ChevronDown
                                size={14}
                                className={`text-white/30 shrink-0 transition-transform ${workerDropOpen ? "rotate-180" : ""}`}
                              />
                            </button>

                            {workerDropOpen && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-[#0D1F18] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
                                {/* Search inside dropdown */}
                                <div className="p-2 border-b border-white/[0.07]">
                                  <div className="relative">
                                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
                                    <input
                                      autoFocus
                                      value={workerSearch}
                                      onChange={e => setWorkerSearch(e.target.value)}
                                      placeholder="Search workers…"
                                      className="w-full bg-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/25 outline-none focus:ring-1 focus:ring-violet-500/40"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {filteredWorkers.length === 0 ? (
                                    <p className="text-center text-white/25 text-xs py-4">No workers found</p>
                                  ) : filteredWorkers.map(w => (
                                    <button
                                      key={w._id}
                                      onClick={() => { setSelectedWorker(w); setWorkerDropOpen(false); setWorkerSearch(""); }}
                                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left ${selectedWorker?._id === w._id ? "bg-violet-500/10" : ""}`}
                                    >
                                      <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 text-violet-300 font-black text-xs">
                                        {(w.firstName || "?").charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-white/80 leading-tight truncate">
                                          {w.firstName} {w.lastName}
                                        </p>
                                        <p className="text-[10px] text-white/35 truncate">{w.email || w.phone}</p>
                                      </div>
                                      {selectedWorker?._id === w._id && (
                                        <CheckCircle2 size={14} className="text-violet-400 shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Assign button */}
                          <button
                            onClick={assignWorker}
                            disabled={!selectedWorker || assigning}
                            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-black text-sm transition-all shadow-sm shadow-violet-500/20"
                          >
                            <UserCog size={15} />
                            {assigning ? "Assigning…" : selectedWorker
                              ? `Assign to ${selectedWorker.firstName} ${selectedWorker.lastName}`
                              : "Select a worker first"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ── 2-column detail grid ─────────────────────────────── */}
                <div className="grid md:grid-cols-2 gap-10">

                  {/* LEFT: Address / Schedule / Notes */}
                  <div className="space-y-6">
                    {/* Address */}
                    {(selected.property?.address || selected.property?.postcode || selected.region) && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mt-1 shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Property Address</h4>
                          {selected.property?.address && (
                            <p className="font-bold text-white/85 leading-tight">{selected.property.address}</p>
                          )}
                          {selected.property?.postcode && (
                            <p className="text-sm font-semibold text-white/60">{selected.property.postcode}</p>
                          )}
                          {selected.region && (
                            <p className="text-xs font-semibold text-emerald-400 mt-0.5">{selected.region}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Job Date</h4>
                        <p className="font-bold text-white/85">
                          {fmtDate(selected.schedule?.date) || "Not set"}
                        </p>
                      </div>
                    </div>

                    {/* Duration & Timing */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Duration & Timing</h4>
                        {selected.details?.duration && (
                          <p className="font-bold text-white/85">
                            {selected.details.duration}h Clean
                          </p>
                        )}
                        <p className="text-[11px] font-bold text-white/60 uppercase mt-1">
                          Slot: {slotLabel(selected.schedule?.timeSlot)}
                        </p>
                        {selected.schedule?.preferredTime && (
                          <p className="text-[11px] font-bold text-emerald-400 uppercase mt-1">
                            Preferred: {selected.schedule.preferredTime}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Frequency & Supplies */}
                    {(selected.details?.frequency || selected.details?.suppliesProvidedBy) && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mt-1 shrink-0">
                          <Repeat size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Frequency & Supplies</h4>
                          {selected.details?.frequency && (
                            <p className="font-bold text-white/85">{selected.details.frequency}</p>
                          )}
                          {selected.details?.suppliesProvidedBy && (
                            <p className="text-xs font-semibold text-white/60 mt-0.5">
                              Supplies by: {selected.details.suppliesProvidedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selected.notes && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mt-1 shrink-0">
                          <Info size={20} />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Notes & Instructions</h4>
                          <p className="text-xs font-bold text-white/60 leading-relaxed italic whitespace-pre-wrap">
                            "{selected.notes}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Rooms / Pet */}
                  <div className="space-y-6">
                    {/* Property Rooms */}
                    {Object.keys(rooms).length > 0 && (
                      <div className="p-6 bg-indigo-500/10 rounded-[24px] border-2 border-indigo-500/25 space-y-4">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <HomeIcon size={16} className="text-indigo-400" />
                          Property Rooms
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {Object.entries(rooms).map(([key, qty]) => (
                            <div
                              key={key}
                              className="bg-white/5 rounded-lg border-2 border-indigo-500/25 p-3 text-center hover:shadow-md transition-shadow"
                            >
                              <p className="text-[10px] font-bold text-indigo-400">{qty}x</p>
                              <p className="text-[9px] font-bold text-white/70 mt-1 line-clamp-2">{key}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pet */}
                    {hasPet && (
                      <div className="p-5 rounded-[24px] border-2 flex items-center gap-4 bg-amber-500/15 border-amber-500/30">
                        <span className="text-2xl">🐾</span>
                        <div>
                          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pet on Premises</p>
                          <p className="font-bold text-amber-300 text-sm mt-1">
                            There is a pet at this property
                          </p>
                          <p className="text-[10px] text-amber-400/60 mt-0.5 font-semibold">
                            Cleaner should be aware
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Linked booking */}
                    {selected.linkedBookingId && (
                      <div className="p-5 rounded-[24px] border-2 flex items-center gap-4 bg-emerald-500/10 border-emerald-500/25">
                        <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Booking Created</p>
                          <p className="text-xs font-bold text-white/70 mt-0.5">
                            This job has been approved and a booking has been generated
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Rejection reason ─────────────────────────────────── */}
                {selected.rejectedReason && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-3">
                    <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-rose-400 text-sm font-bold mb-1">Rejection Reason</p>
                      <p className="text-white/60 text-sm leading-relaxed">{selected.rejectedReason}</p>
                    </div>
                  </div>
                )}

                {/* ── Actions ──────────────────────────────────────────── */}
                {selected.status === "pending_review" && (
                  <div className="space-y-3 border-t border-white/[0.07] pt-6">
                    {!rejecting ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => approve(selected._id)}
                          disabled={acting}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 shadow-sm shadow-emerald-500/25"
                        >
                          <CheckCircle2 size={16} />
                          {acting ? "Approving…" : "Approve & Create Booking"}
                        </button>
                        <button
                          onClick={() => setRejecting(true)}
                          className="flex items-center justify-center gap-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/25 text-rose-400 px-5 py-3.5 rounded-xl font-black text-sm transition-all"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection (required)…"
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 outline-none focus:border-rose-500/50 resize-none"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => reject(selected._id)}
                            disabled={acting || !rejectReason.trim()}
                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50"
                          >
                            {acting ? "Rejecting…" : "Confirm Rejection"}
                          </button>
                          <button
                            onClick={() => { setRejecting(false); setRejectReason(""); }}
                            className="bg-white/5 text-white/50 px-5 py-3 rounded-xl text-sm font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>{/* end scrollable body */}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
