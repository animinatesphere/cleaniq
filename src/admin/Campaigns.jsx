import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import {
  Send, X, RefreshCw, Eye, Mail, Upload, Clock, Trash2,
  MessageSquare, Users, BarChart2, Plus, Zap, Search,
  BookOpen, Filter, CheckSquare, Square, Save, FileText,
  Calendar,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {m.label}
    </span>
  );
}

function MessageDrawer({ campaign, onClose }) {
  if (!campaign) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[520px] bg-[#0B2D22] z-50 flex flex-col shadow-2xl border-l border-white/10">
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/7 shrink-0">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Campaign</p>
            <h2 className="text-lg font-bold text-white leading-tight">{campaign.name}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-4 border-b border-white/[0.04] flex flex-wrap gap-3 shrink-0">
          <StatusBadge status={campaign.status} />
          <span className="text-sm text-white/40">{fmtDatetime(campaign.sentAt || campaign.createdAt)}</span>
          {(campaign.totalCount || campaign.recipientCount) > 0 && (
            <span className="text-sm font-semibold text-white/80">{campaign.sentCount || campaign.recipientCount || campaign.totalCount} recipients</span>
          )}
        </div>
        <div className="px-6 py-4 border-b border-white/[0.04] shrink-0">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Subject</p>
          <p className="text-base font-semibold text-white">{campaign.subject}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Message</p>
          <div className="bg-[#071D16] rounded-xl px-5 py-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed border border-white/10">
            {campaign.body || campaign.message || <span className="text-white/25 italic">No message recorded.</span>}
          </div>
          {campaign.recipients?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Recipients ({campaign.recipients.length})</p>
              <div className="bg-[#071D16] rounded-xl p-4 max-h-48 overflow-y-auto border border-white/10 space-y-1.5">
                {campaign.recipients.slice(0, 30).map((email, i) => (
                  <p key={i} className="text-sm text-white/80 truncate">{email}</p>
                ))}
                {campaign.recipients.length > 30 && <p className="text-sm text-white/25 italic">…and {campaign.recipients.length - 30} more</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Campaigns() {
  const [tab, setTab] = useState("compose");
  const [campaigns, setCampaigns]         = useState([]);
  const [customerActivity, setActivity]   = useState([]);
  const [templates, setTemplates]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [viewCampaign, setViewCampaign]   = useState(null);
  const [deletingId, setDeletingId]       = useState(null);
  const [toast, setToast]                 = useState(null);
  const pollRef = useRef(null);

  // Composer
  const [form, setForm]                   = useState({ name: "", subject: "", body: "" });
  const [recipientMode, setRecipientMode] = useState("filter");
  const [filterMode, setFilterMode]       = useState("inactive");
  const [filterDays, setFilterDays]       = useState(30);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [customerSearch, setCustomerSearch] = useState("");
  const [customEmails, setCustomEmails]   = useState("");
  const [fileEmails, setFileEmails]       = useState([]);
  const [fileName, setFileName]           = useState("");
  const [showPreview, setShowPreview]     = useState(false);
  const fileRef = useRef(null);

  // Template save from Compose
  const [showSaveTpl, setShowSaveTpl]     = useState(false);
  const [tplSaveName, setTplSaveName]     = useState("");
  const [savingTpl, setSavingTpl]         = useState(false);

  // New template form in Templates tab
  const [newTpl, setNewTpl]               = useState({ name: "", subject: "", body: "" });
  const [savingNewTpl, setSavingNewTpl]   = useState(false);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/marketing/campaigns`).catch(() => ({ data: [] }));
      const data = Array.isArray(res.data) ? res.data : [];
      setCampaigns(data);
      if (!data.some(c => c.status === "sending" || c.status === "queued") && pollRef.current) {
        clearInterval(pollRef.current); pollRef.current = null;
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, [fetchAll]);
  useEffect(() => {
    const hasActive = campaigns.some(c => c.status === "sending" || c.status === "queued");
    if (hasActive && !pollRef.current) pollRef.current = setInterval(fetchHistory, 30000);
    else if (!hasActive && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, [campaigns, fetchHistory]);

  const filteredByActivity = useMemo(() => {
    if (filterMode === "all") return customerActivity;
    if (filterMode === "never") return customerActivity.filter(c => !c.lastBookingDate && c.bookingCount === 0);
    const cutoff = Date.now() - filterDays * 86400000;
    return customerActivity.filter(c => !c.lastBookingDate || new Date(c.lastBookingDate).getTime() < cutoff);
  }, [customerActivity, filterMode, filterDays]);

  const targetEmails = useMemo(() => {
    if (recipientMode === "filter") return filteredByActivity.map(c => c.email).filter(Boolean);
    if (recipientMode === "pick")   return [...selectedEmails];
    const pasted = customEmails.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes("@"));
    return [...new Set([...pasted, ...fileEmails])];
  }, [recipientMode, filteredByActivity, selectedEmails, customEmails, fileEmails]);

  const visibleCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    return customerActivity
      .filter(c => !q || c.email?.includes(q) || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q))
      .slice(0, 100);
  }, [customerActivity, customerSearch]);

  const toggleCustomer = (email) => {
    setSelectedEmails(prev => { const next = new Set(prev); next.has(email) ? next.delete(email) : next.add(email); return next; });
  };
  const selectAllVisible  = () => setSelectedEmails(prev => { const next = new Set(prev); visibleCustomers.forEach(c => c.email && next.add(c.email)); return next; });
  const clearAllSelected  = () => setSelectedEmails(new Set());

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileEmails(extractEmailsFromCsv(ev.target.result));
    reader.readAsText(file);
  };
  const clearFile = () => { setFileEmails([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; };

  const loadTemplate = (t) => { setForm(f => ({ ...f, subject: t.subject, body: t.body })); showToast(`Template "${t.name}" loaded`); setTab("compose"); };

  const handleSaveFromCompose = async () => {
    if (!tplSaveName.trim() || !form.subject || !form.body) { showToast("Fill in subject and body first", "error"); return; }
    setSavingTpl(true);
    try {
      const res = await axios.post(`${API}/marketing/templates`, { name: tplSaveName, subject: form.subject, body: form.body });
      setTemplates(prev => [res.data, ...prev]); setTplSaveName(""); setShowSaveTpl(false); showToast("Template saved");
    } catch { showToast("Failed to save template", "error"); }
    finally { setSavingTpl(false); }
  };

  const handleSaveNewTemplate = async () => {
    if (!newTpl.name.trim() || !newTpl.subject.trim() || !newTpl.body.trim()) { showToast("Name, subject and message are all required", "error"); return; }
    setSavingNewTpl(true);
    try {
      const res = await axios.post(`${API}/marketing/templates`, { name: newTpl.name, subject: newTpl.subject, body: newTpl.body });
      setTemplates(prev => [res.data, ...prev]); setNewTpl({ name: "", subject: "", body: "" }); showToast("Template saved");
    } catch { showToast("Failed to save template", "error"); }
    finally { setSavingNewTpl(false); }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await axios.delete(`${API}/marketing/templates/${id}`);
      setTemplates(prev => prev.filter(t => t._id !== id)); showToast("Template deleted");
    } catch { showToast("Failed to delete", "error"); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) { showToast("Campaign name, subject and body are required", "error"); return; }
    if (targetEmails.length === 0) { showToast("No recipients selected", "error"); return; }
    if (!window.confirm(`Queue campaign to ${targetEmails.length} recipient${targetEmails.length !== 1 ? "s" : ""}?\n\nEmails send at 1 per minute.`)) return;
    setSending(true);
    try {
      await axios.post(`${API}/marketing/campaign`, { name: form.name, subject: form.subject, body: form.body, targetEmails });
      showToast(`Campaign queued for ${targetEmails.length} recipients`);
      setForm({ name: "", subject: "", body: "" }); setSelectedEmails(new Set()); setCustomEmails(""); clearFile(); setShowPreview(false);
      fetchAll();
      if (!pollRef.current) pollRef.current = setInterval(fetchHistory, 30000);
    } catch (err) { showToast(err?.response?.data?.message || "Failed to queue campaign", "error"); }
    finally { setSending(false); }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm("Delete this campaign?")) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/marketing/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c._id !== id)); showToast("Campaign deleted");
    } catch { showToast("Failed to delete campaign", "error"); }
    finally { setDeletingId(null); }
  };

  const totalSent       = campaigns.reduce((s, c) => s + (c.sentCount || c.recipientCount || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === "sending" || c.status === "queued").length;

  const previewBody = form.body
    .replace(/\[Name\]/gi, "Sarah")
    .replace(/\[Your name\]/gi, "Cleaniq Team")
    .replace(/\[Unsubscribe\]/gi, "[unsubscribe link]")
    .replace(/\[Business address\]/gi, "Greater Manchester, UK");

  const inputCls = "w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-base outline-none focus:border-emerald-500/60 transition-colors";
  const labelCls = "block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider";

  return (
    <div className="space-y-5">

      {toast && (
        <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-80 z-50 px-4 py-4 rounded-xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 ${toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"}`}>
          {toast.type === "error" ? <X size={14} /> : <Zap size={14} />} {toast.msg}
        </div>
      )}

      <MessageDrawer campaign={viewCampaign} onClose={() => setViewCampaign(null)} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Campaign Manager</h1>
          <p className="text-sm text-white/40 mt-0.5">Send targeted emails to your customers</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white/80 hover:text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Mail size={17} />, label: "Total Campaigns", val: campaigns.length, color: "text-white" },
          { icon: <Users size={17} />, label: "Emails Sent", val: totalSent, color: "text-emerald-400" },
          { icon: <BarChart2 size={17} />, label: "Active", val: activeCampaigns, color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#071D16] rounded-xl px-4 py-4 border border-white/7 flex items-center gap-3">
            <span className={`${s.color} opacity-70 shrink-0`}>{s.icon}</span>
            <div>
              <p className={`text-2xl font-black ${s.color} leading-none`}>{s.val}</p>
              <p className="text-xs text-white/40 font-medium mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#071D16] border border-white/7 rounded-xl p-1">
        {[
          { id: "compose",   label: "New Campaign",   icon: <Send size={14} /> },
          { id: "history",   label: "History",         icon: <Clock size={14} /> },
          { id: "templates", label: "Saved Templates", icon: <BookOpen size={14} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold rounded-lg transition-all ${tab === t.id ? "bg-emerald-500 text-white shadow" : "text-white/40 hover:text-white/80 hover:bg-white/5"}`}>
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══ COMPOSE ══ */}
      {tab === "compose" && (
        <form onSubmit={handleSend} className="space-y-5">

          {/* Name + Load Template */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Campaign Name</label>
                <input required placeholder="e.g. Summer Win-Back" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Load Saved Template</label>
                <select value="" onChange={e => { const t = templates.find(x => x._id === e.target.value); if (t) loadTemplate(t); }}
                  className={inputCls + " cursor-pointer"}>
                  <option value="">Select a template…</option>
                  {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/7 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Recipients</h3>
                <p className="text-sm text-white/40 mt-0.5">{targetEmails.length} customer{targetEmails.length !== 1 ? "s" : ""} selected</p>
              </div>
              <span className={`text-sm font-black px-4 py-1.5 rounded-full border ${targetEmails.length > 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-white/40 border-white/10"}`}>{targetEmails.length}</span>
            </div>

            <div className="flex border-b border-white/7">
              {[
                { id: "filter", label: "Smart Filter",   icon: <Filter size={13} /> },
                { id: "pick",   label: "Pick Customers", icon: <Users size={13} /> },
                { id: "custom", label: "Paste / Upload", icon: <Upload size={13} /> },
              ].map(m => (
                <button key={m.id} type="button" onClick={() => setRecipientMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${recipientMode === m.id ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5" : "text-white/40 hover:text-white/70"}`}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {/* Smart Filter */}
            {recipientMode === "filter" && (
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "inactive", label: "Inactive",      desc: "Haven't booked recently" },
                    { id: "never",    label: "Never Booked",  desc: "No bookings at all" },
                    { id: "all",      label: "All Customers", desc: `${customerActivity.length} total` },
                  ].map(f => (
                    <button key={f.id} type="button" onClick={() => setFilterMode(f.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${filterMode === f.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/10 bg-white/[0.02] hover:bg-white/5"}`}>
                      <p className={`text-sm font-bold ${filterMode === f.id ? "text-emerald-400" : "text-white/80"}`}>{f.label}</p>
                      <p className="text-xs text-white/40 mt-1">{f.desc}</p>
                    </button>
                  ))}
                </div>
                {filterMode === "inactive" && (
                  <div className="flex items-center gap-4 bg-[#071D16] border border-white/10 rounded-xl px-5 py-4">
                    <Calendar size={16} className="text-white/40 shrink-0" />
                    <span className="text-sm text-white/60">Haven&apos;t booked in</span>
                    <input type="number" min={1} max={365} value={filterDays} onChange={e => setFilterDays(Number(e.target.value))}
                      className="w-20 px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-base text-center outline-none focus:border-emerald-500/50" />
                    <span className="text-sm text-white/60">days</span>
                    <span className="ml-auto text-sm font-bold text-emerald-400">{filteredByActivity.length} matched</span>
                  </div>
                )}
                {filteredByActivity.length > 0 && (
                  <div className="bg-[#071D16] border border-white/10 rounded-xl max-h-56 overflow-y-auto">
                    {filteredByActivity.slice(0, 25).map((c, i) => {
                      const days = daysSince(c.lastBookingDate);
                      return (
                        <div key={c._id || i} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-white">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-white/40">{c.email}</p>
                          </div>
                          <span className="text-xs text-white/40 shrink-0 ml-4">{c.lastBookingDate ? `${days}d ago` : "Never booked"}</span>
                        </div>
                      );
                    })}
                    {filteredByActivity.length > 25 && <p className="text-center text-xs text-white/30 py-3">…and {filteredByActivity.length - 25} more</p>}
                  </div>
                )}
              </div>
            )}

            {/* Pick Customers */}
            {recipientMode === "pick" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input placeholder="Search by name or email…" value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-base outline-none focus:border-emerald-500/60 transition-colors" />
                  </div>
                  <button type="button" onClick={selectAllVisible}
                    className="px-4 py-3.5 text-sm font-semibold text-white/70 hover:text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap">Select all</button>
                  {selectedEmails.size > 0 && (
                    <button type="button" onClick={clearAllSelected}
                      className="px-4 py-3.5 text-sm font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/15 transition-colors whitespace-nowrap">Clear ({selectedEmails.size})</button>
                  )}
                </div>
                <div className="bg-[#071D16] border border-white/10 rounded-xl max-h-80 overflow-y-auto">
                  {visibleCustomers.length === 0 ? (
                    <p className="text-center text-sm text-white/30 py-14">No customers found</p>
                  ) : visibleCustomers.map((c, i) => {
                    const checked = selectedEmails.has(c.email);
                    const days = daysSince(c.lastBookingDate);
                    return (
                      <div key={c._id || i} onClick={() => toggleCustomer(c.email)}
                        className={`flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 cursor-pointer transition-colors select-none ${checked ? "bg-emerald-500/10" : "hover:bg-white/[0.03]"}`}>
                        <span className={`shrink-0 ${checked ? "text-emerald-400" : "text-white/25"}`}>
                          {checked ? <CheckSquare size={20} /> : <Square size={20} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{c.firstName} {c.lastName}</p>
                          <p className="text-sm text-white/40">{c.email}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm text-white/40">{c.lastBookingDate ? `${days}d ago` : "No bookings"}</p>
                          <p className="text-xs text-white/25">{c.bookingCount} booking{c.bookingCount !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Paste / Upload */}
            {recipientMode === "custom" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2.5 px-4 py-3.5 border border-dashed border-white/20 rounded-xl bg-white/[0.03] hover:bg-white/5 cursor-pointer text-sm font-semibold text-white/80 transition-colors">
                    <Upload size={15} />
                    {fileName ? `${fileName} (${fileEmails.length} emails)` : "Upload CSV…"}
                    <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {fileName && <button type="button" onClick={clearFile} className="text-white/40 hover:text-rose-400 transition-colors"><X size={16} /></button>}
                </div>
                <textarea placeholder={"Or paste emails here — commas, semicolons, or newlines\n\nexample@email.com\nanother@email.com"} rows={6}
                  value={customEmails} onChange={e => setCustomEmails(e.target.value)}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-base outline-none focus:border-emerald-500/60 resize-none transition-colors leading-relaxed" />
                <p className="text-sm text-white/50">
                  <span className="font-semibold text-white">{targetEmails.length} unique email{targetEmails.length !== 1 ? "s" : ""}</span>
                  {targetEmails.length > 0 && <span className="text-white/30"> · ~{targetEmails.length} min to send</span>}
                </p>
              </div>
            )}
          </div>

          {/* Subject + Body */}
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6 space-y-5">
            <div>
              <label className={labelCls}>Subject Line</label>
              <input required placeholder="e.g. We'd love to clean for you again 🏠" value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls.replace("mb-2", "")}>Message Body</label>
                <button type="button" onClick={() => setShowPreview(p => !p)} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
                  <Eye size={13} /> {showPreview ? "Hide preview" : "Preview"}
                </button>
              </div>
              <textarea required rows={14}
                placeholder={"Hi [Name],\n\nIt's been a while since we last cleaned for you, so we wanted to say thank you for choosing Cleaniq.\n\nIf cleaning has slipped down the list lately, here's something to help...\n\nBest,\n[Your name]\nCleaniq Services Ltd\n+44 7752 476368 · cleaniqservices.com\n[Business address]\n\n[Unsubscribe]"}
                value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-base outline-none focus:border-emerald-500/60 transition-colors resize-y leading-relaxed" />
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-sm text-white/30 self-center font-medium">Insert:</span>
                {["[Name]", "[Your name]", "[Business address]", "[Unsubscribe]"].map(p => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, body: f.body + p }))}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white/60 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {showPreview && form.body && (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/7 bg-[#071D16]">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Preview — sample name: Sarah</p>
                  {form.subject && <p className="text-base font-semibold text-white mt-1.5">{form.subject}</p>}
                </div>
                <div className="px-5 py-5 bg-[#071D16] text-base text-white/80 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">{previewBody}</div>
              </div>
            )}

            <div className="border-t border-white/7 pt-5">
              {showSaveTpl ? (
                <div className="flex gap-3">
                  <input placeholder="Template name…" value={tplSaveName} onChange={e => setTplSaveName(e.target.value)}
                    className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-base outline-none focus:border-emerald-500/60 transition-colors" />
                  <button type="button" disabled={savingTpl} onClick={handleSaveFromCompose}
                    className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                    {savingTpl ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={() => setShowSaveTpl(false)}
                    className="px-4 py-3.5 text-white/40 hover:text-white text-sm font-bold hover:bg-white/5 rounded-xl transition-colors">Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowSaveTpl(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white/80 transition-colors py-1">
                  <Save size={15} /> Save current message as a template
                </button>
              )}
            </div>
          </div>

          {targetEmails.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4 text-sm text-amber-400">
              <Clock size={15} className="mt-0.5 shrink-0" />
              <span><span className="font-semibold">Rate-limited:</span> {targetEmails.length} emails at 1/min (~{targetEmails.length} min). Sending continues in the background after you leave this page.</span>
            </div>
          )}

          <button type="submit" disabled={sending}
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-base font-bold disabled:opacity-50 transition-colors">
            {sending ? <><RefreshCw size={16} className="animate-spin" /> Queuing…</> : <><Send size={16} /> Queue Campaign{targetEmails.length > 0 ? ` — ${targetEmails.length} recipient${targetEmails.length !== 1 ? "s" : ""}` : ""}</>}
          </button>
        </form>
      )}

      {/* ══ HISTORY ══ */}
      {tab === "history" && (
        <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/7 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Campaign History</h2>
            <span className="text-sm text-white/40">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20 px-6">
              <Mail size={28} className="text-white/20 mx-auto mb-4" />
              <p className="text-base font-semibold text-white/60">No campaigns yet</p>
              <button onClick={() => setTab("compose")} className="mt-5 inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors">
                <Plus size={14} /> New Campaign
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {campaigns.map(c => {
                const total = c.totalCount || c.recipientCount || 0;
                const sent  = c.sentCount || 0;
                const isActive = c.status === "sending" || c.status === "queued";
                return (
                  <div key={c._id} className={`px-6 py-5 flex items-start gap-4 group transition-colors ${deletingId === c._id ? "opacity-40" : "hover:bg-white/[0.03]"}`}>
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center mt-0.5 ${isActive ? "bg-blue-500/15" : c.status === "sent" ? "bg-emerald-500/15" : "bg-white/5"}`}>
                      <MessageSquare size={17} className={isActive ? "text-blue-400" : c.status === "sent" ? "text-emerald-400" : "text-white/40"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">{c.name || c.subject}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-sm text-white/40 truncate mt-0.5">{c.subject}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40 flex-wrap">
                        {total > 0 && <span className="flex items-center gap-1.5"><Users size={11} />{isActive ? `${sent}/${total}` : total} recipients</span>}
                        <span className="flex items-center gap-1.5"><Clock size={11} />{fmtDate(c.sentAt || c.createdAt)}</span>
                      </div>
                      {isActive && total > 0 && (
                        <div className="mt-3">
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${Math.round((sent / total) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setViewCampaign(c)} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"><Eye size={15} /></button>
                      <button onClick={() => handleDeleteCampaign(c._id)} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TEMPLATES ══ */}
      {tab === "templates" && (
        <div className="space-y-5">
          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">Create New Template</h3>
              <p className="text-sm text-white/40 mt-0.5">Save a message to reuse in future campaigns</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Template Name</label>
                <input placeholder="e.g. Win-Back Offer" value={newTpl.name}
                  onChange={e => setNewTpl(n => ({ ...n, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Subject Line</label>
                <input placeholder="e.g. We'd love to clean for you again" value={newTpl.subject}
                  onChange={e => setNewTpl(n => ({ ...n, subject: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Message Body</label>
              <textarea rows={13}
                placeholder={"Hi [Name],\n\nIt's been a little while since we last cleaned for you, so we wanted to say thank you for choosing Cleaniq.\n\nIf cleaning has slipped down the list lately, here's something to help...\n\nBest,\n[Your name]\nCleaniq Services Ltd\n+44 7752 476368 · cleaniqservices.com\n[Business address]\n\n[Unsubscribe]"}
                value={newTpl.body} onChange={e => setNewTpl(n => ({ ...n, body: e.target.value }))}
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 text-base outline-none focus:border-emerald-500/60 transition-colors resize-y leading-relaxed" />
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-sm text-white/30 self-center font-medium">Insert:</span>
                {["[Name]", "[Your name]", "[Business address]", "[Unsubscribe]"].map(p => (
                  <button key={p} type="button" onClick={() => setNewTpl(n => ({ ...n, body: n.body + p }))}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm font-mono text-white/60 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <button disabled={savingNewTpl || !newTpl.name.trim() || !newTpl.subject.trim() || !newTpl.body.trim()} onClick={handleSaveNewTemplate}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-emerald-500 hover:bg-emerald-400 text-white text-base font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Save size={16} /> {savingNewTpl ? "Saving…" : "Save Template"}
            </button>
          </div>

          <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/7 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Saved Templates</h3>
              <span className="text-sm text-white/40">{templates.length} template{templates.length !== 1 ? "s" : ""}</span>
            </div>
            {templates.length === 0 ? (
              <div className="text-center py-16 px-6">
                <FileText size={28} className="text-white/20 mx-auto mb-4" />
                <p className="text-base font-semibold text-white/60">No templates saved yet</p>
                <p className="text-sm text-white/30 mt-1">Fill in the form above to save your first template.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {templates.map(t => (
                  <div key={t._id} className="px-6 py-5 flex items-start gap-4 group hover:bg-white/[0.03] transition-colors">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/15 flex items-center justify-center mt-0.5">
                      <FileText size={17} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-white">{t.name}</p>
                      <p className="text-sm text-white/40 truncate mt-0.5">{t.subject}</p>
                      <p className="text-sm text-white/30 mt-1.5 line-clamp-2">{t.body.slice(0, 150)}{t.body.length > 150 ? "…" : ""}</p>
                      <p className="text-xs text-white/25 mt-2">Saved {fmtDate(t.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => loadTemplate(t)}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 rounded-xl hover:bg-emerald-500/25 transition-colors whitespace-nowrap">
                        <Send size={13} /> Use in campaign
                      </button>
                      <button onClick={() => handleDeleteTemplate(t._id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                        <Trash2 size={14} />
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
