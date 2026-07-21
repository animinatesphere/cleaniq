import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Plus, X, ChevronRight, RefreshCw, MoreHorizontal,
  Mail, Phone, Briefcase, Calendar, User, ArrowRight,
  Trash2, Edit2, CheckCircle, Tag,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STAGES = ["New", "Quoted", "Follow-up", "Booked", "Lost"];
const COLUMN_PAGE_SIZE = 8;

function bookingStatusToStage(status) {
  if (!status) return null;
  const s = status.toLowerCase();
  if (["confirmed", "upcoming", "in progress", "completed", "completed - unpaid"].some(v => s.includes(v))) return "Booked";
  if (["cancelled", "no show", "blackout", "lost"].some(v => s.includes(v))) return "Lost";
  if (["quoted", "pending"].some(v => s.includes(v))) return "Quoted";
  return null;
}

const STAGE_STYLES = {
  New:         { border: "border-l-blue-500",    badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",         dot: "bg-blue-500" },
  Quoted:      { border: "border-l-amber-500",   badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",       dot: "bg-amber-500" },
  "Follow-up": { border: "border-l-purple-500",  badge: "bg-purple-500/15 text-purple-400 border-purple-500/25",   dot: "bg-purple-500" },
  Booked:      { border: "border-l-emerald-500", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-500" },
  Lost:        { border: "border-l-white/20",    badge: "bg-white/5 text-white/40 border-white/10",                 dot: "bg-white/25" },
};

const STAGE_HEADER = {
  New:         "bg-blue-500/15 text-blue-400",
  Quoted:      "bg-amber-500/15 text-amber-400",
  "Follow-up": "bg-purple-500/15 text-purple-400",
  Booked:      "bg-emerald-500/15 text-emerald-400",
  Lost:        "bg-white/5 text-white/40",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isThisWeek(d) {
  if (!d) return false;
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return new Date(d) >= weekAgo && new Date(d) <= now;
}

const BLANK_LEAD = { name: "", email: "", phone: "", serviceInterest: "" };

function CardMenu({ lead, currentStage, onMove, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[#0B2D22] border border-white/10 rounded-xl shadow-xl z-30 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Move to stage</p>
          </div>
          {STAGES.filter(s => s !== currentStage).map(s => (
            <button
              key={s}
              onClick={() => { onMove(s); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:bg-[#0A2A1F] font-medium transition-colors"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_STYLES[s]?.dot}`} />
              {s}
            </button>
          ))}
          <div className="border-t border-white/10">
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 hover:bg-[#0A2A1F] font-medium transition-colors"
            >
              <Edit2 size={12} className="text-white/40" /> Edit details
            </button>
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 font-medium transition-colors"
            >
              <Trash2 size={12} /> Delete lead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadDrawer({ lead, onClose, onMove, onDelete, onSave, movingId }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...lead });
  const [saving, setSaving] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const stageRef = useRef(null);

  useEffect(() => {
    setForm({ ...lead });
    setEditing(false);
  }, [lead]);

  useEffect(() => {
    const handler = (e) => { if (stageRef.current && !stageRef.current.contains(e.target)) setStageOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveEdit = async () => {
    setSaving(true);
    try {
      await onSave(lead._id, { name: form.name, email: form.email, phone: form.phone, serviceInterest: form.serviceInterest });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const stage = lead.stage || "New";
  const stageStyle = STAGE_STYLES[stage];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#0B2D22] shadow-2xl z-50 flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-200">

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#061A13] flex items-center justify-center text-white font-black text-sm">
              {(lead.name?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{lead.name}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageStyle?.badge}`}>
                {stage}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          <div className="bg-[#071D16] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Contact Details</p>

            {editing ? (
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs text-white/40 font-semibold mb-1 block">Full Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-[#071D16] text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-white/40 font-semibold mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-[#071D16] text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-white/40 font-semibold mb-1 block">Phone</label>
                  <input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-[#071D16] text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-white/40 font-semibold mb-1 block">Service Interest</label>
                  <input value={form.serviceInterest || ""} onChange={e => setForm(f => ({ ...f, serviceInterest: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-[#071D16] text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} disabled={saving}
                    className="flex-1 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="px-3 py-2 border border-white/10 rounded-xl text-xs text-white/40 hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <User size={14} className="text-white/40 flex-shrink-0" />
                  <span className="text-sm font-semibold text-white">{lead.name}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-white/40 flex-shrink-0" />
                    <a href={`mailto:${lead.email}`} className="text-sm text-blue-400 hover:underline truncate">{lead.email}</a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-white/40 flex-shrink-0" />
                    <a href={`tel:${lead.phone}`} className="text-sm text-white/70">{lead.phone}</a>
                  </div>
                )}
                {lead.serviceInterest && (
                  <div className="flex items-center gap-3">
                    <Briefcase size={14} className="text-white/40 flex-shrink-0" />
                    <span className="text-sm text-white/70">{lead.serviceInterest}</span>
                  </div>
                )}
                {lead.source && (
                  <div className="flex items-center gap-3">
                    <Tag size={14} className="text-white/40 flex-shrink-0" />
                    <span className="text-sm text-white/40">{lead.source}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-white/40 flex-shrink-0" />
                  <span className="text-sm text-white/40">Added {fmtDate(lead.createdAt)}</span>
                </div>
              </>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Pipeline Stage</p>
            <div className="space-y-1.5">
              {STAGES.map((s, i) => {
                const isActive = s === stage;
                const isPast = STAGES.indexOf(stage) > i;
                return (
                  <button
                    key={s}
                    disabled={isActive || movingId === lead._id}
                    onClick={() => onMove(s)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? `${stageStyle?.badge} border font-bold cursor-default`
                        : isPast
                        ? "text-white/25 bg-white/5 border border-white/[0.06] hover:bg-white/10"
                        : "text-white/60 bg-[#071D16] border border-white/10 hover:bg-[#0A2A1F] hover:border-white/20"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive || isPast ? STAGE_STYLES[s]?.dot : "bg-white/20"}`} />
                    {s}
                    {isActive && <CheckCircle size={13} className="ml-auto opacity-60" />}
                    {!isActive && <ArrowRight size={12} className="ml-auto opacity-30" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10 space-y-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/10 transition-colors"
            >
              <Edit2 size={14} /> Edit Details
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 transition-colors"
          >
            <Trash2 size={14} /> Delete Lead
          </button>
        </div>
      </div>
    </>
  );
}

export default function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncCount, setSyncCount] = useState(0);
  const [movingId, setMovingId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_LEAD);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [colPages, setColPages] = useState({});

  const fetchLeads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setSyncing(true);
    try {
      const [leadsRes, bookingsRes] = await Promise.allSettled([
        axios.get(`${API}/leads`),
        axios.get(`${API}/bookings`),
      ]);

      const rawLeads = leadsRes.status === "fulfilled" && Array.isArray(leadsRes.value.data)
        ? leadsRes.value.data : [];
      const bookings = bookingsRes.status === "fulfilled" && Array.isArray(bookingsRes.value.data)
        ? bookingsRes.value.data : [];

      const emailToBooking = {};
      bookings.forEach(b => {
        const email = b.customer?.email?.toLowerCase();
        if (!email) return;
        const existing = emailToBooking[email];
        if (!existing || new Date(b.createdAt) > new Date(existing.createdAt)) {
          emailToBooking[email] = b;
        }
      });

      let autoMoved = 0;
      const syncPromises = [];
      const syncedLeads = rawLeads.map(lead => {
        const booking = emailToBooking[lead.email?.toLowerCase()];
        if (!booking) return lead;
        const autoStage = bookingStatusToStage(booking.status);
        if (autoStage && autoStage !== (lead.stage || "New")) {
          autoMoved++;
          syncPromises.push(
            axios.post(`${API}/leads/${lead._id}/update`, { stage: autoStage }).catch(() => {})
          );
          return { ...lead, stage: autoStage, _autoSynced: true, _bookingRef: booking.bookingId || booking._id };
        }
        return { ...lead, _bookingRef: booking?.bookingId || null };
      });

      await Promise.allSettled(syncPromises);
      setLeads(syncedLeads);
      setSyncCount(autoMoved);
      setLastSync(new Date());
    } catch {
      setError("Failed to load pipeline");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    const timer = setInterval(() => fetchLeads(true), 2 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchLeads]);

  const moveToStage = async (lead, newStage) => {
    setMovingId(lead._id);
    try {
      await axios.post(`${API}/leads/${lead._id}/update`, { stage: newStage });
      setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, stage: newStage, _autoSynced: false } : l));
      if (selectedLead?._id === lead._id) setSelectedLead(l => ({ ...l, stage: newStage, _autoSynced: false }));
    } catch {
      setError("Failed to update stage");
    } finally {
      setMovingId(null);
    }
  };

  const deleteLead = async (lead) => {
    if (!window.confirm(`Delete lead for ${lead.name}?`)) return;
    try {
      await axios.delete(`${API}/leads/${lead._id}`);
      setLeads(prev => prev.filter(l => l._id !== lead._id));
      if (selectedLead?._id === lead._id) setSelectedLead(null);
    } catch {
      setError("Failed to delete lead");
    }
  };

  const saveLead = async (id, updates) => {
    await axios.post(`${API}/leads/${id}/update`, updates);
    setLeads(prev => prev.map(l => l._id === id ? { ...l, ...updates } : l));
    setSelectedLead(l => l._id === id ? { ...l, ...updates } : l);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) { setError("Name and email are required"); return; }
    setAdding(true);
    try {
      const res = await axios.post(`${API}/leads`, { ...addForm, stage: "New" });
      setLeads(prev => [res.data, ...prev]);
      setAddForm(BLANK_LEAD);
      setShowAddForm(false);
    } catch {
      setError("Failed to add lead");
    } finally {
      setAdding(false);
    }
  };

  const byStage = (stage) => leads.filter(l => (l.stage || "New") === stage);
  const total = leads.length;
  const booked = leads.filter(l => l.stage === "Booked").length;
  const convRate = total > 0 ? Math.round((booked / total) * 100) : 0;
  const thisWeek = leads.filter(l => isThisWeek(l.createdAt)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      {error && (
        <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Lead Pipeline</h1>
          <p className="text-sm text-white/40 mt-1">
            Stages update automatically from booking status.
            {lastSync && (
              <span className="ml-2 text-white/40">
                Last synced {lastSync.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                {syncCount > 0 && <span className="ml-1 text-emerald-400 font-semibold">· {syncCount} moved automatically</span>}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchLeads(true)}
          disabled={syncing}
          className="flex items-center gap-2 text-xs font-semibold text-white/40 hover:text-white px-3 py-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync Now"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Leads",     val: total,          color: "text-white",       bg: "bg-[#071D16] border-white/10" },
          { label: "Conversion Rate", val: `${convRate}%`, color: "text-emerald-400", bg: "bg-[#071D16] border-white/10" },
          { label: "This Week",       val: thisWeek,       color: "text-blue-400",    bg: "bg-[#071D16] border-white/10" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 border`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-white/40 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const cards = byStage(stage);
          const visibleCount = (colPages[stage] || 1) * COLUMN_PAGE_SIZE;
          const visibleCards = cards.slice(0, visibleCount);
          const hasMore = cards.length > visibleCount;
          const isExpanded = (colPages[stage] || 1) > 1;
          return (
            <div key={stage} className="flex-shrink-0 w-72 bg-[#071D16] rounded-2xl p-3">
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${STAGE_HEADER[stage]}`}>
                <span className="text-xs font-bold uppercase tracking-widest">{stage}</span>
                <span className="text-xs font-black">{cards.length}</span>
              </div>

              {stage === "New" && (
                <div className="mb-3">
                  {showAddForm ? (
                    <form onSubmit={handleAdd} className="bg-[#0B2D22] border border-white/10 rounded-2xl p-4 space-y-2.5">
                      <input autoFocus placeholder="Full name *" value={addForm.name}
                        onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-[#071D16] text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50" />
                      <input type="email" placeholder="Email *" value={addForm.email}
                        onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-[#071D16] text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50" />
                      <input placeholder="Phone" value={addForm.phone}
                        onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-[#071D16] text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50" />
                      <input placeholder="Service interest" value={addForm.serviceInterest}
                        onChange={e => setAddForm(f => ({ ...f, serviceInterest: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl bg-[#071D16] text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50" />
                      <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={adding}
                          className="flex-1 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-colors">
                          {adding ? "Adding…" : "Add Lead"}
                        </button>
                        <button type="button" onClick={() => { setShowAddForm(false); setAddForm(BLANK_LEAD); }}
                          className="px-3 py-2 border border-white/10 rounded-xl text-xs text-white/40 hover:bg-white/10 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-white/20 rounded-xl text-xs text-white/40 hover:border-white/40 hover:text-white/70 transition-colors">
                      <Plus size={13} /> Add Lead
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                {cards.length === 0 && (
                  <div className="text-center py-8 text-white/25 text-xs font-medium border border-dashed border-white/10 rounded-xl">
                    No leads
                  </div>
                )}
                {visibleCards.map(lead => (
                  <div
                    key={lead._id}
                    onClick={() => setSelectedLead(lead)}
                    className={`bg-[#0B2D22] border border-white/10 border-l-4 ${STAGE_STYLES[stage]?.border} rounded-xl p-4 relative cursor-pointer hover:border-white/20 transition-all group`}
                  >
                    {movingId === lead._id && (
                      <div className="absolute inset-0 bg-[#0B2D22]/70 rounded-xl flex items-center justify-center z-10">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{lead.name}</p>
                        <p className="text-xs text-white/40 truncate mt-0.5">{lead.email}</p>
                      </div>
                      <CardMenu
                        lead={lead}
                        currentStage={stage}
                        onMove={(s) => moveToStage(lead, s)}
                        onEdit={() => setSelectedLead(lead)}
                        onDelete={() => deleteLead(lead)}
                      />
                    </div>

                    {lead.phone && <p className="text-xs text-white/40 mt-1.5">{lead.phone}</p>}
                    {lead.serviceInterest && (
                      <p className="text-[11px] text-white/40 mt-2 bg-white/5 rounded-lg px-2 py-1 truncate">
                        {lead.serviceInterest}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2.5 gap-2">
                      <p className="text-[10px] text-white/40 shrink-0">{fmtDate(lead.createdAt)}</p>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {lead._bookingRef && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded-full truncate">
                            {lead._bookingRef}
                          </span>
                        )}
                        {lead._autoSynced && (
                          <span className="text-[9px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/25 px-1.5 py-0.5 rounded-full shrink-0">
                            Auto
                          </span>
                        )}
                      </div>
                      <ChevronRight size={12} className="text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
                    </div>
                  </div>
                ))}
              </div>

              {(hasMore || isExpanded) && (
                <div className="mt-2 space-y-1.5">
                  {hasMore && (
                    <button
                      onClick={() => setColPages(p => ({ ...p, [stage]: (p[stage] || 1) + 1 }))}
                      className="w-full py-2 text-xs font-semibold text-white/40 hover:text-white border border-dashed border-white/10 rounded-xl hover:border-white/20 hover:bg-white/5 transition-colors"
                    >
                      Show {Math.min(COLUMN_PAGE_SIZE, cards.length - visibleCount)} more
                    </button>
                  )}
                  {isExpanded && (
                    <button
                      onClick={() => setColPages(p => ({ ...p, [stage]: 1 }))}
                      className="w-full py-1.5 text-[11px] font-medium text-white/25 hover:text-white/50 transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onMove={(s) => moveToStage(selectedLead, s)}
          onDelete={() => deleteLead(selectedLead)}
          onSave={saveLead}
          movingId={movingId}
        />
      )}
    </div>
  );
}
