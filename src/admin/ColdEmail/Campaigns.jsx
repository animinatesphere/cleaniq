import { useState, useEffect, useCallback } from "react";
import { Plus, Play, Pause, Trash2, ChevronRight, Mail, X, ArrowRight, ArrowLeft, Rocket, Save, AlertCircle, Eye, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` });
function afetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...auth(), ...(opts.headers || {}) } });
}

const VARS = ["{{first_name}}", "{{last_name}}", "{{company}}", "{{email}}"];

const STATUS_STYLES = {
  active:    "bg-emerald-500/15 text-emerald-400",
  paused:    "bg-amber-500/15 text-amber-400",
  draft:     "bg-white/[0.08] text-white/50",
  completed: "bg-blue-500/15 text-blue-400",
};

const SEND_STATUS_COLOR = {
  sent:    "bg-blue-500/15 text-blue-400",
  pending: "bg-amber-500/15 text-amber-400",
  replied: "bg-emerald-500/15 text-emerald-400",
  failed:  "bg-rose-500/15 text-rose-400",
  skipped: "bg-white/[0.06] text-white/30",
  bounced: "bg-orange-500/15 text-orange-400",
};

// ── Email Preview Modal ────────────────────────────────────────────────────────

function PreviewModal({ emailStep, onClose }) {
  const sample = { "{{first_name}}": "James", "{{last_name}}": "Wilson", "{{company}}": "ABC Ltd", "{{email}}": "james@abcltd.com" };
  const sub  = Object.entries(sample).reduce((t, [k, v]) => t.replaceAll(k, v), emailStep.subject || "");
  const body = Object.entries(sample).reduce((t, [k, v]) => t.replaceAll(k, v), emailStep.body || "");
  const bodyHtml = body.split("\n").map(l => l.trim()
    ? `<p style="margin:0 0 14px;color:#1e293b;">${l}</p>`
    : `<p style="margin:0 0 6px;">&nbsp;</p>`
  ).join("");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-[580px] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Preview header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-bold text-sm">Email Preview</p>
            <p className="text-white/30 text-xs">Variables replaced with sample data · James Wilson · ABC Ltd</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center text-white/50 hover:text-white cursor-pointer transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Email chrome */}
        <div className="flex-1 overflow-y-auto rounded-2xl shadow-2xl">
          {/* Fake email client header */}
          <div className="bg-gray-100 border-b border-gray-200 px-5 py-4 rounded-t-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#0a6644] flex items-center justify-center text-white text-xs font-black shrink-0">CS</div>
              <div>
                <p className="text-gray-800 text-sm font-bold">cleaniq services</p>
                <p className="text-gray-400 text-xs">via gmail.com · to james@abcltd.com</p>
              </div>
            </div>
            <p className="text-gray-900 font-bold text-base">{sub || "(no subject)"}</p>
          </div>

          {/* Email body */}
          <div style={{background:"#eef2f7",padding:"24px 16px"}}>
            <div style={{maxWidth:"520px",margin:"0 auto"}}>
              {/* Logo header */}
              <div style={{background:"#0a6644",borderRadius:"12px 12px 0 0",padding:"18px",textAlign:"center"}}>
                <span style={{color:"#ffffff",fontSize:"18px",fontWeight:"800",letterSpacing:"-0.5px",fontFamily:"Arial,sans-serif"}}>cleaniq services</span>
              </div>
              {/* Accent bar */}
              <div style={{height:"3px",background:"linear-gradient(90deg,#10b981,#3b82f6)"}} />
              {/* Body */}
              <div
                style={{background:"#ffffff",padding:"36px 32px",borderLeft:"1px solid #dde3ed",borderRight:"1px solid #dde3ed",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif",fontSize:"15px",lineHeight:"1.75",color:"#1e293b"}}
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
              {/* Footer */}
              <div style={{background:"#f8fafc",border:"1px solid #dde3ed",borderTop:"none",borderRadius:"0 0 12px 12px",padding:"18px 32px",textAlign:"center"}}>
                <p style={{margin:"0",fontSize:"11px",color:"#94a3b8",fontFamily:"Arial,sans-serif",lineHeight:"1.6"}}>
                  You received this email because you're on our outreach list.<br/>
                  <a href="#" style={{color:"#64748b",textDecoration:"none",borderBottom:"1px solid #cbd5e1"}}>Unsubscribe</a>
                  {" · "}cleaniq services{" · "}cleaniqservices.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Detail Panel (slide-over) ─────────────────────────────────────────

function CampaignPanel({ campaignId, onClose, onRefresh }) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [sends, setSends]       = useState([]);
  const [sendsLoading, setSendsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [actionBusy, setActionBusy] = useState("");

  const loadCampaign = useCallback(async () => {
    const r = await afetch(`${API}/cold-email/campaigns/${campaignId}`);
    const d = await r.json();
    setCampaign(d);
    setLoading(false);
  }, [campaignId]);

  const loadSends = useCallback(async () => {
    setSendsLoading(true);
    const params = new URLSearchParams({ page, limit: 30 });
    if (statusFilter) params.set("status", statusFilter);
    const r = await afetch(`${API}/cold-email/campaigns/${campaignId}/sends?${params}`);
    const d = await r.json();
    setSends(d.sends || []);
    setTotal(d.total || 0);
    setSendsLoading(false);
  }, [campaignId, page, statusFilter]);

  useEffect(() => { loadCampaign(); }, [loadCampaign]);
  useEffect(() => { loadSends(); }, [loadSends]);

  async function doAction(verb) {
    setActionBusy(verb);
    await afetch(`${API}/cold-email/campaigns/${campaignId}/${verb}`, { method: "POST" });
    await loadCampaign();
    onRefresh();
    setActionBusy("");
  }

  const s = campaign?.stats || {};
  const replyRate = s.sent > 0 ? ((s.replied / s.sent) * 100).toFixed(1) : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[460px] bg-[#061A13] border-l border-white/[0.08] flex flex-col shadow-2xl">

        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Mail size={15} className="text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-sm truncate">{loading ? "Loading…" : (campaign?.name || "—")}</p>
              {!loading && campaign && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${STATUS_STYLES[campaign.status] || STATUS_STYLES.draft}`}>
                  {campaign.status}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!loading && campaign?.status === "active" && (
              <button onClick={() => doAction("pause")} disabled={!!actionBusy}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-500/20 cursor-pointer disabled:opacity-40 transition-all">
                {actionBusy === "pause" ? "…" : "Pause"}
              </button>
            )}
            {!loading && campaign?.status === "paused" && (
              <button onClick={() => doAction("resume")} disabled={!!actionBusy}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-400 cursor-pointer disabled:opacity-40 shadow-lg shadow-emerald-500/20 transition-all">
                {actionBusy === "resume" ? "…" : "Resume"}
              </button>
            )}
            <button onClick={() => { loadCampaign(); loadSends(); }} className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white/70 cursor-pointer transition-colors">
              <RefreshCw size={12} />
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white/70 cursor-pointer transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !campaign ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-white/30 text-sm">Campaign not found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">

            {/* Stats */}
            <div className="p-5">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: "Sent",    value: s.sent || 0,         color: "text-white/80"   },
                  { label: "Replied", value: s.replied || 0,      color: "text-emerald-400" },
                  { label: "Unsub",   value: s.unsubscribed || 0, color: "text-amber-400"   },
                  { label: "Failed",  value: (s.bounced || 0) + (s.failed || 0), color: "text-rose-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-2 py-3 text-center">
                    <p className={`font-black text-xl leading-none ${color}`}>{value.toLocaleString()}</p>
                    <p className="text-white/25 text-[10px] mt-1">{label}</p>
                  </div>
                ))}
              </div>
              {replyRate && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, parseFloat(replyRate))}%` }} />
                  </div>
                  <span className="text-emerald-400 text-xs font-bold shrink-0">{replyRate}% reply rate</span>
                </div>
              )}
            </div>

            {/* Campaign meta */}
            <div className="px-5 py-4 space-y-2">
              {[
                { label: "From name",  value: campaign.fromName || <span className="text-white/25 italic">defaults to mailbox email</span> },
                { label: "Contacts",   value: `${(campaign.contactIds?.length || 0).toLocaleString()} recipients` },
                { label: "Launched",   value: campaign.launchedAt ? new Date(campaign.launchedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : <span className="text-white/25 italic">not launched</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-white/30 text-xs">{label}</span>
                  <span className="text-white/75 text-xs font-semibold text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Email sequence */}
            <div className="px-5 py-4">
              <p className="text-white/35 text-[10px] font-bold uppercase tracking-wider mb-3">Email Sequence</p>
              <div className="space-y-2">
                {(campaign.steps || []).map((step, i) => (
                  <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-white/[0.05] ${i === 0 ? "bg-emerald-500/[0.05]" : ""}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${i === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.07] text-white/40"}`}>{i + 1}</div>
                      <p className="text-white/85 text-xs font-bold truncate flex-1">{step.subject || "(no subject)"}</p>
                      {step.waitDays > 0 && <span className="text-white/25 text-[10px] shrink-0 bg-white/[0.05] px-1.5 py-0.5 rounded">+{step.waitDays}d</span>}
                    </div>
                    <p className="px-3 py-2.5 text-white/35 text-[11px] leading-relaxed line-clamp-3 whitespace-pre-wrap">{step.body || "(empty)"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact status table */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/35 text-[10px] font-bold uppercase tracking-wider">
                  Recipients <span className="text-white/20 font-normal ml-1">{total.toLocaleString()}</span>
                </p>
                <div className="flex gap-1">
                  {["", "pending", "sent", "replied", "failed"].map(st => (
                    <button key={st} onClick={() => { setStatusFilter(st); setPage(1); }}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition-all uppercase tracking-wide ${statusFilter === st ? "bg-emerald-500 text-white" : "bg-white/[0.04] text-white/25 hover:text-white/60"}`}>
                      {st || "All"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                {sendsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : sends.length === 0 ? (
                  <div className="py-8 text-center text-white/20 text-xs">No records{statusFilter ? ` with status "${statusFilter}"` : ""}</div>
                ) : sends.map((send) => {
                  const c    = send.contactId || {};
                  const name = (c.firstName || c.lastName) ? `${c.firstName || ""} ${c.lastName || ""}`.trim() : send.contactEmail;
                  const when = send.sentAt || send.scheduledAt;
                  return (
                    <div key={send._id} className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-[11px] font-black text-white/40 shrink-0">
                        {(name[0] || "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/75 text-xs font-medium truncate">{name}</p>
                        <p className="text-white/25 text-[10px] truncate">{send.contactEmail}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide ${SEND_STATUS_COLOR[send.status] || SEND_STATUS_COLOR.skipped}`}>
                          {send.status}
                        </span>
                        <span className="text-white/20 text-[9px]">
                          {when ? new Date(when).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {total > 30 && (
                <div className="flex items-center justify-between mt-2 text-[10px] text-white/25">
                  <span>Page {page} of {Math.ceil(total / 30)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.05] disabled:opacity-30 cursor-pointer disabled:cursor-default hover:bg-white/[0.07] transition-colors">← Prev</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={sends.length < 30}
                      className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.05] disabled:opacity-30 cursor-pointer disabled:cursor-default hover:bg-white/[0.07] transition-colors">Next →</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

function Wizard({ onClose, onCreated, editCampaign }) {
  const TOTAL_STEPS = 4;
  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [mailboxes, setMailboxes] = useState([]);
  const [contacts,  setContacts]  = useState([]);
  const [contactTotal, setContactTotal] = useState(0);
  const [contactSearch, setContactSearch] = useState("");
  const [contactPage, setContactPage] = useState(1);
  const [previewIdx, setPreviewIdx] = useState(null);

  const [data, setData] = useState(
    editCampaign
      ? {
          name:       editCampaign.name || "",
          fromName:   editCampaign.fromName || "",
          mailboxIds: editCampaign.mailboxIds || [],
          steps:      editCampaign.steps?.length
            ? editCampaign.steps
            : [{ order: 0, subject: "", body: "", waitDays: 0 }],
          contactIds: editCampaign.contactIds || [],
        }
      : {
          name:       "",
          fromName:   "",
          mailboxIds: [],
          steps:      [{ order: 0, subject: "", body: "", waitDays: 0 }],
          contactIds: [],
        }
  );

  useEffect(() => {
    afetch(`${API}/cold-email/mailboxes`).then((r) => r.json()).then(setMailboxes).catch(() => {});
  }, []);

  const loadContacts = useCallback(async () => {
    const params = new URLSearchParams({ page: contactPage, limit: 50, search: contactSearch });
    const r = await fetch(`${API}/cold-email/contacts?${params}`, { headers: auth() });
    const d = await r.json();
    setContacts(d.contacts || []);
    setContactTotal(d.total || 0);
  }, [contactPage, contactSearch]);

  useEffect(() => { if (step === 3) loadContacts(); }, [step, loadContacts]);

  function setStepField(idx, field, val) {
    const steps = [...data.steps];
    steps[idx] = { ...steps[idx], [field]: val };
    setData((d) => ({ ...d, steps }));
  }

  function addStep() {
    if (data.steps.length >= 3) return;
    setData((d) => ({ ...d, steps: [...d.steps, { order: d.steps.length, subject: "", body: "", waitDays: 3 }] }));
  }

  function removeStep(idx) {
    setData((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })) }));
  }

  function insertVar(stepIdx, field, varStr) {
    const current = data.steps[stepIdx][field] || "";
    setStepField(stepIdx, field, current + varStr);
  }

  function toggleMailbox(id) {
    setData((d) => ({
      ...d,
      mailboxIds: d.mailboxIds.includes(id) ? d.mailboxIds.filter((m) => m !== id) : [...d.mailboxIds, id],
    }));
  }

  function toggleContact(id) {
    setData((d) => ({
      ...d,
      contactIds: d.contactIds.includes(id) ? d.contactIds.filter((c) => c !== id) : [...d.contactIds, id],
    }));
  }

  function toggleAllContacts() {
    const allOn = contacts.every((c) => data.contactIds.includes(c._id));
    if (allOn) {
      setData((d) => ({ ...d, contactIds: d.contactIds.filter((id) => !contacts.find((c) => c._id === id)) }));
    } else {
      const toAdd = contacts.filter((c) => !data.contactIds.includes(c._id)).map((c) => c._id);
      setData((d) => ({ ...d, contactIds: [...d.contactIds, ...toAdd] }));
    }
  }

  // Step order: 1=Write Email, 2=Campaign Setup, 3=Select Recipients, 4=Review
  function validate() {
    if (step === 1) {
      for (const s of data.steps) {
        if (!s.subject.trim()) return "Every email needs a subject line";
        if (!s.body.trim())    return "Every email needs a message body";
      }
    }
    if (step === 2) {
      if (!data.name.trim()) return "Campaign name is required";
      if (data.mailboxIds.length === 0) return "Select at least one Gmail account to send from";
    }
    if (step === 3) {
      if (data.contactIds.length === 0) return "Select at least one contact to send to";
    }
    return "";
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  }

  function back() { setError(""); setStep((s) => s - 1); }

  async function save(launch = false) {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");
    try {
      let campaign;
      if (editCampaign) {
        const r = await afetch(`${API}/cold-email/campaigns/${editCampaign._id}`, { method: "PUT", body: JSON.stringify(data) });
        campaign = await r.json();
      } else {
        const r = await afetch(`${API}/cold-email/campaigns`, { method: "POST", body: JSON.stringify(data) });
        campaign = await r.json();
      }
      if (campaign.message) throw new Error(campaign.message);
      if (launch) {
        const r = await afetch(`${API}/cold-email/campaigns/${campaign._id}/launch`, { method: "POST" });
        const d = await r.json();
        if (d.message) throw new Error(d.message);
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const stepLabels = ["Write Your Email", "Campaign Setup", "Select Recipients", "Review & Launch"];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <div className="bg-[#061A13] border border-white/[0.08] rounded-2xl w-full max-w-[740px] max-h-[88vh] flex flex-col shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Mail size={15} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-black text-sm leading-none">{editCampaign ? "Edit Campaign" : "New Campaign"}</h2>
                <p className="text-white/35 text-xs mt-0.5">Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.08] cursor-pointer transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center px-6 pt-5 pb-1">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 shrink-0 ${i + 1 <= step ? "opacity-100" : "opacity-25"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    i + 1 < step  ? "bg-emerald-500 text-white" :
                    i + 1 === step ? "bg-emerald-500 text-white ring-[3px] ring-emerald-500/25" :
                                     "bg-white/[0.07] text-white/40"
                  }`}>
                    {i + 1 < step ? (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block ${i + 1 === step ? "text-white" : "text-white/40"}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 h-px mx-3 transition-colors ${i + 1 < step ? "bg-emerald-500/50" : "bg-white/[0.07]"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* ── Step 1: Write Your Email ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                  <div className="w-4 h-4 mt-0.5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Write the email your contacts will receive. Use{" "}
                    <code className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded text-[11px]">{"{{first_name}}"}</code>,{" "}
                    <code className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded text-[11px]">{"{{company}}"}</code> to personalise each message.
                    An unsubscribe link is added automatically.
                  </p>
                </div>

                {data.steps.map((s, idx) => (
                  <div key={idx} className="border border-white/[0.08] rounded-2xl overflow-hidden">
                    {/* Email card header */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b border-white/[0.07] ${idx === 0 ? "bg-emerald-500/[0.06]" : "bg-white/[0.03]"}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? "bg-emerald-500/25 text-emerald-400" : "bg-white/[0.08] text-white/50"}`}>{idx + 1}</div>
                        <span className={`text-sm font-bold ${idx === 0 ? "text-emerald-300/90" : "text-white/70"}`}>
                          {idx === 0 ? "First email" : `Follow-up ${idx}`}
                        </span>
                        {idx === 0 && <span className="text-emerald-400/40 text-xs hidden sm:inline">· sent immediately on launch</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {idx > 0 && (
                          <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-1.5">
                            <span className="text-white/35 text-xs">Wait</span>
                            <input
                              type="number" min="1" max="30"
                              value={s.waitDays}
                              onChange={(e) => setStepField(idx, "waitDays", Number(e.target.value))}
                              className="w-8 bg-transparent text-white text-sm text-center focus:outline-none font-bold"
                            />
                            <span className="text-white/35 text-xs">days</span>
                          </div>
                        )}
                        {/* Preview button */}
                        <button
                          onClick={() => setPreviewIdx(idx)}
                          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/80 hover:bg-white/[0.08] cursor-pointer transition-all"
                        >
                          <Eye size={11} /> Preview
                        </button>
                        {idx > 0 && (
                          <button onClick={() => removeStep(idx)} className="text-white/20 hover:text-rose-400 cursor-pointer transition-colors p-1">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Email compose body */}
                    <div className="bg-white/[0.015]">
                      {/* Subject row */}
                      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                        <span className="text-white/25 text-xs font-bold uppercase tracking-wider w-14 shrink-0">Subject</span>
                        <input
                          type="text"
                          value={s.subject}
                          onChange={(e) => setStepField(idx, "subject", e.target.value)}
                          placeholder={idx === 0 ? "e.g. Quick question, {{first_name}}" : "e.g. Following up, {{first_name}}"}
                          className="flex-1 bg-transparent text-white/90 placeholder:text-white/20 text-sm focus:outline-none"
                        />
                      </div>

                      {/* Body textarea */}
                      <div className="relative">
                        <textarea
                          value={s.body}
                          onChange={(e) => setStepField(idx, "body", e.target.value)}
                          rows={9}
                          placeholder={"Hi {{first_name}},\n\nI noticed {{company}} could benefit from our professional cleaning services.\n\nWould you be open to a quick 10-minute call this week?\n\nBest regards,\nThe cleaniq services team"}
                          className="w-full bg-transparent px-4 pt-4 pb-8 text-white/85 placeholder:text-white/15 text-sm focus:outline-none resize-none leading-relaxed"
                        />
                        <div className="absolute bottom-2.5 right-3.5 text-white/20 text-[11px] select-none pointer-events-none">
                          {s.body.trim() ? s.body.trim().split(/\s+/).filter(Boolean).length : 0} words · {s.body.length} chars
                        </div>
                      </div>

                      {/* Variable chips */}
                      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.05] flex-wrap">
                        <span className="text-white/20 text-xs font-semibold shrink-0">Insert:</span>
                        {VARS.map((v) => (
                          <button
                            key={v}
                            onClick={() => insertVar(idx, "body", v)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/[0.07] text-emerald-400/70 border border-emerald-500/[0.15] hover:bg-emerald-500/15 hover:text-emerald-300 hover:border-emerald-500/30 cursor-pointer font-mono transition-all"
                          >{v}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {data.steps.length < 3 && (
                  <button
                    onClick={addStep}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/[0.15] hover:bg-white/[0.02] text-sm font-semibold cursor-pointer transition-all"
                  >
                    <Plus size={14} />
                    Add follow-up email
                    <span className="text-white/20 text-xs">({data.steps.length} of 3)</span>
                  </button>
                )}
              </div>
            )}

            {/* ── Step 2: Campaign Setup ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1">Campaign Name *</label>
                    <p className="text-white/25 text-xs mb-2">A name to identify this campaign in your dashboard</p>
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                      placeholder="e.g. Commercial Cleaning Outreach"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1">
                      Your Name <span className="text-white/25 font-normal normal-case text-[11px]">(optional)</span>
                    </label>
                    <p className="text-white/25 text-xs mb-2">Shown as the sender name in the inbox</p>
                    <input
                      type="text"
                      value={data.fromName}
                      onChange={(e) => setData((d) => ({ ...d, fromName: e.target.value }))}
                      placeholder="e.g. Adeyemi from cleaniq services"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-1">Send emails from *</label>
                  <p className="text-white/25 text-xs mb-3">Choose which Gmail account sends these emails. Connect one in the Mailboxes tab first.</p>
                  {mailboxes.length === 0 ? (
                    <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl px-4 py-3.5 flex items-center gap-3">
                      <AlertCircle size={15} className="text-amber-400 shrink-0" />
                      <p className="text-amber-400/90 text-sm">No Gmail accounts connected yet. Go to the <strong>Mailboxes</strong> tab and connect one first.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {mailboxes.map((box) => {
                        const on  = data.mailboxIds.includes(box._id);
                        const pct = box.dailyLimit > 0 ? Math.round((box.sentToday / box.dailyLimit) * 100) : 0;
                        return (
                          <div
                            key={box._id}
                            onClick={() => toggleMailbox(box._id)}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${
                              on ? "bg-emerald-500/[0.08] border-emerald-500/30" : "bg-white/[0.025] border-white/[0.07] hover:bg-white/[0.04] hover:border-white/[0.12]"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${on ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                              {on && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-white/90 text-sm font-semibold truncate">{box.email}</p>
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase ${STATUS_STYLES[box.status] || STATUS_STYLES.draft}`}>{box.status}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden max-w-[80px]">
                                  <div className={`h-full rounded-full ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                                </div>
                                <p className="text-white/30 text-[11px]">{box.sentToday}/{box.dailyLimit} sent today</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 3: Select Recipients ── */}
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
                    <p className="text-white/30 text-xs mt-0.5">{contactTotal.toLocaleString()} total in database</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        const params = new URLSearchParams({ search: contactSearch });
                        const r = await fetch(`${API}/cold-email/contacts/all-ids?${params}`, { headers: auth() });
                        const d = await r.json();
                        if (d.ids) setData((prev) => ({ ...prev, contactIds: d.ids }));
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer transition-colors"
                    >
                      Select all {contactTotal.toLocaleString()}
                    </button>
                    <span className="text-white/10">|</span>
                    <button
                      onClick={() => setData((prev) => ({ ...prev, contactIds: [] }))}
                      className="text-xs text-white/30 hover:text-white/60 font-bold cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={toggleAllContacts}
                      className="text-xs text-white/30 hover:text-white/60 font-semibold cursor-pointer transition-colors"
                    >
                      {contacts.every((c) => data.contactIds.includes(c._id)) ? "Deselect page" : "Select page"}
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => { setContactSearch(e.target.value); setContactPage(1); }}
                  placeholder="Search by name, email or company…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all"
                />

                <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl max-h-64 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <div className="py-10 text-center text-white/30 text-sm">No contacts found</div>
                  ) : (
                    contacts.map((c) => {
                      const sel  = data.contactIds.includes(c._id);
                      const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email;
                      return (
                        <div
                          key={c._id}
                          onClick={() => toggleContact(c._id)}
                          className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] cursor-pointer transition-colors last:border-0 ${sel ? "bg-emerald-500/[0.07]" : "hover:bg-white/[0.03]"}`}
                        >
                          <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${sel ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                            {sel && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/85 text-sm font-medium truncate">{name}</p>
                            <p className="text-white/30 text-xs truncate">{c.email}</p>
                          </div>
                          {c.company && <span className="text-white/20 text-xs truncate max-w-[100px] hidden sm:block">{c.company}</span>}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-white/25">
                  <span>Page {contactPage}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => setContactPage((p) => Math.max(1, p - 1))} disabled={contactPage === 1} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] disabled:opacity-30 cursor-pointer disabled:cursor-default hover:bg-white/[0.07] transition-colors">← Prev</button>
                    <button onClick={() => setContactPage((p) => p + 1)} disabled={contacts.length < 50} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] disabled:opacity-30 cursor-pointer disabled:cursor-default hover:bg-white/[0.07] transition-colors">Next →</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Review ── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
                  {[
                    { label: "Campaign name", value: data.name,         icon: "📋" },
                    { label: "From name",     value: data.fromName || "Defaults to mailbox email", dim: !data.fromName, icon: "👤" },
                    { label: "Mailboxes",     value: `${data.mailboxIds.length} mailbox${data.mailboxIds.length !== 1 ? "es" : ""} selected`, icon: "📬" },
                    { label: "Email steps",   value: `${data.steps.length} email${data.steps.length > 1 ? "s" : ""} in sequence`, icon: "✉️" },
                    { label: "Recipients",    value: `${data.contactIds.length.toLocaleString()} contacts`, icon: "👥" },
                  ].map(({ label, value, dim, icon }) => (
                    <div key={label} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{icon}</span>
                        <span className="text-white/40 text-sm">{label}</span>
                      </div>
                      <span className={`text-sm font-semibold ${dim ? "text-white/30" : "text-white"}`}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Email snippet preview */}
                <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-4 space-y-2">
                  <p className="text-white/35 text-[10px] font-bold uppercase tracking-wider mb-2">First Email Preview</p>
                  <div className="flex items-center gap-2 border-b border-white/[0.05] pb-2">
                    <span className="text-white/25 text-xs w-14 shrink-0">Subject</span>
                    <span className="text-white/80 text-xs font-medium truncate">{data.steps[0]?.subject || "(no subject)"}</span>
                  </div>
                  <p className="text-white/35 text-xs leading-relaxed line-clamp-3 whitespace-pre-wrap">{data.steps[0]?.body || "(empty)"}</p>
                  <button onClick={() => setPreviewIdx(0)} className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold hover:text-emerald-300 cursor-pointer transition-colors mt-1">
                    <Eye size={12} /> Preview full email
                  </button>
                </div>

                <div className="bg-amber-500/[0.07] border border-amber-500/[0.18] rounded-xl px-4 py-3.5 space-y-1.5">
                  <p className="text-amber-400 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={14} /> Before you launch
                  </p>
                  <ul className="text-amber-400/70 text-xs space-y-1 list-disc list-inside">
                    <li>Every email includes a mandatory unsubscribe link</li>
                    <li>Sends are spread with random gaps across contacts</li>
                    <li>Daily limits per mailbox are enforced automatically</li>
                    <li>Make sure <code className="font-mono">COLD_EMAIL_DRY_RUN=false</code> on the server to deliver real emails</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-rose-500/[0.08] border border-rose-500/20 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-rose-400 shrink-0" />
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
            <button
              onClick={back}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/40 text-sm font-bold hover:text-white/70 disabled:opacity-0 disabled:pointer-events-none cursor-pointer transition-all"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <div className="flex gap-2.5">
              {step < TOTAL_STEPS && (
                <button
                  onClick={next}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Continue <ArrowRight size={14} />
                </button>
              )}
              {step === TOTAL_STEPS && (
                <>
                  <button
                    onClick={() => save(false)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.09] text-white/60 text-sm font-bold hover:bg-white/[0.09] cursor-pointer transition-all disabled:opacity-40"
                  >
                    <Save size={14} /> Save Draft
                  </button>
                  <button
                    onClick={() => save(true)}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40"
                  >
                    {saving ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Launching…</>
                    ) : (
                      <><Rocket size={14} /> Launch Campaign</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email preview modal */}
      {previewIdx !== null && (
        <PreviewModal emailStep={data.steps[previewIdx]} onClose={() => setPreviewIdx(null)} />
      )}
    </>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign, onView, onRefresh }) {
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
    if (!confirm(`Delete "${campaign.name}"? All send records will also be deleted.`)) return;
    setBusy("delete");
    await afetch(`${API}/cold-email/campaigns/${campaign._id}`, { method: "DELETE" });
    onRefresh();
  }

  const s          = campaign.stats || {};
  const firstStep  = campaign.steps?.[0] || {};
  const bodySnip   = (firstStep.body || "").replace(/\s+/g, " ").trim().slice(0, 110);
  const replyRate  = s.sent > 0 ? ((s.replied / s.sent) * 100).toFixed(1) : null;
  const sentPct    = campaign.contactIds?.length > 0 ? Math.min(100, Math.round((s.sent / campaign.contactIds.length) * 100)) : 0;

  const borderColor =
    campaign.status === "active"    ? "border-l-emerald-500" :
    campaign.status === "paused"    ? "border-l-amber-400"   :
    campaign.status === "completed" ? "border-l-blue-400"    :
                                      "border-l-white/10";

  return (
    <div
      onClick={onView}
      className={`bg-[#0B2D22] border border-white/[0.06] border-l-4 ${borderColor} rounded-2xl p-5 cursor-pointer hover:bg-[#0d3328] hover:border-white/[0.10] transition-all group`}
    >
      {/* Top: name + status + actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-white font-black text-sm">{campaign.name}</h3>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_STYLES[campaign.status] || STATUS_STYLES.draft}`}>
              {campaign.status}
            </span>
          </div>
          {/* Subject snippet */}
          {firstStep.subject && (
            <div className="flex items-center gap-1.5 mb-1">
              <Mail size={10} className="text-white/25 shrink-0" />
              <p className="text-white/65 text-xs font-medium truncate">{firstStep.subject}</p>
            </div>
          )}
          {/* Body snippet */}
          {bodySnip && (
            <p className="text-white/30 text-xs line-clamp-1 leading-relaxed">{bodySnip}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {(campaign.status === "active" || campaign.status === "paused") && (
            <button
              onClick={(e) => action(campaign.status === "active" ? "pause" : "resume", e)}
              disabled={!!busy}
              title={campaign.status === "active" ? "Pause" : "Resume"}
              className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/35 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer disabled:opacity-40 transition-all"
            >
              {busy === "pause" || busy === "resume"
                ? <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                : campaign.status === "active" ? <Pause size={11} /> : <Play size={11} />
              }
            </button>
          )}
          <button
            onClick={del}
            disabled={!!busy}
            title="Delete"
            className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/35 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-40 transition-all"
          >
            {busy === "delete"
              ? <div className="w-3 h-3 border border-rose-400 border-t-transparent rounded-full animate-spin" />
              : <Trash2 size={11} />
            }
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-5 flex-wrap mt-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-white/80 font-black text-lg leading-none">{(s.sent || 0).toLocaleString()}</p>
            <p className="text-white/25 text-[10px] mt-0.5">sent</p>
          </div>
          {replyRate !== null && (
            <div>
              <p className="text-emerald-400 font-black text-lg leading-none">{replyRate}%</p>
              <p className="text-white/25 text-[10px] mt-0.5">replied</p>
            </div>
          )}
          {(s.unsubscribed || 0) > 0 && (
            <div>
              <p className="text-amber-400 font-black text-lg leading-none">{s.unsubscribed}</p>
              <p className="text-white/25 text-[10px] mt-0.5">unsub</p>
            </div>
          )}
          <div>
            <p className="text-white/45 font-black text-lg leading-none">{(campaign.contactIds?.length || 0).toLocaleString()}</p>
            <p className="text-white/25 text-[10px] mt-0.5">contacts</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 text-white/25 text-xs">
          {campaign.launchedAt && (
            <span>Launched {new Date(campaign.launchedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          )}
          <ChevronRight size={13} className="text-white/15 group-hover:text-emerald-400/60 transition-colors" />
        </div>
      </div>

      {/* Progress bar */}
      {sentPct > 0 && (
        <div className="mt-3.5 h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${sentPct >= 100 ? "bg-blue-500/60" : "bg-emerald-500/50"}`}
            style={{ width: `${sentPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main Campaigns Component ──────────────────────────────────────────────────

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

  const filtered = filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  const totals = {
    active:    campaigns.filter((c) => c.status === "active").length,
    draft:     campaigns.filter((c) => c.status === "draft").length,
    paused:    campaigns.filter((c) => c.status === "paused").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
  };
  const totalSent    = campaigns.reduce((a, c) => a + (c.stats?.sent    || 0), 0);
  const totalReplied = campaigns.reduce((a, c) => a + (c.stats?.replied || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white font-black text-lg">Campaigns</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {campaigns.length} total · {totalSent.toLocaleString()} emails sent · {totalReplied.toLocaleString()} replies
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: "all",       label: "All",       count: campaigns.length },
          { id: "active",    label: "Active",    count: totals.active    },
          { id: "draft",     label: "Draft",     count: totals.draft     },
          { id: "paused",    label: "Paused",    count: totals.paused    },
          { id: "completed", label: "Completed", count: totals.completed },
        ].map(({ id, label, count }) => count > 0 || id === "all" ? (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === id
                ? "bg-emerald-500 text-white"
                : "bg-white/[0.05] text-white/40 border border-white/[0.06] hover:text-white/70"
            }`}
          >
            {label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${filter === id ? "bg-white/20 text-white" : "bg-white/[0.07] text-white/40"}`}>{count}</span>
          </button>
        ) : null)}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0B2D22] border border-white/[0.06] border-dashed rounded-2xl py-20 flex flex-col items-center text-center px-8">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Mail size={24} className="text-emerald-400/60" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            {filter === "all" ? "No campaigns yet" : `No ${filter} campaigns`}
          </h3>
          <p className="text-white/30 text-sm max-w-xs mb-6">
            {filter === "all"
              ? "Create your first cold email campaign. Connect a mailbox, import contacts, then build your sequence."
              : `You don't have any ${filter} campaigns right now.`}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus size={14} /> Create your first campaign
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CampaignCard
              key={c._id}
              campaign={c}
              onView={() => setSelectedId(c._id)}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {wizardOpen && (
        <Wizard onClose={() => setWizardOpen(false)} onCreated={load} />
      )}

      {selectedId && (
        <CampaignPanel
          campaignId={selectedId}
          onClose={() => setSelectedId(null)}
          onRefresh={load}
        />
      )}
    </div>
  );
}
