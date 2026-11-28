import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { api, REPLY_CATS } from "./coldApi";
import { Funnel, FunnelNote, DailyChart, RateTable, Spinner } from "./parts";

// Everything across all campaigns: the funnel, the last 30 days, and which campaign / mailbox does best.
export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try { setData(await api("/analytics")); setErr(""); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }
  useEffect(() => { load(); }, []);

  if (!data && !err) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (err) return <p className="text-rose-400 text-sm">{err}</p>;

  const cats = Object.entries(data.replyCategories || {}).sort((a, b) => b[1] - a[1]);
  const catTotal = cats.reduce((n, [, v]) => n + v, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-black text-lg">How your emails are doing</h2>
          <p className="text-white/40 text-xs">All campaigns together. Updates every few minutes.</p>
        </div>
        <button onClick={load} disabled={busy} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.07] text-white/60 text-xs font-bold hover:bg-white/10 cursor-pointer disabled:opacity-50">
          <RefreshCw size={13} className={busy ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <Funnel f={data.total} />
      <FunnelNote f={data.total} />
      <DailyChart days={data.daily} />

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <RateTable
          title="By campaign (click to open)"
          rows={data.campaigns}
          onRow={(r) => navigate(`/admin/cold-email/${r.key}`)}
        />
        {cats.length > 0 && (
          <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">What people replied</p>
            <div className="space-y-2.5">
              {cats.map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">{REPLY_CATS[k]?.label || k}</span>
                    <span className="text-white/40">{v}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400/70 rounded-full" style={{ width: `${(v / catTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <RateTable title="By mailbox" rows={data.mailboxes} nameKey="email" />
    </div>
  );
}
