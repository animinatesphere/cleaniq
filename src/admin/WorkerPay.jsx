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

  // Global defaults state
  const [defaults, setDefaults] = useState({
    defaultWorkerRate: "",
  });
  const [savingDefaults, setSavingDefaults] = useState(false);

  // Inline edit state: { [bookingId]: { workerRate } }
  const [editMap, setEditMap] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Filters
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

  // Flash status message
  const flash = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 3500);
  };

  // Save global defaults
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

  // Start editing a booking's pay
  const startEdit = (booking) => {
    setEditingId(booking._id);
    setEditMap((prev) => ({
      ...prev,
      [booking._id]: {
        workerRate: booking.workerRate ?? "",
      },
    }));
  };

  // Save a single booking's pay
  const handleSavePay = async (booking) => {
    const vals = editMap[booking._id] || {};
    setSavingId(booking._id);
    try {
      const res = await fetch(`${API}/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...booking,
          workerRate: parseFloat(vals.workerRate) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditingId(null);
      flash("success", `✅ Pay updated for booking ${booking.bookingId}`);
      fetchBookings();
    } catch (err) {
      flash("error", "❌ Failed to update booking pay.");
    } finally {
      setSavingId(null);
    }
  };

  // Compute stats
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
      Confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      Assigned: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Completed: "bg-indigo-50 text-indigo-700 border-indigo-200",
      Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return map[status] || "bg-slate-50 text-slate-600 border-slate-200";
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary-dark tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Wallet size={22} className="text-primary" />
            </div>
            Worker Pay
          </h1>
          <p className="text-slate-500 text-sm font-bold mt-1 ml-1">
            Set hourly rates & track money flow and profit
          </p>
        </div>
        <button
          onClick={() => {
            fetchBookings();
            fetchDefaults();
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Status Flash */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl text-sm font-bold border ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <Briefcase size={20} />,
            label: "Total Bookings",
            value: bookings.length,
            color: "blue",
          },
          {
            icon: <Users size={20} />,
            label: "Assigned Jobs",
            value: assignedBookings.length,
            color: "emerald",
          },
          {
            icon: <ArrowUpRight size={20} />,
            label: "Total Worker Payout",
            value: `£${totalPayout.toFixed(2)}`,
            color: "indigo",
          },
          {
            icon: <ArrowDownRight size={20} />,
            label: "Total Revenue",
            value: `£${totalRevenue.toFixed(2)}`,
            color: "emerald",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm`}
          >
            <div
              className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}
            >
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-primary-dark mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Global Defaults Panel */}
      <div className="bg-gradient-to-br from-primary/5 to-indigo-50 rounded-[32px] p-7 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Settings size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-primary-dark">
              Global Default Settings
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Set the default hourly rate for new bookings
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-5 items-end">
          <div className="space-y-2 w-full max-w-sm">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
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
              className="w-full p-4 rounded-2xl border-2 border-white bg-white font-black text-lg focus:outline-none focus:border-primary transition-all shadow-sm"
            />
          </div>
          <button
            onClick={handleSaveDefaults}
            disabled={savingDefaults}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-60"
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

      {/* Booking Pay List */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {/* List Header & Filters */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-lg font-black text-primary-dark flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            Booking Money Flow
            <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search booking, worker, service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:outline-none focus:border-primary transition-all w-64"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:outline-none focus:border-primary transition-all"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <span className="text-slate-500 font-bold">Loading bookings...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">No bookings found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
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
                  {/* Main Row */}
                  <div className="px-6 py-5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Booking Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                            {booking.bookingId}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wide ${getStatusStyle(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <p className="font-black text-primary-dark text-sm">
                          {booking.customer?.firstName}{" "}
                          {booking.customer?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">
                          {booking.service}
                        </p>
                      </div>

                      {/* Worker Info */}
                      <div className="lg:w-44">
                        {booking.assignedWorkerName ? (
                          <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                              Worker
                            </p>
                            <p className="text-sm font-black text-emerald-800">
                              {booking.assignedWorkerName}
                            </p>
                            {booking.jobAcceptedTime && (
                              <p className="text-[10px] text-emerald-500 font-bold mt-0.5">
                                ✓ Accepted {fmt(booking.jobAcceptedTime)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Worker
                            </p>
                            <p className="text-xs text-slate-400 font-bold italic">
                              Not yet assigned
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Financials (editable) */}
                      <div className="flex flex-wrap items-center gap-3 lg:w-[450px]">
                        {isEditing ? (
                          <>
                            <div className="flex-1 min-w-[100px]">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
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
                                className="w-full p-2.5 rounded-xl border-2 border-primary/30 bg-white font-black text-sm focus:outline-none focus:border-primary"
                                placeholder="Rate"
                              />
                            </div>
                            <div className="flex gap-1.5 mt-4">
                              <button
                                onClick={() => handleSavePay(booking)}
                                disabled={savingId === booking._id}
                                className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-60"
                              >
                                {savingId === booking._id ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col flex-1 min-w-[80px]">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer Paid</p>
                               <p className="text-sm font-black text-emerald-600">£{customerPaid.toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col flex-1 min-w-[100px]">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Worker Rate/Hrs
                              </p>
                              <p className="text-sm font-black text-primary-dark">
                                £{(booking.workerRate || 0).toFixed(2)}/hr × {duration}h
                              </p>
                            </div>
                            <div className="flex flex-col flex-1 min-w-[80px]">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Worker Pay
                              </p>
                              <p
                                className={`text-sm font-black ${totalPay > 0 ? "text-indigo-600" : "text-slate-400"}`}
                              >
                                £{totalPay.toFixed(2)}
                              </p>
                            </div>
                             <div className="flex flex-col flex-1 min-w-[80px]">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Profit
                              </p>
                              <p
                                className={`text-sm font-black ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                              >
                                {profit >= 0 ? '+' : '-'}£{Math.abs(profit).toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => startEdit(booking)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                            >
                              <Edit3 size={16} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : booking._id)
                        }
                        className="p-2.5 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all self-start lg:self-center"
                      >
                        {isExpanded ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-gradient-to-br from-slate-50 to-white border-t border-slate-100">
                      <div className="pt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Schedule */}
                        <div className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <Calendar size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Scheduled Date
                            </p>
                            <p className="text-sm font-black text-primary-dark mt-0.5">
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
                            <p className="text-xs text-slate-500 font-bold">
                              {booking.schedule?.timeSlot || ""}
                            </p>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                            <MapPin size={16} className="text-violet-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Location
                            </p>
                            <p className="text-sm font-black text-primary-dark mt-0.5 line-clamp-2">
                              {booking.details?.address || "Not provided"}
                            </p>
                          </div>
                        </div>

                        {/* Job Acceptance Timeline */}
                        <div className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Job Accepted
                            </p>
                            {booking.jobAcceptedTime ? (
                              <p className="text-sm font-black text-emerald-700 mt-0.5">
                                {fmt(booking.jobAcceptedTime)}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 font-bold italic mt-0.5">
                                Not yet accepted
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Live Timing */}
                        <div className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <Clock size={16} className="text-amber-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Live Job Timing
                            </p>
                            <p className="text-xs font-bold text-slate-600 mt-0.5">
                              {booking.jobArrivedTime
                                ? `Arrived: ${fmt(booking.jobArrivedTime)}`
                                : "Not arrived yet"}
                            </p>
                            {booking.jobStartTime && (
                              <p className="text-xs font-bold text-slate-600">
                                Started: {fmt(booking.jobStartTime)}
                              </p>
                            )}
                            {booking.jobEndTime && (
                              <p className="text-xs font-bold text-emerald-600">
                                Finished: {fmt(booking.jobEndTime)}
                              </p>
                            )}
                            {booking.jobDurationActual > 0 && (
                              <p className="text-xs font-black text-primary mt-0.5">
                                Actual: {booking.jobDurationActual} mins
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pay Summary Bar */}
                      <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-indigo-100 border border-primary/20 flex flex-wrap gap-6 items-center">
                        <div>
                           <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                             Customer Paid
                           </p>
                           <p className="text-2xl font-black text-emerald-600">
                             £{customerPaid.toFixed(2)}
                           </p>
                        </div>
                        <div className="w-px h-8 bg-primary/20 hidden md:block"></div>
                        <div>
                          <p className="text-[9px] font-black text-primary/70 uppercase tracking-widest">
                            Worker Rate
                          </p>
                          <p className="text-xl font-black text-primary">
                            £{(booking.workerRate || 0).toFixed(2)}/hr
                          </p>
                        </div>
                        <div className="text-slate-400 font-black text-lg">×</div>
                        <div>
                          <p className="text-[9px] font-black text-primary/70 uppercase tracking-widest">
                            Booked Hours
                          </p>
                          <p className="text-xl font-black text-primary">
                            {duration} hrs
                          </p>
                        </div>
                        <div className="text-slate-400 font-black text-lg">=</div>
                        <div>
                          <p className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                            Worker Payout
                          </p>
                          <p className="text-2xl font-black text-indigo-600">
                            £{totalPay.toFixed(2)}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-primary/20 hidden md:block"></div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                            Profit
                          </p>
                          <p className={`text-2xl font-black ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
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
                            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
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
