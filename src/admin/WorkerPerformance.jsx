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
          className={i <= r ? "text-amber-400 fill-amber-400" : "text-zinc-200 fill-zinc-200"}
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
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Worker Performance</h1>
          <p className="text-sm text-zinc-500 mt-1">Ranked by completed jobs across all workers.</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 px-3 py-2 rounded-xl hover:bg-zinc-100 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Workers",    val: totalActive,              bg: "bg-green-50",  color: "text-green-700" },
          { label: "Total Completed",   val: totalCompleted,           bg: "bg-blue-50",   color: "text-blue-700" },
          { label: "Top Earner",        val: topEarner?.name || "—",  bg: "bg-amber-50",  color: "text-amber-700" },
          { label: "Avg Rating",        val: avgRating,                bg: "bg-zinc-50",   color: "text-zinc-900" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-5 py-4 border border-zinc-100`}>
            <p className={`text-xl font-black truncate ${s.color}`}>{s.val}</p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</p>
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
              filter === f ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Performance table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Leaderboard</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <p className="text-3xl mb-2">👷</p>
            <p className="text-sm font-medium">No workers match this filter</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {filtered.map((w, idx) => (
              <div key={w._id} className="px-6 py-4 flex items-center gap-4">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  idx === 0 ? "bg-amber-100 text-amber-700" :
                  idx === 1 ? "bg-zinc-200 text-zinc-600" :
                  idx === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-zinc-50 text-zinc-400"
                }`}>
                  {idx + 1}
                </div>

                {/* Worker info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-zinc-900">{w.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                      w.status === "Active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200"
                    }`}>
                      {w.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{w.role}</p>
                  <div className="mt-1">
                    <RatingStars rating={w.rating} />
                  </div>
                </div>

                {/* Jobs completed with bar */}
                <div className="w-40 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-400 font-medium">Jobs done</span>
                    <span className="text-xs font-black text-zinc-900">{w.completedJobs}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full transition-all"
                      style={{ width: `${(w.completedJobs / maxJobs) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 flex-shrink-0 text-right">
                  <div>
                    <p className="text-sm font-black text-zinc-900">{fmtCurrency(w.totalEarned)}</p>
                    <p className="text-[10px] text-zinc-400">Earned</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-700">{w.activeJobs}</p>
                    <p className="text-[10px] text-zinc-400">Active</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">{fmtDate(w.lastActive)}</p>
                    <p className="text-[10px] text-zinc-400">Last active</p>
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
