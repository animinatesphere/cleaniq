import React, { useState, useEffect, useMemo } from "react";
import {
  Globe,
  Users,
  MousePointerClick,
  FileText,
  ArrowUpRight,
  Clock,
  TrendingDown,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Building2,
  HardHat,
  Activity,
  Wifi,
  CheckCircle2,
  Megaphone,
  Eye,
  Target,
  DollarSign,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const PERIODS = [
  { label: "7D", value: 7 },
  { label: "28D", value: 28 },
  { label: "90D", value: 90 },
];

const formatGaDate = (raw) => {
  // GA4 returns dates as "YYYYMMDD"
  if (!raw || raw.length !== 8) return raw;
  const d = new Date(
    `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
  );
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

const deviceIcon = (category) => {
  const c = (category || "").toLowerCase();
  if (c === "mobile") return Smartphone;
  if (c === "tablet") return Tablet;
  return Monitor;
};

const KpiCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}
      >
        <Icon size={16} />
      </div>
    </div>
    <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
    <p className="text-[11px] font-semibold text-white/40 mt-1">{label}</p>
  </div>
);

const BreakdownList = ({ title, items, renderLabel, valueKey, total }) => (
  <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-sm p-5 sm:p-6">
    <h3 className="text-sm font-bold text-white mb-4">{title}</h3>
    {items.length === 0 ? (
      <p className="text-xs text-white/40 py-6 text-center">No data yet</p>
    ) : (
      <div className="space-y-3">
        {items.map((item, i) => {
          const pct = total > 0 ? (item[valueKey] / total) * 100 : 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-xs font-semibold text-white/80 truncate flex-1 min-w-0">
                  {renderLabel(item)}
                </span>
                <span className="text-xs font-bold text-white tabular-nums shrink-0">
                  {item[valueKey].toLocaleString("en-GB")}
                </span>
              </div>
              <div className="h-1.5 bg-[#05201A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const buildMonthlyData = (customerMonthly = [], workerMonthly = []) => {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString("en-GB", { month: "short" }) });
  }
  const custMap = {};
  const compMap = {};
  const workMap = {};
  customerMonthly.forEach((r) => {
    const k = `${r._id.year}-${r._id.month}`;
    if (r._id.role === "customer") custMap[k] = (custMap[k] || 0) + r.count;
    else compMap[k] = (compMap[k] || 0) + r.count;
  });
  workerMonthly.forEach((r) => {
    const k = `${r._id.year}-${r._id.month}`;
    workMap[k] = (workMap[k] || 0) + r.count;
  });
  return months.map((m) => {
    const k = `${m.year}-${m.month}`;
    return { label: m.label, customers: custMap[k] || 0, companies: compMap[k] || 0, workers: workMap[k] || 0 };
  });
};

const fmt = (n, decimals = 0) =>
  n == null
    ? "—"
    : n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const MetaAdsSection = ({ data, loading, days }) => {
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-6 w-40 bg-white/[0.04] rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.03] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl p-12 text-center">
        <Megaphone size={28} className="text-white/20 mx-auto mb-3" />
        <p className="text-sm font-bold text-white">Meta Ads not connected</p>
        <p className="text-xs text-white/40 mt-2 max-w-sm mx-auto">
          Add{" "}
          <code className="bg-white/10 text-white/70 px-1.5 py-0.5 rounded">META_ACCESS_TOKEN</code>
          ,{" "}
          <code className="bg-white/10 text-white/70 px-1.5 py-0.5 rounded">META_AD_ACCOUNT_ID</code>
          {" "}and{" "}
          <code className="bg-white/10 text-white/70 px-1.5 py-0.5 rounded">META_PIXEL_ID</code>
          {" "}to the server environment variables, then restart.
        </p>
      </div>
    );
  }

  const { totals, campaigns } = data;
  const totalSpend = totals.spend || 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Megaphone size={18} className="text-[#1877F2]" /> Meta Ads
        </h2>
        <p className="text-sm text-white/40 mt-1">Campaign performance from Facebook & Instagram ads</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          icon={DollarSign}
          label="Total Spend"
          value={`£${fmt(totalSpend, 2)}`}
          accent="bg-[#1877F2]/15 text-[#1877F2]"
        />
        <KpiCard
          icon={Target}
          label="Leads"
          value={fmt(totals.leads)}
          accent="bg-emerald-500/15 text-emerald-400"
        />
        <KpiCard
          icon={Eye}
          label="Impressions"
          value={totals.impressions >= 1000
            ? `${fmt(totals.impressions / 1000, 1)}k`
            : fmt(totals.impressions)}
          accent="bg-violet-500/15 text-violet-400"
        />
        <KpiCard
          icon={MousePointerClick}
          label="Clicks"
          value={fmt(totals.clicks)}
          accent="bg-amber-500/15 text-amber-400"
        />
        <KpiCard
          icon={ArrowUpRight}
          label="CTR"
          value={`${fmt(totals.ctr, 2)}%`}
          accent="bg-cyan-500/15 text-cyan-400"
        />
        <KpiCard
          icon={Users}
          label="Cost / Lead"
          value={totals.leads > 0 ? `£${fmt(totals.cpl, 2)}` : "—"}
          accent="bg-rose-500/15 text-rose-400"
        />
      </div>

      {/* Campaign breakdown table */}
      {campaigns.length > 0 && (
        <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-bold text-white">Campaigns</h3>
            <p className="text-[11px] text-white/40 mt-0.5">Last {days} days</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-t border-white/[0.06]">
                  {["Campaign", "Spend", "Impressions", "Clicks", "CTR", "Leads", "CPL"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left font-bold text-white/30 uppercase tracking-wider text-[10px] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-semibold text-white/80 max-w-[200px] truncate">{c.campaign}</td>
                    <td className="px-5 py-3 font-bold text-white tabular-nums">£{fmt(c.spend, 2)}</td>
                    <td className="px-5 py-3 text-white/60 tabular-nums">{fmt(c.impressions)}</td>
                    <td className="px-5 py-3 text-white/60 tabular-nums">{fmt(c.clicks)}</td>
                    <td className="px-5 py-3 text-white/60 tabular-nums">{fmt(c.ctr, 2)}%</td>
                    <td className="px-5 py-3 font-semibold text-emerald-400 tabular-nums">{fmt(c.leads)}</td>
                    <td className="px-5 py-3 text-white/60 tabular-nums">
                      {c.leads > 0 ? `£${fmt(c.costPerLead, 2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spend breakdown bar */}
      {campaigns.length > 1 && totalSpend > 0 && (
        <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Spend by Campaign</h3>
          <div className="space-y-3">
            {campaigns
              .slice()
              .sort((a, b) => b.spend - a.spend)
              .map((c, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white/70 truncate flex-1 min-w-0 pr-3">
                      {c.campaign}
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums shrink-0">
                      £{fmt(c.spend, 2)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#05201A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1877F2]/70 rounded-full"
                      style={{ width: `${(c.spend / totalSpend) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">App Users</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
    </div>
  );
};

const AppUsersSection = ({ data }) => {
  if (!data) return null;
  const months = buildMonthlyData(data.customerMonthly, data.workerMonthly);
  const maxVal = Math.max(...months.flatMap((m) => [m.customers, m.companies, m.workers]), 1);
  const totalActive = data.totals.activeCustomers + data.totals.activeCompanies + data.totals.activeWorkers;
  const totalDevices = data.totals.devicesCustomerApp + data.totals.devicesWorkerApp;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Smartphone size={18} className="text-primary" /> App Users
        </h2>
        <p className="text-sm text-white/40 mt-1">Registered users across both mobile apps</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Smartphone} label="Customer App Users" value={data.totals.customers.toLocaleString("en-GB")} accent="bg-emerald-500/15 text-emerald-400" />
        <KpiCard icon={Building2} label="Business Accounts" value={data.totals.companies.toLocaleString("en-GB")} accent="bg-blue-500/15 text-blue-400" />
        <KpiCard icon={HardHat} label="Worker App Users" value={data.totals.workers.toLocaleString("en-GB")} accent="bg-amber-500/15 text-amber-400" />
        <KpiCard icon={Activity} label="Active (30 days)" value={totalActive.toLocaleString("en-GB")} accent="bg-violet-500/15 text-violet-400" />
      </div>

      {/* Monthly signups bar chart */}
      <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl p-5 sm:p-6">
        <h3 className="text-sm font-bold text-white mb-1">Monthly Registrations</h3>
        <p className="text-[11px] text-white/40 mb-5">New signups per month (last 12 months)</p>
        <div className="flex items-end gap-1 sm:gap-1.5" style={{ height: "112px" }}>
          {months.map((m, i) => {
            const cH = (m.customers / maxVal) * 100;
            const coH = (m.companies / maxVal) * 100;
            const wH = (m.workers / maxVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-end gap-px" style={{ height: "100%" }}>
                <div className="w-full flex items-end gap-px flex-1">
                  <div className="flex-1 bg-emerald-500/70 rounded-t-[2px] transition-all" style={{ height: `${cH}%`, minHeight: m.customers > 0 ? "3px" : "0" }} />
                  <div className="flex-1 bg-blue-500/70 rounded-t-[2px] transition-all" style={{ height: `${coH}%`, minHeight: m.companies > 0 ? "3px" : "0" }} />
                  <div className="flex-1 bg-amber-500/70 rounded-t-[2px] transition-all" style={{ height: `${wH}%`, minHeight: m.workers > 0 ? "3px" : "0" }} />
                </div>
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex gap-1 sm:gap-1.5 mt-2">
          {months.map((m, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[8px] sm:text-[9px] font-semibold text-white/30">{m.label}</span>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 shrink-0" />
            <span className="text-[11px] font-semibold text-white/60">Customers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/70 shrink-0" />
            <span className="text-[11px] font-semibold text-white/60">Companies</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/70 shrink-0" />
            <span className="text-[11px] font-semibold text-white/60">Workers</span>
          </div>
        </div>
      </div>

      {/* Device & activity breakdown */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Customer App */}
        <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={13} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Customer App</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{data.totals.customers.toLocaleString("en-GB")}</p>
          <p className="text-[11px] text-white/40 mt-0.5">Total registered users</p>
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/50 flex items-center gap-1.5"><Wifi size={11} /> Push-enabled devices</span>
              <span className="text-[11px] font-bold text-white tabular-nums">{data.totals.devicesCustomerApp.toLocaleString("en-GB")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/50 flex items-center gap-1.5"><Activity size={11} /> Active (30 days)</span>
              <span className="text-[11px] font-bold text-white tabular-nums">{(data.totals.activeCustomers + data.totals.activeCompanies).toLocaleString("en-GB")}</span>
            </div>
          </div>
        </div>

        {/* Worker App */}
        <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <HardHat size={13} className="text-amber-400" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Worker App</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{data.totals.workers.toLocaleString("en-GB")}</p>
          <p className="text-[11px] text-white/40 mt-0.5">Total registered workers</p>
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/50 flex items-center gap-1.5"><Wifi size={11} /> Push-enabled devices</span>
              <span className="text-[11px] font-bold text-white tabular-nums">{data.totals.devicesWorkerApp.toLocaleString("en-GB")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/50 flex items-center gap-1.5"><CheckCircle2 size={11} /> App access granted</span>
              <span className="text-[11px] font-bold text-white tabular-nums">{data.totals.activeWorkers.toLocaleString("en-GB")}</span>
            </div>
          </div>
        </div>

        {/* Combined totals */}
        <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-violet-400" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">All Apps Combined</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{(data.totals.customers + data.totals.companies + data.totals.workers).toLocaleString("en-GB")}</p>
          <p className="text-[11px] text-white/40 mt-0.5">Total registered users</p>
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/50 flex items-center gap-1.5"><Wifi size={11} /> All push devices</span>
              <span className="text-[11px] font-bold text-white tabular-nums">{totalDevices.toLocaleString("en-GB")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/50 flex items-center gap-1.5"><Activity size={11} /> Active (30 days)</span>
              <span className="text-[11px] font-bold text-white tabular-nums">{totalActive.toLocaleString("en-GB")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">Website Analytics</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
    </div>
  );
};

const Analytics = () => {
  const [days, setDays] = useState(28);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [liveUsers, setLiveUsers] = useState(null);
  const [appUsers, setAppUsers] = useState(null);

  const fetchAnalytics = () => {
    setLoading(true);
    fetch(`${API}/analytics/overview?days=${days}`)
      .then((r) => {
        if (!r.ok) throw new Error("not configured");
        return r.json();
      })
      .then((res) => {
        setData(res);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  const fetchRealtime = () => {
    fetch(`${API}/analytics/realtime`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => setLiveUsers(res ? res.activeUsers : null))
      .catch(() => setLiveUsers(null));
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(`${API}/analytics/app-users`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => setAppUsers(res))
      .catch(() => {});
  }, []);

  const trendPoints = useMemo(() => {
    if (!data?.trend?.length) return [];
    const max = Math.max(...data.trend.map((t) => t.activeUsers), 1);
    return data.trend.map((t, i) => {
      const heightPct = (t.activeUsers / max) * 78;
      const x =
        data.trend.length > 1 ? (i / (data.trend.length - 1)) * 100 : 50;
      return { ...t, x, heightPct, y: 92 - heightPct };
    });
  }, [data]);

  const trendLinePoints = trendPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const trendLabelStep = Math.max(1, Math.ceil(trendPoints.length / 8));

  const totalPageViews = data?.topPages?.reduce((s, p) => s + p.views, 0) || 0;
  const totalSourceSessions =
    data?.topSources?.reduce((s, src) => s + src.sessions, 0) || 0;
  const totalDeviceSessions =
    data?.devices?.reduce((s, d) => s + d.sessions, 0) || 0;
  const totalLandingSessions =
    data?.landingPages?.reduce((s, p) => s + p.sessions, 0) || 0;
  const totalCitySessions =
    data?.topCities?.reduce((s, c) => s + c.sessions, 0) || 0;
  const totalBrowserSessions =
    data?.browsers?.reduce((s, b) => s + b.sessions, 0) || 0;
  const totalNewVsReturning =
    data?.newVsReturning?.reduce((s, r) => s + r.sessions, 0) || 1;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* App Users section — always visible, no GA4 dependency */}
      {appUsers ? (
        <AppUsersSection data={appUsers} />
      ) : (
        <div className="space-y-5">
          <div className="h-6 w-48 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-white/[0.03] rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-52 bg-white/[0.03] rounded-2xl animate-pulse" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe size={22} className="text-primary" /> Website Analytics
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Live traffic data from Google Analytics
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {liveUsers !== null && (
            <div className="flex items-center gap-2 bg-[#05201A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/30 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-[11px] font-bold text-white tabular-nums">
                {liveUsers}
              </span>
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                online now
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-[#05201A] border border-white/[0.08] rounded-xl p-1 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                className={`px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                  days === p.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-sm p-16 text-center">
          <Globe size={32} className="text-white/25 mx-auto mb-4" />
          <p className="text-sm font-bold text-white">
            Google Analytics isn't connected yet
          </p>
          <p className="text-xs text-white/40 mt-2 max-w-md mx-auto">
            Add{" "}
            <code className="bg-white/10 text-white/80 px-1.5 py-0.5 rounded">
              GA4_PROPERTY_ID
            </code>{" "}
            and{" "}
            <code className="bg-white/10 text-white/80 px-1.5 py-0.5 rounded">
              GA4_SERVICE_ACCOUNT_JSON
            </code>{" "}
            to the server's environment variables, then restart the server.
          </p>
        </div>
      ) : !data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white/[0.03] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              icon={Users}
              label="Visitors"
              value={data.totals.activeUsers.toLocaleString("en-GB")}
              accent="bg-emerald-500/15 text-emerald-400"
            />
            <KpiCard
              icon={ArrowUpRight}
              label="New Users"
              value={data.totals.newUsers.toLocaleString("en-GB")}
              accent="bg-blue-500/15 text-blue-400"
            />
            <KpiCard
              icon={MousePointerClick}
              label="Sessions"
              value={data.totals.sessions.toLocaleString("en-GB")}
              accent="bg-violet-500/15 text-violet-400"
            />
            <KpiCard
              icon={FileText}
              label="Page Views"
              value={data.totals.pageViews.toLocaleString("en-GB")}
              accent="bg-amber-500/15 text-amber-400"
            />
            <KpiCard
              icon={Clock}
              label="Avg. Session"
              value={formatDuration(data.totals.avgSessionDurationSec)}
              accent="bg-cyan-500/15 text-cyan-400"
            />
            <KpiCard
              icon={TrendingDown}
              label="Bounce Rate"
              value={`${data.totals.bounceRate.toFixed(1)}%`}
              accent="bg-rose-500/15 text-rose-400"
            />
          </div>

          {/* Trend chart */}
          <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-bold text-white mb-1">Visitor Trend</h3>
            <p className="text-[11px] text-white/40 mb-5">
              Daily active users over the last {days} days
            </p>
            {trendPoints.length === 0 ? (
              <p className="text-xs text-white/40 py-12 text-center">
                No data yet
              </p>
            ) : (
              <div className="space-y-2">
                <div className="relative" style={{ height: "220px" }}>
                  {[0, 25, 50, 75].map((g) => (
                    <div
                      key={g}
                      className="absolute left-0 right-0 border-t border-dashed border-white/[0.06]"
                      style={{ bottom: `${g}%` }}
                    />
                  ))}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="visitorFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#036847"
                          stopOpacity="0.16"
                        />
                        <stop
                          offset="100%"
                          stopColor="#036847"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`0,100 ${trendLinePoints} 100,100`}
                      fill="url(#visitorFill)"
                    />
                    <polyline
                      points={trendLinePoints}
                      fill="none"
                      stroke="#036847"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex">
                    {trendPoints.map((p, i) => (
                      <div
                        key={i}
                        className="flex-1 h-full relative cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {hoveredPoint === i && (
                          <div
                            className="absolute -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-semibold rounded-xl px-2.5 py-1.5 whitespace-nowrap z-20 pointer-events-none shadow-xl tabular-nums"
                            style={{
                              left: "50%",
                              bottom: `${Math.min(p.heightPct + 10, 88)}%`,
                            }}
                          >
                            {p.activeUsers.toLocaleString("en-GB")} visitors
                            <br />
                            <span className="text-white/40">
                              {p.sessions.toLocaleString("en-GB")} sessions ·{" "}
                              {formatGaDate(p.date)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`absolute rounded-full border-2 border-white shadow transition-all ${hoveredPoint === i ? "bg-primary w-3 h-3" : "bg-primary/50 w-1.5 h-1.5"}`}
                          style={{
                            left: "50%",
                            bottom: `${p.heightPct}%`,
                            transform: "translate(-50%, 50%)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  {trendPoints.map((p, i) => (
                    <div key={i} className="flex-1 text-center">
                      {i % trendLabelStep === 0 && (
                        <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">
                          {formatGaDate(p.date)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Breakdowns */}
          <div className="grid lg:grid-cols-3 gap-6">
            <BreakdownList
              title="Top Pages"
              items={data.topPages}
              valueKey="views"
              total={totalPageViews}
              renderLabel={(p) => p.path}
            />
            <BreakdownList
              title="Traffic Sources"
              items={data.topSources}
              valueKey="sessions"
              total={totalSourceSessions}
              renderLabel={(s) => s.sourceMedium}
            />
            <BreakdownList
              title="Devices"
              items={data.devices}
              valueKey="sessions"
              total={totalDeviceSessions}
              renderLabel={(d) => {
                const Icon = deviceIcon(d.category);
                return (
                  <span className="flex items-center gap-1.5 capitalize">
                    <Icon size={12} className="text-white/40" /> {d.category}
                  </span>
                );
              }}
            />
          </div>

          {/* More breakdowns */}
          <div className="grid lg:grid-cols-3 gap-6">
            <BreakdownList
              title="Landing Pages"
              items={data.landingPages}
              valueKey="sessions"
              total={totalLandingSessions}
              renderLabel={(p) => p.path}
            />
            <BreakdownList
              title="Top Cities"
              items={data.topCities}
              valueKey="sessions"
              total={totalCitySessions}
              renderLabel={(c) => c.city}
            />
            <BreakdownList
              title="Browsers"
              items={data.browsers}
              valueKey="sessions"
              total={totalBrowserSessions}
              renderLabel={(b) => b.browser}
            />
          </div>

          {/* New vs Returning */}
          {data.newVsReturning.length > 0 && (
            <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-sm p-5 sm:p-6">
              <h3 className="text-sm font-bold text-white mb-4">
                New vs Returning Visitors
              </h3>
              <div className="flex h-3 rounded-full overflow-hidden bg-[#05201A] mb-3">
                {data.newVsReturning.map((r, i) => (
                  <div
                    key={i}
                    className={i === 0 ? "bg-primary" : "bg-secondary"}
                    style={{
                      width: `${(r.sessions / totalNewVsReturning) * 100}%`,
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-6">
                {data.newVsReturning.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${i === 0 ? "bg-primary" : "bg-secondary"}`}
                    />
                    <span className="text-xs font-semibold text-white/80 capitalize">
                      {r.type === "new" ? "New" : "Returning"}
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums">
                      {((r.sessions / totalNewVsReturning) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
