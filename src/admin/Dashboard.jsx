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
} from "lucide-react";

const RevenueCard = ({ label, amount, count, color, bg, icon: Icon, barColor, max }) => {
  const pct = max > 0 ? Math.min((amount / max) * 100, 100).toFixed(1) : "0.0";
  return (
    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 group relative overflow-hidden">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${bg} rounded-[28px]`} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${bg}`}>
            <Icon size={20} className={color} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${bg} ${color}`}>
            {count} booking{count !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
          £{amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-[10px] font-black ${color}`}>{pct}%</span>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    Completed:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    Confirmed:    "bg-blue-50 text-blue-700 border-blue-200",
    Pending:      "bg-amber-50 text-amber-700 border-amber-200",
    Cancelled:    "bg-rose-50 text-rose-600 border-rose-200",
    "In Progress":"bg-purple-50 text-purple-700 border-purple-200",
    Accepted:     "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${map[status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
      {status}
    </span>
  );
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

  useEffect(() => { fetchData(); }, [fetchData]);

  // Revenue by status
  const completed = bookings.filter((b) => b.status === "Completed");
  const pending   = bookings.filter((b) => ["Pending", "Confirmed", "Accepted", "In Progress"].includes(b.status));
  const cancelled = bookings.filter((b) => b.status === "Cancelled");

  const rev = (arr) => arr.reduce((s, b) => s + Number(b.payment?.amount || 0), 0);
  const totalRevenue     = rev(bookings);
  const completedRevenue = rev(completed);
  const pendingRevenue   = rev(pending);
  const cancelledRevenue = rev(cancelled);
  const pct = (v) => totalRevenue > 0 ? ((v / totalRevenue) * 100).toFixed(1) : "0.0";

  // Worker costs & profit
  const totalWorkerCost = bookings.reduce((s, b) => s + (b.workerRate || 0) * (b.details?.duration || 0), 0);
  const totalProfit = completedRevenue - totalWorkerCost;

  // Monthly data (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { label: d.toLocaleString("en-GB", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });
  const monthlyData = months.map(({ label, year, month }) => {
    const inMonth = bookings.filter((b) => {
      const d = new Date(b.createdAt || b.schedule?.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return { label, revenue: rev(inMonth), count: inMonth.length };
  });
  const maxMonthRev = Math.max(...monthlyData.map((m) => m.revenue), 1);

  // Top services
  const serviceMap = {};
  bookings.forEach((b) => {
    if (!serviceMap[b.service]) serviceMap[b.service] = { count: 0, revenue: 0 };
    serviceMap[b.service].count++;
    serviceMap[b.service].revenue += Number(b.payment?.amount || 0);
  });
  const topServices = Object.entries(serviceMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
  const maxServiceRev = topServices[0]?.[1].revenue || 1;

  const recentBookings = bookings.slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Revenue Dashboard</h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            {loading
              ? "Fetching data…"
              : `${bookings.length} total bookings · Last updated ${lastRefresh ? lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}`}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Revenue - Dark hero card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[28px] p-6 text-white shadow-xl shadow-slate-800/20 relative overflow-hidden hover:shadow-2xl hover:shadow-slate-800/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-8 -mb-8 blur-2xl" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-5">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                <Wallet size={20} className="text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                {bookings.length} total
              </span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Revenue</p>
            <h3 className="text-3xl font-black tracking-tight mb-1">
              £{totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">All bookings combined</p>
          </div>
        </div>

        <RevenueCard label="Completed Revenue" amount={completedRevenue} count={completed.length} color="text-emerald-600" bg="bg-emerald-50" barColor="bg-emerald-500" icon={CheckCircle2} max={totalRevenue} />
        <RevenueCard label="Pending Revenue"   amount={pendingRevenue}   count={pending.length}   color="text-amber-600"  bg="bg-amber-50"  barColor="bg-amber-400"  icon={Timer}         max={totalRevenue} />
        <RevenueCard label="Cancelled Revenue" amount={cancelledRevenue} count={cancelled.length} color="text-rose-600"   bg="bg-rose-50"   barColor="bg-rose-400"   icon={XCircle}       max={totalRevenue} />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className={`rounded-[24px] p-5 border flex items-center gap-4 ${totalProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${totalProfit >= 0 ? "bg-emerald-100" : "bg-rose-100"}`}>
            {totalProfit >= 0 ? <TrendingUp size={22} className="text-emerald-600" /> : <TrendingDown size={22} className="text-rose-600" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Profit</p>
            <p className={`text-xl font-black ${totalProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
              {totalProfit < 0 ? "-" : ""}£{Math.abs(totalProfit).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">Completed revenue minus worker costs</p>
          </div>
        </div>

        <div className="rounded-[24px] p-5 border bg-purple-50 border-purple-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Users size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Worker Costs</p>
            <p className="text-xl font-black text-purple-700">
              £{totalWorkerCost.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">Rate × booked hours (all bookings)</p>
          </div>
        </div>

        <div className="rounded-[24px] p-5 border bg-indigo-50 border-indigo-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <BarChart3 size={22} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Booking Value</p>
            <p className="text-xl font-black text-indigo-700">
              £{bookings.length > 0 ? (totalRevenue / bookings.length).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">Per booking average</p>
          </div>
        </div>
      </div>

      {/* Chart + Revenue Split */}
      <div className="grid lg:grid-cols-3 gap-7">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-800">Monthly Revenue</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Last 6 months</p>
            </div>
            <BarChart3 size={18} className="text-slate-300" />
          </div>
          <div className="p-6 md:p-8">
            {loading ? (
              <div className="flex items-end gap-3 h-44">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex-1 bg-slate-100 rounded-xl animate-pulse" style={{ height: `${40 + i * 10}%` }} />
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-3" style={{ height: "176px" }}>
                {monthlyData.map((m, i) => {
                  const heightPct = maxMonthRev > 0 ? (m.revenue / maxMonthRev) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="relative w-full flex flex-col items-center justify-end" style={{ height: "140px" }}>
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold rounded-xl px-2.5 py-1.5 whitespace-nowrap z-10 pointer-events-none shadow-xl">
                          £{m.revenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                          <br />
                          <span className="text-slate-400">{m.count} booking{m.count !== 1 ? "s" : ""}</span>
                        </div>
                        <div
                          className="w-full bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-primary group-hover:to-primary/70 rounded-t-xl transition-all duration-300 cursor-pointer"
                          style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: "6px" }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Revenue Split */}
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Revenue Split</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">By booking status</p>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            {[
              { label: "Completed",       value: completedRevenue, count: completed.length, bar: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-500" },
              { label: "Pending / Active", value: pendingRevenue,   count: pending.length,   bar: "bg-amber-400",  text: "text-amber-600",  dot: "bg-amber-400"  },
              { label: "Cancelled",        value: cancelledRevenue, count: cancelled.length, bar: "bg-rose-400",   text: "text-rose-600",   dot: "bg-rose-400"   },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-black ${item.text}`}>
                      £{item.value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1.5">({item.count})</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.bar} transition-all duration-700`} style={{ width: `${totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0}%` }} />
                </div>
                <p className={`text-[10px] font-bold ${item.text}`}>{pct(item.value)}% of total revenue</p>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Grand Total</span>
              <span className="text-base font-black text-slate-800">
                £{totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-7">
        {/* Bookings Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-800">Recent Bookings</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Latest 6 bookings</p>
            </div>
            <button
              onClick={() => navigate("/admin/bookings")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Manage All <ChevronRight size={13} />
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="p-16 text-center">
                <Calendar size={40} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No bookings yet</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50/30">
                    <th className="px-6 md:px-8 py-4">Customer</th>
                    <th className="px-4 py-4 hidden sm:table-cell">Service</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-6 md:px-8 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentBookings.map((b, i) => (
                    <tr
                      key={i}
                      onClick={() => navigate(`/admin/bookings?id=${b._id}`)}
                      className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-6 md:px-8 py-4">
                        <p className="font-bold text-slate-800 group-hover:text-primary transition-colors text-sm">
                          {b.customer?.firstName} {b.customer?.lastName}
                        </p>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 mt-0.5">
                          <Phone size={9} /> {b.customer?.phone}
                        </p>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <p className="text-sm font-semibold text-slate-700">{b.service}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {b.schedule?.date ? new Date(b.schedule.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-6 md:px-8 py-4 text-right">
                        <span className="font-black text-slate-800 text-sm">
                          £{Number(b.payment?.amount || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {b.payment?.status && (
                          <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${b.payment.status === "Completed" ? "text-emerald-500" : b.payment.status === "Pending" ? "text-amber-500" : "text-slate-400"}`}>
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
          <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-black text-slate-800">Top Services</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">By revenue earned</p>
            </div>
            <div className="p-6 space-y-4">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-xl animate-pulse" />)
              ) : topServices.length === 0 ? (
                <p className="text-slate-400 text-sm font-bold text-center py-4">No data yet</p>
              ) : topServices.map(([name, stats], i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="text-[10px] font-black text-slate-400 w-4 flex-shrink-0">#{i + 1}</span>
                      <span className="text-[11px] font-bold text-slate-700 truncate">{name}</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-800 flex-shrink-0">
                      £{stats.revenue.toLocaleString("en-GB", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-slate-700 to-slate-500 rounded-full transition-all duration-700" style={{ width: `${(stats.revenue / maxServiceRev) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-slate-400">{stats.count}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-slate-800 rounded-[28px] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-800/20">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <h3 className="text-base font-bold mb-5 flex items-center gap-2 relative z-10">
              <Activity size={18} className="text-emerald-400" /> System Health
            </h3>
            <div className="space-y-3 relative z-10">
              {[
                { label: "API Gateway", status: "Healthy",  icon: Shield,    color: "text-emerald-400" },
                { label: "Database",    status: "Synced",   icon: HardDrive, color: "text-blue-400"    },
                { label: "Uptime",      status: "100%",     icon: Zap,       color: "text-amber-400"   },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <item.icon size={15} className={item.color} />
                    <span className="text-xs font-medium text-slate-300">{item.label}</span>
                  </div>
                  <span className={`text-xs font-black ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Bookings",   icon: Calendar,  bg: "hover:bg-primary/5 hover:border-primary/20",   iconBg: "bg-primary/10 text-primary",          route: "/admin/bookings"    },
                { label: "Worker Pay", icon: Wallet,    bg: "hover:bg-emerald-50 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600",      route: "/admin/worker-pay"  },
                { label: "Reviews",    icon: Star,      bg: "hover:bg-purple-50 hover:border-purple-200",   iconBg: "bg-purple-100 text-purple-600",        route: "/admin/settings"    },
                { label: "Services",   icon: Plus,      bg: "hover:bg-indigo-50 hover:border-indigo-200",   iconBg: "bg-indigo-100 text-indigo-600",        route: "/admin/services"    },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.route)}
                  className={`p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-2 transition-all group ${item.bg}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${item.iconBg}`}>
                    <item.icon size={17} />
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-600">{item.label}</span>
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
