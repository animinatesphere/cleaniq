import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Star, RefreshCw, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const FILTERS = ["All Workers", "Active Only", "Top Performers"];

function fmtCurrency(v) {
  if (!v && v !== 0) return "£0.00";
  return `£${Number(v).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function RatingStars({ rating }) {
  const r = Math.round(Number(rating) || 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          className={i <= r ? "text-amber-400 fill-amber-400" : "text-white/10 fill-white/10"}
        />
      ))}
    </div>
  );
}

export default function WorkerPerformance() {
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Workers");
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, bRes] = await Promise.all([
        axios.get(`${API}/workers`),
        axios.get(`${API}/bookings`),
      ]);
      setWorkers(Array.isArray(wRes.data) ? wRes.data : []);
      setBookings(Array.isArray(bRes.data) ? bRes.data : []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build performance data per worker
  const workerStats = workers.map(w => {
    const name = `${w.firstName || ""} ${w.lastName || ""}`.trim() || w.name || "Unknown";
    const workerBookings = bookings.filter(b => {
      const assignedName = (b.assignedWorkerName || b.worker?.name || "").trim().toLowerCase();
      return assignedName === name.toLowerCase();
    });
    const completed = workerBookings.filter(b => b.status === "Completed");
    const active = workerBookings.filter(b => b.status !== "Completed" && b.status !== "Cancelled");
    const totalEarned = completed.reduce((sum, b) => {
      const rate = Number(b.workerRate || w.hourlyRate || 0);
      const duration = Number(b.duration || b.hours || 0);
      return sum + rate * duration;
    }, 0);
    const lastBooking = workerBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    return {
      _id: w._id,
      name,
      role: w.role || w.position || "Cleaner",
      status: w.status || "Active",
      rating: w.rating || 0,
      completedJobs: completed.length,
      activeJobs: active.length,
      totalEarned,
      lastActive: lastBooking?.date || lastBooking?.createdAt,
    };
  }).sort((a, b) => b.completedJobs - a.completedJobs);

  const filtered = workerStats.filter(w => {
    if (filter === "Active Only") return w.status === "Active";
    if (filter === "Top Performers") return w.completedJobs >= 5;
    return true;
  });

  const maxJobs = Math.max(...filtered.map(w => w.completedJobs), 1);

  const totalActive = workers.filter(w => (w.status || "Active") === "Active").length;
  const totalCompleted = workerStats.reduce((sum, w) => sum + w.completedJobs, 0);
  const topEarner = [...workerStats].sort((a, b) => b.totalEarned - a.totalEarned)[0];
  const avgRating = workers.length > 0
    ? (workers.reduce((sum, w) => sum + (Number(w.rating) || 0), 0) / workers.length).toFixed(1)
    : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Worker Performance</h1>
          <p className="text-sm text-white/40 mt-1">Ranked by completed jobs across all workers.</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 text-xs text-white/40 hover:text-white px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Workers",   val: totalActive,             color: "text-emerald-400" },
          { label: "Total Completed",  val: totalCompleted,          color: "text-blue-400"    },
          { label: "Top Earner",       val: topEarner?.name || "—", color: "text-amber-400"   },
          { label: "Avg Rating",       val: avgRating,               color: "text-white"       },
        ].map(s => (
          <div key={s.label} className="bg-[#0B2D22] border border-white/7 rounded-2xl px-5 py-4">
            <p className={`text-xl font-black truncate ${s.color}`}>{s.val}</p>
            <p className="text-xs text-white/40 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              filter === f
                ? "bg-emerald-500 text-white"
                : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Performance table */}
      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/7">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Leaderboard</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p className="text-3xl mb-2">👷</p>
            <p className="text-sm font-medium">No workers match this filter</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((w, idx) => (
              <div key={w._id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  idx === 0 ? "bg-amber-500/15 text-amber-400" :
                  idx === 1 ? "bg-white/10 text-white/60" :
                  idx === 2 ? "bg-orange-500/15 text-orange-400" :
                  "bg-white/[0.03] text-white/30"
                }`}>
                  {idx + 1}
                </div>

                {/* Worker info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white">{w.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                      w.status === "Active"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                        : "bg-white/10 text-white/60 border-white/10"
                    }`}>
                      {w.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{w.role}</p>
                  <div className="mt-1">
                    <RatingStars rating={w.rating} />
                  </div>
                </div>

                {/* Jobs completed with bar */}
                <div className="w-40 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/40 font-medium">Jobs done</span>
                    <span className="text-xs font-black text-white">{w.completedJobs}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${(w.completedJobs / maxJobs) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 flex-shrink-0 text-right">
                  <div>
                    <p className="text-sm font-black text-white">{fmtCurrency(w.totalEarned)}</p>
                    <p className="text-[10px] text-white/40">Earned</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white/80">{w.activeJobs}</p>
                    <p className="text-[10px] text-white/40">Active</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/40">{fmtDate(w.lastActive)}</p>
                    <p className="text-[10px] text-white/40">Last active</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
