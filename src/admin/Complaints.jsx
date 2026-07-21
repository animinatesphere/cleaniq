import React, { useState, useEffect, useCallback } from "react";
import StatDetailDrawer from "./StatDetailDrawer";
import axios from "axios";
import { Plus, X, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SEVERITY_STYLES = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/25",
  medium:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  low:      "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

const STATUS_STYLES = {
  Open:          "bg-rose-500/15 text-rose-400 border-rose-500/25",
  Investigating: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Resolved:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const BLANK_FORM = {
  customerName: "", customerEmail: "", bookingRef: "",
  service: "", type: "", severity: "medium", description: "",
};

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ open: 0, investigating: 0, resolved: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState("");
  const [drawer, setDrawer] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${API}/complaints`),
        axios.get(`${API}/complaints/stats`).catch(() => ({ data: {} })),
      ]);
      setComplaints(Array.isArray(cRes.data) ? cRes.data : []);
      const d = sRes.data || {};
      setStats({
        open:          d.open ?? 0,
        investigating: d.investigating ?? 0,
        resolved:      d.resolved ?? 0,
        critical:      d.critical ?? 0,
      });
    } catch {
      setError("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) { setError("Customer name is required"); return; }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/complaints`, { ...form, status: "Open" });
      setComplaints(prev => [res.data, ...prev]);
      setForm(BLANK_FORM);
      setShowForm(false);
    } catch {
      setError("Failed to log complaint");
    } finally {
      setSaving(false);
    }
  };

  const patchComplaint = async (id, data) => {
    try {
      await axios.patch(`${API}/complaints/${id}`, data);
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, ...data } : c));
    } catch {
      setError("Failed to update complaint");
    }
  };

  const complaintsRenderItem = (c) => (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate">{c.subject || c.title}</p>
        <p className="text-xs text-white/40 truncate">{c.customerName || c.customer} · {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB") : "—"}</p>
      </div>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">{c.status || c.severity}</span>
    </div>
  );

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      const c = complaints.find(x => x._id === id);
      setEditData({
        resolution: c?.resolution || "",
        refundAmount: c?.refundAmount || "",
        status: c?.status || "Open",
      });
      setExpandedId(id);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Complaints Log</h1>
          <p className="text-sm text-white/40 mt-1">Track and resolve customer complaints.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={15} /> Log Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Open",          val: stats.open,          color: "text-rose-400",    items: complaints.filter(c => c.status === "Open")          },
          { label: "Investigating", val: stats.investigating, color: "text-amber-400",   items: complaints.filter(c => c.status === "Investigating") },
          { label: "Resolved",      val: stats.resolved,      color: "text-emerald-400", items: complaints.filter(c => c.status === "Resolved")      },
          { label: "Critical",      val: stats.critical,      color: "text-rose-400",    items: complaints.filter(c => c.severity === "critical")    },
        ].map(s => (
          <div key={s.label} className="bg-[#0B2D22] border border-white/7 rounded-xl px-5 py-4" onClick={() => setDrawer({ title: s.label + " Complaints", subtitle: `${s.items.length} complaint${s.items.length !== 1 ? "s" : ""}`, items: s.items, accentColor: "rose", renderItem: complaintsRenderItem })}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs font-medium mt-0.5 text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New Complaint Form */}
      {showForm && (
        <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Log New Complaint</h2>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-white/40" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                placeholder="Customer name *"
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="email"
                placeholder="Customer email"
                value={form.customerEmail}
                onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <input
                placeholder="Booking ref"
                value={form.bookingRef}
                onChange={e => setForm(f => ({ ...f, bookingRef: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <input
                placeholder="Service"
                value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <input
                placeholder="Type (e.g. quality, no-show)"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <select
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <textarea
              placeholder="Description *"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Log Complaint"}
            </button>
          </form>
        </div>
      )}

      {/* Complaints list */}
      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl divide-y divide-white/[0.04]">
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">All Complaints</h2>
          <button onClick={fetchAll} className="text-xs text-white/40 hover:text-white transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm font-medium">No complaints logged</p>
          </div>
        ) : (
          complaints.map(c => (
            <div key={c._id}>
              {/* Row */}
              <div
                className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
                onClick={() => toggleExpand(c._id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white">{c.customerName}</p>
                    {c.bookingRef && (
                      <span className="text-[10px] font-mono text-white/40 bg-white/10 px-2 py-0.5 rounded">
                        {c.bookingRef}
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.low}`}>
                      {c.severity}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${STATUS_STYLES[c.status] || STATUS_STYLES.Open}`}>
                      {c.status || "Open"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-white/40 flex-wrap">
                    {c.service && <span>{c.service}</span>}
                    {c.type && <span>{c.type}</span>}
                    {c.assignedTo && <span>Assigned: {c.assignedTo}</span>}
                    <span>{fmtDate(c.createdAt)}</span>
                  </div>
                </div>
                <div className="text-white/40 flex-shrink-0">
                  {expandedId === c._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded view */}
              {expandedId === c._id && (
                <div className="px-6 pb-6 bg-white/[0.03] border-t border-white/7 space-y-4">
                  <p className="text-sm text-white/80 pt-4">{c.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-white/40 mb-1.5 uppercase tracking-wider">Resolution</label>
                      <textarea
                        rows={3}
                        value={editData.resolution}
                        onChange={e => setEditData(d => ({ ...d, resolution: e.target.value }))}
                        onBlur={() => patchComplaint(c._id, { resolution: editData.resolution })}
                        placeholder="Enter resolution notes…"
                        className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-white/40 mb-1.5 uppercase tracking-wider">Refund (£)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editData.refundAmount}
                          onChange={e => setEditData(d => ({ ...d, refundAmount: e.target.value }))}
                          onBlur={() => patchComplaint(c._id, { refundAmount: editData.refundAmount })}
                          className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/40 mb-1.5 uppercase tracking-wider">Status</label>
                        <select
                          value={editData.status}
                          onChange={e => {
                            const s = e.target.value;
                            setEditData(d => ({ ...d, status: s }));
                            patchComplaint(c._id, { status: s });
                          }}
                          className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none"
                        >
                          <option>Open</option>
                          <option>Investigating</option>
                          <option>Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <StatDetailDrawer
        isOpen={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.title || ""}
        subtitle={drawer?.subtitle || ""}
        items={drawer?.items || []}
        renderItem={drawer?.renderItem}
        onViewAll={drawer?.onViewAll}
        accentColor={drawer?.accentColor || "emerald"}
      />
    </div>
  );
}
