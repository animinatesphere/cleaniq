import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Lock } from "lucide-react";
import { api, when } from "./coldApi";
import { Spinner } from "./parts";

// Like Apollo's "Sending protection": a summary, the rules (who gets emailed, sending safeguards),
// domain protection at a glance, and the bounce log.
export default function Protection({ onGoDomains }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api("/protection")); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(patch) {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    try {
      const settings = await api("/protection", { method: "PUT", body: JSON.stringify(patch) });
      setData((d) => ({ ...d, settings }));
      setSaved(true); setTimeout(() => setSaved(false), 1500);
    } catch (e) { setErr(e.message); }
  }

  if (!data) return <div className="flex justify-center py-16">{err ? <p className="text-rose-400 text-sm">{err}</p> : <Spinner />}</div>;
  const s = data.settings;
  const sum = data.summary;
  const domainsOk = data.domains.filter((d) => d.checked && !d.checks.some((c) => c.level === "bad")).length;
  const whoOn = [true, s.skipRisky, s.oneCampaignAtATime, s.companySpacingHours > 0].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-white font-black text-lg flex items-center gap-2">Sending protection {saved && <span className="text-emerald-400 text-xs font-semibold">· saved</span>}</h2>
          <p className="text-white/40 text-xs">Rules that keep your emails out of junk and protect your domain's reputation. They apply to every campaign.</p>
        </div>
      </div>

      <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl p-4">
        <p className="text-white/70 text-sm font-bold flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-400" /> Protection summary <span className="text-white/30 font-normal text-xs">last 30 days</span></p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
          <Num label="Can't-receive emails skipped" value={sum.invalidSkipped} />
          <Num label="Risky addresses held back" value={sum.riskyHeld} />
          <Num label="Already in another campaign" value={sum.otherCampaign} />
          <Num label="Spaced out (same company)" value={sum.spacedOut} />
          <Num label="Auto-paused" value={sum.autoPaused} warn={sum.autoPaused > 0} />
        </div>
      </div>

      <Section title="Domain protection" count={`${domainsOk}/${data.domains.length} OK`} desc="Proves your emails really come from you (SPF, DKIM, DMARC), so they don't go to spam.">
        {data.domains.length === 0 ? (
          <p className="text-white/35 text-sm">No mailboxes connected yet.</p>
        ) : (
          <div className="space-y-2">
            {data.domains.map((d) => (
              <div key={d.domain} className="flex items-center gap-3 flex-wrap bg-white/[0.025] rounded-xl px-3.5 py-2.5">
                <span className="text-white/85 text-sm font-semibold flex-1 min-w-[160px]">{d.domain}</span>
                {!d.checked ? (
                  <span className="text-white/35 text-xs">Not checked</span>
                ) : (
                  d.checks.filter((c) => /spf|dkim|dmarc|mx/i.test(c.key)).map((c) => (
                    <span key={c.key} className={`flex items-center gap-1 text-[11px] font-bold ${c.level === "ok" ? "text-emerald-300" : c.level === "bad" ? "text-rose-300" : "text-amber-300"}`}>
                      {c.level === "ok" ? <CheckCircle2 size={12} /> : c.level === "bad" ? <XCircle size={12} /> : <AlertTriangle size={12} />}
                      {c.key.toUpperCase()}
                    </span>
                  ))
                )}
              </div>
            ))}
            <button onClick={onGoDomains} className="text-emerald-300 hover:text-emerald-200 text-xs font-bold cursor-pointer">Open Domains to check and see how to fix →</button>
          </div>
        )}
      </Section>

      <Section title="Who gets emailed" count={`${whoOn}/4 on`} desc="Avoids contacts that are likely to bounce, or emailing people too often.">
        <Rule locked on title="Skip addresses that can't receive email" desc="Checked automatically (no mail server, fake or throwaway addresses). Can be turned off per campaign." />
        <Rule on={s.skipRisky} onChange={(v) => save({ skipRisky: v })} title="Skip risky addresses" desc="Shared/role inboxes like info@, sales@, office@. They work, but rarely reply and complain more often." />
        <Rule on={s.oneCampaignAtATime} onChange={(v) => save({ oneCampaignAtATime: v })} title="One campaign at a time" desc={<>Don't start a new campaign on someone another campaign emailed in the last <NumIn value={s.oneCampaignDays} onSave={(v) => save({ oneCampaignDays: v })} /> days.</>} />
        <Rule on={s.companySpacingHours > 0} onChange={(v) => save({ companySpacingHours: v ? 24 : 0 })} title="Space out emails to the same company" desc={<>Only one first email per company (same email domain) every <NumIn value={s.companySpacingHours || 24} onSave={(v) => save({ companySpacingHours: v })} /> hours. Others at that company wait. Gmail/Outlook/Yahoo addresses aren't counted as one company.</>} />
      </Section>

      <Section title="Sending safeguards" count={`${s.autoPause ? 4 : 3}/4 on`} desc="Pauses sending automatically when something could hurt your reputation.">
        <Rule on={s.autoPause} onChange={(v) => save({ autoPause: v })} title="Auto-pause on high bounces" desc={<>Pause a mailbox or campaign when more than <NumIn value={s.maxBounceRate} step="0.5" onSave={(v) => save({ maxBounceRate: v })} />% of its emails bounce (after at least <NumIn value={s.minSendsBeforePause} onSave={(v) => save({ minSendsBeforePause: v })} /> sent, last 30 days).</>} />
        <Rule locked on title="Stop using a mailbox whose sign-in broke" desc="It's marked 'Reconnect needed' and its emails wait instead of failing." />
        <Rule locked on title="Warm-up and pacing" desc="New mailboxes start at 5 a day (+3 a day), one email every 4–9 minutes per mailbox." />
        <Rule locked on title="Business hours only" desc="Monday–Friday, 8am–6pm UK time." />
      </Section>

      <BounceLog />
    </div>
  );
}

