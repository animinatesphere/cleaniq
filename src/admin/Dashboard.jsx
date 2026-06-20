import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Search,
  RefreshCw,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  X,
  Download,
  FileText,
  CheckCircle2,
  Megaphone,
} from "lucide-react";

const DASHBOARD_EXPORT_HEADERS = [
  "Booking ID",
  "Customer",
  "Email",
  "Phone",
  "Service",
  "Date",
  "Status",
  "Amount",
  "Currency",
  "Lead Source",
  "Supplies Provided By",
];

const dashboardExportRows = (bookings) =>
  bookings
    .filter((b) => b.status !== "Blackout")
    .map((b) => [
      b.bookingId,
      `${b.customer?.firstName || ""} ${b.customer?.lastName || ""}`.trim(),
      b.customer?.email,
      b.customer?.phone,
      b.service,
      b.schedule?.date ? new Date(b.schedule.date).toLocaleDateString() : "",
      b.status,
      b.payment?.amount,
      b.payment?.currency,
      b.leadSource || "Organic",
      b.suppliesProvidedBy || "",
    ]);

// Customer initials, used for avatar chips.
const initials = (b) => {
  const f = b?.customer?.firstName?.[0] || "";
  const l = b?.customer?.lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
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

// ── Revenue Detail Modal ─────────────────────────────────────────────────────
const RevenueDetailModal = ({ segment, onClose, onViewBooking }) => {
  const { title, bookings, total } = segment;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-7 py-5 flex justify-between items-center rounded-t-[28px] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              <p className="text-[11px] font-semibold text-slate-400 tabular-nums">
                £
                {total.toLocaleString("en-GB", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                · {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>
        <div className="p-3">
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium text-center py-12">
              No bookings in this segment.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((b, i) => (
                <button
                  key={i}
                  onClick={() => onViewBooking(b)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-slate-500">
                      {initials(b)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {b.customer?.firstName} {b.customer?.lastName}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 truncate">
                      {b.service} ·{" "}
                      {b.schedule?.date
                        ? new Date(b.schedule.date).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short" },
                          )
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900 tabular-nums">
                      £
                      {Number(b.payment?.amount || 0).toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <StatusBadge status={b.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TREND_RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

// ── Metric strip item ────────────────────────────────────────────────────────
const Metric = ({ label, value, onClick }) => (
  <button
    onClick={onClick}
    className="text-left px-4 sm:px-6 py-4 sm:py-5 hover:bg-slate-50 transition-colors border-b border-r border-slate-100"
  >
    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mb-1 sm:mb-1.5 truncate">
      {label}
    </p>
    <p className="text-base sm:text-xl font-bold text-slate-900 tabular-nums truncate">
      {value}
    </p>
  </button>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [trendRange, setTrendRange] = useState(30);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [detailSegment, setDetailSegment] = useState(null);
  const [quoteStats, setQuoteStats] = useState(null);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [leadStats, setLeadStats] = useState(null);
  const [search, setSearch] = useState("");

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

  const exportDashboardCSV = () => {
    const rows = dashboardExportRows(bookings);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        DASHBOARD_EXPORT_HEADERS.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Cleaniq_Dashboard_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDashboardExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = dashboardExportRows(bookings);
    const worksheet = XLSX.utils.aoa_to_sheet([
      DASHBOARD_EXPORT_HEADERS,
      ...rows,
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings & Leads");
    XLSX.writeFile(
      workbook,
      `Cleaniq_Dashboard_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`,
    );
  };

  useEffect(() => {
    fetchData();
    fetch(`${import.meta.env.VITE_API_URL}/quotes/stats`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setQuoteStats(res.data);
      })
      .catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/quotes?limit=5`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setRecentQuotes(res.data);
      })
      .catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/reviews`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/contact/leads/stats`)
      .then((r) => r.json())
      .then((data) => setLeadStats(data))
      .catch(() => {});
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

  // Revenue trend chart: buckets by day/week/month depending on the
  // selected range, plus a comparison vs. the prior period.
  const buildTrendSeries = (days) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let bucketUnit, bucketCount;
    if (days <= 30) {
      bucketUnit = "day";
      bucketCount = days;
    } else if (days === 90) {
      bucketUnit = "week";
      bucketCount = 13;
    } else {
      bucketUnit = "month";
      bucketCount = 12;
    }

    const ranges = Array.from({ length: bucketCount }, (_, idx) => {
      const i = bucketCount - 1 - idx;
      let start, end, label;
      if (bucketUnit === "day") {
        end = new Date(now);
        end.setDate(end.getDate() - i);
        end.setHours(23, 59, 59, 999);
        start = new Date(end);
        start.setHours(0, 0, 0, 0);
        label = start.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
      } else if (bucketUnit === "week") {
        end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);
        start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        label = start.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
      } else {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        start = monthDate;
        end = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        label = start.toLocaleDateString("en-GB", { month: "short" });
      }
      return { start, end, label };
    });

    const series = ranges.map(({ start, end, label }) => {
      const inBucket = bookings.filter((b) => {
        const d = new Date(b.createdAt || b.schedule?.date);
        return d >= start && d <= end;
      });
      return { label, revenue: rev(inBucket), count: inBucket.length };
    });

    return {
      series,
      rangeStart: ranges[0].start,
      rangeEnd: ranges[ranges.length - 1].end,
    };
  };

  const {
    series: trendSeries,
    rangeStart,
    rangeEnd,
  } = buildTrendSeries(trendRange);
  const rangeRevenue = trendSeries.reduce((s, m) => s + m.revenue, 0);
  const periodMs = rangeEnd.getTime() - rangeStart.getTime();
  const prevPeriodStart = new Date(rangeStart.getTime() - periodMs - 1);
  const prevPeriodEnd = new Date(rangeStart.getTime() - 1);
  const prevRangeRevenue = rev(
    bookings.filter((b) => {
      const d = new Date(b.createdAt || b.schedule?.date);
      return d >= prevPeriodStart && d <= prevPeriodEnd;
    }),
  );
  const rangeChangePct =
    prevRangeRevenue > 0
      ? ((rangeRevenue - prevRangeRevenue) / prevRangeRevenue) * 100
      : null;

  const maxTrendRev = Math.max(...trendSeries.map((m) => m.revenue), 1);
  const trendPoints = trendSeries.map((m, i) => {
    const heightPct = maxTrendRev > 0 ? (m.revenue / maxTrendRev) * 78 : 0;
    const x =
      trendSeries.length > 1 ? (i / (trendSeries.length - 1)) * 100 : 50;
    return { ...m, x, heightPct, y: 92 - heightPct };
  });
  const trendLinePoints = trendPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const trendLabelStep = Math.max(1, Math.ceil(trendSeries.length / 7));

  // Revenue split donut (Completed / Pending / Cancelled)
  const donutSegments = [
    { label: "Completed", value: completedRevenue, color: "#005B41" },
    { label: "Pending", value: pendingRevenue, color: "#3CC7FF" },
    { label: "Cancelled", value: cancelledRevenue, color: "#E2E8F0" },
  ];
  const donutTotal = donutSegments.reduce((s, d) => s + d.value, 0) || 1;
  let donutCumulative = 0;
  const donutArcs = donutSegments.map((seg) => {
    const pct = (seg.value / donutTotal) * 100;
    const dashoffset = 100 - donutCumulative;
    donutCumulative += pct;
    return { ...seg, pct, dashoffset };
  });

  // Bookings overview: completed vs cancelled revenue, last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleString("en-GB", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });
  const monthlyPaired = months.map(({ label, year, month }) => {
    const inMonth = bookings.filter((b) => {
      const d = new Date(b.createdAt || b.schedule?.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      label,
      completed: rev(inMonth.filter((b) => b.status === "Completed")),
      cancelled: rev(inMonth.filter((b) => b.status === "Cancelled")),
    };
  });
  const maxPairedRev = Math.max(
    ...monthlyPaired.flatMap((m) => [m.completed, m.cancelled]),
    1,
  );

  // Top services — by revenue (sidebar bar list)
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

  // Top requested services — by booking count share
  const topRequested = Object.entries(serviceMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Top customers by total spend
  const customerMap = {};
  bookings.forEach((b) => {
    const key =
      b.customer?.email || `${b.customer?.firstName}${b.customer?.lastName}`;
    if (!key) return;
    if (!customerMap[key])
      customerMap[key] = {
        firstName: b.customer?.firstName,
        lastName: b.customer?.lastName,
        count: 0,
        total: 0,
      };
    customerMap[key].count++;
    customerMap[key].total += Number(b.payment?.amount || 0);
  });
  const topCustomers = Object.values(customerMap)
    .filter((c) =>
      search
        ? `${c.firstName} ${c.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true,
    )
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Leads by source
  const leadSourceMap = {};
  bookings
    .filter((b) => b.status !== "Blackout")
    .forEach((b) => {
      const src = b.leadSource || "Organic";
      if (!leadSourceMap[src]) leadSourceMap[src] = { count: 0, revenue: 0 };
      leadSourceMap[src].count++;
      leadSourceMap[src].revenue += Number(b.payment?.amount || 0);
    });
  const leadSourceBreakdown = Object.entries(leadSourceMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);
  const maxLeadCount = leadSourceBreakdown[0]?.[1].count || 1;

  // Ratings summary
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length
      : 0;
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    return {
      star,
      count,
      pct: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Overview
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {loading
              ? "Fetching data…"
              : `${bookings.length} total bookings · Last updated ${lastRefresh ? lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full sm:w-auto">
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="bg-transparent border-none outline-none text-sm font-medium w-full sm:w-40 text-slate-700"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
            {TREND_RANGES.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setTrendRange(opt.days)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex-shrink-0 ${trendRange === opt.days ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportDashboardCSV}
            disabled={loading || bookings.length === 0}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 flex-shrink-0"
          >
            <Download size={15} /> <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={exportDashboardExcel}
            disabled={loading || bookings.length === 0}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 flex-shrink-0"
          >
            <Download size={15} />{" "}
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Metric
          label="Total Bookings"
          value={bookings.length.toLocaleString("en-GB")}
          onClick={() =>
            setDetailSegment({
              title: "Total Bookings",
              bookings,
              total: totalRevenue,
            })
          }
        />
        <Metric
          label="Completed"
          value={completed.length.toLocaleString("en-GB")}
          onClick={() =>
            setDetailSegment({
              title: "Completed Bookings",
              bookings: completed,
              total: completedRevenue,
            })
          }
        />
        <Metric
          label="Pending"
          value={pending.length.toLocaleString("en-GB")}
          onClick={() =>
            setDetailSegment({
              title: "Pending Bookings",
              bookings: pending,
              total: pendingRevenue,
            })
          }
        />
        <Metric
          label="Cancelled"
          value={cancelled.length.toLocaleString("en-GB")}
          onClick={() =>
            setDetailSegment({
              title: "Cancelled Bookings",
              bookings: cancelled,
              total: cancelledRevenue,
            })
          }
        />
        <Metric
          label="Total Revenue"
          value={`£${totalRevenue.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`}
          onClick={() =>
            setDetailSegment({
              title: "Total Revenue",
              bookings,
              total: totalRevenue,
            })
          }
        />
        <Metric
          label="Quotes Sent"
          value={quoteStats ? quoteStats.total : loading ? "—" : 0}
          onClick={() => navigate("/admin/quotes")}
        />
      </div>

      {/* Row 1: Trend chart + Donut */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-wrap justify-between items-start gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Revenue Trend
              </h3>
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <span className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
                  £
                  {rangeRevenue.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                {rangeChangePct !== null ? (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums ${rangeChangePct >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {rangeChangePct >= 0 ? (
                      <ArrowUpRight size={12} />
                    ) : (
                      <ArrowDownRight size={12} />
                    )}
                    {rangeChangePct >= 0 ? "+" : ""}
                    {rangeChangePct.toFixed(1)}% vs prior period
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">
                    No prior period data yet
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {loading ? (
              <div className="h-52 bg-slate-50 rounded-2xl animate-pulse" />
            ) : (
              <div className="space-y-2">
                <div className="relative" style={{ height: "200px" }}>
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
                        id="trendFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#005B41"
                          stopOpacity="0.16"
                        />
                        <stop
                          offset="100%"
                          stopColor="#005B41"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`0,100 ${trendLinePoints} 100,100`}
                      fill="url(#trendFill)"
                    />
                    <polyline
                      points={trendLinePoints}
                      fill="none"
                      stroke="#005B41"
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
                            £
                            {p.revenue.toLocaleString("en-GB", {
                              minimumFractionDigits: 2,
                            })}
                            <br />
                            <span className="text-slate-400">
                              {p.count} booking{p.count !== 1 ? "s" : ""} ·{" "}
                              {p.label}
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
                          {p.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Split donut */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
          <h3 className="text-base font-bold text-slate-800">Revenue Split</h3>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5 mb-6">
            Total bookings: {bookings.length.toLocaleString("en-GB")}
          </p>
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg viewBox="0 0 42 42" className="w-full h-full -rotate-0">
              <circle
                cx="21"
                cy="21"
                r="15.91549"
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth="5"
              />
              {donutArcs.map((seg, i) => (
                <circle
                  key={i}
                  cx="21"
                  cy="21"
                  r="15.91549"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="5"
                  strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                  strokeDashoffset={seg.dashoffset}
                  transform="rotate(-90 21 21)"
                  strokeLinecap={seg.pct < 100 ? "butt" : "round"}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-bold text-slate-900 tabular-nums">
                £{(totalRevenue / 1000).toFixed(1)}k
              </p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Total
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {donutArcs.map((seg, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-[12px] font-semibold text-slate-600">
                    {seg.label}
                  </span>
                </div>
                <span className="text-[12px] font-bold text-slate-900 tabular-nums">
                  {seg.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Paired bar chart + Top Services */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Bookings Overview
              </h3>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Completed vs. cancelled revenue, last 6 months
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" /> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary" /> Cancelled
              </span>
            </div>
          </div>
          <div
            className="flex items-end gap-1.5 sm:gap-4"
            style={{ height: "180px" }}
          >
            {monthlyPaired.map((m, i) => (
              <div
                key={i}
                className="flex-1 h-full flex items-end justify-center gap-1 sm:gap-1.5 group"
              >
                <div
                  className="w-3 sm:w-4 rounded-t-md bg-primary group-hover:bg-primary/80 transition-colors"
                  style={{
                    height: `${Math.max((m.completed / maxPairedRev) * 100, 2)}%`,
                  }}
                  title={`Completed: £${m.completed.toFixed(2)}`}
                />
                <div
                  className="w-3 sm:w-4 rounded-t-md bg-secondary group-hover:bg-secondary/80 transition-colors"
                  style={{
                    height: `${Math.max((m.cancelled / maxPairedRev) * 100, 2)}%`,
                  }}
                  title={`Cancelled: £${m.cancelled.toFixed(2)}`}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            {monthlyPaired.map((m, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services horizontal bars */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
          <h3 className="text-base font-bold text-slate-800">Top Services</h3>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5 mb-5">
            By revenue earned
          </p>
          <div className="space-y-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 bg-slate-100 rounded-xl animate-pulse"
                />
              ))
            ) : topServices.length === 0 ? (
              <p className="text-slate-400 text-sm font-semibold text-center py-4">
                No data yet
              </p>
            ) : (
              topServices.map(([name, stats], i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-semibold text-slate-600 truncate mr-2 flex-1 min-w-0">
                      {name}
                    </span>
                    <span className="text-[12px] font-bold text-slate-900 tabular-nums flex-shrink-0">
                      £
                      {stats.revenue.toLocaleString("en-GB", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{
                        width: `${(stats.revenue / maxServiceRev) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top Customers / Top Requested / Ratings */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 pb-3 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800">
              Top Customers
            </h3>
            <button
              onClick={() => navigate("/admin/customers")}
              className="text-[11px] font-bold text-primary hover:text-primary-dark transition-colors"
            >
              View All
            </button>
          </div>
          <div className="px-3 pb-3">
            {topCustomers.length === 0 ? (
              <p className="text-slate-400 text-sm font-semibold text-center py-8">
                No customers yet
              </p>
            ) : (
              topCustomers.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {(
                        (c.firstName?.[0] || "") + (c.lastName?.[0] || "")
                      ).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {c.count} booking{c.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900 tabular-nums">
                      £
                      {c.total.toLocaleString("en-GB", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-slate-300 flex-shrink-0"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
          <h3 className="text-base font-bold text-slate-800 mb-5">
            Top Requested Services
          </h3>
          <div className="space-y-4">
            {topRequested.length === 0 ? (
              <p className="text-slate-400 text-sm font-semibold text-center py-8">
                No data yet
              </p>
            ) : (
              topRequested.map(([name, stats], i) => {
                const sharePct =
                  bookings.length > 0
                    ? (stats.count / bookings.length) * 100
                    : 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-[12px] font-semibold text-slate-600 truncate flex-1 min-w-0">
                      {name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0 w-24 sm:w-28">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full"
                          style={{ width: `${sharePct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 tabular-nums w-9 text-right">
                        {sharePct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-slate-800">Ratings</h3>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span className="text-[12px] font-bold text-amber-700 tabular-nums">
                {avgRating.toFixed(1)}
              </span>
            </div>
          </div>
          {reviews.length === 0 ? (
            <p className="text-slate-400 text-sm font-semibold text-center py-8">
              No reviews yet
            </p>
          ) : (
            <>
              <p className="text-[11px] font-medium text-slate-400 mb-4">
                {reviews.length.toLocaleString("en-GB")} total reviews
              </p>
              <div className="space-y-2.5">
                {ratingBreakdown.map((r) => (
                  <div key={r.star} className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 w-10 flex-shrink-0">
                      {r.star}-star
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums w-8 text-right">
                      {r.pct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 4: Quote Conversion / Recent Quotes / Leads by Source */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1">
            <FileText size={16} className="text-primary" /> Quote Conversion
          </h3>
          <p className="text-[11px] font-medium text-slate-400 mb-5">
            Accept vs. decline rate, all-time
          </p>
          {!quoteStats || !quoteStats.total ? (
            <p className="text-slate-400 text-sm font-semibold text-center py-8">
              No quotes sent yet
            </p>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-5">
                <span className="text-3xl font-bold text-slate-900 tabular-nums">
                  {(quoteStats.acceptanceRate || 0).toFixed(0)}%
                </span>
                <span className="text-[11px] font-medium text-slate-400 mb-1.5">
                  acceptance rate
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex mb-5">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${((quoteStats.accepted || 0) / quoteStats.total) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-rose-400"
                  style={{
                    width: `${((quoteStats.declined || 0) / quoteStats.total) * 100}%`,
                  }}
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 font-semibold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                    Accepted
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {quoteStats.accepted || 0} · £
                    {(quoteStats.acceptedValue || 0).toLocaleString("en-GB", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 font-semibold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />{" "}
                    Declined
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {quoteStats.declined || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 font-semibold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />{" "}
                    Awaiting response
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {quoteStats.pending ?? quoteStats.total}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 pb-3 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-primary" /> Recent Quotes
            </h3>
            <button
              onClick={() => navigate("/admin/quotes/history")}
              className="text-[11px] font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              History <ChevronRight size={12} />
            </button>
          </div>
          <div className="px-3 pb-3">
            {recentQuotes.length === 0 ? (
              <p className="text-slate-400 text-sm font-semibold text-center py-8">
                No quotes sent yet
              </p>
            ) : (
              recentQuotes.map((q) => {
                const isAccepted = q.status === "accepted";
                const isDeclined = q.status === "declined";
                return (
                  <button
                    key={q.quoteRef}
                    onClick={() => navigate("/admin/quotes")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isAccepted ? "bg-emerald-100" : isDeclined ? "bg-rose-100" : "bg-slate-100"}`}
                    >
                      {isDeclined ? (
                        <X size={16} className="text-rose-600" />
                      ) : (
                        <CheckCircle2
                          size={16}
                          className={
                            isAccepted ? "text-emerald-600" : "text-slate-400"
                          }
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {q.companyName}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400">
                        {q.quoteRef} · £{Number(q.grandTotal || 0).toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex-shrink-0 ${isAccepted ? "text-emerald-700 bg-emerald-50" : isDeclined ? "text-rose-700 bg-rose-50" : "text-slate-500 bg-slate-100"}`}
                    >
                      {isAccepted
                        ? "Accepted"
                        : isDeclined
                          ? "Declined"
                          : "Sent"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Megaphone size={16} className="text-primary" /> Leads
            </h3>
            <button
              onClick={() => navigate("/admin/leads")}
              className="text-[11px] font-bold text-primary hover:text-primary-dark transition-colors"
            >
              View All
            </button>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mb-4">
            Contact Us enquiries captured as leads
          </p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-slate-900 tabular-nums">
                {leadStats?.total ?? "—"}
              </p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                Total
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-slate-900 tabular-nums">
                {leadStats?.thisWeek ?? "—"}
              </p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                This Week
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-slate-900 tabular-nums">
                {leadStats?.thisMonth ?? "—"}
              </p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                This Month
              </p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">
            Booking Sources
          </p>
          {leadSourceBreakdown.length === 0 ? (
            <p className="text-slate-400 text-sm font-semibold text-center py-8">
              No leads yet
            </p>
          ) : (
            <div className="space-y-3">
              {leadSourceBreakdown.map(([source, stats]) => (
                <div
                  key={source}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-[12px] font-semibold text-slate-600 w-24 flex-shrink-0 truncate">
                    {source}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(stats.count / maxLeadCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 tabular-nums w-8 text-right">
                    {stats.count}
                  </span>
                  <span className="hidden sm:inline text-[10px] font-semibold text-slate-400 tabular-nums w-16 text-right flex-shrink-0">
                    £
                    {stats.revenue.toLocaleString("en-GB", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detailSegment && (
        <RevenueDetailModal
          segment={detailSegment}
          onClose={() => setDetailSegment(null)}
          onViewBooking={(b) => navigate(`/admin/bookings?id=${b._id}`)}
        />
      )}
    </div>
  );
};

export default Dashboard;
