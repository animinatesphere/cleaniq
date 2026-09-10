import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import {
  Send, X, RefreshCw, Eye, Mail, Upload, Clock, Trash2,
  MessageSquare, Users, BarChart2, Plus, Zap, Search,
  BookOpen, Filter, CheckSquare, Square, ChevronDown,
  Save, FileText, Calendar, Tag,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADM_TOK = () => localStorage.getItem("adminToken") || "";

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDatetime = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const daysSince = (date) => date ? Math.floor((Date.now() - new Date(date).getTime()) / 86400000) : null;

function extractEmailsFromCsv(text) {
  const emails = [];
  for (const line of text.split(/\r?\n/)) {
    for (const cell of line.split(/[,\t]/)) {
      const val = cell.trim().replace(/^["']|["']$/g, "");
      if (val.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) emails.push(val.toLowerCase());
    }
  }
  return [...new Set(emails)];
}

// ─── Status badge ────────────────────────────────────────────────────────────
const STATUS_META = {
  sent:    { label: "Sent",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-500" },
  sending: { label: "Sending", cls: "bg-blue-500/15 text-blue-400 border-blue-500/25",         dot: "bg-blue-500 animate-pulse" },
  queued:  { label: "Queued",  cls: "bg-amber-500/15 text-amber-400 border-amber-500/25",      dot: "bg-amber-500 animate-pulse" },
  draft:   { label: "Draft",   cls: "bg-white/5 text-white/40 border-white/10",                dot: "bg-white/25" },
  failed:  { label: "Failed",  cls: "bg-rose-500/15 text-rose-400 border-rose-500/25",         dot: "bg-rose-500" },
};
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {m.label}
    </span>
  );
}

// ─── Message Drawer (view sent campaign) ─────────────────────────────────────
function MessageDrawer({ campaign, onClose }) {
  if (!campaign) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-[#0B2D22] z-50 flex flex-col shadow-2xl border-l border-white/10">
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/7 shrink-0">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Campaign</p>
            <h2 className="text-base font-bold text-white leading-tight">{campaign.name}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-4 border-b border-white/[0.04] flex flex-wrap gap-3 shrink-0">
          <StatusBadge status={campaign.status} />
          <span className="text-xs text-white/40">{fmtDatetime(campaign.sentAt || campaign.createdAt)}</span>
          {(campaign.totalCount || campaign.recipientCount) > 0 && (
            <span className="text-xs font-semibold text-white/80">{campaign.sentCount || campaign.recipientCount || campaign.totalCount} recipients</span>
          )}
        </div>
        <div className="px-6 py-4 border-b border-white/[0.04] shrink-0">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Subject</p>
          <p className="text-sm font-semibold text-white">{campaign.subject}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Message</p>
          <div className="bg-[#071D16] rounded-xl px-5 py-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-mono border border-white/10">
            {campaign.body || campaign.message || <span className="text-white/25 italic">No message recorded.</span>}
          </div>
          {campaign.recipients?.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Recipients ({campaign.recipients.length})</p>
              <div className="bg-[#071D16] rounded-xl p-3 max-h-40 overflow-y-auto border border-white/10 space-y-1">
                {campaign.recipients.slice(0, 30).map((email, i) => (
                  <p key={i} className="text-xs text-white/80 font-mono truncate">{email}</p>
                ))}
                {campaign.recipients.length > 30 && <p className="text-xs text-white/25 italic">…and {campaign.recipients.length - 30} more</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Campaigns() {
  const [tab, setTab] = useState("compose");
  const [campaigns, setCampaigns]       = useState([]);
  const [customerActivity, setActivity] = useState([]);
  const [templates, setTemplates]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [deletingId, setDeletingId]     = useState(null);
  const [toast, setToast]               = useState(null);
  const pollRef = useRef(null);

  // Composer state
  const [form, setForm] = useState({ name: "", subject: "", body: "" });
  const [recipientMode, setRecipientMode] = useState("filter"); // "filter" | "pick" | "custom"
  const [filterMode, setFilterMode]       = useState("inactive"); // "all" | "inactive" | "never"
  const [filterDays, setFilterDays]       = useState(30);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [customerSearch, setCustomerSearch] = useState("");
  const [customEmails, setCustomEmails]   = useState("");
  const [fileEmails, setFileEmails]       = useState([]);
  const [fileName, setFileName]           = useState("");
  const [showPreview, setShowPreview]     = useState(false);
  const fileRef = useRef(null);

  // Template save state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName]         = useState("");
  const [savingTemplate, setSavingTemplate]     = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Data fetching ──
  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/marketing/campaigns`).catch(() => ({ data: [] }));
      const data = Array.isArray(res.data) ? res.data : [];
      setCampaigns(data);
      if (!data.some(c => c.status === "sending" || c.status === "queued") && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, aRes, tRes] = await Promise.all([
        axios.get(`${API}/marketing/campaigns`).catch(() => ({ data: [] })),
        axios.get(`${API}/marketing/customer-activity`).catch(() => ({ data: [] })),
        axios.get(`${API}/marketing/templates`).catch(() => ({ data: [] })),
      ]);
      setCampaigns(Array.isArray(hRes.data) ? hRes.data : []);
      setActivity(Array.isArray(aRes.data) ? aRes.data : []);
      setTemplates(Array.isArray(tRes.data) ? tRes.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, [fetchAll]);
  useEffect(() => {
    const hasActive = campaigns.some(c => c.status === "sending" || c.status === "queued");
    if (hasActive && !pollRef.current) pollRef.current = setInterval(fetchHistory, 30000);
    else if (!hasActive && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, [campaigns, fetchHistory]);

  // ── Smart filter logic ──
  const filteredByActivity = useMemo(() => {
    if (filterMode === "all") return customerActivity;
    if (filterMode === "never") return customerActivity.filter(c => !c.lastBookingDate && c.bookingCount === 0);
    // inactive: last booking older than filterDays days
    const cutoff = Date.now() - filterDays * 86400000;
    return customerActivity.filter(c => !c.lastBookingDate || new Date(c.lastBookingDate).getTime() < cutoff);
  }, [customerActivity, filterMode, filterDays]);

  // ── Target emails ──
  const targetEmails = useMemo(() => {
    if (recipientMode === "filter") return filteredByActivity.map(c => c.email).filter(Boolean);
    if (recipientMode === "pick")   return [...selectedEmails];
    const pasted = customEmails.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes("@"));
    return [...new Set([...pasted, ...fileEmails])];
  }, [recipientMode, filteredByActivity, selectedEmails, customEmails, fileEmails]);

  // ── Customer list for picker ──
  const visibleCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    return customerActivity
      .filter(c => !q || c.email?.includes(q) || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q))
      .slice(0, 80);
  }, [customerActivity, customerSearch]);

  const toggleCustomer = (email) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };
  const selectAllVisible = () => setSelectedEmails(prev => { const next = new Set(prev); visibleCustomers.forEach(c => next.add(c.email)); return next; });
  const clearAllSelected = () => setSelectedEmails(new Set());

  // ── File upload ──
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileEmails(extractEmailsFromCsv(ev.target.result));
    reader.readAsText(file);
  };
  const clearFile = () => { setFileEmails([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; };

  // ── Load template ──
  const loadTemplate = (t) => {
    setForm(f => ({ ...f, subject: t.subject, body: t.body }));
    showToast(`Template "${t.name}" loaded`);
  };

  // ── Save template ──
  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !form.subject || !form.body) {
      showToast("Enter a template name, subject and body first", "error"); return;
    }
    setSavingTemplate(true);
    try {
      const res = await axios.post(`${API}/marketing/templates`, { name: templateName, subject: form.subject, body: form.body });
      setTemplates(prev => [res.data, ...prev]);
      setTemplateName(""); setShowSaveTemplate(false);
      showToast("Template saved");
    } catch { showToast("Failed to save template", "error"); }
    finally { setSavingTemplate(false); }
  };

  // ── Delete template ──
  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await axios.delete(`${API}/marketing/templates/${id}`);
      setTemplates(prev => prev.filter(t => t._id !== id));
      showToast("Template deleted");
    } catch { showToast("Failed to delete", "error"); }
  };

  // ── Send campaign ──
  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      showToast("Campaign name, subject and body are required", "error"); return;
    }
    if (targetEmails.length === 0) {
      showToast("No recipients selected", "error"); return;
    }
    if (!window.confirm(`Queue campaign to ${targetEmails.length} recipient${targetEmails.length !== 1 ? "s" : ""}?\n\nEmails send at 1 per minute (~${targetEmails.length} min total).`)) return;
    setSending(true);
    try {
      await axios.post(`${API}/marketing/campaign`, {
        name: form.name, subject: form.subject, body: form.body, targetEmails,
      });
      showToast(`Campaign queued for ${targetEmails.length} recipients`);
      setForm({ name: "", subject: "", body: "" });
      setSelectedEmails(new Set()); setCustomEmails(""); clearFile(); setShowPreview(false);
      fetchAll();
      if (!pollRef.current) pollRef.current = setInterval(fetchHistory, 30000);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to queue campaign", "error");
    } finally { setSending(false); }
  };

  // ── Delete campaign ──
  const handleDeleteCampaign = async (id) => {
    if (!window.confirm("Delete this campaign? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/marketing/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c._id !== id));
      showToast("Campaign deleted");
    } catch { showToast("Failed to delete campaign", "error"); }
    finally { setDeletingId(null); }
  };

  const totalSent    = campaigns.reduce((s, c) => s + (c.sentCount || c.recipientCount || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === "sending" || c.status === "queued").length;

  // ── Preview body ──
  const previewBody = form.body
    .replace(/\[Name\]/gi, "Sarah")
    .replace(/\[Your name\]/gi, "Cleaniq Team")
    .replace(/\[Unsubscribe\]/gi, "[unsubscribe link]")
    .replace(/\[Business address\]/gi, "Greater Manchester, UK");

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-80 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 ${toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"}`}>
          {toast.type === "error" ? <X size={14} /> : <Zap size={14} />} {toast.msg}
        </div>
      )}

      <MessageDrawer campaign={viewCampaign} onClose={() => setViewCampaign(null)} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Campaign Manager</h1>
          <p className="text-sm text-white/40 mt-0.5">Send targeted emails to your customers. Queued at 1 per minute.</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white/80 hover:text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Mail size={15} />,      label: "Total Campaigns",   val: campaigns.length,     color: "text-white"       },
          { icon: <Users size={15} />,     label: "Emails Sent",       val: totalSent,             color: "text-emerald-400" },
          { icon: <BarChart2 size={15} />, label: "Active",            val: activeCampaigns,       color: "text-blue-400"    },
        ].map(s => (
          <div key={s.label} className="bg-[#071D16] rounded-xl px-4 py-3.5 border border-white/7 flex items-center gap-3">
            <span className={`${s.color} opacity-70 shrink-0`}>{s.icon}</span>
            <div>
              <p className={`text-2xl font-black ${s.color} leading-none`}>{s.val}</p>
              <p className="text-[11px] text-white/40 font-medium mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#071D16] border border-white/7 rounded-xl p-1">
        {[
          { id: "compose",   label: "New Campaign",   icon: <Send size={13} /> },
          { id: "history",   label: "History",         icon: <Clock size={13} /> },
          { id: "templates", label: "Saved Templates", icon: <BookOpen size={13} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${
              tab === t.id ? "bg-emerald-500 text-white shadow" : "text-white/40 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══ COMPOSE TAB ══ */}
      {tab === "compose" && (
        <form onSubmit={handleSend} className="space-y-4">

          {/* Campaign Name + Load Template */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Campaign Name</label>
                <input
                  required
                  placeholder="e.g. Summer Win-Back"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Load Saved Template</label>
                <select
                  value=""
                  onChange={e => { const t = templates.find(x => x._id === e.target.value); if (t) loadTemplate(t); }}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="">Select a template…</option>
                  {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/7 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Recipients</h3>
                <p className="text-xs text-white/40 mt-0.5">{targetEmails.length} customer{targetEmails.length !== 1 ? "s" : ""} selected</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-3 py-1">{targetEmails.length}</span>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b border-white/7">
              {[
                { id: "filter", label: "Smart Filter", icon: <Filter size={11} /> },
                { id: "pick",   label: "Pick Customers", icon: <Users size={11} /> },
                { id: "custom", label: "Paste / Upload", icon: <Upload size={11} /> },
              ].map(m => (
                <button
                  key={m.id} type="button"
                  onClick={() => setRecipientMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all ${
                    recipientMode === m.id ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5" : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {/* Smart Filter */}
            {recipientMode === "filter" && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "inactive", label: "Inactive",      desc: "Haven't booked recently" },
                    { id: "never",    label: "Never Booked",  desc: "No bookings at all" },
                    { id: "all",      label: "All Customers", desc: `${customerActivity.length} total` },
                  ].map(f => (
                    <button
                      key={f.id} type="button"
                      onClick={() => setFilterMode(f.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        filterMode === f.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                      }`}
                    >
                      <p className={`text-xs font-bold ${filterMode === f.id ? "text-emerald-400" : "text-white/80"}`}>{f.label}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{f.desc}</p>
                    </button>
                  ))}
                </div>

                {filterMode === "inactive" && (
                  <div className="flex items-center gap-3 bg-[#071D16] border border-white/10 rounded-xl px-4 py-3">
                    <Calendar size={14} className="text-white/40 shrink-0" />
                    <span className="text-xs text-white/60">Haven&apos;t booked in</span>
                    <input
                      type="number"
                      min={1} max={365}
                      value={filterDays}
                      onChange={e => setFilterDays(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs text-center outline-none focus:border-emerald-500/50"
                    />
                    <span className="text-xs text-white/60">days</span>
                    <span className="ml-auto text-xs font-bold text-emerald-400">{filteredByActivity.length} matched</span>
                  </div>
                )}

                {filteredByActivity.length > 0 && (
                  <div className="bg-[#071D16] border border-white/10 rounded-xl max-h-40 overflow-y-auto">
                    {filteredByActivity.slice(0, 20).map((c, i) => {
                      const days = daysSince(c.lastBookingDate);
                      return (
                        <div key={c._id || i} className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0">
                          <div>
                            <p className="text-xs font-semibold text-white">{c.firstName} {c.lastName}</p>
                            <p className="text-[10px] text-white/40">{c.email}</p>
                          </div>
                          <span className="text-[10px] text-white/40 shrink-0 ml-3">
                            {c.lastBookingDate ? `${days}d ago` : "Never booked"}
                          </span>
                        </div>
                      );
                    })}
                    {filteredByActivity.length > 20 && (
                      <p className="text-center text-[10px] text-white/30 py-2">…and {filteredByActivity.length - 20} more</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pick Customers */}
            {recipientMode === "pick" && (
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      placeholder="Search by name or email…"
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-xs outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <button type="button" onClick={selectAllVisible} className="px-3 py-2 text-xs font-semibold text-white/60 hover:text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap">Select all</button>
                  {selectedEmails.size > 0 && (
                    <button type="button" onClick={clearAllSelected} className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/15 transition-colors">Clear</button>
                  )}
                </div>
                <div className="bg-[#071D16] border border-white/10 rounded-xl max-h-56 overflow-y-auto">
                  {visibleCustomers.length === 0 ? (
                    <p className="text-center text-xs text-white/30 py-8">No customers found</p>
                  ) : visibleCustomers.map((c, i) => {
                    const checked = selectedEmails.has(c.email);
                    const days = daysSince(c.lastBookingDate);
                    return (
                      <div
                        key={c._id || i}
                        onClick={() => toggleCustomer(c.email)}
                        className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0 cursor-pointer transition-colors ${checked ? "bg-emerald-500/10" : "hover:bg-white/[0.03]"}`}
                      >
                        <span className={`shrink-0 ${checked ? "text-emerald-400" : "text-white/25"}`}>
                          {checked ? <CheckSquare size={15} /> : <Square size={15} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{c.firstName} {c.lastName}</p>
                          <p className="text-[10px] text-white/40 truncate">{c.email}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] text-white/40">{c.lastBookingDate ? `${days}d ago` : "No bookings"}</p>
                          <p className="text-[10px] text-white/25">{c.bookingCount} booking{c.bookingCount !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {customerSearch && customerActivity.length > 80 && (
                  <p className="text-[10px] text-white/30 text-center">Showing first 80 results — refine your search</p>
                )}
              </div>
            )}

            {/* Paste / Upload */}
            {recipientMode === "custom" && (
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3.5 py-2 border border-dashed border-white/20 rounded-xl bg-white/[0.03] hover:bg-white/5 cursor-pointer text-xs font-semibold text-white/80 transition-colors">
                    <Upload size={12} />
                    {fileName ? `${fileName} (${fileEmails.length} emails)` : "Upload CSV…"}
                    <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {fileName && <button type="button" onClick={clearFile} className="text-white/40 hover:text-rose-400 transition-colors"><X size={14} /></button>}
                </div>
                <textarea
                  placeholder="Or paste emails here — commas, semicolons, or newlines"
                  rows={4}
                  value={customEmails}
                  onChange={e => setCustomEmails(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 resize-none transition-colors"
                />
                <p className="text-xs text-white/40">
                  <span className="font-semibold text-white">{targetEmails.length} unique email{targetEmails.length !== 1 ? "s" : ""}</span>
                  {targetEmails.length > 0 && <span className="text-white/25"> · ~{targetEmails.length} min to send</span>}
                </p>
              </div>
            )}
          </div>

          {/* Subject + Body */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 mb-1.5 uppercase tracking-wider">Subject Line</label>
              <input
                required
                placeholder="e.g. We'd love to clean for you again 🏠"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Message Body</label>
                <button type="button" onClick={() => setShowPreview(p => !p)} className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
                  <Eye size={11} /> {showPreview ? "Hide" : "Preview"}
                </button>
              </div>
              <textarea
                required rows={10}
                placeholder={"Hi [Name],\n\nIt's been a while since we last cleaned for you...\n\nBest,\n[Your name]\nCleaniq Services Ltd\n+44 7752 476368 · cleaniqservices.com\n\n[Unsubscribe]"}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="w-full px-3.5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 transition-colors resize-none font-mono leading-relaxed"
              />

              {/* Placeholder chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-white/30 self-center">Placeholders:</span>
                {["[Name]", "[Your name]", "[Business address]", "[Unsubscribe]"].map(p => (
                  <button
                    key={p} type="button"
                    onClick={() => setForm(f => ({ ...f, body: f.body + p }))}
                    className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-white/60 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {showPreview && form.body && (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/7 bg-[#071D16]">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Preview (sample: Sarah)</p>
                  {form.subject && <p className="text-sm font-semibold text-white mt-1">{form.subject}</p>}
                </div>
                <div className="px-5 py-4 bg-[#071D16] text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {previewBody}
                </div>
              </div>
            )}

            {/* Save as template */}
            <div className="border-t border-white/7 pt-4">
              {showSaveTemplate ? (
                <div className="flex gap-2">
                  <input
                    placeholder="Template name…"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-xs outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <button type="button" disabled={savingTemplate} onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                    {savingTemplate ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={() => setShowSaveTemplate(false)} className="px-3 py-2 text-white/40 hover:text-white text-xs font-bold hover:bg-white/5 rounded-xl transition-colors">Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowSaveTemplate(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/80 transition-colors">
                  <Save size={12} /> Save as template
                </button>
              )}
            </div>
          </div>

          {/* Rate-limit warning + Send */}
          {targetEmails.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400">
              <Clock size={13} className="mt-0.5 shrink-0" />
              <span><span className="font-semibold">Rate-limited:</span> {targetEmails.length} emails at 1/min (~{targetEmails.length} min). Sending continues after you close this page.</span>
            </div>
          )}

          <button type="submit" disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
            {sending ? <><RefreshCw size={14} className="animate-spin" /> Queuing…</> : <><Send size={14} /> Queue Campaign{targetEmails.length > 0 ? ` (${targetEmails.length} recipients)` : ""}</>}
          </button>
        </form>
      )}

      {/* ══ HISTORY TAB ══ */}
      {tab === "history" && (
        <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/7 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Campaign History</h2>
            <span className="text-xs text-white/40">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Mail size={24} className="text-white/20 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white/60">No campaigns yet</p>
              <button onClick={() => setTab("compose")} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors">
                <Plus size={12} /> New Campaign
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {campaigns.map(c => {
                const total = c.totalCount || c.recipientCount || 0;
                const sent = c.sentCount || 0;
                const isActive = c.status === "sending" || c.status === "queued";
                return (
                  <div key={c._id} className={`px-5 py-4 flex items-start gap-4 group transition-colors ${deletingId === c._id ? "opacity-40" : "hover:bg-white/[0.04]"}`}>
                    <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center mt-0.5 ${isActive ? "bg-blue-500/15" : c.status === "sent" ? "bg-emerald-500/15" : "bg-white/5"}`}>
                      <MessageSquare size={15} className={isActive ? "text-blue-400" : c.status === "sent" ? "text-emerald-400" : "text-white/40"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">{c.name || c.subject}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-white/40 truncate mt-0.5">{c.subject}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/40 flex-wrap">
                        {total > 0 && <span className="flex items-center gap-1"><Users size={10} />{isActive ? `${sent}/${total}` : total} recipients</span>}
                        <span className="flex items-center gap-1"><Clock size={10} />{fmtDate(c.sentAt || c.createdAt)}</span>
                      </div>
                      {isActive && total > 0 && (
                        <div className="mt-2">
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${Math.round((sent / total) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setViewCampaign(c)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"><Eye size={14} /></button>
                      <button onClick={() => handleDeleteCampaign(c._id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TEMPLATES TAB ══ */}
      {tab === "templates" && (
        <div className="space-y-4">
          {/* Quick save form */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Save New Template</h3>
            <p className="text-xs text-white/40">Fill in a subject and message in the Compose tab, then save it here to reuse later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                placeholder="Template name…"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 transition-colors"
              />
              <input
                placeholder="Subject line…"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-sm outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button
                disabled={savingTemplate || !templateName || !form.subject || !form.body}
                onClick={handleSaveTemplate}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
              >
                <Save size={13} /> {savingTemplate ? "Saving…" : "Save Template"}
              </button>
            </div>
          </div>

          {/* Template list */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/7 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Saved Templates</h3>
              <span className="text-xs text-white/40">{templates.length} template{templates.length !== 1 ? "s" : ""}</span>
            </div>
            {templates.length === 0 ? (
              <div className="text-center py-12 px-6">
                <FileText size={24} className="text-white/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white/60">No templates saved yet</p>
                <p className="text-xs text-white/30 mt-1">Save a message from the Compose tab to reuse it later.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {templates.map(t => (
                  <div key={t._id} className="px-5 py-4 flex items-start gap-4 group hover:bg-white/[0.03] transition-colors">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/15 flex items-center justify-center mt-0.5">
                      <FileText size={15} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-white/40 truncate mt-0.5">{t.subject}</p>
                      <p className="text-xs text-white/30 mt-1 line-clamp-2">{t.body.slice(0, 120)}{t.body.length > 120 ? "…" : ""}</p>
                      <p className="text-[10px] text-white/25 mt-1">Saved {fmtDate(t.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { loadTemplate(t); setTab("compose"); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 rounded-lg hover:bg-emerald-500/25 transition-colors">
                        <Send size={11} /> Use
                      </button>
                      <button onClick={() => handleDeleteTemplate(t._id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
