import React, { useState, useEffect, useRef } from "react";
import {
  Terminal, Activity, AlertTriangle, Heart, RefreshCw, ChevronDown,
  ChevronUp, Trash2, CheckCircle2, Wifi, WifiOff, Shield, LogOut,
  Users, Briefcase, LayoutGrid, UserPlus, Eye, EyeOff, KeyRound,
  Search, X, Plus, BarChart3,
} from "lucide-react";
import { install, getLog, clearLog, subscribe } from "../utils/fetchLogger";

const API = import.meta.env.VITE_API_URL;
const SESSION_KEY = "dp_token";

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusCls = (s) => {
  if (!s || s === 0) return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  if (s < 300)       return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (s < 400)       return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (s < 500)       return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return               "bg-rose-500/20 text-rose-400 border-rose-500/30";
};
const methodCls = (m) => ({
  GET:    "bg-sky-500/15 text-sky-400",
  POST:   "bg-emerald-500/15 text-emerald-400",
  PUT:    "bg-amber-500/15 text-amber-400",
  PATCH:  "bg-purple-500/15 text-purple-400",
  DELETE: "bg-rose-500/15 text-rose-400",
}[m] || "bg-white/10 text-white/50");
const levelCls = (l) => ({
  fatal: "bg-rose-600/20 text-rose-300 border-rose-600/40",
  error: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  warn:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
}[l] || "bg-white/5 text-white/40 border-white/10");

