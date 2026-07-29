import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Send, X, RefreshCw, Eye, Mail, Upload, Clock,
  MoreHorizontal, Trash2, MessageSquare, Users, BarChart2,
  ChevronRight, Plus, Zap,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SEGMENTS = [
  { value: "all",    label: "All Customers" },
  { value: "vip",    label: "VIP" },
  { value: "regular",label: "Regular" },
  { value: "new",    label: "New Customers" },
  { value: "at-risk",label: "At Risk" },
  { value: "custom", label: "Custom (paste or upload)" },
];

const STATUS_META = {
  sent:    { label: "Sent",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-500" },
  sending: { label: "Sending", cls: "bg-blue-500/15 text-blue-400 border-blue-500/25",         dot: "bg-blue-500 animate-pulse" },
  queued:  { label: "Queued",  cls: "bg-amber-500/15 text-amber-400 border-amber-500/25",      dot: "bg-amber-500 animate-pulse" },
  draft:   { label: "Draft",   cls: "bg-white/5 text-white/40 border-white/10",                 dot: "bg-white/25" },
  failed:  { label: "Failed",  cls: "bg-rose-500/15 text-rose-400 border-rose-500/25",         dot: "bg-rose-500" },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDatetime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ProgressBar({ sent, total }) {
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  return (
    <div className="mt-2.5">
      <div className="flex justify-between text-[10px] text-white/40 mb-1">
        <span>{sent} / {total} sent</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function extractEmailsFromCsv(text) {
  const lines = text.split(/\r?\n/);
  const emails = [];
  for (const line of lines) {
    const cells = line.split(/[,\t]/);
    for (const cell of cells) {
      const val = cell.trim().replace(/^["']|["']$/g, "");
      if (val.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        emails.push(val.toLowerCase());
      }
    }
  }
  return [...new Set(emails)];
}

function CampaignMenu({ campaign, onView, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 bg-[#0B2D22] border border-white/10 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => { setOpen(false); onView(campaign); }}
            className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.04] transition-colors"
          >
            <Eye size={13} /> View Message
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(campaign._id); }}
            className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function MessageDrawer({ campaign, onClose }) {
  if (!campaign) return null;
  const body = campaign.body || campaign.message || "";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full sm:w-120 bg-[#0B2D22] z-50 flex flex-col shadow-2xl border-l border-white/10">
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/7 shrink-0">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Campaign</p>
            <h2 className="text-base font-bold text-white leading-tight">{campaign.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-white/[0.04] flex flex-wrap gap-3 shrink-0">
          <StatusBadge status={campaign.status} />
          <span className="text-xs text-white/40 font-medium">{fmtDatetime(campaign.sentAt || campaign.createdAt)}</span>
          {(campaign.totalCount || campaign.recipientCount) > 0 && (
            <span className="text-xs font-semibold text-white/80">
              {campaign.sentCount || campaign.recipientCount || campaign.totalCount} recipient{(campaign.totalCount ?? campaign.recipientCount) !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="px-6 py-4 border-b border-white/[0.04] shrink-0">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Subject</p>
          <p className="text-sm font-semibold text-white">{campaign.subject}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Message</p>
          <div className="bg-[#071D16] rounded-xl px-5 py-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-mono border border-white/10">
            {body || <span className="text-white/25 italic">No message body recorded.</span>}
          </div>

          {campaign.recipients?.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                Recipients ({campaign.recipients.length})
              </p>
              <div className="bg-[#071D16] rounded-xl p-3 max-h-40 overflow-y-auto border border-white/10 space-y-1">
                {campaign.recipients.slice(0, 30).map((email, i) => (
                  <p key={i} className="text-xs text-white/80 font-mono truncate">{email}</p>
                ))}
                {campaign.recipients.length > 30 && (
                  <p className="text-xs text-white/25 italic">…and {campaign.recipients.length - 30} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns]     = useState([]);
  const [customers, setCustomers]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [deletingId, setDeletingId]   = useState(null);
  const [toast, setToast]             = useState(null);
  const [fileEmails, setFileEmails]   = useState([]);
  const [fileName, setFileName]       = useState("");
  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const [form, setForm] = useState({
    name: "", segment: "all", subject: "", body: "", customEmails: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/marketing/campaigns`).catch(() => ({ data: [] }));
      const data = Array.isArray(res.data) ? res.data : [];
      setCampaigns(data);
      const hasActive = data.some(c => c.status === "sending" || c.status === "queued");
      if (!hasActive && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch { }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, cRes] = await Promise.all([
        axios.get(`${API}/marketing/campaigns`).catch(() => ({ data: [] })),
        axios.get(`${API}/customers`).catch(() => ({ data: [] })),
      ]);
      setCampaigns(Array.isArray(hRes.data) ? hRes.data : []);
      setCustomers(Array.isArray(cRes.data) ? cRes.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAll]);

  useEffect(() => {
    const hasActive = campaigns.some(c => c.status === "sending" || c.status === "queued");
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(fetchHistory, 30000);
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [campaigns, fetchHistory]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileEmails(extractEmailsFromCsv(ev.target.result));
    reader.readAsText(file);
  };

  const clearFile = () => {
    setFileEmails([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const getTargetEmails = () => {
    if (form.segment === "custom") {
      const pasted = form.customEmails
        .split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes("@"));
      return [...new Set([...pasted, ...fileEmails])];
    }
    return customers
      .filter(c => {
        if (form.segment === "all") return true;
        const tag = (c.segment || c.tags || "").toString().toLowerCase();
        if (form.segment === "vip")     return tag.includes("vip");
        if (form.segment === "regular") return tag.includes("regular");
        if (form.segment === "new")     return tag.includes("new");
        if (form.segment === "at-risk") return tag.includes("at risk") || tag.includes("at-risk");
        return true;
      })
      .map(c => c.email).filter(Boolean);
  };

  const targetEmails = getTargetEmails();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      showToast("Campaign name, subject and body are required", "error");
      return;
    }
    if (targetEmails.length === 0) {
      showToast("No recipients — paste emails, upload a CSV, or pick a segment with customers", "error");
      return;
    }
    const mins = targetEmails.length;
    if (!window.confirm(
      `Queue campaign to ${targetEmails.length} recipient${targetEmails.length !== 1 ? "s" : ""}?\n\n` +
      `Emails send at 1 per minute (~${mins} min total).\nYou can close this tab — sending continues in the background.`
    )) return;

    setSending(true);
    try {
      const res = await axios.post(`${API}/marketing/campaign`, {
        name: form.name, segment: form.segment, subject: form.subject,
        body: form.body, targetEmails,
      });
      showToast(res.data?.message || `Campaign queued for ${targetEmails.length} recipients.`);
      setForm({ name: "", segment: "all", subject: "", body: "", customEmails: "" });
      clearFile();
      setShowComposer(false);
      setShowPreview(false);
      fetchAll();
      if (!pollRef.current) pollRef.current = setInterval(fetchHistory, 30000);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to queue campaign", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this campaign? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/marketing/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c._id !== id));
      showToast("Campaign deleted");
    } catch {
      showToast("Failed to delete campaign", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const totalSent = campaigns.reduce((s, c) => s + (c.sentCount || c.recipientCount || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === "sending" || c.status === "queued").length;

  return (
    <div className="space-y-5">

      {toast && (
        <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-80 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 ${
          toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"
        }`}>
          {toast.type === "error" ? <X size={14} /> : <Zap size={14} />}
          {toast.msg}
        </div>
      )}

      <MessageDrawer campaign={viewCampaign} onClose={() => setViewCampaign(null)} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Campaign Manager</h1>
          <p className="text-sm text-white/40 mt-0.5">Bulk email — sent at 1 per minute, continues in the background.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white/80 hover:text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowComposer(o => !o)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Plus size={13} /> New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Mail size={15} />,      label: "Total Campaigns", val: campaigns.length, color: "text-white",       bg: "bg-[#071D16] border-white/7" },
          { icon: <Users size={15} />,     label: "Emails Sent",     val: totalSent,         color: "text-emerald-400", bg: "bg-[#071D16] border-white/7" },
          { icon: <BarChart2 size={15} />, label: "Active",          val: activeCampaigns,   color: "text-blue-400",   bg: "bg-[#071D16] border-white/7" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3.5 border flex items-center gap-3`}>
            <span className={`${s.color} opacity-70 shrink-0`}>{s.icon}</span>
            <div>
              <p className={`text-2xl font-black ${s.color} leading-none`}>{s.val}</p>
              <p className="text-[11px] text-white/40 font-medium mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {showComposer && (
        <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/7 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Compose Campaign</h2>
              <p className="text-xs text-white/40 mt-0.5">Emails are queued and sent at 1 per minute.</p>
            </div>
            <button onClick={() => setShowComposer(false)} className="text-white/40 hover:text-white w-7 h-7 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSend} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Campaign Name</label>
                <input
                  required
                  placeholder="e.g. Summer Re-engagement"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Target Segment</label>
                <select
                  value={form.segment}
                  onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                >
                  {SEGMENTS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {form.segment !== "custom" && (
                  <p className="text-xs text-white/40 mt-1">
                    <span className="font-semibold text-white/80">{targetEmails.length}</span> recipient{targetEmails.length !== 1 ? "s" : ""} matched
                  </p>
                )}
              </div>
            </div>

            {form.segment === "custom" && (
              <div className="bg-[#071D16] rounded-xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3.5 py-2 border border-dashed border-white/20 rounded-xl bg-white/[0.03] hover:bg-white/5 cursor-pointer text-xs font-semibold text-white/80 transition-colors">
                    <Upload size={12} />
                    {fileName ? `${fileName} (${fileEmails.length} emails)` : "Upload CSV…"}
                    <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {fileName && (
                    <button type="button" onClick={clearFile} className="text-white/40 hover:text-rose-400 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <textarea
                  placeholder="Or paste emails — commas, semicolons, or newlines"
                  rows={3}
                  value={form.customEmails}
                  onChange={e => setForm(f => ({ ...f, customEmails: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 resize-none transition-colors"
                />
                <p className="text-xs text-white/40">
                  <span className="font-semibold text-white">{targetEmails.length} unique email{targetEmails.length !== 1 ? "s" : ""}</span>
                  {targetEmails.length > 0 && <span className="text-white/25"> · ~{targetEmails.length} min to send</span>}
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Subject Line</label>
              <input
                required
                placeholder="e.g. A special offer just for you"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Message Body</label>
                <button
                  type="button"
                  onClick={() => setShowPreview(p => !p)}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                >
                  <Eye size={11} /> {showPreview ? "Hide preview" : "Preview"}
                </button>
              </div>
              <textarea
                required
                rows={7}
                placeholder={"Hi [name],\n\nWrite your message here...\n\nThanks,\nCleaniq Services"}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="w-full px-3.5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 transition-colors resize-none font-mono"
              />
              <p className="text-[11px] text-white/40 mt-1">Use [name] for the customer's first name.</p>
            </div>

            {showPreview && form.body && (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/7 bg-[#071D16]">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Email Preview</p>
                  {form.subject && <p className="text-sm font-semibold text-white mt-1">{form.subject}</p>}
                </div>
                <div className="px-5 py-4 bg-[#071D16] text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {form.body.replace(/\[name\]/gi, "Alex")}
                </div>
              </div>
            )}

            {targetEmails.length > 0 && (
              <div className="flex items-start gap-2 bg-amber-500/15 border border-amber-500/25 rounded-xl px-4 py-3 text-xs text-amber-400">
                <Clock size={13} className="mt-0.5 shrink-0" />
                <span><span className="font-semibold">Rate-limited:</span> {targetEmails.length} emails at 1/min (~{targetEmails.length} min). Sending continues after you close this page.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
            >
              {sending ? (
                <><RefreshCw size={14} className="animate-spin" /> Queuing…</>
              ) : (
                <><Send size={14} /> Queue Campaign{targetEmails.length > 0 ? ` (${targetEmails.length})` : ""}</>
              )}
            </button>
          </form>
        </div>
      )}

      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/7 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Campaign History</h2>
          <span className="text-xs text-white/40 font-medium">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Mail size={20} className="text-white/40" />
            </div>
            <p className="text-sm font-semibold text-white/80">No campaigns yet</p>
            <p className="text-xs text-white/40 mt-1">Click "New Campaign" to compose and send your first bulk email.</p>
            <button
              onClick={() => setShowComposer(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <Plus size={12} /> New Campaign
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {campaigns.map(c => {
              const isActive = c.status === "sending" || c.status === "queued";
              const total = c.totalCount || c.recipientCount || 0;
              const sent  = c.sentCount || 0;
              const isDeleting = deletingId === c._id;

              return (
                <div
                  key={c._id}
                  className={`px-5 py-4 flex items-start gap-4 group transition-colors ${isDeleting ? "opacity-40" : "hover:bg-white/[0.04]"}`}
                >
                  <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center mt-0.5 ${
                    isActive ? "bg-blue-500/15" : c.status === "sent" ? "bg-emerald-500/15" : c.status === "failed" ? "bg-rose-500/15" : "bg-white/5"
                  }`}>
                    <MessageSquare size={15} className={
                      isActive ? "text-blue-400" : c.status === "sent" ? "text-emerald-400" : c.status === "failed" ? "text-rose-400" : "text-white/40"
                    } />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white truncate">{c.name || c.subject}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{c.subject}</p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/40 flex-wrap">
                      {total > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {isActive ? `${sent}/${total}` : (c.status === "sent" ? total : total)} recipients
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {fmtDate(c.sentAt || c.createdAt)}
                      </span>
                      {c.segment && c.segment !== "custom" && (
                        <span className="px-1.5 py-0.5 bg-white/5 text-white/40 rounded font-medium">{c.segment}</span>
                      )}
                    </div>

                    {isActive && total > 0 && <ProgressBar sent={sent} total={total} />}

                    {c.status === "sent" && total > 0 && (
                      <p className="text-[11px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                        <ChevronRight size={10} /> {sent || total} emails delivered
                      </p>
                    )}
                  </div>

                  <CampaignMenu
                    campaign={c}
                    onView={setViewCampaign}
                    onDelete={handleDelete}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