const Num = ({ label, value, warn }) => (
  <div>
    <p className={`text-2xl font-black ${warn ? "text-amber-300" : "text-white"}`}>{value || 0}</p>
    <p className="text-white/40 text-[11px] leading-tight">{label}</p>
  </div>
);

function Section({ title, count, desc, children }) {
  return (
    <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-white font-bold text-sm flex items-center gap-2">{title} <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.07] text-white/55">{count}</span></p>
        <p className="text-white/40 text-xs mt-0.5">{desc}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Rule({ on, onChange, title, desc, locked }) {
  return (
    <div className="flex items-start gap-3 bg-white/[0.025] rounded-xl px-3.5 py-3">
      {locked ? (
        <span title="Always on" className="mt-0.5 w-9 h-5 rounded-full bg-emerald-500/40 flex items-center justify-center shrink-0"><Lock size={10} className="text-white" /></span>
      ) : (
        <button type="button" onClick={() => onChange(!on)} aria-pressed={on} className={`mt-0.5 w-9 h-5 rounded-full relative shrink-0 cursor-pointer transition-all ${on ? "bg-emerald-500" : "bg-white/15"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
        </button>
      )}
      <div>
        <p className={`text-sm font-semibold ${on ? "text-white" : "text-white/55"}`}>{title}{locked && <span className="text-white/30 text-[10px] font-normal ml-1.5">always on</span>}</p>
        <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// Small number box inside a sentence; saves when you leave it.
function NumIn({ value, onSave, step = "1" }) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);
  return (
    <input
      type="number" step={step} value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => Number(v) !== Number(value) && v !== "" && onSave(Number(v))}
      className="w-14 mx-1 bg-white/[0.08] border border-white/[0.12] rounded px-1.5 py-0.5 text-white text-xs text-center outline-none"
    />
  );
}

function BounceLog() {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    api(`/bounces?page=${page}${type ? `&type=${type}` : ""}`).then((d) => live && setData(d)).catch(() => live && setData({ bounces: [], total: 0 }));
    return () => { live = false; };
  }, [type, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / 50)) : 1;
  return (
    <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2 flex-wrap">
        <div>
          <p className="text-white font-bold text-sm">Bounce log</p>
          <p className="text-white/40 text-xs">Emails that couldn't be delivered, and why. Hard bounces are blocked from future emails automatically.</p>
        </div>
        <div className="flex gap-1.5">
          {[["", "All"], ["hard", "Hard"], ["soft", "Temporary"]].map(([k, l]) => (
            <button key={k} onClick={() => { setType(k); setPage(1); }} className={`text-xs px-2.5 py-1 rounded-lg font-bold cursor-pointer ${type === k ? "bg-emerald-500 text-white" : "bg-white/[0.05] text-white/45 hover:text-white/75"}`}>{l}</button>
          ))}
        </div>
      </div>
      {!data ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : data.bounces.length === 0 ? (
        <p className="text-white/35 text-sm px-4 py-8 text-center">No bounces. 🎉</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-white/30 uppercase tracking-wider text-left">
                <th className="px-4 py-2 font-bold">When</th>
                <th className="px-2 py-2 font-bold">Email</th>
                <th className="px-2 py-2 font-bold">Type</th>
                <th className="px-2 py-2 font-bold">Reason</th>
                <th className="px-2 py-2 font-bold">Campaign</th>
                <th className="px-4 py-2 font-bold">Sent from</th>
              </tr>
            </thead>
            <tbody>
              {data.bounces.map((b) => (
                <tr key={b._id} className="border-t border-white/[0.04] align-top">
                  <td className="px-4 py-2.5 text-white/45 text-xs whitespace-nowrap">{when(b.at)}</td>
                  <td className="px-2 py-2.5 text-white/80 text-xs">{b.contact?.email || "—"}</td>
                  <td className="px-2 py-2.5"><span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${b.type === "hard" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"}`}>{b.type === "hard" ? "Hard" : "Temporary"}</span></td>
                  <td className="px-2 py-2.5 text-white/55 text-xs max-w-[340px]">{b.reason}</td>
                  <td className="px-2 py-2.5 text-white/55 text-xs">{b.campaign}</td>
                  <td className="px-4 py-2.5 text-white/40 text-xs">{b.mailbox}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.05]">
          <span className="text-white/30 text-xs">{data.total} bounces · page {page} of {pages}</span>
          <div className="flex gap-1.5">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg bg-white/[0.05] text-white/50 text-xs disabled:opacity-30 cursor-pointer">Prev</button>
            <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg bg-white/[0.05] text-white/50 text-xs disabled:opacity-30 cursor-pointer">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
