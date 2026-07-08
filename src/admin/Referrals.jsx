import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, X, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_FLOW = ["pending", "booked", "completed", "rewarded"];

const STATUS_STYLES = {
  pending:   "bg-zinc-100 text-zinc-600 border-zinc-200",
  booked:    "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  rewarded:  "bg-amber-50 text-amber-700 border-amber-200",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(v) {
  if (!v && v !== 0) return "—";
  return `£${Number(v).toFixed(2)}`;
}

const BLANK_FORM = {
  referrerName: "", referrerEmail: "", refereeName: "", refereeEmail: "", notes: "",
};

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ total: 0, booked: 0, completed: 0, rewardsPaid: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        axios.get(`${API}/referrals`),
        axios.get(`${API}/referrals/stats`).catch(() => ({ data: {} })),
      ]);
      const data = Array.isArray(rRes.data) ? rRes.data : [];
      setReferrals(data);
      const s = sRes.data || {};
      setStats({
        total:       s.total ?? data.length,
        booked:      s.booked ?? data.filter(r => r.status === "booked").length,
        completed:   s.completed ?? data.filter(r => r.status === "completed").length,
        rewardsPaid: s.rewardsPaid ?? data.filter(r => r.rewardPaid).reduce((sum, r) => sum + (Number(r.rewardAmount) || 0), 0),
      });
    } catch {
      setError("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.referrerName.trim() || !form.refereeEmail.trim()) {
      setError("Referrer name and referee email are required");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/referrals`, { ...form, status: "pending" });
      setReferrals(prev => [res.data, ...prev]);
      setForm(BLANK_FORM);
      setShowForm(false);
    } catch {
      setError("Failed to log referral");
    } finally {
      setSaving(false);
    }
  };

  const patchReferral = async (id, data) => {
    try {
      await axios.patch(`${API}/referrals/${id}`, data);
      setReferrals(prev => prev.map(r => r._id === id ? { ...r, ...data } : r));
    } catch {
      setError("Failed to update referral");
    }
  };

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
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Referral Tracking</h1>
          <p className="text-sm text-zinc-500 mt-1">Monitor referrals and manage reward payouts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            <Plus size={15} /> Log Referral
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Referrals", val: stats.total,                   bg: "bg-zinc-50",   color: "text-zinc-900" },
          { label: "Booked",          val: stats.booked,                  bg: "bg-blue-50",   color: "text-blue-700" },
          { label: "Completed",       val: stats.completed,               bg: "bg-green-50",  color: "text-green-700" },
          { label: "Rewards Paid",    val: `£${stats.rewardsPaid.toFixed(2)}`, bg: "bg-amber-50", color: "text-amber-700" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4 border border-zinc-100`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New Referral Form */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900">Log Referral</h2>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-zinc-400" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Referrer name *"
                value={form.referrerName} onChange={e => setForm(f => ({ ...f, referrerName: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400" />
              <input type="email" placeholder="Referrer email"
                value={form.referrerEmail} onChange={e => setForm(f => ({ ...f, referrerEmail: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400" />
              <input placeholder="Referee name"
                value={form.refereeName} onChange={e => setForm(f => ({ ...f, refereeName: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400" />
              <input required type="email" placeholder="Referee email *"
                value={form.refereeEmail} onChange={e => setForm(f => ({ ...f, refereeEmail: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400" />
            </div>
            <textarea placeholder="Notes" rows={2}
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm outline-none focus:border-zinc-400 resize-none" />
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Log Referral"}
            </button>
          </form>
        </div>
      )}

      {/* Referrals table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">All Referrals</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <p className="text-3xl mb-2">🤝</p>
            <p className="text-sm font-medium">No referrals logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <th className="px-6 py-3">Referrer</th>
                  <th className="px-4 py-3">Referee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Booking Ref</th>
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {referrals.map(r => (
                  <tr key={r._id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-zinc-900">{r.referrerName || "—"}</p>
                      <p className="text-xs text-zinc-400">{r.referrerEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-zinc-700">{r.refereeName || "—"}</p>
                      <p className="text-xs text-zinc-400">{r.refereeEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={r.status || "pending"}
                        onChange={e => patchReferral(r._id, { status: e.target.value })}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}
                      >
                        {STATUS_FLOW.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-mono text-zinc-500">{r.bookingRef || "—"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-zinc-700">{fmtCurrency(r.rewardAmount)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => patchReferral(r._id, { rewardPaid: !r.rewardPaid })}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                          r.rewardPaid ? "bg-zinc-900" : "bg-zinc-300"
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${r.rewardPaid ? "translate-x-4" : ""}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-xs text-zinc-400">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
