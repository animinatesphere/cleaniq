import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, X, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_FLOW = ["pending", "booked", "completed", "rewarded"];

const STATUS_STYLES = {
  pending:   "bg-white/10 text-white/60 border-white/10",
  booked:    "bg-blue-500/15 text-blue-400 border-blue-500/25",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  rewarded:  "bg-amber-500/15 text-amber-400 border-amber-500/25",
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
        <div className="bg-rose-500/15 border border-rose-500/25 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Referral Tracking</h1>
          <p className="text-sm text-white/40 mt-1">Monitor referrals and manage reward payouts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Plus size={15} /> Log Referral
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Referrals", val: stats.total,                        bg: "bg-[#0B2D22] border border-white/[0.07]",             color: "text-white" },
          { label: "Booked",          val: stats.booked,                       bg: "bg-blue-500/10 border border-blue-500/20",            color: "text-blue-400" },
          { label: "Completed",       val: stats.completed,                    bg: "bg-emerald-500/10 border border-emerald-500/20",      color: "text-emerald-400" },
          { label: "Rewards Paid",    val: `£${stats.rewardsPaid.toFixed(2)}`, bg: "bg-amber-500/10 border border-amber-500/20",         color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-white/40 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New Referral Form */}
      {showForm && (
        <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Log Referral</h2>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-white/40" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Referrer name *"
                value={form.referrerName} onChange={e => setForm(f => ({ ...f, referrerName: e.target.value }))}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm" />
              <input type="email" placeholder="Referrer email"
                value={form.referrerEmail} onChange={e => setForm(f => ({ ...f, referrerEmail: e.target.value }))}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm" />
              <input placeholder="Referee name"
                value={form.refereeName} onChange={e => setForm(f => ({ ...f, refereeName: e.target.value }))}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm" />
              <input required type="email" placeholder="Referee email *"
                value={form.refereeEmail} onChange={e => setForm(f => ({ ...f, refereeEmail: e.target.value }))}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm" />
            </div>
            <textarea placeholder="Notes" rows={2}
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm resize-none" />
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Log Referral"}
            </button>
          </form>
        </div>
      )}

      {/* Referrals table */}
      <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.07]">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">All Referrals</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-16 text-white/25">
            <p className="text-3xl mb-2">🤝</p>
            <p className="text-sm font-medium">No referrals logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] text-white/40 text-xs font-semibold uppercase tracking-wide">
                  <th className="px-6 py-3">Referrer</th>
                  <th className="px-4 py-3">Referee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Booking Ref</th>
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r._id} className="hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-b-0">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-white">{r.referrerName || "—"}</p>
                      <p className="text-xs text-white/40">{r.referrerEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-white/80">{r.refereeName || "—"}</p>
                      <p className="text-xs text-white/40">{r.refereeEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={r.status || "pending"}
                        onChange={e => patchReferral(r._id, { status: e.target.value })}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer bg-transparent ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}
                      >
                        {STATUS_FLOW.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-mono text-white/40">{r.bookingRef || "—"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-white/80">{fmtCurrency(r.rewardAmount)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => patchReferral(r._id, { rewardPaid: !r.rewardPaid })}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                          r.rewardPaid ? "bg-emerald-500" : "bg-white/20"
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${r.rewardPaid ? "translate-x-4" : ""}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-xs text-white/40">{fmtDate(r.createdAt)}</td>
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
