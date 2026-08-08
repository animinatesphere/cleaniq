import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  RefreshCw,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  X,
  Download,
  CheckCircle2,
  TrendingUp,
  Plus,
  CalendarCheck,
  Wallet,
  Briefcase,
  Percent,
  Users,
  MapPin,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

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

const initials = (b) => {
  const f = b?.customer?.firstName?.[0] || "";
  const l = b?.customer?.lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
};

const gbp = (n, dp = 0) =>
  `£${Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

// ── Design tokens ──────────────────────────────────────────────────────────────
const card =
  "relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(11,45,34,0.96),rgba(5,32,26,0.96))] shadow-[0_18px_55px_rgba(0,0,0,0.24)]";
const eyebrow =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30";
const cardTitle = "text-[15px] font-semibold text-white tracking-tight";
const muted = "text-white/40";
const dimmed = "text-white/25";

// ── Card header ────────────────────────────────────────────────────────────────
const CardHead = ({ kicker, title, sub, action, onAction }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      {kicker && <p className={`${eyebrow} mb-1`}>{kicker}</p>}
      <h3 className={cardTitle}>{title}</h3>
      {sub && <p className={`text-xs ${muted} mt-0.5`}>{sub}</p>}
    </div>
    {action && (
      <button
        onClick={onAction}
        className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        {action} <ChevronRight size={13} />
      </button>
    )}
  </div>
);

// ── Status badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Completed: {
      dot: "bg-emerald-400",
      text: "text-emerald-300",
      bg: "bg-emerald-400/10",
    },
    Confirmed: {
      dot: "bg-blue-400",
      text: "text-blue-300",
      bg: "bg-blue-400/10",
    },
    Pending: {
      dot: "bg-amber-400",
      text: "text-amber-300",
      bg: "bg-amber-400/10",
    },
    Cancelled: {
      dot: "bg-rose-400",
      text: "text-rose-300",
      bg: "bg-rose-400/10",
    },
    "In Progress": {
      dot: "bg-violet-400",
      text: "text-violet-300",
      bg: "bg-violet-400/10",
    },
    Accepted: {
      dot: "bg-indigo-400",
      text: "text-indigo-300",
      bg: "bg-indigo-400/10",
    },
  };
  const s = map[status] || {
    dot: "bg-white/30",
    text: "text-white/45",
    bg: "bg-white/[0.05]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-[3px] rounded-md ${s.bg} ${s.text}`}
    >
      <span className={`w-1 h-1 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

// ── Detail modal ───────────────────────────────────────────────────────────────
const DetailModal = ({ segment, onClose, onViewBooking }) => {
  const { title, bookings, total } = segment;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0B2D22] border-b border-white/[0.06] px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
              <Receipt size={16} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <p className={`text-xs ${muted} tabular-nums`}>
                {gbp(total, 2)} · {bookings.length} booking
                {bookings.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-white/50" />
          </button>
        </div>
        <div className="p-2">
          {bookings.length === 0 ? (
            <p className={`text-sm ${muted} text-center py-12`}>
              No bookings in this segment.
            </p>
          ) : (
            bookings.map((b, i) => (
              <button
                key={i}
                onClick={() => onViewBooking(b)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] rounded-xl transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-white/50">
                    {initials(b)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/85 truncate">
                    {b.customer?.firstName} {b.customer?.lastName}
                  </p>
                  <p className={`text-xs ${muted} truncate`}>
                    {b.service} ·{" "}
                    {b.schedule?.date
                      ? new Date(b.schedule.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-semibold text-white/85 tabular-nums">
                    {gbp(b.payment?.amount, 2)}
                  </p>
                  <StatusBadge status={b.status} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ── Net revenue modal ──────────────────────────────────────────────────────────
const NetRevenueModal = ({
  completed,
  expenses,
  netRevenue,
  onClose,
  onViewBooking,
}) => {
  const [tab, setTab] = useState("income");
  const totalIncome = completed.reduce(
    (s, b) => s + Number(b.payment?.amount || 0),
    0,
  );
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B2D22] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Net revenue breakdown
              </h2>
              <p
                className={`text-xs tabular-nums ${netRevenue >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {gbp(netRevenue, 2)} net
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-white/50" />
          </button>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/[0.05] border-b border-white/[0.06] text-center">
          {[
            {
              label: "Income",
              val: gbp(totalIncome),
              sub: `${completed.length} jobs`,
              color: "text-emerald-400",
            },
            {
              label: "Expenses",
              val: `−${gbp(totalExpenses)}`,
              sub: `${expenses.length} items`,
              color: "text-rose-400",
            },
            {
              label: "Net",
              val: gbp(netRevenue),
              sub:
                totalIncome > 0
                  ? `${((netRevenue / totalIncome) * 100).toFixed(0)}% margin`
                  : "",
              color: netRevenue >= 0 ? "text-white" : "text-rose-400",
            },
          ].map((c) => (
            <div key={c.label} className="py-4 px-3">
              <p className={`${eyebrow} mb-1`}>{c.label}</p>
              <p className={`text-base font-semibold tabular-nums ${c.color}`}>
                {c.val}
              </p>
              <p className={`text-[10px] ${dimmed}`}>{c.sub}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 px-5 pt-4">
          {[
            { id: "income", label: `Income · ${completed.length}` },
            { id: "expenses", label: `Expenses · ${expenses.length}` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-white/45 hover:bg-white/10"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {tab === "income" ? (
            completed.length === 0 ? (
              <p className={`text-sm ${muted} text-center py-12`}>
                No completed bookings yet.
              </p>
            ) : (
              completed.map((b, i) => (
                <button
                  key={i}
                  onClick={() => onViewBooking(b)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] rounded-xl transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-emerald-400">
                      {initials(b)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/85 truncate">
                      {b.customer?.firstName} {b.customer?.lastName}
                    </p>
                    <p className={`text-xs ${muted} truncate`}>
                      {b.service} ·{" "}
                      {b.schedule?.date
                        ? new Date(b.schedule.date).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-400 tabular-nums">
                      +{gbp(b.payment?.amount, 2)}
                    </p>
                    <p className={`text-[10px] ${dimmed}`}>{b.bookingId}</p>
                  </div>
                </button>
              ))
            )
          ) : expenses.length === 0 ? (
            <p className={`text-sm ${muted} text-center py-12`}>
              No expenses recorded.
            </p>
          ) : (
            expenses.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-rose-400/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-rose-400">
                    {(e.category || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/85 truncate">
                    {e.description || "Expense"}
                  </p>
                  <p className={`text-xs ${muted} truncate`}>
                    {e.category || "Uncategorised"} ·{" "}
                    {e.date
                      ? new Date(e.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-rose-400 tabular-nums shrink-0">
                  −{gbp(e.amount, 2)}
                </p>
              </div>
            ))
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

// ─────────────────────────────────────────────────────────────────────────────
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
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [expenseStats, setExpenseStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showNetDetail, setShowNetDetail] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selStart, setSelStart] = useState(null);
  const [selEnd, setSelEnd] = useState(null);
  const [workers, setWorkers] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`${API}/bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportCSV = () => {
    const rows = dashboardExportRows(bookings);
    const csv =
      "data:text/csv;charset=utf-8," +
      [
        DASHBOARD_EXPORT_HEADERS.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `CleanIQ_Dashboard_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = dashboardExportRows(bookings);
    const ws = XLSX.utils.aoa_to_sheet([DASHBOARD_EXPORT_HEADERS, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(
      wb,
      `CleanIQ_Dashboard_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`,
    );
  };

  useEffect(() => {
    fetchData();
    fetch(`${API}/quotes/stats`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setQuoteStats(res.data);
      })
      .catch(() => {});
    fetch(`${API}/quotes?limit=5`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setRecentQuotes(res.data);
      })
      .catch(() => {});
    fetch(`${API}/reviews`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch(`${API}/contact/leads/stats`)
      .then((r) => r.json())
      .then((data) => setLeadStats(data))
      .catch(() => {});
    fetch(`${API}/contact/leads`)
      .then((r) => r.json())
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch(`${API}/expenses/stats`)
      .then((r) => r.json())
      .then((data) => setExpenseStats(data))
      .catch(() => {});
    fetch(`${API}/expenses`)
      .then((r) => r.json())
      .then((data) => setExpenses(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch(`${API}/workers`)
      .then((r) => r.json())
      .then((data) => setWorkers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [fetchData]);

  // ── Computed values ──────────────────────────────────────────────────────────
  const completed = bookings.filter((b) => b.status === "Completed");
  const pending = bookings.filter((b) =>
    ["Pending", "Confirmed", "Accepted", "In Progress"].includes(b.status),
  );
  const cancelled = bookings.filter((b) => b.status === "Cancelled");
  const newPending = bookings.filter((b) => b.status === "Pending");
  const confirmed = bookings.filter((b) => b.status === "Confirmed");
  const inProgress = bookings.filter((b) => b.status === "In Progress");
  const accepted = bookings.filter((b) => b.status === "Accepted");

  const rev = (arr) =>
    arr.reduce((s, b) => s + Number(b.payment?.amount || 0), 0);
  const completedRevenue = rev(completed);
  const pendingRevenue = rev(pending);
  const cancelledRevenue = rev(cancelled);
  const totalExpenses = expenseStats?.allTime || 0;
  const netRevenue = completedRevenue - totalExpenses;

  // ── Trend chart ──────────────────────────────────────────────────────────────
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
        const md = new Date(now.getFullYear(), now.getMonth() - i, 1);
        start = md;
        end = new Date(md.getFullYear(), md.getMonth() + 1, 0, 23, 59, 59, 999);
        label = start.toLocaleDateString("en-GB", { month: "short" });
      }
      return { start, end, label };
    });
    const series = ranges.map(({ start, end, label }) => {
      const inBucket = bookings.filter((b) => {
        const d = new Date(b.createdAt || b.schedule?.date);
        return d >= start && d <= end && b.status === "Completed";
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
  const prevStart = new Date(rangeStart.getTime() - periodMs - 1);
  const prevEnd = new Date(rangeStart.getTime() - 1);
  const prevRevenue = rev(
    bookings.filter((b) => {
      const d = new Date(b.createdAt || b.schedule?.date);
      return d >= prevStart && d <= prevEnd && b.status === "Completed";
    }),
  );
  const changePct =
    prevRevenue > 0 ? ((rangeRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const maxTrendRev = Math.max(...trendSeries.map((m) => m.revenue), 1);
  const trendPoints = trendSeries.map((m, i) => {
    const heightPct = maxTrendRev > 0 ? (m.revenue / maxTrendRev) * 78 : 0;
    const x =
      trendSeries.length > 1 ? (i / (trendSeries.length - 1)) * 100 : 50;
    return { ...m, x, heightPct, y: 92 - heightPct };
  });
  const trendLine = trendPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const trendLabelStep = Math.max(1, Math.ceil(trendSeries.length / 7));

  // ── 6-month bars ─────────────────────────────────────────────────────────────
  const months6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleString("en-GB", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });
  const monthly = months6.map(({ label, year, month }) => {
    const inMonth = bookings.filter((b) => {
      const d = new Date(b.createdAt || b.schedule?.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      label,
      completed: rev(inMonth.filter((b) => b.status === "Completed")),
      cancelled: rev(inMonth.filter((b) => b.status === "Cancelled")),
      count: inMonth.length,
    };
  });
  const maxMonthRev = Math.max(
    ...monthly.flatMap((m) => [m.completed, m.cancelled]),
    1,
  );

  // ── Mini sparkline helper ────────────────────────────────────────────────────
  const mini7 = (filterFn) => {
    const vals = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const s = new Date(d.toDateString()),
        e = new Date(s.getTime() + 86399999);
      return bookings.filter((b) => {
        const t = new Date(b.createdAt || b.schedule?.date);
        return t >= s && t <= e && filterFn(b);
      }).length;
    });
    const mx = Math.max(...vals, 1);
    const pts = vals
      .map((v, i) => `${(i / 6) * 96 + 2},${28 - (v / mx) * 24}`)
      .join(" ");
    return { pts, area: `2,28 ${pts} 98,28` };
  };
  const sparkBooking = mini7((b) => b.status !== "Blackout");
  const sparkCompleted = mini7((b) => b.status === "Completed");

  // ── Revenue donut ────────────────────────────────────────────────────────────
  const donutSegs = [
    { label: "Completed", value: completedRevenue, color: "#10B981" },
    { label: "Expenses", value: totalExpenses, color: "#F43F5E" },
    { label: "Pending", value: pendingRevenue, color: "#3CC7FF" },
    { label: "Cancelled", value: cancelledRevenue, color: "#334155" },
  ];
  const donutTotal = donutSegs.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const donutArcs = donutSegs.map((seg) => {
    const pct = (seg.value / donutTotal) * 100;
    const dashoffset = 100 - cumulative;
    cumulative += pct;
    return { ...seg, pct, dashoffset };
  });

  // ── Top services ─────────────────────────────────────────────────────────────
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
  const topRequested = Object.entries(serviceMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);
  const maxServiceRev = topServices[0]?.[1].revenue || 1;

  // ── Top customers ────────────────────────────────────────────────────────────
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

  // ── Leads by source ──────────────────────────────────────────────────────────
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

  // ── Ratings ──────────────────────────────────────────────────────────────────
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

  // ── Calendar ─────────────────────────────────────────────────────────────────
  const calYear = calMonth.getFullYear();
  const calMonthIdx = calMonth.getMonth();
  const calCells = [];
  for (let i = 0; i < new Date(calYear, calMonthIdx, 1).getDay(); i++)
    calCells.push(null);
  for (let d = 1; d <= new Date(calYear, calMonthIdx + 1, 0).getDate(); d++)
    calCells.push(new Date(calYear, calMonthIdx, d));
  const dateKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const handleCalClick = (day) => {
    if (!selStart || (selStart && selEnd)) {
      setSelStart(day);
      setSelEnd(null);
    } else {
      if (day < selStart) {
        setSelEnd(selStart);
        setSelStart(day);
      } else setSelEnd(day);
    }
  };
  const inRange = (day) => {
    if (!selStart) return false;
    const end = selEnd || selStart;
    return (
      day >= new Date(selStart.toDateString()) &&
      day <= new Date(end.toDateString())
    );
  };
  const rangeStartTime = selStart
    ? new Date(selStart.toDateString()).getTime()
    : null;
  const rangeEndTime = selEnd
    ? new Date(new Date(selEnd.toDateString()).getTime() + 86399999)
    : selStart
      ? new Date(new Date(selStart.toDateString()).getTime() + 86399999)
      : null;
  const bookingsInRange =
    rangeStartTime != null
      ? bookings.filter((b) => {
          if (
            !b.schedule?.date ||
            b.status === "Blackout" ||
            b.customer?.firstName === "ADMIN_BLOCK"
          )
            return false;
          const t = new Date(b.schedule.date).getTime();
          return t >= rangeStartTime && t <= rangeEndTime.getTime();
        })
      : [];
  const selectedRangeRevenue = bookingsInRange
    .filter((b) => b.status === "Completed")
    .reduce((s, b) => s + Number(b.payment?.amount || 0), 0);
  const leadsInRange =
    rangeStartTime != null
      ? leads.filter((l) => {
          if (!l.createdAt) return false;
          const t = new Date(l.createdAt).getTime();
          return t >= rangeStartTime && t <= rangeEndTime.getTime();
        })
      : [];
  const conversionPct =
    leadsInRange.length > 0
      ? (bookingsInRange.length / leadsInRange.length) * 100
      : 0;

  // ── Day of week distribution ─────────────────────────────────────────────────
  const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dowCounts = [1, 2, 3, 4, 5, 6, 0].map(
    (d) =>
      bookings.filter(
        (b) =>
          b.schedule?.date &&
          new Date(b.schedule.date).getDay() === d &&
          b.status !== "Blackout" &&
          b.customer?.firstName !== "ADMIN_BLOCK",
      ).length,
  );
  const dowMax = Math.max(...dowCounts, 1);

  // ── Service revenue breakdown ─────────────────────────────────────────────────
  const serviceRevMap = {};
  completed.forEach((b) => {
    const svc = b.service || "Other";
    serviceRevMap[svc] =
      (serviceRevMap[svc] || 0) + Number(b.payment?.amount || 0);
  });
  const topServiceRevenue = Object.entries(serviceRevMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxSvcRev = topServiceRevenue[0]?.[1] || 1;

  // ── New vs returning customers ────────────────────────────────────────────────
  const customerBookingCounts = {};
  bookings
    .filter((b) => b.status !== "Blackout" && b.customer?.email)
    .forEach((b) => {
      const e = b.customer.email.toLowerCase();
      customerBookingCounts[e] = (customerBookingCounts[e] || 0) + 1;
    });
  const returningCount = Object.values(customerBookingCounts).filter(
    (c) => c > 1,
  ).length;
  const newCustCount = Object.values(customerBookingCounts).filter(
    (c) => c === 1,
  ).length;

  // ── Workers ──────────────────────────────────────────────────────────────────
  const activeWorkers = workers.filter((w) => w.status === "Active");
  const pendingWorkers = workers.filter((w) => w.status === "Pending");
  const suspendedWorkers = workers.filter((w) => w.status === "Suspended");
  const onJobWorkers = workers.filter((w) => w.location?.sharing === true);
  const totalWorkerEarnings = workers.reduce(
    (s, w) => s + Number(w.wallet?.totalEarned || 0),
    0,
  );
  const totalJobsDone = workers.reduce(
    (s, w) => s + Number(w.jobsCompleted || 0),
    0,
  );
  const avgWorkerRating =
    workers.length > 0
      ? workers.reduce((s, w) => s + Number(w.rating || 0), 0) / workers.length
      : 0;

  // ── Greeting ─────────────────────────────────────────────────────────────────
  const nowHour = new Date().getHours();
  const greeting =
    nowHour < 12
      ? "Good morning"
      : nowHour < 17
        ? "Good afternoon"
        : "Good evening";
  const todayStr = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter((b) => {
    if (
      !b.schedule?.date ||
      b.status === "Blackout" ||
      b.customer?.firstName === "ADMIN_BLOCK"
    )
      return false;
    return new Date(b.schedule.date).toISOString().split("T")[0] === todayStr;
  });

  // ── Status distribution (last 30 days) ───────────────────────────────────────
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);
  const recent = bookings.filter(
    (b) =>
      new Date(b.createdAt || b.schedule?.date) >= last30 &&
      b.status !== "Blackout",
  );
  const statusDist = [
    "Completed",
    "Confirmed",
    "Pending",
    "In Progress",
    "Cancelled",
  ].map((s) => ({
    label: s,
    count: recent.filter((b) => b.status === s).length,
    pct:
      recent.length > 0
        ? (recent.filter((b) => b.status === s).length / recent.length) * 100
        : 0,
  }));
  const statusColors = {
    Confirmed:          "#10B981",
    Pending:            "#F59E0B",
    Completed:          "#3B82F6",
    "Completed - Unpaid": "#A855F7",
    Cancelled:          "#F43F5E",
    "In Progress":      "#F97316",
    Accepted:           "#0EA5E9",
    Assigned:           "#6366F1",
    Arrived:            "#14B8A6",
  };

  // ── KPI strip data ───────────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Net revenue",
      icon: Wallet,
      value: gbp(netRevenue),
      sub: `${completedRevenue > 0 ? ((netRevenue / completedRevenue) * 100).toFixed(0) : 0}% margin`,
      onClick: () => setShowNetDetail(true),
      delta: changePct,
    },
    {
      label: "Pipeline value",
      icon: Briefcase,
      value: gbp(pendingRevenue),
      sub: `${pending.length} open job${pending.length !== 1 ? "s" : ""}`,
      onClick: () =>
        setDetailSegment({
          title: "Open Pipeline",
          bookings: pending,
          total: pendingRevenue,
        }),
    },
    {
      label: "Quote acceptance",
      icon: Percent,
      value: `${(quoteStats?.acceptanceRate || 0).toFixed(0)}%`,
      sub: `${quoteStats?.accepted ?? 0} of ${quoteStats?.total ?? 0} accepted`,
      onClick: () => navigate("/admin/quotes/history"),
    },
    {
      label: "Average rating",
      icon: Star,
      value: avgRating.toFixed(1),
      sub: `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),linear-gradient(135deg,_rgba(3,20,15,0.98),_rgba(4,28,22,0.95))] p-3 sm:p-4 lg:p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05),rgba(255,255,255,0))] pointer-events-none" />
      <div className="relative space-y-5 pb-24">
        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <div className="rounded-[28px] border border-white/10 bg-[#071b14]/80 p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Operations overview
                </span>
              </div>
              <p className={`${eyebrow} mb-1.5`}>
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h1 className="text-[22px] font-semibold text-white tracking-tight">
                {greeting}, {localStorage.getItem("adminUser") || "Admin"}
              </h1>
              <p className={`text-[13px] ${muted} mt-1`}>
                {loading
                  ? "Fetching data…"
                  : `${bookings.filter((b) => b.status !== "Blackout").length} bookings on record · updated ${lastRefresh?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ?? "—"}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate("/admin/bookings/new")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[13px] font-semibold hover:bg-emerald-400 transition-colors"
              >
                <Plus size={15} /> New booking
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl focus-within:border-emerald-500/40 transition-colors">
                <Search size={14} className="text-white/25 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers"
                  className="bg-transparent border-none outline-none text-[13px] w-36 text-white/75 placeholder:text-white/25"
                />
              </div>
              <div className="flex items-center gap-0.5 bg-white/[0.05] border border-white/[0.08] rounded-xl p-0.5">
                {TREND_RANGES.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => setTrendRange(opt.days)}
                    className={`px-3 py-1.5 rounded-[10px] text-[11px] font-semibold transition-colors ${trendRange === opt.days ? "bg-emerald-500 text-white" : "text-white/35 hover:text-white/65"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCSV}
                disabled={loading || bookings.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] font-medium text-white/45 hover:bg-white/10 hover:text-white/75 transition-colors disabled:opacity-30"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={exportExcel}
                disabled={loading || bookings.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] font-medium text-white/45 hover:bg-white/10 hover:text-white/75 transition-colors disabled:opacity-30"
              >
                <Download size={13} /> Excel
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                aria-label="Refresh"
                className="flex items-center justify-center w-9 h-9 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white/40 hover:bg-white/10 hover:text-white/75 transition-colors disabled:opacity-30"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI strip ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <button
              key={k.label}
              onClick={k.onClick}
              disabled={!k.onClick}
              className={`${card} text-left px-5 py-4 transition-colors ${k.onClick ? "hover:bg-[#0D3527] cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <p className={eyebrow}>{k.label}</p>
                <k.icon size={14} className="text-emerald-400/60" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-[26px] font-semibold text-white tracking-tight tabular-nums leading-none">
                  {loading ? "—" : k.value}
                </p>
                {k.delta != null && !loading && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${k.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {k.delta >= 0 ? (
                      <ArrowUpRight size={11} />
                    ) : (
                      <ArrowDownRight size={11} />
                    )}
                    {Math.abs(k.delta).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className={`text-[11px] ${muted} mt-1.5`}>{k.sub}</p>
            </button>
          ))}
        </div>

        {/* ── Workflow cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* BOOKINGS */}
          <div className={`${card} flex flex-col overflow-hidden`}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.05]">
              <p className={eyebrow}>Bookings</p>
              <button
                onClick={() => navigate("/admin/bookings")}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Schedule
              </button>
            </div>
            <div className="px-5 py-4 flex-1">
              <p className="text-[34px] font-semibold text-white tracking-tight tabular-nums leading-none">
                {newPending.length}
              </p>
              <p className={`text-[11px] ${muted} mt-1 mb-4`}>
                new requests waiting
              </p>
              <div className="space-y-2.5">
                {[
                  {
                    label: "Confirmed",
                    val: confirmed.length,
                    note: gbp(rev(confirmed)),
                    seg: {
                      title: "Confirmed Bookings",
                      bookings: confirmed,
                      total: rev(confirmed),
                    },
                  },
                  {
                    label: "In progress",
                    val: inProgress.length,
                    note: gbp(rev(inProgress)),
                    seg: {
                      title: "In Progress Bookings",
                      bookings: inProgress,
                      total: rev(inProgress),
                    },
                  },
                  {
                    label: "Completed",
                    val: completed.length,
                    note: gbp(completedRevenue),
                    seg: {
                      title: "Completed Bookings",
                      bookings: completed,
                      total: completedRevenue,
                    },
                  },
                ].map((row) => (
                  <button
                    key={row.label}
                    onClick={() => setDetailSegment(row.seg)}
                    className="w-full flex items-center justify-between group"
                  >
                    <span className="text-xs font-medium text-white/45 group-hover:text-white/70 transition-colors">
                      {row.label}
                    </span>
                    <span className="text-xs font-semibold text-white/80 tabular-nums">
                      {row.val}{" "}
                      <span className={`font-medium ${dimmed}`}>
                        · {row.note}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 pb-4 pt-3 border-t border-white/[0.05]">
              <svg
                viewBox="0 0 100 30"
                className="w-full h-7"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={sparkBooking.area} fill="url(#sg1)" />
                <polyline
                  points={sparkBooking.pts}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  points={sparkCompleted.pts}
                  fill="none"
                  stroke="#3CC7FF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className={`flex items-center gap-1.5 text-[10px] font-medium ${muted}`}
                >
                  <span className="w-2.5 h-[2px] bg-emerald-400 rounded inline-block" />
                  Received
                </span>
                <span
                  className={`flex items-center gap-1.5 text-[10px] font-medium ${muted}`}
                >
                  <span className="w-2.5 h-[2px] bg-cyan-400 rounded inline-block" />
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* QUOTES */}
          <div className={`${card} flex flex-col overflow-hidden`}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.05]">
              <p className={eyebrow}>Quotes</p>
              <button
                onClick={() => navigate("/admin/quotes")}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Convert
              </button>
            </div>
            <div className="px-5 py-4 flex-1">
              <p className="text-[34px] font-semibold text-white tracking-tight tabular-nums leading-none">
                {quoteStats?.accepted ?? "—"}
              </p>
              <p className={`text-[11px] ${muted} mt-1 mb-4`}>
                approved
                {quoteStats?.acceptedValue > 0
                  ? ` · ${gbp(quoteStats.acceptedValue)}`
                  : ""}
              </p>
              <div className="space-y-2.5">
                {[
                  {
                    label: "Awaiting response",
                    val: quoteStats?.pending ?? "—",
                  },
                  { label: "Declined", val: quoteStats?.declined ?? "—" },
                  { label: "Total sent", val: quoteStats?.total ?? "—" },
                ].map((row) => (
                  <button
                    key={row.label}
                    onClick={() => navigate("/admin/quotes/history")}
                    className="w-full flex items-center justify-between group"
                  >
                    <span className="text-xs font-medium text-white/45 group-hover:text-white/70 transition-colors">
                      {row.label}
                    </span>
                    <span className="text-xs font-semibold text-white/80 tabular-nums">
                      {row.val}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 pb-4 pt-3 border-t border-white/[0.05]">
              <p className={`text-[10px] font-medium ${muted} mb-1.5`}>
                Acceptance rate · {(quoteStats?.acceptanceRate || 0).toFixed(0)}
                %
              </p>
              <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${quoteStats?.acceptanceRate ?? 0}%` }}
                />
                <div
                  className="h-full bg-rose-500/80 transition-all duration-700"
                  style={{
                    width: `${quoteStats ? (quoteStats.declined / quoteStats.total) * 100 || 0 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* JOBS */}
          <div className={`${card} flex flex-col overflow-hidden`}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.05]">
              <p className={eyebrow}>Jobs</p>
              <button
                onClick={() => navigate("/admin/jobs")}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View jobs
              </button>
            </div>
            <div className="px-5 py-4 flex-1">
              <p className="text-[34px] font-semibold text-white tracking-tight tabular-nums leading-none">
                {inProgress.length + accepted.length}
              </p>
              <p className={`text-[11px] ${muted} mt-1 mb-4`}>
                active right now
              </p>
              <div className="space-y-2.5">
                {[
                  {
                    label: "Requires action",
                    val: newPending.length,
                    seg: {
                      title: "New Bookings",
                      bookings: newPending,
                      total: rev(newPending),
                    },
                  },
                  {
                    label: "In progress",
                    val: inProgress.length,
                    seg: {
                      title: "In Progress",
                      bookings: inProgress,
                      total: rev(inProgress),
                    },
                  },
                  {
                    label: "Completed",
                    val: completed.length,
                    seg: {
                      title: "Completed",
                      bookings: completed,
                      total: completedRevenue,
                    },
                  },
                ].map((row) => (
                  <button
                    key={row.label}
                    onClick={() => setDetailSegment(row.seg)}
                    className="w-full flex items-center justify-between group"
                  >
                    <span className="text-xs font-medium text-white/45 group-hover:text-white/70 transition-colors">
                      {row.label}
                    </span>
                    <span className="text-xs font-semibold text-white/80 tabular-nums">
                      {row.val}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 pb-4 pt-3 border-t border-white/[0.05]">
              <svg
                viewBox="0 0 100 30"
                className="w-full h-7"
                preserveAspectRatio="none"
              >
                <polyline
                  points={sparkBooking.pts}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  points={sparkCompleted.pts}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className={`flex items-center gap-1.5 text-[10px] font-medium ${muted}`}
                >
                  <span className="w-2.5 h-[2px] bg-slate-500 rounded inline-block" />
                  Created
                </span>
                <span
                  className={`flex items-center gap-1.5 text-[10px] font-medium ${muted}`}
                >
                  <span className="w-2.5 h-[2px] bg-emerald-400 rounded inline-block" />
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* REVENUE */}
          <div className={`${card} flex flex-col overflow-hidden`}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.05]">
              <p className={eyebrow}>Revenue</p>
              <button
                onClick={() => setShowNetDetail(true)}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Breakdown
              </button>
            </div>
            <div className="px-5 py-4 flex-1">
              <p className="text-[34px] font-semibold text-white tracking-tight tabular-nums leading-none">
                {gbp(completedRevenue)}
              </p>
              <p className={`text-[11px] ${muted} mt-1 mb-4`}>
                gross · {completed.length} completed jobs
              </p>
              <div className="space-y-2.5">
                {[
                  {
                    label: "Pending pipeline",
                    val: gbp(pendingRevenue),
                    action: () =>
                      setDetailSegment({
                        title: "Open Pipeline",
                        bookings: pending,
                        total: pendingRevenue,
                      }),
                  },
                  {
                    label: "Total expenses",
                    val: `−${gbp(totalExpenses)}`,
                    action: () => navigate("/admin/expenses"),
                  },
                  {
                    label: "Net revenue",
                    val: gbp(netRevenue),
                    action: () => setShowNetDetail(true),
                  },
                ].map((row) => (
                  <button
                    key={row.label}
                    onClick={row.action}
                    className="w-full flex items-center justify-between group"
                  >
                    <span className="text-xs font-medium text-white/45 group-hover:text-white/70 transition-colors">
                      {row.label}
                    </span>
                    <span className="text-xs font-semibold text-white/80 tabular-nums">
                      {row.val}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 pb-4 pt-3 border-t border-white/[0.05]">
              <svg
                viewBox="0 0 100 30"
                className="w-full h-7"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const vals = Array.from({ length: 12 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (11 - i) * 2.5);
                    const s = new Date(d.toDateString()),
                      e = new Date(s.getTime() + 86399999 * 2.5);
                    return bookings
                      .filter((b) => {
                        const t = new Date(b.createdAt || b.schedule?.date);
                        return t >= s && t <= e && b.status === "Completed";
                      })
                      .reduce((a, b) => a + Number(b.payment?.amount || 0), 0);
                  });
                  const mx = Math.max(...vals, 1);
                  const pts = vals
                    .map((v, i) => `${(i / 11) * 96 + 2},${28 - (v / mx) * 24}`)
                    .join(" ");
                  return (
                    <>
                      <polygon points={`2,28 ${pts} 98,28`} fill="url(#sg2)" />
                      <polyline
                        points={pts}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </>
                  );
                })()}
              </svg>
              <span
                className={`flex items-center gap-1.5 mt-1.5 text-[10px] font-medium ${muted}`}
              >
                <span className="w-2.5 h-[2px] bg-emerald-400 rounded inline-block" />
                Revenue · last 30 days
              </span>
            </div>
          </div>
        </div>

        {/* ── Today's schedule ─────────────────────────────────────────────────── */}
        {todaysBookings.length > 0 && (
          <div className={`${card} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                  <CalendarCheck size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Today's schedule
                  </p>
                  <p className={`text-xs ${muted}`}>
                    {todaysBookings.length} job
                    {todaysBookings.length !== 1 ? "s" : ""} on the board
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin/bookings")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-2.5 p-4 min-w-max">
                {todaysBookings.slice(0, 8).map((b, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/admin/bookings?id=${b._id}`)}
                    className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl px-4 py-3 text-left transition-colors min-w-52"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {initials(b)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/85 truncate">
                        {b.customer?.firstName} {b.customer?.lastName}
                      </p>
                      <p className={`text-[11px] ${muted} truncate`}>
                        {b.service}
                      </p>
                      <p className="text-[11px] font-semibold text-white/55 mt-0.5">
                        {b.schedule?.preferredTime || "Time TBC"}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Revenue trend + split ────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className={`lg:col-span-2 ${card} p-5 sm:p-6`}>
            <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
              <div>
                <CardHead kicker="Analytics" title="Revenue trend" />
                <div className="flex items-baseline gap-2.5 mt-2">
                  <span className="text-2xl font-semibold text-white tabular-nums tracking-tight">
                    {gbp(rangeRevenue, 2)}
                  </span>
                  {changePct !== null ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums ${changePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {changePct >= 0 ? (
                        <ArrowUpRight size={12} />
                      ) : (
                        <ArrowDownRight size={12} />
                      )}
                      {changePct >= 0 ? "+" : ""}
                      {changePct.toFixed(1)}% vs prior period
                    </span>
                  ) : (
                    <span className={`text-[11px] ${muted}`}>
                      No prior period data yet
                    </span>
                  )}
                </div>
              </div>
            </div>
            {loading ? (
              <div className="h-52 bg-white/[0.03] rounded-xl animate-pulse" />
            ) : (
              <div className="space-y-2 pt-2">
                <div className="relative" style={{ height: "200px" }}>
                  {[0, 25, 50, 75].map((g) => (
                    <div
                      key={g}
                      className="absolute left-0 right-0 border-t border-dashed border-white/[0.04]"
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
                          stopColor="#10B981"
                          stopOpacity="0.18"
                        />
                        <stop
                          offset="100%"
                          stopColor="#10B981"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`0,100 ${trendLine} 100,100`}
                      fill="url(#trendFill)"
                    />
                    <polyline
                      points={trendLine}
                      fill="none"
                      stroke="#10B981"
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
                            className="absolute -translate-x-1/2 mb-2 bg-[#0F3D2C] border border-white/10 text-white text-[10px] font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap z-20 pointer-events-none shadow-xl tabular-nums"
                            style={{
                              left: "50%",
                              bottom: `${Math.min(p.heightPct + 10, 88)}%`,
                            }}
                          >
                            <span className="font-semibold">
                              {gbp(p.revenue, 2)}
                            </span>
                            <br />
                            <span className={muted}>
                              {p.count} booking{p.count !== 1 ? "s" : ""} ·{" "}
                              {p.label}
                            </span>
                          </div>
                        )}
                        <div
                          className={`absolute rounded-full border-2 border-[#0B2D22] transition-all ${hoveredPoint === i ? "bg-emerald-400 w-3 h-3" : "bg-emerald-500/40 w-1.5 h-1.5"}`}
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
                        <span
                          className={`text-[9px] font-medium ${dimmed} uppercase tracking-wide`}
                        >
                          {p.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Revenue split donut */}
          <div className={`${card} p-5 sm:p-6`}>
            <CardHead
              kicker="Breakdown"
              title="Revenue split"
              sub={`Net ${gbp(Math.max(netRevenue, 0))} after expenses`}
            />
            <div className="relative w-36 h-36 mx-auto my-6">
              <svg viewBox="0 0 42 42" className="w-full h-full">
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549"
                  fill="transparent"
                  stroke="#0F3D2C"
                  strokeWidth="4"
                />
                {donutArcs.map((seg, i) => (
                  <circle
                    key={i}
                    cx="21"
                    cy="21"
                    r="15.91549"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="4"
                    strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                    strokeDashoffset={seg.dashoffset}
                    transform="rotate(-90 21 21)"
                    strokeLinecap={seg.pct < 100 ? "butt" : "round"}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-semibold text-white tabular-nums tracking-tight">
                  {gbp(Math.max(netRevenue, 0))}
                </p>
                <p className={eyebrow}>Net</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {donutArcs.map((seg, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-xs font-medium text-white/55">
                      {seg.label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white/80 tabular-nums">
                    {seg.pct.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 6-month overview + top services ──────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className={`lg:col-span-2 ${card} p-5 sm:p-6`}>
            <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
              <CardHead kicker="Six months" title="Bookings overview" />
              <div className="flex items-center gap-4 text-[11px] font-medium text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                  Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400/70" />{" "}
                  Cancelled
                </span>
              </div>
            </div>
            <div
              className="flex items-end gap-2 sm:gap-4"
              style={{ height: "170px" }}
            >
              {monthly.map((m, i) => (
                <div
                  key={i}
                  className="flex-1 h-full flex items-end justify-center gap-1 group"
                >
                  <div
                    className="w-4 rounded-t bg-emerald-500 group-hover:bg-emerald-400 transition-colors"
                    style={{
                      height: `${Math.max((m.completed / maxMonthRev) * 100, 2)}%`,
                    }}
                    title={`Completed: ${gbp(m.completed, 2)}`}
                  />
                  <div
                    className="w-4 rounded-t bg-cyan-400/50 group-hover:bg-cyan-400/70 transition-colors"
                    style={{
                      height: `${Math.max((m.cancelled / maxMonthRev) * 100, 2)}%`,
                    }}
                    title={`Cancelled: ${gbp(m.cancelled, 2)}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2">
              {monthly.map((m, i) => (
                <div key={i} className="flex-1 text-center">
                  <span
                    className={`text-[10px] font-medium ${dimmed} uppercase tracking-wide`}
                  >
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-5 sm:p-6`}>
            <CardHead
              kicker="Performance"
              title="Top services"
              sub="By revenue earned"
            />
            <div className="space-y-4 mt-5">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-5 bg-white/[0.04] rounded-lg animate-pulse"
                  />
                ))
              ) : topServices.length === 0 ? (
                <p className={`${muted} text-sm text-center py-6`}>
                  No bookings yet — revenue by service will appear here.
                </p>
              ) : (
                topServices.map(([name, stats], i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-white/55 truncate mr-2 flex-1 min-w-0">
                        {name}
                      </span>
                      <span className="text-xs font-semibold text-white/80 tabular-nums shrink-0">
                        {gbp(stats.revenue)}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
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

        {/* ── Status distribution + booking sources ────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className={`${card} p-5 sm:p-6`}>
            <CardHead
              kicker="Last 30 days"
              title="Booking status distribution"
            />
            <div className="space-y-3 mt-5">
              {statusDist.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <p className="text-[11px] font-medium text-white/50">
                      {s.label}
                    </p>
                  </div>
                  <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${s.pct}%`,
                        backgroundColor: statusColors[s.label] || "#475569",
                      }}
                    />
                  </div>
                  <div className="w-16 text-right shrink-0 flex items-center gap-1.5 justify-end">
                    <span className="text-[13px] font-semibold text-white/80 tabular-nums">
                      {s.count}
                    </span>
                    <span className={`text-[10px] ${muted} tabular-nums`}>
                      {s.pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 h-2 rounded-full overflow-hidden flex bg-white/[0.04]">
              {statusDist
                .filter((s) => s.pct > 0)
                .map((s) => (
                  <div
                    key={s.label}
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${s.pct}%`,
                      backgroundColor: statusColors[s.label] || "#475569",
                    }}
                    title={`${s.label}: ${s.count}`}
                  />
                ))}
            </div>
          </div>

          <div className={`${card} p-5 sm:p-6`}>
            <CardHead
              kicker="Acquisition"
              title="Booking sources"
              action="View leads"
              onAction={() => navigate("/admin/leads")}
            />
            <div className="grid grid-cols-3 gap-2 mt-4 mb-5">
              {[
                { label: "Total", val: leadStats?.total ?? "—" },
                { label: "This week", val: leadStats?.thisWeek ?? "—" },
                { label: "This month", val: leadStats?.thisMonth ?? "—" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center"
                >
                  <p className="text-lg font-semibold text-white tabular-nums">
                    {s.val}
                  </p>
                  <p className={`${eyebrow} mt-0.5`}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              {leadSourceBreakdown.length === 0 ? (
                <p className={`${muted} text-sm text-center py-6`}>
                  No leads yet — sources will appear as enquiries arrive.
                </p>
              ) : (
                leadSourceBreakdown.map(([source, stats]) => (
                  <div
                    key={source}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-medium text-white/55 w-24 shrink-0 truncate">
                      {source}
                    </span>
                    <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${(stats.count / maxLeadCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-white/80 tabular-nums w-6 text-right">
                      {stats.count}
                    </span>
                    <span
                      className={`hidden sm:inline text-[10px] ${muted} tabular-nums w-16 text-right shrink-0`}
                    >
                      {gbp(stats.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Customers + requested + ratings ──────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className={`${card} overflow-hidden`}>
            <div className="p-5 sm:p-6 pb-3">
              <CardHead
                kicker="Clients"
                title="Top customers"
                action="View all"
                onAction={() => navigate("/admin/customers")}
              />
            </div>
            <div className="px-3 pb-3">
              {topCustomers.length === 0 ? (
                <p className={`${muted} text-sm text-center py-8`}>
                  No customers yet — completed bookings build this list.
                </p>
              ) : (
                topCustomers.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {(
                          (c.firstName?.[0] || "") + (c.lastName?.[0] || "")
                        ).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/85 truncate">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className={`text-[11px] ${muted}`}>
                        {c.count} booking{c.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold text-white/80 tabular-nums shrink-0">
                      {gbp(c.total)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`${card} p-5 sm:p-6`}>
            <CardHead kicker="Popularity" title="Top requested services" />
            <div className="space-y-3.5 mt-5">
              {topRequested.length === 0 ? (
                <p className={`${muted} text-sm text-center py-8`}>
                  No data yet.
                </p>
              ) : (
                topRequested.map(([name, stats], i) => {
                  const share =
                    bookings.length > 0
                      ? (stats.count / bookings.length) * 100
                      : 0;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-xs font-medium text-white/55 truncate flex-1 min-w-0">
                        {name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 w-28">
                        <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400/80 rounded-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-white/75 tabular-nums w-9 text-right">
                          {share.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={`${card} p-5 sm:p-6`}>
            <div className="flex justify-between items-start">
              <CardHead kicker="Reviews" title="Ratings" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-[13px] font-semibold text-amber-300 tabular-nums">
                  {avgRating.toFixed(1)}
                </span>
              </div>
            </div>
            {reviews.length === 0 ? (
              <p className={`${muted} text-sm text-center py-8`}>
                No reviews yet — ratings will appear as customers leave
                feedback.
              </p>
            ) : (
              <>
                <p className={`text-[11px] ${muted} mt-1 mb-4`}>
                  {reviews.length.toLocaleString("en-GB")} total reviews
                </p>
                <div className="space-y-2.5">
                  {ratingBreakdown.map((r) => (
                    <div key={r.star} className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-white/45 w-11 shrink-0">
                        {r.star} star
                      </span>
                      <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${r.pct}%` }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-medium ${muted} tabular-nums w-8 text-right`}
                      >
                        {r.pct.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Quote conversion + recent quotes + calendar ──────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className={`${card} p-5 sm:p-6`}>
            <CardHead
              kicker="Quotes"
              title="Quote conversion"
              sub="Accept vs decline, all time"
            />
            {!quoteStats?.total ? (
              <p className={`${muted} text-sm text-center py-8`}>
                No quotes sent yet — send one to start tracking conversion.
              </p>
            ) : (
              <>
                <div className="flex items-end gap-2 mt-4 mb-4">
                  <span className="text-3xl font-semibold text-white tabular-nums tracking-tight">
                    {(quoteStats.acceptanceRate || 0).toFixed(0)}%
                  </span>
                  <span className={`text-[11px] ${muted} mb-1.5`}>
                    acceptance rate
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden flex mb-4">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${((quoteStats.accepted || 0) / quoteStats.total) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-rose-500/80"
                    style={{
                      width: `${((quoteStats.declined || 0) / quoteStats.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="space-y-2.5">
                  {[
                    {
                      color: "bg-emerald-500",
                      label: "Accepted",
                      val: `${quoteStats.accepted || 0} · ${gbp(quoteStats.acceptedValue || 0)}`,
                    },
                    {
                      color: "bg-rose-500",
                      label: "Declined",
                      val: `${quoteStats.declined || 0}`,
                    },
                    {
                      color: "bg-white/20",
                      label: "Awaiting response",
                      val: `${quoteStats.pending ?? quoteStats.total}`,
                    },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2 font-medium text-white/55">
                        <span className={`w-2 h-2 rounded-full ${r.color}`} />
                        {r.label}
                      </span>
                      <span className="font-semibold text-white/80 tabular-nums">
                        {r.val}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={`${card} overflow-hidden`}>
            <div className="p-5 sm:p-6 pb-3">
              <CardHead
                kicker="Latest"
                title="Recent quotes"
                action="History"
                onAction={() => navigate("/admin/quotes/history")}
              />
            </div>
            <div className="px-3 pb-3">
              {recentQuotes.length === 0 ? (
                <p className={`${muted} text-sm text-center py-8`}>
                  No quotes sent yet.
                </p>
              ) : (
                recentQuotes.map((q) => {
                  const isAccepted = q.status === "accepted";
                  const isDeclined = q.status === "declined";
                  return (
                    <button
                      key={q.quoteRef}
                      onClick={() => navigate("/admin/quotes")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAccepted ? "bg-emerald-400/10" : isDeclined ? "bg-rose-400/10" : "bg-white/[0.05]"}`}
                      >
                        {isDeclined ? (
                          <X size={15} className="text-rose-400" />
                        ) : (
                          <CheckCircle2
                            size={15}
                            className={
                              isAccepted ? "text-emerald-400" : "text-white/25"
                            }
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white/85 truncate">
                          {q.companyName}
                        </p>
                        <p className={`text-[11px] ${muted}`}>
                          {q.quoteRef} · {gbp(q.grandTotal, 2)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-[3px] rounded-md shrink-0 ${isAccepted ? "text-emerald-300 bg-emerald-400/10" : isDeclined ? "text-rose-300 bg-rose-400/10" : "text-white/40 bg-white/[0.05]"}`}
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

          {/* Revenue by date */}
          <div className={`${card} p-5 sm:p-6`}>
            <CardHead
              kicker="Range"
              title="Revenue by date"
              sub="Pick a start and end date to see totals"
            />

            <div className="flex items-center justify-between mt-4 mb-3">
              <button
                onClick={() =>
                  setCalMonth(new Date(calYear, calMonthIdx - 1, 1))
                }
                aria-label="Previous month"
                className="p-1.5 rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/10 hover:text-white/75 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <p className="text-[13px] font-semibold text-white/80">
                {calMonth.toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                onClick={() =>
                  setCalMonth(new Date(calYear, calMonthIdx + 1, 1))
                }
                aria-label="Next month"
                className="p-1.5 rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/10 hover:text-white/75 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  className={`text-[9px] font-semibold ${dimmed} uppercase text-center py-1`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {calCells.map((day, i) => {
                if (!day) return <div key={i} className="aspect-square" />;
                const isStart = selStart && dateKey(day) === dateKey(selStart);
                const isEnd = selEnd && dateKey(day) === dateKey(selEnd);
                const inR = inRange(day);
                const isToday = dateKey(day) === dateKey(new Date());
                return (
                  <button
                    key={i}
                    onClick={() => handleCalClick(day)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold transition-colors border ${
                      isStart || isEnd
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : inR
                          ? "bg-emerald-400/10 text-emerald-300 border-emerald-500/20"
                          : isToday
                            ? "border-emerald-500/40 text-emerald-400/80"
                            : "border-transparent text-white/40 hover:bg-white/[0.05] hover:text-white/65"
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {selStart ? (
              <div className="bg-emerald-400/[0.07] border border-emerald-500/15 rounded-xl p-3.5">
                <p className={`${eyebrow} mb-1`}>
                  {selStart.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                  {selEnd
                    ? ` – ${selEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                    : ""}
                </p>
                <p className="text-xl font-semibold text-emerald-400 tabular-nums tracking-tight">
                  {gbp(selectedRangeRevenue)}
                </p>
                <div className="flex gap-4 mt-2 text-[11px]">
                  <span className={muted}>
                    {bookingsInRange.length} bookings
                  </span>
                  <span className={muted}>{leadsInRange.length} leads</span>
                  <span className={muted}>
                    {conversionPct.toFixed(0)}% conversion
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelStart(null);
                    setSelEnd(null);
                  }}
                  className={`text-[11px] font-semibold ${muted} hover:text-white/65 mt-2 inline-flex items-center gap-1 transition-colors`}
                >
                  <X size={10} /> Clear selection
                </button>
              </div>
            ) : (
              <p className={`text-[11px] ${dimmed} text-center py-1`}>
                Select a date range to see revenue
              </p>
            )}
          </div>
        </div>

        {/* ── Busy days · Service revenue · New vs Returning ──────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Busiest booking days */}
          <div className={`${card} p-5 sm:p-6`}>
            <CardHead
              kicker="Schedule"
              title="Busiest booking days"
              sub="All-time by day of week"
            />
            <div
              className="mt-5 flex items-end gap-2"
              style={{ height: "120px" }}
            >
              {DOW_LABELS.map((day, i) => {
                const count = dowCounts[i];
                const pct = (count / dowMax) * 100;
                const isWeekend = i >= 5;
                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full"
                  >
                    <span className="text-[10px] font-semibold text-white/50 tabular-nums h-4">
                      {count > 0 ? count : ""}
                    </span>
                    <div className="w-full flex-1 flex flex-col justify-end">
                      <div
                        className={`w-full rounded-t-md transition-all duration-700 ${isWeekend ? "bg-emerald-400/50" : "bg-emerald-500/75"}`}
                        style={{ height: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wide ${isWeekend ? "text-emerald-400/60" : dimmed}`}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue by service */}
          <div className={`${card} p-5 sm:p-6`}>
            <CardHead
              kicker="Revenue"
              title="Revenue by service"
              sub="Completed bookings only"
            />
            <div className="space-y-3 mt-5">
              {topServiceRevenue.length === 0 ? (
                <p className={`${muted} text-sm text-center py-6`}>
                  No completed bookings yet.
                </p>
              ) : (
                topServiceRevenue.map(([svc, rev]) => (
                  <div key={svc} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-white/55 truncate flex-1 min-w-0">
                      {svc}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 w-36">
                      <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(rev / maxSvcRev) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-white/80 tabular-nums w-14 text-right shrink-0">
                        {gbp(rev)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New vs returning */}
          <div className={`${card} p-5 sm:p-6`}>
            <CardHead
              kicker="Retention"
              title="New vs returning"
              sub="Unique customers by booking count"
            />
            <div className="mt-5 flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="4"
                  />
                  {returningCount + newCustCount > 0 && (
                    <>
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="4"
                        strokeDasharray={`${(returningCount / (returningCount + newCustCount)) * 87.96} 87.96`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="rgba(16,185,129,0.2)"
                        strokeWidth="4"
                        strokeDasharray={`${(newCustCount / (returningCount + newCustCount)) * 87.96} 87.96`}
                        strokeDashoffset={`-${(returningCount / (returningCount + newCustCount)) * 87.96}`}
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-semibold text-white tabular-nums">
                    {returningCount + newCustCount}
                  </span>
                  <span
                    className={`text-[9px] ${muted} uppercase tracking-wide`}
                  >
                    clients
                  </span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  {
                    label: "Returning",
                    count: returningCount,
                    color: "bg-emerald-500",
                  },
                  {
                    label: "New",
                    count: newCustCount,
                    color: "bg-emerald-500/20",
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2 text-xs text-white/55 font-medium">
                      <span className={`w-2 h-2 rounded-full ${r.color}`} />
                      {r.label}
                    </span>
                    <span className="text-[13px] font-semibold text-white/80 tabular-nums">
                      {r.count}
                    </span>
                  </div>
                ))}
                {returningCount + newCustCount > 0 && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className={`text-[11px] ${muted}`}>
                      <span className="text-emerald-400 font-semibold">
                        {(
                          (returningCount / (returningCount + newCustCount)) *
                          100
                        ).toFixed(0)}
                        %
                      </span>{" "}
                      retention rate
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Workers overview ─────────────────────────────────────────────────── */}
        <div className={`${card} overflow-hidden`}>
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center shrink-0">
                <Users size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className={`${eyebrow} mb-0.5`}>Team</p>
                <h3 className={cardTitle}>Workers overview</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: "Active", count: activeWorkers.length, cls: "bg-emerald-400/10 text-emerald-400" },
                { label: "Pending", count: pendingWorkers.length, cls: "bg-amber-400/10 text-amber-400" },
                { label: "Suspended", count: suspendedWorkers.length, cls: "bg-rose-400/10 text-rose-400" },
              ].map((s) => (
                <span key={s.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${s.cls}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                  {s.count} {s.label}
                </span>
              ))}
              <button
                onClick={() => navigate("/admin/workers")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors ml-1"
              >
                Manage <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/[0.05] border-b border-white/[0.05]">
            {[
              { label: "Total staff", value: workers.length, sub: `${activeWorkers.length} active` },
              { label: "On job now", value: onJobWorkers.length, sub: "live tracking", accent: onJobWorkers.length > 0 },
              { label: "Jobs completed", value: totalJobsDone.toLocaleString("en-GB"), sub: "all time" },
              { label: "Total paid out", value: gbp(totalWorkerEarnings), sub: `avg ${avgWorkerRating.toFixed(1)} ★` },
            ].map((k) => (
              <div key={k.label} className="px-5 py-3.5">
                <p className={eyebrow}>{k.label}</p>
                <p className={`text-xl font-semibold tabular-nums mt-1 ${k.accent ? "text-emerald-400" : "text-white"}`}>
                  {loading ? "—" : k.value}
                </p>
                <p className={`text-[10px] ${muted} mt-0.5`}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Worker roster */}
          {workers.length === 0 ? (
            <p className={`${muted} text-sm text-center py-10`}>
              No workers added yet.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {workers.slice(0, 8).map((w) => {
                const statusCls =
                  w.status === "Active"
                    ? "bg-emerald-400/10 text-emerald-400"
                    : w.status === "Suspended"
                      ? "bg-rose-400/10 text-rose-400"
                      : "bg-amber-400/10 text-amber-400";
                const avatarCls =
                  w.status === "Active"
                    ? "bg-emerald-400/10 text-emerald-400"
                    : w.status === "Suspended"
                      ? "bg-rose-400/10 text-rose-400"
                      : "bg-white/[0.06] text-white/40";
                return (
                  <button
                    key={w._id}
                    onClick={() => navigate("/admin/workers")}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold ${avatarCls}`}>
                      {((w.firstName?.[0] || "") + (w.lastName?.[0] || "")).toUpperCase()}
                    </div>

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/85 truncate">
                        {w.firstName} {w.lastName}
                      </p>
                      <p className={`text-[11px] ${muted} truncate`}>
                        {w.role} · {w.region}
                      </p>
                    </div>

                    {/* Live badge */}
                    {w.location?.sharing && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 text-[10px] font-semibold shrink-0">
                        <MapPin size={9} /> Live
                      </span>
                    )}

                    {/* Status */}
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${statusCls}`}>
                      <span className="w-1 h-1 rounded-full bg-current" />
                      {w.status}
                    </span>

                    {/* Jobs */}
                    <div className="text-right shrink-0 w-12 hidden sm:block">
                      <p className="text-[13px] font-semibold text-white/80 tabular-nums">{w.jobsCompleted}</p>
                      <p className={`text-[10px] ${dimmed}`}>jobs</p>
                    </div>

                    {/* Rating */}
                    <div className="text-right shrink-0 w-14 hidden md:block">
                      <p className="text-[13px] font-semibold text-amber-400 tabular-nums">
                        ★ {Number(w.rating || 0).toFixed(1)}
                      </p>
                      <p className={`text-[10px] ${dimmed}`}>rating</p>
                    </div>

                    {/* Earned */}
                    <div className="text-right shrink-0 w-16 hidden lg:block">
                      <p className="text-[13px] font-semibold text-white/80 tabular-nums">
                        {gbp(w.wallet?.totalEarned || 0)}
                      </p>
                      <p className={`text-[10px] ${dimmed}`}>earned</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {workers.length > 8 && (
            <div className="px-5 py-3 border-t border-white/[0.05]">
              <button
                onClick={() => navigate("/admin/workers")}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
              >
                View all {workers.length} workers <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* ── Modals ───────────────────────────────────────────────────────────── */}
        {detailSegment && (
          <DetailModal
            segment={detailSegment}
            onClose={() => setDetailSegment(null)}
            onViewBooking={(b) => {
              setDetailSegment(null);
              navigate(`/admin/bookings?id=${b._id}`);
            }}
          />
        )}
        {showNetDetail && (
          <NetRevenueModal
            completed={completed}
            expenses={expenses}
            netRevenue={netRevenue}
            onClose={() => setShowNetDetail(false)}
            onViewBooking={(b) => {
              setShowNetDetail(false);
              navigate(`/admin/bookings?id=${b._id}`);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
