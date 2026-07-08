import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, X, ChevronRight, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STAGES = ["New", "Quoted", "Follow-up", "Booked", "Lost"];

const STAGE_STYLES = {
  New:        { border: "border-l-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
  Quoted:     { border: "border-l-amber-500",  badge: "bg-amber-50 text-amber-700 border-amber-200" },
  "Follow-up":{ border: "border-l-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  Booked:     { border: "border-l-green-500",  badge: "bg-green-50 text-green-700 border-green-200" },
  Lost:       { border: "border-l-zinc-400",   badge: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

const STAGE_HEADER = {
  New:         "bg-blue-50 text-blue-700",
  Quoted:      "bg-amber-50 text-amber-700",
  "Follow-up": "bg-purple-50 text-purple-700",
  Booked:      "bg-green-50 text-green-700",
  Lost:        "bg-zinc-100 text-zinc-500",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isThisWeek(d) {
  if (!d) return false;
  const now = new Date();
  const date = new Date(d);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo && date <= now;
}

const BLANK_LEAD = { name: "", email: "", phone: "", serviceInterest: "" };

export default function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_LEAD);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/leads`);
      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const moveToStage = async (lead, newStage) => {
    setMovingId(lead._id);
    setOpenMenuId(null);
    try {
      await axios.patch(`${API}/leads/${lead._id}`, { stage: newStage });
      setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, stage: newStage } : l));
    } catch {
      setError("Failed to update stage");
    } finally {
      setMovingId(null);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      setError("Name and email are required");
      return;
    }
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
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Lead Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">Track leads through your sales stages.</p>
        </div>
        <button onClick={fetchLeads} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 px-3 py-2 rounded-xl hover:bg-zinc-100 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Leads",      val: total,        color: "text-zinc-900",  bg: "bg-zinc-50" },
          { label: "Conversion Rate",  val: `${convRate}%`, color: "text-green-600", bg: "bg-green-50" },
          { label: "Added This Week",  val: thisWeek,     color: "text-blue-600",  bg: "bg-blue-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4 border border-zinc-100`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const cards = byStage(stage);
          return (
            <div key={stage} className="flex-shrink-0 w-72">
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${STAGE_HEADER[stage]}`}>
                <span className="text-xs font-bold uppercase tracking-widest">{stage}</span>
                <span className="text-xs font-black">{cards.length}</span>
              </div>

              {/* Add lead form — only in "New" column */}
              {stage === "New" && (
                <div className="mb-3">
                  {showAddForm ? (
                    <form onSubmit={handleAdd} className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <input
                        autoFocus
                        placeholder="Full name *"
                        value={addForm.name}
                        onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:border-zinc-400"
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={addForm.email}
                        onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:border-zinc-400"
                      />
                      <input
                        placeholder="Phone"
                        value={addForm.phone}
                        onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:border-zinc-400"
                      />
                      <input
                        placeholder="Service interest"
                        value={addForm.serviceInterest}
                        onChange={e => setAddForm(f => ({ ...f, serviceInterest: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-zinc-50 outline-none focus:border-zinc-400"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={adding}
                          className="flex-1 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                        >
                          {adding ? "Adding…" : "Add Lead"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddForm(false); setAddForm(BLANK_LEAD); }}
                          className="px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-zinc-300 rounded-xl text-xs text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <Plus size={13} /> Add Lead
                    </button>
                  )}
                </div>
              )}

              {/* Cards */}
              <div className="space-y-3">
                {cards.length === 0 && (
                  <div className="text-center py-8 text-zinc-300 text-xs font-medium border border-dashed border-zinc-200 rounded-xl">
                    No leads
                  </div>
                )}
                {cards.map(lead => (
                  <div
                    key={lead._id}
                    className={`bg-white border border-zinc-200 border-l-4 ${STAGE_STYLES[stage]?.border} rounded-2xl p-4 shadow-sm relative`}
                  >
                    {movingId === lead._id && (
                      <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <p className="text-sm font-bold text-zinc-900 truncate">{lead.name}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{lead.email}</p>
                    {lead.phone && <p className="text-xs text-zinc-400 mt-0.5">{lead.phone}</p>}
                    {lead.serviceInterest && (
                      <p className="text-xs text-zinc-500 mt-1.5 bg-zinc-50 rounded-lg px-2 py-1">{lead.serviceInterest}</p>
                    )}
                    <p className="text-[10px] text-zinc-400 mt-2">{fmtDate(lead.createdAt)}</p>

                    {/* Move to dropdown */}
                    <div className="mt-3 relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === lead._id ? null : lead._id)}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                      >
                        Move to <ChevronRight size={12} />
                      </button>
                      {openMenuId === lead._id && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 overflow-hidden">
                          {STAGES.filter(s => s !== stage).map(s => (
                            <button
                              key={s}
                              onClick={() => moveToStage(lead, s)}
                              className="block w-full text-left px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 font-medium transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
