import { useCallback, useEffect, useState } from "react";
import { Repeat, PauseCircle, PlayCircle, XCircle, RefreshCw, Search, CreditCard } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com/api";
const adminFetch = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};

const FILTERS = [
  { id: "", label: "All" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "pending_payment", label: "Awaiting first payment" },
  { id: "cancelled", label: "Cancelled" },
];
const STATUS = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  paused: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  pending_payment: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  cancelled: "bg-white/5 text-white/40 border-white/10",
};
const money = (n) => `£${Number(n || 0).toFixed(2)}`;
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" }) : "—");

// Regular cleans (subscriptions): first clean paid at booking, later cleans charged to the
// saved card 48 hours before each clean. Admin pause/resume/cancel never charges a fee (paid cleans are refunded in full).
export default function Subscriptions() {
  const [filter, setFilter] = useState("active");
  const [subs, setSubs] = useState(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setSubs(await adminFetch(`/subscriptions${filter ? `?status=${filter}` : ""}`));
    } catch (e) {
      setSubs([]);
      setMsg({ type: "error", text: e.message });
    }
  }, [filter]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const act = async (sub, action) => {
    const verb = { pause: "Pause", resume: "Resume", cancel: "Cancel" }[action];
    if (action !== "resume" && !window.confirm(`${verb} ${sub.subscriptionRef} for ${sub.customer?.firstName || "this customer"}? Upcoming unpaid cleans will be cancelled. No fee is charged when admin does this.`)) return;
    setBusyId(sub._id);
    setMsg({ type: "", text: "" });
    try {
      await adminFetch(`/subscriptions/${sub._id}/${action}`, { method: "POST" });
      setMsg({ type: "success", text: `${sub.subscriptionRef}: ${verb.toLowerCase()}d.` });
      await load();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setBusyId(null);
    }
  };

  const shown = (subs || []).filter((s) => {
    if (!q.trim()) return true;
    const hay = `${s.subscriptionRef} ${s.customer?.firstName} ${s.customer?.lastName} ${s.customer?.email} ${s.customer?.phone} ${s.service}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <Repeat size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Regular Cleans</h1>
            <p className="text-sm text-white/40">First clean paid at booking · later cleans charged to the saved card 48h before · retried 24h before · cancelled if unpaid 12h before</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/10">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${filter === f.id ? "bg-emerald-500 text-white border-transparent" : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"}`}>
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, ref…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50" />
        </div>
      </div>

      {msg.text && (
        <div className={`rounded-2xl p-4 text-sm border ${msg.type === "error" ? "bg-rose-500/10 border-rose-500/25 text-rose-300" : "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"}`}>
          {msg.text}
        </div>
      )}

      {subs === null ? (
        <div className="py-20 flex justify-center"><RefreshCw size={24} className="animate-spin text-emerald-400" /></div>
      ) : shown.length === 0 ? (
        <div className="py-16 text-center text-white/40 text-sm">No regular cleans here yet.</div>
      ) : (
        <div className="grid gap-3">
          {shown.map((s) => (
            <div key={s._id} className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-white">{s.customer?.firstName} {s.customer?.lastName}</p>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${STATUS[s.status] || STATUS.cancelled}`}>
                    {s.status === "pending_payment" ? "awaiting payment" : s.status}
                  </span>
                </div>
                <p className="text-xs text-white/40">{s.customer?.email} · {s.customer?.phone}</p>
              </div>
              <div className="min-w-[180px]">
                <p className="text-sm font-semibold text-white/80">{s.service}</p>
                <p className="text-xs text-white/40">{s.frequency} · {money(s.pricePerVisit)} per clean · {s.source}</p>
              </div>
              <div className="min-w-[140px]">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Next clean</p>
                <p className="text-sm font-semibold text-white/80">{s.status === "active" ? day(s.nextVisit?.schedule?.date) : "—"}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/40 min-w-[110px]">
                <CreditCard size={13} /> {s.status === "pending_payment" ? "No card yet" : "Card saved"}
              </div>
              <div className="flex gap-2 ml-auto">
                {s.status === "active" && (
                  <button disabled={busyId === s._id} onClick={() => act(s, "pause")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold disabled:opacity-50">
                    <PauseCircle size={13} /> Pause
                  </button>
                )}
                {s.status === "paused" && (
                  <button disabled={busyId === s._id} onClick={() => act(s, "resume")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold disabled:opacity-50">
                    <PlayCircle size={13} /> Resume
                  </button>
                )}
                {s.status !== "cancelled" && (
                  <button disabled={busyId === s._id} onClick={() => act(s, "cancel")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-bold disabled:opacity-50">
                    <XCircle size={13} /> Cancel
                  </button>
                )}
              </div>
              <p className="w-full text-[11px] text-white/25">Ref {s.subscriptionRef} · started {day(s.startDate)}{s.cancelledAt ? ` · cancelled ${day(s.cancelledAt)} by ${s.cancelledBy || "—"}` : ""}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
