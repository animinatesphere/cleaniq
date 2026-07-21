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
    <p className="text-[11px] font-semibold text-slate-300 mt-1">{label}</p>
  </div>
);

const BreakdownList = ({ title, items, renderLabel, valueKey, total }) => (
  <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-sm p-5 sm:p-6">
    <h3 className="text-sm font-bold text-white mb-4">{title}</h3>
    {items.length === 0 ? (
      <p className="text-xs text-slate-400 py-6 text-center">No data yet</p>
    ) : (
      <div className="space-y-3">
        {items.map((item, i) => {
          const pct = total > 0 ? (item[valueKey] / total) * 100 : 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-xs font-semibold text-slate-300 truncate flex-1 min-w-0">
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

const Analytics = () => {
  const [days, setDays] = useState(28);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [liveUsers, setLiveUsers] = useState(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe size={22} className="text-primary" /> Website Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
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
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    : "text-slate-400 hover:text-slate-100"
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
          <Globe size={32} className="text-slate-200 mx-auto mb-4" />
          <p className="text-sm font-bold text-white">
            Google Analytics isn't connected yet
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Add{" "}
            <code className="bg-slate-800 text-slate-100 px-1.5 py-0.5 rounded">
              GA4_PROPERTY_ID
            </code>{" "}
            and{" "}
            <code className="bg-slate-800 text-slate-100 px-1.5 py-0.5 rounded">
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
              className="h-28 bg-slate-50 rounded-2xl animate-pulse"
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
              accent="bg-emerald-50 text-emerald-600"
            />
            <KpiCard
              icon={ArrowUpRight}
              label="New Users"
              value={data.totals.newUsers.toLocaleString("en-GB")}
              accent="bg-blue-50 text-blue-600"
            />
            <KpiCard
              icon={MousePointerClick}
              label="Sessions"
              value={data.totals.sessions.toLocaleString("en-GB")}
              accent="bg-violet-50 text-violet-600"
            />
            <KpiCard
              icon={FileText}
              label="Page Views"
              value={data.totals.pageViews.toLocaleString("en-GB")}
              accent="bg-amber-50 text-amber-600"
            />
            <KpiCard
              icon={Clock}
              label="Avg. Session"
              value={formatDuration(data.totals.avgSessionDurationSec)}
              accent="bg-cyan-50 text-cyan-600"
            />
            <KpiCard
              icon={TrendingDown}
              label="Bounce Rate"
              value={`${data.totals.bounceRate.toFixed(1)}%`}
              accent="bg-rose-50 text-rose-600"
            />
          </div>

          {/* Trend chart */}
          <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-bold text-white mb-1">Visitor Trend</h3>
            <p className="text-[11px] text-slate-400 mb-5">
              Daily active users over the last {days} days
            </p>
            {trendPoints.length === 0 ? (
              <p className="text-xs text-slate-300 py-12 text-center">
                No data yet
              </p>
            ) : (
              <div className="space-y-2">
                <div className="relative" style={{ height: "220px" }}>
                  {[0, 25, 50, 75].map((g) => (
                    <div
                      key={g}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-100"
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
                            <span className="text-slate-400">
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
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    <Icon size={12} className="text-slate-400" /> {d.category}
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
                    <span className="text-xs font-semibold text-slate-300 capitalize">
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
