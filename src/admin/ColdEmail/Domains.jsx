import { useEffect, useState } from "react";
import { Globe, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Mail, ChevronDown, Flame } from "lucide-react";
import { api, API } from "./coldApi";
import { Spinner } from "./parts";
import SmtpModal from "./SmtpModal";

const STATUS = {
  excellent: { label: "Excellent",       cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  good:      { label: "Good",            cls: "bg-lime-500/15 text-lime-300 border-lime-500/25" },
  attention: { label: "Needs attention", cls: "bg-rose-500/15 text-rose-300 border-rose-500/25" },
  unchecked: { label: "Not checked yet", cls: "bg-white/[0.06] text-white/50 border-white/[0.1]" },
};
const LEVEL = {
  ok:   { icon: CheckCircle2,  cls: "text-emerald-400" },
  warn: { icon: AlertTriangle, cls: "text-amber-400" },
  bad:  { icon: XCircle,       cls: "text-rose-400" },
};
const PROVIDER = { gmail: "Gmail", outlook: "Microsoft 365", smtp: "Other (SMTP)" };

// Like Apollo's "Domains & Mailboxes": every domain, its email setup (SPF/DKIM/DMARC), and each
// mailbox's status, warm-up and bounce rate.
export default function Domains() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [checking, setChecking] = useState("");
  const [smtpFor, setSmtpFor] = useState(null);
  const adminT = encodeURIComponent(localStorage.getItem("adminToken") || "");
  const gmailUrl = `${API}/cold-email/auth/google?t=${adminT}`;
  const outlookUrl = `${API}/cold-email/auth/microsoft?t=${adminT}`;

  async function load() {
    try { setData(await api("/domains")); setErr(""); } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function check(domain) {
    setChecking(domain);
    try { await api(`/domains/${encodeURIComponent(domain)}/check`, { method: "POST" }); await load(); }
    catch (e) { setErr(e.message); }
    finally { setChecking(""); }
  }
  async function resume(box) {
    await api(`/mailboxes/${box._id}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });
    load();
  }
  const reconnect = (box) => (box.provider === "smtp" ? setSmtpFor(box) : (window.location.href = box.provider === "outlook" ? outlookUrl : gmailUrl));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-white font-black text-lg">Domains & mailboxes</h2>
          <p className="text-white/40 text-xs">Your sending domains, whether their email setup is right, and how each mailbox is doing (last 30 days).</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={gmailUrl} className="px-3.5 py-2 rounded-xl bg-white text-gray-800 text-xs font-bold hover:bg-gray-100">+ Gmail</a>
          <a href={outlookUrl} className="px-3.5 py-2 rounded-xl bg-[#0078D4] text-white text-xs font-bold hover:bg-[#106EBE]">+ Microsoft 365</a>
          <button onClick={() => setSmtpFor({})} className="px-3.5 py-2 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white text-xs font-bold hover:bg-white/[0.12] cursor-pointer">+ Other email (SMTP)</button>
        </div>
      </div>

      {err && <p className="text-rose-400 text-sm">{err}</p>}
      {!data ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : data.domains.length === 0 ? (
        <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl py-14 text-center">
          <Globe size={30} className="mx-auto text-white/15 mb-2" />
          <p className="text-white/50 text-sm">No domains or mailboxes yet.</p>
          <p className="text-white/30 text-xs mt-1">Connect a mailbox above. Its domain shows here with its health and warm-up.</p>
        </div>
      ) : (
        data.domains.map((d) => <DomainCard key={d.domain} d={d} maxBounce={data.maxBounceRate} checking={checking === d.domain} onCheck={() => check(d.domain)} onReconnect={reconnect} onResume={resume} />)
      )}

      {smtpFor && <SmtpModal mailbox={smtpFor._id ? smtpFor : null} onClose={() => setSmtpFor(null)} onSaved={load} />}
    </div>
  );
}

function DomainCard({ d, maxBounce, checking, onCheck, onReconnect, onResume }) {
  const [open, setOpen] = useState(d.status !== "excellent");
  const st = STATUS[d.status] || STATUS.unchecked;
  const checks = d.health?.checks || [];
  return (
    <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Globe size={18} className="text-emerald-300" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold">{d.domain}</p>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${st.cls}`}>{st.label}</span>
            {d.health?.score !== undefined && <span className="text-white/35 text-xs">Setup score {d.health.score}/100</span>}
          </div>
          <p className="text-white/35 text-xs mt-0.5">
            {d.mailboxes.length} mailbox{d.mailboxes.length === 1 ? "" : "es"} · {d.sent} sent · <span className={d.bounceRate > maxBounce ? "text-rose-300" : ""}>{d.bounceRate}% bounced</span>
            {d.health?.checkedAt && ` · checked ${new Date(d.health.checkedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
          </p>
        </div>
        <button onClick={onCheck} disabled={checking} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/70 text-xs font-bold hover:bg-white/10 cursor-pointer disabled:opacity-50">
          <RefreshCw size={12} className={checking ? "animate-spin" : ""} /> {checking ? "Checking…" : "Run a check"}
        </button>
        <button onClick={() => setOpen((v) => !v)} className="text-white/40 hover:text-white cursor-pointer p-1"><ChevronDown size={18} className={open ? "rotate-180 transition-transform" : "transition-transform"} /></button>
      </div>

      {open && (
        <div className="border-t border-white/[0.05] px-5 py-4 space-y-4">
          <div>
            <p className="text-white/45 text-[11px] font-bold uppercase tracking-wider mb-2">Domain protection</p>
            {checks.length === 0 ? (
              <p className="text-white/35 text-sm">Not checked yet — press <b>Run a check</b> to see if SPF, DKIM and DMARC are set up.</p>
            ) : (
              <div className="grid gap-2">
                {checks.map((c) => <Check key={c.key} c={c} />)}
              </div>
            )}
          </div>

          <div>
            <p className="text-white/45 text-[11px] font-bold uppercase tracking-wider mb-2">Mailboxes</p>
            <div className="space-y-2">
              {d.mailboxes.map((m) => <MailboxRow key={m._id} m={m} maxBounce={maxBounce} onReconnect={onReconnect} onResume={onResume} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Check({ c }) {
  const [fix, setFix] = useState(false);
  const L = LEVEL[c.level] || LEVEL.warn;
  const Icon = L.icon;
  return (
    <div className="bg-white/[0.025] border border-white/[0.05] rounded-xl px-3.5 py-2.5">
      <div className="flex items-start gap-2.5">
        <Icon size={15} className={`${L.cls} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="text-white/85 text-sm font-semibold">{c.label}</p>
          {c.detail && <p className="text-white/45 text-xs mt-0.5 leading-relaxed">{c.detail}</p>}
          {c.fix && c.level !== "ok" && (
            <>
              <button onClick={() => setFix((v) => !v)} className="text-emerald-300/80 hover:text-emerald-300 text-xs font-bold mt-1 cursor-pointer">{fix ? "Hide" : "How to fix"}</button>
              {fix && <p className="text-white/60 text-xs mt-1 whitespace-pre-wrap leading-relaxed bg-black/20 rounded-lg p-2.5">{c.fix}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MailboxRow({ m, maxBounce, onReconnect, onResume }) {
  const status = m.status === "error" ? { t: "Reconnect needed", c: "bg-rose-500/15 text-rose-300" }
    : m.status === "paused" && m.pausedReason ? { t: "Auto-paused", c: "bg-amber-500/15 text-amber-300" }
    : m.status === "paused" ? { t: "Paused", c: "bg-amber-500/10 text-amber-300/80" }
    : { t: "Sending", c: "bg-emerald-500/15 text-emerald-300" };
  const warming = m.warmupEnabled !== false && (m.todayLimit ?? m.dailyLimit) < m.dailyLimit;
  const s = m.stats || {};
  return (
    <div className="bg-white/[0.025] border border-white/[0.05] rounded-xl px-3.5 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Mail size={15} className="text-white/35 shrink-0" />
        <div className="flex-1 min-w-[180px]">
          <p className="text-white/90 text-sm font-semibold truncate">{m.email}</p>
          <p className="text-white/35 text-[11px]">{PROVIDER[m.provider] || m.provider}</p>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${status.c}`}>{status.t}</span>
        <div className="text-right min-w-[110px]">
          <p className="text-white/70 text-xs flex items-center justify-end gap-1">
            {warming && <Flame size={11} className="text-orange-400" />}
            {warming ? `Warm-up day ${m.warmupDay}` : "Fully warmed up"}
          </p>
          <p className="text-white/35 text-[11px]">{m.sentToday || 0}/{m.todayLimit ?? m.dailyLimit} today</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Sent" value={s.sent || 0} />
          <Stat label="Bounced" value={`${s.bounceRate || 0}%`} cls={s.bounceRate > maxBounce ? "text-rose-300" : "text-white/80"} />
          <Stat label="Replied" value={`${s.replyRate || 0}%`} cls="text-emerald-300" />
        </div>
      </div>
      {m.issues?.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {m.issues.map((i, k) => (
            <div key={k} className={`flex items-start gap-2 text-xs rounded-lg px-2.5 py-1.5 ${i.level === "bad" ? "bg-rose-500/10 text-rose-200" : "bg-amber-500/10 text-amber-200"}`}>
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span className="flex-1">{i.text}</span>
            </div>
          ))}
          <div className="flex gap-2">
            {m.status === "error" && (
              <button onClick={() => onReconnect(m)} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 cursor-pointer">{m.provider === "smtp" ? "Update password" : "Reconnect"}</button>
            )}
            {m.status === "paused" && (
              <button onClick={() => onResume(m)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 cursor-pointer">Resume sending</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const Stat = ({ label, value, cls = "text-white/80" }) => (
  <div>
    <p className={`text-sm font-black ${cls}`}>{value}</p>
    <p className="text-white/30 text-[10px]">{label}</p>
  </div>
);
