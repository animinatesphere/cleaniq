import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Settings, Send, CheckCircle2, XCircle,
  Clock, RefreshCw, Trash2, ChevronDown, ChevronUp,
  User, Briefcase, AlertCircle, Eye, EyeOff,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const TRIGGER_META = {
  booking_confirmed:    { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  worker_assigned:      { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: Briefcase   },
  booking_reminder_24h: { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock       },
  booking_completed:    { color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200",  icon: CheckCircle2 },
  booking_cancelled:    { color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200",    icon: XCircle     },
  worker_job_assigned:  { color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200",    icon: Briefcase   },
};

const RECIPIENT_LABEL = { customer: "Customer", worker: "Worker" };

function StatusBadge({ status }) {
  const map = {
    sent:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed:  "bg-rose-50 text-rose-700 border-rose-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
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
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-primary" : "bg-slate-200"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SmsAutomation() {
  const [config, setConfig]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState({});
  const [logs, setLogs]             = useState([]);
  const [logStats, setLogStats]     = useState({ sent: 0, failed: 0, pending: 0 });
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter]   = useState("all");
  const [toast, setToast]           = useState(null);
  const [showCreds, setShowCreds]   = useState(false);
  const [showToken, setShowToken]   = useState(false);
  const [testPhone, setTestPhone]   = useState("");
  const [testSending, setTestSending] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [creds, setCreds] = useState({ accountSid: "", authToken: "", phoneNumber: "", verifySid: "" });
  const [savingCreds, setSavingCreds] = useState(false);
  const [activeTab, setActiveTab]   = useState("triggers"); // "triggers" | "logs" | "credentials" | "verify"

  // Twilio Verify state
  const [verifyPhone, setVerifyPhone]   = useState("");
  const [verifyCode, setVerifyCode]     = useState("");
  const [verifySent, setVerifySent]     = useState(false);
  const [verifySending, setVerifySending] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // "approved" | "failed" | null

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API}/sms/config`);
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
      const res = await fetch(`${API}/sms/logs?${params}`);
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
      setConfig(c => ({
        ...c,
        triggers: c.triggers.map(t => t.key === key ? { ...t, enabled } : t),
      }));
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
      const res = await fetch(`${API}/sms/verify/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: verifyPhone.trim(), channel: "sms" }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifySent(true);
        showToast(`Verification code sent to ${verifyPhone}`);
      } else {
        showToast(data.error || "Failed to send code", "error");
      }
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
      const res = await fetch(`${API}/sms/verify/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: verifyPhone.trim(), code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyResult("approved");
        showToast("Phone number verified successfully!", "success");
      } else {
        setVerifyResult("failed");
        showToast(data.error || "Incorrect code", "error");
      }
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
      const res = await fetch(`${API}/sms/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testPhone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Test SMS sent! SID: ${data.sid?.slice(-8)}`);
        setTestPhone("");
      } else {
        showToast(data.error || "Failed to send test", "error");
      }
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

  const fmtDate = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  const customerTriggers = config?.triggers?.filter(t => t.recipient === "customer") || [];
  const workerTriggers   = config?.triggers?.filter(t => t.recipient === "worker")   || [];

  return (
    <div className="space-y-6 pb-20">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold text-white flex items-center gap-2.5 animate-in slide-in-from-right duration-300 ${
          toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"
        }`}>
          {toast.type === "error" ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SMS Automation</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Powered by Twilio · Auto-send messages on booking events
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black border ${
              config.configured
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.configured ? "bg-emerald-500" : "bg-amber-500"}`} />
              {config.configured ? `Connected · ${config.phoneNumber}` : "Not configured"}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-2xl font-black text-slate-900 tabular-nums">{logStats.sent}</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Sent</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-2xl font-black text-rose-600 tabular-nums">{logStats.failed}</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Failed</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-2xl font-black text-amber-600 tabular-nums">{logStats.pending}</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Pending</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {[
          ["triggers",    "Triggers"],
          ["verify",      "Phone Verify"],
          ["logs",        "SMS Logs"],
          ["credentials", "Credentials"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
            {id === "verify" && config?.verifyConfigured && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>
        ))}
      </div>

      {/* ── TRIGGERS TAB ─────────────────────────────────────────────── */}
      {activeTab === "triggers" && (
        <div className="space-y-5">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <RefreshCw size={20} className="animate-spin text-slate-300 mx-auto" />
            </div>
          ) : (
            <>
              {!config?.configured && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-amber-800">Twilio not configured</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Go to the <button onClick={() => setActiveTab("credentials")} className="underline font-bold">Credentials tab</button> to enter your Twilio Account SID, Auth Token and phone number before enabling triggers.
                    </p>
                  </div>
                </div>
              )}

              {/* Customer triggers */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Customer Messages</p>
                    <p className="text-xs text-slate-400 font-medium">Sent to the customer's phone number on their booking</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {customerTriggers.map(t => {
                    const meta = TRIGGER_META[t.key] || {};
                    const Icon = meta.icon || MessageSquare;
                    return (
                      <div key={t.key} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg || "bg-slate-50"} ${meta.border ? `border ${meta.border}` : ""}`}>
                          <Icon size={14} className={meta.color || "text-slate-500"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{t.label}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{t.description}</p>
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
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Briefcase size={14} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Worker Messages</p>
                    <p className="text-xs text-slate-400 font-medium">Sent to the assigned worker's phone number</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {workerTriggers.map(t => {
                    const meta = TRIGGER_META[t.key] || {};
                    const Icon = meta.icon || MessageSquare;
                    return (
                      <div key={t.key} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg || "bg-slate-50"} ${meta.border ? `border ${meta.border}` : ""}`}>
                          <Icon size={14} className={meta.color || "text-slate-500"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{t.label}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{t.description}</p>
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
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-sm font-black text-slate-800 mb-1">Send Test SMS</p>
                <p className="text-xs text-slate-400 font-medium mb-4">
                  Sends a quick test to verify your Twilio setup is working. Use international format e.g. +447911123456
                </p>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="+447911123456"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    onClick={sendTest}
                    disabled={testSending || !config?.configured}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary-dark transition-colors disabled:opacity-50"
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

      {/* ── LOGS TAB ──────────────────────────────────────────────────── */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {["all", "sent", "failed", "pending"].map(f => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    logFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
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
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={12} className={logsLoading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={clearLogs}
              disabled={clearingLogs || logs.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
            >
              <Trash2 size={12} /> Clear All
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {logsLoading ? (
              <div className="p-12 text-center">
                <RefreshCw size={20} className="animate-spin text-slate-300 mx-auto" />
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare size={28} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">No SMS logs yet</p>
                <p className="text-xs text-slate-300 mt-1">Messages will appear here once triggered</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_140px_100px_90px_90px] text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <span>Message</span>
                  <span>Trigger</span>
                  <span>Recipient</span>
                  <span>Status</span>
                  <span>Sent</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
                  {logs.map(log => (
                    <div key={log._id} className="grid grid-cols-[1fr_140px_100px_90px_90px] items-center px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <div className="min-w-0 pr-4">
                        <p className="text-xs font-bold text-slate-700 truncate">{log.to}</p>
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{log.body}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {log.trigger}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.recipient === "worker"
                            ? "bg-teal-50 text-teal-700"
                            : "bg-blue-50 text-blue-700"
                        }`}>
                          {RECIPIENT_LABEL[log.recipient] || log.recipient}
                        </span>
                      </div>
                      <div><StatusBadge status={log.status} /></div>
                      <div className="text-[10px] font-medium text-slate-400">{fmtDate(log.createdAt)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── PHONE VERIFY TAB ─────────────────────────────────────────── */}
      {activeTab === "verify" && (
        <div className="space-y-5 max-w-xl">

          {/* Info banner */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">🔐</span>
            <div>
              <p className="text-sm font-black text-violet-800">Twilio Verify — Phone Number Testing</p>
              <p className="text-xs text-violet-600 font-medium mt-0.5">
                Enter any phone number, send a one-time code, then verify it arrived. Use this to confirm your Verify service is working before relying on it in production.
              </p>
            </div>
          </div>

          {!config?.verifyConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-amber-800">Verify Service not configured</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Go to the{" "}
                  <button onClick={() => setActiveTab("credentials")} className="underline font-bold">
                    Credentials tab
                  </button>{" "}
                  and enter your Verify Service SID (starts with VA...) to use this feature.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">

            {/* Step 1 — Phone number */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Step 1 — Enter phone number</p>
              <div className="flex gap-3">
                <input
                  type="tel"
                  value={verifyPhone}
                  onChange={e => { setVerifyPhone(e.target.value); setVerifySent(false); setVerifyResult(null); setVerifyCode(""); }}
                  placeholder="+447911123456"
                  disabled={!config?.verifyConfigured}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 disabled:opacity-50"
                />
                <button
                  onClick={sendVerification}
                  disabled={verifySending || !config?.verifyConfigured || !verifyPhone.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-black hover:bg-violet-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {verifySending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {verifySending ? "Sending…" : verifySent ? "Resend Code" : "Send Code"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Use international format e.g. +447911123456 · The code expires in 10 minutes</p>
            </div>

            {/* Step 2 — Enter code (shown once sent) */}
            {verifySent && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Step 2 — Enter the code you received</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCode}
                    onChange={e => { setVerifyCode(e.target.value.replace(/\D/g, "")); setVerifyResult(null); }}
                    placeholder="123456"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-black font-mono tracking-[0.25em] text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  />
                  <button
                    onClick={checkVerification}
                    disabled={verifyChecking || verifyCode.length < 6}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {verifyChecking ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {verifyChecking ? "Checking…" : "Verify Code"}
                  </button>
                </div>

                {/* Result */}
                {verifyResult === "approved" && (
                  <div className="mt-4 flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-black text-emerald-800">Verified!</p>
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">The code matched. Your Twilio Verify service is working correctly.</p>
                    </div>
                  </div>
                )}
                {verifyResult === "failed" && (
                  <div className="mt-4 flex items-center gap-3 px-4 py-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                    <XCircle size={18} className="text-rose-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-black text-rose-800">Incorrect code</p>
                      <p className="text-xs text-rose-600 font-medium mt-0.5">The code didn't match — double-check the SMS and try again.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-black text-slate-700 mb-3">How Twilio Verify works</p>
            <div className="space-y-2.5">
              {[
                ["Send", "Twilio sends a 6-digit OTP to the phone via SMS (or voice/WhatsApp)."],
                ["Check", "You submit the code back to Twilio — it tells you approved or failed."],
                ["Use case", "Confirm a customer or worker's number is real before sending automations."],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3 text-xs">
                  <span className="font-black text-slate-600 w-16 shrink-0">{title}</span>
                  <span className="text-slate-500 font-medium">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CREDENTIALS TAB ───────────────────────────────────────────── */}
      {activeTab === "credentials" && (
        <div className="space-y-5 max-w-xl">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <p className="text-sm font-black text-slate-800 mb-1">Twilio Credentials</p>
              <p className="text-xs text-slate-400 font-medium">
                Find these at <span className="font-bold text-slate-600">console.twilio.com</span>. Credentials are stored securely in your database and never exposed to the frontend.
              </p>
            </div>

            {config?.configured && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
                <CheckCircle2 size={14} />
                Twilio is configured. Enter new values below to update.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">Account SID</label>
                <input
                  type="text"
                  value={creds.accountSid}
                  onChange={e => setCreds(c => ({ ...c, accountSid: e.target.value }))}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">Auth Token</label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={creds.authToken}
                    onChange={e => setCreds(c => ({ ...c, authToken: e.target.value }))}
                    placeholder="Your Twilio auth token"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  />
                  <button
                    onClick={() => setShowToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">Twilio Phone Number</label>
                <input
                  type="tel"
                  value={creds.phoneNumber}
                  onChange={e => setCreds(c => ({ ...c, phoneNumber: e.target.value }))}
                  placeholder="+441234567890"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">Must be a Twilio number in international format e.g. +441234567890</p>
              </div>

              {/* Verify Service SID */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  Verify Service SID
                  <span className="ml-2 text-[9px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full normal-case tracking-normal">Phone Verification</span>
                </label>
                <input
                  type="text"
                  value={creds.verifySid}
                  onChange={e => setCreds(c => ({ ...c, verifySid: e.target.value }))}
                  placeholder="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 font-mono"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px] text-slate-400">Found in Twilio Console → Verify → Services</p>
                  {config?.verifyConfigured && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={11} /> {config.verifySidMasked}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={saveCreds}
              disabled={savingCreds || (!creds.accountSid && !creds.authToken && !creds.phoneNumber && !creds.verifySid)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-black text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {savingCreds ? <RefreshCw size={15} className="animate-spin" /> : <Settings size={15} />}
              {savingCreds ? "Saving…" : "Save Credentials"}
            </button>
          </div>

          {/* Pricing note */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-black text-slate-700 mb-2">Estimated Cost (UK)</p>
            <div className="space-y-1.5">
              {[
                ["UK local number rental", "~£1–2 / month"],
                ["Outbound SMS to UK", "~£0.04 / message"],
                ["50 bookings/month (~2 SMS each)", "~£4–6 / month"],
                ["200 bookings/month (~2 SMS each)", "~£16–20 / month"],
              ].map(([label, cost]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">{label}</span>
                  <span className="font-bold text-slate-700">{cost}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Twilio offers ~$15 free trial credit — enough to test hundreds of messages.</p>
          </div>
        </div>
      )}
    </div>
  );
}
