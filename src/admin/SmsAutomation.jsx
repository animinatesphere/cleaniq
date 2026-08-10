import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Settings, Send, CheckCircle2, XCircle,
  Clock, RefreshCw, Trash2, User, Briefcase, AlertCircle,
  Eye, EyeOff, Search, Users,
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

  // Bulk SMS state
  const [bulkContacts, setBulkContacts]       = useState([]);
  const [bulkLoading, setBulkLoading]         = useState(false);
  const [bulkSearch, setBulkSearch]           = useState("");
  const [bulkSelected, setBulkSelected]       = useState(new Set());
  const [bulkMessage, setBulkMessage]         = useState("");
  const [bulkSending, setBulkSending]         = useState(false);
  const [bulkResult, setBulkResult]           = useState(null);

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

  const fetchBulkContacts = useCallback(async () => {
    setBulkLoading(true);
    try {
      const res  = await fetch(`${API}/sms/bulk/contacts`);
      const data = await res.json();
      setBulkContacts(data.contacts || []);
    } catch {
      showToast("Failed to load contacts", "error");
    } finally {
      setBulkLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "bulk") fetchBulkContacts();
  }, [activeTab, fetchBulkContacts]);

  const bulkToggle = (phone) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone); else next.add(phone);
      return next;
    });
  };

  const bulkSelectAll = () => {
    const filtered = bulkContacts.filter(c =>
      !bulkSearch || c.name.toLowerCase().includes(bulkSearch.toLowerCase()) || c.phone.includes(bulkSearch)
    );
    setBulkSelected(prev => {
      const allSelected = filtered.every(c => prev.has(c.phone));
      const next = new Set(prev);
      if (allSelected) filtered.forEach(c => next.delete(c.phone));
      else filtered.forEach(c => next.add(c.phone));
      return next;
    });
  };

  const sendBulk = async () => {
    if (bulkSelected.size === 0) return showToast("Select at least one contact", "error");
    if (!bulkMessage.trim()) return showToast("Write a message first", "error");
    if (!confirm(`Send SMS to ${bulkSelected.size} contact${bulkSelected.size > 1 ? "s" : ""}?`)) return;
    setBulkSending(true);
    setBulkResult(null);
    try {
      const contacts = bulkContacts.filter(c => bulkSelected.has(c.phone));
      const res  = await fetch(`${API}/sms/bulk/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts, message: bulkMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkResult(data);
        setBulkSelected(new Set());
        showToast(`Sent ${data.sent}, Failed ${data.failed}`);
      } else {
        showToast(data.error || "Send failed", "error");
      }
    } catch {
      showToast("Failed to send bulk SMS", "error");
    } finally {
      setBulkSending(false);
    }
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
                      return (
                        <div key={t.key} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} border ${meta.border}`}>
                            <Icon size={14} className={meta.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{t.label}</p>
                            <p className="text-[11px] text-white/35 font-medium mt-0.5">{t.description}</p>
                          </div>
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
                      return (
                        <div key={t.key} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} border ${meta.border}`}>
                            <Icon size={14} className={meta.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{t.label}</p>
                            <p className="text-[11px] text-white/35 font-medium mt-0.5">{t.description}</p>
                          </div>
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

        {/* ── BULK SMS ── */}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left — contacts */}
              <div className="rounded-2xl border border-white/7 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/6 bg-white/2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-white/40" />
                    <p className="text-sm font-black text-white">Contacts</p>
                    <span className="text-[10px] font-bold text-white/30 bg-white/8 px-2 py-0.5 rounded-full">
                      {bulkSelected.size} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchBulkContacts}
                      disabled={bulkLoading}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                    >
                      <RefreshCw size={12} className={bulkLoading ? "animate-spin" : ""} />
                    </button>
                    <button
                      onClick={bulkSelectAll}
                      className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {bulkContacts.filter(c => !bulkSearch || c.name.toLowerCase().includes(bulkSearch.toLowerCase()) || c.phone.includes(bulkSearch)).every(c => bulkSelected.has(c.phone))
                        ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="px-4 py-2.5 border-b border-white/6">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      type="text"
                      value={bulkSearch}
                      onChange={e => setBulkSearch(e.target.value)}
                      placeholder="Search by name or number…"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-80 divide-y divide-white/[0.04]">
                  {bulkLoading ? (
                    <div className="py-12 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : bulkContacts.filter(c =>
                    !bulkSearch || c.name.toLowerCase().includes(bulkSearch.toLowerCase()) || c.phone.includes(bulkSearch)
                  ).length === 0 ? (
                    <div className="py-12 text-center">
                      <Users size={24} className="text-white/15 mx-auto mb-2" />
                      <p className="text-xs text-white/30 font-bold">No contacts found</p>
                    </div>
                  ) : (
                    bulkContacts
                      .filter(c => !bulkSearch || c.name.toLowerCase().includes(bulkSearch.toLowerCase()) || c.phone.includes(bulkSearch))
                      .map(c => (
                        <button
                          key={c.phone}
                          onClick={() => bulkToggle(c.phone)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors ${
                            bulkSelected.has(c.phone) ? "bg-emerald-500/8" : ""
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            bulkSelected.has(c.phone)
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-white/20"
                          }`}>
                            {bulkSelected.has(c.phone) && <CheckCircle2 size={10} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{c.name}</p>
                            <p className="text-[11px] text-white/35 font-medium">{c.phone}</p>
                          </div>
                        </button>
                      ))
                  )}
                </div>

                <div className="px-4 py-2.5 border-t border-white/6 bg-white/2">
                  <p className="text-[11px] text-white/30 font-medium">
                    {bulkContacts.length} unique customer{bulkContacts.length !== 1 ? "s" : ""} with phone numbers
                  </p>
                </div>
              </div>

              {/* Right — compose */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/7 p-5 space-y-4">
                  <div>
                    <p className="text-sm font-black text-white mb-1">Compose Message</p>
                    <p className="text-[11px] text-white/35 font-medium">Keep under 160 characters to avoid splitting into multiple SMS</p>
                  </div>
                  <textarea
                    value={bulkMessage}
                    onChange={e => setBulkMessage(e.target.value)}
                    placeholder="Type your message here…"
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-[11px] font-bold">
                      <span className={bulkMessage.length > 160 ? "text-amber-400" : "text-white/30"}>
                        {bulkMessage.length} chars
                      </span>
                      {bulkMessage.length > 160 && (
                        <span className="text-amber-400">
                          ≈ {Math.ceil(bulkMessage.length / 153)} SMS parts
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/25 font-medium">
                      {bulkSelected.size} recipient{bulkSelected.size !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <button
                    onClick={sendBulk}
                    disabled={bulkSending || bulkSelected.size === 0 || !bulkMessage.trim() || !config?.configured}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-500/25"
                  >
                    {bulkSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {bulkSending
                      ? "Sending…"
                      : bulkSelected.size === 0
                        ? "Select contacts to send"
                        : `Send to ${bulkSelected.size} contact${bulkSelected.size !== 1 ? "s" : ""}`}
                  </button>
                </div>

                {bulkResult && (
                  <div className="rounded-2xl border border-white/7 p-5 space-y-3">
                    <p className="text-sm font-black text-white">Send Results</p>
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
                      <div key={log._id} className="grid grid-cols-[1fr_140px_100px_90px_90px] items-start px-5 py-3 hover:bg-white/2 transition-colors">
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
