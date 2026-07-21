import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Edit3,
  X,
  Check,
  Users,
  Briefcase,
  DollarSign,
  Timer,
  TrendingUp,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Settings,
  Zap,
  ArrowDownRight,
  ArrowUpRight
} from "lucide-react";

const WorkerPay = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [expandedId, setExpandedId] = useState(null);

  const [defaults, setDefaults] = useState({
    defaultWorkerRate: "",
  });
  const [savingDefaults, setSavingDefaults] = useState(false);

  const [editMap, setEditMap] = useState({});
  const [editingId, setEditingId] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const API = import.meta.env.VITE_API_URL;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/bookings`);
      const data = await res.json();
      setBookings(data.filter((b) => b.status !== "Blackout"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  const fetchDefaults = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings`);
      const data = await res.json();
      const out = {};
      data.forEach((s) => {
        out[s.key] = s.value;
      });
      setDefaults({
        defaultWorkerRate: out.defaultWorkerRate ?? "",
      });
    } catch (err) {
      console.error(err);
    }
  }, [API]);

  useEffect(() => {
    fetchBookings();
    fetchDefaults();
  }, [fetchBookings, fetchDefaults]);

  const flash = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 3500);
  };

  const handleSaveDefaults = async () => {
    setSavingDefaults(true);
    try {
      await fetch(`${API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "defaultWorkerRate",
          value: parseFloat(defaults.defaultWorkerRate) || 0,
        }),
      });
      flash("success", "✅ Default settings saved successfully!");
    } catch (err) {
      flash("error", "❌ Failed to save defaults.");
    } finally {
      setSavingDefaults(false);
    }
  };

  const startEdit = (booking) => {
    setEditingId(booking._id);
    setEditMap((prev) => ({
      ...prev,
      [booking._id]: {
        workerRate: booking.workerRate ?? "",
      },
    }));
  };

  const handleSavePay = async (booking) => {
    const vals = editMap[booking._id] || {};
    const newRate = parseFloat(vals.workerRate) || 0;
    setSavingId(booking._id);
    try {
      const res = await fetch(`${API}/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerRate: newRate,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save");
      }
      setEditingId(null);
      flash("success", `Pay updated for booking ${booking.bookingId}: £${newRate.toFixed(2)}/hr`);
      fetchBookings();
    } catch (err) {
      flash("error", `Failed to update booking pay: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const assignedBookings = bookings.filter((b) => b.assignedWorker);
  const totalPayout = bookings.reduce(
    (sum, b) => sum + (b.workerRate || 0) * (b.details?.duration || 0),
    0
  );
  const totalRevenue = bookings.reduce(
    (sum, b) => sum + (b.payment?.amount || 0),
    0
  );

  const statusOptions = [
    { value: "all", label: "All Bookings" },
    { value: "Confirmed", label: "Confirmed" },
    { value: "Assigned", label: "Assigned" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const filtered = bookings
    .filter((b) => filterStatus === "all" || b.status === filterStatus)
    .filter((b) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        b.bookingId?.toLowerCase().includes(q) ||
        b.customer?.firstName?.toLowerCase().includes(q) ||
        b.customer?.lastName?.toLowerCase().includes(q) ||
        b.service?.toLowerCase().includes(q) ||
        b.assignedWorkerName?.toLowerCase().includes(q)
      );
    });

  const getStatusStyle = (status) => {
    const map = {
      Confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/25",
      Assigned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      Completed: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
      Cancelled: "bg-rose-500/15 text-rose-400 border-rose-500/25",
      Pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    };
    return map[status] || "bg-white/5 text-white/40 border-white/10";
  };

  const fmt = (date) =>
    date
      ? new Date(date).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <Wallet size={22} className="text-emerald-400" />
            </div>
            Worker Pay
          </h1>
          <p className="text-white/40 text-sm font-bold mt-1 ml-1">
            Set hourly rates & track money flow and profit
          </p>
        </div>
        <button
          onClick={() => {
            fetchBookings();
            fetchDefaults();
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl text-sm font-bold border ${
            statusMsg.type === "success"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
              : "bg-rose-500/15 text-rose-400 border-rose-500/25"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <Briefcase size={20} />,
            label: "Total Bookings",
            value: bookings.length,
            colorClasses: "bg-blue-500/15 text-blue-400",
          },
          {
            icon: <Users size={20} />,
            label: "Assigned Jobs",
            value: assignedBookings.length,
            colorClasses: "bg-emerald-500/15 text-emerald-400",
          },
          {
            icon: <ArrowUpRight size={20} />,
            label: "Total Worker Payout",
            value: `£${totalPayout.toFixed(2)}`,
            colorClasses: "bg-indigo-500/15 text-indigo-400",
          },
          {
            icon: <ArrowDownRight size={20} />,
            label: "Total Revenue",
            value: `£${totalRevenue.toFixed(2)}`,
            colorClasses: "bg-emerald-500/15 text-emerald-400",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-[#0B2D22] rounded-2xl p-5 border border-white/7"
          >
            <div
              className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${stat.colorClasses}`}
            >
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#071D16] rounded-2xl p-7 border border-emerald-500/25">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <Settings size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Global Default Settings
            </h2>
            <p className="text-xs text-white/40 font-bold mt-0.5">
              Set the default hourly rate for new bookings
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-5 items-end">
          <div className="space-y-2 w-full max-w-sm">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-1">
              <DollarSign size={12} /> Default Hourly Rate (£)
            </label>
            <input
              type="number"
              min="0"
              step="0.50"
              value={defaults.defaultWorkerRate}
              onChange={(e) =>
                setDefaults((d) => ({ ...d, defaultWorkerRate: e.target.value }))
              }
              placeholder="e.g. 15.00"
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-black text-lg focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <button
            onClick={handleSaveDefaults}
            disabled={savingDefaults}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-60"
          >
            {savingDefaults ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {savingDefaults ? "Saving..." : "Save Defaults"}
          </button>
        </div>
      </div>

      <div className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden">
        <div className="p-6 border-b border-white/[0.06] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Zap size={18} className="text-emerald-400" />
            Booking Money Flow
            <span className="text-xs font-black text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search booking, worker, service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-bold bg-[#071D16] text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all w-64"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-bold bg-[#071D16] text-white focus:outline-none focus:border-emerald-500/50 transition-all"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#0B2D22]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <RefreshCw size={24} className="animate-spin text-emerald-400" />
            <span className="text-white/40 font-bold">Loading bookings...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">No bookings found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((booking) => {
              const isEditing = editingId === booking._id;
              const editVals = editMap[booking._id] || {};
              const rate = isEditing
                ? parseFloat(editVals.workerRate) || 0
                : booking.workerRate || 0;
              const duration = booking.details?.duration || 0;
              const customerPaid = booking.payment?.amount || 0;
              const totalPay = rate * duration;
              const profit = customerPaid - totalPay;
              const isExpanded = expandedId === booking._id;

              return (
                <div key={booking._id} className="transition-all">
                  <div className="px-6 py-5 hover:bg-white/[0.04] transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                            {booking.bookingId}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wide ${getStatusStyle(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <p className="font-black text-white text-sm">
                          {booking.customer?.firstName}{" "}
                          {booking.customer?.lastName}
                        </p>
                        <p className="text-xs text-white/40 font-bold mt-0.5">
                          {booking.service}
                        </p>
                      </div>

                      <div className="lg:w-44">
                        {booking.assignedWorkerName ? (
                          <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                              Worker
                            </p>
                            <p className="text-sm font-black text-emerald-300">
                              {booking.assignedWorkerName}
                            </p>
                            {booking.jobAcceptedTime && (
                              <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                                ✓ Accepted {fmt(booking.jobAcceptedTime)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                              Worker
                            </p>
                            <p className="text-xs text-white/40 font-bold italic">
                              Not yet assigned
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:w-[450px]">
                        {isEditing ? (
                          <>
                            <div className="flex-1 min-w-[100px]">
                              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">
                                Worker Rate (£/hr)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={editVals.workerRate}
                                onChange={(e) =>
                                  setEditMap((prev) => ({
                                    ...prev,
                                    [booking._id]: {
                                      ...prev[booking._id],
                                      workerRate: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full p-2.5 rounded-xl border border-white/10 bg-[#071D16] text-white font-black text-sm focus:outline-none focus:border-emerald-500/50"
                                placeholder="Rate"
                              />
                            </div>
                            <div className="flex gap-1.5 mt-4">
                              <button
                                onClick={() => handleSavePay(booking)}
                                disabled={savingId === booking._id}
                                className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-all disabled:opacity-60"
                              >
                                {savingId === booking._id ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2.5 rounded-xl bg-white/10 text-white/40 hover:bg-white/20 transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col flex-1 min-w-[80px]">
                               <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Customer Paid</p>
                               <p className="text-sm font-black text-emerald-400">£{customerPaid.toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col flex-1 min-w-[100px]">
                              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                                Worker Rate/Hrs
                              </p>
                              <p className="text-sm font-black text-white">
                                £{(booking.workerRate || 0).toFixed(2)}/hr × {duration}h
                              </p>
                            </div>
                            <div className="flex flex-col flex-1 min-w-[80px]">
                              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                                Worker Pay
                              </p>
                              <p
                                className={`text-sm font-black ${totalPay > 0 ? "text-indigo-400" : "text-white/40"}`}
                              >
                                £{totalPay.toFixed(2)}
                              </p>
                            </div>
                             <div className="flex flex-col flex-1 min-w-[80px]">
                              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                                Profit
                              </p>
                              <p
                                className={`text-sm font-black ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                              >
                                {profit >= 0 ? '+' : '-'}£{Math.abs(profit).toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => startEdit(booking)}
                              className="p-2.5 rounded-xl text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            >
                              <Edit3 size={16} />
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : booking._id)
                        }
                        className="p-2.5 rounded-xl text-white/40 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all self-start lg:self-center"
                      >
                        {isExpanded ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 bg-[#071D16] border-t border-white/[0.06]">
                      <div className="pt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                            <Calendar size={16} className="text-blue-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                              Scheduled Date
                            </p>
                            <p className="text-sm font-black text-white mt-0.5">
                              {booking.schedule?.date
                                ? new Date(
                                    booking.schedule.date
                                  ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Not set"}
                            </p>
                            <p className="text-xs text-white/40 font-bold">
                              {booking.schedule?.timeSlot || ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                            <MapPin size={16} className="text-violet-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                              Location
                            </p>
                            <p className="text-sm font-black text-white mt-0.5 line-clamp-2">
                              {booking.details?.address || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                              Job Accepted
                            </p>
                            {booking.jobAcceptedTime ? (
                              <p className="text-sm font-black text-emerald-300 mt-0.5">
                                {fmt(booking.jobAcceptedTime)}
                              </p>
                            ) : (
                              <p className="text-xs text-white/40 font-bold italic mt-0.5">
                                Not yet accepted
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                            <Clock size={16} className="text-amber-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                              Live Job Timing
                            </p>
                            <p className="text-xs font-bold text-white/60 mt-0.5">
                              {booking.jobArrivedTime
                                ? `Arrived: ${fmt(booking.jobArrivedTime)}`
                                : "Not arrived yet"}
                            </p>
                            {booking.jobStartTime && (
                              <p className="text-xs font-bold text-white/60">
                                Started: {fmt(booking.jobStartTime)}
                              </p>
                            )}
                            {booking.jobEndTime && (
                              <p className="text-xs font-bold text-emerald-400">
                                Finished: {fmt(booking.jobEndTime)}
                              </p>
                            )}
                            {booking.jobDurationActual > 0 && (
                              <p className="text-xs font-black text-emerald-400 mt-0.5">
                                Actual: {booking.jobDurationActual} mins
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 p-4 rounded-2xl bg-[#0B2D22] border border-white/10 flex flex-wrap gap-6 items-center">
                        <div>
                           <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                             Customer Paid
                           </p>
                           <p className="text-2xl font-black text-emerald-300">
                             £{customerPaid.toFixed(2)}
                           </p>
                        </div>
                        <div className="w-px h-8 bg-white/10 hidden md:block"></div>
                        <div>
                          <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">
                            Worker Rate
                          </p>
                          <p className="text-xl font-black text-emerald-400">
                            £{(booking.workerRate || 0).toFixed(2)}/hr
                          </p>
                        </div>
                        <div className="text-white/40 font-black text-lg">×</div>
                        <div>
                          <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">
                            Booked Hours
                          </p>
                          <p className="text-xl font-black text-emerald-400">
                            {duration} hrs
                          </p>
                        </div>
                        <div className="text-white/40 font-black text-lg">=</div>
                        <div>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            Worker Payout
                          </p>
                          <p className="text-2xl font-black text-indigo-300">
                            £{totalPay.toFixed(2)}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-white/10 hidden md:block"></div>
                        <div>
                          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                            Profit
                          </p>
                          <p className={`text-2xl font-black ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {profit >= 0 ? '+' : '-'}£{Math.abs(profit).toFixed(2)}
                          </p>
                        </div>

                        {booking.workerRate > 0 && (
                          <div className="ml-auto">
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={12} /> Pay Set
                            </span>
                          </div>
                        )}
                        {!booking.workerRate && (
                          <div className="ml-auto">
                            <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                              <AlertCircle size={12} /> Using Defaults
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerPay;
