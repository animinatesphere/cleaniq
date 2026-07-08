import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, X, Pencil, Check, Trash2, AlertTriangle, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_STYLES = {
  active:         "bg-green-50 text-green-700 border-green-200",
  "expiring-soon":"bg-amber-50 text-amber-700 border-amber-200",
  expired:        "bg-red-50 text-red-700 border-red-200",
  cancelled:      "bg-zinc-100 text-zinc-500 border-zinc-200",
  draft:          "bg-blue-50 text-blue-700 border-blue-200",
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Contracts</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage client contracts and renewals.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors"
        >
          <Plus size={15} /> New Contract
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Contracts",   val: stats.active,                         bg: "bg-green-50",  color: "text-green-700" },
          { label: "Expiring Soon",      val: stats.expiringSoon,                   bg: "bg-amber-50",  color: "text-amber-700" },
          { label: "Monthly Value",      val: fmtCurrency(stats.monthlyValue),      bg: "bg-zinc-50",   color: "text-zinc-900" },
          { label: "Annual Value",       val: fmtCurrency(stats.annualValue),       bg: "bg-blue-50",   color: "text-blue-700" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4 border border-zinc-100`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Expiring Soon Banner */}
      {expiringContracts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              {expiringContracts.length} contract{expiringContracts.length > 1 ? "s" : ""} expiring within 30 days
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {expiringContracts.map(c => c.companyName).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* New Contract Form */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900">New Contract</h2>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-zinc-400" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Company name *" value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400" />
              <input placeholder="Contact name" value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400" />
              <input type="email" placeholder="Contact email" value={form.contactEmail}
                onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400" />
              <input placeholder="Service" value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400" />
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none">
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="one-off">One-off</option>
              </select>
              <input type="number" placeholder="Monthly value (£)" value={form.monthlyValue}
                onChange={e => setForm(f => ({ ...f, monthlyValue: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400" />
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Start date</label>
                <input type="date" value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">End date</label>
                <input type="date" value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none" />
              </div>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expiring-soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <textarea placeholder="Notes" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400 resize-none" />
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Create Contract"}
            </button>
          </form>
        </div>
      )}

      {/* Contracts list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl py-16 text-center text-zinc-400">
            <p className="text-3xl mb-2">📄</p>
            <p className="text-sm font-medium">No contracts yet</p>
          </div>
        ) : (
          contracts.map(c => {
            const isEditing = editingId === c._id;
            const expiring = isExpiringSoon(c.endDate) && c.status === "active";
            return (
              <div key={c._id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${expiring ? "border-amber-300" : "border-zinc-200"}`}>
                {isEditing ? (
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={editForm.companyName || ""}
                        onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))}
                        placeholder="Company name"
                        className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none" />
                      <input value={editForm.contactName || ""}
                        onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))}
                        placeholder="Contact name"
                        className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none" />
                      <input type="number" value={editForm.monthlyValue || ""}
                        onChange={e => setEditForm(f => ({ ...f, monthlyValue: e.target.value }))}
                        placeholder="Monthly value"
                        className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none" />
                      <select value={editForm.status || "active"}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                        className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none">
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="expiring-soon">Expiring Soon</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <input type="date" value={editForm.endDate ? editForm.endDate.split("T")[0] : ""}
                        onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                        className="px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(c._id)}
                        className="flex items-center gap-1 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-700 transition-colors">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="px-4 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-500 hover:bg-zinc-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-zinc-900">{c.companyName}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${STATUS_STYLES[c.status] || STATUS_STYLES.active}`}>
                            {c.status || "active"}
                          </span>
                          {expiring && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center gap-1">
                              <AlertTriangle size={9} /> Expiring soon
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-zinc-500">
                          {c.contactName && <span>{c.contactName}</span>}
                          {c.service && <span>{c.service}</span>}
                          {c.frequency && <span className="capitalize">{c.frequency}</span>}
                          {c.monthlyValue && <span className="font-semibold text-zinc-700">{fmtCurrency(c.monthlyValue)}/mo</span>}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-1 text-xs text-zinc-400">
                          <span>Start: {fmtDate(c.startDate)}</span>
                          <span>End: {fmtDate(c.endDate)}</span>
                        </div>
                        {c.notes && (
                          <p className="text-xs text-zinc-500 mt-2 bg-zinc-50 rounded-lg px-3 py-2">{c.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingId(c._id); setEditForm({ ...c }); }}
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        {c.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancel(c._id)}
                            className="p-1.5 rounded-xl text-zinc-400 hover:text-amber-600 hover:bg-amber-50 transition-colors text-xs font-medium px-2"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
    </div>
  );
}
