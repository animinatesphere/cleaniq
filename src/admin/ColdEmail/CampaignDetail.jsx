import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, MessageSquare, Ban, AlertCircle, RefreshCw, Users, CheckCircle2, Clock, XCircle, ChevronRight } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` });

const STATUS_COLOR = {
  sent:     "bg-blue-500/15 text-blue-400",
  pending:  "bg-amber-500/15 text-amber-400",
  replied:  "bg-emerald-500/15 text-emerald-400",
  failed:   "bg-rose-500/15 text-rose-400",
  skipped:  "bg-white/[0.06] text-white/30",
  bounced:  "bg-orange-500/15 text-orange-400",
};

const STATUS_ICON = {
  sent:    <CheckCircle2 size={12} />,
  pending: <Clock size={12} />,
  replied: <MessageSquare size={12} />,
  failed:  <XCircle size={12} />,
  skipped: <Ban size={12} />,
  bounced: <AlertCircle size={12} />,
};

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const navigate       = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [sends, setSends]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading]   = useState(true);
  const [sendsLoading, setSendsLoading] = useState(true);
  const [actionBusy, setActionBusy]     = useState("");

  const loadCampaign = useCallback(async () => {
    const r = await fetch(`${API}/cold-email/campaigns/${campaignId}`, { headers: auth() });
    const d = await r.json();
    setCampaign(d);
    setLoading(false);
  }, [campaignId]);

  const loadSends = useCallback(async () => {
    setSendsLoading(true);
    const params = new URLSearchParams({ page, limit: 50 });
    if (statusFilter) params.set("status", statusFilter);
    const r = await fetch(`${API}/cold-email/campaigns/${campaignId}/sends?${params}`, { headers: auth() });
    const d = await r.json();
    setSends(d.sends || []);
    setTotal(d.total || 0);
    setSendsLoading(false);
  }, [campaignId, page, statusFilter]);

  useEffect(() => { loadCampaign(); }, [loadCampaign]);
  useEffect(() => { loadSends(); }, [loadSends]);

  async function doAction(verb) {
    setActionBusy(verb);
    await fetch(`${API}/cold-email/campaigns/${campaignId}/${verb}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth() },
    });
    await loadCampaign();
    setActionBusy("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign || campaign.message) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate("/admin/cold-email")} className="flex items-center gap-2 text-white/40 hover:text-white/80 text-sm cursor-pointer transition-colors">
          <ArrowLeft size={14} /> Back to campaigns
        </button>
        <p className="text-rose-400 text-sm">Campaign not found.</p>
      </div>
    );
  }

  const s = campaign.stats || {};
  const bd = campaign.sendBreakdown || {};
  const replyRate = s.sent > 0 ? ((s.replied / s.sent) * 100).toFixed(1) : "0";
  const totalPages = Math.ceil(total / 50);

  const STATUS_STYLES_MAP = {
    active:    "bg-emerald-500/15 text-emerald-400",
    paused:    "bg-amber-500/15 text-amber-400",
    draft:     "bg-white/[0.08] text-white/50",
    completed: "bg-blue-500/15 text-blue-400",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-white/40 text-sm">
        <button onClick={() => navigate("/admin/cold-email?tab=campaigns")} className="hover:text-white/80 cursor-pointer transition-colors flex items-center gap-1">
          <ArrowLeft size={13} /> Campaigns
        </button>
        <ChevronRight size={12} className="text-white/20" />
        <span className="text-white/70 font-semibold">{campaign.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-white font-black text-2xl tracking-tight">{campaign.name}</h1>
            <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_STYLES_MAP[campaign.status] || STATUS_STYLES_MAP.draft}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-white/30 text-sm">
            {campaign.steps?.length || 0} step sequence
            {campaign.launchedAt && ` · launched ${new Date(campaign.launchedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadCampaign() & loadSends()}
            className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 cursor-pointer transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          {campaign.status === "active" && (
            <button
              onClick={() => doAction("pause")}
              disabled={!!actionBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold hover:bg-amber-500/20 cursor-pointer disabled:opacity-40 transition-all"
            >
              {actionBusy === "pause" ? <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> : null}
              Pause Campaign
            </button>
          )}
          {campaign.status === "paused" && (
            <button
              onClick={() => doAction("resume")}
              disabled={!!actionBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer disabled:opacity-40 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {actionBusy === "resume" ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Resume
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Emails Sent",    value: s.sent || 0,         sub: "",              color: "text-white/80",   bg: "bg-white/[0.04]"     },
          { label: "Replied",        value: s.replied || 0,      sub: `${replyRate}%`, color: "text-emerald-400", bg: "bg-emerald-500/[0.06]" },
          { label: "Unsubscribed",   value: s.unsubscribed || 0, sub: "",              color: "text-amber-400",  bg: "bg-amber-500/[0.05]"  },
          { label: "Bounced/Failed", value: (s.bounced || 0) + (s.failed || 0), sub: "", color: "text-rose-400", bg: "bg-rose-500/[0.05]" },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className={`${bg} border border-white/[0.06] rounded-xl px-4 py-4`}>
            <p className={`font-black text-2xl leading-none ${color}`}>{value.toLocaleString()}</p>
            {sub && <p className={`text-xs font-bold mt-0.5 ${color} opacity-70`}>{sub} rate</p>}
            <p className="text-white/30 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Sequence steps */}
      <div>
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Email Sequence</h2>
        <div className="relative">
          <div className="absolute left-4 top-6 bottom-6 w-px bg-white/[0.06]" />
          <div className="space-y-3">
            {(campaign.steps || []).map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0B2D22] border-2 border-emerald-500/30 flex items-center justify-center shrink-0 z-10 text-xs font-black text-emerald-400">
                  {i + 1}
                </div>
                <div className="flex-1 bg-[#0B2D22] border border-white/[0.06] rounded-xl p-4 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-white font-bold text-sm truncate">{step.subject || "(no subject)"}</p>
                    {step.waitDays > 0 && (
                      <span className="text-white/30 text-xs whitespace-nowrap">after {step.waitDays}d</span>
                    )}
                  </div>
                  <p className="text-white/30 text-xs line-clamp-2">{step.body || "(empty)"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Send queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white/60 text-xs font-bold uppercase tracking-wider">
            Contact Status
            <span className="ml-2 text-white/30 font-normal normal-case">{total.toLocaleString()} records</span>
          </h2>
          {/* Quick filter chips */}
          <div className="flex items-center gap-1.5">
            {["", "pending", "sent", "replied", "failed", "skipped"].map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                className={`text-[10px] px-2 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                  statusFilter === st
                    ? "bg-emerald-500 text-white"
                    : "bg-white/[0.05] text-white/30 hover:text-white/60"
                }`}
              >
                {st || "All"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_80px_100px_120px] gap-x-4 px-5 py-2.5 border-b border-white/[0.06] text-[10px] font-bold text-white/30 uppercase tracking-wider">
            <span>Contact</span>
            <span>Email</span>
            <span>Step</span>
            <span>Status</span>
            <span>Scheduled</span>
          </div>

          {sendsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sends.length === 0 ? (
            <div className="py-10 text-center text-white/30 text-sm">
              {statusFilter ? `No ${statusFilter} records` : "No send records yet"}
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {sends.map((send) => {
                const c    = send.contactId || {};
                const name = c.firstName || c.lastName
                  ? `${c.firstName || ""} ${c.lastName || ""}`.trim()
                  : send.contactEmail;
                const when = send.sentAt || send.scheduledAt;
                return (
                  <div key={send._id} className="grid grid-cols-[1fr_1fr_80px_100px_120px] gap-x-4 px-5 py-3 border-b border-white/[0.03] items-center last:border-0 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-white/[0.07] flex items-center justify-center text-[10px] font-black text-white/40 shrink-0">
                        {(name[0] || "?").toUpperCase()}
                      </div>
                      <span className="text-white/80 text-sm truncate">{name}</span>
                    </div>
                    <span className="text-white/40 text-xs truncate">{send.contactEmail}</span>
                    <span className="text-white/40 text-xs">Step {send.stepIndex + 1}</span>
                    <div className="flex items-center gap-1">
                      <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLOR[send.status] || STATUS_COLOR.skipped}`}>
                        {STATUS_ICON[send.status]}
                        {send.status}
                      </span>
                    </div>
                    <span className="text-white/30 text-xs">
                      {when ? new Date(when).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
              <p className="text-white/30 text-xs">{total.toLocaleString()} records · page {page} of {totalPages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/50 text-xs font-semibold hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                  Prev
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/50 text-xs font-semibold hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
