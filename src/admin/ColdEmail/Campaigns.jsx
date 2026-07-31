import { useState, useEffect, useCallback } from "react";
import {
  Plus, Play, Pause, Trash2, Mail, X, ArrowRight, ArrowLeft,
  Rocket, Save, AlertCircle, Eye, RefreshCw, ChevronLeft,
  Users, Send, MessageSquare, TrendingUp, Clock, CheckCircle,
  BarChart2, Inbox
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` });
function afetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...auth(), ...(opts.headers || {}) } });
}

const VARS = ["{{first_name}}", "{{last_name}}", "{{company}}", "{{email}}"];

const STATUS_STYLES = {
  active:    { badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  paused:    { badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",       dot: "bg-amber-400"   },
  draft:     { badge: "bg-white/10 text-white/50 border border-white/10",                dot: "bg-white/30"    },
  completed: { badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400"    },
};

const SEND_STATUS = {
  sent:    { color: "bg-blue-500/15 text-blue-400",         label: "Sent"    },
  pending: { color: "bg-amber-500/15 text-amber-400",       label: "Pending" },
  replied: { color: "bg-emerald-500/15 text-emerald-400",   label: "Replied" },
  failed:  { color: "bg-rose-500/15 text-rose-400",         label: "Failed"  },
  skipped: { color: "bg-white/[0.06] text-white/30",        label: "Skipped" },
  bounced: { color: "bg-orange-500/15 text-orange-400",     label: "Bounced" },
};

// ── Email HTML builder (mirrors server coldEmailEngine.js) ────────────────────

function buildPreviewHtml(rawBody, subject) {
  const base = (import.meta.env.VITE_API_URL || "https://api.cleaniqservices.com/api").replace(/\/api$/, "");
  const logoUrl = `${base}/public/images/logo.jpg`;
  const content = (rawBody || "").split("\n").map(line =>
    line.trim()
      ? `<tr><td style="padding:0 0 8px;color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.75;">${line.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</td></tr>`
      : `<tr><td style="height:12px;font-size:12px;">&nbsp;</td></tr>`
  ).join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:0;background:#edf1f7;-webkit-font-smoothing:antialiased}a{color:#0a6644}</style></head><body style="margin:0;padding:0;background:#edf1f7;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#edf1f7;"><tr><td align="center" style="padding:32px 16px 48px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:580px;max-width:580px;"><tr><td align="center" style="background:#073d27;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;"><img src="${logoUrl}" alt="cleaniq services" width="80" height="80" style="display:block;margin:0 auto 14px;width:80px;height:80px;border-radius:14px;object-fit:cover;border:2px solid rgba(255,255,255,0.15);"/><p style="margin:0;color:#fff;font-family:Arial,sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.4px;">cleaniq services</p><p style="margin:5px 0 0;color:rgba(255,255,255,0.4);font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Professional Cleaning Solutions</p></td></tr><tr><td style="height:4px;background:linear-gradient(90deg,#10b981,#3b82f6 60%,#8b5cf6);font-size:0;">&nbsp;</td></tr><tr><td style="background:#fff;padding:40px 44px 32px;border-left:1px solid #dde5ed;border-right:1px solid #dde5ed;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${content}</table></td></tr><tr><td style="background:#fff;border-left:1px solid #dde5ed;border-right:1px solid #dde5ed;padding:0 44px;"><div style="height:1px;background:#e2e8f0;">&nbsp;</div></td></tr><tr><td style="background:#f8fafc;border:1px solid #dde5ed;border-top:none;border-radius:0 0 16px 16px;padding:22px 44px 26px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 14px;"><tr><td style="background:#073d27;border-radius:50px;padding:6px 16px;"><span style="color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:800;">cleaniq services</span></td></tr></table><p style="margin:0 0 7px;color:#94a3b8;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;">You received this because you're on our outreach list.</p><p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;"><a href="#" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>&nbsp;·&nbsp;<a href="https://cleaniqservices.com" style="color:#64748b;">cleaniqservices.com</a></p></td></tr></table></td></tr></table></body></html>`;
}

// ── Email Preview Modal ────────────────────────────────────────────────────────

function PreviewModal({ emailStep, onClose }) {
  const [tab, setTab] = useState("preview");
  const [copied, setCopied] = useState(false);

  const sample = { "{{first_name}}": "James", "{{last_name}}": "Wilson", "{{company}}": "ABC Ltd", "{{email}}": "james@abcltd.com" };
  const replace = (t) => Object.entries(sample).reduce((s, [k, v]) => s.replaceAll(k, v), t || "");
  const sub  = replace(emailStep.subject);
  const body = replace(emailStep.body);
  const html = buildPreviewHtml(body, sub);

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/90 backdrop-blur-md p-0 sm:p-6 sm:items-center" onClick={onClose}>
      <div className="w-full sm:max-w-[760px] sm:max-h-[94vh] flex flex-col bg-[#050e09] sm:rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]" onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0 bg-white/[0.02]">
          <div>
            <p className="text-white font-black text-sm">Email Preview</p>
            <p className="text-white/30 text-[11px] mt-0.5">Sample data: James Wilson · ABC Ltd</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/[0.05] border border-white/[0.08] rounded-lg p-0.5">
              {[["preview","Preview"],["source","HTML Source"]].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`text-xs px-3 py-1.5 rounded-md font-bold cursor-pointer transition-all ${tab === id ? "bg-emerald-500 text-white" : "text-white/30 hover:text-white/70"}`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white cursor-pointer transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {tab === "preview" && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Gmail-style chrome */}
            <div className="shrink-0 bg-[#f6f8fc] border-b border-gray-200/80 px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#073d27] flex items-center justify-center text-white font-black text-sm shrink-0">CS</div>
                <div>
                  <p className="text-gray-800 font-bold text-sm leading-tight">cleaniq services <span className="text-gray-400 font-normal text-xs">via gmail.com</span></p>
                  <p className="text-gray-400 text-xs">to james@abcltd.com</p>
                </div>
              </div>
              <p className="text-gray-900 font-semibold text-[15px]">{sub || "(no subject)"}</p>
            </div>
            {/* Actual email rendered */}
            <iframe
              srcDoc={html}
              title="Email Preview"
              className="flex-1 w-full border-0"
              style={{ minHeight: "480px" }}
              sandbox="allow-same-origin"
            />
          </div>
        )}

        {tab === "source" && (
          <div className="flex flex-col flex-1 min-h-0 bg-[#0d1117]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] shrink-0">
              <p className="text-white/30 text-xs font-bold uppercase tracking-wider">HTML · {html.length.toLocaleString()} chars</p>
              <button
                onClick={() => { navigator.clipboard.writeText(html); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-bold hover:bg-emerald-500/25 cursor-pointer transition-all">
                {copied ? "Copied!" : "Copy HTML"}
              </button>
            </div>
            <textarea readOnly value={html}
              className="flex-1 w-full bg-transparent text-[11px] text-emerald-300/60 font-mono resize-none focus:outline-none px-5 py-4 leading-relaxed"
              style={{ minHeight: "480px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Campaign Detail (full-page inline view) ───────────────────────────────────

function CampaignDetail({ campaignId, onBack, onRefresh }) {
  const [campaign, setCampaign]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [sends, setSends]           = useState([]);
  const [sendsLoading, setSendsLoading] = useState(true);
  const [sendsTotal, setSendsTotal] = useState(0);
  const [tab, setTab]               = useState("overview");
  const [statusFilter, setStatusFilter] = useState("");
  const [sendsPage, setSendsPage]   = useState(1);
  const [sendsSearch, setSendsSearch] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [checkBusy, setCheckBusy]   = useState(false);
  const [previewStep, setPreviewStep] = useState(null);
  const [expandedStep, setExpandedStep] = useState(0);
  const [viewReply, setViewReply]   = useState(null); // the send object whose reply to show

  const loadCampaign = useCallback(async () => {
    setLoading(true);
    const r = await afetch(`${API}/cold-email/campaigns/${campaignId}`);
    const d = await r.json();
    setCampaign(d);
    setLoading(false);
  }, [campaignId]);

  const loadSends = useCallback(async () => {
    setSendsLoading(true);
    const p = new URLSearchParams({ page: sendsPage, limit: 50 });
    if (statusFilter) p.set("status", statusFilter);
    if (sendsSearch)  p.set("search", sendsSearch);
    const r = await afetch(`${API}/cold-email/campaigns/${campaignId}/sends?${p}`);
    const d = await r.json();
    setSends(d.sends || []);
    setSendsTotal(d.total || 0);
    setSendsLoading(false);
  }, [campaignId, sendsPage, statusFilter, sendsSearch]);

  useEffect(() => { loadCampaign(); }, [loadCampaign]);
  useEffect(() => { loadSends(); }, [loadSends]);

  async function doAction(verb) {
    setActionBusy(verb);
    await afetch(`${API}/cold-email/campaigns/${campaignId}/${verb}`, { method: "POST" });
    await loadCampaign();
    onRefresh();
    setActionBusy("");
  }

  async function checkReplies() {
    setCheckBusy(true);
    await afetch(`${API}/cold-email/campaigns/${campaignId}/check-replies`, { method: "POST" });
    await loadCampaign();
    await loadSends();
    setCheckBusy(false);
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white/30 text-sm">Loading campaign…</p>
    </div>
  );

  if (!campaign) return (
    <div className="flex flex-col items-center justify-center py-32">
      <p className="text-white/30">Campaign not found.</p>
      <button onClick={onBack} className="mt-4 text-emerald-400 text-sm font-bold cursor-pointer hover:text-emerald-300">← Go back</button>
    </div>
  );

  const s = campaign.stats || {};
  const total = campaign.contactIds?.length || 0;
  const replyRate = s.sent > 0 ? ((s.replied / s.sent) * 100).toFixed(1) : "0.0";
  const deliveryRate = total > 0 ? ((s.sent / total) * 100).toFixed(0) : "0";
  const st = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;

  const STAT_CARDS = [
    { icon: Send,          label: "Emails Sent",    value: (s.sent || 0).toLocaleString(),        sub: `${deliveryRate}% of ${total.toLocaleString()}`,       color: "text-white",        bg: "bg-white/[0.04]",           border: "border-white/[0.07]" },
    { icon: MessageSquare, label: "Replied",         value: (s.replied || 0).toLocaleString(),      sub: `${replyRate}% reply rate`,                           color: "text-emerald-400",  bg: "bg-emerald-500/[0.06]",     border: "border-emerald-500/20" },
    { icon: Users,         label: "Unsubscribed",    value: (s.unsubscribed || 0).toLocaleString(), sub: "removed themselves",                                  color: "text-amber-400",    bg: "bg-amber-500/[0.05]",       border: "border-amber-500/15"  },
    { icon: AlertCircle,   label: "Failed / Bounced",value: ((s.bounced||0)+(s.failed||0)).toLocaleString(), sub: "delivery errors",                           color: "text-rose-400",     bg: "bg-rose-500/[0.05]",        border: "border-rose-500/15"   },
  ];

  return (
    <div className="space-y-5">

      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-bold cursor-pointer transition-colors group">
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Campaigns
          </button>
          <span className="text-white/10">/</span>
          <span className="text-white font-black text-sm truncate max-w-[200px]">{campaign.name}</span>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${st.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {campaign.status}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={checkReplies} disabled={checkBusy}
            className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/25 cursor-pointer disabled:opacity-40 transition-all font-bold">
            {checkBusy ? <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <RefreshCw size={13} />}
            {checkBusy ? "Checking…" : "Check Replies"}
          </button>
          {campaign.status === "active" && (
            <button onClick={() => doAction("pause")} disabled={!!actionBusy}
              className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold hover:bg-amber-500/20 cursor-pointer disabled:opacity-40 transition-all">
              <Pause size={13} /> {actionBusy === "pause" ? "Pausing…" : "Pause"}
            </button>
          )}
          {campaign.status === "paused" && (
            <button onClick={() => doAction("resume")} disabled={!!actionBusy}
              className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 cursor-pointer disabled:opacity-40 shadow-lg shadow-emerald-500/20 transition-all">
              <Play size={13} /> {actionBusy === "resume" ? "Resuming…" : "Resume"}
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ icon: Icon, label, value, sub, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/35 text-xs font-bold uppercase tracking-wider">{label}</p>
              <div className={`w-7 h-7 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
                <Icon size={13} className={color} />
              </div>
            </div>
            <p className={`font-black text-3xl leading-none ${color}`}>{value}</p>
            <p className="text-white/25 text-[11px] mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Reply rate bar */}
      {parseFloat(replyRate) > 0 && (
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3.5 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-white/50 text-xs font-bold">Reply rate</span>
          </div>
          <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, parseFloat(replyRate))}%` }} />
          </div>
          <span className="text-emerald-400 font-black text-sm shrink-0">{replyRate}%</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
        {[
          { id: "overview",  label: "Overview",       icon: BarChart2 },
          { id: "recipients",label: "Recipients",     icon: Users     },
          { id: "sequence",  label: "Email Sequence", icon: Mail      },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
              tab === id ? "bg-[#061A13] text-white border border-white/[0.08] shadow-sm" : "text-white/30 hover:text-white/60"
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Campaign info */}
          <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06]">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Campaign Info</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { label: "Name",      value: campaign.name },
                { label: "From name", value: campaign.fromName || <span className="text-white/25 italic">defaults to mailbox</span> },
                { label: "Status",    value: <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_STYLES[campaign.status]?.badge}`}>{campaign.status}</span> },
                { label: "Launched",  value: campaign.launchedAt ? new Date(campaign.launchedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : <span className="text-white/25 italic">not launched</span> },
                { label: "Contacts",  value: `${total.toLocaleString()} recipients` },
                { label: "Steps",     value: `${(campaign.steps||[]).length} email${campaign.steps?.length>1?"s":""} in sequence` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-white/30 text-sm">{label}</span>
                  <span className="text-white/80 text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* First email preview */}
          {campaign.steps?.[0] && (
            <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider">First Email</p>
                <button onClick={() => setPreviewStep(campaign.steps[0])}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/20 cursor-pointer transition-all">
                  <Eye size={11} /> Preview
                </button>
              </div>
              <div className="flex-1 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-white/25 text-xs font-bold uppercase tracking-wider w-14 shrink-0 pt-0.5">Subject</span>
                  <span className="text-white/85 text-sm font-semibold leading-relaxed">{campaign.steps[0].subject || "(no subject)"}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-white/25 text-xs font-bold uppercase tracking-wider w-14 shrink-0 pt-0.5">Body</span>
                  <p className="text-white/45 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">{campaign.steps[0].body || "(empty)"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RECIPIENTS TAB ── */}
      {tab === "recipients" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {["", "pending", "sent", "replied", "failed", "skipped"].map(st => {
                const info = st ? SEND_STATUS[st] : null;
                return (
                  <button key={st} onClick={() => { setStatusFilter(st); setSendsPage(1); }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                      statusFilter === st
                        ? "bg-emerald-500 text-white"
                        : "bg-white/[0.04] text-white/35 border border-white/[0.07] hover:text-white/70"
                    }`}>
                    {st ? (info?.label || st) : "All"} {!st && sendsTotal > 0 && <span className="ml-1 opacity-60">{sendsTotal}</span>}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={sendsSearch}
              onChange={e => { setSendsSearch(e.target.value); setSendsPage(1); }}
              placeholder="Search name or email…"
              className="flex-1 min-w-[160px] bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all"
            />
            <button onClick={() => { loadCampaign(); loadSends(); }}
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 hover:text-emerald-400 cursor-pointer transition-colors">
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="w-8" />
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider">Name / Email</p>
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider hidden sm:block">Company</p>
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider">Status</p>
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider">Date</p>
            </div>

            {sendsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sends.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Inbox size={28} className="text-white/15" />
                <p className="text-white/25 text-sm">
                  {statusFilter ? `No ${statusFilter} records yet` : "No recipients found"}
                </p>
              </div>
            ) : sends.map((send) => {
              const c      = send.contactId || {};
              const name   = [c.firstName, c.lastName].filter(Boolean).join(" ") || send.contactEmail;
              const init   = (name[0] || "?").toUpperCase();
              const when   = send.sentAt || send.scheduledAt;
              const sInfo  = SEND_STATUS[send.status] || SEND_STATUS.skipped;
              const hasReply = send.status === "replied";
              return (
                <div key={send._id} className="border-b border-white/[0.03] last:border-0">
                  <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors items-center">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black ${send.status==="replied" ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400" : "bg-white/[0.06] border border-white/[0.07] text-white/40"}`}>
                      {init}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/85 text-sm font-semibold truncate">{name}</p>
                      <p className="text-white/25 text-xs truncate">{send.contactEmail}</p>
                    </div>
                    <p className="text-white/35 text-xs truncate hidden sm:block">{c.company || "—"}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${sInfo.color}`}>
                        {sInfo.label}
                      </span>
                      {hasReply && (
                        <button onClick={() => setViewReply(viewReply?._id === send._id ? null : send)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer transition-all ${viewReply?._id===send._id ? "bg-emerald-500 text-white" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"}`}>
                          {viewReply?._id===send._id ? "Hide reply" : "View reply"}
                        </button>
                      )}
                    </div>
                    <p className="text-white/25 text-[11px] whitespace-nowrap">
                      {when ? new Date(when).toLocaleDateString("en-GB", { day:"numeric", month:"short" }) : "—"}
                    </p>
                  </div>

                  {/* Inline reply viewer */}
                  {viewReply?._id === send._id && (
                    <div className="mx-4 mb-3 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-emerald-500/15 bg-emerald-500/[0.04]">
                        <MessageSquare size={13} className="text-emerald-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-emerald-300 text-xs font-bold truncate">
                            {send.replySubject || `Re: ${(campaign?.steps?.[0]?.subject || "your email").replace(/\{\{[^}]+\}\}/g, "…")}`}
                          </p>
                          <p className="text-emerald-400/50 text-[10px]">
                            From {send.replyFrom || send.contactEmail}
                            {send.repliedAt && ` · ${new Date(send.repliedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}`}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        {send.replyBody ? (
                          <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">{send.replyBody}</p>
                        ) : (
                          <div className="flex items-start gap-2.5">
                            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-amber-400/90 text-sm font-semibold">Reply content not yet loaded</p>
                              <p className="text-white/35 text-xs mt-1">Click the <strong className="text-white/60">Check Replies</strong> button at the top to fetch the reply content from Gmail. It will appear here after.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {sendsTotal > 50 && (
            <div className="flex items-center justify-between text-xs text-white/30">
              <span>{sendsTotal.toLocaleString()} total · page {sendsPage} of {Math.ceil(sendsTotal/50)}</span>
              <div className="flex gap-1.5">
                <button onClick={() => setSendsPage(p => Math.max(1, p-1))} disabled={sendsPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] disabled:opacity-30 cursor-pointer disabled:cursor-default hover:bg-white/[0.08] transition-colors">← Prev</button>
                <button onClick={() => setSendsPage(p => p+1)} disabled={sends.length < 50}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] disabled:opacity-30 cursor-pointer disabled:cursor-default hover:bg-white/[0.08] transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EMAIL SEQUENCE TAB ── */}
      {tab === "sequence" && (
        <div className="space-y-3">
          {(campaign.steps || []).map((step, i) => (
            <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${expandedStep === i ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-white/[0.07] bg-white/[0.025]"}`}>
              {/* Step header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() => setExpandedStep(expandedStep === i ? -1 : i)}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${i === 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.07] text-white/50 border border-white/[0.1]"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${i === 0 ? "text-white" : "text-white/75"}`}>{step.subject || "(no subject)"}</p>
                  <p className="text-white/25 text-[11px] mt-0.5">
                    {i === 0 ? "Sent immediately on launch" : `Sent ${step.waitDays || 1} day${step.waitDays !== 1 ? "s" : ""} after previous`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setPreviewStep(step); }}
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.09] text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 cursor-pointer transition-all font-bold">
                    <Eye size={11} /> Preview
                  </button>
                  {step.waitDays > 0 && (
                    <span className="text-white/25 text-xs bg-white/[0.05] border border-white/[0.07] px-2 py-1 rounded-lg">+{step.waitDays}d</span>
                  )}
                </div>
              </div>

              {/* Expanded body */}
              {expandedStep === i && (
                <div className="px-5 pb-5">
                  <div className="h-px bg-white/[0.06] mb-4" />
                  <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider mb-2">Message body</p>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-4">
                    <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">{step.body || "(empty)"}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewStep && <PreviewModal emailStep={previewStep} onClose={() => setPreviewStep(null)} />}
    </div>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

function Wizard({ onClose, onCreated, editCampaign }) {
  const TOTAL = 4;
  const [step, setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [mailboxes, setMailboxes] = useState([]);
  const [contacts, setContacts]   = useState([]);
  const [cTotal, setCTotal]       = useState(0);
  const [cSearch, setCSearch]     = useState("");
  const [cPage, setCPage]         = useState(1);
  const [previewIdx, setPreviewIdx] = useState(null);

  const [data, setData] = useState(editCampaign ? {
    name: editCampaign.name || "", fromName: editCampaign.fromName || "",
    mailboxIds: editCampaign.mailboxIds || [],
    steps: editCampaign.steps?.length ? editCampaign.steps : [{ order:0, subject:"", body:"", waitDays:0 }],
    contactIds: editCampaign.contactIds || [],
  } : {
    name: "", fromName: "", mailboxIds: [],
    steps: [{ order:0, subject:"", body:"", waitDays:0 }],
    contactIds: [],
  });

  useEffect(() => {
    afetch(`${API}/cold-email/mailboxes`).then(r=>r.json()).then(setMailboxes).catch(()=>{});
  }, []);

  const loadContacts = useCallback(async () => {
    const p = new URLSearchParams({ page: cPage, limit: 50, search: cSearch });
    const r = await fetch(`${API}/cold-email/contacts?${p}`, { headers: auth() });
    const d = await r.json();
    setContacts(d.contacts || []);
    setCTotal(d.total || 0);
  }, [cPage, cSearch]);

  useEffect(() => { if (step === 3) loadContacts(); }, [step, loadContacts]);

  const setStepField = (idx, field, val) =>
    setData(d => { const steps = [...d.steps]; steps[idx] = {...steps[idx], [field]: val}; return {...d, steps}; });

  const insertVar = (idx, v) =>
    setStepField(idx, "body", (data.steps[idx].body || "") + v);

  const toggleMailbox = id =>
    setData(d => ({ ...d, mailboxIds: d.mailboxIds.includes(id) ? d.mailboxIds.filter(m=>m!==id) : [...d.mailboxIds, id] }));

  const toggleContact = id =>
    setData(d => ({ ...d, contactIds: d.contactIds.includes(id) ? d.contactIds.filter(c=>c!==id) : [...d.contactIds, id] }));

  function validate() {
    if (step === 1) {
      for (const s of data.steps) {
        if (!s.subject.trim()) return "Every email needs a subject line";
        if (!s.body.trim())    return "Every email needs a body";
      }
    }
    if (step === 2) {
      if (!data.name.trim()) return "Campaign name is required";
      if (!data.mailboxIds.length) return "Select at least one mailbox";
    }
    if (step === 3 && !data.contactIds.length) return "Select at least one contact";
    return "";
  }

  function next() { const e = validate(); if (e) { setError(e); return; } setError(""); setStep(s=>s+1); }
  function back() { setError(""); setStep(s=>s-1); }

  async function save(launch = false) {
    const e = validate(); if (e) { setError(e); return; }
    setSaving(true); setError("");
    try {
      let camp;
      if (editCampaign) {
        const r = await afetch(`${API}/cold-email/campaigns/${editCampaign._id}`, { method:"PUT", body:JSON.stringify(data) });
        camp = await r.json();
      } else {
        const r = await afetch(`${API}/cold-email/campaigns`, { method:"POST", body:JSON.stringify(data) });
        camp = await r.json();
      }
      if (camp.message) throw new Error(camp.message);
      if (launch) {
        const r = await afetch(`${API}/cold-email/campaigns/${camp._id}/launch`, { method:"POST" });
        const d = await r.json();
        if (d.message) throw new Error(d.message);
      }
      onCreated(); onClose();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  }

  const LABELS = ["Write Your Email", "Campaign Setup", "Select Recipients", "Review & Launch"];

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#060f09] border border-white/[0.08] rounded-2xl w-full max-w-[740px] max-h-[90vh] flex flex-col shadow-2xl">

        {/* Wizard header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Mail size={16} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-sm">{editCampaign ? "Edit Campaign" : "New Campaign"}</h2>
              <p className="text-white/30 text-xs">{LABELS[step-1]}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white cursor-pointer transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-2 shrink-0">
          {LABELS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                i+1 < step  ? "bg-emerald-500 text-white" :
                i+1 === step ? "bg-emerald-500 text-white ring-4 ring-emerald-500/20" :
                               "bg-white/[0.06] text-white/30"
              }`}>
                {i+1 < step
                  ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : i+1
                }
              </div>
              <span className={`text-xs font-bold hidden sm:block truncate ${i+1===step?"text-white":"text-white/25"}`}>{label}</span>
              {i < LABELS.length-1 && <div className={`flex-1 h-px ${i+1<step?"bg-emerald-500/40":"bg-white/[0.06]"}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-emerald-500/[0.05] border border-emerald-500/[0.15] rounded-xl px-4 py-3 text-white/45 text-xs leading-relaxed">
                Write the email your contacts receive. Use <code className="text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">{"{{first_name}}"}</code>, <code className="text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">{"{{company}}"}</code> to personalise. Unsubscribe link added automatically.
              </div>

              {data.steps.map((s, idx) => (
                <div key={idx} className="border border-white/[0.08] rounded-2xl overflow-hidden bg-white/[0.01]">
                  <div className={`flex items-center justify-between px-4 py-3 border-b border-white/[0.07] ${idx===0?"bg-emerald-500/[0.05]":"bg-white/[0.025]"}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${idx===0?"bg-emerald-500/25 text-emerald-400":"bg-white/[0.08] text-white/45"}`}>{idx+1}</div>
                      <span className={`text-sm font-bold ${idx===0?"text-emerald-300/90":"text-white/60"}`}>
                        {idx===0 ? "First email" : `Follow-up ${idx}`}
                      </span>
                      {idx === 0 && <span className="text-emerald-400/35 text-xs hidden sm:inline">· sent immediately</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {idx > 0 && (
                        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-1.5">
                          <span className="text-white/30 text-xs">Wait</span>
                          <input type="number" min="1" max="30" value={s.waitDays}
                            onChange={e => setStepField(idx,"waitDays",Number(e.target.value))}
                            className="w-8 bg-transparent text-white text-sm text-center focus:outline-none font-bold" />
                          <span className="text-white/30 text-xs">days</span>
                        </div>
                      )}
                      <button onClick={() => setPreviewIdx(idx)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/35 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-all font-bold">
                        <Eye size={11} /> Preview
                      </button>
                      {idx > 0 && (
                        <button onClick={() => setData(d => ({...d, steps: d.steps.filter((_,i)=>i!==idx).map((s,i)=>({...s,order:i}))}))}
                          className="text-white/20 hover:text-rose-400 cursor-pointer transition-colors p-1"><X size={13}/></button>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.05]">
                    <span className="text-white/20 text-xs font-bold uppercase tracking-wider w-14 shrink-0">Subject</span>
                    <input type="text" value={s.subject}
                      onChange={e => setStepField(idx,"subject",e.target.value)}
                      placeholder={idx===0 ? "e.g. Quick question, {{first_name}}" : "e.g. Following up, {{first_name}}"}
                      className="flex-1 bg-transparent text-white/90 placeholder:text-white/15 text-sm focus:outline-none" />
                  </div>

                  {/* Body */}
                  <div className="relative">
                    <textarea value={s.body}
                      onChange={e => setStepField(idx,"body",e.target.value)}
                      rows={9}
                      placeholder={"Hi {{first_name}},\n\nI noticed {{company}} could benefit from our professional cleaning services.\n\nWould you be open to a quick call this week?\n\nBest,\nThe cleaniq services team"}
                      className="w-full bg-transparent px-4 pt-4 pb-9 text-white/85 placeholder:text-white/12 text-sm focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="absolute bottom-2.5 right-4 text-white/15 text-[11px] pointer-events-none select-none">
                      {s.body.trim().split(/\s+/).filter(Boolean).length} words · {s.body.length} chars
                    </div>
                  </div>

                  {/* Variable chips */}
                  <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.05] flex-wrap">
                    <span className="text-white/20 text-xs font-semibold shrink-0">Insert:</span>
                    {VARS.map(v => (
                      <button key={v} onClick={() => insertVar(idx, v)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/[0.07] text-emerald-400/70 border border-emerald-500/[0.15] hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-500/30 cursor-pointer font-mono transition-all">{v}</button>
                    ))}
                  </div>
                </div>
              ))}

              {data.steps.length < 3 && (
                <button onClick={() => setData(d=>({...d, steps:[...d.steps,{order:d.steps.length,subject:"",body:"",waitDays:3}]}))}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/[0.07] text-white/25 hover:text-white/55 hover:border-white/[0.14] hover:bg-white/[0.02] text-sm font-semibold cursor-pointer transition-all">
                  <Plus size={14} /> Add follow-up email <span className="text-white/15 text-xs">({data.steps.length}/3)</span>
                </button>
              )}
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-white/40 text-xs font-bold uppercase tracking-wider block mb-1.5">Campaign Name *</label>
                  <input type="text" value={data.name} onChange={e => setData(d=>({...d,name:e.target.value}))}
                    placeholder="e.g. Commercial Cleaning Outreach"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 text-sm transition-all" />
                </div>
                <div>
                  <label className="text-white/40 text-xs font-bold uppercase tracking-wider block mb-1.5">Your Name <span className="text-white/20 font-normal normal-case">(optional)</span></label>
                  <input type="text" value={data.fromName} onChange={e => setData(d=>({...d,fromName:e.target.value}))}
                    placeholder="e.g. Adeyemi from cleaniq services"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 text-sm transition-all" />
                </div>
              </div>

              <div>
                <label className="text-white/40 text-xs font-bold uppercase tracking-wider block mb-1.5">Send emails from *</label>
                {mailboxes.length === 0 ? (
                  <div className="flex items-center gap-3 bg-amber-500/[0.07] border border-amber-500/20 rounded-xl px-4 py-3.5">
                    <AlertCircle size={15} className="text-amber-400 shrink-0" />
                    <p className="text-amber-400/90 text-sm">No Gmail accounts connected. Go to Mailboxes tab first.</p>
                  </div>
                ) : mailboxes.map(box => {
                  const on = data.mailboxIds.includes(box._id);
                  const pct = box.dailyLimit > 0 ? Math.round((box.sentToday/box.dailyLimit)*100) : 0;
                  return (
                    <div key={box._id} onClick={() => toggleMailbox(box._id)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all mb-2 ${on?"bg-emerald-500/[0.07] border-emerald-500/30":"bg-white/[0.025] border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.04]"}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${on?"bg-emerald-500 border-emerald-500":"border-white/20"}`}>
                        {on && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white/90 text-sm font-semibold truncate">{box.email}</p>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase ${STATUS_STYLES[box.status]?.badge || STATUS_STYLES.draft.badge}`}>{box.status}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden max-w-[72px]">
                            <div className={`h-full rounded-full ${pct>=100?"bg-rose-500":pct>=80?"bg-amber-400":"bg-emerald-500"}`} style={{width:`${Math.min(100,pct)}%`}} />
                          </div>
                          <p className="text-white/25 text-[11px]">{box.sentToday}/{box.dailyLimit} today</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-bold text-sm">
                    {data.contactIds.length > 0
                      ? <>{data.contactIds.length.toLocaleString()} <span className="text-emerald-400">selected</span></>
                      : <span className="text-white/40">No contacts selected</span>
                    }
                  </p>
                  <p className="text-white/25 text-xs mt-0.5">{cTotal.toLocaleString()} total</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <button onClick={async () => {
                    const r = await fetch(`${API}/cold-email/contacts/all-ids?search=${cSearch}`, { headers: auth() });
                    const d = await r.json();
                    if (d.ids) setData(p=>({...p, contactIds: d.ids}));
                  }} className="text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors">
                    Select all {cTotal.toLocaleString()}
                  </button>
                  <span className="text-white/10">|</span>
                  <button onClick={() => setData(p=>({...p,contactIds:[]}))} className="text-white/30 hover:text-white/60 cursor-pointer">Clear</button>
                </div>
              </div>

              <input type="text" value={cSearch} onChange={e=>{setCSearch(e.target.value);setCPage(1);}}
                placeholder="Search name, email or company…"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all" />

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl max-h-64 overflow-y-auto">
                {contacts.map(c => {
                  const sel = data.contactIds.includes(c._id);
                  const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email;
                  return (
                    <div key={c._id} onClick={() => toggleContact(c._id)}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.03] cursor-pointer last:border-0 transition-colors ${sel?"bg-emerald-500/[0.07]":"hover:bg-white/[0.03]"}`}>
                      <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${sel?"bg-emerald-500 border-emerald-500":"border-white/20"}`}>
                        {sel && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/85 text-sm font-medium truncate">{name}</p>
                        <p className="text-white/25 text-xs truncate">{c.email}</p>
                      </div>
                      {c.company && <span className="text-white/20 text-xs truncate max-w-[100px] hidden sm:block">{c.company}</span>}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-white/25">
                <span>Page {cPage}</span>
                <div className="flex gap-1.5">
                  <button onClick={()=>setCPage(p=>Math.max(1,p-1))} disabled={cPage===1} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] disabled:opacity-30 cursor-pointer hover:bg-white/[0.07]">← Prev</button>
                  <button onClick={()=>setCPage(p=>p+1)} disabled={contacts.length<50} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] disabled:opacity-30 cursor-pointer hover:bg-white/[0.07]">Next →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden divide-y divide-white/[0.05]">
                {[
                  { icon:"📋", label:"Campaign name", value: data.name },
                  { icon:"👤", label:"From name",     value: data.fromName || "Defaults to mailbox email", dim: !data.fromName },
                  { icon:"📬", label:"Mailboxes",     value: `${data.mailboxIds.length} selected` },
                  { icon:"✉️", label:"Email sequence", value: `${data.steps.length} email${data.steps.length>1?"s":""}` },
                  { icon:"👥", label:"Recipients",    value: `${data.contactIds.length.toLocaleString()} contacts` },
                ].map(({ icon, label, value, dim }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{icon}</span>
                      <span className="text-white/40 text-sm">{label}</span>
                    </div>
                    <span className={`text-sm font-bold ${dim ? "text-white/25" : "text-white"}`}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/30 text-xs font-bold uppercase tracking-wider">First Email</p>
                  <button onClick={() => setPreviewIdx(0)}
                    className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/20 cursor-pointer transition-all">
                    <Eye size={11} /> Preview email
                  </button>
                </div>
                <p className="text-white/70 text-sm font-semibold mb-1.5">{data.steps[0]?.subject || "(no subject)"}</p>
                <p className="text-white/35 text-sm leading-relaxed line-clamp-4 whitespace-pre-wrap">{data.steps[0]?.body || "(empty)"}</p>
              </div>

              <div className="bg-amber-500/[0.06] border border-amber-500/[0.15] rounded-xl px-4 py-3.5">
                <p className="text-amber-400 text-xs font-bold flex items-center gap-2 mb-1.5"><AlertCircle size={13} /> Before launching</p>
                <ul className="text-amber-400/60 text-xs space-y-1 list-disc list-inside">
                  <li>Every email includes an unsubscribe link</li>
                  <li>Daily limits per mailbox are enforced</li>
                  <li>Sends are randomised to avoid spam filters</li>
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 bg-rose-500/[0.07] border border-rose-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={13} className="text-rose-400 shrink-0" />
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Wizard footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0">
          <button onClick={back} disabled={step===1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/35 text-sm font-bold hover:text-white/70 disabled:opacity-0 disabled:pointer-events-none cursor-pointer transition-all">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex gap-2.5">
            {step < TOTAL && (
              <button onClick={next}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all">
                Continue <ArrowRight size={14} />
              </button>
            )}
            {step === TOTAL && <>
              <button onClick={() => save(false)} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.09] text-white/55 text-sm font-bold hover:bg-white/[0.09] cursor-pointer disabled:opacity-40 transition-all">
                <Save size={14} /> Save Draft
              </button>
              <button onClick={() => save(true)} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-40 transition-all">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Launching…</>
                  : <><Rocket size={14} /> Launch Campaign</>
                }
              </button>
            </>}
          </div>
        </div>
      </div>
    </div>

    {previewIdx !== null && (
      <PreviewModal emailStep={data.steps[previewIdx]} onClose={() => setPreviewIdx(null)} />
    )}
    </>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign, onOpen, onRefresh }) {
  const [busy, setBusy] = useState("");

  async function action(verb, e) {
    e.stopPropagation();
    setBusy(verb);
    await afetch(`${API}/cold-email/campaigns/${campaign._id}/${verb}`, { method: "POST" });
    onRefresh();
    setBusy("");
  }

  async function del(e) {
    e.stopPropagation();
    if (!confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
    setBusy("delete");
    await afetch(`${API}/cold-email/campaigns/${campaign._id}`, { method: "DELETE" });
    onRefresh();
  }

  const s         = campaign.stats || {};
  const step0     = campaign.steps?.[0] || {};
  const snippet   = (step0.body || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const total     = campaign.contactIds?.length || 0;
  const replyRate = s.sent > 0 ? ((s.replied / s.sent) * 100).toFixed(1) : null;
  const sentPct   = total > 0 ? Math.min(100, Math.round((s.sent / total) * 100)) : 0;
  const st        = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;

  const accentBorder = {
    active: "border-l-emerald-500", paused: "border-l-amber-400",
    completed: "border-l-blue-400", draft: "border-l-white/10",
  }[campaign.status] || "border-l-white/10";

  return (
    <div onClick={onOpen}
      className={`bg-[#080f0b] border border-white/[0.07] border-l-[3px] ${accentBorder} rounded-2xl p-5 cursor-pointer hover:bg-[#0a1510] hover:border-white/[0.11] transition-all group relative overflow-hidden`}>

      {/* Subtle background glow for active */}
      {campaign.status === "active" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.04] rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Row 1: name + badge + actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
            <h3 className="text-white font-black text-base">{campaign.name}</h3>
            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${st.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{campaign.status}
            </span>
          </div>
          {step0.subject && (
            <div className="flex items-center gap-1.5 mb-1">
              <Mail size={10} className="text-white/20 shrink-0" />
              <p className="text-white/60 text-xs font-semibold truncate">{step0.subject}</p>
            </div>
          )}
          {snippet && <p className="text-white/25 text-xs leading-relaxed line-clamp-1">{snippet}</p>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {(campaign.status === "active" || campaign.status === "paused") && (
            <button onClick={e => action(campaign.status==="active"?"pause":"resume", e)} disabled={!!busy} title={campaign.status==="active"?"Pause":"Resume"}
              className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/30 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer disabled:opacity-40 transition-all">
              {busy==="pause"||busy==="resume"
                ? <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin"/>
                : campaign.status==="active" ? <Pause size={12}/> : <Play size={12}/>
              }
            </button>
          )}
          <button onClick={del} disabled={!!busy} title="Delete"
            className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-40 transition-all">
            {busy==="delete"
              ? <div className="w-3 h-3 border border-rose-400 border-t-transparent rounded-full animate-spin"/>
              : <Trash2 size={12}/>
            }
          </button>
        </div>
      </div>

      {/* Row 2: stats */}
      <div className="flex items-end justify-between gap-4 mt-4">
        <div className="flex items-center gap-5">
          <div>
            <p className="text-white/80 font-black text-2xl leading-none tabular-nums">{(s.sent||0).toLocaleString()}</p>
            <p className="text-white/25 text-[10px] mt-0.5">sent</p>
          </div>
          {replyRate !== null && (
            <div>
              <p className="text-emerald-400 font-black text-2xl leading-none tabular-nums">{replyRate}%</p>
              <p className="text-white/25 text-[10px] mt-0.5">replied</p>
            </div>
          )}
          <div>
            <p className="text-white/40 font-black text-2xl leading-none tabular-nums">{total.toLocaleString()}</p>
            <p className="text-white/25 text-[10px] mt-0.5">contacts</p>
          </div>
          {campaign.steps?.length > 1 && (
            <div>
              <p className="text-white/40 font-black text-2xl leading-none">{campaign.steps.length}</p>
              <p className="text-white/25 text-[10px] mt-0.5">steps</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-white/20 text-xs">
          {campaign.launchedAt && <span>{new Date(campaign.launchedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>}
          <div className="flex items-center gap-1 text-emerald-400/40 group-hover:text-emerald-400/80 transition-colors font-bold text-xs">
            View details <ChevronLeft size={12} className="rotate-180" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {sentPct > 0 && (
        <div className="mt-4 h-1 bg-white/[0.04] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${sentPct>=100?"bg-blue-500/50":"bg-emerald-500/45"}`} style={{width:`${sentPct}%`}} />
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [filter, setFilter]       = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/cold-email/campaigns`, { headers: auth() });
    const d = await r.json();
    setCampaigns(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // When a campaign is selected, show its detail view
  if (selectedId) {
    return (
      <CampaignDetail
        campaignId={selectedId}
        onBack={() => { setSelectedId(null); load(); }}
        onRefresh={load}
      />
    );
  }

  // ── List view ──
  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);
  const counts   = { active: 0, draft: 0, paused: 0, completed: 0 };
  campaigns.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });
  const totalSent    = campaigns.reduce((a,c) => a + (c.stats?.sent    || 0), 0);
  const totalReplied = campaigns.reduce((a,c) => a + (c.stats?.replied || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white font-black text-lg">Campaigns</h2>
          <p className="text-white/35 text-sm mt-0.5">
            {campaigns.length} total · {totalSent.toLocaleString()} sent · {totalReplied.toLocaleString()} replied
          </p>
        </div>
        <button onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: "all",       label: "All",       count: campaigns.length },
          { id: "active",    label: "Active",    count: counts.active    },
          { id: "draft",     label: "Draft",     count: counts.draft     },
          { id: "paused",    label: "Paused",    count: counts.paused    },
          { id: "completed", label: "Completed", count: counts.completed },
        ].map(({ id, label, count }) => (count > 0 || id === "all") ? (
          <button key={id} onClick={() => setFilter(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              filter === id ? "bg-emerald-500 text-white" : "bg-white/[0.04] text-white/35 border border-white/[0.06] hover:text-white/70"
            }`}>
            {label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${filter===id?"bg-white/20 text-white":"bg-white/[0.06] text-white/35"}`}>{count}</span>
          </button>
        ) : null)}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#080f0b] border border-white/[0.06] border-dashed rounded-2xl py-20 flex flex-col items-center text-center px-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Mail size={26} className="text-emerald-400/50" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            {filter === "all" ? "No campaigns yet" : `No ${filter} campaigns`}
          </h3>
          <p className="text-white/25 text-sm max-w-xs mb-6">
            {filter === "all"
              ? "Create your first campaign — write an email, pick a mailbox and contacts, then launch."
              : `No ${filter} campaigns right now.`}
          </p>
          {filter === "all" && (
            <button onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all">
              <Plus size={14} /> Create first campaign
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <CampaignCard key={c._id} campaign={c}
              onOpen={() => setSelectedId(c._id)}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {wizardOpen && (
        <Wizard onClose={() => setWizardOpen(false)} onCreated={load} />
      )}
    </div>
  );
}