const fmtMs     = (ms) => ms == null ? "…" : ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(1)}s`;
const fmtMem    = (b)  => `${(b/1024/1024).toFixed(1)} MB`;
const fmtUptime = (s)  => `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${Math.floor(s%60)}s`;
const fmtTime   = (iso) => iso ? new Date(iso).toLocaleTimeString("en-GB",{hour12:false}) : "—";
const fmtDate   = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB") : "—";
const shortUrl  = (url="") => url.replace(/^https?:\/\/[^/]+/,"");
const durCls    = (ms) => ms==null?"text-white/25":ms>1000?"text-rose-400":ms>300?"text-amber-400":"text-emerald-400/70";
const gbp       = (n)  => `£${Number(n||0).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = "text-white" }) => (
  <div className="rounded-2xl border border-white/6 bg-white/[0.025] p-4">
    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-2xl font-black tabular-nums ${color}`}>{value ?? "—"}</p>
    {sub && <p className="text-[10px] text-white/25 mt-1">{sub}</p>}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [secret,   setSecret]   = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API}/devpanel/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid secret");
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#040807] flex items-center justify-center p-6" style={{fontFamily:"'Fira Mono','Consolas',monospace"}}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-5">
            <Shield size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">CLEANIQ</h1>
          <p className="text-[11px] text-emerald-400/70 tracking-[0.3em] uppercase mt-0.5">Dev Control Panel</p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-white/25">Restricted access · authenticated only</span>
          </div>
        </div>

        {/* Card */}
        <form onSubmit={submit} className="rounded-2xl border border-white/8 bg-white/[0.025] p-6 space-y-4">
          <div>
            <label className="block text-[10px] text-white/35 mb-1.5 uppercase tracking-widest">Dev Secret</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter dev panel secret"
                className="w-full px-3.5 py-3 pr-10 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                autoFocus
              />
              <button type="button" onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle size={13} className="text-rose-400 shrink-0" />
              <p className="text-[11px] text-rose-400">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading || !secret}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-sm font-black transition-all">
            {loading ? "Authenticating…" : "Access Dev Panel"}
          </button>
        </form>

        <p className="text-center text-[10px] text-white/15 mt-6">
          Set <span className="text-white/30">DEV_PANEL_SECRET</span> in server .env to change the password
        </p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DEV PANEL (authenticated)
// ═════════════════════════════════════════════════════════════════════════════
const NAV = [
  { id: "overview",  label: "Overview",       icon: LayoutGrid },
  { id: "monitor",   label: "API Monitor",    icon: Activity },
  { id: "backend",   label: "Backend Reqs",   icon: Terminal },
  { id: "errors",    label: "Server Errors",  icon: AlertTriangle },
  { id: "health",    label: "System Health",  icon: Heart },
  { id: "admins",    label: "Admin Accounts", icon: Shield },
  { id: "customers", label: "Customers",      icon: Users },
  { id: "workers",   label: "Workers",        icon: Briefcase },
  { id: "server",    label: "Server Control", icon: Shield },
];

function DevPanelMain({ token, onLogout }) {
  const [page,         setPage]         = useState("overview");
  const [sseStatus,    setSseStatus]    = useState("disconnected");
  const [frontendLog,  setFrontendLog]  = useState([]);
  const [backendReqs,  setBackendReqs]  = useState([]);
  const [serverErrors, setServerErrors] = useState([]);
  const [health,       setHealth]       = useState(null);
  const [stats,        setStats]        = useState(null);
  const [admins,       setAdmins]       = useState([]);
  const [customers,    setCustomers]    = useState({ data: [], total: 0, page: 1, pages: 1 });
  const [workers,      setWorkers]      = useState({ data: [], total: 0, page: 1, pages: 1 });
  const [expanded,     setExpanded]     = useState(null);
  const [mFilter,      setMFilter]      = useState("ALL");
  const [sFilter,      setSFilter]      = useState("ALL");
  const [urlFilter,    setUrlFilter]    = useState("");
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null); // { type, data }
  const [maintenance,  setMaintenance]  = useState(false);
  const [maintLoading, setMaintLoading] = useState(false);
  const [restartCount, setRestartCount] = useState(0);
  const [detail,       setDetail]       = useState(null); // { type: 'customer'|'worker', data, bookings }

  const headers = { Authorization: `Bearer ${token}` };
  const toggle  = (id) => setExpanded((p) => p === id ? null : id);

  // ── Install fetch logger ───────────────────────────────────────────
  useEffect(() => {
    install();
    setFrontendLog(getLog());
    return subscribe(setFrontendLog);
  }, []);

  // ── SSE stream ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    const ctrl = new AbortController();
    setSseStatus("connecting");
    (async () => {
      try {
        const resp = await fetch(`${API}/devpanel/stream`, { headers, signal: ctrl.signal });
        if (!resp.ok) { setSseStatus("disconnected"); return; }
        setSseStatus("connected");
        const reader  = resp.body.getReader();
        const dec     = new TextDecoder();
        let buf = "", evt = "message";
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const l of lines) {
            if (l.startsWith("event: ")) { evt = l.slice(7).trim(); continue; }
            if (l.startsWith("data: ")) {
              try {
                const d = JSON.parse(l.slice(6));
                if (evt === "server_error") setServerErrors((p) => [d, ...p].slice(0,500));
                if (evt === "request")      setBackendReqs((p)  => [d, ...p].slice(0,1000));
                if (evt === "errors_cleared") setServerErrors([]);
              } catch {}
              evt = "message";
            }
          }
        }
      } catch { if (!cancelled) setSseStatus("disconnected"); }
    })();
    return () => { cancelled = true; ctrl.abort(); setSseStatus("disconnected"); };
  }, [token]);

  // ── Periodic data fetches ──────────────────────────────────────────
  const fetchHealth = async () => {
    try { const r = await fetch(`${API}/devpanel/health`, { headers }); if (r.ok) setHealth(await r.json()); } catch {}
  };
  const fetchStats = async () => {
    try { const r = await fetch(`${API}/devpanel/stats`, { headers }); if (r.ok) setStats(await r.json()); } catch {}
  };
  const fetchAdmins = async () => {
    try { const r = await fetch(`${API}/devpanel/admins`, { headers }); if (r.ok) setAdmins((await r.json()).admins || []); } catch {}
  };
  const fetchCustomers = async (p = 1, q = "") => {
    try {
      const r = await fetch(`${API}/devpanel/customers?page=${p}&limit=50&q=${encodeURIComponent(q)}`, { headers });
      if (r.ok) { const d = await r.json(); setCustomers({ data: d.customers, total: d.total, page: d.page, pages: d.pages }); }
    } catch {}
  };
  const fetchWorkers = async (p = 1, q = "") => {
    try {
      const r = await fetch(`${API}/devpanel/workers?page=${p}&limit=50&q=${encodeURIComponent(q)}`, { headers });
      if (r.ok) { const d = await r.json(); setWorkers({ data: d.workers, total: d.total, page: d.page, pages: d.pages }); }
    } catch {}
  };

  useEffect(() => {
    fetchHealth(); fetchStats(); fetchAdmins(); fetchCustomers(); fetchWorkers(); fetchServerStatus();
    // Load initial buffered data
    (async () => {
      try {
        const [eR, rR] = await Promise.all([
          fetch(`${API}/devpanel/errors`,   { headers }),
          fetch(`${API}/devpanel/requests`, { headers }),
        ]);
        if (eR.ok) setServerErrors((await eR.json()).errors  || []);
        if (rR.ok) setBackendReqs ((await rR.json()).requests || []);
      } catch {}
    })();
    const id = setInterval(() => { fetchHealth(); fetchStats(); }, 30000);
    return () => clearInterval(id);
  }, []);

  const clearErrors = async () => {
    try { await fetch(`${API}/devpanel/errors`, { method: "DELETE", headers }); } catch {}
    setServerErrors([]);
  };

  const toggleMaintenance = async (val) => {
    setMaintLoading(true);
    try {
      await fetch(`${API}/devpanel/server/maintenance`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ enabled: val }) });
      setMaintenance(val);
    } catch {}
    setMaintLoading(false);
  };

  const restartServer = async () => {
    if (!confirm("This will restart the server process. PM2 will bring it back up. Continue?")) return;
    setRestartCount((c) => c + 1);
    try { await fetch(`${API}/devpanel/server/restart`, { method: "POST", headers }); } catch {}
  };

  const fetchServerStatus = async () => {
    try {
      const r = await fetch(`${API}/devpanel/server/status`, { headers });
      if (r.ok) { const d = await r.json(); setMaintenance(d.maintenance); }
    } catch {}
  };

  const openCustomerDetail = async (c) => {
    try {
      const r = await fetch(`${API}/devpanel/customers/${c._id}/detail`, { headers });
      if (r.ok) { const d = await r.json(); setDetail({ type: "customer", data: d.customer, bookings: d.bookings }); }
    } catch {}
  };

  const openWorkerDetail = async (w) => {
    try {
      const r = await fetch(`${API}/devpanel/workers/${w._id}/detail`, { headers });
      if (r.ok) { const d = await r.json(); setDetail({ type: "worker", data: d.worker, bookings: d.bookings }); }
    } catch {}
  };

  // ── Filtered frontend log ──────────────────────────────────────────
  const filtered = frontendLog.filter((e) => {
    if (mFilter !== "ALL" && e.method !== mFilter) return false;
    if (sFilter !== "ALL") {
      if (sFilter === "2xx" && !(e.status>=200 && e.status<300)) return false;
      if (sFilter === "4xx" && !(e.status>=400 && e.status<500)) return false;
      if (sFilter === "5xx" && !(e.status>=500)) return false;
      if (sFilter === "ERR" && e.status !== 0) return false;
    }
    if (urlFilter && !e.url.toLowerCase().includes(urlFilter.toLowerCase())) return false;
    return true;
  });

  const hasErrors  = serverErrors.some((e) => e.level === "error" || e.level === "fatal");
  const activePage = NAV.find((n) => n.id === page);

  // ── Admin action helpers ───────────────────────────────────────────
  const deleteAdmin = async (id) => {
    if (!confirm("Delete this admin account?")) return;
    await fetch(`${API}/devpanel/admins/${id}`, { method: "DELETE", headers });
    fetchAdmins();
  };
  const deleteCustomer = async (id) => {
    if (!confirm("Delete this customer account? This is permanent.")) return;
    await fetch(`${API}/devpanel/customers/${id}`, { method: "DELETE", headers });
    fetchCustomers(customers.page, search);
  };
  const deleteWorker = async (id) => {
    if (!confirm("Delete this worker account? This is permanent.")) return;
    await fetch(`${API}/devpanel/workers/${id}`, { method: "DELETE", headers });
    fetchWorkers(workers.page, search);
  };

  return (
    <div className="min-h-screen bg-[#040807] flex" style={{fontFamily:"'Fira Mono','Consolas',monospace"}}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div className="w-56 shrink-0 border-r border-white/5 bg-[#050A07] flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Terminal size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-black text-white">DevPanel</p>
              <p className="text-[9px] text-white/25 leading-none">cleaniq · restricted</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map((n) => {
            const Icon  = n.icon;
            const badge = n.id === "errors" ? serverErrors.length : n.id === "admins" ? admins.length : n.id === "monitor" ? frontendLog.length : 0;
            const alert = n.id === "errors" && hasErrors;
            return (
              <button key={n.id} onClick={() => setPage(n.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] transition-all ${page === n.id ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "text-white/35 hover:text-white/65 hover:bg-white/[0.03] border border-transparent"}`}>
                <Icon size={13} />
                <span className="flex-1">{n.label}</span>
                {badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${alert ? "bg-rose-500/25 text-rose-400" : "bg-white/8 text-white/35"}`}>
                    {badge > 999 ? "999+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 px-3 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full ${sseStatus === "connected" ? "bg-emerald-400 animate-pulse" : sseStatus === "connecting" ? "bg-amber-400" : "bg-white/20"}`} />
            <span className="text-[9px] text-white/25">{sseStatus}</span>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-white/30 hover:text-rose-400 hover:bg-rose-500/5 transition-all border border-transparent">
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="border-b border-white/5 px-6 py-3.5 flex items-center gap-3">
          {activePage && <activePage.icon size={14} className="text-white/40" />}
          <h2 className="text-[13px] font-bold text-white/80">{activePage?.label}</h2>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-white/25">
            {sseStatus === "connected"
              ? <><Wifi size={11} className="text-emerald-400" /><span className="text-emerald-400">Live stream connected</span></>
              : <><WifiOff size={11} /><span>Stream offline</span></>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* ══ OVERVIEW ══════════════════════════════════════════ */}
          {page === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Admin Accounts" value={stats?.admins} color="text-emerald-400" sub="active staff logins" />
                <StatCard label="Customers" value={stats?.customers?.toLocaleString()} color="text-sky-400" sub="registered accounts" />
                <StatCard label="Workers" value={stats?.workers} color="text-purple-400" sub="active workforce" />
                <StatCard label="Total Bookings" value={stats?.bookings?.toLocaleString()} color="text-amber-400" sub="all time" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard label="Completed Revenue" value={stats ? gbp(stats.revenue) : "—"} color="text-emerald-300" sub="from completed bookings" />
                <StatCard label="Server Errors" value={stats?.recentErrors} color={stats?.recentErrors > 0 ? "text-rose-400" : "text-white"} sub={stats?.fatalErrors > 0 ? `${stats.fatalErrors} fatal` : "no fatal errors"} />
                <StatCard label="Uptime" value={stats ? fmtUptime(stats.uptime) : "—"} color="text-emerald-400/70" sub="server process" />
              </div>
              {/* DB + SSE status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                  <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-3">Database</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${health?.db?.state === "connected" ? "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" : "bg-rose-400"}`} />
                    <span className="text-sm font-bold text-white capitalize">{health?.db?.state || "—"}</span>
                    {health?.db?.pingMs != null && <span className="ml-auto text-[10px] text-white/35 tabular-nums">{health.db.pingMs}ms ping</span>}
                  </div>
                  <p className="text-[10px] text-white/25 mt-2">{health?.db?.host || "—"}</p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                  <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-3">Live Stream</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${sseStatus === "connected" ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
                    <span className="text-sm font-bold text-white capitalize">{sseStatus}</span>
                    {health && <span className="ml-auto text-[10px] text-white/35">{health.activeClients} client{health.activeClients !== 1 ? "s" : ""}</span>}
                  </div>
                  <p className="text-[10px] text-white/25 mt-2">{backendReqs.length} backend requests · {serverErrors.length} errors in buffer</p>
                </div>
              </div>
            </div>
          )}

          {/* ══ FRONTEND MONITOR ════════════════════════════════ */}
          {page === "monitor" && (
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {["ALL","GET","POST","PUT","PATCH","DELETE"].map((m) => (
                  <button key={m} onClick={() => setMFilter(m)}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${mFilter===m?"bg-emerald-500/20 border-emerald-500/40 text-emerald-400":"bg-white/4 border-white/8 text-white/30 hover:text-white/60"}`}>
                    {m}
                  </button>
                ))}
                <span className="w-px h-3.5 bg-white/10 mx-0.5" />
                {[["ALL","All"],["2xx","2xx"],["4xx","4xx"],["5xx","5xx"],["ERR","Err"]].map(([v,l]) => (
                  <button key={v} onClick={() => setSFilter(v)}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${sFilter===v?"bg-emerald-500/20 border-emerald-500/40 text-emerald-400":"bg-white/4 border-white/8 text-white/30 hover:text-white/60"}`}>
                    {l}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <input value={urlFilter} onChange={(e) => setUrlFilter(e.target.value)}
                    placeholder="filter url…"
                    className="px-2.5 py-1.5 rounded-lg border border-white/8 bg-white/4 text-[10px] text-white placeholder:text-white/18 focus:outline-none focus:border-emerald-500/40 w-32" />
                  <button onClick={() => { clearLog(); setFrontendLog([]); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/8 text-[9px] text-rose-400 hover:bg-rose-500/15 font-bold transition-all">
                    <Trash2 size={10} /> Clear
                  </button>
                </div>
              </div>
              {filtered.length === 0
                ? <div className="py-20 text-center text-white/15 text-[11px]"><Terminal size={24} className="mx-auto mb-3 opacity-20" /><p>No requests yet — make any admin call</p></div>
                : <div className="space-y-0.5 text-[10px]">
                    {filtered.map((e) => (
                      <div key={e.id}>
                        <button onClick={() => toggle(e.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors ${expanded===e.id?"bg-white/[0.05]":"hover:bg-white/[0.02]"} ${e.pending?"opacity-40":""}`}>
                          <span className="text-white/20 w-14 shrink-0 tabular-nums">{fmtTime(e.timestamp)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${methodCls(e.method)}`}>{e.method}</span>
                          <span className="flex-1 text-white/50 truncate">{shortUrl(e.url)}</span>
                          <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold shrink-0 ${statusCls(e.status)}`}>{e.pending?"···":(e.status||"ERR")}</span>
                          <span className={`w-12 text-right tabular-nums shrink-0 ${durCls(e.duration)}`}>{fmtMs(e.duration)}</span>
                          {expanded===e.id?<ChevronUp size={10} className="text-white/20 shrink-0"/>:<ChevronDown size={10} className="text-white/12 shrink-0"/>}
                        </button>
                        {expanded===e.id && (
                          <div className="mx-3 mb-1 rounded-lg border border-white/5 bg-black/20 p-3 space-y-2 text-[9px]">
                            <p className="text-white/35 break-all"><span className="text-white/50">URL: </span>{e.url}</p>
                            {e.error      && <p className="text-rose-400"><span className="text-white/40">Error: </span>{e.error}</p>}
                            {e.reqBody    && <div><p className="text-white/30 mb-1">Request:</p><pre className="text-white/40 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">{typeof e.reqBody==="string"?e.reqBody:JSON.stringify(e.reqBody)}</pre></div>}
                            {e.resBody    && <div><p className="text-white/30 mb-1">Response:</p><pre className="text-white/40 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">{e.resBody}</pre></div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* ══ BACKEND REQUESTS ════════════════════════════════ */}
          {page === "backend" && (
            <div>
              <p className="text-[10px] text-white/25 mb-4">All HTTP requests hitting Express — streams live via SSE</p>
              {backendReqs.length === 0
                ? <div className="py-20 text-center text-white/15 text-[11px]"><Activity size={24} className="mx-auto mb-3 opacity-20" /><p>No requests yet</p></div>
                : <div className="space-y-0.5 text-[10px]">
                    {backendReqs.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.02]">
                        <span className="text-white/20 w-14 shrink-0 tabular-nums">{fmtTime(e.timestamp)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${methodCls(e.method)}`}>{e.method}</span>
                        <span className="flex-1 text-white/50 truncate">{e.url}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold shrink-0 ${statusCls(e.status)}`}>{e.status}</span>
                        <span className={`w-12 text-right tabular-nums shrink-0 ${durCls(e.duration)}`}>{fmtMs(e.duration)}</span>
                        {e.ip && <span className="text-white/15 shrink-0 text-[9px]">{e.ip}</span>}
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* ══ SERVER ERRORS ═══════════════════════════════════ */}
          {page === "errors" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] text-white/25">Uncaught exceptions · console.error · Express errors</p>
                {serverErrors.length > 0 && (
                  <button onClick={clearErrors}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/8 text-[9px] text-rose-400 hover:bg-rose-500/15 font-bold transition-all">
                    <Trash2 size={10} /> Clear all
                  </button>
                )}
              </div>
              {serverErrors.length === 0
                ? <div className="py-20 text-center"><CheckCircle2 size={28} className="mx-auto text-emerald-500/25 mb-3"/><p className="text-white/15 text-[11px]">No errors · all clean</p></div>
                : <div className="space-y-2">
                    {serverErrors.map((e) => (
                      <div key={e.id} className={`rounded-xl border p-3 ${e.level==="fatal"?"border-rose-600/30 bg-rose-600/5":e.level==="error"?"border-rose-500/20 bg-rose-500/[0.03]":"border-amber-500/20 bg-amber-500/[0.03]"}`}>
                        <div className="flex items-start gap-2">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 uppercase ${levelCls(e.level)}`}>{e.level||"info"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-white/20 mb-1">{fmtTime(e.timestamp)} · {e.type}</p>
                            <p className="text-[10px] text-white/65 break-all leading-relaxed">{e.message}</p>
                            {e.url && <p className="text-[9px] text-white/20 mt-1">{e.method} {e.url}</p>}
                            {e.stack && (
                              <button onClick={() => toggle(e.id)} className="flex items-center gap-0.5 text-[9px] text-white/20 hover:text-white/40 mt-1.5 transition-colors">
                                {expanded===e.id?<ChevronUp size={9}/>:<ChevronDown size={9}/>} stack trace
                              </button>
                            )}
                            {expanded===e.id && e.stack && (
                              <pre className="mt-2 text-[9px] text-white/25 bg-black/25 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-36 overflow-y-auto">{e.stack}</pre>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* ══ HEALTH ══════════════════════════════════════════ */}
          {page === "health" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={fetchHealth} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 bg-white/4 text-[9px] text-white/40 hover:text-white/70 font-bold transition-all">
                  <RefreshCw size={10} /> Refresh
                </button>
              </div>
              {!health
                ? <div className="py-20 text-center text-white/15 text-[11px]"><Heart size={24} className="mx-auto mb-3 opacity-20 animate-pulse"/><p>Loading…</p></div>
                : <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                        <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-3">Database</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full ${health.db.state==="connected"?"bg-emerald-400":"bg-rose-400"}`}/>
                          <span className="text-sm font-bold text-white capitalize">{health.db.state}</span>
                          {health.db.pingMs!=null && <span className="ml-auto text-[9px] text-white/30 tabular-nums">{health.db.pingMs}ms</span>}
                        </div>
                        <div className="text-[9px] text-white/25 space-y-0.5">
                          <p>Name: {health.db.name||"—"}</p><p>Host: {health.db.host||"—"}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                        <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-3">Server</p>
                        <p className="text-sm font-bold text-emerald-400 mb-2">{fmtUptime(health.uptime)}</p>
                        <div className="text-[9px] text-white/25 space-y-0.5">
                          <p>Node {health.nodeVersion}</p><p>{health.platform}</p><p>{health.activeClients} SSE client{health.activeClients!==1?"s":""}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                        <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-3">Buffers</p>
                        {[["Requests",health.buffered?.requests||0,1000,"bg-sky-500"],["Errors",health.buffered?.errors||0,500,"bg-rose-500"]].map(([l,v,mx,c])=>(
                          <div key={l} className="mb-2">
                            <div className="flex justify-between text-[9px] text-white/25 mb-1"><span>{l}</span><span className="tabular-nums">{v}/{mx}</span></div>
                            <div className="h-1 rounded-full bg-white/5"><div className={`h-full rounded-full ${c}`} style={{width:`${Math.min(100,(v/mx)*100)}%`}}/></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                      <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-3">Memory</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[["RSS",health.memory.rss,"bg-sky-500"],["Heap Used",health.memory.heapUsed,"bg-emerald-500"],["Heap Total",health.memory.heapTotal,"bg-emerald-500/40"],["External",health.memory.external,"bg-purple-500"]].map(([l,b,c])=>(
                          <div key={l} className="bg-black/15 rounded-xl p-3">
                            <p className="text-[9px] text-white/25 mb-1">{l}</p>
                            <p className="text-sm font-bold text-white tabular-nums">{fmtMem(b)}</p>
                            <div className="mt-2 h-1 rounded-full bg-white/5"><div className={`h-full rounded-full ${c}`} style={{width:`${Math.min(100,b/1024/1024/1.5)}%`}}/></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                      <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">Raw</p>
                      <pre className="text-[9px] text-white/25 overflow-x-auto max-h-40 overflow-y-auto">{JSON.stringify(health,null,2)}</pre>
                    </div>
                  </>
              }
            </div>
          )}

          {/* ══ ADMIN ACCOUNTS ══════════════════════════════════ */}
          {page === "admins" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] text-white/25">{admins.length} admin account{admins.length!==1?"s":""}</p>
                <button onClick={() => setModal({ type: "newAdmin" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-[9px] text-emerald-400 hover:bg-emerald-500/25 font-bold transition-all">
                  <UserPlus size={11} /> New Admin
                </button>
              </div>
              <div className="space-y-2">
                {admins.map((a) => (
                  <div key={a._id} className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-black text-emerald-400">{(a.username||"A")[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white">{a.username}</p>
                      <p className="text-[9px] text-white/30">{a.email || "no email"} · <span className={a.role==="superadmin"?"text-emerald-400/70":"text-amber-400/70"}>{a.role}</span></p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-white/25 shrink-0">
                      <span>Last login: {a.lastLoginAt ? fmtDate(a.lastLoginAt) : "never"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setModal({ type: "resetPassword", admin: a })}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/8 bg-white/4 text-[9px] text-white/35 hover:text-amber-400 hover:border-amber-500/20 transition-all">
                        <KeyRound size={9} /> Reset pw
                      </button>
                      <button onClick={() => deleteAdmin(a._id)}
                        className="p-1.5 rounded-lg border border-white/5 text-white/20 hover:text-rose-400 hover:border-rose-500/20 transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CUSTOMERS ════════════════════════════════════════ */}
          {page === "customers" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input value={search} onChange={(e) => { setSearch(e.target.value); fetchCustomers(1, e.target.value); }}
                    placeholder="Search name or email…"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-white/8 bg-white/4 text-[10px] text-white placeholder:text-white/18 focus:outline-none focus:border-emerald-500/40" />
                </div>
                <p className="text-[10px] text-white/25 ml-auto">{customers.total.toLocaleString()} total</p>
              </div>
              <div className="space-y-1">
                {customers.data.map((c) => (
                  <div key={c._id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => openCustomerDetail(c)}>
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-sky-400">{(c.name||"?")[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white/80">{c.name}</p>
                      <p className="text-[9px] text-white/30">{c.email} {c.phone ? `· ${c.phone}` : ""}</p>
                    </div>
                    <span className="text-[9px] text-white/20 shrink-0">{fmtDate(c.createdAt)}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteCustomer(c._id); }} className="p-1 text-white/15 hover:text-rose-400 transition-colors shrink-0"><Trash2 size={11}/></button>
                  </div>
                ))}
              </div>
              {customers.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => fetchCustomers(customers.page - 1, search)} disabled={customers.page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-white/8 text-[9px] text-white/35 hover:text-white/60 disabled:opacity-25 transition-all">← Prev</button>
                  <span className="text-[9px] text-white/25">{customers.page} / {customers.pages}</span>
                  <button onClick={() => fetchCustomers(customers.page + 1, search)} disabled={customers.page >= customers.pages}
                    className="px-3 py-1.5 rounded-lg border border-white/8 text-[9px] text-white/35 hover:text-white/60 disabled:opacity-25 transition-all">Next →</button>
                </div>
              )}
            </div>
          )}

          {/* ══ WORKERS ══════════════════════════════════════════ */}
          {page === "workers" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input value={search} onChange={(e) => { setSearch(e.target.value); fetchWorkers(1, e.target.value); }}
                    placeholder="Search name or email…"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-white/8 bg-white/4 text-[10px] text-white placeholder:text-white/18 focus:outline-none focus:border-emerald-500/40" />
                </div>
                <p className="text-[10px] text-white/25 ml-auto">{workers.total.toLocaleString()} total</p>
              </div>
              <div className="space-y-1">
                {workers.data.map((w) => (
                  <div key={w._id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => openWorkerDetail(w)}>
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-purple-400">{(w.name||"?")[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white/80">{w.name}</p>
                      <p className="text-[9px] text-white/30">{w.email} {w.status ? `· ${w.status}` : ""}</p>
                    </div>
                    {w.rating && <span className="text-[9px] text-amber-400 shrink-0">★ {Number(w.rating).toFixed(1)}</span>}
                    <span className="text-[9px] text-white/20 shrink-0">{fmtDate(w.createdAt)}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteWorker(w._id); }} className="p-1 text-white/15 hover:text-rose-400 transition-colors shrink-0"><Trash2 size={11}/></button>
                  </div>
                ))}
              </div>
              {workers.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => fetchWorkers(workers.page - 1, search)} disabled={workers.page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-white/8 text-[9px] text-white/35 hover:text-white/60 disabled:opacity-25 transition-all">← Prev</button>
                  <span className="text-[9px] text-white/25">{workers.page} / {workers.pages}</span>
                  <button onClick={() => fetchWorkers(workers.page + 1, search)} disabled={workers.page >= workers.pages}
                    className="px-3 py-1.5 rounded-lg border border-white/8 text-[9px] text-white/35 hover:text-white/60 disabled:opacity-25 transition-all">Next →</button>
                </div>
              )}
            </div>
          )}

          {/* ══ SERVER CONTROL ══════════════════════════════════ */}
          {page === "server" && (
            <div className="space-y-5 max-w-2xl">
              {/* Maintenance mode */}
              <div className={`rounded-2xl border p-5 ${maintenance ? "border-amber-500/30 bg-amber-500/5" : "border-white/6 bg-white/[0.02]"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black text-white mb-1">Maintenance Mode</p>
                    <p className="text-[10px] text-white/35">
                      When ON, all API traffic returns 503. Only the devpanel endpoint remains active.
                      Use this before deployments or emergency stops.
                    </p>
                    {maintenance && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] text-amber-400 font-bold">Server is in maintenance mode — all client requests are blocked</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleMaintenance(!maintenance)}
                    disabled={maintLoading}
                    className={`shrink-0 w-12 h-6 rounded-full border transition-all relative ${maintenance ? "bg-amber-500 border-amber-400" : "bg-white/10 border-white/15"} disabled:opacity-40`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${maintenance ? "left-6 bg-black" : "left-0.5 bg-white/50"}`} />
                  </button>
                </div>
              </div>

              {/* Restart */}
              <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
                <p className="text-[11px] font-black text-white mb-1">Restart Server Process</p>
                <p className="text-[10px] text-white/35 mb-4">
                  Sends exit(0) to the Node process. PM2 will automatically restart it.
                  All in-memory buffers (errors, request log) will be cleared on restart.
                </p>
                <button onClick={restartServer}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-400 hover:bg-rose-500/20 font-bold transition-all">
                  <RefreshCw size={12} /> Restart Server
                  {restartCount > 0 && <span className="text-rose-300/50">(restarted {restartCount}×)</span>}
                </button>
              </div>

              {/* Status quick view */}
              <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-3">Current Status</p>
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <p className="text-white/25 mb-0.5">DB</p>
                    <p className={`font-bold ${health?.db?.state === "connected" ? "text-emerald-400" : "text-rose-400"}`}>{health?.db?.state || "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/25 mb-0.5">Uptime</p>
                    <p className="font-bold text-white">{health ? fmtUptime(health.uptime) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/25 mb-0.5">SSE Clients</p>
                    <p className="font-bold text-white">{health?.activeClients ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/25 mb-0.5">Errors in Buffer</p>
                    <p className={`font-bold ${serverErrors.length > 0 ? "text-rose-400" : "text-white"}`}>{serverErrors.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      {modal && <Modal modal={modal} onClose={() => setModal(null)} token={token} onDone={() => { setModal(null); fetchAdmins(); }} />}

      {/* ── Detail slide-over ─────────────────────────────────────── */}
      {detail && <DetailPanel detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// ── Detail slide-over (customer / worker with bookings) ──────────────────────
function DetailPanel({ detail, onClose }) {
  const { type, data: d, bookings } = detail;
  const isWorker = type === "worker";

  const statusColor = (s = "") => {
    if (s === "Completed") return "text-emerald-400";
    if (s === "Confirmed") return "text-sky-400";
    if (s === "Pending") return "text-amber-400";
    if (s === "Cancelled") return "text-rose-400";
    return "text-white/50";
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{fontFamily:"'Fira Mono','Consolas',monospace"}}>
      <button className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-[#060D09] border-l border-white/8 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isWorker ? "bg-purple-500/10" : "bg-sky-500/10"}`}>
            <span className={`text-sm font-black ${isWorker ? "text-purple-400" : "text-sky-400"}`}>{(d?.name||"?")[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-white">{d?.name}</p>
            <p className="text-[10px] text-white/30">{d?.email} {d?.phone ? `· ${d.phone}` : ""}</p>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60"><X size={15}/></button>
        </div>

        {/* Profile details */}
        <div className="px-5 py-3 border-b border-white/5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
            {isWorker && d?.status && <div><span className="text-white/25">Status </span><span className={`font-bold ${d.status === "Active" ? "text-emerald-400" : "text-amber-400"}`}>{d.status}</span></div>}
            {isWorker && d?.rating  && <div><span className="text-white/25">Rating </span><span className="font-bold text-amber-400">★ {Number(d.rating).toFixed(1)}</span></div>}
            {d?.createdAt && <div><span className="text-white/25">Joined </span><span className="text-white/60">{fmtDate(d.createdAt)}</span></div>}
            {d?._id && <div className="col-span-2 truncate"><span className="text-white/25">ID </span><span className="text-white/30">{d._id}</span></div>}
          </div>
        </div>

        {/* Bookings */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest">
              {isWorker ? "Assigned Jobs" : "Bookings"} ({bookings?.length ?? 0})
            </p>
          </div>
          {!bookings?.length ? (
            <div className="py-10 text-center text-white/15 text-[10px]">No bookings found</div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {bookings.map((b, i) => (
                <div key={b._id || i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-[10px] font-bold text-white/80">{b.bookingId || b._id?.toString().slice(-8)}</p>
                    <span className={`text-[9px] font-bold shrink-0 ${statusColor(b.status)}`}>{b.status}</span>
                  </div>
                  {b.service?.name && <p className="text-[9px] text-white/40 mb-0.5">{b.service.name}</p>}
                  {(b.schedule?.date || b.schedule?.timeSlot) && (
                    <p className="text-[9px] text-white/25">
                      {b.schedule?.date ? fmtDate(b.schedule.date) : ""} {b.schedule?.timeSlot || ""}
                    </p>
                  )}
                  {b.payment?.amount && (
                    <p className="text-[9px] text-emerald-400/70 font-bold mt-0.5">£{Number(b.payment.amount).toFixed(2)}</p>
                  )}
                  {!isWorker && b.customer?.name && (
                    <p className="text-[9px] text-white/20 mt-0.5">{b.customer.name} · {b.customer.email}</p>
                  )}
                  {isWorker && b.customer && (
                    <p className="text-[9px] text-white/20 mt-0.5">{b.customer?.name || b.customer?.email || ""}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal (new admin / reset password) ───────────────────────────────────────
function Modal({ modal, onClose, token, onDone }) {
  const [form,    setForm]    = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [show,    setShow]    = useState(false);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (modal.type === "newAdmin") {
        const res = await fetch(`${API}/devpanel/admins`, { method: "POST", headers, body: JSON.stringify(form) });
        const d   = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed");
        onDone();
      } else if (modal.type === "resetPassword") {
        const res = await fetch(`${API}/devpanel/admins/${modal.admin._id}/password`, { method: "PUT", headers, body: JSON.stringify({ newPassword: form.newPassword }) });
        const d   = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed");
        onDone();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#060D09] p-6 shadow-2xl" style={{fontFamily:"'Fira Mono','Consolas',monospace"}}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[12px] font-bold text-white">
            {modal.type === "newAdmin" ? "New Admin Account" : `Reset Password — ${modal.admin?.username}`}
          </h3>
          <button onClick={onClose} className="text-white/25 hover:text-white/60"><X size={14}/></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {modal.type === "newAdmin" && (
            <>
              <input onChange={set("username")} placeholder="Username" required
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40" />
              <input onChange={set("email")} placeholder="Email (optional)" type="email"
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40" />
              <select onChange={set("role")} defaultValue="superadmin"
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#060D09] text-[11px] text-white focus:outline-none focus:border-emerald-500/40">
                <option value="superadmin">superadmin</option>
                <option value="restricted">restricted</option>
              </select>
            </>
          )}
          <div className="relative">
            <input type={show?"text":"password"} onChange={set(modal.type==="newAdmin"?"password":"newPassword")}
              placeholder={modal.type==="newAdmin"?"Password (min 6 chars)":"New password (min 6 chars)"}
              required className="w-full px-3 py-2.5 pr-9 rounded-xl border border-white/10 bg-white/5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40" />
            <button type="button" onClick={() => setShow((v)=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
              {show?<EyeOff size={13}/>:<Eye size={13}/>}
            </button>
          </div>
          {error && <p className="text-[10px] text-rose-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/8 text-[10px] text-white/35 hover:text-white/60 transition-all">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-[10px] font-black transition-all">
              {loading ? "…" : modal.type==="newAdmin" ? "Create" : "Reset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT — handles login gate
// ═════════════════════════════════════════════════════════════════════════════
export default function DevPanel() {
  const [token, setToken] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) || ""; } catch { return ""; }
  });

  const handleLogin = (t) => {
    try { sessionStorage.setItem(SESSION_KEY, t); } catch {}
    setToken(t);
  };

  const handleLogout = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setToken("");
  };

  if (!token) return <LoginScreen onLogin={handleLogin} />;
  return <DevPanelMain token={token} onLogout={handleLogout} />;
}
