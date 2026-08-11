import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare, Send, CheckCircle2, XCircle,
  Clock, RefreshCw, Trash2, User, Briefcase, AlertCircle,
  Eye, EyeOff, Search, Users, Edit3, RotateCcw, X, Phone,
  UserPlus, Upload, Square, CheckSquare, Pencil,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const TRIGGER_META = {
  booking_confirmed:    { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/25", icon: CheckCircle2 },
  worker_assigned:      { color: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/25",    icon: Briefcase   },
  booking_reminder_24h: { color: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/25",   icon: Clock       },
  booking_completed:    { color: "text-violet-400",  bg: "bg-violet-500/15",  border: "border-violet-500/25",  icon: CheckCircle2 },
  booking_cancelled:    { color: "text-rose-400",    bg: "bg-rose-500/15",    border: "border-rose-500/25",    icon: XCircle     },
  worker_job_assigned:  { color: "text-teal-400",    bg: "bg-teal-500/15",    border: "border-teal-500/25",    icon: Briefcase   },
};

const RECIPIENT_LABEL = { customer: "Customer", worker: "Worker" };

function StatusBadge({ status }) {
  const map = {
    sent:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    failed:  "bg-rose-500/15 text-rose-400 border-rose-500/25",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${map[status] || map.pending}`}>
      {status}
    </span>
  );
}

function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none ${
        enabled ? "bg-emerald-500 shadow-sm shadow-emerald-500/30" : "bg-white/12"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ml-0.5 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function SmsAutomation() {
  const [config, setConfig]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState({});
  const [logs, setLogs]                   = useState([]);
  const [logStats, setLogStats]           = useState({ sent: 0, failed: 0, pending: 0 });
  const [logsLoading, setLogsLoading]     = useState(false);
  const [logFilter, setLogFilter]         = useState("all");
  const [toast, setToast]                 = useState(null);
  const [showToken, setShowToken]         = useState(false);
  const [testPhone, setTestPhone]         = useState("");
  const [testSending, setTestSending]     = useState(false);
  const [clearingLogs, setClearingLogs]   = useState(false);
  const [creds, setCreds]                 = useState({ accountSid: "", authToken: "", phoneNumber: "", verifySid: "" });
  const [savingCreds, setSavingCreds]     = useState(false);
  const [activeTab, setActiveTab]         = useState("triggers");

  // Template editing state
  const [templates, setTemplates]             = useState([]);
  const [bizPhone, setBizPhone]               = useState("");
  const [bizPhoneInput, setBizPhoneInput]     = useState("");
  const [savingBizPhone, setSavingBizPhone]   = useState(false);
  const [editTpl, setEditTpl]                 = useState(null); // { key, text, default }
  const [savingTpl, setSavingTpl]             = useState(false);

  // Log detail modal
  const [detailLog, setDetailLog]             = useState(null);

  // SMS Contacts state
  const [contacts, setContacts]               = useState([]);
  const [contactsTotal, setContactsTotal]     = useState(0);
  const [contactStats, setContactStats]       = useState({});
  const [contactPage, setContactPage]         = useState(1);
  const [contactSearch, setContactSearch]     = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selected, setSelected]               = useState(new Set());
  const [addOpen, setAddOpen]                 = useState(false);
  const [editingContact, setEditingContact]   = useState(null);
  const [addForm, setAddForm]                 = useState({ firstName: "", lastName: "", phone: "", notes: "" });
  const [addErr, setAddErr]                   = useState("");
  const [addSaving, setAddSaving]             = useState(false);
  const [importing, setImporting]             = useState(false);
  const [importRes, setImportRes]             = useState(null);
  const [deleting, setDeleting]               = useState(false);
  const [bulkMessage, setBulkMessage]         = useState("");
  const [bulkSending, setBulkSending]         = useState(false);
  const [bulkResult, setBulkResult]           = useState(null);
  const fileRef                               = useRef();

  // Verify state
  const [verifyPhone, setVerifyPhone]         = useState("");
  const [verifyCode, setVerifyCode]           = useState("");
  const [verifySent, setVerifySent]           = useState(false);
  const [verifySending, setVerifySending]     = useState(false);
  const [verifyChecking, setVerifyChecking]   = useState(false);
  const [verifyResult, setVerifyResult]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchConfig = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/sms/config`);
      const data = await res.json();
      setConfig(data);
    } catch {
      showToast("Failed to load SMS config", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (logFilter !== "all") params.set("status", logFilter);
      const res  = await fetch(`${API}/sms/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      if (data.stats) setLogStats(data.stats);
    } catch {
      showToast("Failed to load logs", "error");
    } finally {
      setLogsLoading(false);
    }
  }, [logFilter]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  useEffect(() => { if (activeTab === "logs") fetchLogs(); }, [activeTab, fetchLogs]);

  const toggleTrigger = async (key, enabled) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      const res = await fetch(`${API}/sms/config/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });
      if (!res.ok) throw new Error();
      setConfig(c => ({ ...c, triggers: c.triggers.map(t => t.key === key ? { ...t, enabled } : t) }));
    } catch {
      showToast("Failed to update trigger", "error");
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const saveCreds = async () => {
    setSavingCreds(true);
    try {
      const res = await fetch(`${API}/sms/config/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid:  creds.accountSid  || undefined,
          authToken:   creds.authToken   || undefined,
          phoneNumber: creds.phoneNumber || undefined,
          verifySid:   creds.verifySid   || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Credentials saved");
      setCreds({ accountSid: "", authToken: "", phoneNumber: "", verifySid: "" });
      fetchConfig();
    } catch {
      showToast("Failed to save credentials", "error");
    } finally {
      setSavingCreds(false);
    }
  };

  const sendVerification = async () => {
    if (!verifyPhone.trim()) return showToast("Enter a phone number", "error");
    setVerifySending(true);
    setVerifyResult(null);
    setVerifyCode("");
    try {
      const res  = await fetch(`${API}/sms/verify/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: verifyPhone.trim(), channel: "sms" }),
      });
      const data = await res.json();
      if (data.success) { setVerifySent(true); showToast(`Code sent to ${verifyPhone}`); }
      else showToast(data.error || "Failed to send code", "error");
    } catch {
      showToast("Failed to send verification code", "error");
    } finally {
      setVerifySending(false);
    }
  };

  const checkVerification = async () => {
    if (!verifyCode.trim()) return showToast("Enter the 6-digit code", "error");
    setVerifyChecking(true);
    try {
      const res  = await fetch(`${API}/sms/verify/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: verifyPhone.trim(), code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (data.success) { setVerifyResult("approved"); showToast("Phone number verified!", "success"); }
      else { setVerifyResult("failed"); showToast(data.error || "Incorrect code", "error"); }
    } catch {
      showToast("Failed to check code", "error");
    } finally {
      setVerifyChecking(false);
    }
  };

  const sendTest = async () => {
    if (!testPhone.trim()) return showToast("Enter a phone number", "error");
    setTestSending(true);
    try {
      const res  = await fetch(`${API}/sms/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testPhone.trim() }),
      });
      const data = await res.json();
      if (data.success) { showToast(`Test SMS sent! SID: ${data.sid?.slice(-8)}`); setTestPhone(""); }
      else showToast(data.error || "Failed to send test", "error");
    } catch {
      showToast("Failed to send test SMS", "error");
    } finally {
      setTestSending(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm("Clear all SMS logs? This cannot be undone.")) return;
    setClearingLogs(true);
    try {
      await fetch(`${API}/sms/logs`, { method: "DELETE" });
      setLogs([]);
      setLogStats({ sent: 0, failed: 0, pending: 0 });
      showToast("Logs cleared");
    } catch {
      showToast("Failed to clear logs", "error");
    } finally {
      setClearingLogs(false);
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

  const customerTriggers = config?.triggers?.filter(t => t.recipient === "customer") || [];
  const workerTriggers   = config?.triggers?.filter(t => t.recipient === "worker")   || [];

  const fetchTemplates = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/sms/templates`);
      const data = await res.json();
      setTemplates(data.templates || []);
      setBizPhone(data.bizPhone || "");
      setBizPhoneInput(data.bizPhone || "");
    } catch {}
  }, []);

  useEffect(() => { if (activeTab === "triggers") fetchTemplates(); }, [activeTab, fetchTemplates]);

  const saveTpl = async () => {
    if (!editTpl) return;
    setSavingTpl(true);
    try {
      const res = await fetch(`${API}/sms/templates/${editTpl.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editTpl.text }),
      });
      if (!res.ok) throw new Error();
      showToast("Template saved");
      setEditTpl(null);
      fetchTemplates();
    } catch {
      showToast("Failed to save template", "error");
    } finally {
      setSavingTpl(false);
    }
  };

  const resetTpl = async (key) => {
    if (!confirm("Reset to default template?")) return;
    try {
      await fetch(`${API}/sms/templates/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "" }),
      });
      showToast("Template reset to default");
      fetchTemplates();
      if (editTpl?.key === key) setEditTpl(null);
    } catch {
      showToast("Failed to reset", "error");
    }
  };

  const saveBizPhone = async () => {
    if (!bizPhoneInput.trim()) return showToast("Enter a phone number", "error");
    setSavingBizPhone(true);
    try {
      const res = await fetch(`${API}/sms/config/biz-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: bizPhoneInput.trim() }),
      });
      if (!res.ok) throw new Error();
      setBizPhone(bizPhoneInput.trim());
      showToast("Business phone saved");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSavingBizPhone(false);
    }
  };

  const CONTACT_LIMIT = 50;

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const p = new URLSearchParams({ page: contactPage, limit: CONTACT_LIMIT, search: contactSearch });
      const res  = await fetch(`${API}/sms/contacts?${p}`);
      const data = await res.json();
      setContacts(data.contacts || []);
      setContactsTotal(data.total || 0);
      setContactStats(data.stats || {});
    } catch {
      showToast("Failed to load contacts", "error");
    } finally {
      setContactsLoading(false);
    }
  }, [contactPage, contactSearch]);

  useEffect(() => { if (activeTab === "bulk") loadContacts(); }, [activeTab, loadContacts]);
  useEffect(() => { setContactPage(1); }, [contactSearch]);

  const allSelected = contacts.length > 0 && contacts.every(c => selected.has(c._id));
  const toggleAll = () => {
    if (allSelected) { const s = new Set(selected); contacts.forEach(c => s.delete(c._id)); setSelected(s); }
    else             { const s = new Set(selected); contacts.forEach(c => s.add(c._id));    setSelected(s); }
  };
  const toggleOne = (id) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };

  const resetAddForm = () => { setAddForm({ firstName: "", lastName: "", phone: "", notes: "" }); setAddErr(""); };
  const openAddModal  = () => { setEditingContact(null); resetAddForm(); setAddOpen(true); };
  const openEditModal = (c) => {
    setEditingContact(c);
    setAddForm({ firstName: c.firstName || "", lastName: c.lastName || "", phone: c.phone || "", notes: c.notes || "" });
    setAddErr("");
    setAddOpen(true);
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setAddErr("");
    if (!addForm.phone.trim()) { setAddErr("Phone number is required"); return; }
    setAddSaving(true);
    try {
      const method = editingContact ? "PUT" : "POST";
      const url    = editingContact ? `${API}/sms/contacts/${editingContact._id}` : `${API}/sms/contacts`;
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
      const data   = await res.json();
      if (!res.ok) { setAddErr(data.message || "Failed"); setAddSaving(false); return; }
      setAddOpen(false); setEditingContact(null); resetAddForm(); loadContacts();
    } catch { setAddErr("Network error"); }
    setAddSaving(false);
  };

  const deleteSingle = async (id) => {
    await fetch(`${API}/sms/contacts/${id}`, { method: "DELETE" });
    loadContacts();
  };

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} contact${selected.size > 1 ? "s" : ""}? Cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`${API}/sms/contacts`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected] }) });
    setSelected(new Set()); setDeleting(false); loadContacts();
  };

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith(".csv")) return showToast("Please choose a .csv file", "error");
    setImporting(true); setImportRes(null);
    const form = new FormData(); form.append("file", file);
    const res  = await fetch(`${API}/sms/contacts/import`, { method: "POST", body: form });
    const data = await res.json();
    setImportRes(data); setImporting(false); loadContacts();
  };

  const sendBulk = async () => {
    if (selected.size === 0) return showToast("Select at least one contact", "error");
    if (!bulkMessage.trim()) return showToast("Write a message first", "error");
    if (!confirm(`Send SMS to ${selected.size} contact${selected.size > 1 ? "s" : ""}?`)) return;
    setBulkSending(true); setBulkResult(null);
    try {
      const res  = await fetch(`${API}/sms/bulk/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], message: bulkMessage }),
      });
      const data = await res.json();
      if (data.success) { setBulkResult(data); setSelected(new Set()); showToast(`Sent ${data.sent} · Failed ${data.failed}`); }
      else showToast(data.error || "Send failed", "error");
    } catch { showToast("Failed to send", "error"); }
    setBulkSending(false);
  };

  const TABS = [
    { id: "triggers",    label: "Triggers" },
    { id: "bulk",        label: "Bulk SMS" },
    { id: "verify",      label: "Phone Verify", dot: config?.verifyConfigured },
    { id: "logs",        label: "SMS Logs" },
    { id: "credentials", label: "Credentials" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 pb-20">

      {/* ── Template edit modal ── */}
      {editTpl && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0B2D22] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-white">Edit Template</p>
                <p className="text-[11px] text-white/35 font-medium mt-0.5">
                  Use <span className="font-mono text-emerald-400">{"{firstName}"}</span>, <span className="font-mono text-emerald-400">{"{date}"}</span>, <span className="font-mono text-emerald-400">{"{time}"}</span>, <span className="font-mono text-emerald-400">{"{bookingRef}"}</span>, <span className="font-mono text-emerald-400">{"{bizPhone}"}</span>
                </p>
              </div>
              <button onClick={() => setEditTpl(null)} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
            <textarea
              value={editTpl.text}
              onChange={e => setEditTpl(t => ({ ...t, text: e.target.value }))}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
            />
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className={editTpl.text.length > 160 ? "text-amber-400" : "text-white/30"}>
                {editTpl.text.length} chars {editTpl.text.length > 160 ? `(≈${Math.ceil(editTpl.text.length / 153)} SMS)` : ""}
              </span>
              {editTpl.isCustom && (
                <button onClick={() => resetTpl(editTpl.key)} className="flex items-center gap-1 text-white/30 hover:text-rose-400 transition-colors">
                  <RotateCcw size={11} /> Reset to default
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditTpl(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-black text-white/40 hover:text-white transition-colors">Cancel</button>
              <button onClick={saveTpl} disabled={savingTpl} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50">
                {savingTpl ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                {savingTpl ? "Saving…" : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Log detail modal ── */}
      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetailLog(null)}>
          <div className="w-full max-w-lg bg-[#0B2D22] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-white">Message Details</p>
              <button onClick={() => setDetailLog(null)} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                ["To",         detailLog.to],
                ["Trigger",    detailLog.trigger],
                ["Recipient",  detailLog.recipient || "customer"],
                ["Status",     detailLog.status],
                ["Sent",       detailLog.createdAt ? new Date(detailLog.createdAt).toLocaleString("en-GB") : "—"],
                ["Twilio SID", detailLog.twilioSid || "—"],
                ["Cost",       detailLog.cost || "—"],
              ].map(([label, val]) => (
                <div key={label} className="flex gap-3 text-xs">
                  <span className="w-24 shrink-0 font-black text-white/35 uppercase tracking-widest text-[10px] pt-0.5">{label}</span>
                  <span className="font-medium text-white/70 break-all">{val}</span>
                </div>
              ))}
              <div className="flex gap-3 text-xs">
                <span className="w-24 shrink-0 font-black text-white/35 uppercase tracking-widest text-[10px] pt-0.5">Message</span>
                <span className="font-medium text-white/85 leading-relaxed whitespace-pre-wrap">{detailLog.body}</span>
              </div>
              {detailLog.error && (
                <div className="flex gap-3 text-xs">
                  <span className="w-24 shrink-0 font-black text-rose-400/60 uppercase tracking-widest text-[10px] pt-0.5">Error</span>
                  <span className="font-medium text-rose-400 break-all">{detailLog.error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-80 z-50 px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2.5 ${
          toast.type === "error"
            ? "bg-rose-500/90 text-white border border-rose-400/30"
            : "bg-emerald-500/90 text-white border border-emerald-400/30"
        }`}>
          {toast.type === "error" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">SMS Automation</h1>
          <p className="text-xs text-white/40 mt-1">Powered by Twilio · Auto-send messages on booking events</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {config && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black border ${
              config.configured
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                : "bg-amber-500/15 text-amber-400 border-amber-500/25"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.configured ? "bg-emerald-500" : "bg-amber-500"}`} />
              {config.configured ? `Connected · ${config.phoneNumber}` : "Not configured"}
            </div>
          )}
          <button
            onClick={fetchConfig}
            className="w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/9 transition-all"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sent",    val: logStats.sent,    color: "text-emerald-400" },
          { label: "Failed",  val: logStats.failed,  color: "text-rose-400"   },
          { label: "Pending", val: logStats.pending, color: "text-amber-400"  },
        ].map(s => (
          <div key={s.label} className="bg-[#0B2D22] border border-white/7 rounded-2xl px-4 py-3">
            <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-white/35 font-bold mt-0.5 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl overflow-hidden">

        {/* Tab bar */}
        <div className="border-b border-white/6 px-4 sm:px-6 flex gap-0.5 pt-2 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-black border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-white/30 hover:text-white/60"
              }`}
            >
              {t.label}
              {t.dot && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              )}
            </button>
          ))}
        </div>

        {/* ── TRIGGERS ── */}
        {activeTab === "triggers" && (
          <div className="p-5 space-y-4">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {!config?.configured && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                    <AlertCircle size={17} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-amber-400">Twilio not configured</p>
                      <p className="text-xs text-amber-400/70 mt-0.5">
                        Go to the{" "}
                        <button onClick={() => setActiveTab("credentials")} className="underline font-bold text-amber-400">
                          Credentials tab
                        </button>{" "}
                        to add your Account SID, Auth Token and phone number.
                      </p>
                    </div>
                  </div>
                )}

                {/* Customer triggers */}
                <div className="rounded-2xl border border-white/7 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/6 flex items-center gap-3 bg-white/2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                      <User size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Customer Messages</p>
                      <p className="text-[11px] text-white/35 font-medium">Sent to the customer's phone on their booking</p>
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {customerTriggers.map(t => {
                      const meta = TRIGGER_META[t.key] || {};
                      const Icon = meta.icon || MessageSquare;
                      const tplRow = templates.find(tp => tp.key === t.key);
                      return (
                        <div key={t.key} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} border ${meta.border}`}>
                            <Icon size={14} className={meta.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{t.label}</p>
                            <p className="text-[11px] text-white/35 font-medium mt-0.5 truncate">{tplRow?.text || t.description}</p>
                          </div>
                          <button
                            onClick={() => setEditTpl(tplRow ? { ...tplRow } : { key: t.key, text: t.description, isCustom: false })}
                            className="w-7 h-7 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                            title="Edit template"
                          >
                            <Edit3 size={12} />
                          </button>
                          <Toggle
                            enabled={t.enabled}
                            onChange={(val) => toggleTrigger(t.key, val)}
                            disabled={saving[t.key] || !config?.configured}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Worker triggers */}
                <div className="rounded-2xl border border-white/7 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/6 flex items-center gap-3 bg-white/2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/25 flex items-center justify-center shrink-0">
                      <Briefcase size={14} className="text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Worker Messages</p>
                      <p className="text-[11px] text-white/35 font-medium">Sent to the assigned worker's phone number</p>
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {workerTriggers.map(t => {
                      const meta = TRIGGER_META[t.key] || {};
                      const Icon = meta.icon || MessageSquare;
                      const tplRow = templates.find(tp => tp.key === t.key);
                      return (
                        <div key={t.key} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} border ${meta.border}`}>
                            <Icon size={14} className={meta.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{t.label}</p>
                            <p className="text-[11px] text-white/35 font-medium mt-0.5 truncate">{tplRow?.text || t.description}</p>
                          </div>
                          <button
                            onClick={() => setEditTpl(tplRow ? { ...tplRow } : { key: t.key, text: t.description, isCustom: false })}
                            className="w-7 h-7 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                            title="Edit template"
                          >
                            <Edit3 size={12} />
                          </button>
                          <Toggle
                            enabled={t.enabled}
                            onChange={(val) => toggleTrigger(t.key, val)}
                            disabled={saving[t.key] || !config?.configured}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Business phone */}
                <div className="rounded-2xl border border-white/7 p-5">
                  <p className="text-sm font-black text-white mb-1">Business Phone Number</p>
                  <p className="text-[11px] text-white/35 font-medium mb-4">
                    Shown as <span className="font-mono text-emerald-400">{"{bizPhone}"}</span> in SMS templates — your real contact number for customers to call.
                  </p>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        type="tel"
                        value={bizPhoneInput}
                        onChange={e => setBizPhoneInput(e.target.value)}
                        placeholder="e.g. 07700 900000"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <button
                      onClick={saveBizPhone}
                      disabled={savingBizPhone}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
                    >
                      {savingBizPhone ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      {savingBizPhone ? "Saving…" : "Save"}
                    </button>
                  </div>
                  {bizPhone && (
                    <p className="text-[11px] text-emerald-400 font-bold mt-2">Saved: {bizPhone}</p>
                  )}
                </div>

                {/* Test send */}
                <div className="rounded-2xl border border-white/7 p-5">
                  <p className="text-sm font-black text-white mb-1">Send Test SMS</p>
                  <p className="text-[11px] text-white/35 font-medium mb-4">
                    Verify your Twilio setup is working. Use international format e.g. +16293668716
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="tel"
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value)}
                      placeholder="+16293668716"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                    <button
                      onClick={sendTest}
                      disabled={testSending || !config?.configured}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-400 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-500/25"
                    >
                      {testSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      {testSending ? "Sending…" : "Send Test"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BULK SMS / CONTACTS ── */}
        {activeTab === "bulk" && (
          <div className="p-5 space-y-4">
            {!config?.configured && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <AlertCircle size={17} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-amber-400">Twilio not configured</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">
                    Add your credentials in the{" "}
                    <button onClick={() => setActiveTab("credentials")} className="underline font-bold text-amber-400">Credentials tab</button> first.
                  </p>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total", value: contactStats.total ?? 0, color: "text-white" },
                { label: "Active", value: contactStats.active ?? 0, color: "text-emerald-400" },
                { label: "Messaged", value: contactStats.contacted ?? 0, color: "text-sky-400" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-white/7 p-4 text-center">
                  <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Header actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search name or phone…"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-400 transition-colors shadow-sm shadow-emerald-500/25"
              >
                <UserPlus size={13} /> Add Contact
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-black hover:bg-white/10 transition-colors"
              >
                {importing ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                Import CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { handleFile(e.target.files[0]); e.target.value = ""; }} />
              {selected.size > 0 && (
                <button
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-black hover:bg-rose-500/20 transition-colors"
                >
                  <Trash2 size={13} /> Delete {selected.size}
                </button>
              )}
              <button onClick={loadContacts} disabled={contactsLoading} className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors ml-auto">
                <RefreshCw size={13} className={contactsLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Import result */}
            {importRes && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl border ${importRes.imported > 0 ? "bg-emerald-500/10 border-emerald-500/25" : "bg-amber-500/10 border-amber-500/25"}`}>
                <CheckCircle2 size={16} className={importRes.imported > 0 ? "text-emerald-400 shrink-0 mt-0.5" : "text-amber-400 shrink-0 mt-0.5"} />
                <div className="text-xs font-bold">
                  <span className={importRes.imported > 0 ? "text-emerald-400" : "text-amber-400"}>
                    Imported {importRes.imported} · Skipped {importRes.skipped}
                  </span>
                  {importRes.errors?.length > 0 && (
                    <p className="text-white/40 font-medium mt-0.5">{importRes.errors.slice(0, 3).join(" · ")}</p>
                  )}
                </div>
                <button onClick={() => setImportRes(null)} className="ml-auto text-white/30 hover:text-white"><XCircle size={14} /></button>
              </div>
            )}

            {/* Contacts table */}
            <div className="rounded-2xl border border-white/7 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_6rem_3rem] items-center px-4 py-2.5 border-b border-white/6 bg-white/2">
                <button onClick={toggleAll} className="flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  {allSelected ? <CheckSquare size={14} className="text-emerald-400" /> : <Square size={14} />}
                </button>
                {["Name", "Phone", "Notes", "Status", ""].map(h => (
                  <p key={h} className="text-[10px] font-black text-white/30 uppercase tracking-widest">{h}</p>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/[0.04]">
                {contactsLoading ? (
                  <div className="py-16 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users size={28} className="text-white/15 mx-auto mb-3" />
                    <p className="text-sm font-black text-white/25">No contacts yet</p>
                    <p className="text-xs text-white/20 font-medium mt-1">Add a contact or import a CSV file</p>
                  </div>
                ) : contacts.map(c => (
                  <div
                    key={c._id}
                    className={`grid grid-cols-[2rem_1fr_1fr_1fr_6rem_3rem] items-center px-4 py-3 hover:bg-white/3 transition-colors ${selected.has(c._id) ? "bg-emerald-500/5" : ""}`}
                  >
                    <button onClick={() => toggleOne(c._id)} className="flex items-center justify-center text-white/30 hover:text-white transition-colors">
                      {selected.has(c._id) ? <CheckSquare size={14} className="text-emerald-400" /> : <Square size={14} />}
                    </button>
                    <p className="text-xs font-bold text-white truncate pr-2">
                      {[c.firstName, c.lastName].filter(Boolean).join(" ") || <span className="text-white/30 font-medium italic">—</span>}
                    </p>
                    <p className="text-xs text-white/60 font-mono truncate pr-2">{c.normalizedPhone || c.phone}</p>
                    <p className="text-xs text-white/40 font-medium truncate pr-2">{c.notes || "—"}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full w-fit ${
                      c.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {c.contacted ? "Messaged" : c.status}
                    </span>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEditModal(c)} className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white transition-colors">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deleteSingle(c._id)} className="w-7 h-7 rounded-lg hover:bg-rose-500/15 flex items-center justify-center text-white/30 hover:text-rose-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination footer */}
              {contactsTotal > CONTACT_LIMIT && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/6 bg-white/2">
                  <p className="text-[11px] text-white/30 font-medium">
                    {(contactPage - 1) * CONTACT_LIMIT + 1}–{Math.min(contactPage * CONTACT_LIMIT, contactsTotal)} of {contactsTotal}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContactPage(p => Math.max(1, p - 1))}
                      disabled={contactPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-black text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >Prev</button>
                    <button
                      onClick={() => setContactPage(p => p + 1)}
                      disabled={contactPage * CONTACT_LIMIT >= contactsTotal}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-black text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >Next</button>
                  </div>
                </div>
              )}
            </div>

            {/* Compose & send panel */}
            {selected.size > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">
                    Send to <span className="text-emerald-400">{selected.size}</span> contact{selected.size !== 1 ? "s" : ""}
                  </p>
                  <button onClick={() => setSelected(new Set())} className="text-[11px] text-white/30 hover:text-white font-bold transition-colors">Clear selection</button>
                </div>
                <textarea
                  value={bulkMessage}
                  onChange={e => setBulkMessage(e.target.value)}
                  placeholder="Type your SMS message here…"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-[11px] font-bold">
                    <span className={bulkMessage.length > 160 ? "text-amber-400" : "text-white/30"}>{bulkMessage.length} chars</span>
                    {bulkMessage.length > 160 && <span className="text-amber-400">≈ {Math.ceil(bulkMessage.length / 153)} parts/msg</span>}
                  </div>
                  <button
                    onClick={sendBulk}
                    disabled={bulkSending || !bulkMessage.trim() || !config?.configured}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-500/25"
                  >
                    {bulkSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {bulkSending ? "Sending…" : `Send SMS`}
                  </button>
                </div>
              </div>
            )}

            {/* Bulk result */}
            {bulkResult && (
              <div className="rounded-2xl border border-white/7 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">Send Results</p>
                  <button onClick={() => setBulkResult(null)} className="text-white/30 hover:text-white"><XCircle size={14} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-black text-emerald-400 tabular-nums">{bulkResult.sent}</p>
                    <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mt-0.5">Sent</p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-black text-rose-400 tabular-nums">{bulkResult.failed}</p>
                    <p className="text-[10px] font-bold text-rose-400/60 uppercase tracking-widest mt-0.5">Failed</p>
                  </div>
                </div>
                {bulkResult.errors?.length > 0 && (
                  <div className="space-y-1.5">
                    {bulkResult.errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <XCircle size={12} className="text-rose-400 shrink-0 mt-0.5" />
                        <span className="text-rose-400/80 font-medium">{e.phone}: {e.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Add / Edit Contact Modal ── */}
        {addOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141414] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/7">
                <p className="font-black text-white">{editingContact ? "Edit Contact" : "Add Contact"}</p>
                <button onClick={() => { setAddOpen(false); setEditingContact(null); resetAddForm(); }} className="text-white/30 hover:text-white transition-colors">
                  <XCircle size={18} />
                </button>
              </div>
              <form onSubmit={submitAdd} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[["firstName", "First Name"], ["lastName", "Last Name"]].map(([k, label]) => (
                    <div key={k}>
                      <label className="text-[11px] font-black text-white/40 uppercase tracking-widest block mb-1.5">{label}</label>
                      <input
                        type="text"
                        value={addForm[k]}
                        onChange={e => setAddForm(f => ({ ...f, [k]: e.target.value }))}
                        placeholder={label}
                        className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[11px] font-black text-white/40 uppercase tracking-widest block mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 07700 900000 or +447700900000"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-white/40 uppercase tracking-widest block mb-1.5">Notes</label>
                  <input
                    type="text"
                    value={addForm.notes}
                    onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional note"
                    className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                {addErr && <p className="text-xs text-rose-400 font-bold">{addErr}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setAddOpen(false); setEditingContact(null); resetAddForm(); }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-black hover:bg-white/5 transition-colors"
                  >Cancel</button>
                  <button
                    type="submit"
                    disabled={addSaving}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addSaving ? <RefreshCw size={13} className="animate-spin" /> : null}
                    {addSaving ? "Saving…" : editingContact ? "Save Changes" : "Add Contact"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── LOGS ── */}
        {activeTab === "logs" && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/7">
                {["all", "sent", "failed", "pending"].map(f => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      logFilter === f ? "bg-emerald-500 text-white" : "text-white/35 hover:text-white/60"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/40 hover:text-white hover:bg-white/9 transition-colors"
              >
                <RefreshCw size={12} className={logsLoading ? "animate-spin" : ""} /> Refresh
              </button>
              <button
                onClick={clearLogs}
                disabled={clearingLogs || logs.length === 0}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-40"
              >
                <Trash2 size={12} /> Clear All
              </button>
            </div>

            <div className="rounded-2xl border border-white/7 overflow-hidden">
              {logsLoading ? (
                <div className="py-16 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageSquare size={28} className="text-white/15 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white/40">No SMS logs yet</p>
                  <p className="text-xs text-white/25 mt-1">Messages will appear here once triggered</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_140px_100px_90px_90px] text-[10px] font-black text-white/35 uppercase tracking-widest px-5 py-3 border-b border-white/6 bg-white/2">
                    <span>Message</span><span>Trigger</span><span>Recipient</span><span>Status</span><span>Sent</span>
                  </div>
                  <div className="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto">
                    {logs.map(log => (
                      <div key={log._id} onClick={() => setDetailLog(log)} className="grid grid-cols-[1fr_140px_100px_90px_90px] items-start px-5 py-3 hover:bg-white/2 transition-colors cursor-pointer">
                        <div className="min-w-0 pr-4">
                          <p className="text-xs font-bold text-white truncate">{log.to}</p>
                          <p className="text-[11px] text-white/35 font-medium truncate mt-0.5">{log.body}</p>
                          {log.status === "failed" && log.error && (
                            <p className="text-[10px] text-rose-400/80 font-medium mt-1 break-words whitespace-pre-wrap">⚠ {log.error}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-white/40 bg-white/8 px-2 py-0.5 rounded-full">
                            {log.trigger}
                          </span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.recipient === "worker"
                              ? "bg-teal-500/15 text-teal-400"
                              : "bg-blue-500/15 text-blue-400"
                          }`}>
                            {RECIPIENT_LABEL[log.recipient] || log.recipient}
                          </span>
                        </div>
                        <div><StatusBadge status={log.status} /></div>
                        <div className="text-[10px] font-medium text-white/35">{fmtDate(log.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── PHONE VERIFY ── */}
        {activeTab === "verify" && (
          <div className="p-5 space-y-4 max-w-xl">

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/25">
              <span className="text-lg leading-none mt-0.5">🔐</span>
              <div>
                <p className="text-sm font-black text-violet-300">Twilio Verify — Phone Testing</p>
                <p className="text-xs text-violet-400/70 font-medium mt-0.5">
                  Send a one-time code to any number and confirm it arrived. Use this to test your Verify service before going live.
                </p>
              </div>
            </div>

            {!config?.verifyConfigured && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <AlertCircle size={17} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-amber-400">Verify Service not configured</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">
                    Add your Verify Service SID in the{" "}
                    <button onClick={() => setActiveTab("credentials")} className="underline font-bold text-amber-400">
                      Credentials tab
                    </button>.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/7 p-5 space-y-5">
              {/* Step 1 */}
              <div>
                <p className="text-[10px] font-black text-white/35 uppercase tracking-widest mb-3">Step 1 — Enter phone number</p>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={verifyPhone}
                    onChange={e => { setVerifyPhone(e.target.value); setVerifySent(false); setVerifyResult(null); setVerifyCode(""); }}
                    placeholder="+16293668716"
                    disabled={!config?.verifyConfigured}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all disabled:opacity-40"
                  />
                  <button
                    onClick={sendVerification}
                    disabled={verifySending || !config?.verifyConfigured || !verifyPhone.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-black hover:bg-violet-400 transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm shadow-violet-500/25"
                  >
                    {verifySending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {verifySending ? "Sending…" : verifySent ? "Resend" : "Send Code"}
                  </button>
                </div>
                <p className="text-[11px] text-white/25 mt-1.5">International format · Code expires in 10 minutes</p>
              </div>

              {/* Step 2 */}
              {verifySent && (
                <div className="pt-4 border-t border-white/6 space-y-4">
                  <p className="text-[10px] font-black text-white/35 uppercase tracking-widest">Step 2 — Enter the code you received</p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verifyCode}
                      onChange={e => { setVerifyCode(e.target.value.replace(/\D/g, "")); setVerifyResult(null); }}
                      placeholder="123456"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-black font-mono tracking-[0.25em] text-center text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                    <button
                      onClick={checkVerification}
                      disabled={verifyChecking || verifyCode.length < 6}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-400 transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm shadow-emerald-500/25"
                    >
                      {verifyChecking ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      {verifyChecking ? "Checking…" : "Verify"}
                    </button>
                  </div>

                  {verifyResult === "approved" && (
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-black text-emerald-400">Verified!</p>
                        <p className="text-xs text-emerald-400/70 font-medium mt-0.5">Code matched. Your Verify service is working correctly.</p>
                      </div>
                    </div>
                  )}
                  {verifyResult === "failed" && (
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl">
                      <XCircle size={18} className="text-rose-400 shrink-0" />
                      <div>
                        <p className="text-sm font-black text-rose-400">Incorrect code</p>
                        <p className="text-xs text-rose-400/70 font-medium mt-0.5">Double-check the SMS and try again.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-white/7 p-5 bg-white/2">
              <p className="text-xs font-black text-white/50 mb-3 uppercase tracking-widest">How it works</p>
              <div className="space-y-2.5">
                {[
                  ["Send",     "Twilio sends a 6-digit OTP to the number via SMS."],
                  ["Check",    "You enter the code back — Twilio confirms approved or failed."],
                  ["Use case", "Verify a customer or worker's number is real before sending automations."],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-3 text-xs">
                    <span className="font-black text-white/50 w-16 shrink-0">{title}</span>
                    <span className="text-white/30 font-medium leading-relaxed">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CREDENTIALS ── */}
        {activeTab === "credentials" && (
          <div className="p-5 space-y-4 max-w-xl">

            <div className="rounded-2xl border border-white/7 p-6 space-y-5">
              <div>
                <p className="text-sm font-black text-white mb-1">Twilio Credentials</p>
                <p className="text-xs text-white/35 font-medium">
                  Find these at <span className="font-bold text-white/60">console.twilio.com</span>. Stored securely in your database, never exposed to the frontend.
                </p>
              </div>

              {config?.configured && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs font-bold text-emerald-400">
                  <CheckCircle2 size={14} />
                  Twilio is configured. Enter new values below to update.
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1.5">Account SID</label>
                  <input
                    type="text"
                    value={creds.accountSid}
                    onChange={e => setCreds(c => ({ ...c, accountSid: e.target.value }))}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1.5">Auth Token</label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={creds.authToken}
                      onChange={e => setCreds(c => ({ ...c, authToken: e.target.value }))}
                      placeholder="Your Twilio auth token"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                    />
                    <button
                      onClick={() => setShowToken(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1.5">Twilio Phone Number</label>
                  <input
                    type="tel"
                    value={creds.phoneNumber}
                    onChange={e => setCreds(c => ({ ...c, phoneNumber: e.target.value }))}
                    placeholder="+16293668716"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <p className="text-[11px] text-white/25 mt-1.5">International format e.g. +16293668716</p>
                </div>

                <div className="pt-3 border-t border-white/7">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1.5">
                    Verify Service SID
                    <span className="ml-2 text-[9px] font-bold bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full normal-case tracking-normal border border-violet-500/25">Phone Verification</span>
                  </label>
                  <input
                    type="text"
                    value={creds.verifySid}
                    onChange={e => setCreds(c => ({ ...c, verifySid: e.target.value }))}
                    placeholder="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all font-mono"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[11px] text-white/25">Twilio Console → Verify → Services</p>
                    {config?.verifyConfigured && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={11} /> {config.verifySidMasked}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={saveCreds}
                disabled={savingCreds || (!creds.accountSid && !creds.authToken && !creds.phoneNumber && !creds.verifySid)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-500/25"
              >
                {savingCreds ? <RefreshCw size={15} className="animate-spin" /> : <Settings size={15} />}
                {savingCreds ? "Saving…" : "Save Credentials"}
              </button>
            </div>

            {/* Pricing note */}
            <div className="rounded-2xl border border-white/7 p-5 bg-white/2">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Estimated Cost</p>
              <div className="space-y-2">
                {[
                  ["US number rental",                "~$1–2 / month"],
                  ["Outbound SMS to US/UK",            "~$0.01–0.05 / msg"],
                  ["50 bookings/month (~2 SMS each)",  "~$1–5 / month"],
                  ["200 bookings/month (~2 SMS each)", "~$4–20 / month"],
                ].map(([label, cost]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-white/35 font-medium">{label}</span>
                    <span className="font-bold text-white/60">{cost}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/25 mt-3">Trial accounts start with ~$15 credit — enough to test hundreds of messages.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
