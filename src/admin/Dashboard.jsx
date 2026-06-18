import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Phone,
  Activity,
  Shield,
  HardDrive,
  Plus,
  RefreshCw,
  Wallet,
  BarChart3,
  Timer,
  Star,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
} from "lucide-react";

const RevenueCard = ({
  label,
  amount,
  count,
  color,
  bg,
  icon: Icon,
  barColor,
  max,
}) => {
  const pct = max > 0 ? Math.min((amount / max) * 100, 100).toFixed(1) : "0.0";
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300">
      <div className="flex justify-between items-start mb-5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}
        >
          <Icon size={18} className={color} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-50 text-slate-500">
          {count} booking{count !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
        {label}
      </p>
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums mb-4">
        £
        {amount.toLocaleString("en-GB", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </h3>
      <div className="flex items-center gap-2.5">
        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[11px] font-semibold tabular-nums ${color}`}>
          {pct}%
        </span>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    Completed: {
      dot: "bg-emerald-600",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    Confirmed: { dot: "bg-blue-600", text: "text-blue-700", bg: "bg-blue-50" },
    Pending: { dot: "bg-amber-600", text: "text-amber-700", bg: "bg-amber-50" },
    Cancelled: { dot: "bg-red-600", text: "text-red-700", bg: "bg-red-50" },
    "In Progress": {
      dot: "bg-purple-600",
      text: "text-purple-700",
      bg: "bg-purple-50",
    },
    Accepted: {
      dot: "bg-indigo-600",
      text: "text-indigo-700",
      bg: "bg-indigo-50",
    },
  };
  const s = map[status] || {
    dot: "bg-slate-400",
    text: "text-slate-600",
    bg: "bg-slate-50",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

// Customer initials, used for the avatar chip in the bookings table.
const initials = (b) => {
  const f = b?.customer?.firstName?.[0] || "";
  const l = b?.customer?.lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Revenue by status
  const completed = bookings.filter((b) => b.status === "Completed");
  const pending = bookings.filter((b) =>
    ["Pending", "Confirmed", "Accepted", "In Progress"].includes(b.status),
  );
  const cancelled = bookings.filter((b) => b.status === "Cancelled");

  const rev = (arr) =>
    arr.reduce((s, b) => s + Number(b.payment?.amount || 0), 0);
  const totalRevenue = rev(bookings);
  const completedRevenue = rev(completed);
  const pendingRevenue = rev(pending);
  const cancelledRevenue = rev(cancelled);
  const pct = (v) =>
    totalRevenue > 0 ? ((v / totalRevenue) * 100).toFixed(1) : "0.0";

  // Worker costs & profit
  const totalWorkerCost = bookings.reduce(
    (s, b) => s + (b.workerRate || 0) * (b.details?.duration || 0),
    0,
  );
  const totalProfit = completedRevenue - totalWorkerCost;

  // Monthly data (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleString("en-GB", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });
  const monthlyData = months.map(({ label, year, month }) => {
    const inMonth = bookings.filter((b) => {
      const d = new Date(b.createdAt || b.schedule?.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return { label, revenue: rev(inMonth), count: inMonth.length };
  });
  const maxMonthRev = Math.max(...monthlyData.map((m) => m.revenue), 1);

  // Month-over-month momentum, used for the hero delta chip
  const prevMonthRevenue = monthlyData[monthlyData.length - 2]?.revenue || 0;
  const currentMonthRevenue = monthlyData[monthlyData.length - 1]?.revenue || 0;
  const hasMomentum = prevMonthRevenue > 0;
  const momentumPct = hasMomentum
    ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
    : 0;

  // Mini trend line for the hero card, plotted from the same 6-month series
  const sparkPoints = monthlyData
    .map(
      (m, i) =>
        `${(i * 100) / (monthlyData.length - 1)},${30 - (m.revenue / maxMonthRev) * 26}`,
    )
    .join(" ");

  // Average monthly revenue, shown as a reference line on the bar chart
  const avgMonthlyRevenue =
    monthlyData.reduce((s, m) => s + m.revenue, 0) / monthlyData.length;
  const avgLinePct =
    maxMonthRev > 0
      ? Math.min((avgMonthlyRevenue / maxMonthRev) * 100, 100)
      : 0;

  // Top services
  const serviceMap = {};
  bookings.forEach((b) => {
    if (!serviceMap[b.service])
      serviceMap[b.service] = { count: 0, revenue: 0 };
    serviceMap[b.service].count++;
    serviceMap[b.service].revenue += Number(b.payment?.amount || 0);
  });
  const topServices = Object.entries(serviceMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);
  const maxServiceRev = topServices[0]?.[1].revenue || 1;

  const recentBookings = bookings.slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">
            Financial Overview
          </p>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Revenue Dashboard
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {loading
              ? "Fetching data…"
              : `${bookings.length} total bookings · Last updated ${lastRefresh ? lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}`}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Revenue - ledger hero card */}
        <div className="bg-gradient-to-br from-[#101A2E] to-[#070B14] rounded-3xl p-6 text-white shadow-xl shadow-slate-900/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Wallet size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full border border-white/10 text-slate-300">
                {bookings.length} total
              </span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
              Total Revenue
            </p>
            <h3 className="text-3xl font-bold tracking-tight tabular-nums mb-4">
              £
              {totalRevenue.toLocaleString("en-GB", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            <div className="flex items-end justify-between gap-3">
              {hasMomentum ? (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums ${momentumPct >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {momentumPct >= 0 ? (
                    <ArrowUpRight size={13} />
                  ) : (
                    <ArrowDownRight size={13} />
                  )}
                  {momentumPct >= 0 ? "+" : ""}
                  {momentumPct.toFixed(1)}% vs last month
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400">
                  Tracking this month's first sales
                </span>
              )}
              <svg
                width="76"
                height="28"
                viewBox="0 0 100 32"
                className="flex-shrink-0 overflow-visible"
              >
                <defs>
                  <linearGradient
                    id="heroSparkFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,30 ${sparkPoints} 100,30`}
                  fill="url(#heroSparkFill)"
                />
                <polyline
                  points={sparkPoints}
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <RevenueCard
          label="Completed Revenue"
          amount={completedRevenue}
          count={completed.length}
          color="text-emerald-700"
          bg="bg-emerald-50"
          barColor="bg-emerald-600"
          icon={CheckCircle2}
          max={totalRevenue}
        />
        <RevenueCard
          label="Pending Revenue"
          amount={pendingRevenue}
          count={pending.length}
          color="text-amber-700"
          bg="bg-amber-50"
          barColor="bg-amber-500"
          icon={Timer}
          max={totalRevenue}
        />
        <RevenueCard
          label="Cancelled Revenue"
          amount={cancelledRevenue}
          count={cancelled.length}
          color="text-red-700"
          bg="bg-red-50"
          barColor="bg-red-500"
          icon={XCircle}
          max={totalRevenue}
        />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          className={`rounded-2xl p-5 border flex items-center gap-4 ${totalProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${totalProfit >= 0 ? "bg-emerald-100" : "bg-red-100"}`}
          >
            {totalProfit >= 0 ? (
              <TrendingUp size={20} className="text-emerald-700" />
            ) : (
              <TrendingDown size={20} className="text-red-700" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Net Profit
            </p>
            <p
              className={`text-xl font-bold tabular-nums ${totalProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}
            >
              {totalProfit < 0 ? "-" : ""}£
              {Math.abs(totalProfit).toLocaleString("en-GB", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Completed revenue minus worker costs
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-5 border bg-slate-50 border-slate-200 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-200/70 flex items-center justify-center flex-shrink-0">
            <Users size={20} className="text-slate-700" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Worker Costs
            </p>
            <p className="text-xl font-bold tabular-nums text-slate-800">
              £
              {totalWorkerCost.toLocaleString("en-GB", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Rate × booked hours (all bookings)
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-5 border bg-indigo-50 border-indigo-200 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Receipt size={20} className="text-indigo-700" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Avg Booking Value
            </p>
            <p className="text-xl font-bold tabular-nums text-indigo-700">
              £
              {bookings.length > 0
                ? (totalRevenue / bookings.length).toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Per booking average
            </p>
          </div>
        </div>
      </div>

      {/* Chart + Revenue Split */}
      <div className="grid lg:grid-cols-3 gap-7">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Monthly Revenue
              </h3>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Last 6 months
              </p>
            </div>
            <BarChart3 size={18} className="text-slate-300" />
          </div>
          <div className="p-6 md:p-8">
            {loading ? (
              <div className="flex items-end gap-3 h-44">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-slate-100 rounded-xl animate-pulse"
                    style={{ height: `${40 + i * 10}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative" style={{ height: "140px" }}>
                  <div
                    className="absolute left-0 right-0 flex items-center gap-2 z-10"
                    style={{ bottom: `${avgLinePct}%` }}
                  >
                    <div className="flex-1 border-t border-dashed border-slate-300" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 bg-white px-1 -translate-y-1/2 flex-shrink-0">
                      Avg £
                      {avgMonthlyRevenue.toLocaleString("en-GB", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex gap-3 h-full">
                    {monthlyData.map((m, i) => {
                      const heightPct =
                        maxMonthRev > 0 ? (m.revenue / maxMonthRev) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 h-full relative flex flex-col items-center justify-end group"
                        >
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-semibold rounded-xl px-2.5 py-1.5 whitespace-nowrap z-20 pointer-events-none shadow-xl tabular-nums">
                            £
                            {m.revenue.toLocaleString("en-GB", {
                              minimumFractionDigits: 2,
                            })}
                            <br />
                            <span className="text-slate-400">
                              {m.count} booking{m.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div
                            className="w-full bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-primary group-hover:to-primary/70 rounded-t-lg transition-all duration-300 cursor-pointer"
                            style={{
                              height: `${Math.max(heightPct, 4)}%`,
                              minHeight: "6px",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  {monthlyData.map((m, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Split */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">
              Revenue Split
            </h3>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              By booking status
            </p>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            {[
              {
                label: "Completed",
                value: completedRevenue,
                count: completed.length,
                bar: "bg-emerald-600",
                text: "text-emerald-700",
                dot: "bg-emerald-600",
              },
              {
                label: "Pending / Active",
                value: pendingRevenue,
                count: pending.length,
                bar: "bg-amber-500",
                text: "text-amber-700",
                dot: "bg-amber-500",
              },
              {
                label: "Cancelled",
                value: cancelledRevenue,
                count: cancelled.length,
                bar: "bg-red-500",
                text: "text-red-700",
                dot: "bg-red-500",
              },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold tabular-nums ${item.text}`}
                    >
                      £
                      {item.value.toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold ml-1.5 tabular-nums">
                      ({item.count})
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.bar} transition-all duration-700`}
                    style={{
                      width: `${totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p
                  className={`text-[10px] font-semibold tabular-nums ${item.text}`}
                >
                  {pct(item.value)}% of total revenue
                </p>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Grand Total
              </span>
              <span className="text-base font-bold tabular-nums text-slate-900">
                £
                {totalRevenue.toLocaleString("en-GB", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-7">
        {/* Bookings Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Recent Bookings
              </h3>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Latest 6 bookings
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/bookings")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Manage All <ChevronRight size={13} />
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-slate-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="p-16 text-center">
                <Calendar size={40} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-semibold">No bookings yet</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] bg-slate-50/60">
                    <th className="px-6 md:px-8 py-3.5">Customer</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">
                      Service
                    </th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-6 md:px-8 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map((b, i) => (
                    <tr
                      key={i}
                      onClick={() => navigate(`/admin/bookings?id=${b._id}`)}
                      className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-6 md:px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-slate-500">
                              {initials(b)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 group-hover:text-primary transition-colors text-sm">
                              {b.customer?.firstName} {b.customer?.lastName}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone size={9} /> {b.customer?.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <p className="text-sm font-medium text-slate-700">
                          {b.service}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {b.schedule?.date
                            ? new Date(b.schedule.date).toLocaleDateString(
                                "en-GB",
                                { day: "numeric", month: "short" },
                              )
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-6 md:px-8 py-4 text-right">
                        <span className="font-bold text-slate-900 text-sm tabular-nums">
                          £
                          {Number(b.payment?.amount || 0).toLocaleString(
                            "en-GB",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                        {b.payment?.status && (
                          <p
                            className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${b.payment.status === "Completed" ? "text-emerald-600" : b.payment.status === "Pending" ? "text-amber-600" : "text-slate-400"}`}
                          >
                            {b.payment.status}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Services */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Top Services</h3>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                By revenue earned
              </p>
            </div>
            <div className="p-6 space-y-4">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 bg-slate-100 rounded-xl animate-pulse"
                  />
                ))
              ) : topServices.length === 0 ? (
                <p className="text-slate-400 text-sm font-semibold text-center py-4">
                  No data yet
                </p>
              ) : (
                topServices.map(([name, stats], i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="text-[10px] font-bold text-slate-400 w-4 flex-shrink-0">
                          #{i + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 truncate">
                          {name}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 tabular-nums flex-shrink-0">
                        £
                        {stats.revenue.toLocaleString("en-GB", {
                          minimumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-slate-700 to-slate-500 rounded-full transition-all duration-700"
                          style={{
                            width: `${(stats.revenue / maxServiceRev) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 tabular-nums">
                        {stats.count}x
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gradient-to-br from-[#101A2E] to-[#070B14] rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/30">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <h3 className="text-sm font-bold mb-5 flex items-center gap-2 relative z-10">
              <Activity size={16} className="text-emerald-400" /> System Health
            </h3>
            <div className="space-y-3 relative z-10">
              {[
                {
                  label: "API Gateway",
                  status: "Healthy",
                  icon: Shield,
                  color: "text-emerald-400",
                },
                {
                  label: "Database",
                  status: "Synced",
                  icon: HardDrive,
                  color: "text-blue-400",
                },
                {
                  label: "Uptime",
                  status: "100%",
                  icon: Zap,
                  color: "text-amber-400",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon size={15} className={item.color} />
                    <span className="text-xs font-medium text-slate-300">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold tabular-nums ${item.color}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Bookings",
                  icon: Calendar,
                  bg: "hover:bg-primary/5 hover:border-primary/20",
                  iconBg: "bg-primary/10 text-primary",
                  route: "/admin/bookings",
                },
                {
                  label: "Worker Pay",
                  icon: Wallet,
                  bg: "hover:bg-slate-100 hover:border-slate-300",
                  iconBg: "bg-slate-200/70 text-slate-700",
                  route: "/admin/worker-pay",
                },
                {
                  label: "Reviews",
                  icon: Star,
                  bg: "hover:bg-amber-50 hover:border-amber-200",
                  iconBg: "bg-amber-100 text-amber-600",
                  route: "/admin/settings",
                },
                {
                  label: "Services",
                  icon: Plus,
                  bg: "hover:bg-indigo-50 hover:border-indigo-200",
                  iconBg: "bg-indigo-100 text-indigo-600",
                  route: "/admin/services",
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.route)}
                  className={`p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-2 transition-all group ${item.bg}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${item.iconBg}`}
                  >
                    <item.icon size={17} />
                  </div>
                  <span className="text-[9px] font-bold uppercase text-slate-600">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
