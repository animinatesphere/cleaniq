import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Award, Check, RefreshCw, Star } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com/api";
const authHeaders = () => {
  const token = localStorage.getItem("adminToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Staff Pay → Top-rated bonus: extra £/hr for cleaners customers rate highly. It's added to a
// job's pay when a qualifying cleaner accepts it or is assigned it (a rate typed in when
// assigning is used as-is). Below it, every active cleaner's rating and whether they qualify.
export default function TopRatedBonus({ onSaved }) {
  const [form, setForm] = useState({ amount: "", minRating: "4.8", minRatings: "5" });
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/workers/ratings`, { headers: authHeaders() });
      const s = res.data.settings || {};
      setForm({ amount: s.amount ? String(s.amount) : "", minRating: String(s.minRating ?? 4.8), minRatings: String(s.minRatings ?? 5) });
      setWorkers(res.data.workers || []);
      setError("");
    } catch {
      setError("Couldn't load cleaner ratings.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const amount = parseFloat(form.amount) || 0;
    const minRating = Math.min(5, Math.max(1, parseFloat(form.minRating) || 4.8));
    const minRatings = Math.max(1, parseInt(form.minRatings, 10) || 5);
    setSaving(true);
    try {
      await axios.post(`${API_URL}/settings`, { key: "topRatedBonus", value: { amount, minRating, minRatings } }, { headers: authHeaders() });
      onSaved?.(amount > 0
        ? `Top-rated bonus saved: +£${amount.toFixed(2)}/hr for cleaners rated ${minRating}★+ from ${minRatings}+ reviews`
        : "Top-rated bonus switched off");
      await load();
    } catch {
      setError("Couldn't save the bonus.");
    } finally {
      setSaving(false);
    }
  };

  const qualifying = workers.filter((w) => w.qualifies);
  const amount = parseFloat(form.amount) || 0;
  const field = "px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white font-black text-center focus:outline-none focus:border-amber-400/60";

  return (
    <div className="bg-[#071D16] rounded-2xl p-6 border border-amber-400/25 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-400/15 flex items-center justify-center">
            <Award size={17} className="text-amber-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Top-rated bonus</p>
            <p className="text-xs text-white/40 mt-0.5 max-w-xl">
              Extra pay per hour for cleaners customers rate highly. Added to a job when a qualifying cleaner accepts it
              or you assign it to them. A rate you type in when assigning is used as it is.
            </p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-white/10" title="Refresh">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-xs font-bold text-white/50">
          Extra pay
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-white/40">£</span>
            <input type="number" min="0" step="0.25" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={`${field} w-24`} />
            <span className="text-white/40">/hr</span>
          </div>
        </label>
        <label className="text-xs font-bold text-white/50">
          Average rating at least
          <div className="flex items-center gap-1.5 mt-1">
            <input type="number" min="1" max="5" step="0.1" value={form.minRating} onChange={(e) => setForm({ ...form, minRating: e.target.value })} className={`${field} w-20`} />
            <Star size={14} className="text-amber-300" fill="currentColor" />
          </div>
        </label>
        <label className="text-xs font-bold text-white/50">
          From at least
          <div className="flex items-center gap-1.5 mt-1">
            <input type="number" min="1" step="1" value={form.minRatings} onChange={(e) => setForm({ ...form, minRatings: e.target.value })} className={`${field} w-20`} />
            <span className="text-white/40">ratings</span>
          </div>
        </label>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-[#071D16] text-sm font-black hover:bg-amber-300 disabled:opacity-60">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
          Save
        </button>
      </div>
      <p className="text-xs text-white/40">
        {amount > 0
          ? `${qualifying.length} cleaner${qualifying.length === 1 ? "" : "s"} currently get${qualifying.length === 1 ? "s" : ""} +£${amount.toFixed(2)}/hr. Leave extra pay empty or 0 to switch the bonus off.`
          : "The bonus is off. Enter an amount to switch it on."}
      </p>
      {error && <p className="text-xs font-bold text-rose-400">{error}</p>}

      <div className="rounded-xl border border-white/7 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
            <tr>
              <th className="text-left px-4 py-2.5">Cleaner</th>
              <th className="text-left px-4 py-2.5">Rating</th>
              <th className="text-left px-4 py-2.5">Ratings</th>
              <th className="text-left px-4 py-2.5">Jobs done</th>
              <th className="text-left px-4 py-2.5">Bonus</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-white/40">{loading ? "Loading…" : "No active cleaners."}</td></tr>
            )}
            {workers.map((w) => (
              <tr key={w._id} className="border-t border-white/5">
                <td className="px-4 py-2.5 text-white font-semibold">{w.name}</td>
                <td className="px-4 py-2.5">
                  {w.rating != null
                    ? <span className="inline-flex items-center gap-1 text-amber-300 font-black"><Star size={12} fill="currentColor" />{Number(w.rating).toFixed(1)}</span>
                    : <span className="text-white/30">No ratings yet</span>}
                </td>
                <td className="px-4 py-2.5 text-white/60 tabular-nums">{w.ratingCount}</td>
                <td className="px-4 py-2.5 text-white/60 tabular-nums">{w.jobsDone}</td>
                <td className="px-4 py-2.5">
                  {w.qualifies && amount > 0
                    ? <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-xs font-black">+£{amount.toFixed(2)}/hr</span>
                    : <span className="text-white/30 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
