import React, { useState, useEffect, useCallback } from "react";
import StatDetailDrawer from "./StatDetailDrawer";
import axios from "axios";
import { Plus, X, Pencil, Check, Trash2, AlertTriangle, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_STYLES = {
  active:          "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "expiring-soon": "bg-amber-500/15 text-amber-400 border-amber-500/25",
  expired:         "bg-rose-500/15 text-rose-400 border-rose-500/25",
  cancelled:       "bg-white/10 text-white/40 border-white/10",
  draft:           "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(v) {
  if (!v && v !== 0) return "—";
  return `£${Number(v).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isExpiringSoon(endDate) {
  if (!endDate) return false;
  const end = new Date(endDate);
  const now = new Date();
  const diffDays = (end - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 30;
}

const BLANK_FORM = {
  companyName: "", contactName: "", contactEmail: "", service: "",
  frequency: "monthly", monthlyValue: "", startDate: "", endDate: "",
  status: "active", notes: "",
};

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({ active: 0, expiringSoon: 0, monthlyValue: 0, annualValue: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");
  const [drawer, setDrawer] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${API}/contracts`),
        axios.get(`${API}/contracts/stats`).catch(() => ({ data: {} })),
      ]);
      const data = Array.isArray(cRes.data) ? cRes.data : [];
      setContracts(data);
      const s = sRes.data || {};
      // Compute stats from data if API doesn't return them
      const active = data.filter(c => c.status === "active").length;
      const expiringSoon = data.filter(c => isExpiringSoon(c.endDate)).length;
      const monthly = data.filter(c => c.status === "active").reduce((sum, c) => sum + (Number(c.monthlyValue) || 0), 0);
      setStats({
        active:       s.active ?? active,
        expiringSoon: s.expiringSoon ?? expiringSoon,
        monthlyValue: s.monthlyValue ?? monthly,
        annualValue:  s.annualValue ?? (monthly * 12),
      });
    } catch {
      setError("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) { setError("Company name is required"); return; }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/contracts`, form);
      setContracts(prev => [res.data, ...prev]);
      setForm(BLANK_FORM);
      setShowForm(false);
    } catch {
      setError("Failed to create contract");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id) => {
    try {
      await axios.patch(`${API}/contracts/${id}`, editForm);
      setContracts(prev => prev.map(c => c._id === id ? { ...c, ...editForm } : c));
      setEditingId(null);
    } catch {
      setError("Failed to save changes");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Mark this contract as cancelled?")) return;
    try {
      await axios.patch(`${API}/contracts/${id}`, { status: "cancelled" });
      setContracts(prev => prev.map(c => c._id === id ? { ...c, status: "cancelled" } : c));
    } catch {
      setError("Failed to cancel contract");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contract permanently?")) return;
    try {
      await axios.delete(`${API}/contracts/${id}`);
      setContracts(prev => prev.filter(c => c._id !== id));
    } catch {
      setError("Failed to delete contract");
    }
  };

  const expiringContracts = contracts.filter(c => isExpiringSoon(c.endDate) && c.status === "active");

  const contractsRenderItem = (c) => (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate">{c.companyName || c.clientName || c.name}</p>
        <p className="text-xs text-white/40 truncate">{c.service || c.type} · Expires: {c.endDate ? new Date(c.endDate).toLocaleDateString("en-GB") : "—"}</p>
      </div>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/25 shrink-0">{c.status}</span>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Contracts</h1>
          <p className="text-sm text-white/40 mt-1">Manage client contracts and renewals.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={15} /> New Contract
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Contracts",   val: stats.active,                    color: "text-emerald-400", items: contracts.filter(c => c.status === "active")   },
          { label: "Expiring Soon",      val: stats.expiringSoon,              color: "text-amber-400",   items: expiringContracts                              },
          { label: "Monthly Value",      val: fmtCurrency(stats.monthlyValue), color: "text-white",       items: contracts.filter(c => c.status === "active")   },
          { label: "Annual Value",       val: fmtCurrency(stats.annualValue),  color: "text-blue-400",    items: contracts.filter(c => c.status === "active")   },
        ].map(s => (
          <div key={s.label} className="bg-[#0B2D22] border border-white/7 rounded-xl px-5 py-4" onClick={() => setDrawer({ title: s.label, subtitle: `${s.items.length} contract${s.items.length !== 1 ? "s" : ""}`, items: s.items, accentColor: "blue", renderItem: contractsRenderItem })}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-white/40 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Expiring Soon Banner */}
      {expiringContracts.length > 0 && (
        <div className="bg-amber-500/15 border border-amber-500/25 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300">
              {expiringContracts.length} contract{expiringContracts.length > 1 ? "s" : ""} expiring within 30 days
            </p>
            <p className="text-xs text-amber-400 mt-0.5">
              {expiringContracts.map(c => c.companyName).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* New Contract Form */}
      {showForm && (
        <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">New Contract</h2>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-white/40" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Company name *" value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50" />
              <input placeholder="Contact name" value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50" />
              <input type="email" placeholder="Contact email" value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50" />
              <input placeholder="Service" value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50" />
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none">
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="one-off">One-off</option>
              </select>
              <input type="number" placeholder="Monthly value (£)" value={form.monthlyValue}
                onChange={e => setForm(f => ({ ...f, monthlyValue: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50" />
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Start date</label>
                <input type="date" value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">End date</label>
                <input type="date" value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none" />
              </div>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expiring-soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <textarea placeholder="Notes" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50 resize-none" />
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Create Contract"}
            </button>
          </form>
        </div>
      )}

      {/* Contracts list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl py-16 text-center text-white/40">
            <p className="text-3xl mb-2">📄</p>
            <p className="text-sm font-medium">No contracts yet</p>
          </div>
        ) : (
          contracts.map(c => {
            const isEditing = editingId === c._id;
            const expiring = isExpiringSoon(c.endDate) && c.status === "active";
            return (
              <div key={c._id} className={`bg-[#0B2D22] border rounded-2xl overflow-hidden ${expiring ? "border-amber-500/40" : "border-white/7"}`}>
                {isEditing ? (
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={editForm.companyName || ""}
                        onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))}
                        placeholder="Company name"
                        className="px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50" />
                      <input value={editForm.contactName || ""}
                        onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))}
                        placeholder="Contact name"
                        className="px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50" />
                      <input type="number" value={editForm.monthlyValue || ""}
                        onChange={e => setEditForm(f => ({ ...f, monthlyValue: e.target.value }))}
                        placeholder="Monthly value"
                        className="px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50" />
                      <select value={editForm.status || "active"}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                        className="px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none">
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="expiring-soon">Expiring Soon</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <input type="date" value={editForm.endDate ? editForm.endDate.split("T")[0] : ""}
                        onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                        className="px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(c._id)}
                        className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-colors">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-white/5 border border-white/10 text-white/40 rounded-xl text-xs hover:bg-white/10 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white">{c.companyName}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${STATUS_STYLES[c.status] || STATUS_STYLES.active}`}>
                            {c.status || "active"}
                          </span>
                          {expiring && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold flex items-center gap-1">
                              <AlertTriangle size={9} /> Expiring soon
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-white/40">
                          {c.contactName && <span>{c.contactName}</span>}
                          {c.service && <span>{c.service}</span>}
                          {c.frequency && <span className="capitalize">{c.frequency}</span>}
                          {c.monthlyValue && <span className="font-semibold text-white/80">{fmtCurrency(c.monthlyValue)}/mo</span>}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-1 text-xs text-white/40">
                          <span>Start: {fmtDate(c.startDate)}</span>
                          <span>End: {fmtDate(c.endDate)}</span>
                        </div>
                        {c.notes && (
                          <p className="text-xs text-white/40 mt-2 bg-white/[0.03] rounded-lg px-3 py-2">{c.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingId(c._id); setEditForm({ ...c }); }}
                          className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        {c.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancel(c._id)}
                            className="p-1.5 rounded-xl text-white/40 hover:text-amber-400 hover:bg-amber-500/15 transition-colors text-xs font-medium px-2"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-1.5 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
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
